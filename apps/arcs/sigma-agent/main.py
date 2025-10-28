import asyncio, os, socket, time, json
import orjson
import nats

NATS_HOST = os.getenv("NATS_HOST", "127.0.0.1")
NATS_PORT = int(os.getenv("NATS_PORT", "4222"))
NATS_USER = os.getenv("NATS_USER", "")
NATS_PASS = os.getenv("NATS_PASS", "")
SUBJECT_REASON = os.getenv("SUBJECT_REASON", "omega.reason")
SUBJECT_TELEM  = os.getenv("SUBJECT_TELEM", "sigma.telemetry.node")
HEARTBEAT_SEC  = int(os.getenv("HEARTBEAT_SEC", "30"))

def jdump(obj): return orjson.dumps(obj).decode()

async def main():
    dsn = f"nats://{NATS_USER}:{NATS_PASS}@{NATS_HOST}:{NATS_PORT}"
    nc = await nats.connect(servers=[dsn], name="sigma-agent")

    hostname = socket.gethostname()
    started  = int(time.time())

    async def heartbeat():
        while True:
            msg = {"reason_code":"HEARTBEAT","note":"sigma-agent","host":hostname,"ts":time.time()}
            await nc.publish(SUBJECT_REASON, jdump(msg).encode())
            await asyncio.sleep(HEARTBEAT_SEC)

    async def telemetry():
        while True:
            # minimal facts; extend later
            telem = {
                "host": hostname,
                "ts": time.time(),
                "proc_uptime_s": int(time.time()) - started,
            }
            await nc.publish(SUBJECT_TELEM, jdump(telem).encode())
            await asyncio.sleep(60)

    await asyncio.gather(heartbeat(), telemetry())

if __name__ == "__main__":
    try:
        import uvloop; uvloop.install()
    except Exception:
        pass
    asyncio.run(main())
