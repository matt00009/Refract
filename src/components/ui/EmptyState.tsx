import { Terminal } from 'lucide-react';

/**
 * Tactical Empty State.
 * Represents a terminal in standby mode.
 */
export function EmptyState() {
  return (
    <div 
      className="flex flex-col items-center justify-center h-full text-center gap-6 py-20 bg-[var(--rf-depth)]"
      role="status"
    >
      {/* Standby Core */}
      <div className="relative group">
        <div className="absolute inset-[-20px] border border-[var(--rf-volt)]/5 rounded-full animate-pulse group-hover:scale-110 transition-transform" />
        <div className="absolute inset-[-10px] border border-[var(--rf-border)] rounded-full animate-spin [animation-duration:10s]" />
        
        <div className="relative w-24 h-24 bg-[var(--rf-void)] border-2 border-[var(--rf-border)] flex flex-col items-center justify-center">
          <Terminal size={32} className="text-[var(--rf-volt)] opacity-20 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-[var(--rf-volt)] rounded-full animate-pulse" />
              <span className="w-1 h-1 bg-[var(--rf-volt)] rounded-full animate-pulse [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-[var(--rf-volt)] rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-w-xs">
        <h3 className="text-[11px] font-mono font-black text-[var(--rf-mist)]/40 tracking-[0.25em] uppercase">
          System_Standby
        </h3>
        <p className="text-xs text-[var(--rf-mist)]/30 font-sans leading-relaxed">
          Waiting for logic buffer input. Paste source code on the primary terminal to execute analysis.
        </p>
      </div>

      {/* Command Registry */}
      <div className="grid grid-cols-1 gap-2 pt-4">
        <ShortcutHint kbd="Ctrl + Enter" label="Execute_Audit" />
        <div className="flex gap-2">
          <ShortcutHint kbd="Ctrl + F" label="Focus_Core" />
          <ShortcutHint kbd="Ctrl + H" label="Registry" />
        </div>
      </div>
    </div>
  );
}

function ShortcutHint({ kbd, label }: { kbd: string, label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--rf-forest)] border border-[var(--rf-border)]">
      <kbd className="text-[9px] font-mono font-bold text-[var(--rf-volt)] bg-[var(--rf-void)] px-1.5 py-0.5 border border-[var(--rf-border)]">
        {kbd}
      </kbd>
      <span className="text-[9px] font-mono text-[var(--rf-mist)]/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

