import type { AnalysisResult } from '../types/analysis';
import { analysisResultSchema } from './schemas';

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
  const savedKeys = localStorage.getItem('rf_api_keys');
  if (savedKeys) {
    try {
      const keys = JSON.parse(savedKeys) as Record<string, string>;
      if (provider === 'auto') {
        // In auto mode, send the entire keys object so the server can route intelligently
        headers['X-Provider-Keys'] = savedKeys;
      } else if (keys[provider]) {
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

  const data = await response.json();

  // Validate the response using Zod schema to guarantee type safety
  try {
    const parsedData = analysisResultSchema.parse(data);
    // Add latency and routed info which the server attaches outside the LLM payload
    return { 
      ...parsedData, 
      latency: data.latency,
      routed: data.routed 
    } as AnalysisResult;
  } catch (error) {
    console.error('Client-side validation failed:', error);
    throw new Error('Received malformed data from the server.');
  }
}
