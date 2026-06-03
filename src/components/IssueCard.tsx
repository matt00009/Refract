import { useState } from 'react';
import { ChevronDown, AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Issue } from '../types/analysis';

interface IssueCardProps {
  issue: Issue;
  index: number;
}

export function IssueCard({ issue, index }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const severityConfig = {
    bug: { color: 'var(--rf-ember)', icon: AlertCircle, label: 'Bug' },
    warning: { color: 'var(--rf-warn)', icon: AlertTriangle, label: 'Warning' },
    suggestion: { color: 'var(--rf-sky)', icon: Lightbulb, label: 'Suggestion' },
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  const handleCopy = async () => {
    if (issue.fix) {
      try {
        await navigator.clipboard.writeText(issue.fix);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rf-card p-4 space-y-3"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <Icon size={18} style={{ color: config.color, marginTop: '2px', flexShrink: 0 }} />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-[var(--rf-mist)] line-clamp-1">{issue.title}</div>
          <div className="text-xs text-[var(--rf-border)]">
            {config.label}
            {issue.line && ` · Line ${issue.line}`}
          </div>
        </div>

        <ChevronDown
          size={16}
          className="flex-shrink-0 transition-transform"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-3 border-t border-[var(--rf-border)]">
              <p className="text-sm text-[var(--rf-mist)] leading-relaxed">{issue.description}</p>

              {issue.fix && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[var(--rf-border)]">Fix</span>
                    <button
                      onClick={handleCopy}
                      className="text-xs px-2 py-1 rounded-[4px] bg-[var(--rf-forest)] hover:bg-[var(--rf-surface)] text-[var(--rf-sky)] transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-[var(--rf-void)] border border-[var(--rf-border)] rounded-[6px] p-3 overflow-x-auto text-xs rf-mono text-[var(--rf-sky)]">
                    <code>{issue.fix}</code>
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
