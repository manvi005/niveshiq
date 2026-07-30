"""NiveshIQ backend.

Run:  uvicorn app.main:app --reload
Docs: http://localhost:8000/docs
"""
import os

from fastapi import FastAPI, Header, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .db import engine, Base
from .ingest import run_ingest
from .analytics import invalidate_cache
from .routers import stocks, insights

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NiveshIQ API",
    version="1.0.0",
    description="Indian stock analytics: prices, safety scores, forecasts, simulations. Educational use only.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("FRONTEND_ORIGIN", "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(insights.router)

INGEST_TOKEN = os.getenv("INGEST_TOKEN", "change-me")


@app.get("/health")
def health():
    return {"status": "ok"}


def _ingest_job():
    run_ingest()
    invalidate_cache()


@app.post("/ingest/run")
def ingest_run(background: BackgroundTasks, x_token: str = Header(default="")):
    """Trigger a data refresh. Called by n8n / cron after market close.

    Protect with header:  X-Token: <INGEST_TOKEN>
    """
    if x_token != INGEST_TOKEN:
        raise HTTPException(401, "invalid token")
    background.add_task(_ingest_job)
    return {"status": "started", "note": "ingest running in background; check server logs"}


# Optional built-in scheduler (alternative to n8n/cron): set ENABLE_SCHEDULER=1
if os.getenv("ENABLE_SCHEDULER") == "1":
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    scheduler.add_job(_ingest_job, "cron", day_of_week="mon-fri", hour=18, minute=30)
    scheduler.start()
