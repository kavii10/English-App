import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Send,
  Keyboard,
  HelpCircle,
  Clock,
  StopCircle,
  Play,
  CheckCircle2,
  BookOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AIAvatarVisualizer } from './AIAvatarVisualizer';
import { TargetVocabTracker } from './TargetVocabTracker';
import { TurnAnalysisCard } from './TurnAnalysisCard';
import { RepeatModal } from './RepeatModal';
import { SessionSummaryModal } from './SessionSummaryModal';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { SpeakingTurn, TurnAnalysis, SpeakingSessionSummary } from '../../types';
import { api } from '../../services/api';

interface SpeakingScreenProps {
  initialTopic?: string;
  onSessionEnded: () => void;
  onNavigateToVocab: () => void;
}

export const SpeakingScreen: React.FC<SpeakingScreenProps> = ({
  initialTopic = 'Introduce Yourself & Share Your Daily Goals',
  onSessionEnded,
  onNavigateToVocab,
}) => {
  // Session State
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [topic, setTopic] = useState<string>(initialTopic);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [targetVocab, setTargetVocab] = useState<string[]>([]);
  const [usedVocab, setUsedVocab] = useState<string[]>([]);
  const [userWeakness, setUserWeakness] = useState<string>('Spoken Fluency');
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [turns, setTurns] = useState<SpeakingTurn[]>([]);
  const [currentAIPrompt, setCurrentAIPrompt] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [emptySpeechWarning, setEmptySpeechWarning] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<TurnAnalysis | null>(null);
  const [latestResponseId, setLatestResponseId] = useState<string>('');

  // Fallback Typing State
  const [isTypingMode, setIsTypingMode] = useState<boolean>(false);
  const [manualInputText, setManualInputText] = useState<string>('');

  // Modals
  const [repeatSentenceTarget, setRepeatSentenceTarget] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SpeakingSessionSummary | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Audio Hooks
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    setManualTranscript,
  } = useSpeechRecognition();

  const { isSpeaking, speak, stop: stopSpeaking, autoSpeak, setAutoSpeak } = useSpeechSynthesis();
  const { frequencyData } = useAudioVisualizer(isListening || isSpeaking);

  const analysisCardRef = useRef<HTMLDivElement>(null);
  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Timer for session duration
  useEffect(() => {
    if (!hasStarted) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, startTime]);

  const startNewSpeakingSession = async () => {
    setIsInitializing(true);
    setTurns([]);
    setLatestAnalysis(null);
    setAnalysisError(null);
    setTurnNumber(1);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setUsedVocab([]);

    const effectiveTopic = customTopic.trim() || topic;

    try {
      const res = await api.startConversation({
        topic: effectiveTopic,
        difficulty,
      });

      setSessionId(res.sessionId);
      setCurrentAIPrompt(res.aiPrompt);
      setTargetVocab(res.targetVocab || []);
      setUserWeakness(res.userWeakness || 'Spoken Fluency');
      setHasStarted(true);

      // Auto-speak initial question if enabled
      if (autoSpeak) {
        speak(res.aiPrompt);
      }
    } catch (err) {
      console.error('Error starting speaking session:', err);
      setCurrentAIPrompt(`Hey there! Great to talk with you. Tell me about what you've been working on lately.`);
      setHasStarted(true);
    } finally {
      setIsInitializing(false);
    }
  };

  // Submit User Speech
  const handleSubmitSpokenAnswer = async () => {
    stopListening();
    setEmptySpeechWarning(false);
    setAnalysisError(null);

    const spokenContent = (isTypingMode ? manualInputText : (transcript || interimTranscript)).trim();
    if (!spokenContent) {
      setEmptySpeechWarning(true);
      setTimeout(() => setEmptySpeechWarning(false), 4000);
      return;
    }

    setIsProcessingTurn(true);

    try {
      const res = await api.submitConversationTurn({
        sessionId,
        turnNumber,
        aiPrompt: currentAIPrompt,
        userTranscript: spokenContent,
        targetVocab,
        difficulty,
        userWeakness,
      });

      setLatestAnalysis(res.analysis);
      setLatestResponseId(res.responseId);
      resetTranscript();
      setManualInputText('');

      // Track newly matched target vocabulary words
      if (res.analysis?.vocabulary?.target_words_used?.length > 0) {
        setUsedVocab((prev) => {
          const next = new Set([...prev, ...res.analysis.vocabulary.target_words_used]);
          return Array.from(next);
        });
      }

      // Add to conversation history
      const newTurn: SpeakingTurn = {
        turnNumber,
        aiPrompt: currentAIPrompt,
        userTranscript: spokenContent,
        analysis: res.analysis,
        timestamp: new Date().toISOString(),
      };

      setTurns((prev) => [...prev, newTurn]);

      setTimeout(() => {
        analysisCardRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Error submitting speaking turn:', err);
      setAnalysisError(err?.message || 'Failed to analyze your response. Please try again.');
    } finally {
      setIsProcessingTurn(false);
    }
  };

  // Continue Conversation naturally
  const handleContinueConversation = () => {
    if (!latestAnalysis) return;
    const nextQuestion = latestAnalysis.follow_up_question || 'That sounds great! What happened next?';
    setCurrentAIPrompt(nextQuestion);
    setTurnNumber((prev) => prev + 1);
    setLatestAnalysis(null);
    resetTranscript();
    setManualInputText('');

    if (autoSpeak) {
      speak(nextQuestion);
    }
  };

  // End Session and show summary
  const handleEndSession = async () => {
    stopSpeaking();
    stopListening();
    try {
      const summary = await api.endConversation({
        sessionId,
        durationSeconds: Math.max(5, elapsedSeconds),
      });
      setSessionSummary(summary);
    } catch (err) {
      console.error('Error ending conversation:', err);
    }
  };

  const handleResetToLobby = () => {
    stopSpeaking();
    stopListening();
    setHasStarted(false);
    setSessionId('');
    setTurns([]);
    setLatestAnalysis(null);
    resetTranscript();
    setManualInputText('');
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const popularTopics = [
    'Introduce Yourself & Share Your Daily Goals',
    'College Life, Studies & Recent Challenges',
    'Career Ambitions & Job Interview Preparation',
    'Weekend Travel, Hobbies & Personal Passions',
    'Technology Trends & How AI is Changing Life',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. LOBBY VIEW: Before starting conversation */}
      {!hasStarted ? (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-8 shadow-2xl relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal AI Speaking Coach</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Practice Spoken English?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your AI coach will hold a natural spoken conversation with you, analyze your pronunciation, grammar, and fluency in real time, and teach you better ways to express your ideas.
            </p>
          </div>

          {/* Topic & Difficulty Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80">
            {/* Topic Selection */}
            <div className="space-y-3">
              <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Select Conversation Topic
              </label>
              <div className="space-y-2">
                {popularTopics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTopic(t);
                      setCustomTopic('');
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all border ${
                      topic === t && !customTopic
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Custom Topic */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        difficulty === lvl
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider mb-2">
                    Or Enter Custom Topic
                  </label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g., Preparing for my presentation..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* START BUTTON */}
              <div className="pt-4">
                <button
                  onClick={startNewSpeakingSession}
                  disabled={isInitializing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Starting Conversation...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Start AI Conversation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. LIVE CONVERSATION VIEW */
        <>
          {/* Top Session Header Bar */}
          <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-800 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-indigo-400">Live AI Conversation</span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white line-clamp-1">{topic}</h2>
              </div>
            </div>

            {/* Controls: Difficulty + Sound + STOP / END BUTTON */}
            <div className="flex items-center gap-2">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              {/* TTS Sound Toggle */}
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-xl border transition-colors ${
                  autoSpeak
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
                title={autoSpeak ? 'AI Auto-Voice ON' : 'AI Auto-Voice MUTED'}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* STOP & END CONVERSATION BUTTON */}
              <button
                onClick={handleEndSession}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
                title="Stop and end conversation"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop & End</span>
              </button>
            </div>
          </div>

          {/* Target Vocabulary Tracker */}
          <TargetVocabTracker targetVocab={targetVocab} usedVocab={usedVocab} />

          {/* AI Visualizer Stage */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center space-y-5 border border-slate-800 relative overflow-hidden">
            <AIAvatarVisualizer
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessingTurn || isInitializing}
              frequencyData={frequencyData}
            />

            {/* Current AI Prompt Dialogue Bubble */}
            <div className="relative max-w-2xl mx-auto bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 p-5 rounded-2xl border border-indigo-500/30 shadow-xl">
              <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Speaking Coach (Turn {turnNumber})</span>
                </span>
                <button
                  onClick={() => speak(currentAIPrompt)}
                  className="p-1 rounded text-indigo-300 hover:text-white"
                  title="Replay audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                "{currentAIPrompt}"
              </p>
            </div>

            {/* Processing Indicator */}
            {isProcessingTurn && (
              <div className="max-w-xl mx-auto bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-6 text-center space-y-2 animate-pulse">
                <Loader2 className="w-7 h-7 text-indigo-400 mx-auto animate-spin" />
                <h4 className="text-sm font-bold text-white">AI Coach is analyzing your spoken response...</h4>
                <p className="text-xs text-indigo-200">Evaluating grammar, vocabulary, sentence quality, and conversational naturalness.</p>
              </div>
            )}

            {/* Empty Speech Warning */}
            {emptySpeechWarning && (
              <div className="max-w-xl mx-auto bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No speech detected. Please speak into your mic or type your answer below.</span>
              </div>
            )}

            {/* Analysis Error Alert */}
            {analysisError && (
              <div className="max-w-xl mx-auto bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{analysisError}</span>
                </div>
                <button
                  onClick={handleSubmitSpokenAnswer}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live Speech Recognition Area */}
            {!latestAnalysis && !isProcessingTurn && (
              <div className="max-w-xl mx-auto space-y-4 pt-2">
                {/* Live Interim Transcript or Text fallback */}
                {!isTypingMode ? (
                  <div className="min-h-[80px] bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-center text-center">
                    {isListening ? (
                      <p className="text-sm font-medium text-indigo-200 animate-pulse">
                        {transcript || interimTranscript || 'Listening... speak naturally now...'}
                      </p>
                    ) : transcript ? (
                      <div className="space-y-1 w-full">
                        <p className="text-sm font-medium text-white">"{transcript}"</p>
                        <p className="text-[11px] text-emerald-400">Captured! Tap "Stop & Analyze Answer" to submit.</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Press <strong className="text-indigo-400">Start Speaking</strong> below and answer aloud.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={manualInputText}
                      onChange={(e) => setManualInputText(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full h-24 bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Primary Voice Action Buttons (Start Speaking / Stop & Analyze) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {!isTypingMode ? (
                    <>
                      {!isListening ? (
                        <button
                          onClick={startListening}
                          disabled={isProcessingTurn}
                          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105"
                        >
                          <Mic className="w-5 h-5" />
                          <span>{transcript ? 'Speak More / Record Again' : 'Start Speaking'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitSpokenAnswer}
                          disabled={isProcessingTurn}
                          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/40 animate-pulse transition-all transform hover:scale-105"
                        >
                          <StopCircle className="w-5 h-5" />
                          <span>Stop & Analyze Answer</span>
                        </button>
                      )}

                      {/* If finished speaking and not listening, give quick Analyze button */}
                      {!isListening && transcript && (
                        <button
                          onClick={handleSubmitSpokenAnswer}
                          disabled={isProcessingTurn}
                          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span>Analyze Spoken Answer</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleSubmitSpokenAnswer}
                      disabled={!manualInputText.trim() || isProcessingTurn}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Response</span>
                    </button>
                  )}

                  {/* Secondary End Conversation Button */}
                  <button
                    onClick={handleEndSession}
                    className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <StopCircle className="w-4 h-4 text-rose-400" />
                    <span>End Conversation</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => setIsTypingMode(!isTypingMode)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>{isTypingMode ? 'Switch to Voice Mic' : 'Switch to Keyboard Type'}</span>
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={handleResetToLobby}
                    className="text-xs text-slate-400 hover:text-slate-300 font-semibold"
                  >
                    Change Topic
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Turn Analysis Breakdown */}
          {latestAnalysis && (
            <div ref={analysisCardRef} className="pt-2">
              <TurnAnalysisCard
                analysis={latestAnalysis}
                aiPrompt={currentAIPrompt}
                turnNumber={turnNumber}
                onRepeatSentence={(sentence) => setRepeatSentenceTarget(sentence)}
                onContinueConversation={handleContinueConversation}
                onEndSession={handleEndSession}
              />
            </div>
          )}

          {/* Repeat Modal */}
          {repeatSentenceTarget && latestAnalysis && (
            <RepeatModal
              isOpen={Boolean(repeatSentenceTarget)}
              onClose={() => setRepeatSentenceTarget(null)}
              targetSentence={repeatSentenceTarget}
              attempt1Scores={{
                grammar: latestAnalysis.grammar.score,
                naturalness: latestAnalysis.naturalness.score,
                fluency: latestAnalysis.fluency.score,
                overall: latestAnalysis.overall_score,
              }}
              sessionId={sessionId}
              responseId={latestResponseId}
            />
          )}

          {/* Session Summary Modal */}
          {sessionSummary && (
            <SessionSummaryModal
              isOpen={Boolean(sessionSummary)}
              summary={sessionSummary}
              onClose={() => {
                setSessionSummary(null);
                setHasStarted(false);
                onSessionEnded();
              }}
              onNavigateToVocab={onNavigateToVocab}
              onStartNewSession={startNewSpeakingSession}
            />
          )}

          <div ref={turnsEndRef} />
        </>
      )}
    </div>
  );
};
