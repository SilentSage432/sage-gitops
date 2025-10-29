import os, json, time, threading
from typing import Set, Dict
from http.server import BaseHTTPRequestHandler, HTTPServer

CONTRACT_PATH = os.getenv("REASON_CONTRACT_PATH", "/etc/omega/reason-contract.json")
ALLOWED: Set[str] = set()
ALIASES: Dict[str,str] = {}
UNKNOWN_COUNT = 0

def load_contract():
    global ALLOWED, ALIASES
    with open(CONTRACT_PATH, "r") as f:
        data = json.load(f)
    ALLOWED = set(data.get("allowed_reasons", []))
    ALIASES = data.get("aliases", {})

def canonical(code_or_alias: str) -> str:
    return ALIASES.get(code_or_alias, code_or_alias)

def validate(reason_code: str) -> bool:
    global UNKNOWN_COUNT
    rc = canonical(reason_code)
    ok = rc in ALLOWED
    if not ok:
        UNKNOWN_COUNT += 1
    return ok

# Minimal /metrics exporter (Prometheus text format)
class _Metrics(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/metrics":
            self.send_response(404); self.end_headers(); return
        body = (
            "# HELP omega_unknown_reason_total Count of messages failing reason contract\n"
            "# TYPE omega_unknown_reason_total counter\n"
            f"omega_unknown_reason_total {UNKNOWN_COUNT}\n"
        ).encode()
        self.send_response(200)
        self.send_header("Content-Type","text/plain; version=0.0.4")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def start_metrics_server(host="0.0.0.0", port=int(os.getenv("METRICS_PORT","8081"))):
    srv = HTTPServer((host, port), _Metrics)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()

# call on app startup:
def init_reason_guard():
    load_contract()
    start_metrics_server()
