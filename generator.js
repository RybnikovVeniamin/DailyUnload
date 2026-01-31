const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Используем ключ из переменных окружения (для безопасности на GitHub)
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'e995fc4497af487f887bf84cd5f679e8';

async function generateDailyData() {
    console.log("📡 Робот запускает сбор новостей...");
    
    try {
        const query = 'war OR election OR economy OR crisis OR "breaking news" OR politics';
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=15&apiKey=${NEWS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.status === "ok" && data.articles.length > 0) {
            const colors = ["#ff2d55", "#ff6b35", "#ffb800", "#34c759", "#5ac8fa"];
            
            const cityDatabase = {
                'USA': { name: 'WASHINGTON DC', lat: 38.9, lng: -77.0 },
                'UKRAINE': { name: 'KYIV', lat: 50.4, lng: 30.5 },
                'RUSSIA': { name: 'MOSCOW', lat: 55.7, lng: 37.6 },
                'CHINA': { name: 'BEIJING', lat: 39.9, lng: 116.4 },
                'ISRAEL': { name: 'TEL AVIV', lat: 32.1, lng: 34.8 },
                'GERMANY': { name: 'BERLIN', lat: 52.5, lng: 13.4 },
                'FRANCE': { name: 'PARIS', lat: 48.8, lng: 2.3 },
                'JAPAN': { name: 'TOKYO', lat: 35.7, lng: 139.7 }
            };

            const defaultCities = [
                { name: 'NEW YORK', lat: 40.7, lng: -74.0 },
                { name: 'LONDON', lat: 51.5, lng: -0.1 },
                { name: 'SINGAPORE', lat: 1.3, lng: 103.8 },
                { name: 'DUBAI', lat: 25.2, lng: 55.3 }
            ];

            const filteredArticles = data.articles.filter(art => 
                art.title && art.title.length > 30
            );

            const topStories = filteredArticles.slice(0, 5).map((art, i) => {
                let cleanTitle = art.title.split(' - ')[0];
                let content = art.description || art.content || "";
                let shortDesc = content.length > 120 ? content.substring(0, 120) + "..." : content;
                
                let city = null;
                const upperTitle = cleanTitle.toUpperCase();
                for (let key in cityDatabase) {
                    if (upperTitle.includes(key)) {
                        city = cityDatabase[key];
                        break;
                    }
                }
                if (!city) city = defaultCities[i % defaultCities.length];
                
                return {
                    id: i + 1,
                    headline: cleanTitle,
                    description: shortDesc,
                    mainLocation: city,
                    intensity: Math.floor(Math.random() * 40) + 60,
                    color: colors[i % colors.length],
                    url: art.url,
                    imageUrl: art.urlToImage
                };
            });

            const result = {
                date: new Date().toISOString().split('T')[0],
                displayDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
                stories: topStories
            };

            // Создаем папку archive если её нет
            const archiveDir = path.join(__dirname, 'archive');
            if (!fs.existsSync(archiveDir)){
                fs.mkdirSync(archiveDir);
            }

            // Сохраняем файл
            const filePath = path.join(archiveDir, `poster-${result.date}.json`);
            fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
            
            console.log(`✅ Данные успешно сохранены в ${filePath}`);
            
            // Также обновляем "последние данные" для главной страницы
            fs.writeFileSync(path.join(__dirname, 'latest.json'), JSON.stringify(result, null, 2));

            // Обновляем общий список всех постеров (индекс архива)
            const indexFile = path.join(archiveDir, 'index.json');
            let archiveIndex = [];
            if (fs.existsSync(indexFile)) {
                archiveIndex = JSON.parse(fs.readFileSync(indexFile));
            }
            
            // Добавляем новый постер в начало, если его еще нет
            if (!archiveIndex.find(p => p.date === result.date)) {
                archiveIndex.unshift({
                    date: result.date,
                    displayDate: result.displayDate,
                    file: `poster-${result.date}.json`
                });
                fs.writeFileSync(indexFile, JSON.stringify(archiveIndex, null, 2));
            }
            
        } else {
            console.error("❌ Новости не найдены или ошибка API");
        }
    } catch (error) {
        console.error("❌ Критическая ошибка робота:", error);
    }
}

generateDailyData();
