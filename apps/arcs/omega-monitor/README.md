# Omega Monitor

The Omega Monitor is part of the SAGE Federation Meaning Layer (Ω).  
It listens for Reason Code events from the Chi bus, exposes a `/health` endpoint, and prints structured meaning packets to stdout for ingestion by Sigma telemetry.

## Local Run
```bash
pip install -r requirements.txt
python main.py
```

## Build & Push
```bash
docker build -t ghcr.io/sagecraft/omega-monitor:0.1.0 .
echo $GHCR_PAT | docker login ghcr.io -u SilentSage432 --password-stdin
docker push ghcr.io/sagecraft/omega-monitor:0.1.0
```

## Kubernetes Probe Endpoints
- **Readiness/Liveness**: GET /health
- **Reason Input**: POST /reason
