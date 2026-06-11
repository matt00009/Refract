import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  valueStyle?: React.CSSProperties;
}

export function MetricCard({ label, value, valueStyle }: MetricCardProps) {
  return (
    <div className="border border-[var(--rf-border)] p-3 text-left rounded-sm bg-[var(--rf-void)]/40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="rf-micro-caps text-[var(--rf-mist)]/50">{label}</span>
        <div style={valueStyle}>
          {value}
        </div>
      </div>
    </div>
  );
}
