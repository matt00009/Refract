# Mathematical & Logic Refinements

## Language Detection Heuristics
- **Algorithm**: Weight-based scoring system.
- **Tuning**: 
    - TypeScript (+5 for type annotations, +3 for interfaces).
    - Python (+10 for `if __name__ == "__main__"`).
    - JSON (+20 for successful `JSON.parse` check).
- **Tie-breaking**: TypeScript score is subtracted from JavaScript score to prioritize strict types over generic JS.

## Circle Geometry (ScoreRing)
- **Normalization**: Clamping input `score` to $[0, 100]$.
- **Calculations**:
    - $Radius (r) = 45$
    - $Circumference (C) = 2\pi r \approx 282.7$
    - $Offset = C - (\frac{score}{100} \times C)$
- **Performance**: Memoized to prevent re-calculating geometry on every editor keystroke.

## Relative Time Logic (History)
- **Precision**: Handles unit transitions (s -> m -> h -> d -> w) based on total elapsed seconds.
- **Thresholds**: 
    - < 30s: "just now"
    - < 60s: "{s}s ago"
    - < 60m: "{m}m ago"
    - ... and so on.
