import { History, Settings, Share2, Zap, BarChart3 } from 'lucide-react';
import type { Provider } from '../../types/analysis';
import { PROVIDERS } from '../../lib/constants';

interface TopBarProps {
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  onAnalyze: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
  onShare: () => void;
  onStatsClick: () => void;
  isLoading: boolean;
}

/**
 * Tactical Top Navigation Bar.
 * Industrial Brutalist aesthetic: rigid grids, monospaced metadata, tactical accents.
 */
export function TopBar({
  provider,
  onProviderChange,
  onAnalyze,
  onHistoryClick,
  onSettingsClick,
  onShare,
  onStatsClick,
  isLoading,
}: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] bg-[var(--rf-void)] border-b-2 border-[var(--rf-border)] flex items-center justify-between px-6 z-50 select-none">
      {/* Brand */}
      <button
        className="flex items-center gap-2 shrink-0 group cursor-pointer bg-transparent border-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] rounded-sm"
        aria-label="Refract — System Root"
        onClick={() => window.location.reload()}
      >
        <span className="font-mono text-[var(--rf-volt)] font-black text-xl tracking-tighter uppercase group-hover:text-shadow-volt transition-all">
          Refract<span className="opacity-40">.sys</span>
        </span>
      </button>

      {/* Center controls (Provider Selector) */}
      <div className="flex items-center gap-6">
        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 border border-[var(--rf-border)] bg-[var(--rf-forest)]/30 rounded-sm">
          <div className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-[var(--rf-volt)] animate-pulse' : 'bg-[var(--rf-sky)]'} shadow-[0_0_8px_var(--rf-sky)]`} />
          <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--rf-mist)]/50 uppercase font-black">
            {isLoading ? 'EXECUTING_ANALYSIS' : 'TERMINAL_READY'}
          </span>
        </div>

        {/* Desktop capsule selector */}
        <div 
          role="radiogroup" 
          aria-label="Select Logic Core"
          className="hidden md:flex items-center gap-1 bg-[var(--rf-void)] border border-[var(--rf-border)] p-1 rounded-sm"
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
                className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] focus:outline-none ${
                  isActive
                    ? 'bg-[var(--rf-surface)] text-[var(--rf-volt)] border border-[var(--rf-border)]'
                    : 'text-[var(--rf-mist)]/40 hover:text-[var(--rf-mist)] hover:bg-[var(--rf-forest)] border border-transparent'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <TopBarAction icon={BarChart3} onClick={onStatsClick} label="Forge_Control" shortcut="G" />
        <TopBarAction icon={Share2} onClick={onShare} label="Export_Telemetry" />
        <TopBarAction icon={Settings} onClick={onSettingsClick} label="System_Config" shortcut="," />
        <TopBarAction icon={History} onClick={onHistoryClick} label="History_Log" shortcut="H" />

        <div className="w-px h-6 bg-[var(--rf-border)] mx-2" />

        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="rf-btn-volt flex items-center gap-2.5 h-9 px-6 rounded-none shadow-[2px_2px_0px_var(--rf-void)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
        >
          <span className="font-mono text-[11px] font-black uppercase tracking-widest">
            {isLoading ? 'Running...' : 'Analyze_Source'}
          </span>
          <Zap size={14} className={isLoading ? 'animate-pulse' : ''} />
          
          <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <kbd className="px-1.5 py-0.5 bg-[var(--rf-void)] border border-[var(--rf-border)] rounded-none text-[8px] text-[var(--rf-volt)] font-mono">
               MOD+ENTER
             </kbd>
          </div>
        </button>
      </div>
    </div>
  );
}

function TopBarAction({ icon: Icon, onClick, label, shortcut }: { icon: React.ElementType, onClick: () => void, label: string, shortcut?: string }) {
  return (
    <button
      onClick={onClick}
      title={`${label} ${shortcut ? `(MOD+${shortcut})` : ''}`}
      className="w-9 h-9 flex items-center justify-center bg-[var(--rf-forest)] border border-[var(--rf-border)] text-[var(--rf-mist)]/40 hover:text-[var(--rf-volt)] hover:border-[var(--rf-volt)]/50 transition-all rounded-none cursor-pointer group relative"
    >
      <Icon size={16} className="group-hover:scale-110 transition-transform" />
      {shortcut && (
        <kbd className="absolute -bottom-1 -right-1 px-1 bg-[var(--rf-void)] border border-[var(--rf-border)] text-[7px] text-[var(--rf-sky)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}


