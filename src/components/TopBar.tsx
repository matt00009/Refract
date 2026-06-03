import { History } from 'lucide-react';

interface TopBarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  onAnalyze: () => void;
  onHistoryClick: () => void;
  isLoading: boolean;
}

const LANGUAGES = ['Auto', 'JS', 'TS', 'Python', 'Go', 'Rust', 'PHP', 'Java'];

export function TopBar({ language, onLanguageChange, onAnalyze, onHistoryClick, isLoading }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] bg-[var(--rf-depth)] border-b border-[var(--rf-border)] flex items-center justify-between px-6 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-[var(--rf-forest)] border border-[var(--rf-volt)] flex items-center justify-center">
          <span className="text-[var(--rf-volt)] font-bold text-sm">{'>'}</span>
        </div>
        <span className="text-sm font-bold text-[var(--rf-volt)]">refract</span>
      </div>

      {/* Language selector */}
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="px-3 py-1.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] text-xs text-[var(--rf-mist)] cursor-pointer hover:bg-[var(--rf-surface)] transition-colors"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang.toLowerCase() === 'auto' ? 'auto' : lang.toLowerCase()}>
            {lang}
          </option>
        ))}
      </select>

      {/* Actions */}
      <div className="flex items-center gap-3">
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
          className="rf-btn-volt text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze →'}
        </button>
      </div>
    </div>
  );
}
