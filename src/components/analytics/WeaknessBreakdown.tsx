import React from 'react';
import { AlertTriangle, BrainCircuit, ArrowRight, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { AnalyticsOverview } from '../../types';

interface WeaknessBreakdownProps {
  weaknessProfile: AnalyticsOverview['weakness_profile'] | undefined;
  onStartTargetedPractice: () => void;
}

export const WeaknessBreakdown: React.FC<WeaknessBreakdownProps> = ({
  weaknessProfile,
  onStartTargetedPractice,
}) => {
  const breakdown = weaknessProfile?.breakdown || [
    {
      category: 'Verb Tense',
      count: 14,
      latest_mistake: 'I meet my friends yesterday.',
      latest_correction: 'I met my friends yesterday.',
      latest_explanation: 'Use the past tense "met" when describing events that happened in the past.',
    },
    {
      category: 'Prepositions',
      count: 9,
      latest_mistake: 'We discussed about the project.',
      latest_correction: 'We discussed the project.',
      latest_explanation: '"Discuss" takes a direct object without "about".',
    },
    {
      category: 'Articles',
      count: 7,
      latest_mistake: 'I went to college without the bag.',
      latest_correction: 'I went to college without my bag / a bag.',
      latest_explanation: 'Use indefinite article "a" or possessive pronoun "my".',
    },
    {
      category: 'Subject-Verb Agreement',
      count: 4,
      latest_mistake: 'Every students was happy.',
      latest_correction: 'Every student was happy.',
      latest_explanation: '"Every" is followed by singular countable noun "student".',
    },
  ];

  const recommendation = weaknessProfile?.focus_recommendation || {
    focus_title: 'Past Tense & Narrative Consistency',
    why: 'You made 14 past-tense slips in recent sessions. Practicing past experiences will solidify correct irregular verbs.',
    mission_topic: 'A project or trip you accomplished recently',
    suggested_starter: 'Tell me about something you did last weekend.',
  };

  return (
    <div className="space-y-6">
      {/* 1. Daily AI Recommendation Engine Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Personal Weakness Engine
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Daily AI Recommendation: {recommendation.focus_title}
              </h3>
            </div>
          </div>

          <button
            onClick={onStartTargetedPractice}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <span>Target This Weakness</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div>
            <span className="font-bold text-amber-400">Why? </span>
            <span className="text-slate-200">{recommendation.why}</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80">
            <span className="font-bold text-indigo-300">Suggested Practice Mission: </span>
            <span className="text-slate-300 italic">"{recommendation.suggested_starter}"</span>
          </div>
        </div>

        <button
          onClick={onStartTargetedPractice}
          className="sm:hidden w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
        >
          <span>Target This Weakness in Conversation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Mistake Frequency Table & Samples */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
            Grammar Mistake Catalog
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">Recurring Weaknesses Tracked</h3>
        </div>

        <div className="space-y-3">
          {breakdown.map((item, idx) => (
            <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {item.category}
                </span>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  {item.count} mistakes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded bg-rose-950/30 border border-rose-500/20 text-rose-300">
                  <span className="font-bold mr-1">Sample:</span>
                  <span>"{item.latest_mistake}"</span>
                </div>
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                  <span className="font-bold mr-1">Correction:</span>
                  <span>"{item.latest_correction}"</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-0.5">
                <strong className="text-slate-300">Guideline:</strong> {item.latest_explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
