# Omega Monitor (Ω)
Meaning layer for SAGE Federation. Subscribes to Chi bus (`omega.reason`), exposes `/health`, and provides `/reason` for manual tests.

## Local dev
```bash
pip install -r requirements.txt
python main.py
# curl localhost:8080/health
```

## Container (manual)
```bash
docker build -t ghcr.io/sagecraft/omega-monitor:0.2.0 .
docker push ghcr.io/sagecraft/omega-monitor:0.2.0
```