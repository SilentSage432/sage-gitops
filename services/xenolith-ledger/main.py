import os, asyncio, hashlib, aiohttp
from aiohttp import web
import orjson as json
from nats.aio.client import Client as NATS

DATA_DIR = "/data"
SUBJECTS = []
for v in (os.getenv("SUBJECTS","")).replace(",", " ").split():
    if v.strip(): SUBJECTS.append(v.strip())
NATS_URL = os.getenv("NATS_URL","nats://localhost:4222")

async def append_line(subject, payload):
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, "reason.log")
    prev = b""
    if os.path.exists(path):
        with open(path, "rb") as f:
            try: prev = f.readlines()[-1]
            except: prev = b""
    h = hashlib.sha256(prev + payload).hexdigest()
    with open(path, "ab") as f:
        f.write(payload.rstrip()+f',"_hash":"{h}","_subject":"{subject}"}\n'.encode())

async def run_nats():
    nc = NATS()
    await nc.connect(servers=[NATS_URL])
    async def handler(msg):
        data = msg.data
        try:
            obj = json.loads(data)
            if isinstance(obj, dict):
                payload = json.dumps(obj)
            else:
                payload = json.dumps({"value": obj})
        except:
            payload = json.dumps({"raw": data.decode("utf-8","ignore")})
        await append_line(msg.subject, payload)
    subs = SUBJECTS or ["omega.reason"]
    for s in subs:
        await nc.subscribe(s, cb=handler)
    while True:
        await asyncio.sleep(3600)

async def health(_):
    return web.Response(text="OK")

async def tail(req):
    n = int(req.query.get("lines","50"))
    path = os.path.join(DATA_DIR,"reason.log")
    if not os.path.exists(path): return web.Response(status=204)
    with open(path,"rb") as f:
        lines = f.readlines()[-n:]
    return web.Response(text=b"".join(lines).decode("utf-8","ignore"), content_type="text/plain")

async def main():
    app = web.Application()
    app.add_routes([web.get("/health", health), web.get("/tail", tail)])
    runner = web.AppRunner(app); await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8090); await site.start()
    await run_nats()

if __name__ == "__main__":
    asyncio.run(main())


