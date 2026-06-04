# Refract System Architecture

## Overview
Refract is a standalone web application designed for expert-level code analysis using multiple AI providers. It features a distributed provider model with auto-routing capabilities.

## Tech Stack
- **Frontend**: React (TypeScript), Vite, TailwindCSS, Framer Motion, Shiki (Highlighter).
- **Backend**: Express (TypeScript), Proxy to AI APIs (Anthropic, Gemini, Mistral, Groq, DeepSeek).
- **Storage**: LocalStorage for API keys, History, and Session state.

## Core Components
- `Editor.tsx`: Token-based syntax highlighting with character limits and fallback escaping.
- `Results.tsx`: Metric visualization (Score, Complexity) and issue drill-down.
- `TopBar.tsx`: Dynamic configuration of languages and providers.
- `HistoryDrawer.tsx`: Local state synchronization for session persistence.
- `SettingsModal.tsx`: Secure API key management (Client-side overrides).

## Provider Logic
1. Request hits `POST /api/analyze`.
2. Router checks for `.env` keys.
3. If missing, checks `X-Provider-Key` header.
4. Forwards request to target AI API with retry logic and 30s timeout.
5. Returns validated JSON response.
