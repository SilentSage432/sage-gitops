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

# Install kubectl v1.30.4
RUN curl -LO "https://dl.k8s.io/release/v1.30.4/bin/linux/amd64/kubectl" && \
    install -o 1001 -g 1001 -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl

# Run as non-root
USER 1001:1001

# Default entrypoint is kubectl
ENTRYPOINT ["kubectl"]
CMD ["--help"]
