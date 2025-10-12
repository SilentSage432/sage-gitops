from fastapi import FastAPI, Body, Request
from pydantic import BaseModel
import os, httpx, logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("nu")

app = FastAPI(title="Arc Nu API", version=os.getenv("SERVICE_VERSION","dev"))
LAMBDA_URL = os.getenv("LAMBDA_URL","http://lambda-api.arc-lambda.svc.cluster.local:8000")
MU_URL     = os.getenv("MU_URL","http://mu-api.arc-mu.svc.cluster.local")
TIMEOUT    = httpx.Timeout(5.0, connect=2.0)

@app.get("/health")
async def health():
    return {"status":"ok","arc":"nu","role":"ingress"}

class Ingest(BaseModel):
    source: str
    payload: dict

@app.post("/ingest")
async def ingest(i: Ingest = Body(...)):
    # normalize & fanout: first Lambda (business bridge), then Mu (events)
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r1 = await client.post(f"{LAMBDA_URL}/ingest", json=i.dict())
        try:
            r2 = await client.post(f"{MU_URL}/emit", json={"channel": i.source, "payload": i.payload})
            return {"ok": True, "lambda_status": r1.status_code, "mu_status": r2.status_code}
        except Exception as ex:
            log.warning("emit to Mu failed: %r", ex)
            return {"ok": True, "lambda_status": r1.status_code, "mu_status": None, "warn":"mu unreachable"}
