# ⚡ MarketInsight — Institutional AI Financial Terminal & Quant Workstation

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.118-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20Lite-orange?logo=google&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-LangGraph-darkgreen?logo=langchain&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**An institutional-grade, AI-powered stock market terminal providing deterministic quantitative valuation models, real-time interactive financial charting, automated market breadth heatmaps, and an autonomous quant analyst agent with a zero-hallucination policy.**

[Features](#-core-features) • [Architecture](#-system-architecture) • [API Reference](#-rest-api-specification) • [Quickstart](#-quickstart-guide) • [Quant Models](#-quantitative-models--formulae)

</div>

---

## 📌 Why MarketInsight?

Standard Large Language Models (ChatGPT, Claude, generic Gemini chat) are conversational engines trained on historical text. When asked for stock prices, balance sheet metrics, or valuation multiples, they frequently **hallucinate numbers**, reference outdated historical cutoffs, or provide vague generic disclaimers.

**MarketInsight solves this through a Deterministic Tool-Chain Architecture:**
- **Zero-Guess Policy**: The AI agent is strictly bound to execute verifiable Python financial tools against live exchange gateways before answering.
- **Transparent Audit Trail**: Every response provides an explicit **Verified Live Market Sources** citation badge showing the exact tool calls, raw returns, and data timestamps.
- **Interactive Financial Engineering**: Moves beyond plain text chat by providing **interactive SVG charting**, **dynamic DCF valuation sliders**, and **real-time sector treemaps** that no text LLM can deliver inside a chat window.

---

## 🌟 Core Features

### 1. 💬 AI Quant Analyst Terminal (Voice & Text)
- **Deterministic Multi-Tool Orchestration**: Autonomous agent powered by Google Gemini and LangGraph. Automatically triggers tools for live stock prices, balance sheets, cash flow statements, institutional ownership, insider trades, and analyst price targets.
- **Live Audit Trail**: Displays a transparent badge below every answer with exact function signatures and raw exchange data.
- **Voice-to-Intel**: Tap the microphone icon to query the market verbally using the Web Speech API with real-time soundwave animations.
- **1-Click Research Export**: Export complete institutional research dossiers to Markdown (`.md`) format.

### 2. 📈 Interactive Quant Chart Studio (TradingView Style)
- **Time-Series Charting**: High-performance SVG area/candlestick visualization with multi-timeframe switching (`5D`, `1MO`, `6MO`, `1Y`, `5Y`).
- **Interactive Crosshair**: Hover across any date to inspect historical close, daily return %, and traded volume.
- **Toggleable Moving Average**: Real-time 20-period Simple Moving Average (SMA 20) overlay.
- **Technical Signal Needle**: Mathematical **14-period RSI (Relative Strength Index)** combined with trend indicators to synthesize an automated signal: `STRONG BUY`, `BUY`, `NEUTRAL`, `SELL`, or `STRONG SELL`.

### 3. 🎛️ Interactive DCF Valuation Simulator
- **Dynamic Scenario Analysis**: Interactive sliders for:
  - **Expected Free Cash Flow Growth Rate %** (`-5%` to `+35%`)
  - **Hurdle Discount Rate / WACC %** (`6%` to `18%`)
- **Real-Time Intrinsic Value Engine**: Watch the estimated Intrinsic Fair Value and **Margin of Safety %** (`Undervalued 🟢` / `Overvalued 🔴`) recalculate live on screen as you drag the sliders.
- **AI Valuation Cross-Examination**: Click *"Request Full AI DCF Report"* to have the agent cross-examine your simulated assumptions against SEC/exchange filings.

### 4. 🗺️ Live Market Sector Treemap Heatmap
- **Visual Industry Breadth**: Real-time performance treemap across key sectors:
  - **Information Technology** (TCS, Infosys, Nvidia, Apple)
  - **Banking & Financial Services** (HDFC Bank, ICICI Bank, State Bank of India)
  - **Energy & Conglomerates** (Reliance Industries, ONGC, NTPC)
  - **Automobile & Metals** (Maruti, Tata Steel, Mahindra)
- **Direct Drilldown**: Click any asset tile to instantly load its interactive quant studio.

### 5. 🧠 Algorithmic Market Pulse & Sentiment Radar
- **Live Ticker Marquee**: Continuous real-time quotes for NIFTY 50, SENSEX, S&P 500, NASDAQ, Reliance, and TCS.
- **Fear & Greed Index (0–100)**: Computed dynamically on your backend from market advance-decline breadth and index momentum.

### 6. ⭐ Quantitative Watchlist & ⚔️ Versus Duel Arena
- **Persistent Watchlist**: Pin assets with real-time prices and **7-day SVG sparkline trajectories**, stored persistently in browser `localStorage`.
- **Head-to-Head Duel Arena**: Pit any two assets (e.g., `TCS.NS vs INFY.NS` or `AAPL vs MSFT`) into an automated algorithmic showdown comparing valuation, growth, margins, and analyst consensus.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React 19 + Vite)                       │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────────┐  │
│  │ AI Quant Terminal│  │ Quant Chart & DCF │  │ Sector Treemap & Watchlist│ │
│  └─────────┬────────┘  └─────────┬─────────┘  └────────────┬─────────────┘  │
└────────────┼─────────────────────┼─────────────────────────┼────────────────┘
             │ Stream Chunks       │ JSON / Fast Info        │ REST Polling
             ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI + Python 3.13)                     │
