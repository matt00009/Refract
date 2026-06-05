import { SparklesIcon, AnthropicIcon, GeminiIcon, MistralIcon, GroqIcon, DeepSeekIcon } from '../components/icons/ProviderIcons';
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

/** Provider configuration entries with display metadata. */
export const PROVIDERS: { value: Provider; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; model: string }[] = [
  { value: 'auto', label: 'Auto', icon: SparklesIcon, model: '' },
  { value: 'anthropic', label: 'Claude', icon: AnthropicIcon, model: 'claude-3-5-sonnet-20240620' },
  { value: 'gemini', label: 'Gemini', icon: GeminiIcon, model: 'gemini-1.5-pro' },
  { value: 'mistral', label: 'Mistral', icon: MistralIcon, model: 'codestral-latest' },
  { value: 'groq', label: 'Groq', icon: GroqIcon, model: 'llama-3.3-70b-versatile' },
  { value: 'deepseek', label: 'DeepSeek', icon: DeepSeekIcon, model: 'deepseek-chat' },
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

