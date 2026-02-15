// ========================================
// Global Pulse — Redesigned Poster Sketch
// ========================================

let canvas;
let topStories = [];
let currentBottomWord = "";
let headerBounds = []; // Store header bounds
let bottomWordBlotter = null;
let bottomWordMaterial = null;

function initBlotter(text) {
    const bottomWordEl = document.getElementById('bottom-word');
    if (!bottomWordEl) return;

    // Clear existing content
    bottomWordEl.innerHTML = '';
    
    // Use date-based seed so parameters are stable throughout the day
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    const rawSeed = parseInt(dateStr.replace(/-/g, '')) || 0;
    
    // Hash the seed to spread similar dates far apart in the random space.
    // Without this, consecutive dates (20260209, 20260210) produce nearly
    // identical random values because p5's LCG doesn't diffuse close seeds.
    const hashedSeed = Math.floor(Math.abs(Math.sin(rawSeed * 9301 + 49297) * 233280));
    randomSeed(hashedSeed);
    
    // Generate daily random values — wider ranges for visible daily variation
    let dailyOffset = random(0.02, 0.15);  // channel split amount (was 0.015–0.051, too narrow)
    let dailyRotation = random(0, 360);     // split angle in degrees
    
    // Create material
    if (typeof Blotter !== 'undefined' && Blotter.ChannelSplitMaterial) {
        bottomWordMaterial = new Blotter.ChannelSplitMaterial();
        bottomWordMaterial.uniforms.uOffset.value = dailyOffset;
        bottomWordMaterial.uniforms.uRotation.value = dailyRotation;
        bottomWordMaterial.uniforms.uApplyBlur.value = 1; // always on
        bottomWordMaterial.uniforms.uAnimateNoise.value = 1; // always on
        
        // Match the background color for the RGB splitting effect
        // [R, G, B, A] in 0.0 to 1.0 range. #08090c is approx [0.03, 0.035, 0.047, 1.0]
        bottomWordMaterial.uniforms.uBlendColor.value = [0.03, 0.035, 0.047, 1.0];
        
        // Scale Blotter text size for mobile screens
        const blotterSize = isMobile() ? Math.max(40, window.innerWidth * 0.14) : 80;
        const blotterPad = isMobile() ? 20 : 40;

        // Create text
        const textObj = new Blotter.Text(text, {
            family: "'PP Neue Bit', serif",
            size: blotterSize,
            fill: "#e8e9eb",
            weight: 700,
            paddingLeft: blotterPad,
            paddingRight: blotterPad,
            paddingTop: blotterPad,
            paddingBottom: 0
        });
        
        // Create Blotter instance
        bottomWordBlotter = new Blotter(bottomWordMaterial, {
            texts: textObj
        });
        
        // Append to element
        const scope = bottomWordBlotter.forText(textObj);
        scope.appendTo(bottomWordEl);
    } else {
        // Fallback if Blotter not loaded
        console.warn("Blotter.js not loaded, using standard text");
        bottomWordEl.innerText = text;
    }
}

const DESKTOP_WIDTH = 600;
const DESKTOP_HEIGHT = 800;

// Detect if the device is a smartphone (used throughout the sketch)
function isMobile() {
    return window.innerWidth <= 768;
}

// Return the correct canvas dimensions based on device
function getCanvasSize() {
    if (isMobile()) {
        return { w: window.innerWidth, h: window.innerHeight };
    }
    return { w: DESKTOP_WIDTH, h: DESKTOP_HEIGHT };
}

async function setup() {
    const size = getCanvasSize();
    canvas = createCanvas(size.w, size.h);
    canvas.parent('canvas-container');
    
    // Use lower pixel density on mobile for performance
    pixelDensity(isMobile() ? 1 : 2);
    noLoop();
    
    // 1. Fetch real data (from specific archive file if date param exists, otherwise latest.json)
    await fetchPosterData();
    
    // 2. Update HTML elements (Titles + Top Text + Bottom Word)
    updateUI();
    
    // Give the browser time to render HTML so we can measure title positions
    setTimeout(() => {
        calculateHeaderBounds();
        drawPoster();
    }, 100);

    // 4. Export data for the website (only if we're on the latest poster)
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('date')) {
        exportPosterData();
    }

    // 5. Setup interaction listeners (hover on desktop, tap on mobile)
    setupTitleHovers();
}

