// Main application logic for Global Pulse site

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('poster-grid');
    const posters = document.querySelectorAll('.poster-item');
    
    // Trigger poster animations with a stagger effect
    posters.forEach((poster, index) => {
        setTimeout(() => {
            poster.classList.add('is-visible');
        }, 600 + (index * 150)); // 600ms initial wait + 150ms per item
    });
    
    // 1. Загружаем индекс всех постеров
    fetch('archive/index.json')
        .then(response => response.json())
        .then(posters => {
            if (posters && posters.length > 0) {
                // Keep the static placeholders if they exist, or clear if you want only dynamic ones
                // For now, let's just append dynamic ones to show we're loading
                const dynamicContainer = document.createElement('div');
                dynamicContainer.style.display = 'contents';
                
                posters.forEach(poster => {
                    // Check if this date already exists in static placeholders to avoid duplicates
                    // For this design phase, we'll just let them coexist or you can comment out grid.innerHTML = ''
                });
            }
        })
        .catch(err => {
            console.log('Archive index not found yet, showing placeholders');
        });
});

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (targetDate.getTime() === today.getTime()) return 'Today';
    if (targetDate.getTime() === yesterday.getTime()) return 'Yesterday';
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getStableGradient(dateStr) {
    const colors = ["#ff2d55", "#ff6b35", "#ffb800", "#34c759", "#5ac8fa"];
    
    // Создаем число на основе строки даты (например "2026-01-31" -> 20260131)
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    
    // Функция для получения псевдослучайного числа на основе seed
    const pseudoRandom = (offset) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    const c1 = colors[Math.floor(pseudoRandom(1) * colors.length)];
    const c2 = colors[Math.floor(pseudoRandom(2) * colors.length)];
    
    const x1 = Math.floor(pseudoRandom(3) * 100);
    const y1 = Math.floor(pseudoRandom(4) * 100);
    const x2 = Math.floor(pseudoRandom(5) * 100);
    const y2 = Math.floor(pseudoRandom(6) * 100);

    return `radial-gradient(circle at ${x1}% ${y1}%, ${c1} 0%, transparent 60%), radial-gradient(circle at ${x2}% ${y2}%, ${c2} 0%, transparent 50%)`;
}
