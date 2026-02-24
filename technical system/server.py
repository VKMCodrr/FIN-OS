from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import numpy as np

app = Flask(__name__)
CORS(app)  # Allows your HTML to talk to this Python script

def analyze_stock(ticker_symbol):
    # 1. FETCH DATA (1 Year for robust calculation)
    # We append '.NS' automatically for NSE stocks
    symbol = ticker_symbol.upper() + ".NS"
    stock = yf.Ticker(symbol)
    df = stock.history(period="1y")
    
    if df.empty:
        return None

    # 2. CALCULATE INDICATORS (The "God Mode" Math)
    
    # A. REGIME ENGINE (ADX)
    # ADX > 25 = Trending, ADX < 20 = Range Bound
    adx = ta.adx(df['High'], df['Low'], df['Close'], length=14)
    current_adx = adx['ADX_14'].iloc[-1]
    
    regime = "NEUTRAL"
    if current_adx > 25:
        regime = "TRENDING"
    elif current_adx < 20:
        regime = "RANGE BOUND"
        
    # B. SMART MONEY (Volume Anomaly)
    # Is today's volume significantly higher than the 20-day average?
    vol_avg = df['Volume'].rolling(window=20).mean().iloc[-1]
    curr_vol = df['Volume'].iloc[-1]
    vol_ratio = curr_vol / vol_avg
    
    smart_money = "WAITING"
    if vol_ratio > 1.5:
        smart_money = "ACCUMULATION" if df['Close'].iloc[-1] > df['Open'].iloc[-1] else "DISTRIBUTION"
    
    # C. VOLATILITY (Bollinger Bandwidth Squeeze)
    bb = ta.bbands(df['Close'], length=20, std=2)
    # Bandwidth = (Upper - Lower) / Middle
    bandwidth = (bb['BBU_20_2.0'].iloc[-1] - bb['BBL_20_2.0'].iloc[-1]) / bb['BBM_20_2.0'].iloc[-1]
    
    volatility_status = "NORMAL"
    if bandwidth < 0.10: # Threshold for squeeze
        volatility_status = "SQUEEZE"
    elif bandwidth > 0.30:
        volatility_status = "EXPANSION"

    # D. PROBABILITY (Simple Momentum Logic)
    # If RSI > 50 and Price > 50EMA -> Bullish Bias
    rsi = ta.rsi(df['Close'], length=14).iloc[-1]
    ema50 = ta.ema(df['Close'], length=50).iloc[-1]
    price = df['Close'].iloc[-1]
    
    prob_up = 50
    if price > ema50: prob_up += 10
    if rsi > 50: prob_up += 10
    if regime == "TRENDING": prob_up += 5
    
    # Cap probability
    prob_up = min(prob_up, 95)

    # 3. PREPARE RESPONSE
    return {
        "symbol": symbol,
        "price": round(price, 2),
        "change": round(((price - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100, 2),
        "regime": regime,
        "smart_money": smart_money,
        "volatility": volatility_status,
        "probability": int(prob_up),
        "adx_value": round(current_adx, 2),
        "vol_ratio": round(vol_ratio, 1),
        "price_history": df['Close'].tail(50).tolist() # Send last 50 closing prices for chart
    }

@app.route('/api/scan/<ticker>')
def scan_stock(ticker):
    print(f"Scanning {ticker}...")
    try:
        data = analyze_stock(ticker)
        if data:
            return jsonify(data)
        else:
            return jsonify({"error": "Stock not found or delisted"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 FIN-OS ENGINE STARTED ON PORT 5000")
    app.run(debug=True, port=5000)