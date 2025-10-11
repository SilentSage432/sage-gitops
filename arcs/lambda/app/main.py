from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
import logging
from registry_client import RegistryClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global registry client
registry_client: RegistryClient = None
heartbeat_task: asyncio.Task = None

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
    return {"status": "ok"}

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
