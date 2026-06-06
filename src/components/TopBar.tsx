import { History, Settings, Share2, Zap } from 'lucide-react';
import type { Provider } from '../types/analysis';
import { PROVIDERS } from '../lib/constants';

interface TopBarProps {
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  onAnalyze: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
  onShare: () => void;
  isLoading: boolean;
}

/**
 * Fixed top navigation bar.
 * Implements a clean Precision Terminal styling with brand, provider pills, and actions.
 */
export function TopBar({
  provider,
  onProviderChange,
  onAnalyze,
  onHistoryClick,
  onSettingsClick,
  onShare,
  isLoading,
}: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] bg-[var(--rf-void)] border-b border-[var(--rf-border)] flex items-center justify-between px-4 z-50">
      {/* Brand */}
      <div className="flex items-center gap-1.5 shrink-0 select-none">
        <span className="font-mono text-[var(--rf-volt)] font-bold text-lg tracking-tighter">&gt;_ refract</span>
      </div>

      {/* Center controls (Provider Selector) */}
      <div className="flex items-center">
        {/* Desktop capsule selector */}
        <div 
          role="radiogroup" 
          aria-label="Select AI provider"
          className="hidden md:flex items-center gap-1 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-full px-1.5 py-1"
        >
          {PROVIDERS.map((p) => {
            const isActive = p.value === provider;
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                role="radio"
                aria-checked={isActive}
                onClick={() => onProviderChange(p.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] focus:outline-none ${
                  isActive
                    ? 'bg-[var(--rf-void)] text-[var(--rf-mist)] border border-[var(--rf-border)] shadow-sm'
                    : 'text-[var(--rf-mist)]/60 hover:text-[var(--rf-mist)] border border-transparent'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile select fallback */}
        <div className="block md:hidden relative">
          <select
            aria-label="Select AI provider"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as Provider)}
            className="px-2.5 py-1.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] text-xs text-[var(--rf-mist)] cursor-pointer hover:bg-[var(--rf-surface)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--rf-volt)]"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onShare}
          className="rf-btn-ghost focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
          title="Share report"
          aria-label="Share report"
        >
          <Share2 size={16} />
        </button>

        <button
          onClick={onSettingsClick}
          className="rf-btn-ghost focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
          title="API Settings"
          aria-label="API Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={onHistoryClick}
          className="rf-btn-ghost focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
          title="History"
          aria-label="Open history"
        >
          <History size={16} />
        </button>

        <button
          onClick={onAnalyze}
          disabled={isLoading}
          aria-label={isLoading ? 'Analyzing code' : 'Analyze code'}
          className="rf-btn-volt flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white"
        >
          <span>{isLoading ? 'Analyzing' : 'Analyze Code'}</span>
          {isLoading ? (
            <Zap size={14} className="animate-pulse" />
          ) : (
            <span className="font-mono text-sm">&rarr;</span>
          )}
        </button>
      </div>
    </div>
  );
}

