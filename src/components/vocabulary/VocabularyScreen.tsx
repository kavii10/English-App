import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Layers,
  Search,
  Filter,
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard3D } from './Flashcard3D';
import { DailyVocabCard } from './DailyVocabCard';
import { FlashcardReviewModal } from './FlashcardReviewModal';
import { Modal } from '../common/Modal';
import { VocabularyItem, FlashcardItem } from '../../types';
import { api } from '../../services/api';

interface VocabularyScreenProps {
  todayVocab: VocabularyItem[];
  onRefreshTodayVocab: () => void;
}

export const VocabularyScreen: React.FC<VocabularyScreenProps> = ({
  todayVocab,
  onRefreshTodayVocab,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFlashcards(filter, search);
      setFlashcards(res.flashcards || []);
    } catch (err) {
      console.error('Error loading flashcards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [filter, search]);

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    setGenerationNotice(null);
    try {
      const res = await api.generateMoreVocabulary();
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        setGenerationNotice(res.message || '5 new vocabulary words generated and stored for future review!');
        await loadFlashcards();
        onRefreshTodayVocab();
        setActiveTab('all');
        setTimeout(() => setGenerationNotice(null), 5000);
      }
    } catch (err: any) {
      console.error('Failed to generate more vocabulary:', err);
      setGenerationNotice(err.message || 'Failed to generate vocabulary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const categories = ['All', 'New', 'Learning', 'Mastered', 'Difficult', 'Favorites'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-purple-400">
              Vocabulary & Memory Vault
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Spaced Repetition Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Daily Vocabulary & Flashcards</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Every introduced word is automatically stored as an interactive flashcard. Practice pronunciation, review on spaced intervals, and master them in real conversations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleGenerateMore}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white text-xs sm:text-sm font-extrabold border border-purple-500/30 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>AI Generating Words...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Generate More Vocabulary</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-purple-600/20 transition-all transform hover:scale-105"
          >
            <Layers className="w-4 h-4" />
            <span>Start Spaced Review</span>
          </button>
        </div>
      </div>

      {/* Generation Success Toast / Alert */}
      {generationNotice && (
        <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-2xl flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{generationNotice}</span>
          </div>
          <button
            onClick={() => setGenerationNotice(null)}
            className="text-purple-400 hover:text-purple-200 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabs Switcher: Today's 5 vs All Flashcards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today's 5 Words
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Vocabulary Vault ({flashcards.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'all' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words or meanings..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <button
            onClick={handleGenerateMore}
            disabled={isGenerating}
            className="sm:hidden flex items-center justify-center p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold"
            title="Generate More Words with AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Today's 5 Words */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayVocab.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedWord(item)}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {item.part_of_speech}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{item.category}</span>
                  </div>
                  <h3 className="text-xl font-black text-white capitalize">{item.word}</h3>
                  <p className="text-xs font-mono text-indigo-400 mt-0.5">{item.pronunciation}</p>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {item.simple_meaning}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">
                    Mastery: {item.flashcard?.mastery_score || 0}%
                  </span>
                  <span className="text-indigo-400 font-bold hover:text-indigo-300">
                    Practice Sentence &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: All Flashcards with SRS Categories */}
      {activeTab === 'all' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Flashcard 3D Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading flashcards...</div>
          ) : flashcards.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No flashcards matching "{filter}" category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {flashcards.map((card) => (
                <Flashcard3D
                  key={card.id}
                  card={card}
                  onUpdate={loadFlashcards}
                  onOpenDetailModal={() => {
                    setSelectedWord({
                      id: card.vocabulary_id || card.id,
                      word: card.word || '',
                      pronunciation: card.pronunciation || '',
                      part_of_speech: card.part_of_speech || '',
                      simple_meaning: card.simple_meaning || '',
                      contextual_meaning: card.contextual_meaning || '',
                      example_sentence: card.example_sentence || '',
                      synonyms: card.synonyms || [],
                      antonyms: card.antonyms || [],
                      difficulty: (card.difficulty as any) || 'Intermediate',
                      category: (card.category as any) || 'Communication',
                      flashcard: card,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Review Modal */}
      {isReviewModalOpen && (
        <FlashcardReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          flashcards={flashcards}
          onReviewComplete={() => {
            loadFlashcards();
            onRefreshTodayVocab();
          }}
        />
      )}
    </div>
  );
};
