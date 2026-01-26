/* =========================================
   FIN-OS INTELLIGENCE: HIGH-YIELD SCRAPER
   ========================================= */

const PROXY_BASE = "https://api.allorigins.win/get?url=";

// 1. BROADER SEARCH QUERIES (To ensure we get enough raw items to filter)
const URL_INDIA = "https://news.google.com/rss/search?q=business+finance+india+when:2d&hl=en-IN&gl=IN&ceid=IN:en";
const URL_GLOBAL = "https://news.google.com/rss/search?q=global+markets+economy+finance+when:2d&hl=en-US&gl=US&ceid=US:en";

// DOM Elements
const newsContainer = document.getElementById('newsFeed');
const connectionStatus = document.getElementById('connectionStatus');
const loader = document.querySelector('.loader-screen');
const filterButtons = document.querySelectorAll('.dock-btn');

// --- 1. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initScraper();
});

async function initScraper() {
  if(newsContainer) newsContainer.innerHTML = '';
  updateStatus("ACQUIRING TARGETS...", "#f1c40f");
  console.log("Starting High-Yield Fetch...");

  try {
    const [rawIndia, rawGlobal] = await Promise.all([
      scrapeFeed(URL_INDIA, "India"),
      scrapeFeed(URL_GLOBAL, "Global")
    ]);

    // --- SMART FILTERING ENGINE ---
    
    // 1. Process Indian News (Target: 10)
    let indiaFinal = filterTrustedSources(rawIndia, ['Mint', 'MoneyControl', 'Hindu', 'Times', 'Standard', 'Express']);
    
    // 2. Process Global News (Target: 5)
    let globalFinal = filterTrustedSources(rawGlobal, ['Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'Financial', 'BBC']);

    // 3. Ensure Exact Counts (Slice)
    indiaFinal = indiaFinal.slice(0, 10);
    globalFinal = globalFinal.slice(0, 5);

    // 4. Merge
    const finalFeed = [...indiaFinal, ...globalFinal];

    if (finalFeed.length > 0) {
      renderNews(finalFeed);
      updateStatus(`SYSTEM ONLINE: ${indiaFinal.length} IN / ${globalFinal.length} GL`, "#2ecc71");
    } else {
      updateStatus("NO DATA RECEIVED", "#e74c3c");
      renderErrorState();
    }

  } catch (error) {
    console.error("Scrape Error:", error);
    updateStatus("CONNECTION ERROR", "#e74c3c");
    renderErrorState();
  } finally {
    hideLoader();
  }
}

// --- 2. SCRAPER ENGINE ---
async function scrapeFeed(targetUrl, regionTag) {
  try {
    const response = await fetch(PROXY_BASE + encodeURIComponent(targetUrl));
    const data = await response.json();
    if (!data.contents) return [];

    const parser = new DOMParser();
    const xml = parser.parseFromString(data.contents, "text/xml");
    const items = Array.from(xml.querySelectorAll("item")).slice(0, 30); 

    return items.map((item, index) => {
      const title = item.querySelector("title")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const dateStr = item.querySelector("pubDate")?.textContent || new Date();
      const source = item.querySelector("source")?.textContent || "Google News";
      
      return {
        id: regionTag + index,
        title: title,
        link: link,
        time: timeAgo(new Date(dateStr)),
        rawDate: new Date(dateStr),
        source: source,
        region: regionTag,
        type: determineType(title)
      };
    });

  } catch (e) {
    console.warn(`Failed to scrape ${regionTag}:`, e);
    return [];
  }
}

// --- 3. FILTER LOGIC ---
function filterTrustedSources(items, trustedKeywords) {
  const sorted = items.sort((a, b) => b.rawDate - a.rawDate);
  const trusted = sorted.filter(item => {
    const s = item.source.toLowerCase();
    const t = item.title.toLowerCase();
    return trustedKeywords.some(keyword => s.includes(keyword.toLowerCase()) || t.includes(keyword.toLowerCase()));
  });

  if (trusted.length >= 5) {
    return trusted;
  } else {
    const others = sorted.filter(item => !trusted.includes(item));
    return [...trusted, ...others]; 
  }
}

// --- 4. RENDERER ---
function renderNews(newsArray) {
  newsContainer.innerHTML = '';

  newsArray.forEach(news => {
    const card = document.createElement('div');
    card.className = `news-card ${news.type} ${news.region.toLowerCase()}`;
    
    const imageGradient = getPlaceholderImage(news.type);

    card.innerHTML = `
      <a href="${news.link}" target="_blank" style="text-decoration:none; display:flex; width:100%; color:inherit;">
        <div class="news-visual" style="background: ${imageGradient}">
          <div class="news-type-badge">${news.region.toUpperCase()}</div>
        </div>
        <div class="news-content">
          <div class="news-meta">
            <span class="source">${news.source}</span>
            <span class="time">${news.time}</span>
          </div>
          <h3>${news.title}</h3>
          <div class="news-footer">
            <span class="impact-tag">${news.type}</span>
            <span class="read-btn">READ ➔</span>
          </div>
        </div>
      </a>
    `;

    newsContainer.appendChild(card);
  });
}

// --- 5. SMART FILTER INTERACTION ---
window.filterNews = function(category) {
  const cards = document.querySelectorAll('.news-card');

  // STEP 1: CHECK IF ANYTHING EXISTS
  // If user asks for 'crypto' but there are 0 crypto cards, we STOP here.
  if (category !== 'all') {
    const count = Array.from(cards).filter(c => c.classList.contains(category)).length;
    if (count === 0) {
      console.log(`Filter Aborted: No items found for ${category}`);
      return; // Do nothing
    }
  }

  // STEP 2: UPDATE BUTTONS
  // (Only runs if items exist)
  filterButtons.forEach(btn => btn.classList.remove('active'));
  // Find the button that was clicked or matches the category
  if(event && event.target) {
     event.target.classList.add('active');
  }

  // STEP 3: UPDATE VIEW
  cards.forEach(card => {
    if (category === 'all') {
      card.style.display = 'flex';
    } else {
      // Toggle visibility based on class match
      card.style.display = card.classList.contains(category) ? 'flex' : 'none';
    }
  });
}

// --- 6. UTILITIES ---
function determineType(title) {
  const t = title.toLowerCase();
  if (t.includes('sensex') || t.includes('nifty') || t.includes('stock') || t.includes('ipo') || t.includes('shares')) return 'stocks';
  if (t.includes('bitcoin') || t.includes('crypto') || t.includes('coin') || t.includes('ethereum')) return 'crypto';
  return 'macro';
}

function getPlaceholderImage(type) {
  if(type === 'crypto') return 'linear-gradient(135deg, #8e44ad, #9b59b6)';
  if(type === 'stocks') return 'linear-gradient(135deg, #2980b9, #3498db)';
  return 'linear-gradient(135deg, #d35400, #e67e22)'; 
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

function updateStatus(text, color) {
  if(connectionStatus) {
    connectionStatus.innerText = text;
    connectionStatus.style.color = color;
    connectionStatus.style.textShadow = `0 0 10px ${color}`;
  }
}

function hideLoader() {
  if(loader) loader.style.display = 'none';
}

function renderErrorState() {
  newsContainer.innerHTML = `
    <div style="text-align:center; padding: 50px; opacity:0.7;">
      <h3>Retrying...</h3>
      <p>Connection unstable. Attempting to switch nodes.</p>
      <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; cursor:pointer;">FORCE RELOAD</button>
    </div>
  `;
}