// ========================================
// Global Pulse — Redesigned Poster Sketch
// ========================================

let canvas;
let topStories = [];
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const NEWS_API_KEY = ''; // Ключ удален для безопасности. Для локальной работы используйте переменные окружения.

async function setup() {
    canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvas-container');
    
    pixelDensity(2);
    noLoop();
    
    // 1. Fetch real data from NewsAPI
    await fetchRealData();
    
    // 2. Update HTML elements (Titles + Top Text + Bottom Word)
    updateUI();
    
    // 3. Draw
    drawPoster();

    // 4. Export data for the website
    exportPosterData();
}

function exportPosterData() {
    const dataToExport = {
        date: new Date().toISOString().split('T')[0],
        displayDate: getTodayFormatted(),
        bottomWord: document.getElementById('bottom-word').innerText,
        stories: topStories
    };
    
    console.log("💾 Данные для сайта подготовлены:", dataToExport);
    
    // Создаем кнопку для скачивания (временно, пока не настроена автоматика)
    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download Daily Data';
    downloadBtn.style.position = 'fixed';
    downloadBtn.style.bottom = '20px';
    downloadBtn.style.left = '20px';
    downloadBtn.style.zIndex = '1000';
    downloadBtn.style.padding = '10px';
    downloadBtn.style.background = '#ff2d55';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '5px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.fontFamily = 'PP Supply Mono, monospace';
    
    downloadBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poster-${dataToExport.date}.json`;
        a.click();
    };
    
    document.body.appendChild(downloadBtn);
}

async function fetchRealData() {
    console.log("📡 Запрос самых важных мировых новостей...");
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
        console.error("❌ Ошибка:", e);
        topStories = TRENDING_STORIES.slice(0, 3);
    }
}

// Вспомогательная функция для перемешивания массива (Fisher-Yates shuffle)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Функция для выбора ключевого слова на основе настроения новостей
function getSentimentWord(stories) {
    const text = stories.map(s => (s.headline + " " + s.description).toUpperCase()).join(" ");
    
    // Словари для анализа
    const tensionWords = ["WAR", "CONFLICT", "CRISIS", "DEAD", "ATTACK", "PROTEST", "TENSION", "FIGHT"];
    const powerWords = ["ELECTION", "TRUMP", "BIDEN", "GOVERNMENT", "POLICY", "POWER", "LEADER"];
    const economyWords = ["ECONOMY", "MARKET", "FINANCIAL", "PRICE", "BANK", "TRADE", "OIL"];
    const techWords = ["AI", "TECH", "DIGITAL", "SILICON", "FUTURE", "INNOVATION"];

    let scores = {
        TENSION: 0,
        POWER: 0,
        VOLUME: 0, // По умолчанию
        IMPACT: 0,
        VOICE: 0
    };

    // Подсчет очков
    tensionWords.forEach(w => { if (text.includes(w)) scores.TENSION += 2; });
    powerWords.forEach(w => { if (text.includes(w)) scores.POWER += 1.5; });
    economyWords.forEach(w => { if (text.includes(w)) scores.IMPACT += 1.2; });
    techWords.forEach(w => { if (text.includes(w)) scores.VOICE += 1; });

    // Добавляем немного случайности к базовым словам
    scores.VOLUME += Math.random();
    scores.IMPACT += Math.random();
    scores.VOICE += Math.random();

    // Находим слово с максимальным баллом
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
    
    // ОБНОВЛЕННАЯ ЛОГИКА ДЛЯ СЛОВА ВНИЗУ
    const bottomWordEl = document.getElementById('bottom-word');
    if (bottomWordEl && topStories.length > 0) {
        bottomWordEl.innerText = getSentimentWord(topStories);
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
}

function drawHeatmap() {
    const centerY = height * 0.45;
    const positions = [
        { x: width * 0.5, y: centerY - 60 },
        { x: width * 0.3, y: centerY + 100 },
        { x: width * 0.7, y: centerY + 80 }
    ];
    
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        const story = topStories[i];
        const pos = positions[i];
        
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
        fill(255, 180);
        ellipse(pos.x, pos.y, 8);
    }
}

function drawMarkers() {
    const centerY = height * 0.45;
    const positions = [
        { x: width * 0.5, y: centerY - 60 },
        { x: width * 0.3, y: centerY + 100 },
        { x: width * 0.7, y: centerY + 80 }
    ];
    
    stroke(255, 30);
    strokeWeight(1);
    noFill();
    for (let i = 0; i < Math.min(positions.length, topStories.length); i++) {
        let p1 = positions[i];
        let p2 = positions[(i + 1) % Math.min(positions.length, topStories.length)];
        drawDashedCurve(p1.x, p1.y, p2.x, p2.y);
    }
    
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        const story = topStories[i];
        const pos = positions[i];
        fill(255, 200);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(10);
        text(story.mainLocation.name, pos.x, pos.y - 25);
        fill(255, 100);
        textSize(8);
        text(`${story.mainLocation.lat.toFixed(1)}°, ${story.mainLocation.lng.toFixed(1)}°`, pos.x, pos.y - 12);
    }
}

function drawDashedCurve(x1, y1, x2, y2) {
    let steps = 20;
    for (let i = 0; i < steps; i += 2) {
        let t1 = i / steps;
        let t2 = (i + 1) / steps;
        let cx1 = lerp(x1, x2, t1);
        let cy1 = lerp(y1, y2, t1) - sin(t1 * PI) * 20;
        let cx2 = lerp(x1, x2, t2);
        let cy2 = lerp(y1, y2, t2) - sin(t2 * PI) * 20;
        line(cx1, cy1, cx2, cy2);
    }
}
