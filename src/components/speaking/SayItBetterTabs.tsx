import React, { useState } from 'react';
import { Volume2, Sparkles, CheckCircle, Flame, Repeat, Info } from 'lucide-react';
import { SentenceImprovement } from '../../types';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface SayItBetterTabsProps {
  improvement: SentenceImprovement;
  onRepeatSentence: (sentence: string) => void;
}

export const SayItBetterTabs: React.FC<SayItBetterTabsProps> = ({
  improvement,
  onRepeatSentence,
}) => {
  const [activeTier, setActiveTier] = useState<'natural' | 'corrected' | 'advanced'>('natural');
  const { speak } = useSpeechSynthesis();

  const getTargetSentence = () => {
    if (activeTier === 'corrected') return improvement.corrected;
    if (activeTier === 'advanced') return improvement.advanced;
    return improvement.natural;
  };

  const currentSentence = getTargetSentence();

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">Say It Better</h4>
            <p className="text-[11px] text-slate-400">Multiple ways to express your exact thought.</p>
          </div>
        </div>

        {/* 3-Tier Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => setActiveTier('corrected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTier === 'corrected'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Corrected
          </button>
          <button
            onClick={() => setActiveTier('natural')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTier === 'natural'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Natural
          </button>
          <button
            onClick={() => setActiveTier('advanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTier === 'advanced'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Your Original vs Improved Box */}
      <div className="space-y-2.5">
        {/* Original */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Your Sentence
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">"{improvement.original}"</p>
        </div>

        {/* Selected Tier Output */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 p-4 rounded-xl border border-indigo-500/40 relative">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                activeTier === 'corrected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : activeTier === 'advanced'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {activeTier === 'corrected'
                ? 'Grammatically Correct'
                : activeTier === 'advanced'
                ? 'Polished & Professional'
                : 'Most Natural & Conversational'}
            </span>

            <button
              onClick={() => speak(currentSentence)}
              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Hear sentence spoken aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>

          <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
            "{currentSentence}"
          </p>

          {/* Educational Explanation */}
          {improvement.explanation && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{improvement.explanation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Repeat Button */}
      <button
        onClick={() => onRepeatSentence(currentSentence)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <Repeat className="w-4 h-4 animate-spin-slow" />
        <span>🎙️ Try Saying This Improved Sentence (Repeat & Compare)</span>
      </button>
    </div>
  );
};
