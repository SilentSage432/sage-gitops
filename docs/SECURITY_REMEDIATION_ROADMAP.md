# 🔐 SAGE Federation Security Remediation Roadmap

**Status:** Post-Assessment Action Plan  
**Target:** Production-Ready Security Posture  
**Last Updated:** 2025-01-XX

---

## 📊 Executive Summary

This roadmap addresses critical and medium-priority security vulnerabilities identified in the SAGE Federation codebase. Implementation should follow this priority order:

1. **Phase 1 (Critical)**: Secrets encryption and API authentication
2. **Phase 2 (High)**: Network policy hardening
3. **Phase 3 (Medium)**: Runtime security and monitoring
4. **Phase 4 (Enhancement)**: Advanced protections

**Estimated Time:** Phase 1-2: 1-2 weeks | Phase 3-4: 2-4 weeks

---

## 🚨 Phase 1: Critical Vulnerabilities (Priority: IMMEDIATE)

### 1.1 Encrypt All NATS Credentials

**Current Issue:**
- Plaintext passwords in `kubernetes/arc-chi/nats-config.yaml`
- Plaintext tokens in `infra/nats-secret.yaml`
- NATS URLs with embedded passwords in deployments

**Actions:**

1. **Migrate Chi NATS Config to SOPS-Encrypted Secret**
   - Create `secrets/nats-chi-config.enc.yaml`
   - Encrypt NATS server config with user credentials
   - Update Chi deployment to mount encrypted secret
   - Remove plaintext from `kubernetes/arc-chi/nats-config.yaml`

2. **Encrypt Infra NATS Secret**
   - Encrypt `infra/nats-secret.yaml` → `secrets/nats-infra-token.enc.yaml`
   - Update references to use encrypted secret

3. **Refactor NATS Connection Strings**
   - **Files to update:**
     - `kubernetes/arc-sigma/deploy-sigma-agent.yaml` (line 47)
     - `kubernetes/arc-lambda/deploy-lambda-cell.yaml` (line 47)
   - Remove embedded passwords from `stringData.NATS_URL`
   - Create separate secret refs: `NATS_USER`, `NATS_PASSWORD`, `NATS_HOST`
   - Or switch to token-based auth with separate token secret

4. **Rotate All NATS Credentials**
   - Generate new passwords/tokens after encryption
   - Update all services simultaneously
   - Document old credentials for emergency rollback

**Files to Modify:**
- `kubernetes/arc-chi/nats-config.yaml` → Convert to `secrets/nats-chi-config.enc.yaml`
- `infra/nats-secret.yaml` → Convert to `secrets/nats-infra-token.enc.yaml`
- `kubernetes/arc-sigma/deploy-sigma-agent.yaml`
- `kubernetes/arc-lambda/deploy-lambda-cell.yaml`
- `arcs/zeta/app-configmap.yaml` (if NATS URL is there)

**Validation:**
```bash
# Verify no plaintext credentials in git
grep -r "password\|token\|secret" --include="*.yaml" | grep -v "enc.yaml" | grep -v "\.git"
# Verify SOPS encryption
sops -d secrets/nats-*.enc.yaml
```

---

### 1.2 Add Authentication to Unprotected APIs

**Current Issue:**
Multiple API endpoints have no authentication:
- Omicron: `/archive/write`, `/archive/query` (writes to database!)
- Mu: `/emit` (can relay events)
- Nu: Multiple endpoints
- Zeta: `/ws` WebSocket (exposes NATS streams)

**Actions:**

1. **Implement Rho2 Keeper Token Authentication**
   - Add dependency on Rho2 keeper service (already deployed)
   - Create authentication middleware for FastAPI
   - Validate JWS tokens from Rho2 keepers

2. **Per-Service Implementation Plan:**

   **Omicron (`arcs/omicron/app/main.py`):**
   ```python
   # Add before route handlers:
   from fastapi import Depends, HTTPException, Header
   from .auth import verify_rho2_token
   
   async def require_auth(authorization: str = Header(None)):
       if not authorization or not authorization.startswith("Bearer "):
           raise HTTPException(401, "Missing or invalid authorization")
       token = authorization.split(" ")[1]
       claims = await verify_rho2_token(token)
       return claims
   
   # Protect endpoints:
   @app.post("/archive/write")
   async def archive_write(ev: ArchiveIn, auth: dict = Depends(require_auth)):
       # Existing code...
   ```

   **Mu (`arcs/mu/app/main.py`):**
   - Add same auth middleware
   - Protect `/emit` endpoint

   **Nu (`arcs/nu/app/main.py`):**
   - Protect all non-health endpoints
   - Health endpoint should remain open

   **Zeta (`arcs/zeta/app-configmap.yaml`):**
   - WebSocket auth is tricky; consider:
     - Query parameter token: `?token=...`
     - Or HTTP header before upgrade: check `Authorization` header
   - Validate token before accepting WebSocket connection

