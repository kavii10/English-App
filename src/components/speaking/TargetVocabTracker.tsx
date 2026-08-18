import React from 'react';
import { Sparkles, Check } from 'lucide-react';

interface TargetVocabTrackerProps {
  targetVocab: string[];
  usedVocab: string[];
}

export const TargetVocabTracker: React.FC<TargetVocabTrackerProps> = ({
  targetVocab,
  usedVocab,
}) => {
  const usedCount = usedVocab.length;
  const totalCount = targetVocab.length || 5;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-200">
            Target Vocabulary Used:{' '}
            <span className="text-purple-400 font-extrabold">{usedCount}/{totalCount}</span>
          </span>
          <p className="text-[11px] text-slate-400">Naturally weave these words into your spoken answers.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {targetVocab.map((word) => {
          const isUsed = usedVocab.some((w) => w.toLowerCase() === word.toLowerCase());

          return (
            <span
              key={word}
              className={`text-xs px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1 transition-all ${
                isUsed
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-bold shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {isUsed && <Check className="w-3 h-3 text-emerald-400" />}
              <span>{word}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
