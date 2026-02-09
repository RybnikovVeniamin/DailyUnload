// ========================================
// Global Pulse — Redesigned Poster Sketch
// ========================================

let canvas;
let topStories = [];
let currentBottomWord = "";
let headerBounds = []; // We will store header boundaries
let bottomWordBlotter = null;
let bottomWordMaterial = null;

function initBlotter(text) {
    const bottomWordEl = document.getElementById('bottom-word');
    if (!bottomWordEl) return;

    // Clear existing content
    bottomWordEl.innerHTML = '';
    
    // Use date-based seed so parameters are stable throughout the day
    let dateSeed = day() + month() * 31 + year() * 365;
    randomSeed(dateSeed);
    
    // Generate daily random values
    let dailyOffset = random(0, 0.059);
    let dailyRotation = random(0, 360);
    
    // Create material
    // Check if Blotter and ChannelSplitMaterial are available
    if (typeof Blotter !== 'undefined' && Blotter.ChannelSplitMaterial) {
        bottomWordMaterial = new Blotter.ChannelSplitMaterial();
        bottomWordMaterial.uniforms.uOffset.value = dailyOffset;
        bottomWordMaterial.uniforms.uRotation.value = dailyRotation;
        bottomWordMaterial.uniforms.uApplyBlur.value = 1.0;
        bottomWordMaterial.uniforms.uAnimateNoise.value = 1.0;
        
        // Create text
        const textObj = new Blotter.Text(text, {
            family: "'PP Neue Bit', serif",
            size: 80,
            fill: "#e8e9eb",
            weight: 700,
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 40,
            paddingBottom: 40
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

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const NEWS_API_KEY = 'e995fc4497af487f887bf84cd5f679e8';

async function setup() {
    canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvas-container');
    
    pixelDensity(2);
    noLoop();
    
    // 1. Fetch real data from latest.json
    await fetchLatestData();
    
    // 2. Update HTML elements (Titles + Top Text + Bottom Word)
    updateUI();
    
    // Give the browser time to render HTML to get header sizes
    setTimeout(() => {
        calculateHeaderBounds();
        drawPoster();
    }, 100);

    // 4. Export data for the website
    exportPosterData();
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
    // Large word at the bottom
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

async function fetchLatestData() {
    console.log("📡 Loading latest data from latest.json...");
    try {
        const response = await fetch('latest.json');
        const data = await response.json();
        
        if (data && data.stories) {
            topStories = data.stories;
            currentBottomWord = data.bottomWord || "";
            console.log("✅ Data loaded:", topStories, "Word of the day:", currentBottomWord);
        }
    } catch (e) {
        console.error("❌ Error loading latest.json, trying NewsAPI:", e);
        await fetchRealData();
    }
}

function exportPosterData() {
    const dataToExport = {
        date: new Date().toISOString().split('T')[0],
        displayDate: getTodayFormatted(),
        bottomWord: document.getElementById('bottom-word').innerText,
        stories: topStories
    };
    
    console.log("💾 Data prepared for website:", dataToExport);
}

async function fetchRealData() {
    console.log("📡 Requesting top world news...");
    try {
        const query = 'war OR election OR economy OR crisis OR "breaking news" OR politics';
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=15&apiKey=${NEWS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.status === "ok" && data.articles.length > 0) {
            const colors = shuffle(["#ff2d55", "#ff6b35", "#ffb800", "#34c759", "#5ac8fa"]);
            
            const cityDatabase = {
                'USA': { name: 'WASHINGTON DC', lat: 38.9, lng: -77.0 },
                'WASHINGTON': { name: 'WASHINGTON DC', lat: 38.9, lng: -77.0 },
                'TRUMP': { name: 'WASHINGTON DC', lat: 38.9, lng: -77.0 },
                'BIDEN': { name: 'WASHINGTON DC', lat: 38.9, lng: -77.0 },
                'IRAN': { name: 'TEHRAN', lat: 35.6, lng: 51.3 },
                'TEHRAN': { name: 'TEHRAN', lat: 35.6, lng: 51.3 },
                'UKRAINE': { name: 'KYIV', lat: 50.4, lng: 30.5 },
                'RUSSIA': { name: 'MOSCOW', lat: 55.7, lng: 37.6 },
                'CHINA': { name: 'BEIJING', lat: 39.9, lng: 116.4 },
                'UK': { name: 'LONDON', lat: 51.5, lng: -0.1 },
                'ISRAEL': { name: 'TEL AVIV', lat: 32.1, lng: 34.8 },
                'GAZA': { name: 'GAZA CITY', lat: 31.5, lng: 34.4 },
                'GERMANY': { name: 'BERLIN', lat: 52.5, lng: 13.4 },
                'FRANCE': { name: 'PARIS', lat: 48.8, lng: 2.3 },
                'JAPAN': { name: 'TOKYO', lat: 35.7, lng: 139.7 },
                'INDIA': { name: 'NEW DELHI', lat: 28.6, lng: 77.2 },
                'AI': { name: 'SILICON VALLEY', lat: 37.4, lng: -122.0 }
            };

            const defaultCities = [
                { name: 'NEW YORK', lat: 40.7, lng: -74.0 },
                { name: 'LONDON', lat: 51.5, lng: -0.1 },
                { name: 'SINGAPORE', lat: 1.3, lng: 103.8 },
                { name: 'DUBAI', lat: 25.2, lng: 55.3 }
            ];

            const filteredArticles = data.articles.filter(art => 
                art.title && 
                art.title.length > 30 && 
                !art.title.includes("Warhammer") &&
                !art.title.includes("Deal of the day")
            );

            topStories = filteredArticles.slice(0, 5).map((art, i) => {
                let cleanTitle = art.title.split(' - ')[0];
                let content = art.description || art.content || "";
                let shortDesc = content.length > 120 ? content.substring(0, 120) + "..." : content;
                
                let textWeight = content.length;
                let calculatedIntensity = map(textWeight, 0, 500, 40, 100);
                calculatedIntensity = constrain(calculatedIntensity, 40, 100);
                
                let city = null;
                const upperTitle = cleanTitle.toUpperCase();
                const upperContent = content.toUpperCase();
                
                for (let key in cityDatabase) {
                    if (upperTitle.includes(key) || upperContent.includes(key)) {
                        city = cityDatabase[key];
                        break;
                    }
                }

                if (!city) {
                    city = defaultCities[i % defaultCities.length];
                }
                
                return {
                    id: i + 1,
                    rank: i + 1,
                    headline: cleanTitle,
                    description: shortDesc,
                    mainLocation: city,
                    intensity: calculatedIntensity,
                    color: colors[i % colors.length],
                    url: art.url,
                    imageUrl: art.urlToImage
                };
            });
        }
    } catch (e) {
        console.error("❌ Error:", e);
        topStories = TRENDING_STORIES.slice(0, 3);
    }
}

// Helper function to shuffle array (Fisher-Yates shuffle)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Function to select keyword based on news sentiment
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

    // Scoring
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
    
    const today = getTodayFormatted();
    const oldDate = document.querySelector('.today-date');
    if (oldDate) oldDate.remove();
    const dateEl = document.createElement('div');
    dateEl.className = 'today-date';
    dateEl.innerText = today;
    dateEl.style.position = 'absolute';
    dateEl.style.top = '20px';
    dateEl.style.right = '20px';
    dateEl.style.color = 'rgba(255,255,255,0.5)';
    dateEl.style.fontFamily = 'PP Supply Mono, monospace';
    dateEl.style.fontSize = '10px';
    document.querySelector('.poster-container').appendChild(dateEl);
    
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

function drawPoster() {
    background(8, 9, 12);
    stroke(255, 12);
    strokeWeight(0.5);
    for (let x = 0; x < width; x += 30) line(x, 0, x, height);
    for (let y = 0; y < height; y += 30) line(0, y, width, y);
    drawHeatmap();
    drawMarkers();
    
    // Add grainy noise effect
    addGrain(15); // You can adjust this number (strength)
    
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
    
    // Iterate through all registered text blocks
    headerBounds.forEach((bound, index) => {
        let totalBrightness = 0;
        let count = 0;
        
        // Calculate average background brightness under this block
        // Take a few points inside the rectangle for speed
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
        
        // If background is bright (over 100 of 255), make text darker or more contrasting
        // In our case, if background is bright, text should be white (max contrast), 
        // and if background is dark, it is already white. 
        // But user asked for "white/gray depending on contrast".
        
        let targetColor = '#e8e9eb'; // Default (light gray)
        if (avgBrightness > 120) {
            targetColor = '#ffffff'; // On bright background make pure white for clarity
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
    // Use date-based seed so positions are stable throughout the day
    let dateSeed = day() + month() * 31 + year() * 365;
    randomSeed(dateSeed);
    
    // Calculate circle positions — randomly across the poster
    const storyPositions = [];
    const padding = 100; // Padding from edges so circles aren't cut off
    
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        let rx = padding + random(width - padding * 2);
        let ry = padding + random(height - padding * 2);
        storyPositions.push({ x: rx, y: ry });
    }
    
    // Save positions globally for use in drawMarkers
    window.circlePositions = storyPositions;

    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        const story = topStories[i];
        const pos = storyPositions[i];
        
        const maxRadius = map(story.intensity, 40, 100, 200, 500);
        
        for (let r = maxRadius; r > 10; r -= 5) { 
            let alpha = map(r, 10, maxRadius, 110, 0); 
            let col = color(story.color);
            col.setAlpha(alpha);
            noStroke();
            fill(col);
            let noiseVal = noise(r * 0.008, i * 10) * 30; 
            ellipse(pos.x, pos.y, r + noiseVal);
        }

        // Draw white dot in center only if there is a real location
        if (story.mainLocation) {
            fill(255, 180);
            ellipse(pos.x, pos.y, 8);
        }
    }
}

function drawMarkers() {
    // Use positions from drawHeatmap (they are already calculated)
    const storyPositions = window.circlePositions || [];
    
    if (storyPositions.length === 0) return;
    
    // Draw chain of lines between points (1 -> 2 -> 3)
    stroke(255, 30);
    strokeWeight(1);
    noFill();
    for (let i = 0; i < storyPositions.length - 1; i++) {
        let p1 = storyPositions[i];
        let p2 = storyPositions[i + 1];
        drawDashedCurve(p1.x, p1.y, p2.x, p2.y);
    }
    
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        const story = topStories[i];
        const pos = storyPositions[i];
        
        // Labels (city and coordinates) are drawn only if there is a location
        if (story.mainLocation) {
            drawStoryMarker(pos.x, pos.y, story, i);

            // Main point
            fill(255, 200);
            noStroke();
            ellipse(pos.x, pos.y, 6);
        }
    }
}

function drawStoryMarker(x, y, story, index) {
    const cityName = story.mainLocation.name.toUpperCase();
    const coords = `${story.mainLocation.lat.toFixed(1)}, ${story.mainLocation.lng.toFixed(1)}`;
    
    stroke(255, 60);
    strokeWeight(0.5);
    noFill();
    
    textFont('PP Supply Mono');
    textSize(10);
    
    let lineLen = 30;
    
    // Determine line direction depending on position on poster
    // If point is in upper half — line goes down, otherwise up
    // If point is on left — line can go right, and vice versa
    
    let lineEndX = x;
    let lineEndY;
    let textAlignH = CENTER;
    let textAlignV;
    
    if (y < height * 0.4) {
        // Upper part of poster — line down
        lineEndY = y + lineLen;
        textAlignV = TOP;
    } else if (y > height * 0.6) {
        // Lower part of poster — line up
        lineEndY = y - lineLen;
        textAlignV = BOTTOM;
    } else {
        // Middle — line sideways
        let sideDir = x > width / 2 ? -1 : 1;
        lineEndX = x + sideDir * 50;
        lineEndY = y;
        textAlignH = sideDir === 1 ? LEFT : RIGHT;
        textAlignV = CENTER;
    }
    
    line(x, y, lineEndX, lineEndY);
    
    noStroke();
    fill(255, 200);
    textAlign(textAlignH, textAlignV);
    
    if (textAlignV === TOP) {
        text(cityName, lineEndX, lineEndY + 5);
        fill(255, 100);
        textSize(8);
        text(coords, lineEndX, lineEndY + 17);
    } else if (textAlignV === BOTTOM) {
        text(cityName, lineEndX, lineEndY - 15);
        fill(255, 100);
        textSize(8);
        text(coords, lineEndX, lineEndY - 5);
    } else {
        // CENTER (side line)
        let offset = lineEndX > x ? 10 : -10;
        text(cityName, lineEndX + offset, lineEndY - 5);
        fill(255, 100);
        textSize(8);
        text(coords, lineEndX + offset, lineEndY + 7);
    }
}

function drawDashedCurve(x1, y1, x2, y2) {
    let steps = 30; // Increased number of steps for smoothness
    
    // Generate random offset for curve "control point"
    // This will create a unique curve for each line
    let midX = lerp(x1, x2, 0.5);
    let midY = lerp(y1, y2, 0.5);
    
    // Add random "flyout" to the side
    let offsetX = random(-50, 50);
    let offsetY = random(-30, 30);
    
    let cpX = midX + offsetX;
    let cpY = midY + offsetY;

    for (let i = 0; i < steps; i += 2) {
        let t1 = i / steps;
        let t2 = (i + 1) / steps;
        
        // Use quadratic Bezier curve for smooth bend
        let cx1 = (1 - t1) * (1 - t1) * x1 + 2 * (1 - t1) * t1 * cpX + t1 * t1 * x2;
        let cy1 = (1 - t1) * (1 - t1) * y1 + 2 * (1 - t1) * t1 * cpY + t1 * t1 * y2;
        
        let cx2 = (1 - t2) * (1 - t2) * x1 + 2 * (1 - t2) * t2 * cpX + t2 * t2 * x2;
        let cy2 = (1 - t2) * (1 - t2) * y1 + 2 * (1 - t2) * t2 * cpY + t2 * t2 * y2;
        
        line(cx1, cy1, cx2, cy2);
    }
}
