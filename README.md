# refract — Standalone AI Code Review Tool

A precision terminal-inspired AI code review tool built with React, Vite, and Claude API.

## Features

- **Live Code Highlighting**: Real-time Shiki syntax highlighting with VS Code theme
- **AI-Powered Analysis**: Claude-powered code reviews with scoring, complexity analysis, and actionable fixes
- **History Tracking**: localStorage-based history for recent analyses (no database required)
- **Responsive Design**: Works perfectly from 400px on mobile to large desktop
- **iframe-Safe**: Completely self-contained, works in iframe context without any parent window access
- **Zero Cookies**: No tracking, no analytics, pure code analysis

## Tech Stack

- React 18 + TypeScript (strict mode)
- Vite 5 (lightning-fast build)
- Tailwind CSS v3
- Framer Motion (animations)
- Shiki v1 (VS Code syntax highlighting)
- Express (minimal API proxy)
- Anthropic SDK (Claude API)

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

### 1. Setup Environment

Create or update `.env` file with:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

This starts two processes:
- **Vite dev server**: http://localhost:5173 (your React app)
- **Express API server**: http://localhost:3001 (Claude proxy)

The Vite proxy automatically forwards `/api` requests to the Express server.

### 4. Build for Production

```bash
npm run build
```

Outputs optimized static files to `dist/` folder.

## Project Structure

```
refract/
├── src/
│   ├── components/
│   │   ├── TopBar.tsx           # Header with logo, language selector, analyze button
│   │   ├── Editor.tsx           # Code input with Shiki highlighting overlay
│   │   ├── Results.tsx          # Analysis output, loading state, metrics
│   │   ├── ScoreRing.tsx        # Animated SVG score visualization
│   │   ├── IssueCard.tsx        # Expandable issue cards with fix snippets
│   │   ├── IssueCard.tsx        # History drawer slide-in panel
│   │   └── EmptyState.tsx       # Ghost state before first analysis
│   ├── lib/
│   │   ├── api.ts              # POST /api/analyze fetch client
│   │   ├── highlight.ts        # Shiki singleton highlighter
│   │   ├── history.ts          # localStorage read/write/clear
│   │   └── detect.ts           # Language auto-detection from code
│   ├── types/
│   │   └── analysis.ts         # TypeScript interfaces for API responses
│   ├── App.tsx                 # Root layout + state management
│   ├── main.tsx                # React DOM render
│   └── index.css               # Tailwind + design tokens
├── server/
│   └── index.ts                # Express proxy + Claude API integration
├── index.html                  # HTML entry
├── vite.config.ts              # Vite configuration with /api proxy
├── tailwind.config.js          # Tailwind responsive breakpoints
├── tsconfig.json               # TypeScript root config
└── package.json                # Dependencies + scripts
```

## Design System

### Color Palette

```css
--rf-void:    #080B0F   /* Main background */
--rf-depth:   #0D1117   /* Secondary background */
--rf-forest:  #141E1A   /* Tertiary background */
--rf-surface: #1E2D28   /* Card/surface background */
--rf-border:  #2A3D35   /* Border color */
--rf-volt:    #A8FF3E   /* Primary accent (green) */
--rf-sky:     #79C0FF   /* Secondary accent (blue) */
--rf-ember:   #FF9070   /* Error/critical (red) */
--rf-warn:    #FFD166   /* Warning (yellow) */
--rf-mist:    #E8F0E0   /* Text primary (off-white) */
```

### Typography

- **Font**: Courier New (monospace), Helvetica Neue (sans-serif)
- **Weights**: 400 (body), 600 (headings), 700 (display)
- **Border Radius**: 10px (cards), 6px (badges), 50% (rings)

## API Reference

### POST /api/analyze

Analyzes code and returns a detailed review.

