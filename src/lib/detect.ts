import { CODE_LANGUAGES } from './constants';

export interface DetectionResult {
  lang: string;
  confidence: number;
  scores: Record<string, number>;
}

/**
 * Advanced weighted scoring algorithm for language detection.
 * Factors in syntax markers, boilerplate density, and type-safety indicators.
 */
export function detectLanguage(code: string): DetectionResult {
  if (!code.trim()) return { lang: 'auto', confidence: 0, scores: {} };

  const scores: Record<string, number> = Object.fromEntries(
    CODE_LANGUAGES.map((lang) => [lang, 0])
  );

  const sample = code.slice(0, 2000);

  // 1. TypeScript specific (+Weight for strict typing)
  if (/\b(interface|type|namespace|module|declare|readonly|private|public|protected|implements|abstract)\s+\w+/.test(sample)) scores.typescript += 30;
  if (/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null|Record<|Array<)\b/.test(sample)) scores.typescript += 50;
  if (/as\s+(const|string|number|boolean|any)\b/.test(sample)) scores.typescript += 40;
  if (/\b(enum)\s+\w+/.test(sample)) scores.typescript += 20;

  // 2. JavaScript
  if (/\bimport\s+/.test(sample)) scores.javascript += 10;
  if (/\brequire\s*\(/.test(sample)) scores.javascript += 20;
  if (/\b(const|let|var)\s+\w+/.test(sample)) scores.javascript += 5;
  if (/\b(async|await)\b/.test(sample)) scores.javascript += 10;

  // 3. Python (+Weight for structural indent)
  if (/^(import|from)\s+\w+/.test(sample)) scores.python += 20;
  if (/\bdef\s+\w+\s*\(/.test(sample)) scores.python += 30;
  if (/\belif\s+/.test(sample)) scores.python += 40;
  if (/\bif\s+__name__\s*==\s*['"]__main__['"]:/.test(sample)) scores.python += 100;
  if (/^\s{4}(def|class|if|for|while|import)/m.test(sample)) scores.python += 50;

  // 4. Go
  if (/\bpackage\s+\w+/.test(sample)) scores.go += 100;
  if (/\bfunc\s+\(/.test(sample)) scores.go += 50;
  if (/\bdefer\s+/.test(sample)) scores.go += 50;

  // 5. Rust
  if (/\bfn\s+\w+\s*\(/.test(sample)) scores.rust += 50;
  if (/\blet\s+mut\s+\w+/.test(sample)) scores.rust += 100;
  if (/\bimpl\s+\w+/.test(sample)) scores.rust += 80;
  if (/\bprintln!\(/.test(sample)) scores.rust += 50;

  // 6. PHP
  if (/^<\?php/.test(sample)) scores.php += 200;
  if (/\$(this|request|server|session|env)\b/.test(sample)) scores.php += 50;

  // 7. Java
  if (/\bpublic\s+(class|interface|void|static)\b/.test(sample)) scores.java += 20;
  if (/@(Override|Component|Service|RestController|Autowired)/.test(sample)) scores.java += 100;

  // 8. HTML
  if (/(<!DOCTYPE|<meta|<title>)/i.test(sample)) scores.html += 100;
  if (/<(html|head|body|div|p|span|a|section|article|nav|main|footer|header|input|button|form)\b/i.test(sample)) scores.html += 30;

  // 9. CSS
  if (/@(media|keyframes|import)\b/.test(sample)) scores.css += 100;
  if (/\b(background-color|margin|padding|display|flex|justify-content|align-items|color|font-size|border)\s*:/i.test(sample)) scores.css += 50;

  // 10. JSON
  const trimmed = code.trim();
  if (/^[[{]/.test(trimmed) && /[\]}]$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      scores.json += 200;
    } catch {
      if (/["']\w+["']\s*:\s*["'\d[{]/.test(sample)) scores.json += 100;
    }
  }

  // 11. SQL
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|GROUP BY|ORDER BY|LIMIT|OFFSET|VALUES|INTO|SET|TABLE)\b/i.test(sample)) {
    scores.sql += 50;
  }

  // Tie-breaker: TypeScript wins over JavaScript
  if (scores.typescript > 0) {
    scores.javascript = Math.max(0, scores.javascript - scores.typescript);
  }

  let maxScore = -1;
  let detected = 'javascript';

  for (const lang in scores) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      detected = lang;
    }
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0;

  return {
    lang: maxScore > 0 ? detected : 'javascript',
    confidence,
    scores
  };
}
