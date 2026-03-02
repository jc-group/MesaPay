from typing import Any

from fastapi import Depends, HTTPException, Request
from jose.exceptions import JWTError

from src.auth.supabase import decode_and_verify_token


def _extract_bearer(request: Request) -> str:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    return header.replace("Bearer ", "", 1).strip()


def get_current_user(request: Request) -> dict[str, Any]:
    token = _extract_bearer(request)
    try:
        payload = decode_and_verify_token(token)
    except (JWTError, RuntimeError):
        raise HTTPException(status_code=401, detail="Token invalido")
    return payload


def require_admin_user(payload: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    app_metadata = payload.get("app_metadata") or {}
    role = app_metadata.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Accion solo para administradores")
    return payload
