import { CODE_LANGUAGES } from './constants';

export interface DetectionResult {
  lang: string;
  confidence: number;
  scores: Record<string, number>;
}

type Detector = (code: string, firstLine: string) => Record<string, number>;

const layer1Metadata: Detector = (_, firstLine) => {
  const scores: Record<string, number> = {};
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) scores.python = 1000;
    if (firstLine.includes('node') || firstLine.includes('js')) scores.javascript = 1000;
    if (firstLine.includes('php')) scores.php = 1000;
  }
  if (firstLine.toLowerCase().includes('<!doctype html>')) scores.html = 1000;
  if (firstLine.startsWith('<?xml')) scores.html = 200;
  return scores;
};

const layer2SmokingGunsPart1: Detector = (sample) => {
  const scores: Record<string, number> = {};
  if (/^\s*def\s+\w+\s*\(.*\):/m.test(sample)) scores.python = (scores.python || 0) + 500;
  if (/^\s*class\s+\w+(\(.*\))?:/m.test(sample)) scores.python = (scores.python || 0) + 400;
  if (/\bif\s+__name__\s*==\s*['"]__main__['"]:/.test(sample)) scores.python = (scores.python || 0) + 800;
  
  if (/\b\w+\s*:=\s*/.test(sample)) scores.go = (scores.go || 0) + 500;
  if (/^package\s+\w+/m.test(sample)) scores.go = (scores.go || 0) + 600;
  
  if (/<\?php/.test(sample)) scores.php = (scores.php || 0) + 1000;
  return scores;
};

const layer2SmokingGunsPart2: Detector = (sample) => {
  const scores: Record<string, number> = {};
  if (/\bfn\s+\w+\s*\(/.test(sample)) scores.rust = (scores.rust || 0) + 500;
  if (/\blet\s+mut\s+\w+/.test(sample)) scores.rust = (scores.rust || 0) + 600;
  
  if (/\b(CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE)\b/i.test(sample)) scores.sql = (scores.sql || 0) + 800;

  if (sample.trim().startsWith('{') && sample.trim().endsWith('}')) {
    try { JSON.parse(sample); scores.json = 1000; } catch { /* ignore */ }
  }
  return scores;
};

const layer3Structural: Detector = (sample) => {
  const scores: Record<string, number> = {};
  if (/\b(interface|type|namespace|declare|readonly|implements)\b/.test(sample)) scores.typescript = 200;
  if (/:\s*(string|number|boolean|any|void|never|unknown|object|undefined|null|Record<|Array<)\b/.test(sample)) scores.typescript = (scores.typescript || 0) + 300;

  const isJsTs = /\b(const|let|var)\s+\w+\s*=\s*/.test(sample);
  if (isJsTs) {
    scores.javascript = 50;
    scores.typescript = (scores.typescript || 0) + 50;
  }

  if (/<[a-z1-6]+(\s+[^>]+)?>/i.test(sample)) scores.html = (scores.html || 0) + 100;
  if (/[a-z-]+\s*:\s*[^;]+;/.test(sample)) scores.css = 50;
  
  if (/\b(SELECT|FROM|WHERE|JOIN)\b/i.test(sample)) scores.sql = (scores.sql || 0) + 100;
  if (/\bpublic\s+static\s+void\s+main\b/.test(sample)) scores.java = 800;

  return scores;
};

export function detectLanguage(code: string): DetectionResult {
  if (!code.trim()) return { lang: 'auto', confidence: 0, scores: {} };

  const scores: Record<string, number> = Object.fromEntries(CODE_LANGUAGES.map(l => [l, 0]));
  const sample = code.slice(0, 5000);
  const firstLine = sample.split('\n')[0]?.trim() || '';

  const detectors = [layer1Metadata, layer2SmokingGunsPart1, layer2SmokingGunsPart2, layer3Structural];
  detectors.forEach(d => {
    const results = d(sample, firstLine);
    Object.entries(results).forEach(([lang, score]) => {
      if (scores[lang] !== undefined) scores[lang] += score;
    });
  });

  if (scores.typescript > 50) {
    scores.javascript = Math.max(0, scores.javascript - (scores.typescript / 2));
  }

  let maxScore = -1;
  let detected = 'javascript';
  Object.entries(scores).forEach(([lang, score]) => {
    if (score > maxScore) { maxScore = score; detected = lang; }
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    lang: maxScore <= 0 ? 'javascript' : detected,
    confidence: totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0,
    scores
  };
}