3. **Create Shared Auth Module**
   - Create `common/auth.py` or similar
   - Centralize Rho2 token validation logic
   - Reuse across all services

**Files to Modify:**
- `arcs/omicron/app/main.py`
- `arcs/mu/app/main.py`
- `arcs/nu/app/main.py`
- `arcs/zeta/app-configmap.yaml` (or move to Python)
- Create: `arcs/common/auth.py` (or equivalent)

**Validation:**
```bash
# Test unauthenticated requests fail
curl -X POST http://omicron-api/archive/write -H "Content-Type: application/json" -d '{"arc":"test"}'
# Should return 401

# Test authenticated requests succeed
TOKEN=$(curl -X POST http://rho2-api/sign ... | jq -r .token)
curl -X POST http://omicron-api/archive/write -H "Authorization: Bearer $TOKEN" ...
# Should succeed
```

---

### 1.3 Tighten Network Policies

**Current Issue:**
- `kubernetes/arc-ui/netpol-ui.yaml` allows all egress (`egress: - {}`)
- Some ingress policies are too permissive

**Actions:**

1. **Restrict UI Egress (`kubernetes/arc-ui/netpol-ui.yaml`)**
   ```yaml
   egress:
     # DNS
     - to:
         - namespaceSelector:
             matchLabels: { kubernetes.io/metadata.name: kube-system }
           podSelector:
             matchLabels: { k8s-app: kube-dns }
       ports:
         - { protocol: UDP, port: 53 }
         - { protocol: TCP, port: 53 }
     # Specific service dependencies only
     - to:
         - namespaceSelector:
             matchLabels: { kubernetes.io/metadata.name: arc-ui }
         - namespaceSelector:
             matchLabels: { kubernetes.io/metadata.name: infra }  # If needed
       ports:
         - { protocol: TCP, port: 80 }
         - { protocol: TCP, port: 443 }
     # Remove: `- {}` (allow all)
   ```

2. **Audit All Ingress Policies**
   - Review `kubernetes/arc-*/netpol-*.yaml` files
   - Ensure ingress only allows specific sources
   - Remove blanket `- {}` rules where possible

3. **Restrict NATS Monitoring Port (8222)**
   - Add network policy to restrict access to NATS 8222
   - Only allow monitoring tools (Prometheus, Grafana)
   - Or disable monitoring if not needed

**Files to Modify:**
- `kubernetes/arc-ui/netpol-ui.yaml`
- Review all `**/netpol*.yaml` files for permissiveness

**Validation:**
```bash
# Test UI pod can't reach unexpected destinations
kubectl -n arc-ui exec -it <pod> -- wget --spider http://evil.com
# Should fail

# Verify DNS still works
kubectl -n arc-ui exec -it <pod> -- nslookup kubernetes.default
# Should succeed
```

---

## 🔒 Phase 2: High-Priority Hardening

### 2.1 Enforce Read-Only Root Filesystems

**Current Issue:**
Some containers have `readOnlyRootFilesystem: false`

**Actions:**

1. **Find Non-Compliant Containers**
   ```bash
   grep -r "readOnlyRootFilesystem.*false" --include="*.yaml"
   ```

2. **Update Containers:**
   - `arcs/zeta/api-deploy.yaml` (line 45)
   - Any others found

3. **Add EmptyDir Volumes for Writeable Paths**
   - `/tmp` → emptyDir
   - `/var/run` → emptyDir (if needed)
   - Application-specific write paths

4. **Update Kyverno Policy to Enforce**
   - Modify `rho/kyverno-baseline.yaml`
   - Add rule requiring `readOnlyRootFilesystem: true`
   - Change `validationFailureAction` to `Enforce` (after testing)

**Files to Modify:**
- `arcs/zeta/api-deploy.yaml`
- `rho/kyverno-baseline.yaml`
- Any other deployments with `readOnlyRootFilesystem: false`

---

### 2.2 Add Rate Limiting

**Actions:**

1. **Install Rate Limiting Middleware**
   - For FastAPI: `slowapi` or `fastapi-limiter`
   - Or use ingress-level rate limiting (if using ingress controller)

2. **Implement Per-Service:**
   ```python
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   from slowapi.errors import RateLimitExceeded
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
   
   @app.post("/archive/write")
   @limiter.limit("10/minute")
   async def archive_write(...):
       ...
   ```

3. **Configure Limits:**
   - Critical endpoints: 10-30 req/min
   - Health endpoints: 100 req/min
   - Read endpoints: 60 req/min

**Files to Modify:**
- All FastAPI services (`arcs/*/app/main.py`)
- Add dependencies to requirements or Dockerfiles

---

### 2.3 Enable mTLS Between Services

