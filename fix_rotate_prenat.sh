#!/usr/bin/env bash
set -euo pipefail

NS="arc-rho2"
CJ="rho2-rotate"

say(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

say "1) Ensure rotate pods carry a stable label (rho2=rotate) for NetPolicy targeting"
kubectl -n "$NS" get cronjob "$CJ" -o json \
| jq '.spec.jobTemplate.spec.template.metadata.labels += {"rho2":"rotate"}' \
| kubectl apply -f -

say "2) Discover service/endpoint IPs (pre-NAT reality) and DNS IP"
SVC_IP="$(kubectl get svc kubernetes -o jsonpath='{.spec.clusterIP}')"
DNS_IP="$(kubectl -n kube-system get svc kube-dns   -o jsonpath='{.spec.clusterIP}' 2>/dev/null || \
          kubectl -n kube-system get svc coredns    -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo 10.96.0.10)"

# EndpointSlice IPs for default/kubernetes (discovery.k8s.io/v1)
mapfile -t EP_ARR < <(kubectl -n default get endpointslice -l kubernetes.io/service-name=kubernetes \
  -o jsonpath='{range .items[*].endpoints[*]}{.addresses[0]}{"\n"}{end}' 2>/dev/null || true)

# Fallback: classic Endpoints (deprecated but fine as a backup)
if [[ ${#EP_ARR[@]} -eq 0 ]]; then
  mapfile -t EP_ARR < <(kubectl get endpoints kubernetes -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\n"}{end}' 2>/dev/null || true)
fi

# Fallback: node InternalIPs
if [[ ${#EP_ARR[@]} -eq 0 ]]; then
  mapfile -t EP_ARR < <(kubectl get nodes -o jsonpath='{range .items[*].status.addresses[?(@.type=="InternalIP")]}{.address}{"\n"}{end}' 2>/dev/null || true)
fi

echo "SVC_IP=${SVC_IP}"
echo "DNS_IP=${DNS_IP}"
echo "EP_IPS=${EP_ARR[*]:-<none>}"

say "3) Render precise egress NetPolicy (ServiceIP:443, EndpointIP(s):6443, DNS:53)"
TMP_NP="$(mktemp)"
{
  cat <<YAML
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: rho2-rotate-egress-api-dns
  namespace: ${NS}
spec:
  podSelector:
    matchLabels: { rho2: rotate }
  policyTypes: ["Egress"]
  egress:
    - to: [{ ipBlock: { cidr: ${SVC_IP}/32 } }]
      ports: [{ protocol: TCP, port: 443 }]
    - to: [{ ipBlock: { cidr: ${DNS_IP}/32 } }]
      ports:
        - { protocol: UDP, port: 53 }
        - { protocol: TCP, port: 53 }
YAML
  # add each apiserver endpoint on :6443 (pre-NAT)
  for ip in "${EP_ARR[@]}"; do
    [[ -z "$ip" ]] && continue
    cat <<YAML
    - to: [{ ipBlock: { cidr: ${ip}/32 } }]
      ports: [{ protocol: TCP, port: 6443 }]
YAML
  done
} > "$TMP_NP"

kubectl apply -f "$TMP_NP"
rm -f "$TMP_NP"

say "4) Make the CronJob's wrapper honest (no false 'not found' on non-zero exit)"
kubectl -n "$NS" get cronjob "$CJ" -o json \
| jq '
  .spec.jobTemplate.spec.template.spec.securityContext = {runAsNonRoot:true, seccompProfile:{type:"RuntimeDefault"}} |
  (.spec.jobTemplate.spec.template.spec.containers |=
    (map(if .name=="rotator" then
      .env = [{name:"HOME", value:"/tmp"}] |
      .command = ["/bin/sh","-lc",
        "if [ -f /work/rotate.sh ]; then /bin/sh /work/rotate.sh; RC=$?; if [ $RC -ne 0 ]; then echo \"rotation failed (exit $RC)\"; fi; exit $RC; else echo \"rotate.sh not found; listing /work:\"; ls -la /work; exit 1; fi"
      ]
    else . end))
' | kubectl apply -f -

say "5) Clean old jobs, run fresh, wait for pod IP, then tail logs"
for j in $(kubectl -n "$NS" get jobs -o name 2>/dev/null | grep '^job.batch/'"$CJ"'-' || true); do
  kubectl -n "$NS" delete "$j" --ignore-not-found >/dev/null 2>&1 || true
done
JOB="${CJ}-manual-$(date +%s)"
kubectl -n "$NS" create job --from=cronjob/"$CJ" "$JOB" >/dev/null
echo "JOB: $JOB"

# wait for pod & IP (CNI attach)
for i in {1..60}; do
  POD="$(kubectl -n "$NS" get pods -l job-name="$JOB" -l rho2=rotate -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  [[ -n "${POD:-}" ]] || { sleep 1; continue; }
  IP="$(kubectl -n "$NS" get pod "$POD" -o jsonpath='{.status.podIP}' 2>/dev/null || true)"
  PHASE="$(kubectl -n "$NS" get pod "$POD" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
  echo "pod=$POD phase=$PHASE ip=${IP:-<none>}"
  [[ -n "${IP:-}" ]] && break
  sleep 2
done
[[ -z "${POD:-}" ]] && { echo "No pod created"; kubectl -n "$NS" describe job "$JOB"; exit 3; }

say "6) Live logs — expect API reachability now (no i/o timeout)"
kubectl -n "$NS" logs -f "$POD" || true

say "7) Final status"
kubectl -n "$NS" get pods -l job-name="$JOB" -l rho2=rotate -o wide
kubectl -n "$NS" get jobs "$JOB" -o wide
