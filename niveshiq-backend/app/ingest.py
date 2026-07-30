"""Fetch 5 years of daily OHLCV from Yahoo Finance and upsert into the DB.

Run manually:      python -m app.ingest
Run from the API:  POST /ingest/run  (used by n8n / cron)
"""
import datetime as dt
import logging

import yfinance as yf
from sqlalchemy.orm import Session

from .db import SessionLocal, engine, Base
from .models import Stock, Price

log = logging.getLogger("ingest")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# symbol -> (yahoo ticker, name, sector, kind)
UNIVERSE = {
    "RELIANCE":   ("RELIANCE.NS",   "Reliance Industries",       "Energy",   "stock"),
    "ONGC":       ("ONGC.NS",       "Oil & Natural Gas Corp",    "Energy",   "stock"),
    "NTPC":       ("NTPC.NS",       "NTPC Limited",              "Energy",   "stock"),
    "POWERGRID":  ("POWERGRID.NS",  "Power Grid Corp",           "Energy",   "stock"),
    "TCS":        ("TCS.NS",        "Tata Consultancy Services", "IT",       "stock"),
    "INFY":       ("INFY.NS",       "Infosys",                   "IT",       "stock"),
    "WIPRO":      ("WIPRO.NS",      "Wipro",                     "IT",       "stock"),
    "HCLTECH":    ("HCLTECH.NS",    "HCL Technologies",          "IT",       "stock"),
    "TECHM":      ("TECHM.NS",      "Tech Mahindra",             "IT",       "stock"),
    "HDFCBANK":   ("HDFCBANK.NS",   "HDFC Bank",                 "Banking",  "stock"),
    "ICICIBANK":  ("ICICIBANK.NS",  "ICICI Bank",                "Banking",  "stock"),
    "SBIN":       ("SBIN.NS",       "State Bank of India",       "Banking",  "stock"),
    "KOTAKBANK":  ("KOTAKBANK.NS",  "Kotak Mahindra Bank",       "Banking",  "stock"),
    "AXISBANK":   ("AXISBANK.NS",   "Axis Bank",                 "Banking",  "stock"),
    "BAJFINANCE": ("BAJFINANCE.NS", "Bajaj Finance",             "Finance",  "stock"),
    "ITC":        ("ITC.NS",        "ITC Limited",               "FMCG",     "stock"),
    "HINDUNILVR": ("HINDUNILVR.NS", "Hindustan Unilever",        "FMCG",     "stock"),
    "NESTLEIND":  ("NESTLEIND.NS",  "Nestle India",              "FMCG",     "stock"),
    "BRITANNIA":  ("BRITANNIA.NS",  "Britannia Industries",      "FMCG",     "stock"),
    "TATAMOTORS": ("TATAMOTORS.NS", "Tata Motors",               "Auto",     "stock"),
    "MARUTI":     ("MARUTI.NS",     "Maruti Suzuki",             "Auto",     "stock"),
    "M&M":        ("M&M.NS",        "Mahindra & Mahindra",       "Auto",     "stock"),
    "BAJAJ-AUTO": ("BAJAJ-AUTO.NS", "Bajaj Auto",                "Auto",     "stock"),
    "SUNPHARMA":  ("SUNPHARMA.NS",  "Sun Pharmaceutical",        "Pharma",   "stock"),
    "CIPLA":      ("CIPLA.NS",      "Cipla",                     "Pharma",   "stock"),
    "DRREDDY":    ("DRREDDY.NS",    "Dr Reddy's Laboratories",   "Pharma",   "stock"),
    "BHARTIARTL": ("BHARTIARTL.NS", "Bharti Airtel",             "Telecom",  "stock"),
    "ASIANPAINT": ("ASIANPAINT.NS", "Asian Paints",              "Consumer", "stock"),
    "TITAN":      ("TITAN.NS",      "Titan Company",             "Consumer", "stock"),
    "LT":         ("LT.NS",         "Larsen & Toubro",           "Infra",    "stock"),
    "ULTRACEMCO": ("ULTRACEMCO.NS", "UltraTech Cement",          "Cement",   "stock"),
    "TATASTEEL":  ("TATASTEEL.NS",  "Tata Steel",                "Metals",   "stock"),
    "JSWSTEEL":   ("JSWSTEEL.NS",   "JSW Steel",                 "Metals",   "stock"),
    # Indices
    "NIFTY50":    ("^NSEI",         "NSE Nifty 50",              "Index",    "index"),
    "SENSEX":     ("^BSESN",        "BSE Sensex",                "Index",    "index"),
}
# To cover the FULL NSE universe, replace UNIVERSE with the equity list from
# NSE's bhavcopy / nsetools, keeping the same (yahoo, name, sector, kind) shape.


def seed_stocks(db: Session) -> None:
    for sym, (yahoo, name, sector, kind) in UNIVERSE.items():
        if not db.get(Stock, sym):
            db.add(Stock(symbol=sym, yahoo=yahoo, name=name, sector=sector, kind=kind))
    db.commit()


def ingest_symbol(db: Session, sym: str, yahoo: str, period: str = "5y") -> int:
    """Download history for one symbol and upsert. Returns rows written."""
    df = yf.Ticker(yahoo).history(period=period, auto_adjust=True)
    if df is None or df.empty:
        log.warning("no data for %s (%s)", sym, yahoo)
        return 0

    existing = {
        d for (d,) in db.query(Price.date).filter(Price.symbol == sym).all()
    }
    written = 0
    for ts, row in df.iterrows():
        d = ts.date() if hasattr(ts, "date") else dt.date.fromisoformat(str(ts)[:10])
        if d in existing:
            continue
        db.add(Price(
            symbol=sym, date=d,
            open=float(row["Open"]), high=float(row["High"]),
            low=float(row["Low"]), close=float(row["Close"]),
            volume=int(row.get("Volume") or 0),
        ))
        written += 1
    db.commit()
    return written


def run_ingest(period: str = "5y") -> dict:
    """Full ingest cycle. Safe to call daily; only new dates are inserted."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    summary = {"ok": [], "failed": [], "rows": 0}
    try:
        seed_stocks(db)
        for sym, (yahoo, *_rest) in UNIVERSE.items():
            try:
                n = ingest_symbol(db, sym, yahoo, period)
                summary["ok"].append(sym)
                summary["rows"] += n
                log.info("%s: +%d rows", sym, n)
            except Exception as e:  # noqa: BLE001
                db.rollback()
                summary["failed"].append({"symbol": sym, "error": str(e)})
                log.error("%s failed: %s", sym, e)
    finally:
        db.close()
    return summary


if __name__ == "__main__":
    result = run_ingest()
    print(f"Ingest done. {len(result['ok'])} ok, {len(result['failed'])} failed, "
          f"{result['rows']} new rows.")
