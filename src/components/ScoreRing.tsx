import { memo } from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
}

export const ScoreRing = memo(function ScoreRing({ score }: ScoreRingProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const RADIUS = 45;
  const circumference = 2 * Math.PI * RADIUS;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColor = () => {
    if (normalizedScore < 50) return 'var(--rf-ember)';
    if (normalizedScore < 75) return 'var(--rf-warn)';
    return 'var(--rf-volt)';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[120px] h-[120px]">
        <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100" aria-label={`Score: ${Math.round(normalizedScore)} out of 100`}>
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--rf-border)" strokeWidth="2" />
          <motion.circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="2"
            stroke={getColor()}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-2xl font-bold rf-mono" style={{ color: getColor() }}>
              {Math.round(normalizedScore)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--rf-border)]">Score</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
});
