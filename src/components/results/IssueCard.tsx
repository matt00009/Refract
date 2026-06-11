import { useState, memo, useEffect } from 'react';
import { ChevronDown, AlertCircle, AlertTriangle, Lightbulb, Copy, Check, XCircle, ShieldCheck, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { highlightCode } from '../../lib/highlight';
import type { Issue } from '../../types/analysis';

interface IssueCardProps {
  issue: Issue;
  index: number;
  language: string;
}

/** Severity-specific display configuration (color, icon, label). */
const SEVERITY_CONFIG = {
  bug: { color: 'var(--rf-ember)', icon: AlertCircle, label: 'THREAT_CRITICAL' },
  warning: { color: 'var(--rf-warn)', icon: AlertTriangle, label: 'SYSTEM_WARNING' },
  suggestion: { color: 'var(--rf-sky)', icon: Lightbulb, label: 'LOGIC_ADVISORY' },
} as const;

/**
 * Expandable card displaying a single code review issue.
 */
export const IssueCard = memo(function IssueCard({ issue, index, language }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightedVulnerable, setHighlightedVulnerable] = useState<string | null>(null);
  const [highlightedFix, setHighlightedFix] = useState<string | null>(null);

  const config = SEVERITY_CONFIG[issue.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.suggestion;
  const Icon = config.icon;

  const rawVulnerable = issue.vulnerable_code || null;
  const rawFix = issue.fix_code || issue.fix || null;
  const hasDualPanel = !!(rawVulnerable || rawFix);

  const ensureCode = (text: string): string => {
    const CODE_SIGNALS = /[{};()=><[\]"'`]|\/\/|#|import|const|let|var|def |return|function|class|=>|->|\.\w+\(/;
    if (CODE_SIGNALS.test(text)) return text;
    return text
      .split('\n')
      .map((line) => (line.trim() ? `// ${line.trim()}` : ''))
      .join('\n');
  };

  useEffect(() => {
    if (expanded && hasDualPanel && (!highlightedVulnerable || !highlightedFix)) {
      const highlight = async () => {
        if (rawVulnerable) {
          try {
            const h = await highlightCode(ensureCode(rawVulnerable), language);
            setHighlightedVulnerable(h);
          } catch (e) { console.error('Shiki error:', e); }
        }
        if (rawFix) {
          try {
            const h = await highlightCode(ensureCode(rawFix), language);
            setHighlightedFix(h);
          } catch (e) { console.error('Shiki error:', e); }
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
      } catch (error) { console.error('Copy error:', error); }
    }
  };

  const displayBullets = (issue.fix_explanation
    ? issue.fix_explanation.split('\n')
    : issue.description.split(/\.\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[var(--rf-forest)] border-2 border-[var(--rf-border)] rounded-none overflow-hidden group focus-within:ring-1 focus-within:ring-[var(--rf-volt)]/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative"
    >
      {/* Vertical Status Indicator (Industrial Block) */}
      <div 
        className="absolute top-0 left-0 w-1.5 h-full z-10"
        style={{ backgroundColor: expanded ? config.color : 'var(--rf-border)' }}
      />
      
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 pl-8 text-left cursor-pointer hover:bg-[var(--rf-surface)]/50 transition-all focus:outline-none relative"
      >
        <div className="flex items-center gap-5">
          <div className={`p-2 bg-[var(--rf-void)] border border-[var(--rf-border)] rounded-none ${expanded ? 'shadow-[0_0_10px_rgba(168,255,62,0.1)]' : ''}`}>
             <Icon size={18} style={{ color: config.color }} />
          </div>
          <div>
            <div className="font-black text-[15px] text-[var(--rf-mist)] tracking-tight uppercase group-hover:text-white transition-colors">{issue.title}</div>
            <div className="rf-micro-caps text-[var(--rf-mist)]/30 mt-1 flex items-center gap-2">
              <span className="font-black" style={{ color: config.color }}>{config.label}</span>
              {issue.line && <span className="opacity-50 tracking-[0.2em] font-bold">// UNIT_L_{issue.line}</span>}
            </div>
          </div>
        </div>

        <ChevronDown
          size={16}
          className="text-[var(--rf-mist)]/20 transition-transform duration-300"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: expanded ? 'var(--rf-volt)' : '' }}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "circOut" }}
            className="overflow-hidden bg-[var(--rf-void)]/40 border-t border-[var(--rf-border)]"
          >
            <div className="p-6 space-y-6">
              {/* Description Panel */}
              <div className="relative p-4 bg-[var(--rf-void)] border border-[var(--rf-border)]">
                 <div className="absolute top-0 right-0 p-1 opacity-5">
                   <Target size={40} />
                 </div>
                 <p className="text-sm text-[var(--rf-mist)]/80 leading-relaxed font-medium rf-mono uppercase tracking-tight">
                    {issue.description}
                 </p>
              </div>

              {/* Dual-panel: Vulnerable Code / Secure Fix */}
              {hasDualPanel && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vulnerable Code */}
                  <div className="bg-[var(--rf-void)] border border-[rgba(255,144,112,0.2)] relative">
                    <div className="px-3 py-1.5 border-b border-[rgba(255,144,112,0.2)] bg-[var(--rf-ember)]/5 flex items-center gap-2">
                      <XCircle size={12} className="text-[var(--rf-ember)]" />
                      <span className="rf-micro-caps text-[var(--rf-ember)] font-black tracking-widest">THREAT_ORIGIN</span>
                    </div>
                    <div className="p-4 overflow-x-auto diff-scrollbar shiki-minimal min-h-[80px]">
                      {highlightedVulnerable ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedVulnerable }} />
                      ) : (
                        <pre className="text-[11px] font-mono leading-relaxed text-[var(--rf-mist)]/60">
                          <code>{rawVulnerable ? ensureCode(rawVulnerable) : '// N/A'}</code>
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Secure Fix */}
                  <div className="bg-[var(--rf-void)] border border-[rgba(168,255,62,0.3)] relative group/fix">
                    <div className="px-3 py-1.5 border-b border-[rgba(168,255,62,0.3)] bg-[var(--rf-volt)]/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-[var(--rf-volt)]" />
                        <span className="rf-micro-caps text-[var(--rf-volt)] font-black tracking-widest">NEURAL_REPAIR</span>
                      </div>
                      {rawFix && (
                        <button
                          onClick={handleCopyFix}
                          className="flex items-center gap-2 text-[9px] font-black rf-mono bg-[var(--rf-volt)]/10 text-[var(--rf-volt)] hover:bg-[var(--rf-volt)] hover:text-[var(--rf-void)] px-3 py-1 border border-[var(--rf-volt)]/30 transition-all cursor-pointer shadow-sm group-hover/fix:scale-105"
                        >
                          {copied ? <Check size={10} className="stroke-[3]" /> : <Copy size={10} />}
                          <span>{copied ? 'COPIED' : 'PATCH_CLIP'}</span>
                        </button>
                      )}
                    </div>
                    <div className="p-4 overflow-x-auto diff-scrollbar shiki-minimal min-h-[80px]">
                      {highlightedFix ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedFix }} />
                      ) : (
                        <pre className="text-[11px] font-mono leading-relaxed text-[var(--rf-volt)]/80">
                          <code>{rawFix ? ensureCode(rawFix) : '// NO_PATCH_AVAILABLE'}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution Methodology */}
              {displayBullets.length > 0 && (
                <div className="p-5 border border-[var(--rf-border)] bg-[var(--rf-forest)]/30 relative group overflow-hidden">
                  <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.05] text-[var(--rf-volt)] rotate-12 transition-transform duration-700 group-hover:rotate-0">
                    <Zap size={100} />
                  </div>
                  <div className="rf-micro-caps text-[var(--rf-volt)] mb-4 font-black tracking-[0.2em] flex items-center gap-2">
                    <Target size={14} /> EXECUTION_METHODOLOGY
                  </div>
                  <ul className="space-y-3 relative z-10">
                    {displayBullets.map((bullet, i) => (
                      <li key={i} className="flex gap-4 text-[var(--rf-mist)]/80 text-xs font-bold rf-mono uppercase tracking-tight">
                        <span className="text-[var(--rf-volt)]">//</span>
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

