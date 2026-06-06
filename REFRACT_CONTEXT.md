# REFRACT_CONTEXT.md — Mémoire Technique Persistante
> Context Engineering — À charger au début de chaque session agent

---

## 🏗️ Architecture SOTA (2026)

| Layer | Stack | Notes |
|---|---|---|
| **Frontend** | React 18 + TS Strict | UI Brutaliste, Framer Motion, Shiki Lazy Loading |
| **API Pipeline** | **Vercel AI SDK** | Orchestration multi-provider (`ai`), Streaming natif |
| **Validation** | **Zod** | Schémas stricts (`schemas.ts`) forçant l'IA au JSON valide |
| **Security** | Web Crypto (AES-GCM) | Architecture Zero-Knowledge préparée pour le SaaS |
| **Highlighter** | Shiki v1 (Lazy) | Chargement dynamique des grammaires à la volée |
| **Router** | Intelligent + Key-Aware | Heuristique basée sur la complexité et les clés réelles |

## 🎯 État des Chantiers (Roadmap SaaS)

- [x] **Vercel AI SDK Integration** — Remplacement du fetch manuel par `@ai-sdk` (Phase 1)
- [x] **Strict Runtime Validation** — Utilisation de Zod pour garantir le format JSON (Phase 1)
- [x] **Lazy Loading Shiki** — Optimisation massive du bundle (Phase 1)
- [x] **Zero-Knowledge Core** — Utilisation de la Web Crypto API pour le futur SaaS (Phase 1)
- [x] **WCAG 2.1 AA Compliance** — Accessibilité complète des Drawers et Sélecteurs (Phase 2)
- [x] **Visual Regressions** — Tests E2E automatisés via Playwright (Phase 2)
- [~] **PocketBase Integration** — Persistance Cloud temps réel (Phase 3 en cours)

## 🔐 Architecture Zero-Knowledge (Comment ça marche ?)
Refract utilise un modèle de sécurité "Confiance Zéro" pour vos clés API :
1. **PBKDF2 :** Votre mot de passe de coffre-fort n'est jamais stocké. Il est utilisé pour dériver une clé cryptographique forte via 100 000 itérations de hachage.
2. **AES-GCM :** Vos clés API (Claude, Gemini, etc.) sont chiffrées localement dans votre navigateur avec cet algorithme de niveau militaire.
3. **Isolation :** Seul le "ciphertext" (donnée illisible) est stocké dans le `localStorage`. 
4. **RAM Only :** Le déchiffrement ne se produit qu'en mémoire vive (RAM) lors de l'envoi d'une analyse. Le serveur de Refract reçoit la clé pour la transmettre au fournisseur IA, mais ne peut jamais la stocker de manière persistante sans votre mot de passe.

## 🛠️ Stack Technique Courante
- **Server:** Node.js (tsx), Express, Helmet, CORS, Vercel AI SDK.
- **Providers:** Anthropic (Sonnet 4.6), Gemini (2.5 Pro/Flash), Mistral (Large 3), Groq (Llama 3.3), DeepSeek (R1).
- **Client:** React, Tailwind CSS, Lucide Icons, Shiki (Lazy), Zod, Framer Motion.

## 📜 Conventions de Code
1. **Zéro `any` :** Utiliser les types générés par Zod (`ZodAnalysisResult`).
2. **Lazy First :** Ne jamais charger d'actifs lourds (grammaires, modèles) au démarrage.
3. **Key-Aware :** Toujours vérifier la présence de `X-Provider-Keys` avant de router.
4. **Validation Pipeline :** Toute donnée provenant de l'IA *doit* passer par `analysisResultSchema.parse()`.

---
*Dernière mise à jour : Phase 1 SaaS Master Plan implémentée.*