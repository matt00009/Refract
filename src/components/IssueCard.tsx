import { useState, memo } from 'react';
import { ChevronDown, AlertCircle, AlertTriangle, Lightbulb, Copy, Check, XCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Issue } from '../types/analysis';

interface IssueCardProps {
  issue: Issue;
  index: number;
}

/** Severity-specific display configuration (color, icon, label). */
const SEVERITY_CONFIG = {
  bug: { color: 'var(--rf-ember)', icon: AlertCircle, label: 'Bug' },
  warning: { color: 'var(--rf-warn)', icon: AlertTriangle, label: 'Warning' },
  suggestion: { color: 'var(--rf-sky)', icon: Lightbulb, label: 'Suggestion' },
} as const;

/**
 * A lightweight synchronous regex-based syntax highlighter for issue code snippets.
 * Colorizes const, let, function, try, catch, and strings to match Refract's Void Monospace aesthetic.
 */
function highlightRegex(code: string): string {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const placeholders: string[] = [];

  // 1. Comments
  escaped = escaped.replace(/(\/\/.*|#.*)/g, (match) => {
    const placeholder = `___TOKEN_COMMENT_${placeholders.length}___`;
    placeholders.push(`<span style="color: var(--rf-border); font-style: italic;">${match}</span>`);
    return placeholder;
  });

  // 2. Strings
  escaped = escaped.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, (match) => {
    const placeholder = `___TOKEN_STRING_${placeholders.length}___`;
    placeholders.push(`<span style="color: var(--rf-sky);">${match}</span>`);
    return placeholder;
  });

  // 3. Keywords
  const keywords = /\b(const|let|var|function|try|catch|class|import|export|from|return|if|else|for|while|def|fn|struct|impl|mut|pub|func|go|chan|select|interface|type|public|private|protected|async|await)\b/g;
  escaped = escaped.replace(keywords, `<span style="color: var(--rf-volt); font-weight: 500;">$1</span>`);

  // 4. Constants / Types
  const constants = /\b(true|false|null|undefined|nil|void|any|unknown|string|number|boolean)\b/g;
  escaped = escaped.replace(constants, `<span style="color: var(--rf-warn);">$1</span>`);

  // Restore placeholders
  for (let i = placeholders.length - 1; i >= 0; i--) {
    escaped = escaped.replace(new RegExp(`___TOKEN_(COMMENT|STRING)_${i}___`, 'g'), placeholders[i]);
  }

  return escaped;
}

/**
 * Expandable card displaying a single code review issue.
 * Shows a dual-panel layout: "VULNERABLE CODE" vs "SECURE FIX" side-by-side,
 * plus description and resolution methodology bullets.
 * Matches the Stitch "Advanced Code Repair Dashboard" design.
 */
export const IssueCard = memo(function IssueCard({ issue, index }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.suggestion;
  const Icon = config.icon;
  const contentId = `issue-content-${index}`;

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

  const rawVulnerable = issue.vulnerable_code || null;
  const rawFix = issue.fix_code || issue.fix || null;
  const hasDualPanel = !!(rawVulnerable || rawFix);

  const displayVulnerable = rawVulnerable ? highlightRegex(ensureCode(rawVulnerable)) : null;
  const displayFix = rawFix ? highlightRegex(ensureCode(rawFix)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-lg overflow-hidden group"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[#1A2621] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} style={{ color: config.color, flexShrink: 0 }} />
          <div>
            <div className="font-bold text-sm text-[var(--rf-mist)]">{issue.title}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--rf-mist)]/40 mt-0.5">
              {config.label}{issue.line ? ` · Line ${issue.line}` : ''}
            </div>
          </div>
        </div>

        <ChevronDown
          size={16}
          className="flex-shrink-0 text-[var(--rf-mist)]/40 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[var(--rf-border)]">
              {/* Description */}
              <p className="text-sm text-[var(--rf-mist)] leading-relaxed pt-3">{issue.description}</p>

              {/* Dual-panel: Vulnerable Code / Secure Fix */}
              {hasDualPanel && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Vulnerable Code panel */}
                  <div className="rounded-[6px] bg-[rgba(255,144,112,0.02)] border border-[rgba(255,144,112,0.15)] overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-[rgba(255,144,112,0.15)] flex items-center gap-2">
                      <XCircle size={12} className="text-[var(--rf-ember)] shrink-0" />
                      <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--rf-ember)] font-semibold">
                        CODE VULNÉRABLE
                      </span>
                    </div>
                    <div className="p-3 overflow-x-auto diff-scrollbar">
                      <pre className="text-[11px] font-mono leading-[1.6] text-[var(--rf-mist)]/80 whitespace-pre">
                        <code dangerouslySetInnerHTML={{ __html: displayVulnerable ?? '// N/A' }} />
                      </pre>
                    </div>
                  </div>

                  {/* Secure Fix panel */}
                  <div className="rounded-[6px] bg-[rgba(168,255,62,0.01)] border border-[rgba(168,255,62,0.20)] overflow-hidden group/fix relative">
                    <div className="px-3 py-1.5 border-b border-[rgba(168,255,62,0.20)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-[var(--rf-volt)] shrink-0" />
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--rf-volt)] font-semibold">
                          CORRECTIF SÉCURISÉ
                        </span>
                      </div>
                      {rawFix && (
                        <button
                          onClick={handleCopyFix}
                          aria-label="Copy fix to clipboard"
                          className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider uppercase bg-[rgba(168,255,62,0.1)] text-[var(--rf-volt)] hover:bg-[var(--rf-volt)] hover:text-[var(--rf-void)] px-2.5 py-1 rounded-full border border-[rgba(168,255,62,0.3)] transition-all cursor-pointer shadow-sm hover:scale-105 opacity-100 sm:opacity-0 group-hover/fix:opacity-100"
                        >
                          {copied ? <Check size={10} className="stroke-[3]" /> : <Copy size={10} />}
                          <span>{copied ? 'Copié' : 'Copier'}</span>
                        </button>
                      )}
                    </div>
                    <div className="p-3 overflow-x-auto diff-scrollbar">
                      <pre className="text-[11px] font-mono leading-[1.6] text-[var(--rf-volt)]/80 whitespace-pre">
                        <code dangerouslySetInnerHTML={{ __html: displayFix ?? '// Aucun correctif disponible' }} />
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution methodology */}
              {displayBullets.length > 0 && (
                <div className="mt-4 p-4 rounded-[6px] border border-[var(--rf-border)] bg-[rgba(8,11,15,0.3)] font-mono text-[11px] leading-relaxed">
                  <div className="text-[10px] tracking-widest uppercase text-[var(--rf-volt)] mb-3 font-semibold rf-micro-caps">
                    MÉTHODOLOGIE DE RÉSOLUTION :
                  </div>
                  <ul className="space-y-2">
                    {displayBullets.map((bullet, i) => (
                      <li key={i} className="flex gap-2 text-[var(--rf-mist)]/80">
                        <span className="text-[var(--rf-volt)] select-none">•</span>
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
