from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Stock
from .. import analytics as an

router = APIRouter(tags=["stocks"])

RANGES = {"1W": 7, "1M": 30, "6M": 182, "1Y": 365, "5Y": 1825, "MAX": 100000}


@router.get("/stocks")
def list_stocks(
    db: Session = Depends(get_db),
    search: str = Query("", description="Match symbol or name"),
    sector: str = Query("", description="Filter by sector"),
    limit: int = Query(100, le=500),
):
    q = db.query(Stock).filter(Stock.kind == "stock")
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Stock.symbol.ilike(like), Stock.name.ilike(like)))
    if sector and sector.lower() != "all":
        q = q.filter(Stock.sector == sector)

    out = []
    for s in q.limit(limit).all():
        st = an.cached_stats(db, s.symbol)
        if not st:
            continue
        spark = an.price_frame(db, s.symbol, limit=30)["close"].round(2).tolist()
        out.append({
            "spark": spark,
            "symbol": s.symbol, "name": s.name, "sector": s.sector,
            "last": round(st["last"], 2),
            "week_change": round(st["week_change"], 2),
            "score": st["score"], "risk": an.risk_band(st["score"]),
        })
    return {"count": len(out), "stocks": out}


@router.get("/stocks/{symbol}/history")
def history(symbol: str, range: str = "1M", db: Session = Depends(get_db)):
    if range not in RANGES:
        raise HTTPException(400, f"range must be one of {list(RANGES)}")
    stock = db.get(Stock, symbol.upper())
    if not stock:
        raise HTTPException(404, "unknown symbol")
    df = an.price_frame(db, stock.symbol, limit=RANGES[range])
    if df.empty:
        raise HTTPException(404, "no price data ingested yet, run POST /ingest/run")
    return {
        "symbol": stock.symbol,
        "range": range,
        "candles": df.to_dict(orient="records"),
    }


@router.get("/stocks/{symbol}/forecast")
def stock_forecast(symbol: str, days: int = Query(30, le=90), db: Session = Depends(get_db)):
    stock = db.get(Stock, symbol.upper())
    if not stock:
        raise HTTPException(404, "unknown symbol")
    st = an.cached_stats(db, stock.symbol)
    if not st:
        raise HTTPException(404, "not enough price data for a forecast")
    return {
        "symbol": stock.symbol,
        "last": round(st["last"], 2),
        "band": "80%",
        "path": an.forecast(st, days),
        "disclaimer": "Statistical projection for education, not investment advice.",
    }


@router.get("/stocks/{symbol}/analysis")
def analysis(symbol: str, db: Session = Depends(get_db)):
    stock = db.get(Stock, symbol.upper())
    if not stock:
        raise HTTPException(404, "unknown symbol")
    st = an.cached_stats(db, stock.symbol)
    if not st:
        raise HTTPException(404, "not enough price data")
    nifty = an.cached_stats(db, "NIFTY50")
    return {
        "symbol": stock.symbol,
        "score": st["score"],
        "risk": an.risk_band(st["score"]),
        "reasons": an.reasons(st),
        "metrics": {
            "vol30": round(st["vol30"], 2),
            "mom30": round(st["mom30"], 2),
            "drawdown90": round(st["drawdown90"], 2),
            "week_change": round(st["week_change"], 2),
        },
        "vs_nifty_30d": round(st["mom30"] - nifty["mom30"], 2) if nifty else None,
    }


@router.get("/indices")
def indices(db: Session = Depends(get_db)):
    out = []
    for s in db.query(Stock).filter(Stock.kind == "index").all():
        st = an.cached_stats(db, s.symbol)
        if not st:
            continue
        df = an.price_frame(db, s.symbol, limit=60)
        out.append({
            "symbol": s.symbol, "name": s.name,
            "last": round(st["last"], 2),
            "week_change": round(st["week_change"], 2),
            "spark": [round(x, 2) for x in df["close"].tolist()],
        })
    return {"indices": out}
