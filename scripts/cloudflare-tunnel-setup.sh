#!/usr/bin/env bash
set -euo pipefail

echo "=== Cloudflare Tunnel Setup for SAGE UI ==="
echo
echo "Your cloudflared deployment is using a token-based setup, which means"
echo "ingress rules are managed through the Cloudflare dashboard, not local config."
echo
echo "To add www.sagecraftalchemy.com -> SAGE UI:"
echo
echo "1. Go to Cloudflare Dashboard -> Zero Trust -> Tunnels"
echo "2. Find your tunnel and click 'Configure'"
echo "3. Add a new ingress rule:"
echo "   - Hostname: www.sagecraftalchemy.com"
echo "   - Service: http://sage-enterprise-ui.arc-ui.svc.cluster.local:8080"
echo
echo "4. Or use the Cloudflare API:"
echo "   curl -X POST \"https://api.cloudflare.com/client/v4/accounts/\$ACCOUNT_ID/cfd_tunnel/\$TUNNEL_ID/configurations\" \\"
echo "     -H \"Authorization: Bearer \$API_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     --data '{\"config\":{\"ingress\":[{\"hostname\":\"www.sagecraftalchemy.com\",\"service\":\"http://sage-enterprise-ui.arc-ui.svc.cluster.local:8080\"},{\"service\":\"http_status:404\"}]}}'"
echo
echo "=== Network Policy Applied ==="
echo "I've already applied the NetworkPolicy to allow cloudflared to reach the UI service."
echo
echo "=== Testing UI Service ==="
echo "Let's verify the UI service is accessible:"

# Test the UI service directly
kubectl -n arc-ui get svc sage-enterprise-ui
kubectl -n arc-ui get pods -l app=sage-enterprise-ui

echo
echo "=== Next Steps ==="
echo "1. Fix the cloudflared token (it appears to be invalid/expired)"
echo "2. Add the ingress rule via Cloudflare dashboard"
echo "3. Test https://www.sagecraftalchemy.com"
echo
echo "Would you like me to help troubleshoot the cloudflared token issue?"
