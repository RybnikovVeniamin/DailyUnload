// ========================================
// Global Pulse — Redesigned Poster Sketch
// ========================================

let canvas;
let topStories = [];
let currentBottomWord = "";
let headerBounds = []; // Будем хранить границы заголовков
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
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    
    randomSeed(seed);
    
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

async function setup() {
    canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('canvas-container');
    
    pixelDensity(2);
    noLoop();
    
    // 1. Fetch real data (from specific archive file if date param exists, otherwise latest.json)
    await fetchPosterData();
    
    // 2. Update HTML elements (Titles + Top Text + Bottom Word)
    updateUI();
    
    // Даем браузеру время отрисовать HTML, чтобы получить размеры заголовков
    setTimeout(() => {
        calculateHeaderBounds();
        drawPoster();
    }, 100);

    // 4. Export data for the website (only if we're on the latest poster)
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('date')) {
        exportPosterData();
    }

    // 5. Setup hover listeners for titles
    setupTitleHovers();
}

function setupTitleHovers() {
    const card = document.getElementById('news-card');
    const cardImg = document.getElementById('news-card-image');
    const cardDesc = document.getElementById('news-card-description');
    const cardLink = document.getElementById('news-card-link');
    const container = document.querySelector('.poster-container');
    const titles = [1, 2, 3].map(id => document.getElementById(`title-${id}`));

    titles.forEach((titleEl, i) => {
        if (titleEl) {
            titleEl.style.pointerEvents = 'auto';
            titleEl.style.cursor = 'pointer';

            titleEl.addEventListener('mouseenter', (e) => {
                const story = topStories[i];
                // Показываем карточку только если есть и описание, и картинка
                if (story && story.description && story.imageUrl) {
                    cardDesc.innerText = story.description;
                    cardLink.href = story.url || '#';
                    cardImg.src = story.imageUrl;
                    cardImg.parentElement.style.display = 'block';
                    
                    card.classList.add('active');
                    
                    // Эффект затемнения
                    container.classList.add('is-dimmed');
                    // Снимаем активность со всех и ставим только текущему
                    titles.forEach(t => t.classList.remove('is-active'));
                    titleEl.classList.add('is-active');

                    // Делаем заголовок кликабельным
                    titleEl.onclick = () => {
                        window.open(story.url || '#', '_blank');
                    };
                }
            });

            titleEl.addEventListener('mousemove', (e) => {
                const containerRect = container.getBoundingClientRect();
                const x = e.clientX - containerRect.left;
                const y = e.clientY - containerRect.top + 15;
                
                // Всегда справа от курсора: x + небольшой отступ
                const finalX = x + 15;

                card.style.left = `${finalX}px`;
                card.style.top = `${y}px`;
            });
        }
    });

    // Слушатель на весь контейнер, чтобы убирать эффект только когда мышь ушла совсем
    container.addEventListener('mouseleave', (e) => {
        // Проверяем, что мышь действительно ушла за пределы контейнера, 
        // а не просто на дочерний элемент
        if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
            card.classList.remove('active');
            container.classList.remove('is-dimmed');
            titles.forEach(t => t.classList.remove('is-active'));
        }
    });
}

function calculateHeaderBounds() {
    headerBounds = [];
    // Заголовки
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
    // Блоки описания сверху
    const expBlocks = document.querySelectorAll('.explanation-block');
    expBlocks.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const containerRect = document.querySelector('.poster-container').getBoundingClientRect();
        headerBounds.push({
            type: 'exp',
            id: i, // Добавляем ID для точной идентификации
            top: rect.top - containerRect.top,
            bottom: rect.bottom - containerRect.top,
            left: rect.left - containerRect.left,
            right: rect.right - containerRect.left
        });
    });
    // Большое слово внизу
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
    const dataFile = dateParam ? `archive/poster-${dateParam}.json` : 'latest.json';

    console.log(`📡 Загрузка данных из ${dataFile}...`);
    try {
        const response = await fetch(dataFile);
        const data = await response.json();
        
        if (data && data.stories) {
            topStories = data.stories;
            currentBottomWord = data.bottomWord || "";
            console.log("✅ Данные загружены:", topStories, "Слово дня:", currentBottomWord);
        }
    } catch (e) {
        console.error(`❌ Ошибка загрузки ${dataFile}:`, e);
    }
}

function exportPosterData() {
    const dataToExport = {
        date: new Date().toISOString().split('T')[0],
        displayDate: getTodayFormatted(),
        bottomWord: document.getElementById('bottom-word').innerText,
        stories: topStories
    };
    
    console.log("💾 Данные для сайта подготовлены:", dataToExport);
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
    
    // Обновляем дату в сайдбаре
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
    
    // ОБНОВЛЕННАЯ ЛОГИКА: Сначала проверяем, есть ли слово от ИИ в данных
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
    
    // Добавляем эффект зернистости (шум)
    addGrain(15); 
    
    // После отрисовки всего на канвасе, проверяем яркость под текстом
    applyAdaptiveTextColor();
}

