import yfinance as yf
import torch
from transformers import pipeline
import pandas as pd

class FinOSInteractive:
    def __init__(self):
        # Master Level Setup: Optimization for Apple Silicon (M1/M2/M3)
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        print(f"--- [FIN-OS] INITIALIZING NEURAL ENGINE ON: {self.device.upper()} ---")
        
        # Load FinBERT - The industry standard for financial sentiment
        self.nlp = pipeline("sentiment-analysis", model="ProsusAI/finbert", device=self.device)
        
    def analyze_stock(self, ticker):
        ticker = ticker.upper().strip()
        print(f"\n[SCANNING] Fetching live news for {ticker}...")
        
        stock_data = yf.Ticker(ticker)
        news = stock_data.news
        
        if not news:
            print(f"No news found for {ticker}. Is the ticker correct?")
            return

        impact_results = []
        for item in news[:10]: # Analyze top 10 news items
            # DEFENSIVE FETCH: Handles the KeyError you encountered
            title = item.get('title') or item.get('content', {}).get('title', "N/A")
            
            if title == "N/A": continue

            # AI Neural Sentiment Analysis
            sentiment = self.nlp(title)[0]
            label = sentiment['label']
            score = sentiment['score']
            
            # Master Level Economic Impact Mapping
            h_low = title.lower()
            impact, driver = "Neutral", "Market Noise"
            
            if any(w in h_low for w in ["fed", "inflation", "cpi", "rates"]):
                impact, driver = "Systemic", "Discount Rate (r)"
            elif any(w in h_low for w in ["earnings", "revenue", "profit", "sales"]):
                impact, driver = "Fundamental", "Cash Flow (Numerator)"
            elif any(w in h_low for w in ["sec", "lawsuit", "investigation"]):
                impact, driver = "Risk-Adjusted", "Risk Premium"

            impact_results.append({
                "Headline": title[:65] + "...",
                "Sentiment": label.upper(),
                "Impact": impact,
                "Factor": driver,
                "AI_Conf": f"{score:.1%}"
            })

        # Display results in a professional table
        df = pd.DataFrame(impact_results)
        print("\n" + "="*80)
        print(df.to_string(index=False))
        print("="*80 + "\n")

    def run(self):
        print("Welcome to FIN-OS: Real-Time Neural Impact Engine")
        print("Enter 'EXIT' to close the terminal.\n")
        while True:
            ticker = input(">>> Enter Stock Ticker (e.g., TSLA, NVDA, AAPL): ")
            if ticker.lower() == 'exit':
                break
            if not ticker:
                continue
            self.analyze_stock(ticker)

if __name__ == "__main__":
    engine = FinOSInteractive()
    engine.run()