**Actions:**

1. **Enable Cilium mTLS** (if using Cilium CNI)
   - Configure Cilium NetworkPolicy with TLS
   - Or enable Cilium Service Mesh

2. **Alternative: Per-Service TLS**
   - Generate certs per service
   - Use cert-manager for automatic cert management
   - Update service URLs to HTTPS

**Files to Modify:**
- Cilium config (if available)
- Service definitions to use HTTPS

---

## 📊 Phase 3: Monitoring & Detection

### 3.1 Add Runtime Security Monitoring

**Actions:**

1. **Install Falco**
   ```bash
   helm repo add falcosecurity https://falcosecurity.github.io/charts
   helm install falco falcosecurity/falco
   ```

2. **Configure Alert Rules**
   - Container escapes
   - Unauthorized file system access
   - Suspicious network connections

3. **Integrate with Loki/Prometheus**
   - Forward Falco events to observability stack

---

### 3.2 Add Image Vulnerability Scanning

**Actions:**

1. **Install Trivy in CI/CD**
   - Scan images before deployment
   - Block deployment on critical vulnerabilities

2. **Runtime Scanning** (optional)
   - Install Trivy Operator for continuous scanning
   - Alert on new vulnerabilities in running pods

**CI/CD Integration:**
```yaml
- name: Scan Images
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'ghcr.io/silentsage432/myimage:latest'
    format: 'sarif'
    severity: 'CRITICAL,HIGH'
```

---

## 🛡️ Phase 4: Advanced Protections

### 4.1 Web Application Firewall (WAF)

**Actions:**
1. Use Cloudflare WAF (already using Cloudflare Tunnel)
   - Enable WAF rules for SQL injection, XSS
   - Configure rate limiting at edge

2. Or deploy ModSecurity/OWASP CRS in cluster
   - If not using Cloudflare for all traffic

---

### 4.2 Supply Chain Security

**Actions:**
1. **Sign Container Images**
   - Use cosign or similar
   - Verify signatures at deploy time

2. **SBOM Generation**
   - Generate Software Bill of Materials
   - Store in artifact registry

3. **Dependency Scanning**
   - Scan Python dependencies (pip-audit, safety)
   - Scan Node dependencies (npm audit)

---

## ✅ Validation Checklist

After each phase, verify:

- [ ] No plaintext secrets in git
- [ ] All API endpoints require authentication
- [ ] Network policies deny by default
- [ ] Containers run non-root with minimal capabilities
- [ ] Rate limiting active on public endpoints
- [ ] Monitoring alerts configured
- [ ] Security scanning in CI/CD pipeline
- [ ] Documentation updated

---

## 📝 Implementation Notes

### SOPS Encryption Workflow

```bash
# Edit encrypted secret
sops secrets/nats-chi-config.enc.yaml

# Encrypt new file
sops --encrypt --age "$(cat .sops.pubkey)" --in-place secrets/new-secret.enc.yaml

# Decrypt for verification
sops -d secrets/nats-chi-config.enc.yaml
```

### Testing Authentication

```bash
# Get token from Rho2 keeper
TOKEN=$(curl -X POST http://rho2-api/sign \
  -H "Content-Type: application/json" \
  -d '{"sub":"service","aud":"sage-federation","scopes":["archive:write"]}' \
  | jq -r .token)

# Use token
curl -X POST http://omicron-api/archive/write \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"arc":"test","source":"test","payload":{}}'
```

### Network Policy Testing

```bash
# Test egress restrictions
kubectl -n <namespace> exec -it <pod> -- wget --spider http://google.com
# Should fail if policy blocks

# Test allowed connections
kubectl -n <namespace> exec -it <pod> -- nc -zv <allowed-service> <port>
# Should succeed
```

---

## 🎯 Success Criteria

**Phase 1 Complete When:**
- ✅ All NATS credentials encrypted
- ✅ All API endpoints authenticated
- ✅ Network policies restrictive

**Phase 2 Complete When:**
- ✅ Read-only filesystems enforced
- ✅ Rate limiting active
- ✅ mTLS enabled (or in progress)

**Phase 3 Complete When:**
- ✅ Runtime monitoring active
- ✅ Vulnerability scanning in CI/CD

**Phase 4 Complete When:**
- ✅ WAF configured
- ✅ Supply chain security in place

---

## 📚 References

- SOPS Documentation: https://github.com/geteduroam/age-encryption
- Kyverno Policies: https://kyverno.io/policies/
- Cilium Network Policies: https://docs.cilium.io/en/stable/policy/
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- Rho2 Keeper Documentation: See `docs/Rho2-Agent-Collective.md`

---

**Next Steps:**
1. Review this roadmap
2. Prioritize based on current threats
3. Begin Phase 1 implementation
4. Validate with security testing
5. Iterate based on findings

