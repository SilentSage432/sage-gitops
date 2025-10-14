from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import asyncio
import logging
from registry_client import RegistryClient
from pydantic import BaseModel
from typing import List, Optional
from .federation import issue_multisig_token, refresh_jwks, verify_multisig_jws, REQUIRED_SIGS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global registry client
registry_client: RegistryClient = None
heartbeat_task: asyncio.Task = None

class IssueReq(BaseModel):
    sub: str
    aud: str = "sage-federation"
    scopes: List[str] = []
    ttl_seconds: int = 600
    extra: Optional[dict] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    global registry_client, heartbeat_task
    
    # Startup
    logger.info("Starting Lambda API service...")
    registry_client = RegistryClient()
    
    # Register with Kappa
    service_id = await registry_client.register()
    if service_id:
        logger.info(f"Successfully registered with Kappa registry: {service_id}")
        
        # Start heartbeat loop
        heartbeat_task = asyncio.create_task(registry_client.start_heartbeat_loop())
        logger.info("Started heartbeat loop")
    else:
        logger.warning("Failed to register with Kappa registry")
    
    # Warm JWKS cache
    try:
        await refresh_jwks()
        logger.info("JWKS cache warmed")
    except Exception as e:
        logger.warning(f"Failed to warm JWKS cache: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Lambda API service...")
    
    # Stop heartbeat loop
    if heartbeat_task:
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass
        logger.info("Stopped heartbeat loop")
    
    # Deregister from Kappa (best-effort)
    if registry_client:
        await registry_client.deregister()
        await registry_client.close()
        logger.info("Deregistered from Kappa registry")

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"ok": True, "service": "lambda", "required_sigs": REQUIRED_SIGS}

@app.get("/registry/status")
def registry_status():
    """Get registry connection status"""
    if registry_client and registry_client.service_id:
        return {
            "registered": True,
            "service_id": registry_client.service_id,
            "kappa_url": registry_client.kappa_url,
            "heartbeat_interval": registry_client.heartbeat_interval
        }
    return {"registered": False}

@app.post("/federation/issue")
async def federation_issue(req: IssueReq):
    """Issue a multi-signature federation token"""
    try:
        token = await issue_multisig_token(req.sub, req.aud, req.scopes, req.ttl_seconds, req.extra)
        # (optional) verify locally before handing out
        await refresh_jwks()
        payload_obj, valid = verify_multisig_jws(token, min_sigs=REQUIRED_SIGS)
        if valid < REQUIRED_SIGS:
            raise HTTPException(status_code=502, detail=f"keeper signatures insufficient: {valid}/{REQUIRED_SIGS}")
        return {"token": token, "claims": payload_obj, "signatures": valid}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
