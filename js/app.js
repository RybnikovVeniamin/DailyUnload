import { initAurora, renderStaticPoster, releaseStaticRenderer } from './aurora.js';

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('poster-grid');

    fetch('archive/index.json?v=' + Date.now())
        .then(response => response.json())
        .then(posters => {
            if (posters && posters.length > 0) {
                grid.innerHTML = '';

                posters.forEach((poster, index) => {
                    const item = document.createElement('a');
                    item.href = `poster.html?date=${poster.date}`;
                    item.className = 'poster-item';

                    const isFirstPoster = index === 0;

                    const data = getStableGradientData(poster.date);

                    if (isFirstPoster) {
                        item.innerHTML = `
                            <div class="poster-preview">
                                <canvas class="poster-aurora-canvas" data-c1="${data.c1}" data-c2="${data.c2}"></canvas>
                                <span class="poster-date">${formatDate(poster.date)}</span>
                            </div>
                        `;
                    } else {
                        item.innerHTML = `
                            <div class="poster-preview">
                                <img class="poster-static-canvas" alt="">
                                <span class="poster-date">${formatDate(poster.date)}</span>
                            </div>
                        `;
                    }

                    grid.appendChild(item);

                    if (isFirstPoster) {
                        const auroraCanvas = item.querySelector('.poster-aurora-canvas');
                        if (auroraCanvas) {
                            initAurora(auroraCanvas, data.c1, data.c2);
                        }
                    } else {
                        const imgEl = item.querySelector('.poster-static-canvas');
                        if (imgEl) {
                            const seed = parseInt(poster.date.replace(/-/g, '')) || 0;
                            const dpr = Math.min(window.devicePixelRatio || 1, 2);
                            renderStaticPoster(imgEl, data.c1, data.c2, data.x1, data.y1, data.x2, data.y2, seed, Math.round(296 * dpr), Math.round(358 * dpr));
                        }
                    }

                    setTimeout(() => {
                        item.classList.add('is-visible');
                    }, index * 80);
                    observer.observe(item);
                });

                releaseStaticRenderer();
            }
        })
        .catch(err => {
            console.error('Error loading posters:', err);
            grid.innerHTML = '<p class="reveal reveal-1">No posters found in archive.</p>';
        });
});

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, index * 100);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

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

function getStableGradientData(dateStr) {
    const colors = ["#ff2d55", "#ff6b35", "#ffb800", "#34c759", "#5ac8fa"];
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    const pseudoRandom = (offset) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };
    return {
        c1: colors[Math.floor(pseudoRandom(1) * colors.length)],
        c2: colors[Math.floor(pseudoRandom(2) * colors.length)],
        x1: Math.floor(pseudoRandom(3) * 100),
        y1: Math.floor(pseudoRandom(4) * 100),
        x2: Math.floor(pseudoRandom(5) * 100),
        y2: Math.floor(pseudoRandom(6) * 100)
    };
}
