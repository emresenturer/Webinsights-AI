# WebInsights AI

Strategic website audit tool. Enter a site and get a structured analysis of design, SEO, content and performance, with prioritized recommendations and a white-label, board-ready PDF report.

**Live:** [emresenturer.github.io/Webinsights-AI](https://emresenturer.github.io/Webinsights-AI/)

## How it works

1. Open the live app and paste your own Google Gemini API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
2. Search for or enter a website.
3. Review the audit, optionally set your agency name (white label), and export the PDF report.

Your key is stored only in your browser and sent only to Google's Gemini API. There is no backend.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Optionally put `GEMINI_API_KEY=...` in `.env.local` to skip the key prompt during development.

## Deploy

Every push to `main` builds the app and publishes `dist/` to the `gh-pages` branch (`.github/workflows/pages.yml`).

## Stack

React 19, TypeScript, Vite, Tailwind CSS, Recharts, Gemini API with Google Search grounding. By [Emre Senturer](https://github.com/emresenturer).