// Handle orientation changes and resizes on mobile
function windowResized() {
    if (isMobile()) {
        resizeCanvas(window.innerWidth, window.innerHeight);
        setTimeout(() => {
            calculateHeaderBounds();
            drawPoster();
        }, 150);
    }
}

function setupTitleHovers() {
    const card = document.getElementById('news-card');
    const cardImg = document.getElementById('news-card-image');
    const cardDesc = document.getElementById('news-card-description');
    const cardLink = document.getElementById('news-card-link');
    const container = document.querySelector('.poster-container');
    const overlay = document.querySelector('.poster-dim-overlay');
    const titles = [1, 2, 3].map(id => document.getElementById(`title-${id}`));

    // Helper: populate and show the news card for a given story
    function showCard(story, titleEl) {
        if (!story || !story.description || !story.imageUrl) return;

        // Always clear leftover inline styles before opening
        card.style.transform = '';
        card.style.transition = '';

        cardDesc.innerText = story.description;
        cardLink.href = story.url || '#';
        cardImg.src = story.imageUrl;
        cardImg.parentElement.style.display = 'block';

        card.classList.add('active');
        container.classList.add('is-dimmed');
        titles.forEach(t => t.classList.remove('is-active'));
        titleEl.classList.add('is-active');
    }

    // Helper: hide the news card and remove dim effect
    function hideCard() {
        card.classList.remove('active');
        container.classList.remove('is-dimmed');
        titles.forEach(t => t.classList.remove('is-active'));
    }

    if (isMobile()) {
        // ---- MOBILE: tap to show bottom sheet, tap outside to dismiss ----

        // Move card out of .poster-container and into <body> so that
        // position:fixed truly anchors to the viewport (transforms on
        // ancestors create a new containing block and break fixed positioning)
        document.body.appendChild(card);

        // Clear any inline positioning left over from desktop styles
        card.style.left = '';
        card.style.top = '';
        card.style.right = '';
        card.style.bottom = '';

        titles.forEach((titleEl, i) => {
            if (!titleEl) return;
            titleEl.style.pointerEvents = 'auto';
            titleEl.style.cursor = 'pointer';

            titleEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const story = topStories[i];

                // If this card is already showing for this title, navigate to the article
                if (titleEl.classList.contains('is-active') && card.classList.contains('active')) {
                    window.open(story.url || '#', '_blank');
                    return;
                }

                showCard(story, titleEl);
            });
        });

        // Tap on the dim overlay to dismiss the bottom sheet
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            hideCard();
        });

        // Also allow tapping the card link area on mobile
        cardLink.style.pointerEvents = 'auto';

        // ---- Swipe-down gesture to dismiss the bottom sheet ----
        let touchStartY = 0;
        let touchCurrentY = 0;
        let isDragging = false;

        card.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchCurrentY = touchStartY;
            isDragging = true;
            // Disable the smooth transition while the user is dragging
            card.style.transition = 'none';
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            touchCurrentY = e.touches[0].clientY;
            const deltaY = touchCurrentY - touchStartY;

            // Only allow dragging downward (positive delta)
            if (deltaY > 0) {
                card.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });

        card.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            const deltaY = touchCurrentY - touchStartY;

            if (deltaY > 80) {
                // Swiped far enough — animate to fully hidden, then clean up
                card.style.transition = '';          // restore CSS transition
                card.style.transform = 'translateY(100%)'; // slide off-screen

                // After the slide-out animation finishes, remove .active and
                // clear inline styles so the card is ready for next open
                card.addEventListener('transitionend', function reset() {
                    card.removeEventListener('transitionend', reset);
                    card.style.transform = '';
                    card.style.transition = '';
                    hideCard();
                });
            } else {
                // Didn't swipe far enough — snap back to open position
                card.style.transition = '';  // restore CSS transition
                card.style.transform = '';   // CSS .active translateY(0) takes over
            }
        });

    } else {
        // ---- DESKTOP: hover to show tooltip, follows cursor ----
        titles.forEach((titleEl, i) => {
            if (!titleEl) return;
            titleEl.style.pointerEvents = 'auto';
            titleEl.style.cursor = 'pointer';

            titleEl.addEventListener('mouseenter', (e) => {
                const story = topStories[i];
                showCard(story, titleEl);

                // Make title clickable to open article
                titleEl.onclick = () => {
                    window.open(story.url || '#', '_blank');
                };
            });

            titleEl.addEventListener('mousemove', (e) => {
                const containerRect = container.getBoundingClientRect();
                const x = e.clientX - containerRect.left;
                const y = e.clientY - containerRect.top + 15;
                const finalX = x + 15;

                card.style.left = `${finalX}px`;
                card.style.top = `${y}px`;
            });
        });

        // Hide card when mouse leaves the poster container entirely
        container.addEventListener('mouseleave', (e) => {
            if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
                hideCard();
            }
        });
    }
}

