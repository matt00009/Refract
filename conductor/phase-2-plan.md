# Refract: Phase 2 Execution Plan

## Objective
Execute Phase 2 of the SaaS Master Plan: **Precision UI & Accessibility** combined with **E2E Testing (Playwright)**. This phase ensures the application is highly accessible (WCAG 2.1 AA), visually polished with GPU-accelerated layout transitions, and protected against regressions through automated visual testing.

## Scope & Impact
- **Accessibility:** Improves keyboard navigation, screen reader compatibility, and focus management across modaux, drawers, and custom selects.
- **Micro-Interactions:** Enhances the perceived performance and premium feel of the app using Framer Motion `layoutId` for shared layout animations (specifically in `IssueCard`).
- **Quality Assurance:** Installs Playwright to automate visual regression tests and verify complex interaction flows (e.g., focus traps).

## Step-by-Step Implementation

### Step 1: Fluid Layouts (Framer Motion `layoutId`)
- Update `src/components/IssueCard.tsx`.
- Wrap the main card and its expanding contents in `motion.div` with a unique `layoutId`.
- Ensure the transition between the collapsed "Vulnerable" view and the expanded "Secured" view is fluid and prevents layout shifting (CLS).

### Step 2: WCAG 2.1 AA Accessibility Polish
- **HistoryDrawer:** Ensure `role="dialog"`, `aria-modal="true"`, and proper `aria-labelledby`/`aria-describedby` attributes are set. Verify the focus trap works flawlessly via `useFocusTrap`.
- **TopBar Provider Selector:** Currently implemented as a row of buttons. Ensure proper `aria-label`, `aria-pressed`, or consider refactoring into a full ARIA-compliant `listbox` or `radiogroup` for better semantic meaning.
- **Keyboard Navigation:** Add visible focus states (`focus-visible:ring`) to all interactive elements, removing `outline-none` where it harms accessibility.

### Step 3: Playwright Setup & E2E Testing
- Install Playwright: `npm init playwright@latest` (configure for TS, no GitHub Actions initially).
- Create an E2E test suite (`tests/` directory):
  - `accessibility.spec.ts`: Test focus trapping in `SettingsModal` and `HistoryDrawer`.
  - `visual.spec.ts`: Setup visual comparisons for `IssueCard` states (collapsed vs. expanded) and `ScoreRing` to ensure brutalist styling remains intact.

## Verification
- Run `npx playwright test` to verify the testing infrastructure.
- Run `npm run typecheck` and `npm run lint`.
- Manually navigate the app using only the `Tab`, `Enter`, `Space`, and `Escape` keys.