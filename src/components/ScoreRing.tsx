import { memo } from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
}

/**
 * Animated SVG ring chart displaying a code analysis score (0–100).
 * Color-coded based on score values: red (<50), yellow (50–74), green (75+).
 * Matches the w-32 (377px circumference) Stitch result specification.
 */
export const ScoreRing = memo(function ScoreRing({ score }: ScoreRingProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const RADIUS = 60;
  const circumference = 2 * Math.PI * RADIUS; // ~377
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const isExcellent = normalizedScore >= 90;

  const getColor = () => {
    if (normalizedScore < 50) return 'var(--rf-ember)';
    if (normalizedScore < 75) return 'var(--rf-warn)';
    return 'var(--rf-volt)';
  };

  return (
    <div className={`relative w-32 h-32 select-none ${isExcellent ? 'rf-volt-glow' : ''}`}>
      <svg
        className="absolute inset-0 transform -rotate-90"
        viewBox="0 0 128 128"
        aria-label={`Score: ${Math.round(normalizedScore)} out of 100`}
      >
        {/* Track circle */}
        <circle cx="64" cy="64" r={RADIUS} fill="transparent" stroke="var(--rf-border)" strokeWidth="2" />
        {/* Progress circle */}
        <motion.circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="transparent"
          strokeWidth="2"
          stroke={getColor()}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-3xl font-bold font-mono ${isExcellent ? 'text-shadow-volt' : ''}`}
          style={{ color: getColor() }}
        >
          {Math.round(normalizedScore)}
        </span>
        <span className="text-[9px] font-mono tracking-widest uppercase text-[var(--rf-mist)]/40 mt-0.5">
          {isExcellent ? 'EXCELLENT' : 'SCORE'}
        </span>
      </div>
    </div>
  );
});

