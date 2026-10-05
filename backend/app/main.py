from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import re
from fastapi.middleware.cors import CORSMiddleware

import backend.app.models  # noqa: F401 -- Ensure all models are registered
from backend.app.config import settings
from backend.app.database import Base, check_db_connection, engine
from backend.app.migrations.runner import run_migrations
from backend.app.routes.chat import router as chat_router
from backend.app.routes.activity import router as activity_router
from backend.app.routes.analytics import router as analytics_router
from backend.app.routes.auth import router as auth_router
from backend.app.routes.datasets import router as datasets_router
from backend.app.routes.expenses import router as expenses_router
from backend.app.routes.financial import router as financial_router
from backend.app.routes.habit import router as habit_router
from backend.app.routes.model_evaluation import router as model_evaluation_router
from backend.app.routes.simulation import router as simulation_router
from backend.app.routes.study import router as study_router
from backend.app.routes.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: strictly verify PostgreSQL connectivity
    print("[*] Starting GrowthSync Backend API...")
    check_db_connection()
    Base.metadata.create_all(bind=engine)
    run_migrations()
    print("[OK] PostgreSQL Connected, Tables and Migrations verified successfully.")
    yield
    # Shutdown
    print("[*] Shutting down backend...")


app = FastAPI(
    title="GrowthSync API - Milestone 4",
    description="Forecasting & Predictive Analytics (Financial, Study, Habit & What-If Simulation Engine)",
    version="4.0.0",
    lifespan=lifespan,
)

# CORS Configuration for httpOnly cookie authentication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=(r"https?://(localhost|127\.0\.0\.1)(:\d+)?" if settings.ENVIRONMENT == "development" else None),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def check_browser_origin(request: Request, call_next):
    # Cookie-authenticated writes must come from an explicitly allowed frontend.
    origin = request.headers.get("origin")
    if origin and request.method not in ("GET", "HEAD", "OPTIONS"):
        local = settings.ENVIRONMENT == "development" and re.fullmatch(r"https?://(localhost|127\.0\.0\.1)(:\d+)?", origin)
        if origin not in settings.cors_origins and not local:
            return JSONResponse(status_code=403, content={"detail":"This browser origin is not allowed."})
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


# Include API Routers
app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(financial_router)
app.include_router(expenses_router)
app.include_router(study_router)
app.include_router(habit_router)
app.include_router(activity_router)
app.include_router(datasets_router)
app.include_router(analytics_router)
app.include_router(simulation_router)
app.include_router(model_evaluation_router)


@app.get("/")
def root():
    return {
        "project": "GrowthSync - Infosys Springboard Internship Project",
        "system": "Data Collection, Forecasting & Simulation API",
        "status": "online",
        "docs_url": "/docs",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health():
    try:
        check_db_connection()
    except Exception:
        return JSONResponse(status_code=503, content={"status":"degraded", "database":"unavailable"})
    return {"status":"healthy", "database":"healthy"}
