// Main application logic for Global Pulse site
// Motion is optional – posters display even if CDN is blocked or offline
let animate = null;
import("https://esm.sh/motion@10.18.0")
    .then(m => {
        animate = m.animate;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eab6802b-3337-47f9-95c2-ae765d8feb60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:Motion.then',message:'Motion loaded',data:{animateLoaded:!!animate},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        applyFirstPosterAnimationIfReady();
    })
    .catch((err) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eab6802b-3337-47f9-95c2-ae765d8feb60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:Motion.catch',message:'Motion failed to load',data:{error:String(err)},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
    });

function applyFirstPosterAnimationIfReady() {
    const gradientEl = document.querySelector('.poster-gradient-animated');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eab6802b-3337-47f9-95c2-ae765d8feb60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:applyFirstPosterAnimationIfReady',message:'called',data:{gradientElExists:!!gradientEl,animateAvailable:!!animate},hypothesisId:'B,E',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!gradientEl) return;
    const firstPosterLink = gradientEl.closest('.poster-item');
    if (!firstPosterLink) return;
    const dateStr = new URL(firstPosterLink.href).searchParams.get('date');
    if (!dateStr) return;

    const data = getStableGradientData(dateStr);
    // Path: start → mirror → opposite corner → mirror → back to start (5 keyframes = smoother loop)
    const x1Path = [data.x1, 100 - data.x1, 50, 100 - data.x1, data.x1];
    const y1Path = [data.y1, 100 - data.y1, 50, 100 - data.y1, data.y1];
    const x2Path = [data.x2, 100 - data.x2, 50, 100 - data.x2, data.x2];
    const y2Path = [data.y2, 100 - data.y2, 50, 100 - data.y2, data.y2];

    // Motion does NOT interpolate CSS custom properties smoothly (discrete steps only).
    // CSS fallback with @property interpolates correctly. Use CSS only.
    const existingAnim = gradientEl.style.animation || '';
    if (existingAnim.includes('gradient-kf-')) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eab6802b-3337-47f9-95c2-ae765d8feb60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:applyFirstPosterAnimationIfReady',message:'skipped - CSS already applied',data:{},hypothesisId:'F',runId:'post-fix',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eab6802b-3337-47f9-95c2-ae765d8feb60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:injectGradientKeyframes',message:'injecting CSS',data:{x1Path},hypothesisId:'F',runId:'post-fix',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    injectGradientKeyframes(gradientEl, { x1Path, y1Path, x2Path, y2Path });
}

// Pure CSS fallback: inject @keyframes so gradient animates even without Motion
function injectGradientKeyframes(gradientEl, { x1Path, y1Path, x2Path, y2Path }) {
    const id = 'gradient-kf-' + Math.random().toString(36).slice(2, 9);
    const steps = x1Path.length;
    let kf = '';
    for (let i = 0; i < steps; i++) {
        const pct = steps > 1 ? (i / (steps - 1)) * 100 : 0;
        kf += `${pct}%{--gx1:${x1Path[i]};--gy1:${y1Path[i]};--gx2:${x2Path[i]};--gy2:${y2Path[i]};}`;
    }
    const style = document.createElement('style');
    style.textContent = `@keyframes ${id}{${kf}}`;
    document.head.appendChild(style);
    const hadAnimation = !!gradientEl.style.animation;
    gradientEl.style.animation = `${id} 36s linear infinite`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eab6802b-3337-47f9-95c2-ae765d8feb60',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:injectGradientKeyframes',message:'CSS keyframes injected',data:{keyframeId:id,steps,pctList:[...Array(steps)].map((_,i)=>(steps>1?(i/(steps-1))*100:0)),hadAnimation},hypothesisId:'B,D,E',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('poster-grid');
    
    // 1. Load index of all posters
    fetch('archive/index.json?v=' + Date.now())
        .then(response => response.json())
        .then(posters => {
            if (posters && posters.length > 0) {
                // Clear grid before adding real data
                grid.innerHTML = '';
                
                posters.forEach((poster, index) => {
                    const item = document.createElement('a');
                    item.href = `poster.html?date=${poster.date}`;
                    item.className = 'poster-item';

                    const isFirstPoster = index === 0;

                    if (isFirstPoster) {
                        const data = getStableGradientData(poster.date);
                        const vars = `--gx1:${data.x1}; --gy1:${data.y1}; --gx2:${data.x2}; --gy2:${data.y2}; --c1:${data.c1}; --c2:${data.c2}`;
                        const bg = `radial-gradient(circle at calc(var(--gx1) * 1%) calc(var(--gy1) * 1%), var(--c1) 0%, transparent 60%), radial-gradient(circle at calc(var(--gx2) * 1%) calc(var(--gy2) * 1%), var(--c2) 0%, transparent 50%)`;
                        item.innerHTML = `
                            <div class="poster-preview">
                                <div class="poster-gradient-animated" style="width:100%; height:100%; opacity:0.6; background: ${bg}; ${vars};"></div>
                                <span class="poster-date">${formatDate(poster.date)}</span>
                            </div>
                        `;
                    } else {
                        item.innerHTML = `
                            <div class="poster-preview">
                                <div style="width:100%; height:100%; background: ${getStableGradient(poster.date)}; opacity: 0.6;"></div>
                                <span class="poster-date">${formatDate(poster.date)}</span>
                            </div>
                        `;
                    }
                    
                    grid.appendChild(item);

                    if (isFirstPoster) {
                        applyFirstPosterAnimationIfReady();
                    }

                    // Reveal with stagger – use setTimeout so posters appear even if IntersectionObserver fails
                    setTimeout(() => {
                        item.classList.add('is-visible');
                    }, index * 80);
                    observer.observe(item);
                });
            }
        })
        .catch(err => {
            console.error('Error loading posters:', err);
            grid.innerHTML = '<p class="reveal reveal-1">No posters found in archive.</p>';
        });
});

// The Scroll Watcher configuration
const observerOptions = {
    root: null,   // use the viewport
    rootMargin: '0px',
    threshold: 0.1 // trigger when 10% of the item is visible
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Add a tiny delay based on index to create a "wave" effect 
            // if multiple items appear at once (like on page load)
            setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, index * 100); // 100ms stagger between items
            
            // Stop watching this item once it's visible
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

function getStableGradient(dateStr) {
    const { x1, y1, x2, y2, c1, c2 } = getStableGradientData(dateStr);
    return `radial-gradient(circle at ${x1}% ${y1}%, ${c1} 0%, transparent 60%), radial-gradient(circle at ${x2}% ${y2}%, ${c2} 0%, transparent 50%)`;
}
