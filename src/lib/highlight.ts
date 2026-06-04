import { getHighlighter, type BundledLanguage } from 'shiki';
import { CODE_LANGUAGES } from './constants';

let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null;

/**
 * Returns a singleton Shiki highlighter instance.
 * Loads all supported languages on first call.
 */
async function getHighlighterInstance() {
  if (!highlighter) {
    highlighter = await getHighlighter({
      themes: ['github-dark-default'],
      langs: [...CODE_LANGUAGES],
    });
  }
  return highlighter;
}

/**
 * Highlights code and returns the result as an HTML string.
 *
 * @param code - The source code to highlight
 * @param language - The language identifier
 * @returns HTML string with syntax highlighting
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  const h = await getHighlighterInstance();

  const validLang = (CODE_LANGUAGES as readonly string[]).includes(language)
    ? (language as BundledLanguage)
    : 'javascript';

  const highlighted = h.codeToHtml(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return highlighted;
}

/**
 * Highlights code and returns structured token data.
 *
 * @param code - The source code to highlight
 * @param language - The language identifier
 * @returns Token data with color and content information
 */
export async function highlightCodeToTokens(code: string, language: string) {
  const h = await getHighlighterInstance();

  const validLang = (CODE_LANGUAGES as readonly string[]).includes(language)
    ? (language as BundledLanguage)
    : 'javascript';

  const tokens = h.codeToTokens(code, {
    lang: validLang,
    theme: 'github-dark-default',
  });

  return tokens;
}
