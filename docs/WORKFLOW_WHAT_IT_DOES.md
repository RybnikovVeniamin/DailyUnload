# What the daily workflow does

## Goal
Run once per day (or manually) to **sync design and data** from the main poster project (NewsPosterGenerating) into this repo (DailyUnload), **archive** the daily snapshot, and **push** those changes back to GitHub.

## Steps (in order)

1. **Checkout repository**  
   GitHub checks out the DailyUnload repo on a fresh runner.

2. **Set up Node.js**  
   Installs Node 18 so we can run the generator script.

3. **Install dependencies**  
   Runs `npm install` (e.g. for `node-fetch` used by the generator).

4. **Run generator**  
   Runs `node generator.js`, which:
   - Fetches from NewsPosterGenerating: `latest.json`, `sketch.js`, `styles.css`, `index.html` (saved here as `poster.html`).
   - When it gets `latest.json`, it also:
     - Writes `archive/poster-<date>.json` (daily snapshot).
     - Updates `archive/index.json` (list of archived dates).
   - Writes `latest.json` and the other synced files into this repo.

5. **Commit and push changes**  
   - Configure Git user for the bot.
   - Sync with `origin/main` and reset to it (soft).
   - **Add** `archive/` and `latest.json` with **force** (`-f`) because they are in `.gitignore` (so normal `git add` would skip them).
   - If there are staged changes, commit with message like "Add daily news data: 2026-02-16".
   - Push to `main` on GitHub.

## Why it can fail
- If the workflow runs **without** `-f` in `git add`, Git refuses to add `archive/` and `latest.json` (they are ignored), so the step fails.
- The fix is to use `git add -f archive/ latest.json` in the workflow and ensure that version is the one running on GitHub (correct branch, latest push).
