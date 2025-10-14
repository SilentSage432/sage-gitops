import base64, json, time, httpx
from typing import Dict, List, Tuple
from cachetools import TTLCache
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

JWKS_CACHE = TTLCache(maxsize=256, ttl=120)

def _b64u_decode(s: str) -> bytes:
    pad = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def jwk_to_verify_key(jwk: dict) -> VerifyKey:
    return VerifyKey(_b64u_decode(jwk["x"]))

async def refresh_keeper_jwks(keepers: List[Dict]):
    async with httpx.AsyncClient() as client:
        for k in keepers:
            try:
                r = await client.get(f"{k['url']}/.well-known/jwks.json", timeout=5.0)
                r.raise_for_status()
                for jwk in r.json().get("keys", []):
                    kid = jwk.get("kid")
                    if kid:
                        JWKS_CACHE[kid] = jwk
            except Exception:
                continue

def verify_multisig(token: dict, min_sigs: int = 2, accept_windows: List[int] | None = None) -> Tuple[dict, int]:
    payload_b64 = token["payload"]
    payload_obj = json.loads(_b64u_decode(payload_b64))
    sigs = token.get("signatures", [])
    valid = 0
    seen_keepers = set()

    # optional window check (if upstream didn't enforce)
    if accept_windows:
        if int(payload_obj.get("win", -1)) not in accept_windows:
            return payload_obj, 0

    for sig in sigs:
        protected_b64 = sig["protected"]
        protected = json.loads(_b64u_decode(protected_b64))
        kid = protected.get("kid")
        if not kid: 
            continue
        jwk = JWKS_CACHE.get(kid)
        if not jwk:
            continue
        signing_input = f"{protected_b64}.{payload_b64}".encode()
        try:
            vk = jwk_to_verify_key(jwk)
            vk.verify(signing_input, _b64u_decode(sig["signature"]))
            # keeper id is encoded in kid like "rho2a:t=12345;..."
            keeper_id = kid.split(":")[0]
            if keeper_id not in seen_keepers:
                seen_keepers.add(keeper_id)
                valid += 1
        except BadSignatureError:
            continue

    return payload_obj, valid
