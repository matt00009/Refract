# Refract Final Level Architecture

## 🎯 The "Perfection" Milestone
The project has reached its final architectural state, characterized by:
- **BYOK (Bring Your Own Key)**: Full client-side key support with server-side config detection.
- **Focus Mode**: Optimized distraction-free coding experience.
- **Advanced Controls**: Real-time temperature and token limit tuning.
- **Observability**: Direct visibility into provider latency and heuristics.

## 🛠️ Key Components
- `SettingsModal.tsx`: Dashboard for API keys, model parameters, and shortcuts.
- `Editor.tsx`: Responsive buffer with auto-detection scoring and focus toggle.
- `Results.tsx`: High-fidelity metric visualization with latency reporting.
- `Toast.tsx`: Non-blocking feedback layer for all async operations.

## ⌨️ Shortcuts
| Shortcut | Action |
| --- | --- |
| `Ctrl + Enter` | Analyze Code |
| `Ctrl + ,` | Open Settings |
| `Ctrl + H` | Toggle History |
| `Ctrl + F` | Toggle Focus Mode |

## 🧪 Mathematical Heuristics
- Language detection uses a **Weighted Scoring Algorithm** tuned for type-density (TS) and syntax markers (PY, GO, etc.).
- Circle geometry is pre-normalized to $[0, 100]$ to ensure SVG stability.
- Rate limiting utilizes a **Sliding Window** to prevent burst overflows.
