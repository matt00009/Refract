import { getHighlighter, type BundledLanguage, type Highlighter } from 'shiki';
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import { CODE_LANGUAGES } from './constants';

let highlighter: Highlighter | null = null;

/**
 * Returns a singleton Shiki highlighter instance.
 * Optimized for performance: initializes with NO languages loaded.
 */
async function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: ['github-dark-default'],
      langs: [],
    });
  }
  return highlighter;
}

/**
 * Ensures a specific language grammar is loaded on demand.
 */
async function ensureLanguageLoaded(lang: string) {
  const h = await getHighlighterInstance();
  const validLang = (CODE_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as BundledLanguage)
    : 'javascript';

  if (!h.getLoadedLanguages().includes(validLang)) {
    try {
      await h.loadLanguage(validLang);
    } catch (err) {
      console.warn(`Shiki: Failed to load language '${validLang}'`, err);
      return undefined;
    }
  }
  return validLang;
}

/**
 * Highlights code and returns the result as an HTML string.
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  const h = await getHighlighterInstance();
  const validLang = await ensureLanguageLoaded(language) || 'javascript';

  return h.codeToHtml(code, {
    lang: validLang,
    theme: 'github-dark-default',
    transformers: [
      /* eslint-disable @typescript-eslint/no-explicit-any */
      transformerNotationDiff() as any,
      transformerNotationHighlight() as any,
      /* eslint-enable @typescript-eslint/no-explicit-any */
    ]
  });
}

/**
 * Highlights code and returns structured token data for custom rendering.
 */
export async function highlightCodeToTokens(code: string, language: string) {
  const h = await getHighlighterInstance();
  const validLang = await ensureLanguageLoaded(language) || 'javascript';

  return h.codeToTokens(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });
}
