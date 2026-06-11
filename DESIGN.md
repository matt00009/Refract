# Refract Design System (v2.5)
> Open Design Powered — Brutalist-Cyber Identity

## Brand Personality
- **Core**: Industrial, Precise, Raw, Technical.
- **Mood**: High-density information, terminal-first, zero-fluff.
- **Audience**: Senior Developers, Security Auditors, SREs.

## Visual Language (Brutalist-Cyber)
### Palette (OKLCH based)
- **Void (Background)**: `--rf-void` (#080B0F)
- **Volt (Primary Accent)**: `--rf-volt` (#A8FF3E) - High visibility, neon green.
- **Ember (Warning/High-Impact)**: `--rf-ember` (#FF9070) - Warm warning.
- **Sky (System/Info)**: `--rf-sky` (#79C0FF) - Cold info.

### Components: The Forge
New patterns introduced in v2.5 for the `StatsForge` interface.
- **Circuitry Connectors**: SVG patterns (`#circuits`) connecting data nodes to imply system-wide logic flow.
- **Odometer Display**: Segmented number blocks for quantitative growth metrics.
- **Stepped History**: Line charts use `stepped` lines (90-degree angles) to avoid organic/soft curves, maintaining industrial rigidity.

## Design Laws & Heuristics
1. **Pedagogical Friction**: High-impact actions (like `FORGE_ALL`) must include intentional UX friction (Confirmation Modals) to ensure user understanding.
2. **Terminal First**: All labels use `JetBrains Mono` and `uppercase` micro-caps to maintain the CLI/Terminal aesthetic.
3. **High Contrast**: Minimum 4.5:1 ratio enforced across all surfaces.

## Prohibited Patterns (Anti-AI Slop)
- **NO Purple-to-Blue Gradients**: Use solid neons or strict opacity ramps.
- **NO Soft Cards**: All borders are sharp (2px or hairline), with no rounded corners exceeding 2px.
- **NO Generic Icons**: Use `lucide-react` but always wrapped in technical backgrounds (`rf-card-forest`).
