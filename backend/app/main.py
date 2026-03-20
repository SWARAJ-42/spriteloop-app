from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, preprocess, projects, generations
from app.db.base import Base
from app.db.session import engine
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="FastAPI Firebase Auth")

# 1. Standard CORS middleware for your API routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Custom StaticFiles class to forcefully inject CORS headers into file responses
class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*" 
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

# 3. Mount the custom StaticFiles application
app.mount(
    "/static", 
    CORSStaticFiles(directory=os.path.join(BASE_DIR, "static")), 
    name="static"
)

# 4. Database startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# 5. Include your routers
app.include_router(auth.router, prefix="/api")
app.include_router(preprocess.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(generations.router, prefix="/api")