document.addEventListener("DOMContentLoaded", () => {
    // 1. Emotional Net Worth Chart (Radar)
    const ctx = document.getElementById('enwChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Health', 'Free Time', 'Sleep', 'Peace', 'Salary', 'Social Status'],
            datasets: [{
                label: 'The Average High-Earner',
                data: [4, 2, 3, 2, 10, 9],
                borderColor: '#ff4757',
                backgroundColor: 'rgba(255, 71, 87, 0.2)'
            }, {
                label: 'The FIN-OS Monk',
                data: [9, 8, 9, 9, 7, 5],
                borderColor: '#C7F000',
                backgroundColor: 'rgba(199, 240, 0, 0.2)'
            }]
        },
        options: {
            scales: {
                r: { 
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#aaa' }
                }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });

    // 2. Life-Energy Calculator Logic
    const itemInput = document.getElementById('itemPrice');
    const wageInput = document.getElementById('hourlyWage');
    const resultSpan = document.querySelector('#energyResult .highlight');

    function calculateEnergy() {
        const price = parseFloat(itemInput.value) || 0;
        const wage = parseFloat(wageInput.value) || 0;
        if(wage > 0) {
            const hours = (price / wage).toFixed(1);
            resultSpan.innerText = hours;
            gsap.from(resultSpan, { scale: 1.5, duration: 0.3 });
        }
    }

    itemInput.addEventListener('input', calculateEnergy);
    wageInput.addEventListener('input', calculateEnergy);

    // 3. GSAP Scroll Reveals
    gsap.utils.toArray('.c-card').forEach(card => {
        gsap.from(card, {
            scrollTrigger: card,
            opacity: 0,
            y: 100,
            duration: 1,
            ease: "power4.out"
        });
    });
});