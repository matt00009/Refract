import { getHighlighter, type BundledLanguage } from 'shiki';
import { CODE_LANGUAGES } from './constants';

let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null;

/**
 * Returns a singleton Shiki highlighter instance.
 * Optimized for performance: initializes with NO languages loaded.
 */
async function getHighlighterInstance() {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: ['github-dark-default'],
      langs: [], // Zero languages on initial load
    });
  }
  return highlighter;
}

/**
 * Ensures a specific language grammar is loaded on demand.
 */
async function ensureLanguageLoaded(lang: string) {
  if (!highlighter) return;
  const validLang = (CODE_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as BundledLanguage)
    : 'javascript';

  if (!highlighter.getLoadedLanguages().includes(validLang)) {
    // Dynamic import of the grammar only when needed
    await highlighter.loadLanguage(validLang);
  }
  return validLang;
}

/**
 * Highlights code and returns the result as an HTML string.
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  const h = await getHighlighterInstance();
  const validLang = await ensureLanguageLoaded(language) || 'javascript';

  const highlighted = h.codeToHtml(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return highlighted;
}

/**
 * Highlights code and returns structured token data.
 */
export async function highlightCodeToTokens(code: string, language: string) {
  const h = await getHighlighterInstance();
  const validLang = await ensureLanguageLoaded(language) || 'javascript';

  const tokens = h.codeToTokens(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return tokens;
}
