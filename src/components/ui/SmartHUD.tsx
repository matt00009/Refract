import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Cpu, Activity, Zap } from 'lucide-react';

const TIPS = [
  { id: 1, type: 'security', icon: Shield, text: "RLS_CHECK: Ensure 'authenticated' role is strictly limited on your Supabase tables.", color: 'var(--rf-ember)' },
  { id: 2, type: 'performance', icon: Zap, text: "MEMO_ADVISORY: Use React.memo() on results list to avoid redundant DOM updates.", color: 'var(--rf-sky)' },
  { id: 3, type: 'ux', icon: Activity, text: "HICK_LAW_VOID: Too many options in SettingsModal. Consider progressive disclosure.", color: 'var(--rf-volt)' },
  { id: 4, type: 'audit', icon: Terminal, text: "TYPE_SAFETY_ALERT: Found 3 implicit 'any' in src/lib/api.ts. Audit required.", color: 'var(--rf-warn)' },
  { id: 5, type: 'system', icon: Cpu, text: "NEURAL_LINK_ESTABLISHED: AI Assistant ready for deep-trace refactoring.", color: 'var(--rf-volt)' },
  { id: 6, type: 'design', icon: Zap, text: "BRUTALIST_INTEGRITY: Maintain 0.5px hairlines for maximum industrial precision.", color: 'var(--rf-mist)' },
];

export function SmartHUD({ loading }: { loading: boolean }) {
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentTip((prev) => (prev + 1) % TIPS.length);
          setIsVisible(true);
        }, 500);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (loading) {
      setIsVisible(true);
    }
  }, [loading]);

  const tip = TIPS[currentTip];
  const Icon = loading ? Cpu : tip.icon;

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none select-none">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className="flex items-center gap-4 bg-[var(--rf-void)]/80 backdrop-blur-md border border-[var(--rf-border)] p-3 pr-6 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] rf-scan"
          >
            <div 
              className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--rf-border)] bg-[var(--rf-forest)] relative"
              style={{ color: loading ? 'var(--rf-volt)' : tip.color }}
            >
              <Icon className={`${loading ? 'animate-spin' : ''} w-5 h-5`} />
              {loading && (
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-[var(--rf-volt)] border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="rf-micro-caps text-[var(--rf-mist)]/40 font-black">
                  {loading ? 'ANALYZING_FLUX' : `SYSTEM_ADVISORY_0${tip.id}`}
                </span>
                {!loading && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 h-1 bg-[var(--rf-volt)]/20 rounded-full" />
                    ))}
                  </div>
                )}
              </div>
              <p className="rf-code-xs font-bold text-[var(--rf-mist)] tracking-tight whitespace-nowrap overflow-hidden">
                {loading ? (
                  <GlitchText text="DEEP_TRACING_LOGIC_VECTORS..." />
                ) : (
                  tip.text
                )}
              </p>
            </div>

            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--rf-volt)]/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--rf-volt)]/40" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GlitchText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$%&';
    const interval = setInterval(() => {
      setDisplayText(text.split('').map((char) => {
        if (char === ' ') return char;
        if (Math.random() > 0.9) return chars[Math.floor(Math.random() * chars.length)];
        return char;
      }).join(''));
    }, 100);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayText}</span>;
}
