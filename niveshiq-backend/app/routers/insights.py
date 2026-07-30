from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Stock
from .. import analytics as an

router = APIRouter(tags=["insights"])


@router.get("/recommendations/weekly")
def weekly_recommendations(top: int = 5, db: Session = Depends(get_db)):
    scored = []
    for s in db.query(Stock).filter(Stock.kind == "stock").all():
        st = an.cached_stats(db, s.symbol)
        if st:
            scored.append((s, st))
    scored.sort(key=lambda x: x[1]["score"], reverse=True)
    picks = [
        {
            "rank": i + 1,
            "symbol": s.symbol,
            "name": s.name,
            "sector": s.sector,
            "score": st["score"],
            "risk": an.risk_band(st["score"]),
            "reasons": an.reasons(st),
            "last": round(st["last"], 2),
        }
        for i, (s, st) in enumerate(scored[:top])
    ]
    return {
        "picks": picks,
        "disclaimer": "Educational analysis based on last week's data, not investment advice.",
    }


class PositionReq(BaseModel):
    symbol: str
    qty: int = Field(gt=0, le=100000)
    buy_price: float = Field(gt=0)
    months: int = Field(6, gt=0, le=60)


@router.post("/simulate/position")
def simulate_position(req: PositionReq, db: Session = Depends(get_db)):
    stock = db.get(Stock, req.symbol.upper())
    if not stock:
        raise HTTPException(404, "unknown symbol")
    st = an.cached_stats(db, stock.symbol)
    if not st:
        raise HTTPException(404, "not enough price data")
    result = an.position_scenarios(st, req.qty, req.buy_price, req.months)
    result["symbol"] = stock.symbol
    result["disclaimer"] = "Scenario projection for education, not investment advice."
    return result


class SipReq(BaseModel):
    index: str = "NIFTY50"
    monthly: float = Field(gt=0)
    years: int = Field(10, gt=0, le=40)


@router.post("/simulate/sip")
def simulate_sip(req: SipReq, db: Session = Depends(get_db)):
    idx = db.get(Stock, req.index.upper())
    if not idx or idx.kind != "index":
        raise HTTPException(404, "index must be NIFTY50 or SENSEX")
    df = an.price_frame(db, idx.symbol)
    if df.empty:
        raise HTTPException(404, "no price data ingested yet")
    result = an.sip_projection(df["close"], req.monthly, req.years)
    result["index"] = idx.symbol
    result["disclaimer"] = "Projection assumes historical CAGR continues, which is not guaranteed."
    return result
