import time
import requests
import yfinance as yf
from langchain.tools import tool
from MarketInsight.utils.logger import get_logger

logger = get_logger("Tools")


# --------------------------------------------------------------------------------
# Tool 1: Retrieve Company Stock Price
# --------------------------------------------------------------------------------
@tool('get_stock_price', description="A function that returns the current stock price of a given ticker")
def get_stock_price(ticker: str):
    logger.info(f"Retrieving Stock Price of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    start_time = time.time()

    try:
        stock = yf.Ticker(ticker)
        stock_price = None
        try:
            stock_price = stock.fast_info.last_price
        except Exception:
            pass
            
        if stock_price is None:
            info = stock.info or {}
            stock_price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
            
        end_time = time.time()

        if stock_price is None:
            return f"No price data available for {ticker}"
        
        logger.info(f"Retrieved Stock Price of {ticker} in {end_time - start_time:.3f} seconds")
        return stock_price

    except Exception as e:
        logger.error(f"Failed to retrieve stock price of {ticker}: {str(e)}")
        return "Error: Failed to retrieve stock price. Please try again later."


# --------------------------------------------------------------------------------
# Tool 2: Retrieve Company Stock Historical Data
# --------------------------------------------------------------------------------
@tool('get_historical_data', description="A function that returns the historical data of a given ticker in the given start and end date")
def get_historical_data(ticker: str, start_date: str, end_date: str):
    logger.info(f"Retrieving Historical Data of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        historical_data = stock.history(start=start_date, end=end_date).to_dict()

        if historical_data is None:
            return "No historical data available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Historical Data of {ticker} in {end_time - start_time:.3f} seconds")
        return historical_data

    except Exception as e:
        logger.error(f"Failed to retrieve historical data of {ticker}: {str(e)}")
        return "Error: Failed to retrieve historical data. Please try again later."


# --------------------------------------------------------------------------------
# Tool 3: Retrieve Company Stock News
# --------------------------------------------------------------------------------
@tool('get_stock_news', description="A function that returns the news of a given ticker")
def get_stock_news(ticker: str):
    logger.info(f"Retrieving News of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        news = stock.news

        if news is None:
            return "No news available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved News of {ticker} in {end_time - start_time:.3f} seconds")
        return news

    except Exception as e:
        logger.error(f"Failed to retrieve news of {ticker}: {str(e)}")
        return "Error: Failed to retrieve news. Please try again later."


# --------------------------------------------------------------------------------
# Tool 4: Retrieve Company's Balance Sheet
# --------------------------------------------------------------------------------
@tool('get_balance_sheet', description="A function that returns the balance sheet of a given ticker")
def get_balance_sheet(ticker: str):
    logger.info(f"Retrieving Balance Sheet of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        balance_sheet = stock.balance_sheet.to_dict()

        if balance_sheet is None:
            return "No balance sheet available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Balance Sheet of {ticker} in {end_time - start_time:.3f} seconds")
        return balance_sheet

    except Exception as e:
        logger.error(f"Failed to retrieve balance sheet of {ticker}: {str(e)}")
        return "Error: Failed to retrieve balance sheet. Please try again later."


# --------------------------------------------------------------------------------
# Tool 5: Retrieve Company's Income Statement
# --------------------------------------------------------------------------------
@tool('get_income_statement', description="A function that returns the income statement of a given ticker")
def get_income_statement(ticker: str):
    logger.info(f"Retrieving Income Statement of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        income_statement = stock.financials.to_dict()

        if income_statement is None:
            return "No income statement available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Income Statement of {ticker} in {end_time - start_time:.3f} seconds")
        return income_statement

    except Exception as e:
        logger.error(f"Failed to retrieve income statement of {ticker}: {str(e)}")
        return "Error: Failed to retrieve income statement. Please try again later."
    

# --------------------------------------------------------------------------------
# Tool 6: Retrieve Company's Cash Flow Statement
# --------------------------------------------------------------------------------
@tool('get_cash_flow', description="A function that returns the cash flow statement of a given ticker")
def get_cash_flow(ticker: str):
    logger.info(f"Retrieving Cash Flow of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        cash_flow = stock.cashflow.to_dict()

        if cash_flow is None:
            return "No cash flow available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Cash Flow of {ticker} in {end_time - start_time:.3f} seconds")
        return cash_flow

    except Exception as e:
        logger.error(f"Failed to retrieve cash flow of {ticker}: {str(e)}")
        return "Error: Failed to retrieve cash flow. Please try again later."

# --------------------------------------------------------------------------------
# Tool 7: Retrieve Company Info & Ratios
# --------------------------------------------------------------------------------
@tool('get_company_info', description="A function that returns company profile and key financial ratios")
def get_company_info(ticker: str):
    logger.info(f"Retrieving Company Info of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        info = stock.info

        if info is None:
            return "No company info available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Company Info of {ticker} in {end_time - start_time:.3f} seconds")
        return info

    except Exception as e:
        logger.error(f"Failed to retrieve company info of {ticker}: {str(e)}")
        return "Error: Failed to retrieve company info. Please try again later."

# --------------------------------------------------------------------------------
# Tool 8: Retrieve Dividend History
# --------------------------------------------------------------------------------
@tool('get_dividends', description="A function that returns the dividend payment history of a given ticker")
def get_dividends(ticker: str):
    logger.info(f"Retrieving Dividends of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        dividends = stock.dividends.to_dict()

        if dividends is None:
            return "No dividends available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Dividends of {ticker} in {end_time - start_time:.3f} seconds")
        return dividends

    except Exception as e:
        logger.error(f"Failed to retrieve dividends of {ticker}: {str(e)}")
        return "Error: Failed to retrieve dividends. Please try again later."

# --------------------------------------------------------------------------------
# Tool 9: Retrieve Stock Split History
# --------------------------------------------------------------------------------
@tool('get_splits', description="A function that returns the stock split history of a given ticker")
def get_splits(ticker: str):
    logger.info(f"Retrieving Stock Splits of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        splits = stock.splits.to_dict()

        if splits is None:
            return "No stock splits available for {ticker}"

        end_time = time.time()
        logger.info(f"Retrieved Stock Splits of {ticker} in {end_time - start_time:.3f} seconds")
        return splits

    except Exception as e:
        logger.error(f"Failed to retrieve stock splits of {ticker}: {str(e)}")
        return "Error: Failed to retrieve stock splits. Please try again later."


# --------------------------------------------------------------------------------
# Tool 10: Retrieve Institutional Holders
# --------------------------------------------------------------------------------
@tool('get_institutional_holders', description="A function that returns the institutional ownership data of a given ticker")
def get_institutional_holders(ticker: str):
    logger.info(f"Retrieving Institutional Holders of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        raw_holders = getattr(stock, 'institutional_holders', None)
        if raw_holders is None or (hasattr(raw_holders, 'empty') and raw_holders.empty):
            return f"No institutional holders data available for {ticker}."
        holders = raw_holders.to_dict() if hasattr(raw_holders, 'to_dict') else raw_holders
        if not holders:
            return f"No institutional holders data available for {ticker}."

        end_time = time.time()
        logger.info(f"Retrieved Institutional Holders of {ticker} in {end_time - start_time:.3f} seconds")
        return holders

    except Exception as e:
        logger.error(f"Failed to retrieve institutional holders of {ticker}: {str(e)}")
        return "Error: Failed to retrieve institutional holders. Please try again later."

# --------------------------------------------------------------------------------
# Tool 11: Retrieve Major Share Holders
# --------------------------------------------------------------------------------
@tool('get_major_shareholders', description="A function that returns the major share holder data of a given ticker")
def get_major_shareholders(ticker: str):
    logger.info(f"Retrieving Major Share Holders of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        raw_holders = getattr(stock, 'major_holders', None)
        if raw_holders is None or (hasattr(raw_holders, 'empty') and raw_holders.empty):
            return f"No major share holders data available for {ticker}."
        holders = raw_holders.to_dict() if hasattr(raw_holders, 'to_dict') else raw_holders
        if not holders:
            return f"No major share holders data available for {ticker}."

        end_time = time.time()
        logger.info(f"Retrieved Major Share Holders of {ticker} in {end_time - start_time:.3f} seconds")
        return holders

    except Exception as e:
        logger.error(f"Failed to retrieve major share holders of {ticker}: {str(e)}")
        return "Error: Failed to retrieve major share holders. Please try again later."

# --------------------------------------------------------------------------------
# Tool 12: Retrieve Mutual Fund Holders
# --------------------------------------------------------------------------------
@tool('get_mutual_fund_holders', description="A function that returns the mutual fund ownership data of a given ticker")
def get_mutual_fund_holders(ticker: str):
    logger.info(f"Retrieving Mutual Fund Holders of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        raw_holders = getattr(stock, 'mutualfund_holders', None)
        if raw_holders is None or (hasattr(raw_holders, 'empty') and raw_holders.empty):
            return f"No mutual fund holders data available for {ticker}."
        holders = raw_holders.to_dict() if hasattr(raw_holders, 'to_dict') else raw_holders
        if not holders:
            return f"No mutual fund holders data available for {ticker}."

        end_time = time.time()
        logger.info(f"Retrieved Mutual Fund Holders of {ticker} in {end_time - start_time:.3f} seconds")
        return holders

    except Exception as e:
        logger.error(f"Failed to retrieve mutual fund holders of {ticker}: {str(e)}")
        return "Error: Failed to retrieve mutual fund holders. Please try again later."

# --------------------------------------------------------------------------------
# Tool 13: Retrieve Insider Transactions
# --------------------------------------------------------------------------------
@tool('get_insider_transactions', description="A function that returns the insider buy/sell transactions of a given ticker")
def get_insider_transactions(ticker: str):
    logger.info(f"Retrieving Insider Transactions of {ticker}")

    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        raw_txn = getattr(stock, 'insider_transactions', None)
        if raw_txn is None or (hasattr(raw_txn, 'empty') and raw_txn.empty):
            return f"No recent insider transactions filings found for {ticker}."
        insider_txn = raw_txn.to_dict() if hasattr(raw_txn, 'to_dict') else raw_txn
        if not insider_txn:
            return f"No recent insider transactions filings found for {ticker}."

        end_time = time.time()
        logger.info(f"Retrieved Insider Transactions of {ticker} in {end_time - start_time:.3f} seconds")
        return insider_txn

    except Exception as e:
        logger.error(f"Failed to retrieve insider transactions of {ticker}: {str(e)}")
        return "Error: Failed to retrieve insider transactions. Please try again later."

# --------------------------------------------------------------------------------
# Tool 14: Retrieve Analyst Recommendations
# --------------------------------------------------------------------------------
@tool('get_analyst_recommendations', description="A function that returns the analyst recommendations of a given ticker")
def get_analyst_recommendations(ticker: str):
    logger.info(f"Retrieving Analyst Recommendations of {ticker}")
    
    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        raw_rec = getattr(stock, 'recommendations', None)
        if raw_rec is None or (hasattr(raw_rec, 'empty') and raw_rec.empty):
            return f"No analyst recommendations found for {ticker}."
        recommendations = raw_rec.to_dict() if hasattr(raw_rec, 'to_dict') else raw_rec
        if not recommendations:
            return f"No analyst recommendations found for {ticker}."

        end_time = time.time()
        logger.info(f"Retrieved Analyst Recommendations of {ticker} in {end_time - start_time:.3f} seconds")
        return recommendations

    except Exception as e:
        logger.error(f"Failed to retrieve analyst recommendations of {ticker}: {str(e)}")
        return "Error: Failed to retrieve analyst recommendations. Please try again later."

# --------------------------------------------------------------------------------
# Tool 15: Retrieve Analyst Recommendations Summary
# --------------------------------------------------------------------------------
@tool('get_analyst_recommendations_summary', description="A function that returns the analyst recommendations summary of a given ticker")
def get_analyst_recommendations_summary(ticker: str):
    logger.info(f"Retrieving Analyst Recommendations Summary of {ticker}")
    
    if not ticker or not isinstance(ticker, str):
        return "Error: Invalid ticker provided. Please provide a valid ticker symbol."

    try:
        start_time = time.time()
        stock = yf.Ticker(ticker)
        raw_rec = getattr(stock, 'recommendations_summary', None)
        if raw_rec is None or (hasattr(raw_rec, 'empty') and raw_rec.empty):
            return f"No analyst recommendations summary found for {ticker}."
        recommendations = raw_rec.to_dict() if hasattr(raw_rec, 'to_dict') else raw_rec
        if not recommendations:
            return f"No analyst recommendations summary found for {ticker}."

        end_time = time.time()
        logger.info(f"Retrieved Analyst Recommendations Summary of {ticker} in {end_time - start_time:.3f} seconds")
        return recommendations

    except Exception as e:
        logger.error(f"Failed to retrieve analyst recommendations summary of {ticker}: {str(e)}")
        return "Error: Failed to retrieve analyst recommendations summary. Please try again later."

# --------------------------------------------------------------------------------
# Tool 16: Retrieve Company's Ticker/Symbol
# --------------------------------------------------------------------------------
@tool('get_ticker', description="A function that returns the ticker/symbol of a given company")
def get_ticker(company_name: str):
    logger.info("Retrieving Ticker of {company_name}")
    
    if not company_name or not isinstance(company_name, str):
        return "Error: Invalid company name provided. Please provide a valid company name."

    try:
        start_time = time.time()
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={company_name}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            quotes = data.get('quotes', [])
            if quotes and 'symbol' in quotes[0]:
                ticker = quotes[0]['symbol']
                end_time = time.time()
                logger.info(f"Retrieved Ticker of {company_name} in {end_time - start_time:.3f} seconds")
                return ticker
            return f"No ticker symbol found for '{company_name}'"
        else:
            return f"Error: Yahoo Search returned status {response.status_code}"
            
    except Exception as e:
        logger.error(f"Failed to retrieve ticker of {company_name}: {str(e)}")
        return f"Error: Failed to retrieve ticker. {str(e)}"