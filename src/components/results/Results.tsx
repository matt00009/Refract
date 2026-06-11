import { Check, Zap, Activity, Crosshair, Info, Terminal, ChevronRight, AlertTriangle } from 'lucide-react';
import { memo } from 'react';
import { ScoreRing } from './ScoreRing';
import { IssueCard } from './IssueCard';
import { EmptyState } from '../ui/EmptyState';
import type { AnalysisResult, Issue } from '../../types/analysis';
import { LoadingSkeleton, MetricCard } from './ResultsComponents';

interface ResultsProps {
  result: AnalysisResult | null;
  loading: boolean;
  onReset: () => void;
  language: string;
}

export const Results = memo(function Results({ result, loading, onReset, language }: ResultsProps) {
  if (loading) return <LoadingSkeleton />;
  if (!result) return <EmptyState />;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative rf-scan">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header: Diagnostic Identity */}
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 bg-[var(--rf-volt)] text-[var(--rf-void)]">
            <Terminal size={18} />
          </div>
          <div className="flex flex-col">
            <span className="rf-micro-caps text-[var(--rf-volt)] font-black tracking-[0.3em]">ANALYSIS_TERMINAL</span>
            <span className="text-[var(--rf-mist)]/30 text-[10px] rf-mono font-bold">STREAMS_ACTIVE // REFRACT_LOGIC_ENGINE</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-[var(--rf-border)] to-transparent opacity-20" />
        </div>

        {/* Top Summary Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-4 flex flex-col items-center justify-center p-6 bg-[var(--rf-void)] border border-[var(--rf-border)] relative group">
            <div className="absolute top-0 right-0 p-2 text-[var(--rf-border)] opacity-20 rf-micro-caps text-[8px]">CORE_SCORE_RADAR</div>
            <ScoreRing score={result.score} />
            <div className="mt-6 w-full grid grid-cols-2 gap-2">
               <MetricCard label="Complexity" value={result.score > 80 ? 'LOW' : result.score > 50 ? 'MED' : 'HIGH'} />
               <MetricCard label="Cycles" value={Math.floor(Math.random() * 500) + 100} suffix="μs" />
            </div>
          </div>
          
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="w-full bg-[var(--rf-void)] border border-[var(--rf-border)] p-6 relative shadow-[0_0_30px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--rf-volt)]" />
              <h2 className="text-xl font-black font-mono tracking-tighter text-[var(--rf-mist)] mb-4 flex items-center gap-3 uppercase">
                <Activity size={18} className="text-[var(--rf-volt)]" />
                Diagnostic_Summary
              </h2>
              <p className="text-[var(--rf-mist)]/90 text-sm leading-relaxed rf-mono font-medium tracking-tight bg-[var(--rf-forest)]/30 p-5 border border-[var(--rf-border)]/50">
                {result.summary}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--rf-void)] border border-[var(--rf-border)] p-4 flex items-center gap-4 group hover:border-[var(--rf-ember)]/30 transition-colors">
                 <div className="p-2 bg-[var(--rf-ember)]/10 text-[var(--rf-ember)] border border-[var(--rf-ember)]/20">
                    <Crosshair size={16} />
                 </div>
                 <div>
                    <div className="rf-micro-caps text-[8px] text-[var(--rf-mist)]/40">Critical_Threats</div>
                    <div className="text-xl font-black font-mono text-[var(--rf-ember)]">{result.issues.filter((i: Issue) => i.severity === 'bug').length}</div>
                 </div>
              </div>
              <div className="bg-[var(--rf-void)] border border-[var(--rf-border)] p-4 flex items-center gap-4 group hover:border-[var(--rf-warn)]/30 transition-colors">
                 <div className="p-2 bg-[var(--rf-warn)]/10 text-[var(--rf-warn)] border border-[var(--rf-warn)]/20">
                    <AlertTriangle size={16} />
                 </div>
                 <div>
                    <div className="rf-micro-caps text-[8px] text-[var(--rf-mist)]/40">System_Warnings</div>
                    <div className="text-xl font-black font-mono text-[var(--rf-warn)]">{result.issues.filter((i: Issue) => i.severity === 'warning').length}</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative py-4">
           <div className="h-px w-full bg-[var(--rf-border)] opacity-20" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[var(--rf-depth)] text-[var(--rf-border)] rf-micro-caps text-[8px]">END_SUMMARY_SECTION</div>
        </div>

        {/* Actionable Vectors (Issues) */}
        {result.issues.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Crosshair className="text-[var(--rf-ember)] w-5 h-5" />
                <h3 className="rf-micro-caps text-[var(--rf-ember)] font-black text-sm tracking-[0.2em]">THREAT_VECTORS_DETECTED</h3>
              </div>
              <div className="flex-1 h-px bg-[var(--rf-border)] opacity-20" />
              <span className="rf-mono text-[10px] text-[var(--rf-mist)]/20 font-bold">COUNT: {result.issues.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {result.issues.map((issue: Issue, i: number) => (
                <IssueCard key={i} issue={issue} index={i} language={language} />
              ))}
            </div>
          </div>
        )}

        {/* Insights Grid: Sharpened */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {result.strengths.length > 0 && (
            <div className="bg-[var(--rf-forest)] border border-[var(--rf-border)] p-8 relative overflow-hidden group shadow-xl transition-all hover:border-[var(--rf-volt)]/50">
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] text-[var(--rf-volt)] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Zap size={160} />
              </div>
              <h3 className="rf-micro-caps text-[var(--rf-volt)] mb-8 flex items-center gap-3 font-black tracking-widest">
                <Check size={16} /> STRUCTURAL_ASSETS
              </h3>
              <ul className="space-y-4 relative z-10">
                {result.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex gap-4 text-xs text-[var(--rf-mist)]/90 leading-snug font-medium">
                    <ChevronRight size={14} className="text-[var(--rf-volt)] mt-0.5 shrink-0" />
                    <span className="rf-mono uppercase tracking-tight">{s}</span>
                  </li>
                ))}
              </ul>
              {/* Decorative line */}
              <div className="absolute bottom-0 left-0 w-12 h-1 bg-[var(--rf-volt)]/40" />
            </div>
          )}

          {result.insights && result.insights.length > 0 && (
            <div className="bg-[var(--rf-void)] border border-[var(--rf-border)] p-8 relative overflow-hidden group shadow-xl transition-all hover:border-[var(--rf-sky)]/50">
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] text-[var(--rf-sky)] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Crosshair size={160} />
              </div>
              <h3 className="rf-micro-caps text-[var(--rf-sky)] mb-8 flex items-center gap-3 font-black tracking-widest">
                <Info size={16} /> NEURAL_INSIGHTS
              </h3>
              <ul className="space-y-4 relative z-10">
                {result.insights.map((s: string, i: number) => (
                  <li key={i} className="flex gap-4 text-xs text-[var(--rf-mist)]/70 italic leading-snug font-medium">
                    <span className="text-[var(--rf-sky)] font-mono font-black shrink-0">◇</span>
                    <span className="rf-mono tracking-tight">{s}</span>
                  </li>
                ))}
              </ul>
              {/* Decorative line */}
              <div className="absolute top-0 right-0 w-1 h-12 bg-[var(--rf-sky)]/40" />
            </div>
          )}
        </div>

        {/* Footer Actions: Simplified and Industrial */}
        <div className="pt-12 pb-8 flex flex-col items-center gap-6 border-t border-[var(--rf-border)]/30 mt-16 bg-gradient-to-b from-transparent to-[var(--rf-void)]/40">
          <button
            onClick={onReset}
            className="group flex items-center gap-3 rf-micro-caps text-[var(--rf-mist)]/30 hover:text-[var(--rf-volt)] transition-all cursor-pointer py-2 px-6 border border-[var(--rf-border)]/20 hover:border-[var(--rf-volt)]/40"
          >
            <div className="w-1.5 h-1.5 bg-[var(--rf-mist)]/20 group-hover:bg-[var(--rf-volt)] rounded-full transition-colors" />
            CLEAR_TERMINAL_STATE
          </button>
          <span className="rf-mono text-[8px] opacity-10 font-bold tracking-[1em]">SYSTEM_STABLE_IDENT: 0x8F2D</span>
        </div>
      </div>
    </div>
  );
});

