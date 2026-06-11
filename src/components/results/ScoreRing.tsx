import { memo } from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
}

/**
 * Industrial Score Telemetry Ring.
 * Sharp, segmented aesthetic with high-density data.
 */
export const ScoreRing = memo(function ScoreRing({ score }: ScoreRingProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const RADIUS = 60;
  const circumference = 2 * Math.PI * RADIUS;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const isExcellent = normalizedScore >= 90;
  const isCritical = normalizedScore < 50;

  const getColor = () => {
    if (isCritical) return 'var(--rf-ember)';
    if (normalizedScore < 75) return 'var(--rf-warn)';
    return 'var(--rf-volt)';
  };

  return (
    <div className={`relative w-36 h-36 flex items-center justify-center ${isExcellent ? 'rf-volt-glow' : ''} ${isCritical ? 'rf-ember-glitch' : ''}`}>
      {/* Background segments for a mechanical look */}
      <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none opacity-10">
        <circle cx="72" cy="72" r={RADIUS} fill="transparent" stroke="var(--rf-mist)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>

      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 144 144"
        role="img"
        aria-label={`Score: ${Math.round(normalizedScore)} out of 100`}
      >
        <circle cx="72" cy="72" r={RADIUS} fill="transparent" stroke="var(--rf-border)" strokeWidth="4" />
        <motion.circle
          cx="72"
          cy="72"
          r={RADIUS}
          fill="transparent"
          strokeWidth="4"
          stroke={getColor()}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
          strokeLinecap="butt"
        />
        
        {/* Decorative mechanical ticks */}
        {[0, 90, 180, 270].map(angle => (
          <rect
            key={angle}
            x="71"
            y="6"
            width="2"
            height="8"
            fill="var(--rf-border)"
            transform={`rotate(${angle}, 72, 72)`}
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="flex items-baseline gap-0.5">
          <span
            className={`text-4xl font-black font-mono tracking-tighter ${isExcellent ? 'text-shadow-volt' : ''}`}
            style={{ color: getColor() }}
          >
            {Math.round(normalizedScore).toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-mono text-[var(--rf-border)] font-bold">/100</span>
        </div>
        <div className="flex flex-col items-center mt-1">
          <div className="h-px w-8 bg-[var(--rf-border)] mb-1" />
          <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-[var(--rf-mist)]/40 font-black">
            {isExcellent ? 'OPTIMIZED' : isCritical ? 'VOLATILE' : 'STABLE'}
          </span>
        </div>
      </div>
      
      {/* HUD corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--rf-border)]" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[var(--rf-border)]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[var(--rf-border)]" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--rf-border)]" />
    </div>
  );
});

