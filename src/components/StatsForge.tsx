import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Bot, Zap, Shield, Target } from 'lucide-react';
import type { HistoryEntry, AnalysisResult } from '../types/analysis';
import { StatsForgeHeader } from './forge/StatsForgeHeader';
import { ProgressChart } from './forge/ProgressChart';
import { ForgeAllCard } from './forge/ForgeAllCard';
import { calculateTotalImprovedLines, prepareChartData } from '../lib/stats';

interface StatsForgeProps {
  onClose: () => void;
  history: HistoryEntry[];
  currentResult: AnalysisResult | null;
}

export function StatsForge({ onClose, history = [], currentResult }: StatsForgeProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const stats = useMemo(() => {
    const hasData = history.length > 0 || currentResult !== null;
    const latestScore = currentResult?.score ?? (history.length > 0 ? history[0].score : 0);
    const totalLines = calculateTotalImprovedLines(history, currentResult);
    const chartData = prepareChartData(history, currentResult);

    return {
      hasData,
      healthScore: latestScore,
      totalImprovedLines: totalLines,
      chartData,
      issuesCount: currentResult?.issues?.length ?? 0
    };
  }, [history, currentResult]);

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--rf-void)] overflow-y-auto rf-net-grid rf-crt-effect">
      {/* Background patterns */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <pattern id="industrial-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--rf-border)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="1.5" fill="var(--rf-border)" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#industrial-grid)" />
      </svg>

      <StatsForgeHeader onClose={onClose} />

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6 relative pb-24">
        {/* Metric: System Health */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 lg:col-span-4 bg-[var(--rf-surface)] border border-[var(--rf-border)] relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        >
          {/* Status corner */}
          <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center border-l border-b border-[var(--rf-border)] ${stats.healthScore >= 80 ? 'bg-[var(--rf-volt)]/10' : 'bg-[var(--rf-ember)]/10'}`}>
            <Shield className={`w-5 h-5 ${stats.healthScore >= 80 ? 'text-[var(--rf-volt)]' : 'text-[var(--rf-ember)]'}`} />
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <span className="rf-micro-caps text-[var(--rf-volt)] font-black tracking-[0.2em]">HEALTH_INDEX</span>
              <div className="h-px flex-1 bg-[var(--rf-border)] opacity-30" />
            </div>

            <div className="flex items-baseline gap-4 mb-4">
              <motion.span 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`text-8xl font-black rf-mono tracking-tighter ${!stats.hasData ? 'text-[var(--rf-border)]' : 'text-[var(--rf-mist)]'}`}
              >
                {stats.hasData ? stats.healthScore : '00'}
              </motion.span>
              <span className="text-2xl rf-micro-caps opacity-30">%</span>
            </div>

            <div className="space-y-4">
              <div className="h-1.5 w-full bg-[var(--rf-void)] border border-[var(--rf-border)] overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.healthScore}%` }}
                  transition={{ duration: 1.5, ease: 'circOut' }}
                  className={`h-full ${stats.healthScore >= 80 ? 'bg-[var(--rf-volt)] shadow-[0_0_10px_var(--rf-volt)]' : 'bg-[var(--rf-ember)]'}`}
                />
              </div>
              <p className="rf-code-xs text-[var(--rf-mist)]/50 uppercase leading-relaxed tracking-wider">
                {stats.hasData ? `Security_Integrity: ${stats.healthScore >= 80 ? 'HIGH' : 'COMPROMISED'}` : 'System_Idle: Awaiting telemetry data.'}
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--rf-border)] to-transparent opacity-20" />
        </motion.div>

        {/* Metric: Lines Forged */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 md:col-span-6 lg:col-span-4 bg-[var(--rf-surface)] border border-[var(--rf-border)] p-8 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-3 mb-8">
            <span className="rf-micro-caps text-[var(--rf-sky)] font-black tracking-[0.2em]">FORGE_OUTPUT</span>
            <div className="h-px flex-1 bg-[var(--rf-border)] opacity-30" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            {stats.totalImprovedLines.toString().padStart(5, '0').split('').map((num, i) => (
              <div key={i} className={`bg-[var(--rf-void)] border border-[var(--rf-border)] w-12 h-16 flex items-center justify-center ${!stats.hasData ? 'opacity-20' : 'opacity-100'}`}>
                <span className="text-4xl font-black rf-mono text-[var(--rf-sky)]">{num}</span>
              </div>
            ))}
            {stats.hasData && (
              <div className="flex flex-col ml-2">
                <span className="text-[var(--rf-volt)] font-black rf-mono text-sm leading-none">+12.4%</span>
                <span className="rf-micro-caps text-[8px] opacity-40">VELOCITY</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--rf-void)]/40 border border-[var(--rf-border)]">
            <Target className="w-4 h-4 text-[var(--rf-volt)]" />
            <span className="rf-code-xs text-[var(--rf-volt)] font-bold tracking-tight">PRECISION_STRIKE_ENABLED</span>
          </div>
          
          <Bot className="absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] -rotate-12" />
        </motion.div>

        {/* Metric: AI Status */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 md:col-span-6 lg:col-span-4 bg-[var(--rf-forest)] border border-[var(--rf-border)] p-8 relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-3 mb-8">
            <span className="rf-micro-caps text-[var(--rf-mist)] font-black tracking-[0.2em]">NEURAL_STATUS</span>
            <div className="h-px flex-1 bg-[var(--rf-border)] opacity-30" />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 ${stats.hasData ? 'bg-[var(--rf-volt)] shadow-[0_0_8px_var(--rf-volt)]' : 'bg-[var(--rf-border)]'}`} />
              <span className="rf-mono font-black text-xl text-[var(--rf-mist)] tracking-tighter">
                {stats.hasData ? 'GEMINI_CORE_V3' : 'ENGINE_OFFLINE'}
              </span>
            </div>

            <div className="p-4 bg-[var(--rf-void)]/60 border-l-4 border-[var(--rf-volt)]">
              <p className="rf-code-xs text-[var(--rf-mist)]/80 leading-relaxed font-medium">
                {stats.hasData 
                  ? `Active deep-tracing on ${stats.issuesCount} logic vectors. Sub-routine "Refract" is optimizing structural entropy.`
                  : 'Core engine standby. Feed code into the forge to initialize neural pattern recognition.'}
              </p>
            </div>
            
            <div className="flex gap-1.5 opacity-30">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-4 w-1 bg-[var(--rf-volt)]" />
              ))}
            </div>
          </div>

          <Activity className="absolute right-4 top-4 w-12 h-12 opacity-10 text-[var(--rf-volt)]" />
        </motion.div>

        {/* Chart Section */}
        <div className="col-span-12">
          <ProgressChart hasData={!!stats.hasData} chartData={stats.chartData} />
        </div>

        {/* Action Card */}
        <div className="col-span-12">
          <ForgeAllCard 
            hasData={!!stats.hasData} 
            issuesCount={stats.issuesCount} 
            onForgeAll={() => setShowConfirm(true)} 
          />
        </div>
      </main>

      {/* Confirmation Modal: Sharpened */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--rf-void)]/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-xl w-full bg-[var(--rf-surface)] border-2 border-[var(--rf-ember)] p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle size={80} className="text-[var(--rf-ember)]" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-[var(--rf-ember)] text-[var(--rf-void)]">
                  <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black rf-mono text-[var(--rf-mist)] uppercase tracking-tight">System_Override_Warning</h2>
              </div>
              
              <div className="p-6 bg-[var(--rf-void)] border border-[var(--rf-border)] mb-10 relative">
                <div className="absolute -left-1 top-4 w-2 h-8 bg-[var(--rf-ember)]" />
                <p className="rf-code-sm italic text-[var(--rf-mist)]/90 leading-relaxed font-bold uppercase tracking-wide">
                  "Neural automation will reconstruct your logic. This operation is non-reversible. 
                  Passive learning yields lower retention than manual intervention."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="py-4 bg-[var(--rf-ember)] text-[var(--rf-void)] font-black rf-mono uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_20px_rgba(255,144,112,0.3)]"
                >
                  Confirm_Execution
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="py-4 border-2 border-[var(--rf-border)] rf-mono uppercase text-sm font-black hover:bg-[var(--rf-forest)] text-[var(--rf-mist)]/60 hover:text-[var(--rf-mist)] transition-all cursor-pointer"
                >
                  Abort_Operation
                </button>
              </div>
              
              <div className="mt-8 flex justify-center">
                <span className="rf-micro-caps text-[var(--rf-mist)]/20 tracking-[0.5em]">PROTOCOL_LEVEL_4_AUTH_REQUIRED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-12 p-12 border-t border-[var(--rf-border)] flex flex-col items-center gap-4 bg-[var(--rf-depth)]">
        <div className="flex gap-12 opacity-40">
           <span className="rf-micro-caps">REFRACT_OS_v2.5.0</span>
           <span className="rf-micro-caps">CORE_TEMP: 42°C</span>
           <span className="rf-micro-caps">MEM_ALLOC: 4.2GB</span>
        </div>
        <div className="h-px w-64 bg-gradient-to-r from-transparent via-[var(--rf-volt)] to-transparent opacity-20" />
      </footer>
    </div>
  );
}

