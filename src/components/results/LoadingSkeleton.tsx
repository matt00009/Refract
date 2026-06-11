import { useState, useEffect } from 'react';

export function LoadingSkeleton() {
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
