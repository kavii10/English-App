import React from 'react';
import { AlertCircle, TrendingDown, Sparkles, Volume2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FillerWordTrackerProps {
  fillerData?: any;
}

export const FillerWordTracker: React.FC<FillerWordTrackerProps> = ({ fillerData }) => {
  const data = fillerData || {
    today_filler_count: 0,
    most_frequent: 'None recorded',
    weekly_trend: [],
    breakdown: [],
    practical_advice: 'Great pacing! No frequent filler words recorded in your sessions.',
  };

  const hasFillers = data.breakdown && data.breakdown.length > 0;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
            Fluency & Pacing
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">Filler Word Detection & Analysis</h3>
        </div>

        {hasFillers ? (
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <span>{data.today_filler_count} Fillers Detected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean Pacing</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Fillers breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400">Recorded Filler Occurrences:</div>
          {hasFillers ? (
            <div className="space-y-1.5">
              {data.breakdown.slice(0, 4).map((f: any) => (
                <div
                  key={f.word}
                  className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs"
                >
                  <span className="font-bold text-slate-200">"{f.word}"</span>
                  <span className="font-mono text-amber-400 font-bold">{f.count} times</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 text-center space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-200">Zero distracting fillers detected</p>
              <p className="text-[11px] text-slate-400">SpeakWise will automatically log any hesitations as you practice.</p>
            </div>
          )}
        </div>

        {/* Practical Coaching Advice */}
        <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-indigo-950/20 border border-amber-500/30 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practical Coaching Advice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.practical_advice || 'Practice taking deliberate, relaxed 1-second breaths between clauses. A confident pause sounds much more fluent than uttering filler sounds.'}
          </p>
        </div>
      </div>
    </div>
  );
};
