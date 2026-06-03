import { useState } from 'react';
import { History, ChevronDown, Zap } from 'lucide-react';
import type { Provider } from '../types/analysis';

interface TopBarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  onAnalyze: () => void;
  onHistoryClick: () => void;
  isLoading: boolean;
}

const LANGUAGES = [
  { label: 'Auto', value: 'auto' },
  { label: 'JS', value: 'javascript' },
  { label: 'TS', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'PHP', value: 'php' },
  { label: 'Java', value: 'java' },
];

const PROVIDERS: { value: Provider; label: string; icon: string; model: string }[] = [
  { value: 'auto', label: 'Auto', icon: '🧠', model: '' },
  { value: 'anthropic', label: 'Claude', icon: '🪶', model: 'claude-sonnet-4-20250514' },
  { value: 'gemini', label: 'Gemini', icon: '♊', model: 'gemini-2.5-pro' },
  { value: 'mistral', label: 'Mistral', icon: '🌪️', model: 'codestral-latest' },
  { value: 'groq', label: 'Groq', icon: '⚡', model: 'llama-3.3-70b-versatile' },
  { value: 'deepseek', label: 'DeepSeek', icon: '🐳', model: 'deepseek-chat' },
];

export function TopBar({ language, onLanguageChange, provider, onProviderChange, onAnalyze, onHistoryClick, isLoading }: TopBarProps) {
  const [providerOpen, setProviderOpen] = useState(false);

  const activeProvider = PROVIDERS.find((p) => p.value === provider) || PROVIDERS[0];

  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] bg-[var(--rf-depth)] border-b border-[var(--rf-border)] flex items-center justify-between px-4 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <img
          src="/Minimalist_tech_logo_mark_refract_202606032156.jpeg"
          alt="refract"
          className="w-7 h-7 rounded-[6px] object-cover"
        />
        <span className="text-sm font-bold text-[var(--rf-volt)] tracking-tight hidden sm:block">refract</span>
      </div>

      {/* Center controls */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="px-2.5 py-1.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] text-xs text-[var(--rf-mist)] cursor-pointer hover:bg-[var(--rf-surface)] transition-colors"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        {/* Provider selector */}
        <div className="relative">
          <button
            onClick={() => setProviderOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] text-xs text-[var(--rf-mist)] hover:bg-[var(--rf-surface)] transition-colors"
          >
            <span className="text-sm leading-none">{activeProvider.icon}</span>
            <span className="hidden sm:block">{activeProvider.label}</span>
            <ChevronDown size={12} className={`transition-transform ${providerOpen ? 'rotate-180' : ''}`} />
          </button>

          {providerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProviderOpen(false)} />
              <div className="absolute top-full left-0 mt-1 bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-[8px] overflow-hidden z-50 min-w-[140px] shadow-lg">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { onProviderChange(p.value); setProviderOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[var(--rf-forest)] transition-colors ${
                      p.value === provider ? 'text-[var(--rf-volt)]' : 'text-[var(--rf-mist)]'
                    }`}
                  >
                    <span className="text-sm leading-none">{p.icon}</span>
                    <span className="flex-1">{p.label}</span>
                    {p.value === provider && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--rf-volt)]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onHistoryClick}
          className="p-1.5 hover:bg-[var(--rf-forest)] rounded-[6px] transition-colors text-[var(--rf-sky)]"
          title="History"
        >
          <History size={18} />
        </button>

        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--rf-volt)] text-[var(--rf-void)] text-sm font-bold rounded-[8px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Zap size={14} className="animate-pulse" />
              <span className="hidden sm:block">Analyzing</span>
            </>
          ) : (
            <span>Analyze →</span>
          )}
        </button>
      </div>
    </div>
  );
}
