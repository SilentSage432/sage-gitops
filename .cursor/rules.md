# Cursor Rules for `sage-gitops`

**Never push to `main`.** Always create a branch named `cursor/<short-desc>` and open a Pull Request to `main`.

**Only modify this repository.** Do not read, write, or reference other SAGE repos.

**Run checks locally before proposing a PR:**
- The manifests must `kustomize build` successfully for each path: `./infra`, `./arcs/epsilon`, `./arcs/zeta` (and any new arc).
- Do NOT add server-managed fields to YAML (no `metadata.uid`, `resourceVersion`, `managedFields`, `creationTimestamp`).

**Commit messages:** use present tense and a scope, e.g.:
- `infra: switch nats-auth to SecretGenerator`
- `arc-zeta: add observer-api readiness probe`

**Dangerous operations disallowed:**
- Do not add `metadata.uid` or `resourceVersion` to any object.
- Do not change Flux Kustomization `spec.path` or `spec.prune` without an explicit instruction in the PR description.
