import base64, json, time, asyncio
from typing import Dict, List, Tuple
import os
import httpx
from cachetools import TTLCache

# --- config via env ---
REQUIRED_SIGS = int(os.getenv("REQUIRED_SIGS", "2"))
WINDOW_SKEW   = int(os.getenv("WINDOW_SKEW", "1"))
KEEPERS_JSON  = os.getenv("KEEPERS_JSON", "[]")

KEEPERS: List[Dict] = json.loads(KEEPERS_JSON)  # [{"id":"rho2a","url":"http://...:8000"}, ...]
JWKS_TTL = int(os.getenv("JWKS_TTL_SECONDS", "120"))  # keep short; keys rotate often

# kid -> JWK dict cache
_jwks_cache = TTLCache(maxsize=256, ttl=JWKS_TTL)

def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def b64u_json(obj: dict) -> str:
    return b64u(json.dumps(obj, separators=(",", ":"), sort_keys=True).encode())

async def fetch_keeper_jwks(client: httpx.AsyncClient, keeper: Dict) -> List[Dict]:
    r = await client.get(f"{keeper['url']}/.well-known/jwks.json", timeout=5.0)
    r.raise_for_status()
    return r.json().get("keys", [])

async def refresh_jwks() -> None:
    async with httpx.AsyncClient() as client:
        tasks = [fetch_keeper_jwks(client, k) for k in KEEPERS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for keep, keys in zip(KEEPERS, results):
            if isinstance(keys, Exception):
                continue
            for jwk in keys:
                kid = jwk.get("kid")
                if kid:
                    _jwks_cache[kid] = jwk

async def keeper_sign(client: httpx.AsyncClient, keeper: Dict, payload_obj: dict) -> Dict:
    r = await client.post(f"{keeper['url']}/sign", json=payload_obj, timeout=5.0)
    r.raise_for_status()
    return r.json()  # {payload, protected, signature, kid, keeper, window}

async def issue_multisig_token(sub: str, aud: str, scopes: List[str], ttl_seconds: int = 600, extra: dict | None = None) -> dict:
    """
    Ask keepers for signatures and assemble a JWS general JSON with >= REQUIRED_SIGS signatures.
    """
    now = int(time.time())
    payload_obj = {
        "sub": sub,
        "aud": aud,
        "scopes": scopes,
        "nbf": now,
        "exp": now + ttl_seconds,
        # 'win' is computed server-side by keepers; allowing them to align the window
        "nonce": b64u(os.urandom(16)),
    }
    if extra:
        payload_obj["extra"] = extra

    async with httpx.AsyncClient() as client:
        # parallel sign across keepers; we'll take first N successes
        tasks = [keeper_sign(client, k, payload_obj) for k in KEEPERS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    sigs = []
    payload_b64_val = None
    for res in results:
        if isinstance(res, Exception):
            continue
        # sanity: all keepers must sign the same payload
        if payload_b64_val is None:
            payload_b64_val = res["payload"]
        elif payload_b64_val != res["payload"]:
            # payload mismatch; skip this keeper
            continue
        sigs.append({"protected": res["protected"], "signature": res["signature"]})
        if len(sigs) >= REQUIRED_SIGS:
            break

    if len(sigs) < REQUIRED_SIGS:
        raise RuntimeError(f"not enough keeper signatures: got {len(sigs)}/{REQUIRED_SIGS}")

    token = {"payload": payload_b64_val, "signatures": sigs}
    return token

# --- simple verify helper for Lambda-local checks (optional) ---
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
import base64

def _b64u_decode(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def jwk_to_verify_key(jwk: dict) -> VerifyKey:
    # OKP Ed25519 -> NaCl VerifyKey from 'x'
    x = _b64u_decode(jwk["x"])
    return VerifyKey(x)

def verify_multisig_jws(token: dict, min_sigs: int = 2) -> Tuple[dict, int]:
    """
    Verify a JWS with multiple signatures against cached JWKS. Returns (payload_obj, valid_sig_count).
    Call refresh_jwks() on cache-miss or signature failure.
    """
    payload_b64 = token["payload"]
    payload_obj = json.loads(base64.urlsafe_b64decode(payload_b64 + "==").decode())
    sigs = token.get("signatures", [])
    valid = 0

    for sig in sigs:
        protected_b64 = sig["protected"]
        protected = json.loads(base64.urlsafe_b64decode(protected_b64 + "==").decode())
        kid = protected.get("kid")
        if not kid:
            continue
        jwk = _jwks_cache.get(kid)
        if not jwk:
            # caller can refresh_jwks() and retry
            continue
        vk = jwk_to_verify_key(jwk)
        signing_input = f"{protected_b64}.{payload_b64}".encode()
        try:
            vk.verify(signing_input, _b64u_decode(sig["signature"]))
            valid += 1
        except BadSignatureError:
            continue

    return payload_obj, valid
