import React from 'react';
import { ExecutivePitchAnalysis } from '../../types';
import { Briefcase, TrendingUp, ShieldCheck, Zap, AlertTriangle, CheckCircle2, ArrowRight, Award } from 'lucide-react';

interface ExecutivePitchCardProps {
  analysis: ExecutivePitchAnalysis;
}

export const ExecutivePitchCard: React.FC<ExecutivePitchCardProps> = ({ analysis }) => {
  const presence = analysis.executive_presence_score || 80;
  const clarity = analysis.vision_clarity_score || 82;
  const persuasion = analysis.persuasiveness_score || 78;

  const weakPhrases = analysis.weak_phrases_detected || [];
  const powerWordsUsed = analysis.founder_power_words_used || [];
  const recommendedPowerWords = analysis.founder_power_words_recommended || [];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border border-indigo-500/30 p-5 sm:p-6 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              Founder & CEO Leadership Diagnostic
            </span>
            <h3 className="text-lg font-extrabold text-white">Executive Pitch Scorecard</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Executive Presence</div>
            <div className="text-xl font-black text-emerald-400">{presence}/100</div>
          </div>
        </div>
      </div>

      {/* 3 Executive Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Executive Presence</span>
            <span className="font-bold text-white">{presence}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${presence}%` }} />
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Vision Clarity</span>
            <span className="font-bold text-white">{clarity}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${clarity}%` }} />
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Persuasiveness</span>
            <span className="font-bold text-white">{persuasion}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${persuasion}%` }} />
          </div>
        </div>
      </div>

      {/* Investor Readiness Verdict */}
      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-indigo-300">Investor Readiness Verdict:</div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            "{analysis.investor_readiness_verdict}"
          </p>
        </div>
      </div>

      {/* Weak Language vs Strong Founder Language Table */}
      {weakPhrases.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Eliminate Weak Language & Upgrade to CEO Authority:</span>
          </div>

          <div className="space-y-2">
            {weakPhrases.map((wp, idx) => (
              <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-rose-400 font-mono">
                    <span className="font-bold mr-1">Timid:</span>
                    <span className="line-through">"{wp.original}"</span>
                  </div>
                  <div className="text-emerald-400 font-bold font-mono">
                    <span className="mr-1">&rarr; CEO:</span>
                    <span>"{wp.strong_alternative}"</span>
                  </div>
                </div>
                {wp.why && <p className="text-[11px] text-slate-400">{wp.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Founder Power Words */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Zap className="w-4 h-4" />
            <span>Founder Power Vocabulary Used ({powerWordsUsed.length}):</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {powerWordsUsed.length > 0 ? (
            powerWordsUsed.map((pw) => (
              <span
                key={pw}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono"
              >
                ✓ {pw}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">
              No commercial founder power words detected yet. Try integrating words like "scalability", "competitive moat", or "strategic alignment".
            </span>
          )}
        </div>
      </div>

      {/* Leadership Advice */}
      {analysis.leadership_feedback && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <span className="font-bold text-purple-400 shrink-0">CEO Tip:</span>
          <span>{analysis.leadership_feedback}</span>
        </div>
      )}
    </div>
  );
};
