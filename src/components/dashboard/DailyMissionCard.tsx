import React from 'react';
import { Target, Mic, Sparkles, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { DailyMission, UserProfile } from '../../types';

interface DailyMissionCardProps {
  user: UserProfile | null;
  mission: DailyMission | null;
  onStartConversation: () => void;
}

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({
  user,
  mission,
  onStartConversation,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const title = mission?.title || 'Introduce yourself and share your daily goals with your AI coach';
  const isCompleted = mission?.completed;
  const targetVocab = mission?.target_vocabulary || [];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border border-slate-800 p-6 sm:p-8 shadow-xl">
      {/* Decorative ambient lights */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Header Tag */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {getGreeting()}, {user?.name || 'Learner'}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Completed Today
              </span>
            )}
          </div>

          {/* Mission Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>
          </div>

          {/* Clean metadata badge */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 font-medium">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Daily Conversational Mission</span>
            </span>
            {targetVocab.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>5 Target Words Integrated</span>
              </span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={onStartConversation}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 transition-all transform hover:scale-[1.02] active:scale-95 group"
          >
            <Mic className="w-4 h-4 text-white" />
            <span>{isCompleted ? 'Practice Another Topic' : 'Start Speaking'}</span>
            <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
