document.addEventListener("DOMContentLoaded", () => {
    // Quant DNA Radar Configuration
    const ctx = document.getElementById('quantDnaChart').getContext('2d');
    
    

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Volatility Alpha', 'Trend Velocity', 'Gap Resilience', 'Mean Reversion', 'Institutional Density'],
            datasets: [{
                label: 'Asset DNA Signature',
                data: [65, 88, 55, 70, 90],
                backgroundColor: 'rgba(79, 124, 255, 0.15)',
                borderColor: '#4F7CFF',
                borderWidth: 2,
                pointBackgroundColor: '#C7F000'
            }]
        },
        options: {
            scales: {
                r: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#9CA0AB', font: { size: 12, family: 'JetBrains Mono' } },
                    ticks: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Orb Pulse Logic
    const orb = document.getElementById('quantumOrb');
    orb.addEventListener('mouseenter', () => {
        orb.style.boxShadow = '0 0 80px rgba(79, 124, 255, 0.6)';
        document.getElementById('prob-percent').innerText = "CALC...";
        setTimeout(() => { document.getElementById('prob-percent').innerText = "74%"; }, 600);
    });
});