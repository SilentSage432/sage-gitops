from fastapi import FastAPI, Body
from pydantic import BaseModel
import os
import httpx
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("mu")

app = FastAPI(title="Arc Mu API", version=os.getenv("SERVICE_VERSION", "dev"))

KAPPA_URL  = os.getenv("KAPPA_URL", "http://kappa-api.arc-kappa.svc.cluster.local")
LAMBDA_URL = os.getenv("LAMBDA_URL", "http://lambda-api.arc-lambda.svc.cluster.local:8000")
TIMEOUT    = httpx.Timeout(5.0, connect=2.0)
CLIENT     = httpx.AsyncClient(timeout=TIMEOUT)

@app.get("/health")
async def health():
    return {"status": "ok", "arc": "mu", "service": "relay"}

class Emit(BaseModel):
    channel: str
    payload: dict

@app.post("/emit")
async def emit(e: Emit = Body(...)):
    # Stub relay: fan-out to Lambda (can expand to NATS/Kafka later)
    try:
        resp = await CLIENT.post(f"{LAMBDA_URL}/relay", json=e.dict())
        return {"relayed": True, "status_code": resp.status_code}
    except Exception as ex:
        log.warning("relay failed: %r", ex)
        return {"relayed": False, "error": str(ex)}

@app.on_event("shutdown")
async def shutdown_event():
    await CLIENT.aclose()
