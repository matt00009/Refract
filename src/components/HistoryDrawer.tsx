import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Download, Upload } from 'lucide-react';
import type { HistoryEntry } from '../types/analysis';
import { exportHistoryJSON, importHistoryJSON } from '../lib/history';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onImport: (entries: HistoryEntry[]) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

const PROVIDER_LABELS: Record<string, string> = {
  auto: '🧠',
  anthropic: '🪶',
  gemini: '♊',
  mistral: '🌪️',
  groq: '⚡',
  deepseek: '🐳',
};

export function HistoryDrawer({ open, onClose, entries, onSelect, onClear, onImport }: HistoryDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert('Invalid backup file. Expected refract JSON backup with id, code, score, resultCache fields.');
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 w-[320px] bg-[var(--rf-depth)] border-l border-[var(--rf-border)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--rf-border)]">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--rf-volt)]">History</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[var(--rf-border)] mr-2">{entries.length}/15</span>
                <button onClick={onClose} className="p-1 hover:bg-[var(--rf-forest)] rounded transition-colors">
                  <X size={16} className="text-[var(--rf-border)]" />
                </button>
              </div>
            </div>

            {/* Backup controls */}
            <div className="flex gap-2 px-4 py-2 border-b border-[var(--rf-border)]">
              <button
                onClick={exportHistoryJSON}
                disabled={entries.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--rf-sky)] bg-[var(--rf-forest)] hover:bg-[var(--rf-surface)] border border-[var(--rf-border)] rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={12} />
                Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--rf-mist)] bg-[var(--rf-forest)] hover:bg-[var(--rf-surface)] border border-[var(--rf-border)] rounded-[6px] transition-colors"
              >
                <Upload size={12} />
                Import JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <span className="text-2xl">🕳</span>
                  <p className="text-xs text-[var(--rf-border)] text-center">No history yet</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const scoreColor =
                    entry.score >= 75
                      ? 'var(--rf-volt)'
                      : entry.score >= 50
                        ? 'var(--rf-warn)'
                        : 'var(--rf-ember)';

                  return (
                    <button
                      key={entry.id}
                      onClick={() => { onSelect(entry); onClose(); }}
                      className="w-full text-left p-3 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[8px] hover:border-[var(--rf-volt)]/30 hover:bg-[var(--rf-surface)] transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-8 h-5 flex items-center justify-center rounded text-[10px] font-bold rf-mono"
                          style={{ backgroundColor: scoreColor, color: 'var(--rf-void)' }}
                        >
                          {entry.score}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--rf-border)]">{entry.lang}</span>
                        <span className="ml-auto text-xs leading-none">{PROVIDER_LABELS[entry.provider] || '•'}</span>
                        <span className="text-[10px] text-[var(--rf-border)]">{timeAgo(entry.ts)}</span>
                      </div>
                      <p className="text-[11px] text-[var(--rf-mist)] line-clamp-1 mb-1">{entry.summary}</p>
                      <p className="text-[10px] text-[var(--rf-border)] font-mono line-clamp-1 opacity-70">{entry.code}</p>
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
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[var(--rf-ember)] hover:bg-[var(--rf-forest)] rounded-[6px] transition-colors"
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
