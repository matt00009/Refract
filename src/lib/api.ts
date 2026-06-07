import type { AnalysisResult } from '../types/analysis';
import { analysisResultSchema } from './schemas';
import { decryptVault } from './crypto';
import { loadSettings } from './settings';

/**
 * Sends code to the backend proxy for AI-powered analysis.
 * Implements Zero-Knowledge decryption: keys are decrypted in-memory using the vault session key.
 *
 * @param code - The source code to analyze
 * @param language - The detected or selected programming language
 * @param provider - The AI provider to use (or 'auto')
 * @param model - Optional specific model override
 * @returns The validated analysis result
 * @throws Error if the vault is locked, request fails, or response is malformed
 */
export async function analyzeCode(
  code: string,
  language: string,
  provider: string,
  model?: string
): Promise<AnalysisResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attempt to retrieve and decrypt keys from the Zero-Knowledge vault
  const encryptedKeys = localStorage.getItem('rf_api_keys_encrypted');
  const vaultSessionKey = sessionStorage.getItem('rf_vault_session_key');

  if (encryptedKeys) {
    if (!vaultSessionKey) {
      throw new Error('Terminal Vault is locked. Please open Settings (Ctrl+,) and enter your password.');
    }

    try {
      const decrypted = await decryptVault(encryptedKeys, vaultSessionKey);
      const keys = JSON.parse(decrypted) as Record<string, string>;
      
      if (provider === 'auto') {
        headers['X-Provider-Keys'] = decrypted;
      } else if (keys[provider]) {
        headers['X-Provider-Key'] = keys[provider];
      }
    } catch {
      throw new Error('Vault decryption failed. Your session may have expired or the password is incorrect.');
    }
  }

  // Get advanced settings using the validated loader
  const settings = loadSettings();

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      code, 
      language, 
      provider, 
      model, 
      temperature: settings.temperature, 
      max_tokens: settings.maxTokens 
    }),
  });


  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json() as unknown;

  // Validate the response using Zod schema to guarantee type safety
  try {
    return analysisResultSchema.parse(data);
  } catch (error) {
    console.error('Client-side validation failed:', error);
    throw new Error('Received malformed data from the server.');
  }
}
