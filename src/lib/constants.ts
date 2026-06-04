import { SparklesIcon, AnthropicIcon, GeminiIcon, MistralIcon, GroqIcon, DeepSeekIcon } from '../components/icons/ProviderIcons';
import type { Provider } from '../types/analysis';

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

export const PROVIDERS: { value: Provider; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; model: string }[] = [
  { value: 'auto', label: 'Auto', icon: SparklesIcon, model: '' },
  { value: 'anthropic', label: 'Claude', icon: AnthropicIcon, model: 'claude-sonnet-4-20250514' },
  { value: 'gemini', label: 'Gemini', icon: GeminiIcon, model: 'gemini-2.5-pro' },
  { value: 'mistral', label: 'Mistral', icon: MistralIcon, model: 'codestral-latest' },
  { value: 'groq', label: 'Groq', icon: GroqIcon, model: 'llama-3.3-70b-versatile' },
  { value: 'deepseek', label: 'DeepSeek', icon: DeepSeekIcon, model: 'deepseek-chat' },
];

export const PROVIDER_LABELS: Record<string, string> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.label }),
  {} as Record<string, string>
);

export const PROVIDER_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = PROVIDERS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.icon }),
  {} as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>
);
