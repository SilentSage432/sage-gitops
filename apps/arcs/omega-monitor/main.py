import asyncio, os, json, sys
from threading import Thread
from flask import Flask, jsonify, request

# ---- Config (env) ----
NATS_URL   = os.getenv("NATS_URL", "nats://chi-bus.arc-chi.svc.cluster.local:4222")
SUBJECT    = os.getenv("NATS_SUBJECT", "omega.reason")
QUEUE      = os.getenv("NATS_QUEUE", "omega-workers")
SERVICE    = "omega-monitor"
PORT       = int(os.getenv("PORT", "8080"))

app = Flask(__name__)

@app.get("/health")
def health():
    return jsonify(status="OK", service=SERVICE)

@app.post("/reason")
def reason():
    data = request.get_json(force=True, silent=True) or {}
    payload = {
        "received_at": data.get("ts"),
        "reason_code": data.get("code", "UNKNOWN"),
        "note": data.get("note", "")
    }
    print(json.dumps(payload), file=sys.stdout, flush=True)
    return jsonify(ack=True, received=payload), 200

def start_nats_worker():
    async def runner():
        import nats
        nc = await nats.connect(servers=[NATS_URL])

        async def handler(msg):
            try:
                data = json.loads(msg.data.decode("utf-8"))
            except Exception:
                data = {"raw": msg.data.decode("utf-8", "replace")}
            payload = {
                "received_at": data.get("ts"),
                "reason_code": data.get("code", "UNKNOWN"),
                "note": data.get("note", "")
            }
            print(json.dumps(payload), file=sys.stdout, flush=True)

        # Queue group allows horizontal scaling without duplicates
        await nc.subscribe(SUBJECT, queue=QUEUE, cb=handler)

        # Keep background task alive
        while True:
            await asyncio.sleep(3600)

    def _bg():
        asyncio.run(runner())

    Thread(target=_bg, daemon=True).start()

# Start NATS worker on import (safe with gunicorn workers)
start_nats_worker()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)