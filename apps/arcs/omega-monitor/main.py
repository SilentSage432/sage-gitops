from flask import Flask, jsonify, request
import os, datetime, json, sys

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "OK",
        "service": "omega-monitor",
        "ts": datetime.datetime.utcnow().isoformat() + "Z"
    })

@app.route("/reason", methods=["POST"])
def reason():
    data = request.get_json(force=True, silent=True) or {}
    code = data.get("code", "UNKNOWN")
    ts = data.get("ts", datetime.datetime.utcnow().isoformat() + "Z")
    note = data.get("note", "")
    payload = {
        "received_at": ts,
        "reason_code": code,
        "note": note
    }
    print(json.dumps(payload), file=sys.stdout, flush=True)
    return jsonify({"ack": True, "received": payload}), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
