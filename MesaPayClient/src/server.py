import os

import uvicorn

from src.app import create_app

app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", "3001"))
    uvicorn.run("src.server:app", host="0.0.0.0", port=port)
