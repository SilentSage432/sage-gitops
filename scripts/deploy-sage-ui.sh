#!/bin/bash

# SAGE Enterprise UI Deployment Script
# This script deploys the Tailscale Operator and SAGE Enterprise UI with proper probes and NetworkPolicies

set -e

echo "🚀 Starting SAGE Enterprise UI deployment..."

# 0) Deploy Tailscale Operator (if not running)
echo "📦 Deploying Tailscale Operator..."
kubectl apply -f kubernetes/tailscale/secret-oauth.yaml
kubectl apply -f kubernetes/tailscale/operator.yaml

echo "⏳ Waiting for Tailscale operator to be ready..."
kubectl -n tailscale-operator rollout status deploy/tailscale-operator --timeout=300s

echo "✅ Tailscale operator status:"
kubectl -n tailscale-operator get pods -o wide

# 1) Deploy SAGE Enterprise UI
echo "📦 Deploying SAGE Enterprise UI..."
kubectl apply -f kubernetes/arc-ui/namespace.yaml
kubectl apply -f kubernetes/arc-ui/sage-enterprise-ui.yaml

echo "⏳ Waiting for SAGE Enterprise UI to be ready..."
kubectl -n arc-ui rollout status deploy/sage-enterprise-ui --timeout=300s

# 2) Apply NetworkPolicies
echo "🔒 Applying NetworkPolicies..."
kubectl apply -f kubernetes/arc-ui/netpol-ui.yaml

# 3) Verify deployment
echo "🔍 Verifying deployment..."

echo "📊 Pod + Service status:"
kubectl -n arc-ui get pods -l app=sage-enterprise-ui -o wide
kubectl -n arc-ui get svc sage-enterprise-ui -o wide

echo "🌐 Testing connectivity from inside cluster..."
kubectl -n arc-ui run curl --rm -it --image=curlimages/curl --restart=Never -- \
  curl -sS http://sage-enterprise-ui.arc-ui.svc.cluster.local:8080/ | head

echo "🔗 Tailscale operator proxies:"
kubectl -n tailscale-operator get pods -o wide

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your SAGE Enterprise UI via Tailscale:"
echo "   http://sage-ui-<your-tailnet>.ts.net:8080"
echo ""
echo "📝 To update the UI image when ready:"
echo "   kubectl -n arc-ui set image deploy/sage-enterprise-ui ui=ghcr.io/silentsage432/sage-enterprise-ui:<tag>"
echo "   kubectl -n arc-ui rollout status deploy/sage-enterprise-ui --timeout=300s"
