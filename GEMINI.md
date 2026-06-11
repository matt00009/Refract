# Refract Project Instructions

## Available Skills
The following skills have been integrated into the project and can be activated via `activate_skill` by providing their relative path from `.gemini/skills/` (if the system supports it) or by manually reading their `SKILL.md`.

- **Impeccable Design**: Located at `.gemini/skills/impeccable/SKILL.md`. Focuses on production-grade frontend design, avoiding "AI slop".
- **Brutalist Design**: Located at `.gemini/skills/brutalist/SKILL.md`. Aligns with the project's "UI Brutaliste" aesthetic.
- **Frontend Design**: Located at `.gemini/skills/frontend-design/SKILL.md`. General high-quality frontend patterns.
- **UI/UX Pro Max**: Located at `.gemini/skills/ui-ux-pro-max/SKILL.md`. Advanced UI/UX principles.
- **Impeccable Polish**: Located at `.gemini/skills/impeccable-polish/SKILL.md`. Refinement and polish commands.

## Design Workflow
1. **Initialize Context**: Use `/impeccable init` (via the impeccable skill) to define brand personality and audience.
2. **Apply Taste**: Use the `brutalist` or `impeccable` skills to steer the generation of UI components.
3. **Audit & Polish**: Use `/audit` and `/polish` commands to refine the output.

## Technical Baseline
- **IA Core**: Vercel AI SDK.
- **Validation**: Zod.
- **Security**: AES-GCM (Zero-Knowledge).
- **Highlighter**: Shiki (Lazy).
