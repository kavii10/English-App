import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mic, Volume2, Sparkles, TrendingUp, CheckCircle, RotateCw, X, Award } from 'lucide-react';
import { ScoreBadge } from '../common/ScoreBadge';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { RepeatComparisonResult } from '../../types';
import { api } from '../../services/api';

interface RepeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSentence: string;
  attempt1Scores: { grammar: number; naturalness: number; fluency: number; overall: number };
  sessionId: string;
  responseId?: string;
}

export const RepeatModal: React.FC<RepeatModalProps> = ({
  isOpen,
  onClose,
  targetSentence,
  attempt1Scores,
  sessionId,
  responseId = '',
}) => {
  const { isListening, transcript, startListening, stopListening, resetTranscript, setManualTranscript } = useSpeechRecognition();
  const { speak } = useSpeechSynthesis();

  const [isProcessing, setIsProcessing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<RepeatComparisonResult | null>(null);
  const [repeatAttempts, setRepeatAttempts] = useState(1);
  const [typedFallback, setTypedFallback] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetTranscript();
      setComparisonResult(null);
      setTypedFallback('');
      setIsTyping(false);
    }
  }, [isOpen, resetTranscript]);

  if (!isOpen) return null;

  const handleStopAndCompare = async () => {
    stopListening();
    const spokenText = (typedFallback || transcript).trim();
    if (!spokenText) return;

    setIsProcessing(true);
    try {
      const res = await api.submitRepeatComparison({
        sessionId,
        responseId,
        targetSentence,
        attempt1Scores,
        attempt2Transcript: spokenText,
      });

      setComparisonResult(res.comparison);
      setRepeatAttempts((prev) => prev + 1);

      if (res.comparison.improved) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error in repeat compare:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    resetTranscript();
    setComparisonResult(null);
    setTypedFallback('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Repeat & Compare System</h3>
              <p className="text-[11px] text-slate-400">Practice saying the polished sentence aloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Sentence Box */}
        <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/50 p-5 rounded-2xl border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
              Target Sentence to Repeat:
            </span>
            <button
              onClick={() => speak(targetSentence)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-white transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Audio</span>
            </button>
          </div>
          <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
            "{targetSentence}"
          </p>
        </div>

        {/* Step: Not yet compared */}
        {!comparisonResult && (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-slate-300">
              Press the microphone and repeat the sentence clearly.
            </p>

            {/* Microphone / Record Button */}
            {!isTyping ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={isListening ? handleStopAndCompare : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform shadow-2xl ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse scale-110 shadow-rose-500/50'
                      : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:scale-105 shadow-indigo-500/30'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>
                <span className="text-xs font-bold text-slate-300">
                  {isListening ? '🔴 Recording... Click to Compare' : '🎙️ Tap to Speak'}
                </span>
              </div>
            ) : (
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-slate-300">Type what you said:</label>
                <textarea
                  value={typedFallback}
                  onChange={(e) => setTypedFallback(e.target.value)}
                  placeholder="Type the repeated sentence here..."
                  className="w-full h-20 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Spoken live transcript */}
            {(transcript || typedFallback) && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Repeated Audio:</div>
                <p className="text-xs text-indigo-200 font-medium">"{typedFallback || transcript}"</p>
              </div>
            )}

            {/* Toggle typing fallback */}
            <div className="flex justify-center">
              <button
                onClick={() => setIsTyping(!isTyping)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                {isTyping ? 'Switch to Microphone' : 'Keyboard typing fallback'}
              </button>
            </div>

            {/* Submit button when typing or stopped */}
            {isTyping && typedFallback && (
              <button
                onClick={handleStopAndCompare}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                {isProcessing ? 'Analyzing repeat...' : 'Compare Attempt'}
              </button>
            )}
          </div>
        )}

        {/* Step: Comparison Results */}
        {comparisonResult && (
          <div className="space-y-4 animate-fadeIn">
            {/* Praise banner */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl text-center space-y-1">
              <div className="text-sm font-extrabold text-emerald-300 flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>{comparisonResult.praise}</span>
              </div>
              <p className="text-xs text-slate-300">
                {comparisonResult.ai_feedback || 'Your repetition significantly improved sentence structure and flow.'}
              </p>
            </div>

            {/* Side by side comparison table */}
            <div className="grid grid-cols-2 gap-3">
              {/* Attempt 1 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Attempt 1 (Original)
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Grammar:</span>
                    <span className="font-bold text-white">{comparisonResult.attempt1.grammar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Naturalness:</span>
                    <span className="font-bold text-white">{comparisonResult.attempt1.naturalness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fluency:</span>
                    <span className="font-bold text-white">{comparisonResult.attempt1.fluency}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-slate-200">
                    <span>Overall:</span>
                    <span className="text-indigo-400">{comparisonResult.attempt1.overall}</span>
                  </div>
                </div>
              </div>

              {/* Attempt 2 */}
              <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/40 space-y-2">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Attempt 2 (Repeat)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    +{comparisonResult.deltas.overall} pts
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-200">
                  <div className="flex justify-between">
                    <span>Grammar:</span>
                    <span className="font-bold text-emerald-400">
                      {comparisonResult.attempt2.grammar}{' '}
                      <span className="text-[10px]">
                        ({comparisonResult.deltas.grammar >= 0 ? '+' : ''}{comparisonResult.deltas.grammar})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Naturalness:</span>
                    <span className="font-bold text-emerald-400">
                      {comparisonResult.attempt2.naturalness}{' '}
                      <span className="text-[10px]">
                        ({comparisonResult.deltas.naturalness >= 0 ? '+' : ''}{comparisonResult.deltas.naturalness})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fluency:</span>
                    <span className="font-bold text-emerald-400">
                      {comparisonResult.attempt2.fluency}{' '}
                      <span className="text-[10px]">
                        ({comparisonResult.deltas.fluency >= 0 ? '+' : ''}{comparisonResult.deltas.fluency})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-500/30 font-bold text-white">
                    <span>Overall:</span>
                    <span className="text-emerald-300 font-extrabold">{comparisonResult.attempt2.overall}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRetry}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Try Once More</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
              >
                Done & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
