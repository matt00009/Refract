/**
 * Empty state placeholder shown when no analysis result is available.
 * Uses the rf-micro-caps and animate-cursor-blink from the design system.
 */
export function EmptyState() {
  return (
    <div 
      className="flex flex-col items-center justify-center h-full text-center gap-5 py-12"
      role="status"
      aria-label="No results to display. Paste code to start analysis."
    >

      {/* Terminal prompt ring */}
      <div className="relative w-20 h-20" role="presentation">
        {/* Outer spinning arc */}
        <div className="absolute inset-0 rounded-full border-t border-[var(--rf-volt)] animate-spin opacity-30" />
        {/* Static ring */}
        <div className="absolute inset-0 rounded-full border border-[var(--rf-border)] bg-[var(--rf-forest)] flex items-center justify-center">
          <span className="font-mono text-[var(--rf-volt)] font-bold text-2xl leading-none">
            &gt;<span className="animate-cursor-blink" aria-hidden="true">_</span>
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-[var(--rf-mist)]/60">
          Paste code&nbsp;
          <span className="hidden md:inline">on the left</span>
          <span className="inline md:hidden">above</span>
        </h3>
        <p className="rf-micro-caps text-[var(--rf-border)] tracking-[0.15em]">
          Ctrl+Enter to analyze
        </p>
      </div>

      {/* Shortcut hints */}
      <div className="flex items-center gap-3 mt-1" aria-label="Keyboard shortcuts">
        {[
          { key: 'Ctrl+H', label: 'History' },
          { key: 'Ctrl+,', label: 'Settings' },
          { key: 'Ctrl+F', label: 'Focus' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5 opacity-40">
            <kbd className="rf-micro-caps bg-[var(--rf-forest)] border border-[var(--rf-border)] px-1.5 py-0.5 rounded-sm text-[9px]">
              {key}
            </kbd>
            <span className="text-[9px] font-mono text-[var(--rf-mist)]/60">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
