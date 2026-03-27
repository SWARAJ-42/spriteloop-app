from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, preprocess, projects, generations, payments, webhooks
from app.db.base import Base
from app.db.session import engine
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="FastAPI Firebase Auth", redirect_slashes=False)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# 1. Standard CORS middleware for your API routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "https://spriteloop.eastus2.cloudapp.azure.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Database startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/api/proxy")
async def proxy_blob(url: str):
    import httpx

    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        return Response(
            content=res.content,
            media_type=res.headers.get("content-type")
        )

# 5. Include your routers
app.include_router(auth.router, prefix="/api")
app.include_router(preprocess.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(generations.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
