import { motion } from 'framer-motion';
import { Share2, Check } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { ScoreRing } from './ScoreRing';
import { IssueCard } from './IssueCard';
import { EmptyState } from './EmptyState';
import type { AnalysisResult, Complexity } from '../types/analysis';

interface ResultsProps {
  result: AnalysisResult | null;
  loading: boolean;
  onReset: () => void;
  language: string;
}

const COMPLEXITY_COLORS: Record<Complexity, string> = {
  low: 'var(--rf-sky)',
  medium: 'var(--rf-warn)',
  high: 'var(--rf-ember)',
  critical: 'var(--rf-ember)',
};

function getComplexityColor(complexity: Complexity): string {
  return COMPLEXITY_COLORS[complexity] || 'var(--rf-sky)';
}

function LoadingSkeleton() {
  const [loadingText, setLoadingText] = useState('Analyzing code');

  useEffect(() => {
    const texts = [
      'Scanning syntax...',
      'Building AST...',
      'Applying heuristics...',
      'Evaluating security...',
      'Generating report...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-8 select-none rf-scan"
      role="status"
      aria-busy="true"
      aria-label="Analyzing code"
    >
      <span className="sr-only">Analyzing code…</span>

      {/* Dot Matrix Loader */}
      <div className="flex flex-col items-center gap-5">
        <div className="rf-dot-loader">
          <span /><span /><span /><span /><span />
        </div>
        <span className="rf-micro-caps text-[var(--rf-mist)]/30 tracking-[0.2em] transition-all duration-300">
          {loadingText}
        </span>
      </div>

      {/* Skeleton wireframe — matches final layout to prevent CLS */}
      <div className="w-full max-w-sm space-y-4 px-2">
        <div className="w-24 h-24 rounded-full border border-[var(--rf-border)] mx-auto opacity-20" />
        <div className="h-3 bg-[var(--rf-forest)] rounded-full w-3/4 mx-auto opacity-30" />
        <div className="h-3 bg-[var(--rf-forest)] rounded-full w-1/2 mx-auto opacity-20" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-10 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] opacity-20" />
          <div className="h-10 bg-[var(--rf-forest)] border border-[var(--rf-border)] rounded-[6px] opacity-20" />
        </div>
      </div>
    </div>
  );
}


/**
 * Results panel displaying the code analysis outcome.
 * Implements the centered overview design from the Stitch refined dashboard.
 */
export const Results = memo(function Results({ result, loading, onReset, language }: ResultsProps) {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!result) {
    return <EmptyState />;
  }

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy result:', error);
    }
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth bg-opacity-5 ${loading ? 'rf-scan' : ''}`}>
      {/* Top Header Actions */}
      <div className="flex items-center justify-between pb-1 shrink-0 relative z-10">
        <div className="flex flex-col">
          <span className="rf-micro-caps text-[var(--rf-mist)]/50 font-bold">Analysis Summary</span>
          {result.latency && (
            <span className="text-[8px] font-mono text-[var(--rf-mist)]/40 uppercase tracking-tight">
              LATENCY: {(result.latency / 1000).toFixed(2)}s
            </span>
          )}
        </div>
        <button
          onClick={handleCopyResult}
          className="p-1.5 bg-[var(--rf-void)] border border-[var(--rf-border)] rounded-sm hover:border-[var(--rf-volt)]/50 hover:bg-[var(--rf-forest)] transition-all text-[var(--rf-mist)]/60 hover:text-white cursor-pointer group"
          title="Copy Report JSON"
          aria-label="Copy report as JSON"
        >
          {copied ? <Check size={12} className="text-[var(--rf-volt)]" /> : <Share2 size={12} className="group-hover:text-[var(--rf-volt)]" />}
        </button>
      </div>

      {/* Centered Overview Block */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 pb-6 border-b border-[var(--rf-border)] relative z-10">
        {/* Score Ring */}
        <ScoreRing score={result.score} />

        {/* Left-accented Summary Card */}
        <div className="w-full max-w-md bg-[var(--rf-forest)] border-l-2 border-[var(--rf-volt)] p-4 text-left border-y border-r border-[var(--rf-border)] rounded-sm shadow-2xl shadow-[var(--rf-volt)]/5">
          <p className="text-[var(--rf-mist)] text-sm leading-relaxed font-sans">{result.summary}</p>
        </div>

        {/* Metric boxes grid */}
        <div className="w-full max-w-md grid grid-cols-2 gap-4">
          {/* Complexity */}
          <div className="border border-[var(--rf-border)] p-3 text-left rounded-sm bg-[var(--rf-void)]/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="rf-micro-caps text-[var(--rf-mist)]/50">Complexity</span>
              <span
                className="bg-[var(--rf-void)] px-1.5 py-0.5 border border-hairline text-[9px] font-mono font-bold uppercase tracking-[0.12em]"
                style={{ color: getComplexityColor(result.complexity) }}
              >
                {result.complexity}
              </span>
            </div>
          </div>

          {/* Issues count */}
          <div className="border border-[var(--rf-border)] p-3 text-left rounded-sm bg-[var(--rf-void)]/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="rf-micro-caps text-[var(--rf-mist)]/50">Issues</span>
              <span className="text-[var(--rf-ember)] font-bold font-mono text-sm">{result.issues.length}</span>
            </div>
          </div>
        </div>

        {/* Clear Result trigger */}
        <button
          onClick={onReset}
          className="rf-micro-caps text-[var(--rf-mist)]/50 hover:text-[var(--rf-ember)] transition-colors pt-2 font-bold cursor-pointer underline decoration-[var(--rf-border)] underline-offset-4 hover:decoration-[var(--rf-ember)]"
        >
          Clear Result
        </button>
      </div>

      {/* Issues list detail */}
      {result.issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="space-y-3 pt-2"
        >
          <h3 className="text-[10px] font-mono tracking-widest uppercase text-[var(--rf-mist)]/50 font-semibold mb-3">Detected Issues</h3>
          {result.issues.map((issue, i) => (
            <IssueCard 
              key={`${issue.severity}-${issue.title}-${i}`} 
              issue={issue} 
              index={i} 
              language={language}
            />
          ))}
        </motion.div>
      )}

      {/* Strengths list detail */}
      {result.strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rf-card p-4 space-y-2"
        >
          <h3 className="text-[9px] font-mono tracking-widest uppercase text-[var(--rf-volt)] mb-3 font-bold">Key Strengths</h3>
          <ul className="space-y-1.5">
            {result.strengths.map((strength, i) => (
              <li key={`strength-${i}`} className="text-xs text-[var(--rf-mist)] flex gap-2">
                <span className="text-[var(--rf-volt)] font-bold font-mono">+</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Lateral Insights — AI Creativity Section */}
      {result.insights && result.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="rf-card p-4 space-y-2 border-[var(--rf-sky)]/30 bg-[var(--rf-sky)]/5"
        >
          <h3 className="text-[9px] font-mono tracking-widest uppercase text-[var(--rf-sky)] mb-3 font-bold">Architectural Insights</h3>
          <ul className="space-y-1.5">
            {result.insights.map((insight, i) => (
              <li key={`insight-${i}`} className="text-xs text-[var(--rf-mist)]/80 flex gap-2 italic">
                <span className="text-[var(--rf-sky)] font-bold font-mono">&bull;</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
});
