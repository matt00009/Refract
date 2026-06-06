import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Download, Upload } from 'lucide-react';
import type { HistoryEntry } from '../types/analysis';
import { exportHistoryJSON, importHistoryJSON, LIMIT } from '../lib/history';
import { PROVIDER_ICONS } from '../lib/constants';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onImport: (entries: HistoryEntry[]) => void;
}

/**
 * Formats a timestamp as a human-readable relative time string.
 *
 * @param ts - The timestamp in milliseconds
 * @returns A string like "just now", "5m ago", "2d ago", etc.
 */
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  
  if (diff < 30) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

/**
 * Slide-in drawer from the right showing analysis history.
 * Supports export/import of history entries as JSON backups.
 */
export function HistoryDrawer({ open, onClose, entries, onSelect, onClear, onImport }: HistoryDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const imported = importHistoryJSON(text);
      if (imported) {
        onImport(imported);
      } else {
        // Using console.error instead of alert() for better UX
        console.error('Invalid backup file. Expected refract JSON backup with id, code, score, resultCache fields.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 w-[320px] bg-[var(--rf-depth)] border-l border-[var(--rf-border)] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--rf-border)]">
              <span id="history-title" className="text-xs font-bold uppercase tracking-widest text-[var(--rf-volt)]">History</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[var(--rf-mist)]/50 mr-2" aria-label={`${entries.length} of ${LIMIT} entries used`}>
                  {entries.length}/{LIMIT}
                </span>
                <button 
                  onClick={onClose} 
                  aria-label="Close history" 
                  className="p-1 hover:bg-[var(--rf-forest)] rounded transition-colors focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] focus:outline-none"
                >
                  <X size={16} className="text-[var(--rf-mist)]/50" />
                </button>
              </div>
            </div>

            {/* Backup controls */}
            <div className="flex gap-2 px-4 py-2 border-b border-[var(--rf-border)]">
              <button
                onClick={() => exportHistoryJSON(entries)}
                disabled={entries.length === 0}
                aria-label="Export history as JSON"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--rf-sky)] bg-[var(--rf-forest)] hover:bg-[var(--rf-surface)] border border-[var(--rf-border)] rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-[var(--rf-sky)] focus:outline-none"
              >
                <Download size={12} />
                Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Import history from JSON file"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--rf-mist)] bg-[var(--rf-forest)] hover:bg-[var(--rf-surface)] border border-[var(--rf-border)] rounded-[6px] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--rf-mist)] focus:outline-none"
              >
                <Upload size={12} />
                Import JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" aria-label="Select JSON backup file" className="hidden" onChange={handleImport} />
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 diff-scrollbar">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2" role="status">
                  <span className="text-2xl" aria-hidden="true">🕳</span>
                  <p className="text-xs text-[var(--rf-mist)]/50 text-center">No history yet</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const scoreColor =
                    entry.score >= 75
                      ? 'var(--rf-volt)'
                      : entry.score >= 50
                        ? 'var(--rf-warn)'
                        : 'var(--rf-ember)';
                        
                  const IconComponent = PROVIDER_ICONS[entry.provider];

                  return (
                    <button
                      key={entry.id}
                      onClick={() => { onSelect(entry); onClose(); }}
                      className="w-full text-left p-3 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[8px] hover:border-[var(--rf-volt)]/30 hover:bg-[var(--rf-surface)] transition-all group focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)] focus:outline-none"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-8 h-5 flex items-center justify-center rounded text-[10px] font-bold rf-mono"
                          style={{ backgroundColor: scoreColor, color: 'var(--rf-void)' }}
                        >
                          {entry.score}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--rf-mist)]/50">{entry.lang}</span>
                        <span className="ml-auto flex items-center justify-center text-[var(--rf-mist)]">
                          {IconComponent ? (
                            <IconComponent className="w-3 h-3" />
                          ) : (
                            <span className="text-[9px] font-mono opacity-40">{entry.provider}</span>
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--rf-mist)]/50">{timeAgo(entry.ts)}</span>
                      </div>
                      <p className="text-[11px] text-[var(--rf-mist)] line-clamp-1 mb-1 font-bold">{entry.summary}</p>
                      <p className="text-[10px] text-[var(--rf-mist)]/40 font-mono line-clamp-1">{entry.code}</p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer clear */}
            {entries.length > 0 && (
              <div className="border-t border-[var(--rf-border)] p-3">
                <button
                  onClick={onClear}
                  aria-label="Clear all history"
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[var(--rf-ember)] hover:bg-[var(--rf-forest)] rounded-[6px] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--rf-ember)] focus:outline-none"
                >
                  <Trash2 size={13} />
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
