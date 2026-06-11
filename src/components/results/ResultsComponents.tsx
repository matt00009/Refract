import { Activity } from 'lucide-react';

export function LoadingSkeleton() {
  const loadingText = 'INITIALIZING_DEEP_TRACE';
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 select-none rf-scan">
      <div className="relative group">
        <div className="w-56 h-56 rounded-full border border-[var(--rf-border)] border-t-[var(--rf-volt)] animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-[var(--rf-border)] border-b-[var(--rf-sky)] animate-[spin_3s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-10 h-10 text-[var(--rf-volt)] animate-pulse" />
        </div>
        {/* Radar sweep effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--rf-volt)]/5 to-transparent rounded-full animate-[spin_4s_linear_infinite]" />
      </div>
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="rf-dot-loader">
          <span /><span /><span /><span /><span />
        </div>
        <div className="flex flex-col items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--rf-volt)] font-black">
            {loadingText}
          </p>
          <p className="font-mono text-[8px] uppercase tracking-widest text-[var(--rf-mist)]/20 mt-2">
            STREAMS_ACTIVE // NEURAL_HANDSHAKE
          </p>
        </div>
      </div>
    </div>
  );
}

export function MetricCard({ label, value, prefix = '', suffix = '' }: { label: string, value: number | string, prefix?: string, suffix?: string }) {
  return (
    <div className="bg-[var(--rf-void)] border border-[var(--rf-border)] p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[var(--rf-volt)]/30 transition-colors">
      <div className="absolute top-0 right-0 w-8 h-8 opacity-10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M21 3V21H3" />
        </svg>
      </div>
      <span className="rf-micro-caps text-[var(--rf-mist)]/40 group-hover:text-[var(--rf-volt)] transition-colors z-10 tracking-widest">{label}</span>
      <div className="text-3xl font-black font-mono tracking-tighter text-[var(--rf-mist)] z-10 mt-2">
        {prefix}<span className="text-[var(--rf-mist)] group-hover:text-[var(--rf-volt)] transition-colors">{value}</span>{suffix}
      </div>
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-[var(--rf-border)] group-hover:bg-[var(--rf-volt)] transition-colors" />
    </div>
  );
}

