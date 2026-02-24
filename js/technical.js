document.addEventListener("DOMContentLoaded", () => {
  const stockInput = document.getElementById('stockInput');
  const scanBtn = document.getElementById('scanBtn');
  const dashboard = document.getElementById('terminal-dashboard');
  const loader = document.getElementById('loader');
  const modal = document.getElementById('decoderModal');
  const closeModal = document.querySelector('.close-modal');

  // --- 1. SEARCH LOGIC ---
  scanBtn.addEventListener('click', () => {
    const ticker = stockInput.value.toUpperCase().trim();
    if (!ticker) return;

    // UI Reset
    dashboard.classList.add('hidden');
    dashboard.classList.remove('active');
    loader.classList.remove('hidden');

    // FETCH REAL DATA
    fetchData(ticker);
  });

  stockInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scanBtn.click();
  });

  // --- 2. FETCH REAL DATA FROM PYTHON ---
  async function fetchData(ticker) {
    try {
      // Connect to local Python server
      const response = await fetch(`http://127.0.0.1:5000/api/scan/${ticker}`);
      const data = await response.json();

      if (data.error) {
        alert("STOCK NOT FOUND. CHECK SPELLING (e.g., RELIANCE, INFY).");
        loader.classList.add('hidden');
        return;
      }

      renderDashboard(data);
      loader.classList.add('hidden');
      dashboard.classList.remove('hidden');
      
      // Trigger Animation
      void dashboard.offsetWidth;
      dashboard.classList.add('active');

    } catch (error) {
      console.error(error);
      alert("ENGINE OFFLINE. RUN 'python server.py' FIRST.");
      loader.classList.add('hidden');
    }
  }

  // --- 3. RENDER DASHBOARD ---
  function renderDashboard(data) {
    // Basic Info
    document.getElementById('stockName').innerText = data.symbol.replace('.NS', '');
    document.getElementById('stockTicker').innerText = data.symbol;
    document.getElementById('currentPrice').innerText = data.price.toLocaleString("en-IN");
    
    const changeEl = document.getElementById('priceChange');
    const sign = data.change > 0 ? '+' : '';
    changeEl.innerText = `${sign}${data.change}%`;
    changeEl.className = `change ${data.change >= 0 ? 'positive' : 'negative'}`;

    // Engine Values
    document.getElementById('regimeValue').innerText = data.regime;
    document.getElementById('smartMoneyValue').innerText = data.smart_money;
    document.getElementById('volatilityValue').innerText = data.volatility;
    
    // Technical Sub-text
    document.getElementById('adxValue').innerText = `${data.adx_value} (ADX)`;
    document.getElementById('volValue').innerText = `${data.vol_ratio}x Avg Vol`;

    // Probability & DNA
    document.getElementById('upProb').innerText = data.probability + '%';
    document.getElementById('downProb').innerText = (100 - data.probability) + '%';
    
    // Assign DNA based on Volatility
    let dna = "🐢 THE TURTLE (Stable)";
    if(data.volatility === 'EXPANSION') dna = "🚀 ELON MUSK (High Beta)";
    if(data.smart_money === 'ACCUMULATION') dna = "🐋 THE WHALE (Institutional Buy)";
    document.getElementById('stockDNA').innerText = dna;

    // Render Chart with Real History
    initChart(data.price_history, data.change >= 0);
  }

  // --- 4. CHART.JS LOGIC (REAL DATA) ---
  let myChart = null;
  function initChart(priceHistory, isPositive) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const color = isPositive ? '#C7F000' : '#ff003c'; // Green or Red based on change

    if(myChart) myChart.destroy();

    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(priceHistory.length).fill(''), // Empty labels for clean look
        datasets: [{
          label: 'Price Action (Last 50 Days)',
          data: priceHistory,
          borderColor: color,
          backgroundColor: isPositive ? 'rgba(199, 240, 0, 0.1)' : 'rgba(255, 0, 60, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { grid: { display: false, drawBorder: false } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  // --- 5. EXPLANATION SYSTEM (SAME AS BEFORE) ---
  window.explain = function(topic) {
    modal.classList.remove('hidden');
    const title = document.getElementById('modalTitle');
    const formal = document.getElementById('formalText');
    const desi = document.getElementById('desiText');

    if (topic === 'regime') {
      title.innerText = "MARKET REGIME";
      formal.innerText = "Calculated using ADX (Average Directional Index). ADX > 25 indicates a strong trend.";
      desi.innerText = "If this says 'TRENDING', the stock is on the Yamuna Expressway. Don't stand in front of a speeding car.";
    } 
    else if (topic === 'smartmoney') {
      title.innerText = "SMART MONEY";
      formal.innerText = "Compares today's volume against the 20-day moving average volume to detect anomalies.";
      desi.innerText = "If volume is high but price isn't moving much, the 'Whales' (FIIs) are silently filling their bags. Watch out.";
    }
    else if (topic === 'volatility') {
      title.innerText = "VOLATILITY SQUEEZE";
      formal.innerText = "Bollinger Bandwidth is extremely narrow (< 0.10), indicating a period of low variance.";
      desi.innerText = "The 'Pressure Cooker' effect. The stock is too quiet. Energy is building up for a massive blast (up or down).";
    }
  };

  closeModal.addEventListener('click', () => { modal.classList.add('hidden'); });
  window.onclick = function(event) { if (event.target == modal) modal.classList.add('hidden'); };
});