import React from 'react';
import { ScoreBadge } from '../common/ScoreBadge';
import { TrendingUp, Award, ShieldCheck, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { AnalyticsOverview } from '../../types';

interface ScoreOverviewCardProps {
  analytics: AnalyticsOverview | null;
  onViewDetailedAnalytics: () => void;
}

export const ScoreOverviewCard: React.FC<ScoreOverviewCardProps> = ({
  analytics,
  onViewDetailedAnalytics,
}) => {
  const overall = analytics?.overall_score ?? 0;
  const hasData = (analytics as any)?.has_data ?? (overall > 0);
  const weeklyDelta = analytics?.weekly_delta ?? '0';
  const sub = analytics?.sub_scores ?? {
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
    naturalness: 0,
    sentence_formation: 0,
    filler_control: 100,
  };

  const metrics = [
    { label: 'Grammar', value: sub.grammar, color: 'bg-indigo-500', weight: '25%' },
    { label: 'Vocabulary', value: sub.vocabulary, color: 'bg-purple-500', weight: '20%' },
    { label: 'Fluency', value: sub.fluency, color: 'bg-emerald-500', weight: '20%' },
    { label: 'Naturalness', value: sub.naturalness, color: 'bg-blue-500', weight: '20%' },
    { label: 'Sentence Quality', value: sub.sentence_formation, color: 'bg-amber-500', weight: '15%' },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        {/* Left: Overall Circular Score */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full lg:w-auto">
          <div className="shrink-0">
            <ScoreBadge score={overall} size="xl" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
                {hasData ? 'Speaking Proficiency' : 'Real-time Evaluation'}
              </span>
              {hasData && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  {weeklyDelta} pts
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white">Communication Score</h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {hasData
                ? 'Weighted continuously across grammar precision, vocabulary range, fluency pacing, and conversational naturalness.'
                : 'Start your first speaking practice to calculate your initial communication score.'}
            </p>
          </div>
        </div>

        {/* Right: Sub-metric Progress Bars */}
        <div className="w-full lg:w-96 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Evaluation Pillars</span>
            <button
              onClick={onViewDetailedAnalytics}
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-bold"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="bg-slate-900/70 px-3.5 py-2 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    {m.label}
                    <span className="text-[10px] text-slate-500 font-normal">({m.weight})</span>
                  </span>
                  <span className="font-bold text-white">{m.value}/100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${m.color} transition-all duration-700 rounded-full`}
                    style={{ width: `${Math.max(m.value > 0 ? 5 : 0, m.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
