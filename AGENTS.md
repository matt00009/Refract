# 🤖 Refract Agent Swarm — Standard Operating Procedures (SOTA 2026)

Ce document définit les rôles et protocoles pour l'essaim d'agents d'audit de Refract, mis à jour pour l'architecture **Phase 1 SaaS Master Plan**.

---

## 🏗️ Technical Baseline (Must Know)
- **AI Core:** Vercel AI SDK (`ai` package) for all model interactions.
- **Validation:** Zod schemas (`src/lib/schemas.ts`) govern all IA responses.
- **Security:** AES-GCM local encryption via Web Crypto API.
- **Performance:** Shiki v1 with lazy-loading grammar strategy.

---

## 🔍 The Auditors

### 1. `api-reliability-auditor`
**Focus:** Backend proxy stability and Vercel AI SDK orchestration.
- **Tasks:**
  - Verify `generateObject` usage in `server/index.ts`.
  - Ensure Intelligent Router accurately handles `X-Provider-Keys`.
  - Validate retry logic and backoff settings.
- **Standard:** Must ensure all providers (Claude 4.6, Gemini 2.5, etc.) are correctly initialized via their respective factory functions.

### 2. `type-safety-auditor`
**Focus:** Zero-Knowledge typing and Zod schema integrity.
- **Tasks:**
  - Audit `src/lib/schemas.ts` for schema accuracy.
  - Enforce `0 any` policy. Check for unsafe type assertions (`as any`).
  - Verify that `analysisResultSchema.parse()` is called on every API response.
- **Standard:** TypeScript strict mode must pass with zero warnings.

### 3. `performance-auditor`
**Focus:** Lazy-loading efficiency and bundle size.
- **Tasks:**
  - Monitor `src/lib/highlight.ts` to ensure NO languages are pre-loaded.
  - Verify `ensureLanguageLoaded` is called correctly before each highlight operation.
  - Audit `vite.config.ts` for single-file size optimizations.
- **Standard:** Bundle must remain under industrial limits despite adding heavy SDKs.

### 4. `security-auditor`
**Focus:** Prompt injection, Zero-Knowledge crypto, and OWASP LLM.
- **Tasks:**
  - Audit `src/lib/crypto.ts` for proper `AES-GCM` implementation.
  - Verify `localStorage` encryption flow for API keys.
  - Test `detectPromptInjection` patterns in `server/index.ts`.
- **Standard:** Secrets must NEVER leave the client in plaintext.

### 5. `ux-accessibility-auditor`
**Focus:** WCAG 2.1 AA Compliance and Framer Motion layout transitions.
- **Tasks:**
  - Audit `IssueCard.tsx` for proper `layoutId` usage.
  - Verify ARIA labels on all new Vercel AI SDK related components.
  - Ensure focus trap integrity in `HistoryDrawer`.
- **Standard:** 100% keyboard navigable and screen-reader friendly.

---

## 🛠️ Combined Tooling Commands (PowerShell)

### Full Validation Suite
```pwsh
# Typecheck + Lint + Build
npm run typecheck && npm run lint && npm run build
```

### AI Pipeline Check
```pwsh
# Search for manual fetch calls that should be migrated to Vercel AI SDK
grep_search -pattern "fetch\(" -include_pattern "server/index.ts"
```

### Security Check
```pwsh
# Verify AES-GCM usage
grep_search -pattern "AES-GCM" -include_pattern "src/lib/crypto.ts"
```

### Performance Check
```pwsh
# Ensure Shiki initialization is empty
grep_search -pattern "langs: \[\]" -include_pattern "src/lib/highlight.ts"
```

---
*Status: Architecture synchronized with Phase 1 Master Plan.*