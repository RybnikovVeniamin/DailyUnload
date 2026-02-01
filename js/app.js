// Main application logic for Global Pulse site

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('poster-grid');
    
    // 1. Загружаем индекс всех постеров
    fetch('archive/index.json?v=' + Date.now())
        .then(response => response.json())
        .then(posters => {
            if (posters && posters.length > 0) {
                // Очищаем сетку перед добавлением реальных данных
                grid.innerHTML = '';
                
                posters.forEach((poster, index) => {
                    const item = document.createElement('a');
                    item.href = `poster.html?date=${poster.date}`;
                    item.className = 'poster-item';
                    
                    // Создаем красивое превью на основе даты
                    item.innerHTML = `
                        <div class="poster-preview">
                            <div style="width:100%; height:100%; background: ${getStableGradient(poster.date)}; opacity: 0.6;"></div>
                        </div>
                        <div class="poster-info">
                            <span class="poster-date">${formatDate(poster.date)}</span>
                        </div>
                    `;
                    
                    grid.appendChild(item);

                    // Запускаем анимацию появления с задержкой
                    setTimeout(() => {
                        item.classList.add('is-visible');
                    }, 100 + (index * 150));
                });
            }
        })
        .catch(err => {
            console.error('Error loading posters:', err);
            grid.innerHTML = '<p class="reveal reveal-1">No posters found in archive.</p>';
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
