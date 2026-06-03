# Quick Start Guide — refract

## 1. Setup API Key

Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

Update `.env` file:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

## 2. Install & Run

```bash
npm install
npm run dev
```

Two servers start automatically:
- **React App**: http://localhost:5173
- **API Server**: http://localhost:3001

## 3. Use the App

1. Paste code in the left editor pane
2. Select language (or leave as "Auto" for auto-detection)
3. Press **Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows/Linux) to analyze
4. View results in the right pane

## Features

- **Live Highlighting**: Code highlighting updates as you type
- **Smart Detection**: Language auto-detected from code patterns
- **History**: Click the history icon to see past analyses
- **Mobile**: Fully responsive, works on phones and tablets
- **Dark Theme**: Terminal-inspired precision aesthetic

## Build for Production

```bash
npm run build
```

Output in `dist/` folder. Deploy the static files to any host.

## Need Help?

See `README.md` for complete documentation.
