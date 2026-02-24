document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById('scalpTableBody');
  const timerDisplay = document.getElementById('updateTimer');
  const liveStatus = document.querySelector('.live-status');
  
// --- TARGET LOCK (SINGLE STOCK SEARCH) LOGIC ---
  const searchInput = document.getElementById('stockSearch');
  const searchBtn = document.getElementById('searchBtn');
  const hud = document.getElementById('targetHud');
  const hudInsights = document.getElementById('hudInsights');

  // The core function to fetch and display single-stock metrics
  const executeTargetLock = async () => {
    const ticker = searchInput.value.toUpperCase().trim();
    if (!ticker) return;

    // 1. Enter Scanning Mode
    hud.style.display = 'block';
    document.getElementById('hudTicker').innerText = `SCANNING: ${ticker}...`;
    document.getElementById('hudPrice').innerText = '---';
    document.getElementById('hudProb').innerText = '--%';
    document.getElementById('hudSignal').innerText = 'ANALYZING TELEMETRY';
    document.getElementById('hudSignal').style.color = '#888';
    hudInsights.innerHTML = '<div class="insight-line">Establishing link to NSE Datacenter...</div>';

    try {
      // 2. Fetch Deep Diagnostic Data from Python Engine
      const response = await fetch(`http://localhost:8000/api/analyze?ticker=${ticker}`);
      const data = await response.json();

      if (data.error) {
        hudInsights.innerHTML = `<div class="insight-line" style="color:var(--neon-red);">[!] ERROR: ${data.error}</div>`;
        document.getElementById('hudTicker').innerText = 'TARGET LOST';
        return;
      }

      // 3. Update UI Elements instantly
// 3. Update UI Elements instantly (MAXIMUM METRICS)
      document.getElementById('hudTicker').innerText = `TARGET: ${data.ticker}`;
      document.getElementById('hudPrice').innerText = `₹${data.price.toLocaleString()}`;
      document.getElementById('hudScore').innerText = `${data.score} / 100`;
      
      document.getElementById('hudVwap').innerText = `${data.vwap_dev > 0 ? '+' : ''}${data.vwap_dev}%`;
      document.getElementById('hudVwap').style.color = data.vwap_dev > 0 ? 'var(--neon-lime)' : 'var(--neon-red)';
      
      document.getElementById('hudRsi').innerText = data.rsi;
      document.getElementById('hudRsi').style.color = (data.rsi > 75 || data.rsi < 30) ? 'var(--neon-red)' : 'var(--neon-lime)';
      
      document.getElementById('hudVol').innerText = `${data.vol_spike}x`;
      document.getElementById('hudVol').style.color = data.vol_spike > 1.5 ? 'var(--neon-lime)' : '#fff';

      // Inject the Extended Metrics
      document.getElementById('hudEma').innerText = data.extended.EMA_TREND;
      
      document.getElementById('hudMacd').innerText = data.extended.MACD;
      document.getElementById('hudMacd').style.color = data.extended.MACD === "Bullish" ? 'var(--neon-lime)' : 'var(--neon-red)';
      
      document.getElementById('hudStoch').innerText = data.extended.STOCH;
      document.getElementById('hudAtr').innerText = data.extended.ATR;
      document.getElementById('hudBb').innerText = data.extended.BB_WIDTH;

      // Probability Visuals
      const probCircle = document.querySelector('.prob-circle');
      document.getElementById('hudProb').innerText = `${data.probability}%`;
      
      if (data.probability > 60) {
        probCircle.style.borderColor = 'var(--neon-lime)';
        probCircle.style.boxShadow = '0 0 20px rgba(199,240,0,0.4)';
        document.getElementById('hudSignal').innerText = 'EXECUTION CLEAR';
        document.getElementById('hudSignal').style.color = 'var(--neon-lime)';
      } else {
        probCircle.style.borderColor = 'var(--neon-red)';
        probCircle.style.boxShadow = '0 0 20px rgba(255,71,87,0.4)';
        document.getElementById('hudSignal').innerText = 'ABORT / NO EDGE';
        document.getElementById('hudSignal').style.color = 'var(--neon-red)';
      }

      // 4. Typewriter Effect for Insights
      hudInsights.innerHTML = ''; 
      data.insights.forEach((insight, index) => {
        setTimeout(() => {
          const line = document.createElement('div');
          line.className = 'insight-line';
          if (insight.includes('[!]')) line.style.color = 'var(--neon-red)';
          line.innerText = insight;
          hudInsights.appendChild(line);
          hudInsights.scrollTop = hudInsights.scrollHeight; // Auto-scroll
        }, index * 600); 
      });

    } catch (err) {
      hudInsights.innerHTML = `<div class="insight-line" style="color:var(--neon-red);">[!] CONNECTION FAILED. Is the Python Engine running?</div>`;
    }
  };

  // Bind the execution logic to BOTH the Enter key and the Button click
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeTargetLock();
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', executeTargetLock);
  }

  // --- LIVE FEED TABLE LOGIC ---
  const isTradeWindow = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const timeFloat = hours + (minutes / 60);

    if (timeFloat >= 9.33 && timeFloat <= 11.5) return true;
    if (timeFloat >= 13.75 && timeFloat <= 15.25) return true;
    return false; 
  };

  const fetchLiveData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/scalp-signals');
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      
      if (tbody) tbody.innerHTML = ''; 
      
      const marketOpen = isTradeWindow();
      if (liveStatus) {
        if (marketOpen) {
          liveStatus.innerText = "🔴 NSE YFINANCE FEED ACTIVE";
          liveStatus.style.color = "var(--neon-red)";
        } else {
          liveStatus.innerText = "🟡 AFTER-HOURS EOD REVIEW MODE";
          liveStatus.style.color = "var(--neon-lime)";
          liveStatus.style.animation = "none"; 
        }
      }
      
      data.forEach(stock => {
        const scoreClass = stock.score > 75 ? 'score-high' : (stock.score > 50 ? 'score-mid' : 'score-low');
        let signal = 'WAIT';
        let signalClass = 'signal-wait';
        
        if (stock.score > 75) {
          signal = marketOpen ? 'EXECUTE LONG' : 'EXECUTE (EOD)';
          signalClass = 'signal-execute';
        } else {
           signal = marketOpen ? 'WAIT' : 'WAIT (EOD)';
        }

        const tr = document.createElement('tr');
        tr.style.animation = "blink 0.4s ease-out"; 
        
        tr.innerHTML = `
          <td style="color: #fff; font-weight:bold;">${stock.t}</td>
          <td style="color: #888;">${stock.tf}</td>
          <td class="${scoreClass}" style="font-weight:bold;">${stock.score} / 100</td>
          <td style="color: ${stock.is_above_vwap ? '#C7F000' : '#ff4757'};">${stock.vwap}</td>
          <td style="color: ${stock.vol_raw > 2.0 ? '#C7F000' : '#888'};">${stock.vol}</td>
          <td><span class="${signalClass}">${signal}</span></td>
        `;
        if (tbody) tbody.appendChild(tr);
      });
    } catch (error) {
      console.error("Failed to fetch live data:", error);
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ff4757; padding: 20px;">
        ⚠️ ENGINE OFFLINE. Start the Python server (python backend/main.py)
      </td></tr>`;
    }
  };

  fetchLiveData();

  let countdown = 60;
  setInterval(() => {
    countdown--;
    if (countdown <= 0) { 
      fetchLiveData(); 
      countdown = 60; 
    }
    if (timerDisplay) timerDisplay.innerText = `NEXT SCAN IN: ${countdown < 10 ? '0' : ''}${countdown}s`;
  }, 1000);
});