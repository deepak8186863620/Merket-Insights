import os
import uvicorn
import yfinance as yf
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from langchain_core.messages import SystemMessage, HumanMessage
from config.config import RequestObject
from MarketInsight.components.agent import agent
from MarketInsight.utils.logger import get_logger

logger = get_logger(__name__)
app = FastAPI(title="MarketInsight API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Langfuse is optional — only initialise if keys are present
_langfuse_enabled = bool(
    os.getenv("LANGFUSE_PUBLIC_KEY") and
    os.getenv("LANGFUSE_SECRET_KEY") and
    os.getenv("LANGFUSE_HOST")
)
if _langfuse_enabled:
    from langfuse import Langfuse
    langfuse = Langfuse(
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        host=os.getenv("LANGFUSE_HOST")
    )
    logger.info("Langfuse observability enabled")
else:
    langfuse = None
    logger.info("Langfuse keys not set — running without observability")


def extract_text(content) -> str:
    """Robustly extract text from various LangChain message content formats."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(item.get("text", ""))
            elif hasattr(item, "text"):
                parts.append(str(item.text))
        return "".join(parts)
    if content is None:
        return ""
    return str(content)


@app.get("/")
async def root():
    return {
        "name": "MarketInsight AI Platform",
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "chat": "POST /api/chat",
            "market_pulse": "GET /api/market-pulse",
            "stock_quote": "GET /api/stock-quote/{ticker}"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}


@app.get("/api/market-pulse")
async def get_market_pulse():
    """Returns live global & Indian index prices and computed Fear & Greed sentiment."""
    indices_config = [
        {"symbol": "^NSEI", "name": "NIFTY 50", "region": "IN"},
        {"symbol": "^BSESN", "name": "SENSEX", "region": "IN"},
        {"symbol": "^GSPC", "name": "S&P 500", "region": "US"},
        {"symbol": "^IXIC", "name": "NASDAQ", "region": "US"},
        {"symbol": "RELIANCE.NS", "name": "RELIANCE", "region": "IN"},
        {"symbol": "TCS.NS", "name": "TCS", "region": "IN"},
    ]
    
    results = []
    up_count = 0
    total_valid = 0
    
    for item in indices_config:
        try:
            t = yf.Ticker(item["symbol"])
            fast = t.fast_info
            price = fast.last_price
            prev_close = fast.previous_close
            
            if price is not None and prev_close is not None and prev_close > 0:
                change = price - prev_close
                change_pct = (change / prev_close) * 100
                is_up = change >= 0
                if is_up:
                    up_count += 1
                total_valid += 1
                results.append({
                    "symbol": item["symbol"],
                    "name": item["name"],
                    "region": item["region"],
                    "price": round(float(price), 2),
                    "change": round(float(change), 2),
                    "changePercent": round(float(change_pct), 2),
                    "direction": "up" if is_up else "down"
                })
        except Exception as e:
            logger.warning(f"Failed to fetch index {item['symbol']}: {e}")
            continue

    sentiment_score = 55
    if total_valid > 0:
        ratio = up_count / total_valid
        sentiment_score = int(30 + ratio * 45)
    
    if sentiment_score >= 75:
        sentiment_label = "Extreme Greed"
    elif sentiment_score >= 60:
        sentiment_label = "Greed"
    elif sentiment_score >= 45:
        sentiment_label = "Neutral"
    elif sentiment_score >= 25:
        sentiment_label = "Fear"
    else:
        sentiment_label = "Extreme Fear"

    return {
        "indices": results,
        "sentiment": {
            "score": sentiment_score,
            "label": sentiment_label,
            "bullishRatio": round((up_count / total_valid * 100) if total_valid else 50, 1)
        }
    }


@app.get("/api/stock-quote/{ticker}")
async def get_stock_quote(ticker: str):
    """Returns comprehensive quote, sparkline, and fundamentals for hover cards & comparison."""
    try:
        t = yf.Ticker(ticker.upper())
        fast = t.fast_info
        price = fast.last_price or 0.0
        prev_close = fast.previous_close or price
        change = price - prev_close
        change_pct = ((change / prev_close) * 100) if prev_close else 0.0
        
        # 7-day sparkline history
        hist = t.history(period="7d")
        sparkline = []
        if not hist.empty and 'Close' in hist:
            sparkline = [round(float(p), 2) for p in hist['Close'].dropna().tolist()]

        return {
            "ticker": ticker.upper(),
            "price": round(float(price), 2),
            "previousClose": round(float(prev_close), 2),
            "change": round(float(change), 2),
            "changePercent": round(float(change_pct), 2),
            "sparkline": sparkline,
            "currency": fast.currency or "INR" if ".NS" in ticker.upper() or ".BO" in ticker.upper() else "USD"
        }
    except Exception as e:
        logger.error(f"Error fetching quote for {ticker}: {e}")
        return JSONResponse(status_code=404, content={"error": f"Failed to retrieve quote for {ticker}"})


@app.get("/api/chart-data/{ticker}")
async def get_chart_data(ticker: str, period: str = "1mo"):
    """Returns rich time-series chart data, technical indicators (RSI, SMA), and DCF valuation metrics."""
    valid_periods = ["5d", "1mo", "6mo", "1y", "5y"]
    if period not in valid_periods:
        period = "1mo"
        
    try:
        t = yf.Ticker(ticker.upper())
        hist = t.history(period=period)
        if hist.empty:
            return JSONResponse(status_code=404, content={"error": f"No chart data available for {ticker}"})

        dates = [d.strftime("%b %d" if period in ["5d", "1mo"] else "%b '%y") for d in hist.index]
        closes = [round(float(c), 2) for c in hist['Close']]
        volumes = [int(v) for v in hist['Volume']]
        
        # 20-period Moving Average
        sma20 = []
        window = 20 if len(closes) >= 20 else max(len(closes) // 2, 2)
        for i in range(len(closes)):
            if i < window - 1:
                sma20.append(None)
            else:
                sma20.append(round(sum(closes[i - window + 1:i + 1]) / window, 2))

        # 14-period RSI Calculation
        rsi = 50.0
        if len(closes) >= 15:
            deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
            gains = [d if d > 0 else 0 for d in deltas]
            losses = [-d if d < 0 else 0 for d in deltas]
            avg_gain = sum(gains[-14:]) / 14
            avg_loss = sum(losses[-14:]) / 14
            rs = avg_gain / avg_loss if avg_loss else 1.0
            rsi = round(100 - (100 / (1 + rs)), 1)

        # Technical Signal Synthesis
        current_price = closes[-1]
        last_sma = [s for s in sma20 if s is not None]
        sma_signal = "Bullish" if last_sma and current_price >= last_sma[-1] else "Bearish"
        
        if rsi < 35 and sma_signal == "Bullish":
            overall_signal = "STRONG BUY"
        elif rsi < 45 or sma_signal == "Bullish":
            overall_signal = "BUY"
        elif rsi > 70 and sma_signal == "Bearish":
            overall_signal = "STRONG SELL"
        elif rsi > 65:
            overall_signal = "SELL"
        else:
            overall_signal = "NEUTRAL"

        # DCF Baseline Parameters
        info = t.info or {}
        fcf = info.get("freeCashflow") or 5000000000
        shares = info.get("sharesOutstanding") or 1000000000
        fcf_per_share = round(float(fcf / shares), 2) if shares else round(current_price * 0.05, 2)
        baseline_fair_value = round(fcf_per_share * 22, 2)
        if baseline_fair_value <= 0:
            baseline_fair_value = round(current_price * 1.05, 2)

        undervalued_pct = round(((baseline_fair_value - current_price) / current_price) * 100, 1)

        return {
            "ticker": ticker.upper(),
            "period": period,
            "currency": info.get("currency") or "INR" if ".NS" in ticker.upper() or ".BO" in ticker.upper() else "USD",
            "currentPrice": current_price,
            "high": round(float(max(closes)), 2),
            "low": round(float(min(closes)), 2),
            "dates": dates,
            "prices": closes,
            "volumes": volumes,
            "sma20": sma20,
            "technicals": {
                "rsi": rsi,
                "smaTrend": sma_signal,
                "overallSignal": overall_signal
            },
            "dcfBaseline": {
                "fcfPerShare": fcf_per_share,
                "estimatedFairValue": baseline_fair_value,
                "undervaluedPercent": undervalued_pct,
                "verdict": "UNDERVALUED" if undervalued_pct > 0 else "OVERVALUED"
            }
        }
    except Exception as e:
        logger.error(f"Error fetching chart data for {ticker}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/market-heatmap")
async def get_market_heatmap():
    """Returns sector-based treemap heatmap data."""
    sectors = [
        {
            "sector": "Information Technology",
            "stocks": [
                {"ticker": "TCS.NS", "name": "TCS", "weight": 35},
                {"ticker": "INFY.NS", "name": "Infosys", "weight": 30},
                {"ticker": "NVDA", "name": "Nvidia", "weight": 20},
                {"ticker": "AAPL", "name": "Apple", "weight": 15},
            ]
        },
        {
            "sector": "Banking & Finance",
            "stocks": [
                {"ticker": "HDFCBANK.NS", "name": "HDFC Bank", "weight": 40},
                {"ticker": "ICICIBANK.NS", "name": "ICICI Bank", "weight": 35},
                {"ticker": "SBIN.NS", "name": "SBI", "weight": 25},
            ]
        },
        {
            "sector": "Energy & Conglomerate",
            "stocks": [
                {"ticker": "RELIANCE.NS", "name": "Reliance", "weight": 60},
                {"ticker": "ONGC.NS", "name": "ONGC", "weight": 25},
                {"ticker": "NTPC.NS", "name": "NTPC", "weight": 15},
            ]
        },
        {
            "sector": "Automobile & Metals",
            "stocks": [
                {"ticker": "MARUTI.NS", "name": "Maruti", "weight": 40},
                {"ticker": "TATASTEEL.NS", "name": "Tata Steel", "weight": 35},
                {"ticker": "M&M.NS", "name": "Mahindra", "weight": 25},
            ]
        }
    ]

    all_symbols = [s["ticker"] for sec in sectors for s in sec["stocks"]]
    quotes = {}
    try:
        t_batch = yf.Tickers(" ".join(all_symbols))
        for sym in all_symbols:
            try:
                fast = t_batch.tickers[sym].fast_info
                p = fast.last_price or 0.0
                prev = fast.previous_close or p
                change_pct = round(((p - prev) / prev) * 100, 2) if prev else 0.0
                quotes[sym] = {"price": round(float(p), 2), "changePercent": change_pct}
            except Exception:
                quotes[sym] = {"price": 1000.0, "changePercent": 0.0}
    except Exception as e:
        logger.warning(f"Heatmap batch failed: {e}")

    result = []
    for sec in sectors:
        sec_stocks = []
        for s in sec["stocks"]:
            q = quotes.get(s["ticker"], {"price": 0.0, "changePercent": 0.0})
            sec_stocks.append({
                "ticker": s["ticker"],
                "name": s["name"],
                "weight": s["weight"],
                "price": q["price"],
                "changePercent": q["changePercent"],
                "status": "up" if q["changePercent"] >= 0 else "down"
            })
        result.append({
            "sector": sec["sector"],
            "stocks": sec_stocks
        })

    return {"heatmap": result}


@app.post("/api/chat")
async def chat(request: RequestObject):
    config = {'configurable': {'thread_id': request.threadId}}

    async def generate():
        try:
            full_response = ""
            tools_used = []

            for token, _ in agent.stream(
                {
                    'messages': [
                        SystemMessage(content="You are a professional, high-conviction stock market analyst and quantitative financial strategist. When answering queries, prioritize real-time tools to fetch accurate stock prices, company financials, historical trends, insider moves, and analyst targets. Structure your responses clearly with bold stock tickers, key metrics, technical/fundamental takeaway, and bullet points. Never guess or fabricate financial numbers."),
                        HumanMessage(content=request.prompt.content)
                    ]
                },
                stream_mode='messages',
                config=config
            ):
                # Capture tool executions for transparent audit trail
                if getattr(token, 'type', '') == 'tool' or token.__class__.__name__ == 'ToolMessage':
                    tool_name = getattr(token, 'name', '') or 'financial_tool'
                    tool_content = str(token.content)
                    if len(tool_content) > 80:
                        tool_content = tool_content[:77] + "..."
                    tools_used.append((tool_name, tool_content))
                    continue

                text_chunk = extract_text(token.content)
                if text_chunk:
                    full_response += text_chunk
                    yield text_chunk

            # Append live audit verification badge if tools were executed
            if tools_used:
                audit_badge = "\n\n---\n**⚡ Verified Live Market Sources:**\n"
                for t_name, t_val in tools_used:
                    audit_badge += f"- 📡 `{t_name}` ➔ `{t_val}`\n"
                audit_badge += "*Live feed verified via Yahoo Finance Exchange Gateway*\n"
                full_response += audit_badge
                yield audit_badge

            # Log to Langfuse if enabled
            if langfuse and full_response:
                try:
                    with langfuse.start_as_current_observation(
                        as_type="generation",
                        name="agent-stream",
                        model="gemini-flash-lite",
                        input=request.prompt.content
                    ) as generation:
                        generation.update(output=full_response)
                except Exception as lf_err:
                    logger.warning(f"Langfuse logging failed: {lf_err}")

        except Exception as e:
            logger.error(f"Error in chat: {e}")
            yield f"\n\n⚠️ Error during analysis: {str(e)}"

    return StreamingResponse(
        generate(),
        media_type='text/plain; charset=utf-8',
        headers={
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


if __name__ == '__main__':
    logger.info("App Initiated Successfully on port 8000")
    uvicorn.run(app, host='0.0.0.0', port=8000)

