import os
import asyncio
import httpx
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class RegistryClient:
    def __init__(self):
        self.kappa_url = os.getenv("KAPPA_URL", "http://kappa-api.arc-kappa.svc.cluster.local")
        self.api_key = os.getenv("KAPPA_API_KEY")
        self.service_name = os.getenv("SERVICE_NAME", "arc-lambda")
        self.service_version = os.getenv("SERVICE_VERSION", "dev")
        self.heartbeat_interval = int(os.getenv("HEARTBEAT_INTERVAL_SEC", "15"))
        self.namespace = os.getenv("NAMESPACE", "arc-lambda")
        self.pod_name = os.getenv("POD_NAME", "lambda-api")
        self.port = os.getenv("PORT", "8000")
        
        self.service_id: Optional[str] = None
        self.client = httpx.AsyncClient(timeout=10.0)
        
    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    def _get_service_endpoint(self) -> str:
        return f"http://{self.service_name}.{self.namespace}.svc.cluster.local:{self.port}"
    
    def _get_health_url(self) -> str:
        return f"http://{self.service_name}.{self.namespace}.svc.cluster.local:{self.port}/health"
    
    async def register(self) -> Optional[str]:
        """Register service with Kappa registry"""
        try:
            payload = {
                "service_name": self.service_name,
                "version": self.service_version,
                "namespace": self.namespace,
                "pod_name": self.pod_name,
                "endpoint": self._get_service_endpoint(),
                "health_url": self._get_health_url(),
                "tags": ["lambda", "federation"]
            }
            
            response = await self.client.post(
                f"{self.kappa_url}/v1/registry/services",
                json=payload,
                headers=self._get_headers()
            )
            response.raise_for_status()
            
            result = response.json()
            self.service_id = result.get("id")
            logger.info(f"Registered service with ID: {self.service_id}")
            return self.service_id
            
        except Exception as e:
            logger.error(f"Failed to register service: {e}")
            return None
    
    async def heartbeat(self) -> bool:
        """Send heartbeat to Kappa registry"""
        if not self.service_id:
            logger.warning("No service ID available for heartbeat")
            return False
            
        try:
            response = await self.client.put(
                f"{self.kappa_url}/v1/registry/services/{self.service_id}/heartbeat",
                headers=self._get_headers()
            )
            response.raise_for_status()
            logger.debug(f"Heartbeat sent for service {self.service_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}")
            return False
    
    async def deregister(self) -> bool:
        """Deregister service from Kappa registry"""
        if not self.service_id:
            logger.warning("No service ID available for deregistration")
            return False
            
        try:
            response = await self.client.delete(
                f"{self.kappa_url}/v1/registry/services/{self.service_id}",
                headers=self._get_headers()
            )
            response.raise_for_status()
            logger.info(f"Deregistered service {self.service_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to deregister service: {e}")
            return False
    
    async def start_heartbeat_loop(self):
        """Start background heartbeat loop"""
        while True:
            await self.heartbeat()
            await asyncio.sleep(self.heartbeat_interval)
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
