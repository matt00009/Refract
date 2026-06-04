import type { AnalysisResult } from '../types/analysis';

export async function analyzeCode(
  code: string,
  language: string,
  provider: string,
  model?: string
): Promise<AnalysisResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Get local key if it exists
  const savedKeys = localStorage.getItem('rf_api_keys');
  if (savedKeys) {
    try {
      const keys = JSON.parse(savedKeys);
      if (keys[provider]) {
        headers['X-Provider-Key'] = keys[provider];
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, language, provider, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);

  return data as AnalysisResult;
}

