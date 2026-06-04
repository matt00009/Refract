# UI/UX Dynamics & Personalization

## Interactive Features
- **Onboarding (v2)**: Step-by-step tutorial with `framer-motion` transitions. Prevents "cold start" confusion.
- **Deep Linking**: URL hash sync (`atob/btoa`) allows sharing specific code snippets and analysis contexts via browser URL.
- **Settings Dashboard**: Real-time management of API keys with server-side validation indicators.
- **Toaster System**: Custom, low-latency notification layer for non-blocking feedback (Success/Error).

## Productivity Tools
- **Editor Toolbar**: Instant copy/clear actions for the input buffer.
- **Results Toolbar**: Report export (JSON) and state reset.
- **Keyboard Shortcuts**:
    - `Cmd/Ctrl + ,`: Open Settings
    - `Cmd/Ctrl + H`: Toggle History
    - `Cmd/Ctrl + Enter`: Trigger Analysis

## Accessibility (WCAG 2.1)
- Proper ARIA roles for modals (`role="dialog"`, `aria-modal="true"`).
- Keyboard-trappable select elements.
- Semantic HTML structure.
