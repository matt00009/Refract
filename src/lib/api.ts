import type { AnalysisResult } from '../types/analysis';

export async function analyzeCode(code: string, language: string): Promise<AnalysisResult> {
  const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analyze`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Parse error: ${data.error}`);
    }

    return data as AnalysisResult;
  } catch (error) {
    console.error('Analysis request failed:', error);
    throw error;
  }
}
