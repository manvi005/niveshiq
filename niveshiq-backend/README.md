# NiveshIQ backend

FastAPI backend for the NiveshIQ stock app. Fetches real NSE data via Yahoo Finance, stores it in SQLite/Postgres, and serves prices, safety scores, forecasts and simulations. Educational use only, not investment advice.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 1. Pull 5 years of real NSE data (takes a couple of minutes)
python -m app.ingest

# 2. Start the API
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for interactive Swagger docs.

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/stocks?search=tata&sector=Auto` | List/search stocks with price, weekly change, safety score |
| GET | `/stocks/{symbol}/history?range=1M` | OHLCV candles. Ranges: 1W 1M 6M 1Y 5Y MAX |
| GET | `/stocks/{symbol}/forecast?days=30` | Median path + 80% confidence band |
| GET | `/stocks/{symbol}/analysis` | Score, risk band, plain-language reasons, vs-Nifty comparison |
| GET | `/indices` | Nifty 50 and Sensex with sparkline data |
| GET | `/recommendations/weekly` | Top 5 safest stocks with explanations |
| POST | `/simulate/position` | `{symbol, qty, buy_price, months}` → bull/base/bear P/L + suggested action |
| POST | `/simulate/sip` | `{index, monthly, years}` → SIP growth projection |
| POST | `/ingest/run` | Refresh market data (header `X-Token` required). Used by n8n/cron |
| GET | `/health` | Liveness check |

## Wiring the React frontend

Set the API base URL and replace synthetic data with fetches:

```ts
const API = import.meta.env.VITE_API_URL;   // e.g. http://localhost:8000

// Home list        -> GET  `${API}/stocks?search=${q}&sector=${sector}`
// Detail chart     -> GET  `${API}/stocks/${sym}/history?range=${range}`
// Forecast cone    -> GET  `${API}/stocks/${sym}/forecast`
// Score + reasons  -> GET  `${API}/stocks/${sym}/analysis`
// Picks tab        -> GET  `${API}/recommendations/weekly`
// Simulate tab     -> POST `${API}/simulate/position` / `${API}/simulate/sip`
```

Set `FRONTEND_ORIGIN=https://your-app.vercel.app` in production so CORS is locked to your domain.

## Configuration (env vars)

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./niveshiq.db` | Point to Postgres in production |
| `INGEST_TOKEN` | `change-me` | Shared secret for `/ingest/run` |
| `FRONTEND_ORIGIN` | `*` | Comma-separated allowed CORS origins |
| `ENABLE_SCHEDULER` | off | Set `1` to self-schedule ingest daily at 18:30 IST |

## Keeping data fresh: three options

1. **n8n (recommended if you want it on your resume):** import `n8n_daily_ingest.json`, set the backend URL, add env var `NIVESHIQ_INGEST_TOKEN`, connect Telegram credentials. It calls `POST /ingest/run` every weekday at 6:30 PM IST and alerts you if the call fails.
2. **Built-in:** set `ENABLE_SCHEDULER=1`. Zero extra infrastructure.
3. **cron / GitHub Actions:** `curl -X POST -H "X-Token: $TOKEN" https://your-api/ingest/run`

## Deploy

```bash
docker build -t niveshiq-api .
docker run -p 8000:8000 -e INGEST_TOKEN=supersecret niveshiq-api
```

Works as-is on Render/Railway (point them at the Dockerfile). Use their free Postgres and set `DATABASE_URL`. Run `python -m app.ingest` once after first deploy, then let n8n/cron handle daily refreshes.

## Extending to the full NSE universe

Replace the `UNIVERSE` dict in `app/ingest.py` with the complete equity list from NSE's daily bhavcopy (or the `nsetools` package), keeping the same shape. Everything downstream (search, scores, recommendations) adapts automatically. With ~2,000 symbols, switch to Postgres and consider batching yfinance downloads.
