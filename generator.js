const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Базовый URL основного репозитория (дизайн + данные)
const REPO_BASE_URL = 'https://raw.githubusercontent.com/RybnikovVeniamin/NewsPosterGenerating/main/';

// Список файлов, которые нужно синхронизировать
const FILES_TO_SYNC = [
    { remote: 'latest.json', local: 'latest.json' },
    { remote: 'sketch.js', local: 'sketch.js' },
    { remote: 'styles.css', local: 'styles.css' },
    { remote: 'index.html', local: 'poster.html' } // poster.html в этом проекте — это index.html из того
];

async function syncWithSource() {
    console.log("🔄 Начинаю полную синхронизацию с основным проектом (дизайн + данные)...");
    
    for (const file of FILES_TO_SYNC) {
        try {
            const response = await fetch(REPO_BASE_URL + file.remote);
            if (!response.ok) throw new Error(`Ошибка загрузки ${file.remote}: ${response.statusText}`);
            
            let content = await response.text();

            // Если это latest.json, сохраняем его еще и в архив
            if (file.remote === 'latest.json') {
                const data = JSON.parse(content);
                const archiveDir = path.join(__dirname, 'archive');
                if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
                
                const archivePath = path.join(archiveDir, `poster-${data.date}.json`);
                fs.writeFileSync(archivePath, JSON.stringify(data, null, 2));
                console.log(`📦 Данные за ${data.date} добавлены в архив`);

                // Обновляем индекс архива
                const indexFile = path.join(archiveDir, 'index.json');
                let archiveIndex = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile)) : [];
                if (!archiveIndex.find(p => p.date === data.date)) {
                    archiveIndex.unshift({ date: data.date, displayDate: data.displayDate, file: `poster-${data.date}.json` });
                    fs.writeFileSync(indexFile, JSON.stringify(archiveIndex, null, 2));
                }
            }

            // Сохраняем локальный файл
            fs.writeFileSync(path.join(__dirname, file.local), content);
            console.log(`✅ Синхронизирован: ${file.local}`);

        } catch (error) {
            console.error(`❌ Ошибка при синхронизации ${file.remote}:`, error.message);
        }
    }
    console.log("✨ Синхронизация завершена!");
}

syncWithSource();
