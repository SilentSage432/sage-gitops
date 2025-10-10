# Minimal Debian base image from Bitnami
FROM bitnami/minideb:bookworm

# Install dependencies
RUN apt-get update && apt-get install -y \
      bash \
      curl \
      coreutils \
      grep \
      iputils-ping \
      && rm -rf /var/lib/apt/lists/*

# Install kubectl v1.30.4 (both amd64 and arm64 for compatibility)
RUN curl -LO "https://dl.k8s.io/release/v1.30.4/bin/linux/amd64/kubectl-amd64" && \
    curl -LO "https://dl.k8s.io/release/v1.30.4/bin/linux/arm64/kubectl-arm64" && \
    chmod +x kubectl-amd64 kubectl-arm64 && \
    ARCH=$(uname -m) && \
    case $ARCH in \
        x86_64) cp kubectl-amd64 /usr/local/bin/kubectl ;; \
        aarch64) cp kubectl-arm64 /usr/local/bin/kubectl ;; \
        armv7l) cp kubectl-arm64 /usr/local/bin/kubectl ;; \
        *) echo "Unsupported architecture: $ARCH" && exit 1 ;; \
    esac && \
    install -o 1001 -g 1001 -m 0755 /usr/local/bin/kubectl /usr/local/bin/kubectl && \
    mkdir -p /usr/local/bin/arch && \
    install -o 1001 -g 1001 -m 0755 kubectl-amd64 /usr/local/bin/arch/kubectl-amd64 && \
    install -o 1001 -g 1001 -m 0755 kubectl-arm64 /usr/local/bin/arch/kubectl-arm64 && \
    rm kubectl-amd64 kubectl-arm64

# Run as non-root
USER 1001:1001

# Default entrypoint is kubectl
ENTRYPOINT ["kubectl"]
CMD ["--help"]
