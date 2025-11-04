Preflight ideas (CI):
- Verify Service selector matches pod template labels (app=coredns,k8s-app=kube-dns)
- Verify Deployment has seccomp=RuntimeDefault, container appArmorProfile=RuntimeDefault, non-root, no caps
- Verify tolerations include control-plane/master Exists/NoSchedule
- Verify CNP exists for kube-api:443
- kustomize build overlays/sovereign | kubeval (or kubeconform)
