from fastapi import APIRouter
from fastapi.responses import JSONResponse

from src.db.ping import ping_database

api_router = APIRouter()


@api_router.get("/v1/version")
def version() -> dict[str, str]:
    return {"version": "0.1.0"}


@api_router.get("/v1/db/ping")
def db_ping() -> dict[str, str]:
    try:
        ping_database()
        return {"db": "ok"}
    except Exception:
        return JSONResponse(status_code=500, content={"db": "error"})
