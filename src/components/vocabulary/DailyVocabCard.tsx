import React, { useState } from 'react';
import { Volume2, Sparkles, Check, Send, AlertCircle, BookOpen, Star, HelpCircle } from 'lucide-react';
import { VocabularyItem } from '../../types';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

interface DailyVocabCardProps {
  item: VocabularyItem;
  onClose?: () => void;
}

export const DailyVocabCard: React.FC<DailyVocabCardProps> = ({ item, onClose }) => {
  const { speak } = useSpeechSynthesis();
  const { showToast } = useToast();

  const [userSentence, setUserSentence] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const handleEvaluateSentence = async () => {
    if (!userSentence.trim() || !item.flashcard?.id) return;
    setIsEvaluating(true);

    try {
      const res = await api.practiceFlashcardSentence(item.flashcard.id, userSentence.trim());
      setEvaluationResult(res.evaluation);
      showToast('Sentence evaluated by AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to evaluate sentence', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              {item.part_of_speech}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {item.difficulty}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white capitalize">{item.word}</h2>
            <button
              onClick={() => speak(item.word)}
              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors"
              title="Pronounce word"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm font-mono text-indigo-400 mt-0.5">{item.pronunciation}</p>
        </div>

        {item.flashcard && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Mastery</span>
            <div className="text-lg font-black text-emerald-400">{item.flashcard.mastery_score}%</div>
            <div className="text-[10px] text-slate-400">Used: {item.flashcard.times_used_in_conversation}x</div>
          </div>
        )}
      </div>

      {/* Meanings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Simple Meaning
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {item.simple_meaning}
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Contextual Usage
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {item.contextual_meaning}
          </p>
        </div>
      </div>

      {/* Example Sentence with Audio */}
      <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30 space-y-2">
        <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
          <span>Example in Real Conversation:</span>
          <button
            onClick={() => speak(item.example_sentence)}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-white"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Listen</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm font-medium text-white italic">
          "{item.example_sentence}"
        </p>
      </div>

      {/* Synonyms & Antonyms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Synonyms
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.synonyms.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {item.antonyms.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Antonyms
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.antonyms.map((a) => (
                <span
                  key={a}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Practice Your Own Sentence with AI Coach */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Create Your Sentence
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">AI Coach will grade your sentence</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            placeholder={`Write a sentence using "${item.word}"...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleEvaluateSentence}
            disabled={!userSentence.trim() || isEvaluating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isEvaluating ? 'Evaluating...' : 'Check'}</span>
          </button>
        </div>

        {/* Evaluation Output */}
        {evaluationResult && (
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 animate-fadeIn text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">
                Score: {evaluationResult.score}/100
              </span>
              <span className="text-slate-400">
                {evaluationResult.is_valid ? '✅ Correct Usage' : '⚠️ Needs Adjustment'}
              </span>
            </div>
            <p className="text-slate-200">{evaluationResult.feedback}</p>
            {evaluationResult.better_alternative && (
              <div className="pt-2 border-t border-slate-800 text-slate-400">
                <span className="text-indigo-300 font-semibold">Alternative: </span>
                <span>"{evaluationResult.better_alternative}"</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
