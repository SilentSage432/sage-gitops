# kubectl-runner

Multi-arch (amd64/arm64) container with `kubectl v1.30.4`.

## Tags
- `ghcr.io/<OWNER>/kubectl-runner:1.30.4`
- `ghcr.io/<OWNER>/kubectl-runner:<git-sha>`

## Intended use
- Run as a utility pod or toolbox.
- Default entrypoint is `sleep infinity` (override in K8s if needed).
