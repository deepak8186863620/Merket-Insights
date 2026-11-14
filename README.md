# ⚡ MarketInsight — Institutional AI Financial Terminal

An institutional-grade, AI-powered stock market workstation providing real-time financial data, deterministic quant valuation models, interactive charting, and an autonomous market intelligence agent.

---

## 🌟 Key Features

### 1. 💬 AI Quant Analyst Terminal (Voice & Text)
- **Zero-Hallucination Policy**: Real-time tools fetch live stock prices, balance sheets, cash flows, insider moves, institutional holders, and analyst targets directly from exchange gateways.
- **Transparent Audit Trail**: Every response displays an explicit **Verified Live Market Sources** badge verifying which Python tools were executed and what raw data was returned.
- **Voice-to-Intel**: Tap the microphone to speak queries using the Web Speech API with an animated soundwave visualizer.
- **One-Click Export**: Download structured research briefings in Markdown format with one click.

### 2. 📈 Interactive Quant Chart & DCF Studio (TradingView Style)
- **Interactive SVG Charting**: Smooth area and line curves with timeframe toggles (`5D`, `1MO`, `6MO`, `1Y`, `5Y`).
- **Live Hover Crosshair**: Track exact date, price, and volume points.
- **Technical Indicators**: Toggleable 20-day Simple Moving Average (SMA) line, mathematical 14-period RSI (Oversold/Overbought), and synthesized quant signal needles (`STRONG BUY`, `BUY`, `NEUTRAL`, `SELL`, `STRONG SELL`).
- **Interactive DCF Valuation Simulator**: Real-time sliders for **Expected Growth Rate %** and **Hurdle Discount Rate (WACC) %** to compute intrinsic fair value and Margin of Safety live on screen.

### 3. 🗺️ Live Market Sector Treemap Heatmap
- Visual grid covering **Information Technology**, **Banking & Finance**, **Energy & Conglomerates**, and **Automobile & Metals**.
- Sized by weight and color-coded by real-time daily percentage changes. Click any stock tile to open its interactive quant studio.

### 4. 🧠 Algorithmic Market Pulse & Sentiment Radar
- Live infinite marquee tracking indices (NIFTY 50, SENSEX, S&P 500, NASDAQ) and blue-chips.
- Real-time **Fear & Greed Sentiment Score (0–100)** computed from market breadth and momentum.

### 5. ⭐ Quantitative Watchlist & ⚔️ Versus Duel Arena
- Pin your favorite assets with live 7-day SVG sparklines stored in your browser's `localStorage`.
- Head-to-head stock arena to pit any two assets against each other (e.g., `TCS.NS vs INFY.NS` or `AAPL vs MSFT`).

---

## 🛠️ Technology Stack

- **Backend**: FastAPI, LangChain, LangGraph, Google Gemini AI (`gemini-flash-lite`), YFinance, Uvicorn, Langfuse (optional)
- **Frontend**: React 19, TypeScript, Vite, SVG Data Visualizations, Web Speech API

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key (Free: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/deepak8186863620/Merket-Insights.git
cd Merket-Insights

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and paste your GOOGLE_API_KEY

# Start backend server (runs on port 8000)
python main.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server (runs on port 3000)
npm run dev
```

### 4. Access the Application
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Market Pulse API**: [http://localhost:8000/api/market-pulse](http://localhost:8000/api/market-pulse)

---

## 🔒 Security Note
Never commit your `.env` file to version control. The repository comes pre-configured with a `.gitignore` to prevent secret leaks.
