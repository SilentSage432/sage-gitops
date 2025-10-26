# SAGE Enterprise UI Deployment

This directory contains the Kubernetes manifests for deploying the SAGE Enterprise UI with Tailscale integration.

## Prerequisites

1. **Tailscale OAuth Credentials**: Update the values in `../tailscale/secret-oauth.yaml`:
   - `TS_OAUTH_CLIENT_ID`: Your Tailscale OAuth client ID
   - `TS_OAUTH_CLIENT_SECRET`: Your Tailscale OAuth client secret  
   - `TS_TAILNET`: Your Tailscale tailnet (e.g., "silentsage432.github")

2. **Container Image**: Update the image reference in `sage-enterprise-ui.yaml` to your actual image:
   ```yaml
   image: ghcr.io/silentsage432/sage-enterprise-ui:latest
   ```

## Quick Deployment

Run the deployment script:
```bash
./scripts/deploy-sage-ui.sh
```

## Manual Deployment

### 1. Deploy Tailscale Operator
```bash
kubectl apply -f ../tailscale/secret-oauth.yaml
kubectl apply -f ../tailscale/operator.yaml
kubectl -n tailscale rollout status deploy/tailscale-operator --timeout=300s
```

### 2. Deploy SAGE Enterprise UI
```bash
kubectl apply -f namespace.yaml
kubectl apply -f sage-enterprise-ui.yaml
kubectl -n arc-ui rollout status deploy/sage-enterprise-ui --timeout=300s
```

### 3. Apply NetworkPolicies
```bash
kubectl apply -f netpol-ui.yaml
```

## Verification

Check deployment status:
```bash
# Pod + Service
kubectl -n arc-ui get pods -l app=sage-enterprise-ui -o wide
kubectl -n arc-ui get svc sage-enterprise-ui -o wide

# Test connectivity
kubectl -n arc-ui run curl --rm -it --image=curlimages/curl --restart=Never -- \
  curl -sS http://sage-enterprise-ui.arc-ui.svc.cluster.local:8080/ | head

# Tailscale proxies
kubectl -n tailscale get pods -o wide
```

## Access

Once deployed, access your SAGE Enterprise UI via Tailscale:
- **URL**: `http://sage-ui-<your-tailnet>.ts.net:8080`
- **Internal**: `http://sage-enterprise-ui.arc-ui.svc.cluster.local:8080`

## Configuration

### Health Probes
The deployment includes proper readiness and liveness probes:
- **Readiness**: GET `/` on port 80, 5s initial delay, 10s period
- **Liveness**: GET `/` on port 80, 20s initial delay, 20s period

### NetworkPolicies
- **Egress**: Allows DNS resolution and all other outbound traffic
- **Ingress**: Allows all inbound traffic (can be tightened later)

### Service Configuration
- **External Port**: 8080 (accessible via Tailscale)
- **Internal Port**: 80 (container port)
- **Tailscale Hostname**: `sage-ui`

## Updating the Image

When you have a new image version:
```bash
kubectl -n arc-ui set image deploy/sage-enterprise-ui ui=ghcr.io/silentsage432/sage-enterprise-ui:<tag>
kubectl -n arc-ui rollout status deploy/sage-enterprise-ui --timeout=300s
```

## Troubleshooting

### Common Issues

1. **Readiness probe failing**: Check if your UI serves on port 80 and responds to GET `/`
2. **Tailscale not accessible**: Verify the operator is running and OAuth credentials are correct
3. **DNS resolution issues**: Check NetworkPolicies allow DNS traffic

### Debug Commands

```bash
# Check pod logs
kubectl -n arc-ui logs -l app=sage-enterprise-ui

# Check service endpoints
kubectl -n arc-ui get endpoints sage-enterprise-ui

# Check NetworkPolicies
kubectl -n arc-ui get netpol

# Check Tailscale operator logs
kubectl -n tailscale logs -l app=tailscale-operator
```
