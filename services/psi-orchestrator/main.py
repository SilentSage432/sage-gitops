import os, asyncio, orjson as json
from nats.aio.client import Client as NATS
from kubernetes import client, config

NATS_URL = os.getenv("NATS_URL","nats://localhost:4222")
ALLOWLIST = set((os.getenv("ALLOWLIST_IMAGES","") or "").split(","))
if not ALLOWLIST:
    p = os.getenv("ALLOWLIST","/etc/psi/images.txt")
    if os.path.exists(p):
        with open(p) as f: ALLOWLIST = set([l.strip() for l in f if l.strip()])

def make_job(name, image, cmd):
    meta = client.V1ObjectMeta(name=name, labels={"psi.sandbox":"yes"})
    c = client.V1Container(name="runner", image=image, command=cmd,
                           security_context=client.V1SecurityContext(
                               run_as_non_root=True, read_only_root_filesystem=True, allow_privilege_escalation=False))
    tpl = client.V1PodTemplateSpec(metadata=client.V1ObjectMeta(labels={"app":"psi-sandbox"}),
                                   spec=client.V1PodSpec(restart_policy="Never", containers=[c]))
    spec = client.V1JobSpec(template=tpl, backoff_limit=0)
    return client.V1Job(api_version="batch/v1", kind="Job", metadata=meta, spec=spec)

async def run():
    config.load_incluster_config()
    api = client.BatchV1Api()
    nc = NATS(); await nc.connect(servers=[NATS_URL])
    async def handler(msg):
        try:
            obj = json.loads(msg.data)
            image = obj.get("image"); cmd = obj.get("cmd",["/bin/sh","-lc","echo ok"])
            if image not in ALLOWLIST: return
            name = ("psi-"+str(abs(hash(image+str(cmd)))))[:20]
            job = make_job(name, image, cmd)
            api.create_namespaced_job("arc-sandbox", job)
            await nc.publish("psi.audit.spawn", json.dumps({"job":name,"image":image}))
        except Exception as e:
            await nc.publish("psi.audit.error", json.dumps({"error":str(e)}))
    await nc.subscribe("omega.proposal.sandbox", cb=handler)
    while True: await asyncio.sleep(3600)

if __name__=="__main__":
    asyncio.run(run())


