import { CODE_LANGUAGES } from './constants';

export interface DetectionResult {
  lang: string;
  confidence: number;
  scores: Record<string, number>;
}

/**
 * Advanced weighted scoring algorithm for language detection.
 * Inspired by IDE-grade detection pipelines (VS Code, Linguist, Pygments).
 * Uses a multi-layered approach: Metadata (Shebangs) -> Smoking Guns -> Structural Patterns.
 */
export function detectLanguage(code: string): DetectionResult {
  if (!code.trim()) return { lang: 'auto', confidence: 0, scores: {} };

  const scores: Record<string, number> = Object.fromEntries(
    CODE_LANGUAGES.map((lang) => [lang, 0])
  );

  const sample = code.slice(0, 5000); // Larger sample for better detection
  const lines = sample.split('\n');
  const firstLine = lines[0]?.trim() || '';

  // ── LAYER 1: METADATA (Shebangs & Declarations) ──────────────────────────
  // These are "Perfect Matches" with extreme weights
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) scores.python += 1000;
    if (firstLine.includes('node') || firstLine.includes('js')) scores.javascript += 1000;
    if (firstLine.includes('php')) scores.php += 1000;
  }
  if (firstLine.toLowerCase().includes('<!doctype html>')) scores.html += 1000;
  if (firstLine.startsWith('<?xml')) scores.html += 200; // XML is close to HTML

  // ── LAYER 2: SMOKING GUNS (Unique syntax markers) ───────────────────────
  // Points assigned for patterns that ALMOST EXCLUSIVELY exist in one language
  
  // Python: Colons at end of lines + def/class
  if (/^\s*def\s+\w+\s*\(.*\):/m.test(sample)) scores.python += 500;
  if (/^\s*class\s+\w+(\(.*\))?:/m.test(sample)) scores.python += 400;
  if (/^\s*elif\s+.*:/m.test(sample)) scores.python += 400;
  if (/\bif\s+__name__\s*==\s*['"]__main__['"]:/.test(sample)) scores.python += 800;
  
  // Go: Short assignment and package
  if (/\b\w+\s*:=\s*/.test(sample)) scores.go += 500;
  if (/^package\s+\w+/m.test(sample)) scores.go += 600;
  
  // PHP: Open tag
  if (/<\?php/.test(sample)) scores.php += 1000;
  
  // Rust: fn and let mut
  if (/\bfn\s+\w+\s*\(/.test(sample)) scores.rust += 500;
  if (/\blet\s+mut\s+\w+/.test(sample)) scores.rust += 600;
  if (/\bimpl\s+\w+\s*\{/.test(sample)) scores.rust += 400;
  
  // SQL: Distinct keywords
  if (/\b(CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE)\b/i.test(sample)) scores.sql += 800;

  // JSON: Strict braces
  const trimmed = code.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      scores.json += 1000;
    } catch { /* not valid JSON, keep going */ }
  }

  // ── LAYER 3: STRUCTURAL PATTERNS & IMPORTS ──────────────────────────────
  
  // TypeScript (Interfaces, types, colon typing)
  if (/\b(interface|type|namespace|declare|readonly|implements)\b/.test(sample)) scores.typescript += 200;
  if (/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null|Record<|Array<)\b/.test(sample)) scores.typescript += 300;
  if (/<[A-Z]\w*(,\s*[A-Z]\w*)*>/.test(sample)) scores.typescript += 150; // Generics

  // JS/TS common
  if (/\b(const|let|var)\s+\w+\s*=\s*/.test(sample)) {
    scores.javascript += 50;
    scores.typescript += 50;
  }
  if (/\b(async|await)\b/.test(sample)) {
    scores.javascript += 40;
    scores.typescript += 40;
  }
  if (/\bconsole\.(log|error|warn)\(/.test(sample)) {
    scores.javascript += 60;
    scores.typescript += 60;
  }

  // Python: structural indicators
  if (/^\s*import\s+\w+/m.test(sample)) scores.python += 100;
  if (/^\s*from\s+\w+\s+import/m.test(sample)) scores.python += 150;
  if (/^\s+#.*/m.test(sample)) scores.python += 30; // Hash comments
  
  // Go: func receiver
  if (/\bfunc\s+\(\w+\s+\*?\w+\)\s+\w+/.test(sample)) scores.go += 400;

  // HTML/CSS
  if (/<[a-z1-6]+(\s+[^>]+)?>/i.test(sample)) scores.html += 100;
  if (/[a-z-]+\s*:\s*[^;]+;/.test(sample)) scores.css += 50;

  // SQL
  if (/\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|UPDATE|DELETE|VALUES)\b/i.test(sample)) {
    scores.sql += 100;
  }

  // ── LAYER 4: TIE-BREAKING & REFINEMENT ──────────────────────────────
  
  // TS usually implies JS syntax, but TS is more specific
  if (scores.typescript > 50) {
    scores.javascript = Math.max(0, scores.javascript - (scores.typescript / 2));
  }

  // Java vs C++ vs others (basic)
  if (/\bpublic\s+static\s+void\s+main\b/.test(sample)) scores.java += 800;

  let maxScore = -1;
  let detected = 'javascript';

  for (const lang in scores) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      detected = lang;
    }
  }

  // Fallback: If no distinct patterns found, default to JS
  if (maxScore <= 0) detected = 'javascript';

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0;

  return {
    lang: detected,
    confidence,
    scores
  };
}
