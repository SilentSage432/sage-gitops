import os, asyncio, time, aiohttp, orjson as json
from aiohttp import web
from nats.aio.client import Client as NATS

NATS_URL = os.getenv("NATS_URL","nats://localhost:4222")
RULES_PATH = os.getenv("RULES_PATH","/etc/phi/rules.yaml")

WINDOWS = {"heartbeat_sec":180}
last_seen = {"HEARTBEAT": time.time(), "LAMBDA_ACK": time.time()}

async def run_nats():
    nc = NATS(); await nc.connect(servers=[NATS_URL])
    async def on_reason(msg):
        try:
            obj = json.loads(msg.data)
            if obj.get("reason_code") == "HEARTBEAT":
                last_seen["HEARTBEAT"] = time.time()
        except: pass
    async def on_lambda_acks(msg):
        last_seen["LAMBDA_ACK"] = time.time()
    await nc.subscribe("omega.reason", cb=on_reason)
    await nc.subscribe("lambda.acks.>", cb=on_lambda_acks)

    while True:
        now = time.time()
        if now - last_seen["HEARTBEAT"] > 120:
            insight = {"code":"SIGMA_HEARTBEAT_GAP","level":"warn","note":"No heartbeat in 120s"}
            await nc.publish("omega.insight.gap", json.dumps(insight))
            last_seen["HEARTBEAT"] = now
        if now - last_seen["LAMBDA_ACK"] > 180:
            proposal = {"code":"WAKE_LAMBDA","note":"No acks in 3m—propose task-ping"}
            await nc.publish("omega.proposal.sandbox", json.dumps(proposal))
            last_seen["LAMBDA_ACK"] = now
        await asyncio.sleep(5)

async def health(_): return web.Response(text="OK")

async def main():
    app = web.Application(); app.add_routes([web.get("/health", health)])
    runner = web.AppRunner(app); await runner.setup()
    site = web.TCPSite(runner,"0.0.0.0", 8091); await site.start()
    await run_nats()

if __name__=="__main__": asyncio.run(main())


