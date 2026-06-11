import { SparklesIcon, AnthropicIcon, GeminiIcon, MistralIcon, GroqIcon, DeepSeekIcon } from './icons';
import type { Provider } from '../types/analysis';

/** All supported programming languages including 'auto' for detection. */
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
] as const;

/** Supported languages excluding 'auto' — for syntax highlighting and detection. */
export const CODE_LANGUAGES = LANGUAGES.filter((l): l is Exclude<typeof l, 'auto'> => l !== 'auto');

/** 
 * Provider configuration entries with display metadata.
 * Models are 'SOTA-first' (targeting latest 2025/2026 frontier models).
 */
export const PROVIDERS: { value: Provider; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; model: string }[] = [
  { value: 'auto', label: 'Intelligent', icon: SparklesIcon, model: '' },
  { value: 'anthropic', label: 'Claude 3.5', icon: AnthropicIcon, model: 'claude-3-5-sonnet-20241022' },
  { value: 'gemini', label: 'Gemini 2.0 Flash', icon: GeminiIcon, model: 'gemini-2.0-flash' },
  { value: 'mistral', label: 'Codestral', icon: MistralIcon, model: 'codestral-latest' },
  { value: 'groq', label: 'Llama 3.3', icon: GroqIcon, model: 'llama-3.3-70b-versatile' },
  { value: 'deepseek', label: 'DeepSeek Chat', icon: DeepSeekIcon, model: 'deepseek-chat' },
];

/** Lookup map from provider value to display label. */
export const PROVIDER_LABELS: Record<string, string> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.label }),
  {} as Record<string, string>
);

/** Lookup map from provider value to icon component. */
export const PROVIDER_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.icon }),
  {} as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>
);
