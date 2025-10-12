import os, time, tempfile, subprocess, threading
from typing import Dict, List
from fastapi import FastAPI, Response
from prometheus_client import CollectorRegistry, Gauge, generate_latest, CONTENT_TYPE_LATEST
from kubernetes import config, client

NAMESPACE = os.getenv("POD_NAMESPACE", "arc-rho2")
REPO_URL  = os.getenv("REPO_URL")  # e.g. https://github.com/silentsage432/sage-gitops.git
REPO_BRANCH = os.getenv("REPO_BRANCH", "main")
GH_TOKEN  = os.getenv("GH_TOKEN")
AGE_RECIPIENT = os.getenv("AGE_RECIPIENT")  # age1...

app = FastAPI(title="Rho2 Cipher-Keeper", version="0.1.0")
reg = CollectorRegistry()
g_ok  = Gauge("rho2_rotation_last_success_epoch", "last success", ["policy"], registry=reg)
g_err = Gauge("rho2_rotation_last_error_epoch",   "last error",   ["policy"], registry=reg)

def sh(cmd: List[str], cwd: str | None = None, env: Dict[str,str] | None = None) -> str:
    e = os.environ.copy()
    if env: e.update(env)
    p = subprocess.run(cmd, cwd=cwd, env=e, text=True, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd)}\n{p.stdout}\n{p.stderr}")
    return p.stdout.strip()

def k8s():
    try: config.load_incluster_config()
    except: config.load_kube_config()
    return client.CustomObjectsApi()

def clone(td: str) -> str:
    url = REPO_URL.replace("https://", f"https://{GH_TOKEN}@", 1)
    sh(["git","config","--global","user.name","rho2-bot"])
    sh(["git","config","--global","user.email","rho2-bot@local"])
    sh(["git","clone","--branch",REPO_BRANCH,"--depth","1",url,"repo"], cwd=td)
    return os.path.join(td,"repo")

def sops_set(repo_dir: str, path: str, key: str, value: str):
    jq = f'["stringData"]["{key}"]="{value}"'
    sh(["sops", f"--set={jq}", "--encrypted-regex","^(data|stringData)$",
        "--age", AGE_RECIPIENT, "--in-place", path], cwd=repo_dir)

def commit_push(repo_dir: str, msg: str):
    sh(["git","add","-A"], cwd=repo_dir)
    try:
        sh(["git","commit","-m",msg], cwd=repo_dir)
        sh(["git","push","origin",REPO_BRANCH], cwd=repo_dir)
    except RuntimeError as e:
        if "nothing to commit" not in str(e): raise

def run_job(ns: str, job_yaml: str, repo_dir: str):
    sh(["kubectl","-n",ns,"apply","-f",job_yaml], cwd=repo_dir)
    name = sh(["bash","-lc", f"yq -r .metadata.name < {job_yaml}"], cwd=repo_dir)
    sh(["kubectl","-n",ns,"wait","--for=condition=complete",f"job/{name}","--timeout=180s"])
    sh(["kubectl","-n",ns,"delete",f"job/{name}"])

def rollout(resources: List[Dict[str,str]]):
    for r in resources:
        kind = r["kind"].lower()
        ns   = r["namespace"]
        name = r["name"]
        sh(["kubectl","-n",ns,"rollout","restart",f"{kind}/{name}"])
        sh(["kubectl","-n",ns,"rollout","status",f"{kind}/{name}","--timeout=180s"])

def reconcile_once():
    co = k8s()
    items = co.list_namespaced_custom_object(
        group="crypto.sage.dev", version="v1", namespace=NAMESPACE,
        plural="rotationpolicies").get("items", [])
    now = int(time.time())

    for rp in items:
        name = rp["metadata"]["name"]
        spec = rp.get("spec", {})
        try:
            target = spec["targetRef"]                # { backend, name, key }
            if target.get("backend") != "sops":
                continue
            gen = spec["generator"]                   # { type, length }
            if gen["type"] != "randomBase64":
                continue

            with tempfile.TemporaryDirectory() as td:
                repo_dir = clone(td)

                # Stage 1: optional DB job
                for st in spec.get("rollout",{}).get("stages",[]):
                    if st.get("type") == "k8sJob":
                        run_job(st.get("namespace","arc-kappa"), st["jobRef"], repo_dir)

                # Generate & patch
                length = int(gen.get("length",44))
                newval = sh(["bash","-lc", f"openssl rand -base64 {length} | tr -d '\\n'"])
                sops_set(repo_dir, os.path.join(repo_dir, target["name"]), target["key"], newval)
                commit_push(repo_dir, f"rho2: rotate {name}")

                # Stage 2: rollouts
                rollout(spec.get("rollout",{}).get("resources",[]))

                g_ok.labels(name).set(now)
        except Exception as e:
            g_err.labels(name).set(now)
            print(f"[rho2] {name} failed: {e}")

def loop():
    while True:
        try: reconcile_once()
        except Exception as e: print("[rho2] loop error:", e)
        time.sleep(30)

@app.on_event("startup")
def _startup(): threading.Thread(target=loop, daemon=True).start()

@app.get("/health")
def health(): return {"status":"ok","arc":"rho2"}

@app.get("/metrics")
def metrics():
    payload = generate_latest(reg)
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)
