"""All the quant logic: stats, safety score, explanations, forecasts, scenarios.

Formulas intentionally mirror the frontend demo so numbers stay consistent.
"""
import math
import time

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from .models import Price

_CACHE: dict = {}
_TTL = 3600  # seconds


def price_frame(db: Session, symbol: str, limit: int | None = None) -> pd.DataFrame:
    rows = (
        db.query(Price)
        .filter(Price.symbol == symbol)
        .order_by(Price.date.asc())
        .all()
    )
    if limit:
        rows = rows[-limit:]
    return pd.DataFrame(
        [
            {
                "date": r.date.isoformat(),
                "open": r.open,
                "high": r.high,
                "low": r.low,
                "close": r.close,
                "volume": r.volume,
            }
            for r in rows
        ]
    )


def compute_stats(closes: pd.Series) -> dict | None:
    """Volatility, momentum, drawdown, drift, and the 0-100 safety score."""
    n = len(closes)
    if n < 60:
        return None
    c = closes.to_numpy(dtype=float)
    last = float(c[-1])

    rets30 = c[-30:] / c[-31:-1] - 1
    vol30 = float(np.std(rets30, ddof=0) * 100)
    mom30 = float((c[-1] / c[-31] - 1) * 100)

    win = c[-90:] if n >= 90 else c
    peaks = np.maximum.accumulate(win)
    dd = float(np.max((peaks - win) / peaks) * 100)

    tail = c[-251:] if n >= 251 else c
    logret = np.diff(np.log(tail))
    mu = float(np.mean(logret))
    sig = float(np.std(logret, ddof=0))

    wk = float((c[-1] / c[-8] - 1) * 100) if n >= 8 else 0.0
    above30 = bool(last > float(np.mean(c[-30:])))

    score = round(
        min(96, max(8,
            92 - vol30 * 22 - dd * 0.9
            + max(-6.0, min(6.0, mom30)) * 1.6
            + (4 if above30 else -4)
        ))
    )
    return {
        "last": last, "vol30": vol30, "mom30": mom30, "drawdown90": dd,
        "mu": mu, "sigma": sig, "week_change": wk, "above_30dma": above30,
        "score": score,
    }


def reasons(st: dict) -> list[str]:
    v = st["vol30"]
    out = [
        (f"Low volatility · {v:.1f}% daily" if v < 1.0
         else f"Moderate volatility · {v:.1f}% daily" if v < 1.4
         else f"High volatility · {v:.1f}% daily"),
        "Trading above 30-day average" if st["above_30dma"] else "Below its 30-day average",
        f"90-day drawdown {st['drawdown90']:.1f}%",
        (f"Momentum +{st['mom30']:.1f}% this month" if st["mom30"] >= 0
         else f"Momentum {st['mom30']:.1f}% this month"),
    ]
    return out


def risk_band(score: int) -> str:
    return "lower" if score >= 70 else "moderate" if score >= 45 else "higher"


def cached_stats(db: Session, symbol: str) -> dict | None:
    now = time.time()
    hit = _CACHE.get(symbol)
    if hit and now - hit[0] < _TTL:
        return hit[1]
    df = price_frame(db, symbol)
    st = compute_stats(df["close"]) if not df.empty else None
    _CACHE[symbol] = (now, st)
    return st


def invalidate_cache() -> None:
    _CACHE.clear()


def forecast(st: dict, days: int = 30) -> list[dict]:
    """Log-normal projection: median path + 80% confidence band."""
    S, mu, sig = st["last"], st["mu"], st["sigma"]
    out = []
    for d in range(days + 1):
        med = S * math.exp((mu - 0.5 * sig**2) * d)
        w = 1.28 * sig * math.sqrt(d)
        out.append({
            "day": d,
            "median": round(med, 2),
            "low": round(med * math.exp(-w), 2),
            "high": round(med * math.exp(w), 2),
        })
    return out


def position_scenarios(st: dict, qty: int, buy_price: float, months: int) -> dict:
    S, mu, sig = st["last"], st["mu"], st["sigma"]
    pts = []
    for m in range(months + 1):
        d = m * 30
        base = S * math.exp((mu - 0.5 * sig**2) * d)
        w = sig * math.sqrt(d)
        pts.append({
            "month": m,
            "bull": round(base * math.exp(0.9 * w) * qty, 2),
            "base": round(base * qty, 2),
            "bear": round(base * math.exp(-0.9 * w) * qty, 2),
        })
    cost = qty * buy_price
    end = pts[-1]
    pl_base, pl_bull, pl_bear = end["base"] - cost, end["bull"] - cost, end["bear"] - cost

    if pl_bear > 0:
        action, note = "hold", "Even the bear case stays profitable at this horizon."
    elif pl_base > cost * 0.08:
        action, note = "hold_with_stoploss", "Base case looks healthy, but protect the downside near your buy price."
    elif pl_base < -cost * 0.05:
        action, note = "review", "Base case projects a loss. Consider trimming, or average down only with conviction."
    else:
        action, note = "wait", "Projections are near breakeven. Let the trend confirm before adding."

    return {
        "cost": round(cost, 2),
        "points": pts,
        "pl": {"base": round(pl_base, 2), "bull": round(pl_bull, 2), "bear": round(pl_bear, 2)},
        "action": action,
        "note": note,
    }


def sip_projection(closes: pd.Series, monthly: float, years: int) -> dict:
    c = closes.to_numpy(dtype=float)
    span_years = max(1.0, len(c) / 252)
    cagr = (c[-1] / c[0]) ** (1 / span_years) - 1
    r = (1 + cagr) ** (1 / 12) - 1
    v = 0.0
    pts = []
    for m in range(years * 12 + 1):
        if m:
            v = v * (1 + r) + monthly
        if m % 12 == 0:
            pts.append({"year": m // 12, "invested": round(monthly * m, 2), "value": round(v, 2)})
    return {"cagr": round(cagr * 100, 2), "points": pts}
