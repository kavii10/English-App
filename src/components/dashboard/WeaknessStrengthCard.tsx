import React from 'react';
import { AlertTriangle, Star, ArrowUpRight, CheckCircle, BrainCircuit, Sparkles } from 'lucide-react';
import { AnalyticsOverview } from '../../types';

interface WeaknessStrengthCardProps {
  analytics: AnalyticsOverview | null;
  onViewWeaknesses: () => void;
}

export const WeaknessStrengthCard: React.FC<WeaknessStrengthCardProps> = ({
  analytics,
  onViewWeaknesses,
}) => {
  const weakness = analytics?.weakness_profile;
  const hasMistakes = (weakness as any)?.has_mistakes ?? (weakness && weakness.breakdown && weakness.breakdown.length > 0);
  const topWeakness = weakness?.top_weakness || 'No recurring weaknesses detected yet';
  const topStrength = weakness?.top_strength || 'Ready for initial diagnostic conversation';
  const recommendation = weakness?.focus_recommendation;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Weakness Card */}
      <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-950/10 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">
                {hasMistakes ? 'Current Weakness Focus' : 'Weakness Diagnostic'}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">{topWeakness}</h3>
            </div>
          </div>
          {hasMistakes && (
            <button
              onClick={onViewWeaknesses}
              className="p-1 rounded-lg text-slate-400 hover:text-amber-300 transition-colors"
              title="View mistake details"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
          {recommendation?.why || 'Complete your first speaking session so SpeakWise AI can diagnose your grammar and fluency patterns.'}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-amber-400/90">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>AI adapts next conversation to target your real weaknesses</span>
        </div>
      </div>

      {/* Current Strength Card */}
      <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-950/10 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Current Strength</span>
              <h3 className="text-base font-bold text-white leading-snug">{topStrength}</h3>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
          {hasMistakes
            ? 'Your sentence construction and vocabulary variety are tracked in real-time across every conversation turn.'
            : 'Speak naturally during your AI conversations to uncover your communication strengths!'}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-400/90">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Real-time fluency and naturalness tracking</span>
        </div>
      </div>
    </div>
  );
};
