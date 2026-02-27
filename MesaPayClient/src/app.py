from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes.api import api_router
from src.routes.health import health_router


def create_app() -> FastAPI:
    app = FastAPI(title="MesaPayClient", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(api_router, prefix="/api")
    return app
