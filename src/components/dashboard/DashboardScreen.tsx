import React, { useState } from 'react';
import { ScoreOverviewCard } from './ScoreOverviewCard';
import { DailyMissionCard } from './DailyMissionCard';
import { WeaknessStrengthCard } from './WeaknessStrengthCard';
import { TodayVocabPreview } from './TodayVocabPreview';
import { RecentSessionsList } from './RecentSessionsList';
import { DailyVocabCard } from '../vocabulary/DailyVocabCard';
import { Modal } from '../common/Modal';
import { UserProfile, DailyMission, AnalyticsOverview, VocabularyItem } from '../../types';

interface DashboardScreenProps {
  user: UserProfile | null;
  mission: DailyMission | null;
  analytics: AnalyticsOverview | null;
  todayVocab: VocabularyItem[];
  recentSessions: any[];
  onStartSpeaking: () => void;
  onNavigateToTab: (tab: string) => void;
  onStartSpacedReview: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  mission,
  analytics,
  todayVocab,
  recentSessions,
  onStartSpeaking,
  onNavigateToTab,
  onStartSpacedReview,
}) => {
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Today's Mission Hero */}
      <DailyMissionCard
        user={user}
        mission={mission}
        onStartConversation={onStartSpeaking}
      />

      {/* 2. Score Overview & Pillars */}
      <ScoreOverviewCard
        analytics={analytics}
        onViewDetailedAnalytics={() => onNavigateToTab('analytics')}
      />

      {/* 3. Personalized Weakness & Strength Engine */}
      <WeaknessStrengthCard
        analytics={analytics}
        onViewWeaknesses={() => onNavigateToTab('analytics')}
      />

      {/* 4. Today's Vocabulary Preview with 3D Flip */}
      <TodayVocabPreview
        words={todayVocab}
        onOpenWordModal={(w) => setSelectedWord(w)}
        onOpenVocabularyHub={() => onNavigateToTab('vocabulary')}
        onStartReview={onStartSpacedReview}
      />

      {/* 5. Recent Speaking Sessions */}
      <RecentSessionsList
        sessions={recentSessions}
        onSelectSession={(id) => onNavigateToTab('analytics')}
        onStartNewSession={onStartSpeaking}
      />

      {/* Detailed Word Modal */}
      {selectedWord && (
        <Modal
          isOpen={Boolean(selectedWord)}
          onClose={() => setSelectedWord(null)}
          title={`Vocabulary Details: ${selectedWord.word}`}
          maxWidth="2xl"
        >
          <DailyVocabCard
            item={selectedWord}
            onClose={() => setSelectedWord(null)}
          />
        </Modal>
      )}
    </div>
  );
};
