const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Base URL of main repo (design + data)
const REPO_BASE_URL = 'https://raw.githubusercontent.com/RybnikovVeniamin/NewsPosterGenerating/main/';

// List of files to sync
const FILES_TO_SYNC = [
    { remote: 'latest.json', local: 'latest.json' },
    { remote: 'sketch.js', local: 'sketch.js' },
    { remote: 'styles.css', local: 'styles.css' },
    { remote: 'index.html', local: 'poster.html' } // poster.html in this project is index.html from that one
];

async function syncWithSource() {
    console.log("🔄 Starting full sync with main project (design + data)...");
    
    for (const file of FILES_TO_SYNC) {
        try {
            const response = await fetch(REPO_BASE_URL + file.remote);
            if (!response.ok) throw new Error(`Failed to load ${file.remote}: ${response.statusText}`);
            
            let content = await response.text();

            // If it's latest.json, also save to archive
            if (file.remote === 'latest.json') {
                const data = JSON.parse(content);
                const archiveDir = path.join(__dirname, 'archive');
                if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
                
                const archivePath = path.join(archiveDir, `poster-${data.date}.json`);
                fs.writeFileSync(archivePath, JSON.stringify(data, null, 2));
                console.log(`📦 Data for ${data.date} added to archive`);

                // Update archive index
                const indexFile = path.join(archiveDir, 'index.json');
                let archiveIndex = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile)) : [];
                if (!archiveIndex.find(p => p.date === data.date)) {
                    archiveIndex.unshift({ date: data.date, displayDate: data.displayDate, file: `poster-${data.date}.json` });
                    fs.writeFileSync(indexFile, JSON.stringify(archiveIndex, null, 2));
                }
            }

            // Save local file
            fs.writeFileSync(path.join(__dirname, file.local), content);
            console.log(`✅ Synced: ${file.local}`);

        } catch (error) {
            console.error(`❌ Sync error for ${file.remote}:`, error.message);
        }
    }
    console.log("✨ Sync complete!");
}

syncWithSource();
