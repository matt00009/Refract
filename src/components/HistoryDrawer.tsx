import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../types/analysis';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTimeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function HistoryDrawer({ open, onClose, entries, onSelect, onClear }: HistoryDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[var(--rf-depth)] border-l border-[var(--rf-border)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--rf-border)]">
              <h2 className="text-sm font-semibold text-[var(--rf-volt)]">History</h2>
              <button onClick={onClose} className="p-1 hover:bg-[var(--rf-forest)] rounded transition-colors">
                <X size={18} className="text-[var(--rf-border)]" />
              </button>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto space-y-2 p-4">
              {entries.length === 0 ? (
                <p className="text-xs text-[var(--rf-border)] text-center py-8">No history yet</p>
              ) : (
                entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      onSelect(entry);
                      onClose();
                    }}
                    className="w-full text-left p-3 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] hover:bg-[var(--rf-surface)] transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className="px-2 py-1 rounded-[4px] text-xs font-semibold rf-mono"
                        style={{
                          backgroundColor: entry.score >= 75 ? 'var(--rf-volt)' : entry.score >= 50 ? 'var(--rf-warn)' : 'var(--rf-ember)',
                          color: entry.score >= 75 ? 'var(--rf-void)' : 'var(--rf-void)',
                        }}
                      >
                        {entry.score}
                      </span>
                      <span className="text-[10px] text-[var(--rf-border)] uppercase">{entry.lang}</span>
                    </div>
                    <p className="text-xs text-[var(--rf-mist)] line-clamp-1 mb-1">{entry.summary}</p>
                    <div className="text-[10px] text-[var(--rf-border)] font-mono line-clamp-1">{entry.code}</div>
                    <div className="text-[10px] text-[var(--rf-border)] mt-1">{formatTimeAgo(entry.ts)}</div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {entries.length > 0 && (
              <div className="border-t border-[var(--rf-border)] p-4">
                <button
                  onClick={onClear}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs text-[var(--rf-ember)] hover:bg-[var(--rf-forest)] rounded-[6px] transition-colors"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
