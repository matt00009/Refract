/**
 * Empty state placeholder shown when no analysis result is available.
 * Implements a spinning terminal indicator matching the Stitch visual system.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12 select-none">
      <div className="w-20 h-20 rounded-full border border-hairline bg-[var(--rf-surface)] flex items-center justify-center relative">
        <span className="font-mono text-[var(--rf-volt)] font-bold text-2xl">&gt;_</span>
        {/* Spinning highlight effect */}
        <div className="absolute inset-0 rounded-full border-t border-[var(--rf-volt)] animate-spin opacity-50"></div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-[var(--rf-mist)]/60 mb-1">
          Paste code <span className="hidden md:inline">on the left</span>
          <span className="inline md:hidden">above</span>
        </h3>
        <p className="text-xs font-mono text-[var(--rf-border)]">Press Cmd/Ctrl+Enter to analyze</p>
      </div>
    </div>
  );
}
