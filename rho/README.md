# Arc Rho - Security Baseline

Arc Rho provides security baselines and secret management for the SAGE Federation.

## 🛡️ Security Components

### Kyverno Baseline Policies
- **Probe Requirements**: All containers must have health checks
- **Resource Limits**: CPU/memory requests and limits mandatory
- **Security Context**: Non-root execution with dropped capabilities
- **Seccomp**: RuntimeDefault seccomp profile required
- **Network Policies**: Defense in depth for Arc namespaces

### SOPS Secret Management
- **Age Encryption**: Modern, fast encryption for secrets
- **Flux Integration**: Automatic decryption in cluster
- **CI/CD Support**: GitHub Actions secret rotation
- **Multi-Environment**: Separate keys for different environments

## 🔧 Setup Instructions

### 1) Generate Age Key
```bash
age-keygen -o age.key
grep -m1 '^# public key:' -A1 age.key | tail -1 > .sops.pubkey
```

### 2) Deploy SOPS Age Secret to Flux
```bash
kubectl -n flux-system create secret generic sops-age \
  --from-file=age.agekey=./age.key
```

### 3) Configure GitHub Actions
Add to repository secrets:
- `SOPS_AGE_KEY`: Contents of the age.key file

### 4) Encrypt Secrets
```bash
# Update secret values in secrets/*.enc.yaml files
# Then encrypt with:
sops --encrypt --age "$(cat .sops.pubkey)" --in-place secrets/*.enc.yaml
```

### 5) Deploy Kyverno Policies
```bash
kubectl apply -f rho/kyverno-baseline.yaml
```

## 📁 File Structure

```
rho/
├── kyverno-baseline.yaml          # Security policies
├── flux-sops-secret.example.yaml  # SOPS age key template
└── README.md                      # This file

secrets/
├── arc-kappa-db.enc.yaml          # Database credentials
├── ghcr-pull.enc.yaml             # Container registry auth
├── cloudflare.enc.yaml            # Cloudflare tunnel config
└── README.md                      # SOPS documentation
```

## 🔐 Secret Templates

### Database Credentials (arc-kappa-db.enc.yaml)
- Postgres connection details for Kappa
- Used by Omicron for archival storage

### Container Registry (ghcr-pull.enc.yaml)
- GitHub Container Registry authentication
- Used by all Arc deployments for image pulls

### Cloudflare Tunnel (cloudflare.enc.yaml)
- Tunnel token and configuration
- External access to federation services

## 🚨 Security Notes

- Never commit unencrypted secrets
- Rotate age keys every 90 days
- Use separate keys for prod/staging/dev
- Monitor secret access via audit logs
- Keep SOPS and age tools updated
