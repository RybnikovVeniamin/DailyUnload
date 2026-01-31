# Global Pulse 🌍

Global Pulse is an experimental project that captures a "daily snapshot" of the world through generative art. It automatically transforms global news trends into unique, data-driven posters.

### How it works:
- **Automated Data Collection:** Every day, a specialized bot fetches the most significant global news using the NewsAPI.
- **Generative Design:** The system analyzes the news volume, geographic impact, and sentiment to generate a unique visual poster using p5.js.
- **Interactive Archive:** Each poster is saved as a data snapshot, allowing the future website to display interactive hover effects with original news sources and images.

### Tech Stack:
- **p5.js** for generative visualization.
- **Node.js** for the automated news-gathering bot.
- **GitHub Actions** for daily autonomous updates and data archiving.

### Project Structure:
- `/archive`: Stores daily JSON snapshots of news data.
- `generator.js`: The "brain" of the bot that runs daily on GitHub Actions.
- `sketch.js`: The visual engine for rendering posters in the browser.
- `index.html`: The current generator interface.

---
*Created by [RybnikovVeniamin](https://github.com/RybnikovVeniamin)*
