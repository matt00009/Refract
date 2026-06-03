import { Terminal } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
      <div className="w-16 h-16 rounded-full bg-[var(--rf-forest)] border border-[var(--rf-border)] flex items-center justify-center">
        <Terminal size={32} className="text-[var(--rf-volt)]" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-[var(--rf-border)]">Paste code on the left</p>
        <p className="text-xs text-[var(--rf-border)]">Press Cmd/Ctrl+Enter to analyze</p>
      </div>
    </div>
  );
}