│                                                                             │
│  [POST /api/chat]        [GET /api/chart-data]     [GET /api/market-pulse]  │
│  [GET /api/stock-quote]  [GET /api/market-heatmap] [GET /health]            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LANGGRAPH / LANGCHAIN AGENT ENGINE                    │
│                                                                             │
│  ┌────────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │     Google Gemini AI Reasoner      │  │      16 Financial Tools       │  │
│  │    (gemini-flash-lite-latest)      │◄─┤  - get_stock_price            │  │
│  │  - Decides required tool queries   │  │  - get_balance_sheet          │  │
│  │  - Synthesizes final quant answers │  │  - get_cash_flow / dividends  │  │
│  │  - Filters raw tool outputs        │  │  - get_analyst_recommendations│  │
│  └────────────────────────────────────┘  └───────────────┬───────────────┘  │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                           │
                                                           ▼
                                            ┌──────────────────────────────┐
                                            │   YAHOO FINANCE API GATEWAY  │
                                            │  Real-Time NSE / BSE / US    │
                                            └──────────────────────────────┘
```

---

## 🧰 16 Specialized Financial Tools

The agent has access to 16 specialized quantitative tools defined in `MarketInsight/utils/tools.py`:

| # | Tool Name | Description |
|---|---|---|
| 1 | `get_stock_price` | Fetches real-time market price via fast_info pipeline with exchange fallback. |
| 2 | `get_historical_data` | Returns OHLCV historical time-series data between specified dates. |
| 3 | `get_stock_news` | Retrieves the latest curated market headlines for a given ticker. |
| 4 | `get_balance_sheet` | Extracts company balance sheet (assets, liabilities, stockholder equity). |
| 5 | `get_income_statement` | Retrieves financial statements (revenues, operating margins, net income). |
| 6 | `get_cash_flow` | Returns cash flow statement (operating cash flow, free cash flow, CapEx). |
| 7 | `get_company_info` | Retrieves company profile, sector, forward P/E, PEG ratio, and market cap. |
| 8 | `get_dividends` | Extracts historical dividend payments and dividend yield tracking. |
| 9 | `get_splits` | Returns historical stock split events and ratios. |
| 10 | `get_institutional_holders` | Lists top institutional owners and percentage of shares held. |
| 11 | `get_major_shareholders` | Returns breakdown of insider vs. institutional ownership. |
| 12 | `get_mutual_fund_holders` | Identifies mutual fund ownership percentages and portfolio allocations. |
| 13 | `get_insider_transactions` | Tracks insider purchases, sales, and share counts over recent quarters. |
| 14 | `get_analyst_recommendations` | Retrieves chronological analyst rating history (Buy/Hold/Sell). |
| 15 | `get_analyst_recommendations_summary` | Returns consensus price targets (Mean, High, Low) and recommendation scores. |
| 16 | `get_ticker` | Resolves company names into exchange-valid ticker symbols (e.g. "TCS" ➔ "TCS.NS"). |

---

## 📡 REST API Specification

### `POST /api/chat`
Streams real-time natural language analysis with token-level chunking and verified audit trails.
- **Request Body**:
  ```json
  {
    "prompt": { "content": "What is the P/E ratio and price of TCS?", "id": "msg-1", "role": "user" },
    "threadId": "user-session-123",
    "responseId": "resp-456"
  }
  ```
- **Response**: `text/plain` stream with chunked evaluation.

### `GET /api/chart-data/{ticker}?period={5d|1mo|6mo|1y|5y}`
Returns OHLC time-series, Moving Average, RSI (14), and DCF baseline valuation metrics.
- **Sample Output**:
  ```json
  {
    "ticker": "AAPL",
    "period": "1mo",
    "currency": "USD",
    "currentPrice": 356.27,
    "high": 356.27,
    "low": 342.11,
    "dates": ["Oct 15", "Oct 16", "..."],
    "prices": [343.91, 342.11, 356.27],
    "volumes": [45230000, 48120000, "..."],
    "sma20": [null, 348.5, 350.2],
    "technicals": {
      "rsi": 58.7,
      "smaTrend": "Bullish",
      "overallSignal": "BUY"
    },
    "dcfBaseline": {
      "fcfPerShare": 7.27,
      "estimatedFairValue": 159.94,
      "undervaluedPercent": -55.1,
      "verdict": "OVERVALUED"
    }
  }
  ```

### `GET /api/market-pulse`
Returns global & domestic indices with calculated market sentiment and breadth ratio.
- **Sample Output**:
  ```json
  {
    "indices": [
      { "symbol": "^NSEI", "name": "NIFTY 50", "price": 25144.3, "change": -155.05, "changePercent": -0.61, "direction": "down" },
      { "symbol": "^BSESN", "name": "SENSEX", "price": 81592.45, "change": -318.56, "changePercent": -0.39, "direction": "down" }
    ],
    "sentiment": {
      "score": 37,
      "label": "Fear",
      "bullishRatio": 16.7
    }
  }
  ```

### `GET /api/market-heatmap`
Returns sector-grouped multi-asset performance data for treemap rendering.

### `GET /api/stock-quote/{ticker}`
Returns current price, previous close, delta, currency, and a 7-day sparkline array.

---

## ⚡ Quantitative Models & Formulae

### 1. Relative Strength Index (RSI - 14 Period)
$$\text{RSI} = 100 - \left( \frac{100}{1 + \text{RS}} \right)$$
$$\text{RS} = \frac{\text{Average Gain (14)}}{\text{Average Loss (14)}}$$

- **$\text{RSI} < 35$**: Oversold condition (potential bullish reversal)
- **$\text{RSI} > 70$**: Overbought condition (potential pullback)

### 2. Discounted Cash Flow (DCF) Valuation Model
$$\text{Intrinsic Fair Value} = \sum_{t=1}^{n} \frac{\text{FCF}_0 \cdot (1 + g)^t}{(1 + r)^t} + \frac{\text{Terminal Value}}{(1 + r)^n}$$
$$\text{Margin of Safety} = \frac{\text{Intrinsic Fair Value} - \text{Market Price}}{\text{Market Price}} \times 100\%$$

Where:
- $\text{FCF}_0$ = Free Cash Flow per Share
- $g$ = Expected Free Cash Flow Growth Rate
- $r$ = Hurdle Discount Rate / WACC (Weighted Average Cost of Capital)

---

## 🚀 Quickstart Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/deepak8186863620/Merket-Insights.git
cd Merket-Insights
```

