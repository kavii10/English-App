import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ScoreBadge } from '../common/ScoreBadge';
import {
  Trophy,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Zap,
} from 'lucide-react';
import { SpeakingSessionSummary } from '../../types';

interface SessionSummaryModalProps {
  summary: SpeakingSessionSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVocab: () => void;
  onStartNewSession: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  summary,
  isOpen,
  onClose,
  onNavigateToVocab,
  onStartNewSession,
}) => {
  useEffect(() => {
    if (isOpen && summary) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [isOpen, summary]);

  if (!isOpen || !summary) return null;

  const minutes = Math.floor((summary.durationSeconds || 180) / 60);
  const seconds = (summary.durationSeconds || 180) % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden z-10 space-y-6 animate-scaleUp">
        {/* Top Celebration Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/30">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Conversation Complete 🎉</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Great speaking session! Here is your personalized communication recap.
          </p>
        </div>

        {/* Score & Duration Summary Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Overall Score</div>
            <div className="text-xl font-extrabold text-indigo-400 mt-0.5">{summary.overallScore}/100</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{minutes}m {seconds}s</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Vocab Used</div>
            <div className="text-xl font-extrabold text-purple-400 mt-0.5">{summary.targetVocabUsed}/5</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Fillers Spoken</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{summary.fillerWordsCount}</div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              <span>Your Strengths</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {summary.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improve next */}
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Improve Next</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {summary.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tomorrow's Focus Box */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 p-4 rounded-2xl border border-indigo-500/30 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
            Tomorrow's Adaptive Focus
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-200">
            {summary.tomorrowsFocus || "Tomorrow we'll focus on past tense scenarios and natural sentence formation."}
          </p>
        </div>

        {/* Modal CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors text-center"
          >
            Go to Home
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateToVocab();
            }}
            className="w-full sm:w-1/3 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Review Flashcards</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onStartNewSession();
            }}
            className="w-full sm:w-1/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 text-center flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Speak Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
