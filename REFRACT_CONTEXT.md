# REFRACT_CONTEXT.md — Mémoire Technique Persistante
> Context Engineering — À charger au début de chaque session agent

---

## 🏗️ Architecture

| Layer | Stack | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript strict | Vite 5, no Next.js |
| Styles | Tailwind CSS v3 + CSS custom props | Design tokens: `--rf-*` |
| Animation | Framer Motion v11 | GPU-accelerated only |
| Syntax HL | Shiki v1 | Singleton — NEVER re-init |
| Backend | Express 4 (port 3001) | Proxy only — NO database |
| Build | Vite 5 + vite-plugin-singlefile | Outputs single HTML |

---

## 🎨 Design System Tokens

```css
--rf-void:    #080B0F  /* Fond principal (abyss) */
--rf-depth:   #0D1117  /* Editor background */
--rf-forest:  #141E1A  /* Cards, surfaces */
--rf-surface: #1E2D28  /* Elevated surfaces */
--rf-border:  #2A3D35  /* Hairline borders (0.5px) */
--rf-volt:    #A8FF3E  /* Primary accent (CTA, highlights) */
--rf-sky:     #79C0FF  /* Suggestions, info */
--rf-ember:   #FF9070  /* Bugs, errors, danger */
--rf-warn:    #FFD166  /* Warnings */
--rf-mist:    #E8F0E0  /* Primary text */
```

**Typographies** : `Libre Franklin` (sans) · `Courier Prime` (mono)  
**Border radius** : cards=10px · badges=6px · buttons=6px  
**Border width** : hairline=0.5px (signature visuelle)

---

## 🤖 AI Providers

| Provider | Auto-route Condition | Model |
|---|---|---|
| Mistral/Codestral | `lang ∈ {js,ts,py,html,css,json}` AND `len < 3500` | codestral-latest |
| Groq | `len < 2000` (fallback) | llama-3.3-70b-versatile |
| Anthropic | Default / large code | claude-sonnet-4-20250514 |
| Gemini | Manual selection | gemini-2.5-pro |
| DeepSeek | Manual selection | deepseek-chat |

**API Key header** : `x-provider-key` (client-side fallback)  
**Rate limit** : 10 req/min per IP (sliding window)  
**Max input** : 4000 chars  
**Timeout** : 30s per request, 3 retries with backoff

---

## 📐 Component Map

```
App.tsx
├── TopBar.tsx          — Fixed nav, provider pills, actions
├── Editor.tsx          — Code input + syntax highlight (Shiki) + line numbers
├── Results.tsx
│   ├── ScoreRing.tsx   — SVG ring (volt-glow if score ≥ 90)
│   ├── IssueCard.tsx   — Expandable dual-panel (vulnerable/fix)
│   └── EmptyState.tsx  — Terminal >_ prompt with shortcut hints
├── HistoryDrawer.tsx   — Side drawer, localStorage
├── SettingsModal.tsx   — API key config per provider
├── Onboarding.tsx      — First-run modal
├── Toast.tsx           — Notification system
└── ErrorBoundary.tsx   — React error boundary
```

**Shared lib** :
- `src/lib/api.ts` — fetch wrapper to `/api/analyze`
- `src/lib/detect.ts` — language heuristic detection
- `src/lib/highlight.ts` — Shiki singleton + token renderer
- `src/lib/history.ts` — localStorage CRUD (LIMIT=15)
- `src/lib/constants.ts` — LANGUAGES, PROVIDERS shared source of truth

---

## 🔒 Security Layers (implemented)

1. **Helmet** — HTTP security headers on Express
2. **CORS** — Restricted to `CORS_ORIGIN` env (default: localhost:5173)
3. **Rate Limiter** — Sliding window, 10 req/min per IP
4. **Prompt Injection Guard** — Regex patterns block LLM hijacking
5. **Input Sanitization** — Strip null bytes + control chars
6. **Key Format Validation** — Per-provider regex before API call
7. **Body Size Limit** — 16kb max on express.json()
8. **Semgrep Rules** — `.semgrep.yml` for SAST scanning

---

## 🚫 Contraintes Critiques

- `fix` et `vulnerable_code` dans les IssueCard = **CODE UNIQUEMENT** (jamais prose)
- Si l'IA renvoie de la prose dans `fix` → `ensureCode()` auto-wrap en `// commentaire`
- `code.split('\n')` n'est appelé **qu'une fois** par render (mémoïsé avec `useMemo`)
- Le highlighter Shiki est un **singleton** — ne jamais appeler `createHighlighter()` deux fois
- `LIMIT` est importé de `history.ts` — ne jamais hardcoder `15` ailleurs
- `LANGUAGES` et `PROVIDERS` viennent de `constants.ts` — source unique de vérité

---

## 📋 Agents actifs (AGENTS.md)

| Agent | Trigger | Focus |
|---|---|---|
| `security-auditor` | PR + weekly | Secrets, CORS, XSS, rate limit |
| `type-safety-auditor` | PR (TS files) | `any` types, interfaces |
| `performance-auditor` | PR + monthly | Bundle, re-renders, CLS |
| `ux-accessibility-auditor` | PR (components) | WCAG 2.1 AA |
| `code-quality-auditor` | PR | Lint, duplication, JSDoc |
| `api-reliability-auditor` | PR (server/) | Provider integrations |

---

## 🗺️ Roadmap

- [ ] **PocketBase** — Migration historique cloud + auth multi-utilisateurs
- [ ] **Playwright** — Tests E2E automatisés pour IssueCard dual-panel
- [ ] **Dot Matrix Loaders** — Natif CSS (rf-dot-loader) — ✅ Déjà implémenté
- [ ] **Partage de rapports** — URL publique avec hash
- [ ] **Workspace SaaS** — Teams + API keys chiffrées par utilisateur
