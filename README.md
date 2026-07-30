<div align="center">

# 📈 NiveshIQ

### *Nivesh* (निवेश) means "investment" — an Indian stock analytics app that explains itself.

Real NSE/BSE data · animated charts · explainable safety scores · paper trading · built for learning, not gambling

[![Made with FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Made with React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/bundler-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Data via yfinance](https://img.shields.io/badge/data-yfinance-9c27b0)](https://github.com/ranaroussi/yfinance)
[![Automated with n8n](https://img.shields.io/badge/automation-n8n-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](#-license)

<a href="#-quick-start"><strong>Quick Start</strong></a> ·
<a href="#-features"><strong>Features</strong></a> ·
<a href="#-architecture"><strong>Architecture</strong></a> ·
<a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
<a href="#-roadmap"><strong>Roadmap</strong></a>

</div>

<br>

> [!IMPORTANT]
> NiveshIQ is an **educational project**. Safety scores, forecasts, and "recommendations" are statistical outputs from historical price data, not investment advice, and nobody on this project is a SEBI-registered advisor. Markets carry risk. Please read scheme documents and consult a professional before investing real money.

<br>

## 🖥️ Interface Preview

```text
+--------------------------------------+
|  NiveshIQ                 [D] [B]    |
|  NSE . BSE markets                   |
+--------------------------------------+
|                                      |
|  MY PORTFOLIO (paper trading)        |
|                                      |
|  Rs 1.03 L         Profit            |
|                     +Rs 3.2K ^       |
|  [$] Practice, zero risk             |
|                                      |
|  MARKET INDICES                      |
|  +------------+ +------------+       |
|  | NIFTY 50   | | SENSEX     |       |
|  | 24,912 +.6%| | 81,604 +.5%|       |
|  | ..--^^--^^ | | ..--^^--^^ |       |
|  +------------+ +------------+       |
|                                      |
|  EXPLORE NSE             33 stocks   |
|  +----------------------------+      |
|  | [?] Search name or symbol  |      |
|  +----------------------------+      |
|  [All] [IT] [Banking] [FMCG] >       |
|  +----------------------------+      |
|  | T  TCS          ..-^^ 4,182|      |
|  |    Tata Consult..   +0.8% ^|      |
|  |----------------------------|      |
|  | H  HDFCBANK     .-^^^ 1,687|      |
|  |    HDFC Bank        +1.1% ^|      |
|  |----------------------------|      |
|  | R  RELIANCE     ^^--. 2,958|      |
|  |    Reliance Ind     -0.3% v|      |
|  +----------------------------+      |
|                                      |
|  +--------------------------+        |
|  | Home  Picks  Sim  Port  Lrn|      |
|  +--------------------------+        |
+--------------------------------------+
```

<details>
<summary><strong>Click to see the stock detail screen — candles + safety score</strong></summary>

```text
+--------------------------------------+
|  < Back        TCS         [*]       |
|                                      |
|      Tata Consultancy . IT           |
|         Rs 4,182.30                  |
|     +0.84% 1W   [Positive]           |
|                                      |
|  [1W][1M][6M][1Y][5Y]   Line | Candle|
|  +----------------------------+      |
|  |     |   |                  |      |
|  |  |  | | | |  |              |     |
|  |  | || | | |  |    |         |     |
|  |__|_||_|_|_|__|____|______   |     |
|  |.:.:.:.:.:.:.:.:.:.:.: vol   |     |
|  +----------------------------+      |
|                                      |
|  +-----------+ +----------------+    |
|  | ( 78 )    | |Why score       |    |
|  | safety    | |-Low volatility |    |
|  | score     | |-Above 30d avg  |    |
|  |           | |-Momentum +2.1% |    |
|  |Lower risk | +----------------+    |
|  +-----------+                       |
|                                      |
|  [T] Time machine                    |
|  Rs 10,000 in TCS, 3 yrs ago  =>     |
|         Rs 14,220 today (+42.2%)     |
|                                      |
|  +----------------------------+      |
|  | Paper trade      Hold: 5   |      |
|  | [ - 1 + ]   [ Buy Rs4,182 ]|      |
|  +----------------------------+      |
+--------------------------------------+
```

</details>

<sub>Sketched in ASCII because GitHub won't run our animations for us — <a href="#-quick-start">clone it</a> and watch the real thing move.</sub>

<br>

## 🪞 What is this, really?

Most beginner stock apps either drown you in candlesticks and jargon, or oversimplify to the point of being useless. NiveshIQ tries to sit in between: **every number on screen comes with a plain-English reason next to it.**

See a safety score of 78? Tap it, and the app tells you *why* — "Low volatility · 0.8% daily", "Trading above its 30-day average". See a forecast? It's drawn as a *cone of uncertainty*, not a confident line pretending to know the future. That philosophy — show the number, then show your work — runs through the entire app.

<br>

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📊 Live market data
Real NSE prices for 30+ large-caps across every major sector, plus **Nifty 50** and **Sensex**, refreshed daily via Yahoo Finance.

### 🕯️ Dual chart modes
Toggle between a smooth animated line chart and full OHLC **candlesticks with volume bars** — because real traders read candles.

### 🛡️ Explainable safety scores
A 0–100 score from volatility, drawdown, and momentum — always paired with the *reasons* behind the number, not just the number.

### 🔮 Forecast cones, not fortune-telling
30-day projections shown as an 80% confidence band, so uncertainty is visible instead of hidden.

</td>
<td width="50%" valign="top">

### 💰 Paper trading wallet
A virtual ₹1,00,000 to buy and sell with — zero real risk, real market prices, full P/L tracking (realized *and* unrealized).

### 📉 Position & SIP simulators
"What happens to my money if I buy 10 shares today?" gets a bull/base/bear projection. "What if I SIP ₹5,000/month for 10 years?" gets a real CAGR-based growth chart.

### 🎓 Built-in beginner course
Bite-sized modules on volatility, SIPs, candlesticks, and compounding — capped off with a quiz that unlocks a badge.

### 🌗 Dark mode, search, watchlists
A search bar that actually searches the server, sector filters, a star-to-watch system, and a full day/night theme.

</td>
</tr>
</table>

<br>

<details>
<summary><strong>🖱️ Click to see the full feature list</strong></summary>
<br>

- Server-side, debounced stock search across the full universe
- Sector filter chips (IT, Banking, FMCG, Auto, Pharma, and more)
- Scrollable stock list with custom-styled scrollbar
- "Time machine" — *"If you'd invested ₹10,000 in TCS 3 years ago..."*
- Per-stock "Beats / Lags Nifty" benchmark comparison
- Simulated news sentiment signals per stock
- Portfolio sector-concentration donut chart with a diversification nudge
- Full transaction history log
- Skeleton loading states everywhere — nothing ever just "pops in"
- Friendly offline screen with a retry button if the API is unreachable

</details>

<br>

## 🏗️ Architecture

```text
+------------------+    +--------------------+    +--------------------+
| Yahoo Finance    |    | FastAPI backend    |    | React frontend     |
| (yfinance lib)   |    |                    |    |                    |
|                  |    | - SQLite/Postgres  |    | - Vite + Recharts  |
| 5yr OHLCV daily  | -> | - Safety scoring   | -> | - Dark mode        |
| Nifty + Sensex   |    | - Forecasting      |    | - Paper wallet     |
+------------------+    | - Simulations      |    +--------------------+
                        +--------------------+                          

                   ^
                   | POST /ingest/run (scheduled)
                   +----------------------+
                   | n8n                  |
                   |                      |
                   | Weekday 6:30 PM IST  |
                   | trigger + Telegram   |
                   | failure alert        |
                   +----------------------+
```

**The daily loop:** after NSE closes, n8n (or the backend's built-in scheduler) calls `POST /ingest/run` → FastAPI pulls fresh OHLCV via yfinance → new rows are upserted into the database (existing dates are never re-fetched) → the analytics cache is invalidated → the next request recomputes fresh scores. If it fails, n8n pings a Telegram bot instantly.

<br>

## 🚀 Quick Start

<details open>
<summary><strong>1️⃣ Backend</strong></summary>

```bash
cd niveshiq-backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python -m app.ingest            # pull 5 years of real NSE data (~2-5 min)
uvicorn app.main:app --reload   # → http://localhost:8000/docs
```
</details>

<details>
<summary><strong>2️⃣ Frontend</strong></summary>

```bash
cd niveshiq-app
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev                     # → http://localhost:5173
```
</details>

<details>
<summary><strong>3️⃣ Automation (optional, but a nice resume line)</strong></summary>

```bash
npx n8n                         # → http://localhost:5678
```
Import `niveshiq-backend/n8n_daily_ingest.json`, point the HTTP node at your backend, set the `X-Token` header, and publish. Full walkthrough in [`niveshiq-backend/README.md`](niveshiq-backend/README.md).
</details>

<br>

## 🧰 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React (Vite) + Recharts + Lucide icons | Fast dev server, composable charts, clean icon set |
| **Backend** | FastAPI + SQLAlchemy | Async-ready, auto-generated Swagger docs, typed models |
| **Data** | yfinance + pandas/numpy | Free, reliable NSE/BSE historical data |
| **Database** | SQLite (dev) → Postgres (prod) | Zero-config locally, drop-in swap via `DATABASE_URL` |
| **Automation** | n8n | Visual scheduling + Telegram alerting, no glue code |
| **Deployment** | Render (API) + Vercel (frontend) | Free tiers, Docker-native, auto-deploy on push |

<br>

## 📡 API at a glance

Full interactive docs live at `/docs` once the backend is running. Highlights:

| Endpoint | Returns |
|---|---|
| `GET /stocks?search=&sector=` | Searchable, filterable stock list with live scores |
| `GET /stocks/{symbol}/history` | OHLCV candles for any range (1W → 5Y) |
| `GET /stocks/{symbol}/analysis` | Safety score, risk band, plain-language reasons |
| `GET /stocks/{symbol}/forecast` | 30-day median path + 80% confidence band |
| `GET /recommendations/weekly` | Top-5 safest picks, explained |
| `POST /simulate/position` | Bull/base/bear P/L projection for a trade |
| `POST /simulate/sip` | Long-term SIP growth projection |

<br>

## 🗺️ Roadmap

- [ ] Full Nifty 500 universe (currently 30+ hand-picked large-caps)
- [ ] Real news sentiment via a live headlines API
- [ ] Price alerts (n8n polling + Telegram push)
- [ ] Migrate candlesticks to `lightweight-charts` for pro-grade rendering
- [ ] TanStack Query + Zustand for smarter client-side caching
- [ ] TypeScript pass on the frontend

<br>

## 🤝 Contributing

This started as a learning project, and PRs, issues, and "hey this score formula could be smarter" suggestions are all welcome. Fork it, branch it, send a pull request.

## 📄 License

MIT — do what you like with it, just don't sell it as financial advice.

<br>

<div align="center">

*Built with curiosity about markets, and a healthy respect for how little any of us can actually predict them.*

</div>