function calculateHeaderBounds() {
    headerBounds = [];
    // Headers
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`title-${i}`);
        if (el && el.innerText.trim() !== "") {
            const rect = el.getBoundingClientRect();
            const containerRect = document.querySelector('.poster-container').getBoundingClientRect();
            
            headerBounds.push({
                type: 'title',
                top: rect.top - containerRect.top,
                bottom: rect.bottom - containerRect.top,
                left: rect.left - containerRect.left,
                right: rect.right - containerRect.left
            });
        }
    }
    // Top description blocks
    const expBlocks = document.querySelectorAll('.explanation-block');
    expBlocks.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const containerRect = document.querySelector('.poster-container').getBoundingClientRect();
        headerBounds.push({
            type: 'exp',
            id: i, // Add ID for precise identification
            top: rect.top - containerRect.top,
            bottom: rect.bottom - containerRect.top,
            left: rect.left - containerRect.left,
            right: rect.right - containerRect.left
        });
    });
    // Large word at bottom
    const bottomWord = document.getElementById('bottom-word');
    if (bottomWord) {
        const rect = bottomWord.getBoundingClientRect();
        const containerRect = document.querySelector('.poster-container').getBoundingClientRect();
        headerBounds.push({
            type: 'bottom',
            top: rect.top - containerRect.top,
            bottom: rect.bottom - containerRect.top,
            left: rect.left - containerRect.left,
            right: rect.right - containerRect.left
        });
    }
}

async function fetchPosterData() {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    // Add cache buster to ensure we don't see old data
    const cacheBuster = `?v=${Date.now()}`;
    const dataFile = dateParam ? `archive/poster-${dateParam}.json${cacheBuster}` : `latest.json${cacheBuster}`;

    console.log(`📡 Loading data from ${dataFile}...`);
    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data && data.stories) {
            topStories = data.stories;
            currentBottomWord = data.bottomWord || "";
            console.log("✅ Data loaded:", topStories, "Word of the day:", currentBottomWord);
        }
    } catch (e) {
        console.error(`❌ Error loading ${dataFile}:`, e);
        // Fallback to latest.json if archive fails
        if (dateParam) {
            console.log("🔄 Falling back to latest.json...");
            try {
                const fallbackResponse = await fetch(`latest.json?v=${Date.now()}`);
                const fallbackData = await fallbackResponse.json();
                topStories = fallbackData.stories;
                currentBottomWord = fallbackData.bottomWord || "";
            } catch (fallbackErr) {
                console.error("❌ Fallback also failed");
            }
        }
    }
}

function exportPosterData() {
    const dataToExport = {
        date: new Date().toISOString().split('T')[0],
        displayDate: getTodayFormatted(),
        bottomWord: document.getElementById('bottom-word').innerText,
        stories: topStories
    };
    
    console.log("💾 Site data prepared:", dataToExport);
}

