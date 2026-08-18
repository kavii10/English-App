import React from 'react';
import { ScoreBadge } from '../common/ScoreBadge';
import { SayItBetterTabs } from './SayItBetterTabs';
import { ColorCodedTranscript } from './ColorCodedTranscript';
import { ExecutivePitchCard } from './ExecutivePitchCard';
import { VisualStorytellerCard } from './VisualStorytellerCard';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import { TurnAnalysis } from '../../types';

interface TurnAnalysisCardProps {
  analysis: TurnAnalysis;
  aiPrompt: string;
  turnNumber: number;
  onRepeatSentence: (sentence: string) => void;
  onContinueConversation: () => void;
  onEndSession: () => void;
}

export const TurnAnalysisCard: React.FC<TurnAnalysisCardProps> = ({
  analysis,
  aiPrompt,
  turnNumber,
  onRepeatSentence,
  onContinueConversation,
  onEndSession,
}) => {
  const grammarErrors = analysis.grammar?.errors || [];
  const hasGrammarErrors = grammarErrors.length > 0;
  const fillers = analysis.fluency?.filler_words || [];
  const hasFillers = fillers.length > 0;
  const improvements = analysis.sentence_improvements || [];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Score Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Turn {turnNumber} Analysis
            </span>
            <h3 className="text-lg font-extrabold text-white mt-0.5">Response Performance</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Overall:</span>
            <ScoreBadge score={analysis.overall_score} size="lg" />
          </div>
        </div>

        {/* Sub metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Grammar</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{analysis.grammar?.score || 80}</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Vocabulary</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{analysis.vocabulary?.score || 75}</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Fluency</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{analysis.fluency?.score || 78}</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Naturalness</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{analysis.naturalness?.score || 76}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Sentence</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{analysis.sentence_formation?.score || 80}</div>
          </div>
        </div>
      </div>

      {/* 2. Live Color-Coded Subtitles */}
      {analysis.color_tokens && analysis.color_tokens.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            Speech Analysis & Highlighted Tokens:
          </span>
          <ColorCodedTranscript
            tokens={analysis.color_tokens}
            rawText={analysis.transcript}
          />
        </div>
      )}

      {/* 3. Founder & CEO Executive Pitch Card */}
      {analysis.executive_pitch && (
        <ExecutivePitchCard analysis={analysis.executive_pitch} />
      )}

      {/* 4. Visual Storyteller Card */}
      {analysis.visual_storyteller && (
        <VisualStorytellerCard analysis={analysis.visual_storyteller} />
      )}

      {/* 5. Grammar Mistakes Breakdown */}
      {hasGrammarErrors ? (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="text-sm font-extrabold">Grammar Mistakes Explained</h4>
          </div>

          <div className="space-y-3">
            {grammarErrors.map((err, idx) => (
              <div key={idx} className="bg-slate-900/90 p-4 rounded-xl border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {err.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200">
                    <span className="font-bold text-rose-400 mr-1.5">❌ You said:</span>
                    <span>"{err.mistake}"</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                    <span className="font-bold text-emerald-400 mr-1.5">✅ Correct:</span>
                    <span>"{err.correction}"</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-300 pt-1">
                  <span className="font-bold text-indigo-400 shrink-0">Reason:</span>
                  <span className="leading-relaxed">{err.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs sm:text-sm text-emerald-200 font-medium">
            <span className="font-bold">Flawless Grammar!</span> No grammatical errors were found in this response.
          </div>
        </div>
      )}

      {/* 6. Filler Word Alert */}
      {hasFillers && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="text-xs font-bold">
                Filler Words Detected ({analysis.fluency.filler_count}):
              </span>
              <span className="text-xs text-slate-300 ml-2">
                {fillers.map((f) => `"${f.word}" (${f.count}x)`).join(', ')}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-amber-300 italic max-w-sm">
            {analysis.fluency.advice}
          </p>
        </div>
      )}

      {/* 7. Say It Better (3-Tier sentence improvements) */}
      {improvements.length > 0 && (
        <SayItBetterTabs
          improvement={improvements[0]}
          onRepeatSentence={onRepeatSentence}
        />
      )}

      {/* 8. Encouragement & Follow-up Action CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          onClick={onEndSession}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors order-2 sm:order-1 text-center"
        >
          End & View Summary
        </button>

        <button
          onClick={onContinueConversation}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] order-1 sm:order-2"
        >
          <span>Continue Conversation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
