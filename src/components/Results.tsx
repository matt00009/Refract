import { motion } from 'framer-motion';
import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { ScoreRing } from './ScoreRing';
import { IssueCard } from './IssueCard';
import { EmptyState } from './EmptyState';
import type { AnalysisResult } from '../types/analysis';

interface ResultsProps {
  result: AnalysisResult | null;
  loading: boolean;
  onReset: () => void;
}

function getComplexityColor(complexity: string): string {
  const colors: Record<string, string> = {
    low: 'var(--rf-sky)',
    medium: 'var(--rf-warn)',
    high: 'var(--rf-ember)',
    critical: 'var(--rf-ember)',
  };
  return colors[complexity] || 'var(--rf-sky)';
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary bar */}
      <div className="h-5 bg-[var(--rf-forest)] rounded-full w-3/4" />

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--rf-forest)] rounded-[10px] h-32" />
        <div className="bg-[var(--rf-forest)] rounded-[10px] h-32" />
        <div className="bg-[var(--rf-forest)] rounded-[10px] h-32" />
      </div>

      {/* Issues */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--rf-forest)] rounded-[10px] h-16" />
        ))}
      </div>
    </div>
  );
}

export function Results({ result, loading, onReset }: ResultsProps) {
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

  const handleCopyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth">
      {/* Summary Header */}
      <div className="flex items-center justify-between border-b border-[var(--rf-border)] pb-4 shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-[var(--rf-border)] font-bold">Analysis Report</span>
        <button
          onClick={onReset}
          className="text-[10px] uppercase tracking-widest text-[var(--rf-ember)] hover:opacity-70 transition-opacity font-bold"
        >
          Clear Result
        </button>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start justify-between gap-4"
      >
        <h2 className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--rf-volt)' }}>
          {result.summary}
        </h2>
        <button
          onClick={handleCopyResult}
          className="p-1.5 bg-[var(--rf-depth)] border border-[var(--rf-border)] rounded-md hover:bg-[var(--rf-surface)] transition-all text-[var(--rf-mist)]"
          title="Copy Report JSON"
        >
          {copied ? <Check size={14} className="text-[var(--rf-volt)]" /> : <Share2 size={14} />}
        </button>
      </motion.div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rf-card p-4 flex justify-center will-change-transform">
          <ScoreRing score={result.score} />
        </motion.div>

        {/* Complexity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rf-card p-4 flex flex-col items-center justify-center will-change-transform">
          <div className="text-xs uppercase tracking-wider text-[var(--rf-border)] mb-2">Complexity</div>
          <div
            className="px-3 py-1.5 rf-badge"
            style={{ backgroundColor: getComplexityColor(result.complexity), color: 'var(--rf-void)' }}
          >
            {result.complexity.charAt(0).toUpperCase() + result.complexity.slice(1)}
          </div>
        </motion.div>

        {/* Issues count */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rf-card p-4 flex flex-col items-center justify-center will-change-transform">
          <div className="text-xs uppercase tracking-wider text-[var(--rf-border)] mb-2">Issues</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--rf-volt)' }}>
            {result.issues.length}
          </div>
        </motion.div>
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3 will-change-[opacity]">
          <h3 className="text-xs uppercase tracking-wider text-[var(--rf-border)]">Issues</h3>
          {result.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </motion.div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="rf-card p-4 space-y-2 will-change-[opacity]">       
          <h3 className="text-xs uppercase tracking-wider text-[var(--rf-volt)] mb-3">Strengths</h3>
          <ul className="space-y-1">
            {result.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-[var(--rf-mist)] flex gap-2">
                <span className="text-[var(--rf-volt)]">+</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
