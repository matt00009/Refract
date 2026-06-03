import { getHighlighter, type BundledLanguage } from 'shiki';

let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null;

async function getHighlighterInstance() {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: ['github-dark-default'],
      langs: ['javascript', 'typescript', 'python', 'go', 'rust', 'php', 'java', 'html', 'css', 'json', 'sql'],
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, language: string): Promise<string> {
  const h = await getHighlighterInstance();

  const validLang = ['javascript', 'typescript', 'python', 'go', 'rust', 'php', 'java', 'html', 'css', 'json', 'sql'].includes(language)
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

  const validLang = ['javascript', 'typescript', 'python', 'go', 'rust', 'php', 'java', 'html', 'css', 'json', 'sql'].includes(language)
    ? (language as BundledLanguage)
    : 'javascript';

  const tokens = h.codeToTokens(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return tokens;
}
