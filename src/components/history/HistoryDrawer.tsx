import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, Code2, Download, Upload, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { importHistoryJSON, exportHistoryJSON } from '../../lib/history';
import type { HistoryEntry } from '../../types/analysis';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onImport: (entries: HistoryEntry[]) => void;
}

/**
 * Slide-out drawer for browsing past code analyses.
 * Optimized for keyboard navigation and screen readers.
 */
export function HistoryDrawer({
  open,
  onClose,
  entries,
  onSelect,
  onClear,
  onImport,
}: HistoryDrawerProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  const handleExport = () => {
    exportHistoryJSON(entries);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: 500KB limit
    if (file.size > 500_000) {
      console.error('Import file too large');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validated = importHistoryJSON(content);
      if (validated) {
        onImport(validated);
      } else {
        console.error('Invalid history file');
      }
    };
    reader.readAsText(file);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            aria-hidden="true"
          />
          <motion.div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--rf-depth)] border-l border-[var(--rf-border)] z-[160] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--rf-border)] bg-[var(--rf-void)]">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--rf-volt)]" />
                <h2 id="history-title" className="rf-micro-caps text-[var(--rf-mist)] font-bold tracking-widest">
                  // HISTORY_BUFFER
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rf-forest)] text-[var(--rf-mist)]/60 font-mono">
                  {entries.length}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close history"
                className="p-1.5 hover:bg-[var(--rf-forest)] rounded-sm transition-colors text-[var(--rf-mist)]/40 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
            <div className="p-3 border-b border-[var(--rf-border)] bg-[var(--rf-forest)]/20 flex gap-2">
              <button
                onClick={handleExport}
                disabled={entries.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--rf-forest)] border border-[var(--rf-border)] text-[var(--rf-mist)]/60 hover:text-white hover:border-[var(--rf-volt)]/50 transition-all rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download size={12} aria-hidden="true" /> Export
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--rf-forest)] border border-[var(--rf-border)] text-[var(--rf-mist)]/60 hover:text-white hover:border-[var(--rf-volt)]/50 transition-all rounded-sm cursor-pointer">
                <Upload size={12} aria-hidden="true" /> Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  aria-label="Importer un fichier d'historique JSON"
                />
              </label>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 diff-scrollbar">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                  <div className="p-4 bg-[var(--rf-forest)]/30 rounded-full border border-[var(--rf-border)] border-dashed opacity-20">
                    <Clock size={32} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--rf-mist)]/60 uppercase tracking-widest">Buffer Empty</h3>
                    <p className="text-[10px] text-[var(--rf-mist)]/30 mt-1">Your past analyses will appear here.</p>
                  </div>
                </div>
              ) : (
                entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      onSelect(entry);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-sm border border-[var(--rf-border)] bg-[var(--rf-forest)]/20 hover:bg-[var(--rf-forest)]/40 hover:border-[var(--rf-volt)]/30 transition-all group focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rf-volt)]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5">
                        <Code2 size={12} className="text-[var(--rf-volt)]" />
                        <span className="text-[10px] font-mono text-white/80 uppercase tracking-tighter">{entry.lang}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--rf-mist)]/30">
                        {formatDistanceToNow(entry.ts, { addSuffix: true })}
                      </span>
                    </div>
                    
                    <h3 className="text-[11px] font-bold text-white mb-1 line-clamp-1 group-hover:text-[var(--rf-volt)] transition-colors">
                      {entry.summary}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Shield size={10} className={entry.score > 80 ? 'text-[var(--rf-volt)]' : 'text-[var(--rf-ember)]'} />
                        <span className="text-[10px] font-mono font-bold" style={{ color: entry.score > 80 ? 'var(--rf-volt)' : 'var(--rf-ember)' }}>
                          {entry.score}%
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-[var(--rf-mist)]/60 truncate flex-1">
                        {entry.provider} · {entry.code.length} chars
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer clear */}
            {entries.length > 0 && (
              <div className="border-t border-[var(--rf-border)] p-3">
                <button
                  onClick={onClear}
                  aria-label="Clear all history"
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[var(--rf-ember)] hover:bg-[var(--rf-forest)] rounded-sm transition-colors focus-visible:ring-1 focus-visible:ring-[var(--rf-ember)] focus:outline-none"
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
