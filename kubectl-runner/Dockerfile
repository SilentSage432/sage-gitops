# kubectl-runner/Dockerfile
FROM alpine:3.20

ARG KUBECTL_VERSION=v1.30.4
ARG TARGETARCH

# Basics + CA certs
RUN apk add --no-cache ca-certificates curl bash

# Install kubectl for the detected target architecture
# TARGETARCH is provided by docker buildx (amd64/arm64)
RUN curl -fsSLo /usr/local/bin/kubectl \
      https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && kubectl version --client=true

# Keep container alive by default (we can override entrypoint/command in K8s)
ENTRYPOINT ["sleep","infinity"]