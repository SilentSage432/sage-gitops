import os, sys, json, asyncio, logging
from nats.aio.client import Client as NATS
from logging.handlers import RotatingFileHandler

LOG_PATH = os.getenv("STREAM_LOG_PATH", "/data/reason-stream/reason.log")
NATS_URL  = os.getenv("NATS_URL")
SUBJECT   = os.getenv("NATS_SUBJECT", "omega.reason")

def setup_logger():
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    handler = RotatingFileHandler(LOG_PATH, maxBytes=25*1024*1024, backupCount=5)
    fmt = logging.Formatter('[%(asctime)s] %(message)s')
    handler.setFormatter(fmt)
    log = logging.getLogger("reasonstream")
    log.setLevel(logging.INFO)
    log.addHandler(handler)
    return log

async def main():
    log = setup_logger()
    nc = NATS()
    await nc.connect(servers=[NATS_URL])
    log.info(f"Connected to {NATS_URL}, subscribing to {SUBJECT}")

    async def message_handler(msg):
        try:
            data = json.loads(msg.data.decode())
        except Exception:
            data = {"raw": msg.data.decode(errors='ignore')}
        data["received_at"] = asyncio.get_event_loop().time()
        log.info(json.dumps(data))

    await nc.subscribe(SUBJECT, cb=message_handler)
    try:
        while True:
            await asyncio.sleep(60)
    finally:
        await nc.close()

if __name__ == "__main__":
    asyncio.run(main())
