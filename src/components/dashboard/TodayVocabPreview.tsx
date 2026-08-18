import React, { useState } from 'react';
import { Volume2, Sparkles, BookOpen, Layers, ArrowRight, RotateCw } from 'lucide-react';
import { VocabularyItem } from '../../types';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface TodayVocabPreviewProps {
  words: VocabularyItem[];
  onOpenWordModal: (word: VocabularyItem) => void;
  onOpenVocabularyHub: () => void;
  onStartReview: () => void;
}

export const TodayVocabPreview: React.FC<TodayVocabPreviewProps> = ({
  words,
  onOpenWordModal,
  onOpenVocabularyHub,
  onStartReview,
}) => {
  const { speak } = useSpeechSynthesis();
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAudio = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    speak(text);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Daily Vocabulary</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              5 Auto-Saved Flashcards
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">Today's High-Utility Words</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStartReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spaced Review</span>
          </button>
          <button
            onClick={onOpenVocabularyHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <span>My Cards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 Vocabulary Flip Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {words.slice(0, 5).map((item) => {
          const isFlipped = Boolean(flippedCards[item.id]);

          return (
            <div
              key={item.id}
              onClick={() => onOpenWordModal(item)}
              className="perspective-1000 cursor-pointer h-48 group"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d rounded-xl transition-transform ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col justify-between shadow-md hover:shadow-indigo-500/10 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.part_of_speech}
                      </span>
                      <button
                        onClick={(e) => handleAudio(item.word, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                        title="Hear pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-black text-white capitalize mt-1 group-hover:text-indigo-300 transition-colors">
                      {item.word}
                    </h3>
                    <p className="text-[11px] font-mono text-indigo-400">{item.pronunciation}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.simple_meaning}
                    </p>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium">
                      <span>{item.category}</span>
                      <button
                        onClick={(e) => toggleFlip(item.id, e)}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Flip</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-950/90 border border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between text-left shadow-xl">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 uppercase">
                      <span>Example & Synonyms</span>
                      <button
                        onClick={(e) => toggleFlip(item.id, e)}
                        className="p-1 rounded text-indigo-300 hover:text-white"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-200 italic mt-2 line-clamp-3">
                      "{item.example_sentence}"
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.synonyms.slice(0, 3).map((syn) => (
                        <span key={syn} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700/50">
                          {syn}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-semibold mt-2 text-right">
                      Tap for details &rarr;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
