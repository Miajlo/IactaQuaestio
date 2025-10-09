from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import init_db, close_db
from app.routers import faculty_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting application...")
    await init_db()
    yield
    print("Shutting down application...")
    await close_db()


app = FastAPI(
    title="My FastAPI App",
    description="FastAPI with MongoDB and Beanie",
    version="1.0.0",
    lifespan=lifespan
)

# Import and include router with error handling
try:
    from app.routers.test_router import test_router

    app.include_router(test_router, prefix="/tests", tags=["tests"])
    app.include_router(faculty_router,prefix="/faculties", tags=["faculties"])
    print("Users router loaded successfully")
except Exception as e:
    print(f"Failed to load users router: {e}")
    import traceback

    traceback.print_exc()


@app.get("/")
async def root():
    return {
        "message": "Welcome to FastAPI with MongoDB!",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