// Choose key word based on news sentiment
function getSentimentWord(stories) {
    const text = stories.map(s => (s.headline + " " + s.description).toUpperCase()).join(" ");
    
    // Dictionaries for analysis
    const tensionWords = ["WAR", "CONFLICT", "CRISIS", "DEAD", "ATTACK", "PROTEST", "TENSION", "FIGHT"];
    const powerWords = ["ELECTION", "TRUMP", "BIDEN", "GOVERNMENT", "POLICY", "POWER", "LEADER"];
    const economyWords = ["ECONOMY", "MARKET", "FINANCIAL", "PRICE", "BANK", "TRADE", "OIL"];
    const techWords = ["AI", "TECH", "DIGITAL", "SILICON", "FUTURE", "INNOVATION"];

    let scores = {
        TENSION: 0,
        POWER: 0,
        VOLUME: 0, // Default
        IMPACT: 0,
        VOICE: 0
    };

    // Score counting
    tensionWords.forEach(w => { if (text.includes(w)) scores.TENSION += 2; });
    powerWords.forEach(w => { if (text.includes(w)) scores.POWER += 1.5; });
    economyWords.forEach(w => { if (text.includes(w)) scores.IMPACT += 1.2; });
    techWords.forEach(w => { if (text.includes(w)) scores.VOICE += 1; });

    // Add some randomness to base words
    scores.VOLUME += Math.random();
    scores.IMPACT += Math.random();
    scores.VOICE += Math.random();

    // Find word with maximum score
    let maxScore = -1;
    let selectedWord = "GLOBAL";

    for (let word in scores) {
        if (scores[word] > maxScore) {
            maxScore = scores[word];
            selectedWord = word;
        }
    }

    return selectedWord;
}

function updateUI() {
    for (let i = 0; i < 3; i++) {
        const titleEl = document.getElementById(`title-${i+1}`);
        if (titleEl && topStories[i]) {
            titleEl.innerText = topStories[i].headline.toUpperCase();
        }
        const expEl = document.getElementById(`exp-${i+1}`);
        if (expEl && topStories[i]) {
            expEl.innerText = topStories[i].description;
        }
    }
    
    // Update date in sidebar
    const dateSidebar = document.querySelector('.poster-date-sidebar');
    if (dateSidebar) {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        
        if (dateParam) {
            dateSidebar.innerText = formatDateSidebar(dateParam);
        } else {
            dateSidebar.innerText = 'TODAY';
        }
    }
    
    // UPDATED LOGIC: First check if there is an AI word in the data
    const bottomWordEl = document.getElementById('bottom-word');
    if (bottomWordEl) {
        let textToShow = "PULSE"; // Default
        
        if (typeof currentBottomWord !== 'undefined' && currentBottomWord) {
            textToShow = currentBottomWord;
        } else if (topStories.length > 0) {
            textToShow = getSentimentWord(topStories);
        }
        
        initBlotter(textToShow.toUpperCase());
    }
}

