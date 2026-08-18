import React, { useState } from 'react';
import {
  Volume2,
  Star,
  RotateCw,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Layers,
  Calendar,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { FlashcardItem } from '../../types';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

interface Flashcard3DProps {
  card: FlashcardItem;
  onUpdate: () => void;
  onOpenDetailModal: () => void;
}

export const Flashcard3D: React.FC<Flashcard3DProps> = ({
  card,
  onUpdate,
  onOpenDetailModal,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak } = useSpeechSynthesis();
  const { showToast } = useToast();

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(card.word || '');
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleFavoriteFlashcard(card.id);
      showToast(card.favorite ? 'Removed from favorites' : 'Added to favorites ⭐', 'info');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetStatus = async (status: 'Mastered' | 'Difficult' | 'Learning', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateFlashcardStatus(card.id, status);
      showToast(`Marked as ${status}!`, 'success');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const formattedLastReviewed = card.last_reviewed
    ? new Date(card.last_reviewed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Not yet reviewed';

  return (
    <div className="perspective-1000 h-80 w-full group">
      <div
        className={`relative w-full h-full duration-500 transform-style-3d rounded-2xl transition-transform ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT */}
        <div
          onClick={() => setIsFlipped(true)}
          className="absolute inset-0 backface-hidden bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl cursor-pointer hover:shadow-indigo-500/10 transition-all"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {card.part_of_speech || 'word'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  card.status === 'Mastered'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : card.status === 'Difficult'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {card.status}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleAudio}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Pronounce"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`p-1.5 rounded-lg transition-colors ${
                  card.favorite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Favorite"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Word Center */}
          <div className="text-center my-auto">
            <h3 className="text-2xl sm:text-3xl font-black text-white capitalize tracking-tight group-hover:text-indigo-300 transition-colors">
              {card.word}
            </h3>
            <p className="text-xs font-mono text-indigo-400 mt-1">{card.pronunciation}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-3 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
              <RotateCw className="w-3 h-3 text-indigo-400" />
              <span>Tap to reveal meaning</span>
            </span>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-medium">
            <span>Mastery: <strong className="text-emerald-400">{card.mastery_score}%</strong></span>
            <span>Used: <strong className="text-indigo-300">{card.times_used_in_conversation}x</strong></span>
          </div>
        </div>

        {/* BACK */}
        <div
          onClick={() => setIsFlipped(false)}
          className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-2xl cursor-pointer"
        >
          {/* Header */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-bold text-white uppercase">{card.word}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleAudio}
                className="p-1 rounded text-indigo-300 hover:text-white"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Meaning & Example */}
          <div className="space-y-2.5 overflow-y-auto pr-1">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meaning</div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed mt-0.5">
                {card.simple_meaning}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Example</div>
              <p className="text-[11px] text-indigo-200 italic leading-relaxed mt-0.5">
                "{card.example_sentence}"
              </p>
            </div>

            {card.synonyms && card.synonyms.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {card.synonyms.slice(0, 3).map((s) => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card Action Controls */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={(e) => handleSetStatus('Mastered', e)}
                className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Learned</span>
              </button>
              <button
                onClick={(e) => handleSetStatus('Difficult', e)}
                className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Difficult</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Last: {formattedLastReviewed}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetailModal();
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline"
              >
                Full Details &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
