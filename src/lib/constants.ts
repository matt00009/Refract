export const LANGUAGES = [
  'auto',
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'php',
  'java',
  'html',
  'css',
  'json',
  'sql',
];

import type { Provider } from '../types/analysis';

export const PROVIDERS: { value: Provider; label: string; icon: string; model: string }[] = [
  { value: 'auto', label: 'Auto', icon: '🧠', model: '' },
  { value: 'anthropic', label: 'Claude', icon: '🪶', model: 'claude-sonnet-4-20250514' },
  { value: 'gemini', label: 'Gemini', icon: '♊', model: 'gemini-2.5-pro' },
  { value: 'mistral', label: 'Mistral', icon: '🌪️', model: 'codestral-latest' },
  { value: 'groq', label: 'Groq', icon: '⚡', model: 'llama-3.3-70b-versatile' },
  { value: 'deepseek', label: 'DeepSeek', icon: '🐳', model: 'deepseek-chat' },
];

export const PROVIDER_LABELS: Record<string, string> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.label }),
  {} as Record<string, string>
);

export const PROVIDER_ICONS: Record<string, string> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.icon }),
  {} as Record<string, string>
);