function formatDateSidebar(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (targetDate.getTime() === today.getTime()) return 'TODAY';
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

function drawPoster() {
    background(8, 9, 12);
    stroke(255, 12);
    strokeWeight(0.5);
    for (let x = 0; x < width; x += 30) line(x, 0, x, height);
    for (let y = 0; y < height; y += 30) line(0, y, width, y);
    drawHeatmap();
    drawMarkers();
    
    // Grain effect — lower on touch devices to avoid excessive noise
    addGrain(isMobile() ? 3 : 15); 
    
    // After drawing everything on canvas, check brightness under text
    applyAdaptiveTextColor();
}

function addGrain(strength) {
    loadPixels();
    for (let i = 0; i < pixels.length; i += 4) {
        // Generate random noise
        let noiseVal = random(-strength, strength);
        
        // Apply to R, G, B channels
        pixels[i] = constrain(pixels[i] + noiseVal, 0, 255);
        pixels[i+1] = constrain(pixels[i+1] + noiseVal, 0, 255);
        pixels[i+2] = constrain(pixels[i+2] + noiseVal, 0, 255);
    }
    updatePixels();
}

function applyAdaptiveTextColor() {
    loadPixels();
    
    // Iterate over all registered text blocks
    headerBounds.forEach((bound, index) => {
        let totalBrightness = 0;
        let count = 0;
        
        // Compute average background brightness under this block
        // Sample points inside the rect for speed
        for (let x = Math.floor(bound.left); x < bound.right; x += 10) {
            for (let y = Math.floor(bound.top); y < bound.bottom; y += 10) {
                let pixIndex = 4 * (Math.floor(y * pixelDensity()) * width * pixelDensity() + Math.floor(x * pixelDensity()));
                if (pixIndex < pixels.length) {
                    let r = pixels[pixIndex];
                    let g = pixels[pixIndex + 1];
                    let b = pixels[pixIndex + 2];
                    totalBrightness += (r + g + b) / 3;
                    count++;
                }
            }
        }
        
        let avgBrightness = count > 0 ? totalBrightness / count : 0;
        
        // If background is bright (>100 of 255), make text darker or more contrasting
        // Here: bright background -> white text (max contrast); dark background stays as is.
        // User asked for "white/grey depending on contrast".
        
        let targetColor = '#e8e9eb'; // Default (light grey)
        if (avgBrightness > 120) {
            targetColor = '#ffffff'; // On bright background use pure white for clarity
        } else if (avgBrightness > 50) {
            targetColor = '#ffffff'; // Also white
        } else {
            targetColor = '#e8e9eb'; // On dark background keep muted
        }

        // Apply color to HTML element
        if (bound.type === 'title') {
            const el = document.getElementById(`title-${index + 1}`);
            if (el) el.style.color = targetColor;
        } else if (bound.type === 'exp') {
            const expBlocks = document.querySelectorAll('.explanation-block');
            if (expBlocks[bound.id]) expBlocks[bound.id].style.color = targetColor === '#ffffff' ? '#ffffff' : '#8b8d93';
        } else if (bound.type === 'bottom') {
            if (bottomWordBlotter && bottomWordBlotter.texts && bottomWordBlotter.texts.length > 0) {
                const textObj = bottomWordBlotter.texts[0];
                if (textObj.properties.fill !== targetColor) {
                    textObj.properties.fill = targetColor;
                    textObj.needsUpdate = true;
                }
            } else {
                const el = document.getElementById('bottom-word');
                if (el) el.style.color = targetColor;
            }
        }
    });
}

function drawHeatmap() {
    const centerY = height * 0.45;
    
    // Use same seed as drawMarkers so blobs align with points
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    randomSeed(seed);
    
    // Compute positions identically to drawMarkers (same seed, same calls)
    const storyPositions = [];
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        let rx = width * (0.2 + random(0.6));
        let ry;
        if (headerBounds.length >= 3) {
            if (i === 0) {
                ry = random(headerBounds[0].top - 60, headerBounds[0].top - 30);
            } else if (i === 1) {
                let gapCenter = (headerBounds[0].bottom + headerBounds[1].top) / 2;
                ry = gapCenter + random(-8, 8);
            } else {
                let gapCenter = (headerBounds[1].bottom + headerBounds[2].top) / 2;
                ry = gapCenter + random(-8, 8);
            }
        } else {
            ry = centerY + (i - 1) * 120 + random(-10, 10);
            if (i === 1) ry -= 40;
        }
        storyPositions.push({ x: rx, y: ry });
    }

    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        const story = topStories[i];
        const pos = storyPositions[i];
        
        if (!story.mainLocation) continue;
        
        // Scale heatmap radius proportionally to canvas size (600 is the desktop baseline)
        const scaleFactor = width / DESKTOP_WIDTH;
        const maxRadius = map(story.intensity, 40, 100, 200, 500) * scaleFactor;
        
        for (let r = maxRadius; r > 10; r -= 5) { 
            let alpha = map(r, 10, maxRadius, 110, 0); 
            let col = color(story.color);
            col.setAlpha(alpha);
            noStroke();
            fill(col);
            let noiseVal = noise(r * 0.008, i * 10) * 30 * scaleFactor; 
            ellipse(pos.x, pos.y, r + noiseVal);
        }
        fill(255, 180);
        ellipse(pos.x, pos.y, 6 * scaleFactor + 2);
    }
}

