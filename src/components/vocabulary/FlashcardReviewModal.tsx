import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, CheckCircle2, RotateCw, X, Award, ChevronRight } from 'lucide-react';
import { FlashcardItem } from '../../types';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

interface FlashcardReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: FlashcardItem[];
  onReviewComplete: () => void;
}

export const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({
  isOpen,
  onClose,
  flashcards,
  onReviewComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const { speak } = useSpeechSynthesis();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const currentCard = flashcards[currentIndex];

  const handleGrade = async (grade: 1 | 2 | 3 | 4) => {
    if (!currentCard) return;

    try {
      await api.reviewFlashcard(currentCard.id, grade);
      setReviewedCount((prev) => prev + 1);

      if (currentIndex + 1 < flashcards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsFinished(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving review grade', 'error');
    }
  };

  const handleFinish = () => {
    onReviewComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden z-10 space-y-5 animate-scaleUp">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Spaced Repetition Review</h3>
              <p className="text-[11px] text-slate-400">SM-2 Memory Scheduling Algorithm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isFinished && currentCard ? (
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span className="text-purple-400 font-bold">
                {Math.round(((currentIndex + 1) / flashcards.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              />
            </div>

            {/* Flashcard Body */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                  {currentCard.part_of_speech || 'word'}
                </span>
                <button
                  onClick={() => speak(currentCard.word || '')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white capitalize">
                {currentCard.word}
              </h2>
              <p className="text-xs font-mono text-indigo-400">{currentCard.pronunciation}</p>

              {/* Revealed Details */}
              {isRevealed ? (
                <div className="pt-4 border-t border-slate-800 text-left space-y-3 animate-fadeIn">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meaning</div>
                    <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-0.5">
                      {currentCard.simple_meaning}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Example</div>
                    <p className="text-xs text-indigo-200 italic mt-0.5">
                      "{currentCard.example_sentence}"
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsRevealed(true)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Show Meaning & Example</span>
                </button>
              )}
            </div>

            {/* SRS Recall Grade Buttons */}
            {isRevealed ? (
              <div className="space-y-2 animate-fadeIn">
                <div className="text-[11px] text-center text-slate-400 font-semibold">
                  How easily did you recall this word?
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleGrade(1)}
                    className="py-3 px-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-center transition-colors"
                  >
                    <div className="text-xs font-black">Again</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">&lt; 1d</div>
                  </button>

                  <button
                    onClick={() => handleGrade(2)}
                    className="py-3 px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-center transition-colors"
                  >
                    <div className="text-xs font-black">Hard</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">1d</div>
                  </button>

                  <button
                    onClick={() => handleGrade(3)}
                    className="py-3 px-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-center transition-colors"
                  >
                    <div className="text-xs font-black">Good</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">3d</div>
                  </button>

                  <button
                    onClick={() => handleGrade(4)}
                    className="py-3 px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center transition-colors"
                  >
                    <div className="text-xs font-black">Easy</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">7d+</div>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Finished Screen */
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white">Review Session Complete! 🎉</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
              You reviewed {reviewedCount} flashcards. Intervals and mastery scores have been updated based on your recall accuracy.
            </p>
            <button
              onClick={handleFinish}
              className="mt-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Back to Vocabulary Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
