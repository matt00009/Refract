export function detectLanguage(code: string): string {
  if (!code.trim()) return 'auto';

  const scores: Record<string, number> = {
    typescript: 0,
    javascript: 0,
    python: 0,
    go: 0,
    rust: 0,
    php: 0,
    java: 0,
    html: 0,
    css: 0,
    json: 0,
    sql: 0,
  };

  const sample = code.slice(0, 2000); // Sample for heavy regex

  // 1. TypeScript specific
  if (/\b(interface|type|namespace|module|declare|readonly|private|public|protected|implements|abstract)\s+\w+/.test(sample)) scores.typescript += 3;
  if (/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null|Record<|Array<)\b/.test(sample)) scores.typescript += 5;
  if (/as\s+(const|string|number|boolean|any)\b/.test(sample)) scores.typescript += 4;
  if (/\b(enum)\s+\w+/.test(sample)) scores.typescript += 2;

  // 2. JavaScript specific
  if (/\bimport\s+/.test(sample)) scores.javascript += 1;
  if (/\brequire\s*\(/.test(sample)) scores.javascript += 2;
  if (/\b(const|let|var)\s+\w+/.test(sample)) scores.javascript += 1;
  if (/\b(async|await)\b/.test(sample)) scores.javascript += 1;
  if (/\b(console\.log|process\.env)\b/.test(sample)) scores.javascript += 1;

  // 3. Python
  if (/^(import|from)\s+\w+/.test(sample)) scores.python += 2;
  if (/\bdef\s+\w+\s*\(/.test(sample)) scores.python += 3;
  if (/\belif\s+/.test(sample)) scores.python += 4;
  if (/\bif\s+__name__\s*==\s*['"]__main__['"]:/.test(sample)) scores.python += 10;
  if (/^\s{4}(def|class|if|for|while|import)/m.test(sample)) scores.python += 5;
  if (/\bprint\(/.test(sample)) scores.python += 1;

  // 4. Go
  if (/\bpackage\s+\w+/.test(sample)) scores.go += 10;
  if (/\bfunc\s+\(/.test(sample)) scores.go += 5;
  if (/\bfunc\s+\w+\s*\(/.test(sample)) scores.go += 2;
  if (/\bdefer\s+/.test(sample)) scores.go += 5;
  if (/\ngo\s+\w+/.test(sample)) scores.go += 3;

  // 5. Rust
  if (/\bfn\s+\w+\s*\(/.test(sample)) scores.rust += 5;
  if (/\blet\s+mut\s+\w+/.test(sample)) scores.rust += 10;
  if (/\bimpl\s+\w+/.test(sample)) scores.rust += 8;
  if (/\bmatch\s+/.test(sample)) scores.rust += 3;
  if (/\bpub\s+(fn|struct|enum|trait|use)\b/.test(sample)) scores.rust += 4;
  if (/\bprintln!\(/.test(sample)) scores.rust += 5;

  // 6. PHP
  if (/^<\?php/.test(sample)) scores.php += 20;
  if (/\bfunction\s+\$\w+/.test(sample)) scores.php += 10;
  if (/\$(this|request|server|session|env)\b/.test(sample)) scores.php += 5;

  // 7. Java
  if (/\bpublic\s+(class|interface|void|static)\b/.test(sample)) scores.java += 2;
  if (/\bimport\s+java\./.test(sample)) scores.java += 5;
  if (/@(Override|Component|Service|RestController|Autowired)/.test(sample)) scores.java += 10;
  if (/\bSystem\.out\.println\(/.test(sample)) scores.java += 5;

  // 8. HTML
  if (/<(html|head|body|div|p|span|a|section|article|nav|main|footer|header|input|button|form)\b/i.test(sample)) scores.html += 3;
  if (/(<!DOCTYPE|<meta|<title>)/i.test(sample)) scores.html += 10;
  if (/\b(style|class|id|href|src)\s*=\s*['"]/.test(sample)) scores.html += 2;

  // 9. CSS
  if (/^[\w-]+\s*\{/m.test(sample)) scores.css += 2;
  if (/\b(background-color|margin|padding|display|flex|justify-content|align-items|color|font-size|border)\s*:/i.test(sample)) scores.css += 5;
  if (/@(media|keyframes|import)\b/.test(sample)) scores.css += 10;

  // 10. JSON
  const trimmed = code.trim();
  if (/^[\[\{]/.test(trimmed) && /[\]\}]$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      scores.json += 20;
    } catch {
      if (/["']\w+["']\s*:\s*["'\d\[\{]/.test(sample)) scores.json += 10;
    }
  }

  // 11. SQL
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|GROUP BY|ORDER BY|LIMIT|OFFSET|VALUES|INTO|SET|TABLE)\b/i.test(sample)) {
    scores.sql += 5;
  }

  // Find language with highest score
  let maxScore = -1;
  let detected = 'javascript';

  // Tie-breaker: TypeScript wins over JavaScript if both have scores
  if (scores.typescript > 0) {
    scores.javascript = Math.max(0, scores.javascript - scores.typescript);
  }

  for (const lang in scores) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      detected = lang;
    }
  }

  // Final sanity check: if score is too low, default to JS or most likely
  return maxScore > 0 ? detected : 'javascript';
}