### Step 2: Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Open `.env` and paste your free Google Gemini API key:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
```
*(Get a free key in 30 seconds at [Google AI Studio](https://aistudio.google.com/app/apikey))*

### Step 3: Install & Start Backend (FastAPI)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```
*Backend runs at `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).*

### Step 4: Install & Start Frontend (React + Vite)
```bash
cd frontend

# Install Node modules
npm install

# Start Vite dev server
npm run dev
```
*Frontend opens at `http://localhost:3000`.*

---

## 💡 Example Queries to Test

Try typing or speaking these into the AI Terminal:
- 📊 *"What is the current stock price and P/E ratio of Reliance Industries?"*
- ⚖️ *"Compare TCS vs Infosys across revenue growth, operating margin, and analyst consensus."*
- 🕵️ *"Are there any recent insider buying transactions in HDFC Bank?"*
- 💰 *"What is the dividend yield and payout history for Tata Steel?"*
- 📈 *"Give me a multi-factor technical analysis on Apple with support and resistance levels."*

---

## 📁 Repository Structure

```
Merket-Insights/
├── MarketInsight/
│   ├── components/
│   │   └── agent.py          # Gemini AI agent & MemorySaver setup
│   └── utils/
│       ├── logger.py         # Timestamped logging utility
│       └── tools.py          # 16 specialized financial tools
├── config/
│   ├── __init__.py
│   └── config.py             # Pydantic schema models
├── frontend/
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── App.css           # Institutional dark theme & motion styles
│   │   ├── App.tsx           # Workstation UI (Chart Studio, Heatmap, Watchlist, Duel)
│   │   └── main.tsx          # React application entrypoint
│   ├── index.html            # Application HTML shell
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite build configuration
├── .env.example              # Public environment variable template
├── .gitignore                # Protects secrets & build artifacts
├── main.py                   # FastAPI server & route handlers
├── requirements.txt          # Python package requirements
└── README.md                 # Project documentation
```

---

## 🔒 Security & Privacy

- **No Secrets in Version Control**: `.gitignore` strictly prevents `.env`, Python cache, and local logs from being pushed.
- **Direct Client-to-Backend Streaming**: Your queries and financial analyses run directly against your own backend and Gemini API without third-party middleware proxies.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
