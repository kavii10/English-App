import React from 'react';
import { BookOpen, Layers, CheckCircle2, MessageSquare, Award } from 'lucide-react';

interface VocabMasteryProgressProps {
  stats?: any;
}

export const VocabMasteryProgress: React.FC<VocabMasteryProgressProps> = ({ stats }) => {
  const data = stats || {
    total_words: 15,
    total_times_used_in_conversation: 8,
    categories: {
      New: 6,
      Learning: 5,
      Mastered: 4,
      Difficult: 0,
    },
    mastery_percentage: 65,
  };

  const cats = data.categories || { New: 6, Learning: 5, Mastered: 4, Difficult: 0 };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-purple-400">
            Vocabulary Mastery Funnel
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">Spaced Repetition Status</h3>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400">Mastery Index: </span>
          <span className="text-sm font-black text-emerald-400">{data.mastery_percentage}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase">New Cards</div>
          <div className="text-2xl font-black text-white mt-1">{cats.New || 0}</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs font-bold text-indigo-400 uppercase">Learning</div>
          <div className="text-2xl font-black text-indigo-300 mt-1">{cats.Learning || 0}</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs font-bold text-emerald-400 uppercase">Mastered</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{cats.Mastered || 0}</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center">
          <div className="text-xs font-bold text-purple-400 uppercase">Used in Dialogue</div>
          <div className="text-2xl font-black text-purple-300 mt-1">
            {data.total_times_used_in_conversation}x
          </div>
        </div>
      </div>
    </div>
  );
};
