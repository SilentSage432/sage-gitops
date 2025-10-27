#!/usr/bin/env bash
set -euo pipefail

# --- Config you might tweak ---
HOSTNAME="www.sagecraftalchemy.com"
UI_SVC_DNS="sage-enterprise-ui.arc-ui.svc.cluster.local"
UI_SVC_PORT="8080"

# --- Find where cloudflared runs ---
NS=$(kubectl get deploy -A | awk '/cloudflared/{print $1; exit}')
if [[ -z "${NS:-}" ]]; then
  echo "!! Could not find a cloudflared Deployment in any namespace."
  echo "   Run: kubectl get deploy -A | grep -i cloudflared"
  exit 1
fi
echo "== cloudflared namespace: $NS"

DEPLOY=$(kubectl -n "$NS" get deploy -o name | grep -m1 cloudflared)
if [[ -z "${DEPLOY:-}" ]]; then
  echo "!! No cloudflared Deployment found in $NS"; exit 1
fi
echo "== deployment: $DEPLOY"

# --- Try to locate an existing config mount/arg ---
echo "== checking deployment args/volumes =="
kubectl -n "$NS" get $DEPLOY -o yaml | sed -n '1,200p' >/tmp/cf.yaml
HAS_ARG=$(grep -c -- '--config=' /tmp/cf.yaml || true)
CM_NAME=$(awk '/configMap:/,/mountPath:/{print} /name:/{print}' /tmp/cf.yaml | awk '/configMap:/{f=1} f && /name:/{print $2; f=0}' | head -n1 || true)

if [[ "$HAS_ARG" -gt 0 ]] || [[ -n "${CM_NAME:-}" ]]; then
  MODE="MERGE"
  [[ -z "${CM_NAME:-}" ]] && CM_NAME="cloudflared-config"
else
  MODE="NEW"
  CM_NAME="cloudflared-config-sageui"
fi

echo "== mode: $MODE   configmap: $CM_NAME"

# --- Create/merge ConfigMap with our ingress rule ---
TMP_CM=$(mktemp)
if [[ "$MODE" == "MERGE" ]] && kubectl -n "$NS" get cm "$CM_NAME" >/dev/null 2>&1; then
  kubectl -n "$NS" get cm "$CM_NAME" -o yaml > "$TMP_CM"

  # If no config.yaml data key, flip to NEW mode
  if ! grep -q 'config.yaml:' "$TMP_CM"; then
    MODE="NEW"
  else
    echo "== merging ingress into existing $CM_NAME"
    # Append (or replace) ingress rule at the top; keep last rule as http_status:404
    python3 - <<PY || { echo "Python merge failed"; exit 1; }
import sys, yaml
doc = yaml.safe_load(sys.stdin.read())
cfg = doc.get('data',{}).get('config.yaml','')
if not cfg:
    print('no config.yaml in existing CM', file=sys.stderr); sys.exit(2)
obj = yaml.safe_load(cfg)
ing = obj.get('ingress', [])
# Remove any prior rules for the same hostname
ing = [r for r in ing if r.get('hostname') != "$HOSTNAME"]
# Prepend our rule
ing = [{"hostname":"$HOSTNAME","service":"http://$UI_SVC_DNS:$UI_SVC_PORT"}] + ing
# Ensure final catchall
if not any('service' in r and str(r['service']).startswith('http_status:404') for r in ing):
    ing.append({"service":"http_status:404"})
obj['ingress'] = ing
doc['data']['config.yaml'] = yaml.safe_dump(obj, sort_keys=False)
print(yaml.safe_dump(doc, sort_keys=False))
PY
  fi
fi

if [[ "$MODE" == "NEW" ]]; then
  echo "== creating minimal ConfigMap $CM_NAME with our ingress rule"
  cat > "$TMP_CM" <<YAML
apiVersion: v1
kind: ConfigMap
metadata:
  name: $CM_NAME
  namespace: $NS
data:
  config.yaml: |
    # Set to your existing named tunnel if required:
    # tunnel: <your-named-tunnel-id-or-name>
    metrics: 0.0.0.0:2000
    ingress:
      - hostname: $HOSTNAME
        service: http://$UI_SVC_DNS:$UI_SVC_PORT
      - service: http_status:404
YAML
fi

kubectl apply -f "$TMP_CM"

# --- Ensure deployment uses the config (if not already) ---
if [[ "$MODE" == "NEW" ]]; then
  echo "== patching deployment to mount the new config and pass --config"
  kubectl -n "$NS" patch $DEPLOY --type='json' -p='[
    {"op":"add","path":"/spec/template/spec/volumes/-","value":{"name":"cfg-sageui","configMap":{"name":"'"$CM_NAME"'"}}},
    {"op":"add","path":"/spec/template/spec/containers/0/volumeMounts/-","value":{"name":"cfg-sageui","mountPath":"/etc/cloudflared-sageui","readOnly":true}},
    {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--config=/etc/cloudflared-sageui/config.yaml"}
  ]'
fi

# --- Minimal egress policy so cloudflared can talk out + reach UI service ---
echo "== applying egress NetworkPolicy (DNS + 443 + in-cluster UI) =="
cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cloudflared-egress-sageui
  namespace: $NS
spec:
  podSelector: {}  # or matchLabels: { app: cloudflared }
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: kube-system }
          podSelector:
            matchLabels: { k8s-app: kube-dns }
      ports:
        - { protocol: UDP, port: 53 }
        - { protocol: TCP, port: 53 }
    - ports:
        - { protocol: TCP, port: 443 }   # Cloudflare edge
      to:
        - {}                              # (tighten to CF IPs later if desired)
    - to:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: arc-ui }
      ports:
        - { protocol: TCP, port: $UI_SVC_PORT }
YAML

# --- Restart cloudflared and wait ---
kubectl -n "$NS" rollout restart $DEPLOY
kubectl -n "$NS" rollout status  $DEPLOY --timeout=180s

# --- Sanity from cloudflared pod ---
POD=$(kubectl -n "$NS" get pod -l app=cloudflared -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
[[ -z "$POD" ]] && POD=$(kubectl -n "$NS" get pods -o name | grep -m1 cloudflared | sed 's#pod/##')
echo "== testing in-pod reachability to UI Service =="
kubectl -n "$NS" exec "$POD" -- sh -lc '
  apk add --no-cache curl bind-tools >/dev/null 2>&1 || true
  echo "[dns]"; nslookup '"$UI_SVC_DNS"' || true
  echo "[http]"; curl -sS --max-time 5 http://'"$UI_SVC_DNS"':'"$UI_SVC_PORT"'/ | head -n 5 || true
'

echo
echo "If your tunnel manages DNS, a record for $HOSTNAME should appear automatically."
echo "Otherwise, add a CNAME in Cloudflare:"
echo "  $HOSTNAME  ->  <your-tunnel-uuid>.cfargotunnel.com"
echo
echo "Open: https://$HOSTNAME"
