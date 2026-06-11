---
target: Refract Application
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-06-11T11-23-29Z
slug: refract-application
---
#### Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Solid progress indicators |
| 2 | Match System / Real World | 4 | Excellent terminal metaphor |
| 3 | User Control and Freedom | 3 | Clear history management |
| 4 | Consistency and Standards | 4 | High system cohesion |
| 5 | Error Prevention | 2 | Key validation is shallow |
| 6 | Recognition Rather Than Recall | 3 | History helps, but some actions hidden |
| 7 | Flexibility and Efficiency | 2 | Limited keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Intentional loudness, minor clutter |
| 9 | Error Recovery | 3 | Standard error messages |
| 10 | Help and Documentation | 1 | No deep contextual help |
| **Total** | | **26/40** | **Acceptable** |

#### Anti-Patterns Verdict
**LLM assessment**: The interface successfully avoids most SaaS-cream tropes, but falls into the 'side-tab accent' trap in IssueCard. The brutalist execution is strong but needs more 'mechanical' details to feel truly industrial rather than just 'dark mode'.

**Deterministic scan**: Found 1 finding.
- src/components/results/IssueCard.tsx: Side-tab accent border (line 88). This is a primary AI tell.

#### Overall Impression
Refract has a strong, confident identity that matches its target audience perfectly. It feels like a tool for pros. However, the 'side-tab' card design and some information density issues in the results panel prevent it from reaching 'industrial grade' perfection.

#### What's Working
1. **Themed Telemetry**: The micro-typography and tactical accents (Volt green) create a high-stakes, professional atmosphere.
2. **Terminal First**: The layout successfully avoids standard dashboard 'softness', projecting rigid functionality.

#### Priority Issues
1. **[P1] Side-tab Slop**: The border-l-2 in IssueCard is a classic AI-generated pattern.
   - **Why it matters**: It breaks the 'Industrial' immersion by using a lazy, decorative accent.
   - **Fix**: Replace with a full status block or a double-border system.
   - **Suggested command**: /impeccable polish src/components/results/IssueCard.tsx

2. **[P1] Results Chunking**: The diagnostic summary and vectors are presented in long vertical lists that exceed working memory limits.
   - **Why it matters**: Cognitive load is high; users have to scroll and recall too much.
   - **Fix**: Use a more modular grid or progressive disclosure for issues.
   - **Suggested command**: /impeccable layout src/components/results/Results.tsx

3. **[P2] Keyboard Mastery**: Missing shortcuts for 'Clear History', 'Open Stats', etc.
   - **Why it matters**: Senior devs (the target) live on the keyboard.
   - **Fix**: Implement a global command palette or standard shortcuts.
   - **Suggested command**: /impeccable polish src/App.tsx

#### Persona Red Flags
**Alex (Power User)**: Only one shortcut (Cmd+Enter) works. Can't jump between issues or toggle history without leaving the keyboard. Will feel slowed down by the mouse-heavy navigation.

**Jordan (First-Timer)**: The 'Forge_Control' and 'System_Config' labels are highly stylized. While 'cool', they might be ambiguous for 2 seconds. No visible documentation for the scoring logic.

#### Minor Observations
- The Shiki highlighter is lazy-loaded, which is good, but the initial flash of plain text can be jarring.
- The 'StatsForge' circuitry connectors could be more prominent.
