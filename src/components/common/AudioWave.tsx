import React from 'react';

interface AudioWaveProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  bars?: number[];
  color?: 'indigo' | 'emerald' | 'purple' | 'rose';
  size?: 'sm' | 'md' | 'lg';
}

export const AudioWave: React.FC<AudioWaveProps> = ({
  isListening = false,
  isSpeaking = false,
  bars,
  color = 'indigo',
  size = 'md',
}) => {
  const active = isListening || isSpeaking;
  const barCount = size === 'sm' ? 8 : (size === 'lg' ? 24 : 16);

  const defaultBars = Array.from({ length: barCount }, (_, i) => {
    if (!active) return 12;
    // organic sine wave pattern if real frequencies not passed
    return Math.max(15, Math.min(95, Math.sin(i * 0.5 + Date.now() / 300) * 40 + 55));
  });

  const displayBars = bars && bars.length >= barCount ? bars.slice(0, barCount) : defaultBars;

  const colorMap = {
    indigo: 'bg-indigo-500 shadow-indigo-500/50',
    emerald: 'bg-emerald-500 shadow-emerald-500/50',
    purple: 'bg-purple-500 shadow-purple-500/50',
    rose: 'bg-rose-500 shadow-rose-500/50',
  };

  const heightClasses = {
    sm: 'h-6 gap-1',
    md: 'h-12 gap-1.5',
    lg: 'h-20 gap-2',
  };

  return (
    <div className={`flex items-center justify-center ${heightClasses[size]}`}>
      {displayBars.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-100 ease-out ${
            active ? colorMap[color] : 'bg-slate-700'
          }`}
          style={{
            height: `${active ? height : 15}%`,
            opacity: active ? 0.7 + (height / 100) * 0.3 : 0.3,
          }}
        />
      ))}
    </div>
  );
};
