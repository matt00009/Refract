export function detectLanguage(code: string): string {
  if (!code.trim()) return 'auto';

  // TypeScript patterns
  if (
    /^\s*(interface|type|namespace|module)\s+\w+/.test(code) ||
    /:\s*(string|number|boolean|any|void|never)\b/.test(code) ||
    /as\s+(const|string|number)\b/.test(code)
  ) {
    return 'typescript';
  }

  // JavaScript patterns (must be after TypeScript)
  if (
    /\bimport\s+/.test(code) ||
    /\brequire\s*\(/.test(code) ||
    /\bexport\s+(default|const|function|class)/.test(code) ||
    /\bconst\s+\w+\s*=\s*(async\s*)?\(/.test(code) ||
    /\bfunction\s+\w+\s*\(/.test(code)
  ) {
    return 'javascript';
  }

  // Python patterns
  if (/^(import|from)\s+\w+|def\s+\w+\s*\(|class\s+\w+:|if\s+__name__/.test(code) || /^\s{4}(def|class|if|for|while|import)/.test(code)) {
    return 'python';
  }

  // Go patterns
  if (/\bpackage\s+\w+|func\s+\(|func\s+\w+\s*\(|import\s*\(|defer\s+/.test(code)) {
    return 'go';
  }

  // Rust patterns
  if (/\bfn\s+\w+\s*\(|let\s+mut\s+\w+|impl\s+\w+|match\s+|fn main\s*\(/.test(code)) {
    return 'rust';
  }

  // PHP patterns
  if (/^<\?php|function\s+\$\w+|public\s+(function|class)|private\s+(function|class)/.test(code)) {
    return 'php';
  }

  // Java patterns
  if (/\bpublic\s+(class|interface|void|static)\b|import\s+java\.|@Override|new\s+\w+\s*\(/.test(code)) {
    return 'java';
  }

  // HTML patterns
  if (/<(html|head|body|div|p|span|a)\b|<!DOCTYPE|<meta|<title>/.test(code)) {
    return 'html';
  }

  // CSS patterns
  if (/^[\w-]+\s*\{|@media|@keyframes|@import/.test(code)) {
    return 'css';
  }

  // JSON patterns
  if (/^\s*[\[\{].*[\]\}]\s*$/.test(code.trim()) && /["']:\s*["'\d\[\{]/.test(code)) {
    return 'json';
  }

  // SQL patterns
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(code)) {
    return 'sql';
  }

  return 'javascript'; // Default
}