function addGrain(strength) {
    loadPixels();
    for (let i = 0; i < pixels.length; i += 4) {
        // Генерируем случайный шум
        let noiseVal = random(-strength, strength);
        
        // Применяем к каналам R, G, B
        pixels[i] = constrain(pixels[i] + noiseVal, 0, 255);
        pixels[i+1] = constrain(pixels[i+1] + noiseVal, 0, 255);
        pixels[i+2] = constrain(pixels[i+2] + noiseVal, 0, 255);
    }
    updatePixels();
}

function applyAdaptiveTextColor() {
    loadPixels();
    
    // Проходим по всем зарегистрированным текстовым блокам
    headerBounds.forEach((bound, index) => {
        let totalBrightness = 0;
        let count = 0;
        
        // Вычисляем среднюю яркость фона под этим блоком
        // Берем несколько точек внутри прямоугольника для скорости
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
        
        // Если фон яркий (больше 100 из 255), делаем текст темнее или контрастнее
        // В нашем случае, если фон яркий, текст должен быть белым (макс контраст), 
        // а если фон темный, он и так белый. 
        // Но пользователь просил "белый/серый в зависимости от контраста".
        
        let targetColor = '#e8e9eb'; // По умолчанию (светло-серый)
        if (avgBrightness > 120) {
            targetColor = '#ffffff'; // На ярком фоне делаем чисто белым для четкости
        } else if (avgBrightness > 50) {
            targetColor = '#ffffff'; // Тоже белый
        } else {
            targetColor = '#e8e9eb'; // На темном фоне оставляем приглушенным
        }

        // Применяем цвет к HTML элементу
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
    
    // Используем тот же seed, что и в drawMarkers, чтобы пятна совпадали с точками
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    randomSeed(seed);
    
    // Сначала рассчитываем позиции, как в drawMarkers
    const storyPositions = [];
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        let rx = width * (0.2 + random(0.6));
        let ry;
        if (headerBounds.length >= 3) {
            if (i === 0) ry = random(headerBounds[0].top - 60, headerBounds[0].top - 30);
            else if (i === 1) ry = random(headerBounds[0].bottom + 20, headerBounds[1].top - 20);
            else ry = random(headerBounds[1].bottom + 20, headerBounds[2].top - 20);
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
    
    // Генерируем случайные X для каждой истории, чтобы каждый день было по-разному
    // Используем seed на основе даты из данных, чтобы в течение дня X был одинаковым, но разным между днями
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    const seed = parseInt(dateStr.replace(/-/g, '')) || 0;
    randomSeed(seed);

    const storyPositions = [];
    for (let i = 0; i < Math.min(topStories.length, 3); i++) {
        // Случайный X в пределах 20% - 80% ширины
        let rx = width * (0.2 + random(0.6));
        
        // Логика поиска безопасного Y между строками текста
        let ry;
        if (headerBounds.length >= 3) {
            if (i === 0) {
                // ПЕРВАЯ ТОЧКА: выше первого заголовка
                ry = random(headerBounds[0].top - 60, headerBounds[0].top - 30);
            } else if (i === 1) {
                // ВТОРАЯ ТОЧКА: между первым и вторым заголовком
                ry = random(headerBounds[0].bottom + 20, headerBounds[1].top - 20);
            } else {
                // ТРЕТЬЯ ТОЧКА: между вторым и третьим заголовком
                ry = random(headerBounds[1].bottom + 20, headerBounds[2].top - 20);
            }
        } else {
            // Запасной вариант, если границы не определились
            ry = centerY + (i - 1) * 120 + random(-10, 10);
            if (i === 1) ry -= 40;
        }
        
        storyPositions.push({ x: rx, y: ry });
    }
    
    // Рисуем цепочку линий между точками (1 -> 2 -> 3)
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
        
        if (!story.mainLocation) continue;

        // Рисуем маркер и подпись в зависимости от индекса (0-верх, 1-середина, 2-низ)
        drawStoryMarker(pos.x, pos.y, story, i);

        // Основная точка
        fill(255, 200);
        noStroke();
        ellipse(pos.x, pos.y, 6);
    }
}

function drawStoryMarker(x, y, story, index) {
    const cityName = story.mainLocation.name.toUpperCase();
    const coords = `${story.mainLocation.lat.toFixed(1)}, ${story.mainLocation.lng.toFixed(1)}`;
    
    stroke(255, 60);
    strokeWeight(0.5);
    noFill();
    
    textFont('PP Supply Mono');
    textSize(10); // Устанавливаем базовый размер
    
    let lineLen = 30;
    let labelOffset = 5;
    let textH = 25; // Примерная высота блока текста
    
    if (index === 0) {
        // ВЕРХНЯЯ ТОЧКА: линия идет вверх
        let lineTopY = y - lineLen;
        
        // Проверяем столкновения с любыми текстовыми блоками
        for (let bound of headerBounds) {
            // Если текст находится над точкой и по горизонтали пересекается
            if (x > bound.left - 40 && x < bound.right + 40) {
                // Если линия или текст подписи заходят на блок
                if (lineTopY - textH < bound.bottom + 10 && y > bound.top) {
                    // Пробуем инвертировать направление линии вниз, если там свободно
                    lineTopY = y + lineLen; 
                }
            }
        }
        
        line(x, y, x, lineTopY);
        
        noStroke();
        fill(255, 200);
        textSize(10); // Явно задаем размер перед выводом названия города
        if (lineTopY < y) {
            textAlign(CENTER, BOTTOM);
            text(cityName, x, lineTopY - 15);
            fill(255, 100);
            textSize(8); // Координаты чуть меньше
            text(coords, x, lineTopY - 5);
        } else {
            textAlign(CENTER, TOP);
            text(cityName, x, lineTopY + 5);
            fill(255, 100);
            textSize(8); // Координаты чуть меньше
            text(coords, x, lineTopY + 17);
        }
        
    } else if (index === 1) {
        // СРЕДНЯЯ ТОЧКА: линия идет вбок
        let sideDir = x > width / 2 ? -1 : 1;
        let endX = x + sideDir * 60;
        let endY = y - 20;
        
        // Проверка столкновений для боковой линии
        for (let bound of headerBounds) {
            if (endY < bound.bottom + 10 && endY > bound.top - 10) {
                if ((sideDir === 1 && endX + 50 > bound.left) || (sideDir === -1 && endX - 50 < bound.right)) {
                    // Если мешает, пробуем направить в другую сторону или изменить наклон
                    endY = y + 20;
                }
            }
        }
        
        line(x, y, endX, endY);
        
        noStroke();
        fill(255, 200);
        textAlign(sideDir === 1 ? LEFT : RIGHT, CENTER);
        textSize(10);
        text(cityName, endX + sideDir * 10, endY - 5);
        fill(255, 100);
        textSize(8);
        text(coords, endX + sideDir * 10, endY + 7);
        
    } else if (index === 2) {
        // НИЖНЯЯ ТОЧКА: линия идет вниз
        let lineBottomY = y + lineLen;
        
        for (let bound of headerBounds) {
            if (x > bound.left - 40 && x < bound.right + 40) {
                if (lineBottomY + textH > bound.top - 10 && y < bound.bottom) {
                    lineBottomY = y - lineLen;
                }
            }
        }
        
        line(x, y, x, lineBottomY);
        
        noStroke();
        fill(255, 200);
        if (lineBottomY > y) {
            textAlign(CENTER, TOP);
            text(cityName, x, lineBottomY + 5);
            fill(255, 100);
            textSize(8);
            text(coords, x, lineBottomY + 17);
        } else {
            textAlign(CENTER, BOTTOM);
            text(cityName, x, lineBottomY - 15);
            fill(255, 100);
            textSize(8);
            text(coords, x, lineBottomY - 5);
        }
    }
}

function drawDashedCurve(x1, y1, x2, y2) {
    let steps = 30; // Увеличили количество шагов для плавности
    
    // Генерируем случайное смещение для "контрольной точки" кривой
    // Это создаст уникальный изгиб для каждой линии
    let midX = lerp(x1, x2, 0.5);
    let midY = lerp(y1, y2, 0.5);
    
    // Добавляем случайный "вылет" в сторону
    let offsetX = random(-50, 50);
    let offsetY = random(-30, 30);
    
    let cpX = midX + offsetX;
    let cpY = midY + offsetY;

    for (let i = 0; i < steps; i += 2) {
        let t1 = i / steps;
        let t2 = (i + 1) / steps;
        
        // Используем квадратичную кривую Безье для плавного изгиба
        let cx1 = (1 - t1) * (1 - t1) * x1 + 2 * (1 - t1) * t1 * cpX + t1 * t1 * x2;
        let cy1 = (1 - t1) * (1 - t1) * y1 + 2 * (1 - t1) * t1 * cpY + t1 * t1 * y2;
        
        let cx2 = (1 - t2) * (1 - t2) * x1 + 2 * (1 - t2) * t2 * cpX + t2 * t2 * x2;
        let cy2 = (1 - t2) * (1 - t2) * y1 + 2 * (1 - t2) * t2 * cpY + t2 * t2 * y2;
        
        line(cx1, cy1, cx2, cy2);
    }
}
