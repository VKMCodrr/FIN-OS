from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import torch
from transformers import pipeline

app = FastAPI()

# Fix CORS so the HTML can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load FinBERT on Mac GPU
device = "mps" if torch.backends.mps.is_available() else "cpu"
nlp = pipeline("sentiment-analysis", model="ProsusAI/finbert", device=device)

@app.get("/news/{ticker}")
def get_news(ticker: str):
    stock = yf.Ticker(ticker)
    news_data = stock.news
    if not news_data: return {"feed": []}

    feed = []
    for item in news_data[:6]:
        title = item.get('title') or item.get('content', {}).get('title', "N/A")
        if title == "N/A": continue
        
        res = nlp(title)[0]
        h_low = title.lower()
        
        # Desi Economic Impact Logic
        impact, desi = "Neutral", "Normal Market Noise"
        if any(w in h_low for w in ["fed", "inflation", "rates"]):
            impact, desi = "Systemic", "Market-wide rain; everyone gets wet."
        elif any(w in h_low for w in ["earnings", "profit", "sales"]):
            impact, desi = "Fundamental", "The shop's personal 'Gullak' is filling up."

        feed.append({
            "title": title,
            "sentiment": res['label'].upper(),
            "confidence": round(res['score'] * 100, 1),
            "impact": impact,
            "desi": desi # Key matched for JS
        })
    return {"ticker": ticker.upper(), "feed": feed}

@app.get("/deep-dive/{ticker}")
def get_deep_dive(ticker: str):
    stock = yf.Ticker(ticker)
    info = stock.info
    # Bloomberg-level data points
    return {
        "liq": f"{round(info.get('averageVolume', 0) / 1e6, 2)}M",
        "inst": f"{info.get('heldPercentInstitutions', 0)*100:.1f}%",
        "risk": "High Alert" if info.get('beta', 1) > 1.3 else "Stable",
        "val": "Premium" if info.get('trailingPE', 0) > 30 else "Value Zone"
    }