import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from MarketInsight.utils.tools import *
from MarketInsight.utils.logger import get_logger
from langgraph.checkpoint.memory import MemorySaver
from langchain.agents import create_agent

load_dotenv()
logger = get_logger(__name__)

# Primary model with automatic fallback to avoid 503 high-demand errors
primary_model = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest"),
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0,
    max_retries=3
)

fallback_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0,
    max_retries=3
)

model = primary_model.with_fallbacks([fallback_model])

agent = create_agent(
    model,
    tools = [get_stock_price, get_historical_data, get_stock_news, get_balance_sheet, get_income_statement, get_cash_flow,
            get_company_info, get_dividends, get_splits, get_institutional_holders, get_major_shareholders,
            get_mutual_fund_holders, get_insider_transactions, get_analyst_recommendations, get_analyst_recommendations_summary, get_ticker],
    checkpointer = MemorySaver()
)

logger.info("Agent Initiated Successfully")