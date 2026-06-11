import { motion } from 'framer-motion';
import { ShieldAlert, Zap, History } from 'lucide-react';

interface ForgeAllCardProps {
  hasData: boolean;
  issuesCount: number;
  onForgeAll: () => void;
}

export function ForgeAllCard({ hasData, issuesCount, onForgeAll }: ForgeAllCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="col-span-12 lg:col-span-4 flex flex-col gap-6"
    >
      <div className={`rf-card p-6 border-2 flex flex-col justify-between ${!hasData ? 'border-[var(--rf-border)] opacity-30 grayscale' : 'border-[var(--rf-ember)] bg-[var(--rf-ember-15)]'} shadow-none h-full`}>
        <div>
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className={`${hasData ? 'text-[var(--rf-ember)]' : 'text-[var(--rf-mist)]/20'} w-6 h-6`} />
            <span className={`rf-micro-caps ${hasData ? 'text-[var(--rf-ember)]' : 'text-[var(--rf-mist)]/20'} font-bold tracking-widest`}>High_Impact_Zone</span>
          </div>
          <h3 className="text-lg font-bold rf-mono mb-2 text-[var(--rf-mist)]">FORGE_ALL_REPAIRS</h3>
          <p className="rf-code-xs text-[var(--rf-mist)]/70 mb-8 leading-relaxed">
            Automatically applies AI-suggested refactors. 
            <span className="block mt-2 font-bold text-[var(--rf-ember)]">High destructive potential.</span>
          </p>
        </div>
        
        <button 
          onClick={onForgeAll}
          disabled={!hasData || issuesCount === 0}
          className="w-full py-4 bg-[var(--rf-ember)] text-[var(--rf-void)] font-bold rf-mono text-sm uppercase flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed border-none shadow-[2px_2px_0px_var(--rf-void)]"
        >
          Execute_Forge_All <Zap size={16} />
        </button>
      </div>

      <div className="rf-card p-4 border-hairline opacity-20 shadow-none">
         <div className="flex items-center gap-2 mb-2">
           <History className="w-3 h-3" />
           <span className="rf-micro-caps text-[8px] font-bold">Session_Log</span>
         </div>
         <div className="space-y-1">
           <div className="flex justify-between rf-code-xs">
             <span>Audit_Sync</span>
             <span className={hasData ? "text-[var(--rf-volt)] font-bold" : "text-[var(--rf-mist)]/20"}>{hasData ? "OK" : "WAITING"}</span>
           </div>
           <div className="flex justify-between rf-code-xs">
             <span>Vector_Gen</span>
             <span className={hasData ? "text-[var(--rf-volt)] font-bold" : "text-[var(--rf-mist)]/20"}>{hasData ? "OK" : "WAITING"}</span>
           </div>
         </div>
      </div>
    </motion.div>
  );
}
