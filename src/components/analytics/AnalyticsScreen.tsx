import React, { useState, useEffect } from 'react';
import { ScoreTrendChart } from './ScoreTrendChart';
import { WeaknessBreakdown } from './WeaknessBreakdown';
import { FillerWordTracker } from './FillerWordTracker';
import { VocabMasteryProgress } from './VocabMasteryProgress';
import { ScoreBadge } from '../common/ScoreBadge';
import {
  BarChart3,
  Clock,
  MessageSquare,
  Flame,
  Award,
  Zap,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { AnalyticsOverview } from '../../types';
import { api } from '../../services/api';

interface AnalyticsScreenProps {
  analytics: AnalyticsOverview | null;
  onStartTargetedPractice: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  analytics,
  onStartTargetedPractice,
}) => {
  const [trends, setTrends] = useState<any[]>([]);
  const [fillerStats, setFillerStats] = useState<any>(null);
  const [vocabStats, setVocabStats] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trendRes, fillerRes, vocabRes] = await Promise.all([
          api.getScoreTrends(),
          api.getFillerStats(),
          api.getVocabMasteryStats(),
        ]);
        setTrends(trendRes.trends || []);
        setFillerStats(fillerRes);
        setVocabStats(vocabRes);
      } catch (err) {
        console.error('Error loading analytics sub-data:', err);
      }
    };
    loadData();
  }, []);

  const stats = analytics?.speaking_stats || {
    total_sessions: 0,
    total_speaking_seconds: 0,
    total_speaking_time_formatted: '0m 0s',
    total_words_spoken: 0,
    words_per_minute: 0,
    total_sentences_improved: 0,
    total_target_vocab_used: 0,
    streak_days: 0,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
            Performance Analytics & Growth
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Communication Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Real-time multi-dimensional evaluation of your spoken fluency, grammar accuracy, vocabulary richness, and sentence naturalness.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shrink-0">
          <ScoreBadge score={analytics?.overall_score ?? 0} size="xl" />
        </div>
      </div>

      {/* Speaking Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Time Spoken</span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {stats.total_speaking_time_formatted}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Conversations</span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {stats.total_sessions}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Speaking Speed</span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {stats.words_per_minute} <span className="text-xs text-slate-400 font-normal">WPM</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Streak</span>
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {stats.streak_days} <span className="text-xs text-slate-400 font-normal">Days</span>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <ScoreTrendChart trends={trends} />

      {/* Personal Weakness Engine */}
      <WeaknessBreakdown
        weaknessProfile={analytics?.weakness_profile}
        onStartTargetedPractice={onStartTargetedPractice}
      />

      {/* Filler Word Tracker */}
      <FillerWordTracker fillerData={fillerStats} />

      {/* Vocabulary Mastery Funnel */}
      <VocabMasteryProgress stats={vocabStats} />
    </div>
  );
};