**Request:**
```json
{
  "code": "function example() { ... }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "score": 78,
  "complexity": "medium",
  "summary": "Good structure but can improve error handling",
  "issues": [
    {
      "severity": "warning",
      "title": "No error handling",
      "description": "The function doesn't handle potential errors.",
      "line": 5,
      "fix": "try { ... } catch (e) { ... }"
    }
  ],
  "strengths": [
    "Clear variable names",
    "Proper function documentation"
  ]
}
```

## Keyboard Shortcuts

- **Cmd/Ctrl+Enter**: Analyze code

## Features in Detail

### Editor Pane

- **Textarea Overlay Technique**: Transparent textarea on top of highlighted div for seamless editing
- **Line Numbers**: Right-aligned column with line numbers
- **Language Detection**: Auto-detects language from code patterns on paste
- **Character Counter**: Bottom-right shows character count (max 4000)
- **Live Highlighting**: Shiki highlighting updates as you type

### Results Pane

- **Loading Skeleton**: Matches exact results layout to prevent layout shift
- **Metrics Cards**: Score ring (animated), complexity badge, issues count
- **Issue List**: Max 8 issues, each expandable with fix snippets
- **Strengths Section**: Positive highlights from the analysis
- **Copy Button**: One-click copy for fix snippets

### History

- **localStorage Storage**: No backend required, persists between sessions
- **Max 10 Entries**: Oldest entry auto-removed when limit exceeded
- **Quick Restore**: Click entry to restore code and past analysis
- **Clear All**: Wipe entire history

### ScoreRing

- **SVG-Based**: Custom animated ring using SVG path
- **Color-Coded**: Ember (<50), Warn (50-75), Volt (75+)
- **Smooth Animation**: 1.2s easeOut animation on mount

## iframe Deployment

This tool is designed to work perfectly in iframe contexts:

```html
<iframe 
  src="https://your-deployment.com/refract" 
  width="100%" 
  height="600"
  style="border: none; border-radius: 10px;"
/>
```

**Security features:**
- No window.top access
- No document.domain manipulation
- All assets use relative paths
- CSP-friendly (no inline event handlers)
- No cookies, no tracking

## Deployment

### Vercel

1. Push code to Git
2. Import project in Vercel dashboard
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy client to Vercel, server to Vercel Functions or separate backend

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001 5173
CMD ["npm", "run", "dev"]
```

### Custom Server

1. Build frontend: `npm run build`
2. Deploy `dist/` folder to static host (Netlify, GitHub Pages, S3, etc.)
3. Deploy `server/index.ts` to serverless/server (Vercel Functions, Railway, Render, etc.)
4. Update CORS origins in `server/index.ts`

## Development Tips

### Adding New Languages

Edit `src/lib/highlight.ts` and `src/lib/detect.ts` to add language support.

### Customizing System Prompt

Edit `server/index.ts` `systemPrompt` variable to change Claude's analysis behavior.

### Changing Color Scheme

Update CSS variables in `src/index.css` `@layer base` section.

### Testing Mobile

Use browser DevTools to test at 400px, 768px, 1024px breakpoints.

## Troubleshooting

### "Analysis failed. Make sure the server is running."

Check that Express server is running on port 3001:
```bash
npm run server
```

Verify `ANTHROPIC_API_KEY` is set in `.env`.

### Highlighting not working

Shiki initializes on first use. Try highlighting again. Check browser console for errors.

### History not persisting

Browser might have disabled localStorage. Check privacy settings.

### Build too large

Shiki language definitions are included in the bundle. This is expected. For production, consider tree-shaking unused languages.

## Non-Negotiables

1. **API Key Security**: `ANTHROPIC_API_KEY` only server-side, never in client bundle
2. **JSON Parse Safety**: Try/catch with one retry on parse failure
3. **Skeleton Matching**: Loading skeleton matches results layout exactly
4. **Shiki Singleton**: Initialized once, reused across highlights
5. **History Cap**: Max 10 entries, oldest auto-removed
6. **Keyboard Shortcut**: Cmd/Ctrl+Enter works reliably
7. **Zero Tracking**: No third-party scripts, no cookies
8. **iframe Safe**: No parent window access, works perfectly in iframe

## License

MIT
