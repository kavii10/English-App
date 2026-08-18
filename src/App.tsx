import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { MobileTabBar } from './components/layout/Sidebar';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { SpeakingScreen } from './components/speaking/SpeakingScreen';
import { VocabularyScreen } from './components/vocabulary/VocabularyScreen';
import { AnalyticsScreen } from './components/analytics/AnalyticsScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { FlashcardReviewModal } from './components/vocabulary/FlashcardReviewModal';
import { ToastProvider } from './components/common/Toast';
import { useTheme } from './hooks/useTheme';
import { UserProfile, DailyMission, AnalyticsOverview, VocabularyItem, FlashcardItem } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [todayVocab, setTodayVocab] = useState<VocabularyItem[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<FlashcardItem[]>([]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  const { theme, toggleTheme } = useTheme();

  const loadAllData = useCallback(async () => {
    try {
      const [userRes, missionRes, analyticsRes, vocabRes, sessionsRes, flashcardsRes] = await Promise.all([
        api.getUserProfile(),
        api.getTodayMission(),
        api.getAnalyticsOverview(),
        api.getTodayVocabulary(),
        api.getRecentSessions('usr_default', 6),
        api.getFlashcards('All'),
      ]);

      setUser(userRes.user);
      setMission(missionRes);
      setAnalytics(analyticsRes);
      setTodayVocab(vocabRes.words || []);
      setRecentSessions(sessionsRes.sessions || []);
      setAllFlashcards(flashcardsRes.flashcards || []);
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors duration-300">
        {/* Top Navbar */}
        <Navbar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onStartSpeaking={() => setActiveTab('speaking')}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              user={user}
              mission={mission}
              analytics={analytics}
              todayVocab={todayVocab}
              recentSessions={recentSessions}
              onStartSpeaking={() => setActiveTab('speaking')}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onStartSpacedReview={() => setIsReviewOpen(true)}
            />
          )}

          {activeTab === 'speaking' && (
            <SpeakingScreen
              initialTopic={mission?.topic || 'College Life & Personal Goals'}
              onSessionEnded={() => {
                loadAllData();
                setActiveTab('dashboard');
              }}
              onNavigateToVocab={() => {
                loadAllData();
                setActiveTab('vocabulary');
              }}
            />
          )}

          {activeTab === 'vocabulary' && (
            <VocabularyScreen
              todayVocab={todayVocab}
              onRefreshTodayVocab={loadAllData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsScreen
              analytics={analytics}
              onStartTargetedPractice={() => setActiveTab('speaking')}
            />
          )}
        </main>

        {/* Mobile Navigation Bottom Bar */}
        <MobileTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Global Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onDataReset={loadAllData}
        />

        {/* Spaced Repetition Review Modal */}
        {isReviewOpen && (
          <FlashcardReviewModal
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            flashcards={allFlashcards}
            onReviewComplete={loadAllData}
          />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
