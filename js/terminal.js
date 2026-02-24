const API_BASE = "http://127.0.0.1:5000";
let charts = {};

async function engageOmniScan() {
    const sym = document.getElementById('omniSearch').value.toUpperCase();
    const loader = document.getElementById('loadingMatrix');
    const grid = document.getElementById('omniGrid');
    
    loader.style.display = 'block';
    grid.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/god-mode?symbol=${sym}`);
        const json = await res.json();
        
        if(json.status === 'success') {
            renderOmni(json.data);
            loader.style.display = 'none';
            grid.style.display = 'grid';
        } else {
            alert("MATRIX ERROR: " + json.message);
            loader.style.display = 'none';
        }
    } catch(e) {
        console.error(e);
        alert("CRITICAL CONNECTION FAILURE");
        loader.style.display = 'none';
    }
}

function renderOmni(data) {
    const m = data.meta;
    const t = data.technicals;
    const f = data.fundamentals;
    const n = data.narratives;

    // 1. HERO
    document.getElementById('d_sym').innerText = m.symbol.split('.')[0];
    document.getElementById('d_name').innerText = m.name;
    document.getElementById('d_sector').innerText = (m.sector || "UNKNOWN").toUpperCase();
    document.getElementById('d_price').innerText = "₹" + fmt(m.price);
    
    const chg = document.getElementById('d_change');
    chg.innerText = m.change_p.toFixed(2) + "%";
    chg.style.color = m.change_p >= 0 ? '#CCFF00' : '#FF0055';

    // 2. NARRATIVES
    const feed = document.getElementById('narrativeFeed');
    feed.innerHTML = '';
    n.forEach(item => {
        feed.innerHTML += `
            <div class="narrative-item ${item.type}">
                <span class="n-title">${item.icon} ${item.title}</span>
                <span class="n-desc">${item.desc}</span>
            </div>
        `;
    });

    // 3. TECHNICALS (Dynamic Grid)
    const techGrid = document.getElementById('techGrid');
    techGrid.innerHTML = '';
    for (const [key, val] of Object.entries(t)) {
        if(typeof val !== 'object') { // Skip detailed sub-objects if any
            techGrid.innerHTML += `
                <div class="data-cell">
                    <span class="lbl">${key.replace(/_/g, ' ')}</span>
                    <span class="val" style="color:${valColor(key, val)}">${fmt(val)}</span>
                </div>
            `;
        }
    }

    // 4. FUNDAMENTALS (Dynamic Grid)
    const fundGrid = document.getElementById('fundGrid');
    fundGrid.innerHTML = '';
    for (const [key, val] of Object.entries(f)) {
        fundGrid.innerHTML += `
            <div class="data-cell">
                <span class="lbl">${key.replace(/_/g, ' ')}</span>
                <span class="val">${fmt(val)}</span>
            </div>
        `;
    }

    // 5. ADVANCED MODELS
    document.getElementById('m_graham').innerText = "₹" + fmt(f.Graham_Number);
    document.getElementById('m_fscore').innerText = f.Piotroski_Score + "/9";
    document.getElementById('m_zscore').innerText = fmt(f.Altman_Z);
    document.getElementById('m_ichi').innerText = t.Cloud_Status;

    // 6. CHARTS
    renderSpark(data.sparkline, m.change_p >= 0);
    renderRadar([
        Math.min(f.ROE, 30)/0.3, 
        t.RSI_14, 
        Math.max(0, 100 - f.PE_Trailing),
        f.Piotroski_Score * 11,
        Math.max(0, 100 - f.Debt_to_Equity)
    ]);
}

function fmt(n) { 
    if(typeof n === 'string') return n;
    return (n === null || n === undefined) ? '--' : n.toFixed(2); 
}

function valColor(key, val) {
    if(key.includes('RSI')) return val > 70 ? '#FF0055' : (val < 30 ? '#CCFF00' : '#EAEAEA');
    return '#EAEAEA';
}

function renderSpark(data, isUp) {
    if(charts.spark) charts.spark.destroy();
    const ctx = document.getElementById('mainSpark').getContext('2d');
    const color = isUp ? '#CCFF00' : '#FF0055';
    
    charts.spark = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(()=>''),
            datasets: [{
                data: data, borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.4,
                fill: true, backgroundColor: (c) => {
                    const g = c.chart.ctx.createLinearGradient(0,0,0,100);
                    g.addColorStop(0, color+'44'); g.addColorStop(1, 'transparent');
                    return g;
                }
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins:{legend:false}, scales:{x:{display:false}, y:{display:false}} }
    });
}

function renderRadar(dataPoints) {
    if(charts.radar) charts.radar.destroy();
    const ctx = document.getElementById('radarCanvas').getContext('2d');
    
    charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['GROWTH', 'MOMENTUM', 'VALUE', 'QUALITY', 'SAFETY'],
            datasets: [{
                data: dataPoints,
                borderColor: '#00F3FF', backgroundColor: 'rgba(0, 243, 255, 0.2)', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { angleLines: {color:'rgba(255,255,255,0.1)'}, grid: {color:'rgba(255,255,255,0.1)'}, pointLabels: {color:'#888', font:{size:9}}, ticks:{display:false, max: 100, min: 0} } },
            plugins: { legend: {display:false} }
        }
    });
}