import yfinance as yf
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

# 1. Setup the Brain
model_path = "ProsusAI/finbert"
print("Connecting to FIN-OS Intelligence...")
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)
analyzer = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)

def analyze_stock(ticker):
    print(f"\n[Jarvis] Fetching live news for {ticker}...")
    
    stock = yf.Ticker(ticker)
    news_list = stock.news 
    
    if not news_list:
        print(f"No recent news found for {ticker}.")
        return

    print(f"{'SENTIMENT':<12} | {'HEADLINE'}")
    print("-" * 60)

    for item in news_list[:5]:
        # 2026 UPDATE: Yahoo often changes keys. Let's look for common ones.
        # We check 'title', then 'headline', then 'content'
        title = item.get('title') or item.get('headline') or item.get('summary')
        
        # If still nothing, Jarvis will look into the first 100 characters of the 'content'
        if not title and 'content' in item:
             title = item['content'].get('title', 'No Title Available')

        if title == 'No Title Available':
            # This is a fallback: Print the keys so you can see what changed
            print(f"DEBUG: Found keys {list(item.keys())}")
            continue

        result = analyzer(title[:512])[0]
        label = result['label'].upper()
        score = result['score']
        
        print(f"{label:<12} ({score:.2f}) | {title}")
# 4. Interactive Terminal
while True:
    target = input("\n[Jarvis] Enter Ticker (e.g., RELIANCE.NS, TSLA, AAPL) or 'q' to quit: ")
    if target.lower() in ['q', 'quit']: break
    
    try:
        analyze_stock(target)
    except Exception as e:
        print(f"Error: {e}")