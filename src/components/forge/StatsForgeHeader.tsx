import { Cpu, X } from 'lucide-react';

interface StatsForgeHeaderProps {
  onClose: () => void;
}

export function StatsForgeHeader({ onClose }: StatsForgeHeaderProps) {
  return (
    <header className="sticky top-0 bg-[var(--rf-void)] border-b-2 border-[var(--rf-border)] px-8 py-5 flex items-center justify-between z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[var(--rf-volt)] text-[var(--rf-void)] relative group">
          <Cpu className="w-6 h-6 animate-pulse" />
          <div className="absolute -inset-1 border border-[var(--rf-volt)]/50 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="rf-mono text-2xl font-black tracking-tighter text-[var(--rf-mist)] leading-none mb-1">
              FORGE_<span className="text-[var(--rf-volt)]">CONTROL</span>_v2.5
            </h1>
            <div className="px-1.5 py-0.5 border border-[var(--rf-volt)] text-[var(--rf-volt)] rf-micro-caps text-[8px] animate-pulse">
              LIVE_LINK
            </div>
          </div>
          <p className="rf-micro-caps text-[var(--rf-mist)]/30 leading-none font-bold tracking-[0.2em]">
            NEURAL_DIAGNOSTICS // AUTOMATED_LOGIC_SYNTHESIS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end">
           <span className="rf-micro-caps text-[var(--rf-mist)]/20 text-[8px]">CONNECTION_STABILITY</span>
           <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-1 w-4 ${i < 5 ? 'bg-[var(--rf-volt)]' : 'bg-[var(--rf-border)]'}`} />
              ))}
           </div>
        </div>
        
        <button 
          onClick={onClose}
          className="group relative h-10 px-6 bg-[var(--rf-forest)] border border-[var(--rf-border)] hover:border-[var(--rf-volt)] transition-all flex items-center gap-2 overflow-hidden cursor-pointer"
        >
          <span className="rf-micro-caps text-[var(--rf-mist)]/60 group-hover:text-[var(--rf-volt)] transition-colors font-black">EXIT_FORGE</span>
          <X className="w-4 h-4 text-[var(--rf-mist)]/40 group-hover:text-[var(--rf-volt)] transition-colors" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[var(--rf-volt)] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
        </button>
      </div>
    </header>
  );
}

