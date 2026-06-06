# Refract Agent Skills Updates - SaaS Master Plan (2026)

Ce document récapitule les mises à jour critiques effectuées sur les compétences des agents pour refléter l'architecture SOTA Phase 1-4.

---

## 🛠️ Unified Technical Standard
Tous les agents doivent désormais opérer avec les connaissances suivantes :
- **Validation :** Toute donnée structurelle doit respecter `src/lib/schemas.ts` (Zod).
- **IA :** Utilisation exclusive du **Vercel AI SDK** (`ai`).
- **Sécurité :** Chiffrement local **AES-GCM** (Zero-Knowledge). Pas de stockage de clés en clair.
- **Performance :** Stratégie **Lazy-Loading** pour Shiki. Ne jamais pré-charger de grammaires.
- **QA :** Utilisation de **Playwright** pour les tests de régression visuelle et d'accessibilité.

---

## 🧠 Updated Skill SOPs

### api-reliability-auditor
- **New Task:** Verify that `generateObject` is called with the correct `mode` (e.g., `json` for Groq, `object` for Mistral).
- **New Task:** Ensure Intelligent Router logic favors Mistral for reasoning and Groq for speed-first simple tasks.

### type-safety-auditor
- **New Task:** Enforce strict typing in `src/types/analysis.ts` (no `any` in interface extensions).
- **New Task:** Verify that unmapped AI fields are typed as `unknown` via Zod `passthrough`.

### performance-auditor
- **New Task:** Verify that `src/lib/highlight.ts` uses transformers correctly to optimize HTML output.
- **New Task:** Audit language loading to ensure zero-initial-load strategy.

### security-auditor
- **New Task:** Test the **Vault Integrity Check** (decryption of the integrity marker) in `SettingsModal.tsx`.
- **New Task:** Validate that `decryptVault` is only called in-memory during analysis.

### ux-accessibility-auditor
- **New Task:** Run `npx playwright test` to verify WCAG compliance.
- **New Task:** Audit Framer Motion `layout` properties to ensure smooth state transitions.

---
*Status: All agent SOPs and documentation synchronized with SOTA Phase 4.*