function drawMarkers() {
    const centerY = height * 0.45;
    
    // Generate random X per story so each day looks different
    // Use date-based seed so X is stable within a day but varies between days
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    randomSeed(seed);

    const storyPositions = [];
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        // Random X within 20%–80% of width
        let rx = width * (0.2 + random(0.6));
        
        // Place dot at the CENTER of the gap between titles (with small random offset)
        let ry;
        if (headerBounds.length >= 3) {
            if (i === 0) {
                // FIRST POINT: above first header
                ry = random(headerBounds[0].top - 60, headerBounds[0].top - 30);
            } else if (i === 1) {
                // SECOND POINT: centered in gap between title 1 and title 2
                let gapCenter = (headerBounds[0].bottom + headerBounds[1].top) / 2;
                ry = gapCenter + random(-8, 8);
            } else {
                // THIRD POINT: centered in gap between title 2 and title 3
                let gapCenter = (headerBounds[1].bottom + headerBounds[2].top) / 2;
                ry = gapCenter + random(-8, 8);
            }
        } else {
            // Fallback when bounds were not determined
            ry = centerY + (i - 1) * 120 + random(-10, 10);
            if (i === 1) ry -= 40;
        }
        
        storyPositions.push({ x: rx, y: ry });
    }
    
    // Draw chain of lines ONLY between stories that have geo locations
    // Collect positions of stories with mainLocation
    const geoPositions = [];
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        if (topStories[i].mainLocation) {
            geoPositions.push(storyPositions[i]);
        }
    }
    // Only draw lines if 2+ geo points exist
    if (geoPositions.length >= 2) {
        stroke(255, 30);
        strokeWeight(1);
        noFill();
        for (let i = 0; i < geoPositions.length - 1; i++) {
            drawDashedCurve(geoPositions[i].x, geoPositions[i].y, geoPositions[i + 1].x, geoPositions[i + 1].y);
        }
    }
    
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        const story = topStories[i];
        const pos = storyPositions[i];
        
        if (!story.mainLocation) continue;

        // Draw compact geo label next to dot
        drawStoryMarker(pos.x, pos.y, story, i);

        // Main point (white dot)
        fill(255, 200);
        noStroke();
        ellipse(pos.x, pos.y, 6);
    }
}

function drawStoryMarker(x, y, story, index) {
    const cityName = story.mainLocation.name.toUpperCase();
    const coords = `${story.mainLocation.lat.toFixed(1)}, ${story.mainLocation.lng.toFixed(1)}`;
    
    textFont('PP Supply Mono');
    noStroke();
    
    // Daily random: label goes left or right of the dot
    // random() is already date-seeded in drawMarkers(), so this varies per day
    let side = random() > 0.5 ? 1 : -1; // 1 = text to the right, -1 = text to the left
    
    // Keep label within canvas bounds
    if (x < width * 0.25) side = 1;
    if (x > width * 0.75) side = -1;
    
    let labelX = x + side * 14; // Small offset from the dot
    let align = side === 1 ? LEFT : RIGHT;
    
    // City name (brighter)
    fill(255, 200);
    textSize(10);
    textAlign(align, CENTER);
    text(cityName, labelX, y - 5);
    
    // Coordinates (dimmer, slightly smaller)
    fill(255, 100);
    textSize(8);
    text(coords, labelX, y + 7);
}

function drawDashedCurve(x1, y1, x2, y2) {
    let steps = 30; // More steps for smoothness
    
    // Random offset for curve control point
    // Creates unique bend per line
    let midX = lerp(x1, x2, 0.5);
    let midY = lerp(y1, y2, 0.5);
    
    // Add random offset to the side
    let offsetX = random(-50, 50);
    let offsetY = random(-30, 30);
    
    let cpX = midX + offsetX;
    let cpY = midY + offsetY;

    for (let i = 0; i < steps; i += 2) {
        let t1 = i / steps;
        let t2 = (i + 1) / steps;
        
        // Quadratic Bezier curve for smooth bend
        let cx1 = (1 - t1) * (1 - t1) * x1 + 2 * (1 - t1) * t1 * cpX + t1 * t1 * x2;
        let cy1 = (1 - t1) * (1 - t1) * y1 + 2 * (1 - t1) * t1 * cpY + t1 * t1 * y2;
        
        let cx2 = (1 - t2) * (1 - t2) * x1 + 2 * (1 - t2) * t2 * cpX + t2 * t2 * x2;
        let cy2 = (1 - t2) * (1 - t2) * y1 + 2 * (1 - t2) * t2 * cpY + t2 * t2 * y2;
        
        line(cx1, cy1, cx2, cy2);
    }
}
