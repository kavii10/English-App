import React from 'react';

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProgress?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  label,
  size = 'md',
  showProgress = false,
}) => {
  const rounded = Math.round(score);

  const getColor = (val: number) => {
    if (val === 0) return { text: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700', stroke: '#475569' };
    if (val >= 85) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', stroke: '#10b981' };
    if (val >= 75) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', stroke: '#6366f1' };
    if (val >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', stroke: '#f59e0b' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', stroke: '#f43f5e' };
  };

  const colors = getColor(rounded);

  if (size === 'xl') {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = rounded === 0 ? circumference : circumference - (rounded / 100) * circumference;

    return (
      <div className="relative inline-flex flex-col items-center justify-center">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-800 dark:text-slate-800/80"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {rounded === 0 ? '--' : rounded}
          </span>
          <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">/ 100</span>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      {label && <span className="text-[11px] font-semibold text-slate-400">{label}:</span>}
      <span>{rounded === 0 ? '--' : `${rounded}/100`}</span>
    </span>
  );
};
