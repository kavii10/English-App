import React from 'react';
import { MessageSquare, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ScoreBadge } from '../common/ScoreBadge';

interface RecentSessionsListProps {
  sessions: any[];
  onSelectSession: (sessionId: string) => void;
  onStartNewSession: () => void;
}

export const RecentSessionsList: React.FC<RecentSessionsListProps> = ({
  sessions,
  onSelectSession,
  onStartNewSession,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Practice History</span>
          <h2 className="text-xl font-bold text-white mt-0.5">Recent Conversations</h2>
        </div>
        <button
          onClick={onStartNewSession}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-slate-800/60">
          <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No sessions recorded yet</p>
          <p className="text-xs text-slate-500 mt-0.5">Start your first AI conversation to begin tracking!</p>
          <button
            onClick={onStartNewSession}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Start Practice
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-800/80">
          {sessions.slice(0, 4).map((s) => {
            const minutes = Math.floor((s.duration_seconds || 180) / 60);
            const seconds = (s.duration_seconds || 180) % 60;
            const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today';

            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className="py-3.5 flex items-center justify-between gap-4 group cursor-pointer hover:bg-slate-900/50 -mx-2 px-2 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {s.topic || 'English Conversation'}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {minutes}m {seconds}s
                      </span>
                      {s.target_vocab_used_count > 0 && (
                        <span className="text-purple-400 font-medium">
                          {s.target_vocab_used_count} vocab used
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ScoreBadge score={s.overall_score ?? 0} size="sm" />
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
