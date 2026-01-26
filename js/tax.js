document.addEventListener('DOMContentLoaded', () => {
  
  // 1. SCROLL PROGRESS BAR
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / scrollHeight) * 100;
    document.querySelector('.scroll-progress').style.width = scrolled + "%";
  });

  // 2. REGIME TOGGLE LOGIC
  const toggleInput = document.getElementById('regimeToggle');
  const displayArea = document.getElementById('regimeContent');

  const oldRegimeHTML = `
    <div class="regime-card fade-in">
      <h3 style="color:#4F7CFF">🏛️ OLD REGIME (Legacy)</h3>
      <p>High Tax Rates but <strong>High Deductions</strong>.</p>
      <ul style="text-align:left; max-width:300px; margin:0 auto;">
        <li>✅ Rent (HRA) is tax-free.</li>
        <li>✅ Investments (80C) reduce tax.</li>
        <li>✅ Health Insurance (80D) reduces tax.</li>
      </ul>
      <div class="desi-tip">"Good for the 'Saver' Type (Family man, Home loans)."</div>
    </div>
  `;

  const newRegimeHTML = `
    <div class="regime-card fade-in">
      <h3 style="color:#C7F000">🚀 NEW REGIME (Streamlined)</h3>
      <p>Lower Tax Rates but <strong>Zero Deductions</strong>.</p>
      <ul style="text-align:left; max-width:300px; margin:0 auto;">
        <li>❌ HRA is taxable.</li>
        <li>❌ Investments give NO tax benefit.</li>
        <li>✅ Tax-free up to ₹7 Lakhs income.</li>
      </ul>
      <div class="desi-tip">"Good for the 'Spender' Type (Gen Z, No loans)."</div>
    </div>
  `;

  if(toggleInput) {
    toggleInput.addEventListener('change', () => {
      if (toggleInput.checked) {
        displayArea.innerHTML = newRegimeHTML;
      } else {
        displayArea.innerHTML = oldRegimeHTML;
      }
    });
    // Set default state visual
    displayArea.innerHTML = oldRegimeHTML; 
  }

  // 3. INTERSECTION OBSERVER FOR ANIMATIONS
  const sections = document.querySelectorAll('.tax-section');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => {
    section.style.opacity = "0";
    section.style.transform = "translateY(30px)";
    observer.observe(section);
  });

});


