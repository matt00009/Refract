import { getHighlighter, type BundledLanguage } from 'shiki';

const SUPPORTED_LANGS = ['javascript', 'typescript', 'python', 'go', 'rust', 'php', 'java', 'html', 'css', 'json', 'sql'] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number];

let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null;

async function getHighlighterInstance() {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: ['github-dark-default'],
      langs: [...SUPPORTED_LANGS],
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, language: string): Promise<string> {
  const h = await getHighlighterInstance();

  const validLang = SUPPORTED_LANGS.includes(language as SupportedLang)
    ? (language as BundledLanguage)
    : 'javascript';

  const highlighted = h.codeToHtml(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return highlighted;
}

export async function highlightCodeToTokens(code: string, language: string) {
  const h = await getHighlighterInstance();

  const validLang = SUPPORTED_LANGS.includes(language as SupportedLang)
    ? (language as BundledLanguage)
    : 'javascript';

  const tokens = h.codeToTokens(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return tokens;
}
