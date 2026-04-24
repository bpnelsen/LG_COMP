# LG Companion

Watch you work inside Land Gorilla, then build a reference map of every screen, component, and workflow — powered by Claude Vision.

## How it works

1. **Chrome Extension** — runs in the browser while you use Land Gorilla. Captures screenshots on page loads, navigation, modal opens, form submits, and significant clicks.
2. **Analysis Backend** — receives each screenshot and sends it to the Claude API. Claude identifies the page name, section, layout, every UI component, and navigation flows. Results are stored in a local SQLite database.
3. **Reference Map Viewer** — a React app (served by the backend) that shows you everything learned so far: all screens by section, a full component library, and the navigation flows between pages.

## Quick start

### 1. Start the analysis backend

```bash
cd analysis-backend
npm install
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY
npm run dev
```

Backend runs at `http://localhost:3001`.

### 2. Start the viewer (dev mode)

```bash
cd viewer
npm install
npm run dev
# Open http://localhost:5174
```

Or build and serve through the backend:

```bash
cd viewer && npm run build
# Now http://localhost:3001 serves the viewer
```

### 3. Load the Chrome extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Click the extension icon → confirm "backend connected"
5. Browse Land Gorilla — captures happen automatically

### 4. Configure the target domain

Open the extension options (click Settings in the popup) and set **Target Domain** to your Land Gorilla instance (e.g. `app.landgorilla.com`). Leave blank to capture all sites.

## Project structure

```
lg-companion/
  chrome-extension/   # Manifest V3 Chrome extension
  analysis-backend/   # Express + SQLite + Anthropic SDK
  viewer/             # React reference map viewer
```

## Environment variables

| Variable            | Default               | Description                        |
|---------------------|-----------------------|------------------------------------|
| `ANTHROPIC_API_KEY` | —                     | Required. Your Anthropic API key.  |
| `PORT`              | `3001`                | Backend port.                      |
| `DB_PATH`           | `./data/companion.db` | SQLite database file path.         |
