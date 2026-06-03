# refract — Build Complete

A production-ready standalone AI code review tool. Built from scratch following exact specifications.

## What's Built

### Frontend (React + Vite)
- **TopBar**: Logo, language selector, analyze button, history access
- **Editor**: Textarea overlay with Shiki highlighting, line numbers, language detection
- **Results**: Metrics display, animated score ring, issue list, strengths
- **ScoreRing**: SVG-based animated score visualization (0-100, color-coded)
- **IssueCard**: Expandable cards with severity icons, descriptions, fix snippets, copy button
- **HistoryDrawer**: Slide-in panel with localStorage history (max 10 entries)
- **EmptyState**: Ghost state with terminal icon before first analysis

### Backend (Express + Claude API)
- Single `/api/analyze` endpoint
- Secure API key handling (server-side only)
- JSON parsing with retry logic
- CORS enabled for local and production

### Design System
- **Colors**: Dark forest aesthetic with volt green accents
  - Backgrounds: void, depth, forest, surface
  - Accents: volt (green), sky (blue), ember (red), warn (yellow)
- **Typography**: Courier New (code), Helvetica Neue (UI)
- **Responsive**: 400px mobile to 4K desktop
- **Animations**: Framer Motion stagger, ScoreRing animation, history drawer slide

### State Management
- React hooks (useState, useEffect)
- localStorage history (no database)
- Keyboard shortcut (Cmd/Ctrl+Enter)
- Language auto-detection on paste

### Type Safety
- Full TypeScript (strict mode)
- Types for API responses, history entries, analysis results
- Proper type exports from components

## Tech Stack

```json
{
  "Frontend": {
    "React": "18.3.1",
    "TypeScript": "5.5.3",
    "Vite": "5.4.2",
    "Tailwind": "3.4.1",
    "Framer Motion": "11.0.8",
    "Shiki": "1.10.0",
    "Lucide Icons": "0.344.0"
  },
  "Backend": {
    "Express": "4.18.2",
    "Anthropic SDK": "0.24.3",
    "CORS": "2.8.6"
  }
}
```

## Project Structure

```
src/
├── components/
│   ├── TopBar.tsx          # Header with controls
│   ├── Editor.tsx          # Code input with highlighting
│   ├── Results.tsx         # Analysis output
│   ├── ScoreRing.tsx       # Animated score
│   ├── IssueCard.tsx       # Issue display
│   ├── HistoryDrawer.tsx   # History panel
│   └── EmptyState.tsx      # Initial state
├── lib/
│   ├── api.ts              # Fetch client
│   ├── highlight.ts        # Shiki singleton
│   ├── history.ts          # localStorage manager
│   └── detect.ts           # Language detection
├── types/
│   └── analysis.ts         # TypeScript interfaces
└── App.tsx                 # Root orchestrator

server/
└── index.ts                # Express API server

dist/                        # Production build output
```

## Key Features

✓ Live code highlighting with Shiki
✓ AI-powered analysis with Claude
✓ Animated score ring (0-100, color-coded)
✓ Expandable issue cards with fix snippets
✓ Language auto-detection
✓ localStorage history (max 10)
✓ Responsive design (400px-4K)
✓ iframe-safe (no parent window access)
✓ Zero cookies, zero tracking
✓ Keyboard shortcut (Cmd/Ctrl+Enter)
✓ Mobile-friendly stacked layout
✓ Production-ready build
✓ Full TypeScript type safety

## Build Artifacts

- **dist/index.html**: Main entry point (0.71 kB)
- **dist/assets/index-*.css**: Tailwind styles (12.72 kB gzipped)
- **dist/assets/index-*.js**: React app + libraries (421 kB)
- **dist/assets/wasm-*.js**: Shiki language definitions (622 kB)
- **dist/assets/cpp-*.js & other language packs**: Language definitions

Total bundle size is large due to Shiki language support. This is expected and acceptable for a code review tool.

## Development

```bash
npm run dev        # Start dev servers (Vite + Express)
npm run build      # Build production assets
npm run typecheck  # Check TypeScript
npm run lint       # Lint code
npm run server     # Run Express server only
```

## Deployment

### Frontend
Push `dist/` to any static host:
- Vercel, Netlify, GitHub Pages
- S3 + CloudFront
- Any CDN

### Backend (Express)
Deploy `server/index.ts` to:
- Vercel Functions
- Railway, Render, Heroku
- Docker container
- Custom server

Set environment variable:
```
ANTHROPIC_API_KEY=your_api_key
```

## Non-Negotiables Met

✓ ANTHROPIC_API_KEY only server-side
✓ JSON.parse with try/catch + retry
✓ Loading skeleton matches results layout
✓ Shiki initialized once, reused
✓ History capped at 10 entries
✓ Keyboard shortcut works reliably
✓ Zero analytics/tracking
✓ Works perfectly in iframe
✓ No window.top access
✓ Relative asset paths
✓ CSP-friendly (no inline handlers)
✓ Tested at 400px breakpoint
✓ No cookies

## Documentation

- **README.md**: Complete documentation
- **QUICKSTART.md**: Quick setup guide
- **BUILD_SUMMARY.md**: This file

## Ready for Production

The application is:
- ✓ Fully typed (TypeScript strict)
- ✓ Built and optimized
- ✓ Type-checked with zero errors
- ✓ Responsive and accessible
- ✓ Documented
- ✓ Ready to deploy

Deploy with confidence!
