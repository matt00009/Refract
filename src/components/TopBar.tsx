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
      <button
        className="flex items-center gap-1.5 shrink-0 select-none group cursor-pointer bg-transparent border-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] rounded-sm"
        aria-label="Refract — Retour à l'accueil"
        onClick={() => window.location.reload()}
      >
        <span className="font-mono text-[var(--rf-volt)] font-bold text-lg tracking-tighter group-hover:text-shadow-volt transition-all">
          &gt;_ refract
        </span>
      </button>

      {/* Center controls (Provider Selector) */}
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-[var(--rf-border)] bg-[var(--rf-forest)]/30 rounded-sm select-none">
          <div className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-[var(--rf-volt)] animate-pulse' : 'bg-[var(--rf-sky)]'} shadow-[0_0_8px_rgba(121,192,255,0.3)]`} />
          <span className="text-[9px] font-mono tracking-widest text-[var(--rf-mist)]/50 uppercase font-semibold">
            {isLoading ? 'Processing' : 'Terminal Ready'}
          </span>
        </div>

        {/* Desktop capsule selector */}
        <div 
          role="radiogroup" 
          aria-label="Select AI provider"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              const currentIndex = PROVIDERS.findIndex(p => p.value === provider);
              let nextIndex = currentIndex;
              if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % PROVIDERS.length;
              if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + PROVIDERS.length) % PROVIDERS.length;
              onProviderChange(PROVIDERS[nextIndex].value);
              
              // Focus the next button after state update
              setTimeout(() => {
                const buttons = e.currentTarget.querySelectorAll('button');
                buttons[nextIndex]?.focus();
              }, 0);
            }
          }}
          className="hidden md:flex items-center gap-1 bg-[var(--rf-void)] border border-[var(--rf-border)] px-1 py-1"
        >
          {PROVIDERS.map((p) => {
            const isActive = p.value === provider;
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                role="radio"
                aria-checked={isActive}
                tabIndex={isActive ? 0 : -1}
                aria-label={`Select ${p.label} provider`}
                onClick={() => onProviderChange(p.value)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] focus:outline-none ${
                  isActive
                    ? 'bg-[var(--rf-surface)] text-[var(--rf-volt)] border border-[var(--rf-border)] shadow-sm'
                    : 'text-[var(--rf-mist)]/40 hover:text-[var(--rf-mist)] hover:bg-[var(--rf-forest)] border border-transparent'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
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
            className="px-2.5 py-1.5 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm text-xs text-[var(--rf-mist)] cursor-pointer hover:bg-[var(--rf-surface)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--rf-volt)]"
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
          className="rf-btn-ghost rounded-sm focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
          title="Share report"
          aria-label="Share report"
        >
          <Share2 size={16} />
        </button>

        <button
          onClick={onSettingsClick}
          className="rf-btn-ghost rounded-sm focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
          title="API Settings"
          aria-label="API Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={onHistoryClick}
          className="rf-btn-ghost rounded-sm focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
          title="History"
          aria-label="Open history"
        >
          <History size={16} />
        </button>

        <button
          onClick={onAnalyze}
          disabled={isLoading}
          aria-label={isLoading ? 'Analyzing code' : 'Analyze code'}
          className="rf-btn-volt rounded-sm flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white h-8"
        >
          <span className="font-bold">{isLoading ? 'Analyzing' : 'Analyze'}</span>
          {isLoading ? (
            <Zap size={14} className="animate-pulse" />
          ) : (
            <Zap size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

