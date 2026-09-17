from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import backend.app.models  # noqa: F401 -- Ensure all models are registered
from backend.app.config import settings
from backend.app.database import Base, check_db_connection, engine
from backend.app.migrations.runner import run_migrations
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
    print("[*] Starting Infosys Milestone 2 Backend API...")
    check_db_connection()
    Base.metadata.create_all(bind=engine)
    run_migrations()
    print("[OK] PostgreSQL Connected, Tables and Migrations verified successfully.")
    yield
    # Shutdown
    print("[*] Shutting down backend...")


app = FastAPI(
    title="GrowthSync API - Milestone 2",
    description="Forecasting & Predictive Analytics (Financial, Study, Habit & What-If Simulation Engine)",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Configuration for httpOnly cookie authentication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
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
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    return {"status": "healthy" if db_status == "healthy" else "degraded", "database": db_status}
