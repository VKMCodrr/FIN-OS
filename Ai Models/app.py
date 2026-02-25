# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import torch
from transformers import pipeline

app = FastAPI()

# MASTER FIX: This allows your HTML file to "talk" to your Python code
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize FinBERT on Mac GPU (MPS)
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"--- [NewsF] Neural Engine Active on: {device.upper()} ---")
# Use the industry-standard FinBERT model
nlp = pipeline("sentiment-analysis", model="ProsusAI/finbert", device=device)

@app.get("/news/{ticker}")
def get_news(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        news_data = stock.news
        if not news_data:
            return {"error": "No news found"}

        feed = []
        for item in news_data[:6]:
            # Robust extraction to avoid KeyError
            title = item.get('title') or item.get('content', {}).get('title', "N/A")
            if title == "N/A": continue
            
            # Run FinBERT
            res = nlp(title)[0]
            
            # Desi Indian Economic Logic
            h_low = title.lower()
            impact = "Neutral"
            desi = "Normal Bazaar movements."
            
            if any(w in h_low for w in ["fed", "inflation", "rates"]):
                impact, desi = "Systemic", "Like a market-wide rainstorm affecting everyone."
            elif any(w in h_low for w in ["earnings", "profit", "sales"]):
                impact, desi = "Fundamental", "The shop's personal 'Gullak' is growing."

            feed.append({
                "title": title,
                "sentiment": res['label'].upper(),
                "confidence": round(res['score'] * 100, 1),
                "impact": impact,
                "desi": desi
            })
        return {"ticker": ticker.upper(), "feed": feed}
    except Exception as e:
        return {"error": str(e)}