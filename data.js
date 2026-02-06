// ========================================
// Global Pulse — Simulated GDELT-style Data
// ========================================

// Simulated trending stories (mimics GDELT data structure)
// In production, this would come from GDELT API
var TRENDING_STORIES = [
    {
        id: 1,
        rank: 1,
        headline: "Eastern European Conflict Escalates as Diplomatic Talks Stall",
        regions: ["Ukraine", "Russia", "Poland", "Moldova"],
        mainLocation: { name: "Kyiv", lat: 50.4501, lng: 30.5234 },
        secondaryLocations: [
            { name: "Moscow", lat: 55.7558, lng: 37.6173 },
            { name: "Warsaw", lat: 52.2297, lng: 21.0122 },
            { name: "Chisinau", lat: 47.0105, lng: 28.8638 }
        ],
        intensity: 95, // 0-100 scale based on article volume
        tone: -4.2, // GDELT tone score (-10 to +10)
        articleCount: 48750,
        themes: ["CONFLICT", "MILITARY", "DIPLOMACY"],
        color: "#ff2d55" // Hot red
    },
    {
        id: 2,
        rank: 2,
        headline: "World Economic Forum Addresses Global Financial Instability",
        regions: ["Switzerland", "Europe", "Global"],
        mainLocation: { name: "Davos", lat: 46.8027, lng: 9.8360 },
        secondaryLocations: [
            { name: "Geneva", lat: 46.2044, lng: 6.1432 },
            { name: "Brussels", lat: 50.8503, lng: 4.3517 },
            { name: "Frankfurt", lat: 50.1109, lng: 8.6821 }
        ],
        intensity: 78,
        tone: -1.8,
        articleCount: 31200,
        themes: ["ECONOMY", "SUMMIT", "POLICY"],
        color: "#ff6b35" // Warm orange
    },
    {
        id: 3,
        rank: 3,
        headline: "Political Crisis Deepens in South American Nation",
        regions: ["Venezuela", "Colombia", "Brazil"],
        mainLocation: { name: "Caracas", lat: 10.4806, lng: -66.9036 },
        secondaryLocations: [
            { name: "Bogota", lat: 4.7110, lng: -74.0721 },
            { name: "Brasilia", lat: -15.7975, lng: -47.8919 }
        ],
        intensity: 62,
        tone: -3.5,
        articleCount: 18900,
        themes: ["POLITICS", "PROTEST", "ECONOMY"],
        color: "#ffb800" // Medium yellow
    },
    {
        id: 4,
        rank: 4,
        headline: "Climate Summit Yields New Environmental Commitments",
        regions: ["UAE", "Global"],
        mainLocation: { name: "Dubai", lat: 25.2048, lng: 55.2708 },
        secondaryLocations: [
            { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773 },
            { name: "Riyadh", lat: 24.7136, lng: 46.6753 }
        ],
        intensity: 45,
        tone: 2.1,
        articleCount: 12400,
        themes: ["ENVIRONMENT", "CLIMATE", "SUMMIT"],
        color: "#34c759" // Cool green
    },
    {
        id: 5,
        rank: 5,
        headline: "Tech Giants Face New Regulatory Challenges in Asia",
        regions: ["China", "Japan", "South Korea"],
        mainLocation: { name: "Beijing", lat: 39.9042, lng: 116.4074 },
        secondaryLocations: [
            { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
            { name: "Seoul", lat: 37.5665, lng: 126.9780 },
            { name: "Shanghai", lat: 31.2304, lng: 121.4737 }
        ],
        intensity: 38,
        tone: -0.8,
        articleCount: 9800,
        themes: ["TECHNOLOGY", "REGULATION", "BUSINESS"],
        color: "#5ac8fa" // Cold blue
    }
];

// Color themes for visualization
const COLOR_THEMES = [
    {
        name: "Heat",
        colors: {
            hot: "#ff2d55",
            warm: "#ff6b35",
            medium: "#ffb800",
            cool: "#34c759",
            cold: "#5ac8fa"
        },
        background: "#08090c",
        text: "#e8e9eb"
    },
    {
        name: "Infrared",
        colors: {
            hot: "#ff0080",
            warm: "#ff4da6",
            medium: "#b366ff",
            cool: "#6699ff",
            cold: "#00ccff"
        },
        background: "#0a0012",
        text: "#f0e6ff"
    },
    {
        name: "Thermal",
        colors: {
            hot: "#ffffff",
            warm: "#ffff00",
            medium: "#ff6600",
            cool: "#ff0000",
            cold: "#660066"
        },
        background: "#000022",
        text: "#ffffff"
    },
    {
        name: "Satellite",
        colors: {
            hot: "#00ff88",
            warm: "#00cc66",
            medium: "#009944",
            cool: "#006633",
            cold: "#003322"
        },
        background: "#001a0d",
        text: "#88ffbb"
    },
    {
        name: "Mono",
        colors: {
            hot: "#ffffff",
            warm: "#cccccc",
            medium: "#888888",
            cool: "#444444",
            cold: "#222222"
        },
        background: "#0a0a0a",
        text: "#ffffff"
    }
];

// Helper to simulate fetching fresh data
function simulateFreshData() {
    // Slightly randomize intensities to simulate live data
    return TRENDING_STORIES.map(story => ({
        ...story,
        intensity: Math.min(100, Math.max(20, story.intensity + (Math.random() - 0.5) * 10)),
        articleCount: story.articleCount + Math.floor((Math.random() - 0.3) * 500)
    }));
}

// Get today's date formatted
function getTodayFormatted() {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}
