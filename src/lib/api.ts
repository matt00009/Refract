import type { AnalysisResult } from '../types/analysis';

/**
 * Validates that a response object conforms to the AnalysisResult shape.
 * Throws if the response is malformed.
 */
function validateAnalysisResponse(data: unknown): AnalysisResult {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid response: not an object');
  }

  const obj = data as Record<string, unknown>;
  if (typeof obj.score !== 'number' || typeof obj.summary !== 'string') {
    throw new Error('Invalid response: missing score or summary');
  }

  if (!Array.isArray(obj.issues) || !Array.isArray(obj.strengths)) {
    throw new Error('Invalid response: missing issues or strengths');
  }

  return data as AnalysisResult;
}

/**
 * Sends code to the backend proxy for AI-powered analysis.
 * Reads locally stored API keys and forwards them via the `X-Provider-Key` header.
 *
 * @param code - The source code to analyze
 * @param language - The detected or selected programming language
 * @param provider - The AI provider to use (or 'auto')
 * @param model - Optional specific model override
 * @returns The validated analysis result
 * @throws Error if the request fails or the response is malformed
 */
export async function analyzeCode(
  code: string,
  language: string,
  provider: string,
  model?: string
): Promise<AnalysisResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Read locally stored API keys (stored in localStorage for BYOK support).
  // Note: localStorage is accessible via XSS — this is an accepted trade-off for BYOK.
  const savedKeys = localStorage.getItem('rf_api_keys');
  if (savedKeys) {
    try {
      const keys = JSON.parse(savedKeys) as Record<string, string>;
      if (keys[provider]) {
        headers['X-Provider-Key'] = keys[provider];
      }
    } catch {
      // Ignore malformed stored keys
    }
  }

  // Get advanced settings from localStorage
  const temperature = parseFloat(localStorage.getItem('rf_temperature') || '0.1');
  const max_tokens = parseInt(localStorage.getItem('rf_max_tokens') || '2000');

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, language, provider, model, temperature, max_tokens }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (typeof data === 'object' && data !== null && 'error' in data) {
    throw new Error((data as { error: string }).error);
  }

  return validateAnalysisResponse(data);
}
