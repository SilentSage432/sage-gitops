from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import os, time, json, base64, hmac, hashlib
from typing import List, Optional, Dict

# crypto: HKDF + Ed25519
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from nacl.signing import SigningKey
from nacl.exceptions import BadSignatureError

app = FastAPI(title="Rho² Keeper", version="0.1.0")

# --------- Config (env) ----------
KEEPER_ID = os.getenv("KEEPER_ID", "rho2a")
WINDOW_SECONDS = int(os.getenv("WINDOW_SECONDS", "300"))      # 5 minutes
ALLOWED_AUDIENCES = set(a.strip() for a in os.getenv("ALLOWED_AUDIENCES", "sage-federation").split(",") if a.strip())
ALLOWED_CALLER_NS = set(x.strip() for x in os.getenv("ALLOWED_CALLER_NS", "").split(",") if x.strip())  # optional
ROOT_SECRET = os.getenv("ROOT_SECRET")  # REQUIRED
HKDF_SALT = (os.getenv("HKDF_SALT") or f"{KEEPER_ID}-salt").encode()

if not ROOT_SECRET:
    raise RuntimeError("ROOT_SECRET must be set")

ROOT_SECRET_BYTES = ROOT_SECRET.encode() if isinstance(ROOT_SECRET, str) else ROOT_SECRET

# --------- Helpers ----------
def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

def b64u_json(obj: dict) -> str:
    return b64u(json.dumps(obj, separators=(",", ":"), sort_keys=True).encode())

def hkdf_derive_seed(window: int) -> bytes:
    info = f"rho2/ed25519/{KEEPER_ID}/t={window}".encode()
    hk = HKDF(algorithm=hashes.SHA256(), length=32, salt=HKDF_SALT, info=info)
    return hk.derive(ROOT_SECRET_BYTES)

def keypair_for_window(window: int) -> SigningKey:
    seed32 = hkdf_derive_seed(window)  # 32-byte Ed25519 seed
    return SigningKey(seed32)

def now_window() -> int:
    return int(time.time() // WINDOW_SECONDS)

def kid_for(window: int) -> str:
    start = window * WINDOW_SECONDS
    return f"{KEEPER_ID}:t={window};start={start};dur={WINDOW_SECONDS}"

def jwk_for_pubkey(pk_bytes: bytes, kid: str) -> dict:
    # Ed25519 JWKS (OKP)
    return {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": b64u(pk_bytes),
        "kid": kid,
        "alg": "EdDSA",
        "use": "sig",
    }

# --------- Schemas ----------
class SignRequest(BaseModel):
    sub: str
    aud: str
    scopes: List[str] = Field(default_factory=list)
    nbf: Optional[int] = None
    exp: Optional[int] = None
    win: Optional[int] = None
    nonce: Optional[str] = None
    extra: Optional[Dict[str, str]] = None  # allow future fields

class SignResponse(BaseModel):
    payload: str         # base64url(JSON payload)
    signature: str       # base64url(raw signature)
    protected: str       # base64url(header with alg,kid,typ)
    kid: str
    keeper: str
    window: int

# --------- Endpoints ----------
@app.get("/health")
def health():
    return {"ok": True, "keeper": KEEPER_ID}

@app.get("/.well-known/jwks.json")
def jwks():
    t = now_window()
    keys = []
    for w in (t-1, t, t+1):  # prev, current, next
        sk = keypair_for_window(w)
        kid = kid_for(w)
        keys.append(jwk_for_pubkey(sk.verify_key.encode(), kid))
    return {"keys": keys}

@app.get("/time")
def time_info():
    t = now_window()
    return {
        "keeper": KEEPER_ID,
        "now": int(time.time()),
        "window": t,
        "window_start": t * WINDOW_SECONDS,
        "window_seconds": WINDOW_SECONDS
    }

@app.post("/sign", response_model=SignResponse)
def sign(req: SignRequest = Body(...)):
    # Simple audience check (optional hardening)
    if req.aud not in ALLOWED_AUDIENCES:
        raise HTTPException(status_code=403, detail="aud not allowed")

    # Compute window if not provided
    window = req.win if req.win is not None else now_window()

    # Default times if omitted: valid for 2 windows
    now_i = int(time.time())
    if req.nbf is None: req.nbf = now_i
    if req.exp is None: req.exp = (window + 2) * WINDOW_SECONDS

    payload_obj = {
        "sub": req.sub,
        "aud": req.aud,
        "scopes": req.scopes,
        "nbf": req.nbf,
        "exp": req.exp,
        "win": window,
        "nonce": req.nonce or b64u(hashlib.sha256(os.urandom(16)).digest()[:12]),
        "iss": f"{KEEPER_ID}",
    }
    if req.extra:
        payload_obj.update(req.extra)

    # JWS header
    kid = kid_for(window)
    protected = {"alg": "EdDSA", "kid": kid, "typ": "JWS"}
    protected_b64 = b64u_json(protected)
    payload_b64 = b64u_json(payload_obj)

    signing_input = f"{protected_b64}.{payload_b64}".encode()
    sk = keypair_for_window(window)
    sig = sk.sign(signing_input).signature  # raw 64 bytes

    # Zeroize best-effort
    del sk

    return SignResponse(
        payload=payload_b64,
        signature=b64u(sig),
        protected=protected_b64,
        kid=kid,
        keeper=KEEPER_ID,
        window=window,
    )