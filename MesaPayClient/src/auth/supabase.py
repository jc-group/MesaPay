import os
import time
from typing import Any

import requests
from jose import jwt
from jose.exceptions import JWTError

JWKS_CACHE_TTL_SECONDS = 3600

_jwks_cache: dict[str, Any] = {"keys": [], "expires_at": 0.0}


def _get_supabase_url() -> str | None:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    return url.strip() if url else None


def _get_expected_audience() -> str | None:
    aud = os.getenv("SUPABASE_JWT_AUD")
    return aud.strip() if aud else None


def _get_expected_issuer() -> str | None:
    supabase_url = _get_supabase_url()
    if not supabase_url:
        return None
    return f"{supabase_url}/auth/v1"


def _fetch_jwks() -> dict[str, Any]:
    supabase_url = _get_supabase_url()
    if not supabase_url:
        raise RuntimeError("SUPABASE_URL no esta configurado")

    response = requests.get(f"{supabase_url}/auth/v1/keys", timeout=5)
    response.raise_for_status()
    return response.json()


def _get_jwks() -> dict[str, Any]:
    now = time.time()
    if _jwks_cache["keys"] and _jwks_cache["expires_at"] > now:
        return _jwks_cache

    jwks = _fetch_jwks()
    _jwks_cache["keys"] = jwks.get("keys", [])
    _jwks_cache["expires_at"] = now + JWKS_CACHE_TTL_SECONDS
    return _jwks_cache


def _find_key(jwks: dict[str, Any], kid: str) -> dict[str, Any] | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


def decode_and_verify_token(token: str) -> dict[str, Any]:
    jwks = _get_jwks()
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise JWTError("Token sin kid")

    key = _find_key(jwks, kid)
    if not key:
        raise JWTError("Token kid invalido")

    options = {
        "verify_aud": _get_expected_audience() is not None,
    }

    payload = jwt.decode(
        token,
        key,
        algorithms=[key.get("alg", "RS256")],
        audience=_get_expected_audience(),
        issuer=_get_expected_issuer(),
        options=options,
    )
    return payload
