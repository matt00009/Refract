import { useState, memo, useEffect } from 'react';
import { ChevronDown, AlertCircle, AlertTriangle, Lightbulb, Copy, Check, XCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { highlightCode } from '../lib/highlight';
import type { Issue } from '../types/analysis';

interface IssueCardProps {
  issue: Issue;
  index: number;
  language: string;
}

/** Severity-specific display configuration (color, icon, label). */
const SEVERITY_CONFIG = {
  bug: { color: 'var(--rf-ember)', icon: AlertCircle, label: 'Bug' },
  warning: { color: 'var(--rf-warn)', icon: AlertTriangle, label: 'Warning' },
  suggestion: { color: 'var(--rf-sky)', icon: Lightbulb, label: 'Suggestion' },
} as const;

/**
 * Expandable card displaying a single code review issue.
 * Shows a dual-panel layout: "VULNERABLE CODE" vs "SECURE FIX" side-by-side,
 * plus description and resolution methodology bullets.
 * Matches the Stitch "Advanced Code Repair Dashboard" design.
 * 
 * Optimized with Shiki lazy-loading and conditional highlighting on expansion.
 */
export const IssueCard = memo(function IssueCard({ issue, index, language }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightedVulnerable, setHighlightedVulnerable] = useState<string | null>(null);
  const [highlightedFix, setHighlightedFix] = useState<string | null>(null);

  const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.suggestion;
  const Icon = config.icon;
  const contentId = `issue-content-${index}`;

  const rawVulnerable = issue.vulnerable_code || null;
  const rawFix = issue.fix_code || issue.fix || null;
  const hasDualPanel = !!(rawVulnerable || rawFix);

  /**
   * Ensures a string is displayed as code.
   * If the AI returned plain prose (no code-like chars), wraps each line as a comment.
   */
  const ensureCode = (text: string): string => {
    const CODE_SIGNALS = /[{};()=><[\]"'`]|\/\/|#|import|const|let|var|def |return|function|class|=>|->|\.\w+\(/;
    if (CODE_SIGNALS.test(text)) return text;
    // Looks like prose — wrap lines as comments
    return text
      .split('\n')
      .map((line) => (line.trim() ? `// ${line.trim()}` : ''))
      .join('\n');
  };

  // Perform Shiki highlighting ONLY when expanded to save resources
  useEffect(() => {
    if (expanded && hasDualPanel && (!highlightedVulnerable || !highlightedFix)) {
      const highlight = async () => {
        if (rawVulnerable) {
          try {
            const h = await highlightCode(ensureCode(rawVulnerable), language);
            setHighlightedVulnerable(h);
          } catch (e) {
            console.error('Shiki highlight error (vulnerable):', e);
          }
        }
        if (rawFix) {
          try {
            const h = await highlightCode(ensureCode(rawFix), language);
            setHighlightedFix(h);
          } catch (e) {
            console.error('Shiki highlight error (fix):', e);
          }
        }
      };
      highlight();
    }
  }, [expanded, hasDualPanel, rawVulnerable, rawFix, language, highlightedVulnerable, highlightedFix]);

  const handleCopyFix = async () => {
    const rawFixCode = issue.fix_code || issue.fix;
    if (rawFixCode) {
      try {
        await navigator.clipboard.writeText(rawFixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        setCopied(false);
      }
    }
  };

  // Fallback resolution bullets derived from description
  const resolutionBullets: string[] = issue.description
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)
    .slice(0, 3)
    .map((s) => (s.endsWith('.') ? s : `${s}.`));

  const explanationLines: string[] = issue.fix_explanation
    ? issue.fix_explanation
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const displayBullets = explanationLines.length > 0 ? explanationLines : resolutionBullets;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ willChange: 'transform, opacity' }}
      className="bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-sm overflow-hidden group focus-within:ring-1 focus-within:ring-[var(--rf-volt)]/30 shadow-lg"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[var(--rf-surface)]/50 transition-all focus:outline-none relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[var(--rf-volt)] transition-colors" style={{ backgroundColor: expanded ? config.color : 'transparent' }} />
        <motion.div layout="position" layoutId={`issue-header-${index}`} className="flex items-center gap-3">
          <Icon size={18} style={{ color: config.color, flexShrink: 0 }} aria-hidden="true" />
          <div>
            <div id={`issue-title-${index}`} className="font-bold text-sm text-[var(--rf-mist)] group-hover:text-white transition-colors">{issue.title}</div>
            <div className="rf-micro-caps text-[var(--rf-mist)]/40 mt-0.5">
              {config.label}{issue.line ? ` · Line ${issue.line}` : ''}
            </div>
          </div>
        </motion.div>

        <motion.div layout layoutId={`issue-chevron-${index}`}>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="flex-shrink-0 text-[var(--rf-mist)]/40 transition-transform duration-300"
            style={{ 
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: expanded ? 'var(--rf-volt)' : 'inherit',
              willChange: 'transform'
            }}
          />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={`issue-title-${index}`}
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ willChange: 'height, opacity' }}
            className="overflow-hidden bg-[var(--rf-void)]/30 backdrop-blur-md"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--rf-border)]">
              {/* Description */}
              <motion.p 
                layout="position"
                className="text-sm text-[var(--rf-mist)]/90 leading-relaxed pt-3 border-l border-[var(--rf-border)] pl-3 ml-1"
              >
                {issue.description}
              </motion.p>

              {/* Dual-panel: Vulnerable Code / Secure Fix */}
              {hasDualPanel && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Vulnerable Code panel */}
                  <div className="rounded-sm bg-[var(--rf-void)] border border-[rgba(255,144,112,0.15)] overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-[rgba(255,144,112,0.15)] bg-[var(--rf-ember)]/5 flex items-center gap-2">
                      <XCircle size={12} className="text-[var(--rf-ember)] shrink-0" aria-hidden="true" />
                      <span className="rf-micro-caps text-[var(--rf-ember)] font-bold">
                        CODE VULNÉRABLE
                      </span>
                    </div>
                    <div className="p-3 overflow-x-auto diff-scrollbar shiki-minimal min-h-[60px]">
                      {highlightedVulnerable ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedVulnerable }} />
                      ) : (
                        <pre className="text-[11px] font-mono leading-[1.6] text-[var(--rf-mist)]/80 whitespace-pre">
                          <code>{rawVulnerable ? ensureCode(rawVulnerable) : '// N/A'}</code>
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Secure Fix panel */}
                  <div className="rounded-sm bg-[var(--rf-void)] border border-[rgba(168,255,62,0.20)] overflow-hidden group/fix relative">
                    <div className="px-3 py-1.5 border-b border-[rgba(168,255,62,0.20)] bg-[var(--rf-volt)]/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-[var(--rf-volt)] shrink-0" aria-hidden="true" />
                        <span className="rf-micro-caps text-[var(--rf-volt)] font-bold">
                          CORRECTIF SÉCURISÉ
                        </span>
                      </div>
                      {rawFix && (
                        <button
                          onClick={handleCopyFix}
                          aria-label="Copy fix to clipboard"
                          className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider uppercase bg-[var(--rf-volt)]/10 text-[var(--rf-volt)] hover:bg-[var(--rf-volt)] hover:text-[var(--rf-void)] px-2.5 py-1 border border-[rgba(168,255,62,0.3)] transition-all cursor-pointer shadow-sm hover:scale-105 opacity-100 sm:opacity-0 group-hover/fix:opacity-100 focus:outline-none focus:ring-1 focus:ring-[var(--rf-volt)]"
                        >
                          {copied ? <Check size={10} className="stroke-[3]" aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
                          <span>{copied ? 'Copié' : 'Copier'}</span>
                        </button>
                      )}
                    </div>
                    <div className="p-3 overflow-x-auto diff-scrollbar shiki-minimal min-h-[60px]">
                      {highlightedFix ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedFix }} />
                      ) : (
                        <pre className="text-[11px] font-mono leading-[1.6] text-[var(--rf-volt)]/80 whitespace-pre">
                          <code>{rawFix ? ensureCode(rawFix) : '// Aucun correctif disponible'}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution methodology */}
              {displayBullets.length > 0 && (
                <div className="mt-4 p-4 rounded-sm border border-[var(--rf-border)] bg-[rgba(8,11,15,0.4)] relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none select-none">
                    <Icon size={120} />
                  </div>
                  <div className="rf-micro-caps text-[var(--rf-volt)] mb-3 font-bold relative z-10">
                    MÉTHODOLOGIE DE RÉSOLUTION :
                  </div>
                  <ul className="space-y-2 relative z-10">
                    {displayBullets.map((bullet, i) => (
                      <li key={i} className="flex gap-2 text-[var(--rf-mist)]/70 text-xs">
                        <span className="text-[var(--rf-volt)] select-none font-bold">›</span>
                        <span>{bullet.replace(/^[-\d.*•›]+\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
