import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface ProgressChartProps {
  hasData: boolean;
  chartData: number[];
}

export function ProgressChart({ hasData, chartData }: ProgressChartProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="col-span-12 lg:col-span-8 rf-card p-0 overflow-hidden shadow-none"
    >
      <div className="p-4 border-b border-[var(--rf-border)] flex justify-between items-center bg-[var(--rf-void)]/50">
        <span className="rf-micro-caps text-[var(--rf-mist)]/60 font-bold flex items-center gap-2">
          <BarChart3 className="w-3 h-3" /> Improvement_History
        </span>
        <div className="flex gap-2">
          <span className="rf-badge lowercase font-normal text-[var(--rf-mist)]/60 bg-transparent border-none p-0 mr-2">quality_index</span>
          <span className="rf-badge lowercase font-bold text-[var(--rf-volt)] bg-[var(--rf-volt-10)]">pts_{chartData.filter(v => v > 0).length}</span>
        </div>
      </div>
      <div className="h-[240px] p-6 relative bg-[var(--rf-void)]/20">
         {!hasData && (
           <div className="absolute inset-0 flex items-center justify-center z-10">
             <span className="rf-micro-caps text-[var(--rf-mist)]/20 text-[10px] tracking-[0.2em] font-bold">NO_HISTORICAL_DATA_FOUND</span>
           </div>
         )}
         <svg className={`w-full h-full ${!hasData && 'opacity-5'}`} viewBox="0 0 800 200" preserveAspectRatio="none">
           {[0, 1, 2, 3].map(i => (
             <line key={i} x1="0" y1={i * 66} x2="800" y2={i * 66} stroke="var(--rf-border)" strokeWidth="0.5" strokeDasharray="2 4" />
           ))}
           {hasData && (
             <path 
              d={chartData.reduce((acc, score, i) => {
                const y = 200 - (score * 2);
                if (i === 0) return `M 0 ${y} L 200 ${y}`;
                return `${acc} V ${y} L ${(i + 1) * 200} ${y}`;
              }, '')}
              fill="none"
              stroke="var(--rf-volt)"
              strokeWidth="2"
             />
           )}
           {hasData && (
             <path 
              d={chartData.reduce((acc, score, i) => {
                const y = 200 - (score * 2);
                if (i === 0) return `M 0 ${y} L 200 ${y}`;
                return `${acc} V ${y} L ${(i + 1) * 200} ${y}`;
              }, '') + ' V 200 H 0 Z'}
              fill="url(#gradient-volt)"
              className="opacity-5"
             />
           )}
           <defs>
             <linearGradient id="gradient-volt" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="var(--rf-volt)" />
               <stop offset="100%" stopColor="transparent" />
             </linearGradient>
           </defs>
         </svg>
         <div className="absolute inset-x-6 bottom-4 flex justify-between rf-micro-caps text-[8px] text-[var(--rf-mist)]/30 font-bold">
           <span>P_01</span>
           <span>P_02</span>
           <span>P_03</span>
           <span>P_04</span>
           <span>Current</span>
         </div>
      </div>
    </motion.div>
  );
}
