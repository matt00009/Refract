# Refract: The Ultimate SaaS Master Plan

Ce document est le plan d'architecture définitif pour propulser Refract au niveau industriel. Il intègre **strictement toutes les ressources, documentations et dépôts GitHub** fournis pour garantir une transition parfaite vers un modèle SaaS sécurisé et performant.

---

## 1. Core AI & Data Pipeline (`vercel/ai` + `valibot` / `zod`)
*Objectif : Remplacer le routage manuel fragile par un pipeline robuste, streamé et typé.*

*   **Vercel AI SDK Integration :**
    *   Remplacer les requêtes `fetch` manuelles dans `server/index.ts` par `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, etc.
    *   Utiliser `generateStructuredObjects` avec un schéma Zod/Valibot pour forcer les LLMs à respecter l'interface `AnalysisResult`.
    *   Implémenter `streamText` pour un retour en temps réel à l'utilisateur (réduction perçue de la latence).
    *   Exploiter les "retries with backoff" natifs du SDK Vercel.
*   **Validation Runtime (Valibot/Zod) :**
    *   Créer `src/lib/schemas.ts`. Éradiquer tous les types `any` dans `src/lib/api.ts` et `server/index.ts`.
    *   Validation stricte des payloads JSON extraits des crochets d'herméticité `{ ... }`.

## 2. Zero-Knowledge Security & BYOK (`lobehub/lobe-chat` + OWASP + Web Crypto)
*Objectif : Architecture inviolable pour le SaaS, garantissant que le serveur ne voit jamais les clés en clair.*

*   **Web Crypto API (`SubtleCrypto`) :**
    *   Création de `src/lib/crypto.ts`.
    *   Génération d'une Master Key locale (ou dérivée via `deriveKey` d'un mot de passe utilisateur).
    *   Chiffrement `AES-GCM` des clés API avant stockage dans `localStorage`. Les clés ne sont déchiffrées qu'en RAM lors de l'envoi de la requête.
*   **Inspiration LobeChat :**
    *   Implémentation d'une architecture BYOK (Bring Your Own Key) hautement sécurisée dans le navigateur, réduisant la consommation de tokens par une meilleure structuration des payloads.
*   **OWASP Top 10 LLM Guardrails :**
    *   Isolation stricte du contexte système et utilisateur.
    *   Renforcement du serveur Express : Rate-limiting explicite (`X-RateLimit-Remaining`) prêt pour l'exposition publique.

## 3. UI Précise, Brutalisme & Accessibilité (`neobrutalism-components` + W3C + Framer Motion)
*Objectif : Une interface parfaite, accessible, et des animations fluides.*

*   **Design System Brutaliste :**
    *   Audit de `tailwind.config.js` inspiré de `ekmas/neobrutalism-components`.
    *   Standardisation stricte des tokens CSS (`--rf-border`, `--rf-surface`, `--rf-void`).
    *   Isolation des conteneurs complexes (`SettingsModal`, `HistoryDrawer`) avec des bordures monolithiques.
*   **Conformité WCAG 2.1 AA (W3C APG) :**
    *   Refonte du sélecteur de langage/modèle en un *Custom Select* accessible (gestion des flèches clavier, `aria-activedescendant`).
    *   Attributs stricts sur le `HistoryDrawer` (`role="dialog"`, `aria-modal="true"`) et perfectionnement du Focus Trap.
*   **Framer Motion `layoutId` :**
    *   Animation de l'expansion du panneau de diff (`IssueCard.tsx`).
    *   Transitions calculées par le GPU pour passer du code "Vulnérable" au "Correctif Sécurisé" sans aucune saccade.

## 4. Performance Extrême (`shikijs/shiki` v1)
*Objectif : Réduire la taille du bundle initial signalé par le `performance-auditor`.*

*   **Code Splitting & Lazy Loading :**
    *   Modification de `src/lib/highlight.ts` pour ne pas charger les 11 grammaires au démarrage.
    *   Chargement asynchrone dynamique (ex: `await import('shiki/langs/rust.mjs')`) uniquement déclenché par la détection de langage de l'Intelligent Router.
*   **Vite Single-File Compatibility :**
    *   Ajustement de la configuration Vite pour supporter ce lazy-loading tout en conservant la portabilité maximale de Refract, ou utilisation des *Transformers* Shiki pour alléger l'AST.

## 5. E2E & Régression Visuelle (`microsoft/playwright`)
*Objectif : Garantir qu'aucune mise à jour ne casse l'UI complexe ou les raccourcis clavier.*

*   **Setup Playwright :**
    *   Installation et configuration pour Chromium et Firefox (headless).
*   **Tests Spécifiques :**
    *   *Visual Regressions* : Comparaison pixel-par-pixel des `IssueCard` et des couleurs brutalistes (pour éviter la casse des scrollbars spécifiques à Firefox).
    *   *Focus Management* : Tests automatisés vérifiant que la tabulation (Tab/Shift+Tab) reste bien piégée dans le `SettingsModal` et que la touche `Echap` ferme correctement les tiroirs.

## 6. L'Horizon SaaS : Persistance Sync (`pocketbase` + `lucafaggianelli/pocket-saas`)
*Objectif : Préparer la codebase à l'abandon du localStorage pour une BDD Cloud temps réel.*

*   **Architecture PocketBase :**
    *   Inspiration de `lucafaggianelli/pocket-saas` pour préparer les hooks React de données.
*   **JS SDK Integration :**
    *   Préparation du module `src/lib/db.ts` utilisant `pocketbase/js-sdk`.
    *   Conception de la synchronisation via **Realtime Subscriptions** (Server-Sent Events) pour l'historique d'analyse.
    *   Préparation de l'authentification (AuthStore) et des RLS (Row Level Security) gérées nativement.

---
*Ce document sert de contrat d'architecture. Chaque implémentation à venir devra valider les critères listés dans la couche correspondante.*