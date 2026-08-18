import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  StopCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Clock,
  Loader2,
  Flame,
} from 'lucide-react';
import { useHandsFreeVoice, VoicePhase } from '../../hooks/useHandsFreeVoice';
import { HandsFreeMasterDiagnostic } from '../../types';
import { api } from '../../services/api';
import { ScoreBadge } from '../common/ScoreBadge';

interface HandsFreeScreenProps {
  userId?: string;
  onSessionEnded: () => void;
}

interface DialogueTurn {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const PRESET_TOPICS = [
  {
    title: '🚀 Founder & Startup Strategy',
    description: 'Brainstorming startup business models, customer acquisition, and market scale.',
    topic: 'Pitching and brainstorming my new AI startup idea and discussing market scalability',
    starter: "Hey! Great to connect. Tell me about the startup idea you've been working on lately.",
  },
  {
    title: '☕ Casual Friend Small Talk',
    description: 'Relaxed, friendly English conversation about your day, hobbies, and weekend plans.',
    topic: 'Daily life, hobbies, favorite movies, and weekend plans',
    starter: "Hey there! How has your day been going so far? Anything fun or interesting happen?",
  },
  {
    title: '🧠 Tech Trends & AI Revolution',
    description: 'Discuss how artificial intelligence and modern technology are shaping society.',
    topic: 'The impact of AI, robotics, and automation on future jobs and careers',
    starter: "Hi! How do you think AI is going to change the way we live and work over the next few years?",
  },
  {
    title: '💼 Career & Leadership Goals',
    description: 'Practice discussing promotions, team management, and professional growth.',
    topic: 'Career ambitions, leadership skills, and navigating professional challenges',
    starter: "Hello! What is one major career milestone you are aiming to achieve this year?",
  },
];

export const HandsFreeScreen: React.FC<HandsFreeScreenProps> = ({
  userId,
  onSessionEnded,
}) => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>(PRESET_TOPICS[0].topic);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnostic, setDiagnostic] = useState<HandsFreeMasterDiagnostic | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const dialogueEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue]);

  // Session duration timer
  useEffect(() => {
    if (!hasStarted || isAnalyzing || diagnostic) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, startTime, isAnalyzing, diagnostic]);

  // Handle when user spoke and silence was detected
  const handleUserSpoke = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    const userTurn: DialogueTurn = {
      id: `turn_${Date.now()}_u`,
      speaker: 'user',
      text: spokenText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedDialogue = [...dialogue, userTurn];
    setDialogue(updatedDialogue);

    try {
      // Fetch ultra-fast conversational reply
      const res = await api.getHandsFreeReply({
        topic: customTopic.trim() || topic,
        dialogue: updatedDialogue.map((d) => ({ speaker: d.speaker, text: d.text })),
      });

      const aiReply = res.reply || "That's really insightful! Tell me more about what inspired that.";

      const aiTurn: DialogueTurn = {
        id: `turn_${Date.now()}_ai`,
        speaker: 'ai',
        text: aiReply,
        timestamp: new Date().toISOString(),
      };

      setDialogue((prev) => [...prev, aiTurn]);

      // Speak AI response out loud through voice synthesis
      speakAIResponse(aiReply);
    } catch (err) {
      console.error('Error getting reply in hands-free mode:', err);
      const fallbackReply = "I understand completely! Where do you see this heading next?";
      setDialogue((prev) => [
        ...prev,
        {
          id: `turn_${Date.now()}_ai`,
          speaker: 'ai',
          text: fallbackReply,
          timestamp: new Date().toISOString(),
        },
      ]);
      speakAIResponse(fallbackReply);
    }
  };

  // End Session & Generate Master Diagnostic
  const handleEndAndAnalyze = async () => {
    stopHandsFree();
    setIsAnalyzing(true);

    const activeUserId = userId || localStorage.getItem('speakwise_user_id') || 'usr_default';
    const effectiveTopic = customTopic.trim() || topic;

    try {
      const res = await api.analyzeHandsFreeSession({
        topic: effectiveTopic,
        dialogue: dialogue.map((d) => ({ speaker: d.speaker, text: d.text })),
        durationSeconds: Math.max(10, elapsedSeconds),
        userId: activeUserId,
      });

      setDiagnostic(res.diagnostic);
    } catch (err) {
      console.error('Error analyzing hands-free session:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { phase, interimText, startHandsFree, stopHandsFree, speakAIResponse } =
    useHandsFreeVoice({
      onUserSpoke: handleUserSpoke,
      onVoiceEndTrigger: handleEndAndAnalyze,
      silenceThresholdMs: 1900,
    });

  // Start Session
  const handleStartSession = () => {
    const selectedPreset = PRESET_TOPICS.find((p) => p.topic === topic);
    const starterText =
      customTopic.trim()
        ? `Hey there! Let's talk about "${customTopic.trim()}". What are your main thoughts to begin?`
        : selectedPreset?.starter ||
          "Hey there! Great to talk with you. What was something interesting that happened today?";

    const initialAiTurn: DialogueTurn = {
      id: `turn_${Date.now()}_ai`,
      speaker: 'ai',
      text: starterText,
      timestamp: new Date().toISOString(),
    };

    setDialogue([initialAiTurn]);
    setDiagnostic(null);
    setElapsedSeconds(0);
    setStartTime(Date.now());
    setHasStarted(true);

    // Start voice loop and speak starter
    startHandsFree();
    speakAIResponse(starterText);
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. LOBBY VIEW */}
      {!hasStarted ? (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              <span>Continuous Zero-Touch Voice Practice</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Hands-Free AI Voice Partner
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Put on your earphones, start the session, and speak naturally. The AI talks, listens, and responds automatically without touching any buttons.
            </p>
          </div>

          {/* Preset Topics Grid */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
              Choose a Conversation Topic
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_TOPICS.map((pt) => (
                <button
                  key={pt.title}
                  type="button"
                  onClick={() => {
                    setTopic(pt.topic);
                    setCustomTopic('');
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    topic === pt.topic && !customTopic
                      ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <h3 className="text-sm font-extrabold text-white mb-1">{pt.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{pt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
              Or Custom Topic / Pitch Scenario
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g., Practicing an investor meeting for my fintech app..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Auto Silence Detection</span>
                Pausing for 2 seconds submits your speech automatically.
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <Headphones className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Earphone Friendly</span>
                Practice seamlessly while walking, driving, or relaxing.
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
              <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Master Diagnostic</span>
                Complete grammar and fluency breakdown at the end.
              </div>
            </div>
          </div>

          {/* START BUTTON */}
          <button
            onClick={handleStartSession}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-base shadow-xl shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Hands-Free Practice</span>
          </button>
        </div>
      ) : isAnalyzing ? (
        /* 2. ANALYZING STATE */
        <div className="glass-panel rounded-3xl p-10 text-center space-y-4 border border-slate-800 max-w-lg mx-auto">
          <Loader2 className="w-10 h-10 text-cyan-400 mx-auto animate-spin" />
          <h2 className="text-xl font-bold text-white">Generating Master Diagnostic...</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The AI is analyzing all your spoken turns, evaluating grammar precision, natural phrasing, and executive presence.
          </p>
        </div>
      ) : diagnostic ? (
        /* 3. MASTER DIAGNOSTIC REPORT */
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                Hands-Free Master Diagnostic
              </span>
              <h2 className="text-2xl font-black text-white mt-1">{diagnostic.topic}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {diagnostic.totalTurns} Spoken Turns • {diagnostic.totalUserWords} Words Spoken • {Math.round(diagnostic.durationSeconds / 60)} Minutes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Overall Mastery</div>
                <ScoreBadge score={diagnostic.overallScore} size="lg" />
              </div>
            </div>
          </div>

          {/* Sub Score Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Grammar</div>
              <div className="text-base font-extrabold text-white mt-0.5">{diagnostic.scores.grammar}/100</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Vocabulary</div>
              <div className="text-base font-extrabold text-white mt-0.5">{diagnostic.scores.vocabulary}/100</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Fluency</div>
              <div className="text-base font-extrabold text-white mt-0.5">{diagnostic.scores.fluency}/100</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Naturalness</div>
              <div className="text-base font-extrabold text-white mt-0.5">{diagnostic.scores.naturalness}/100</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Executive CEO</div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">{diagnostic.scores.executive_presence}/100</div>
            </div>
          </div>

          {/* Grammar Mistakes Section */}
          {diagnostic.allGrammarErrors.length > 0 ? (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Grammar Mistakes Found Across Conversation ({diagnostic.allGrammarErrors.length}):</span>
              </div>

              <div className="space-y-3">
                {diagnostic.allGrammarErrors.map((err, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-4 rounded-xl border border-rose-500/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {err.category}
                      </span>
                    </div>
                    {err.userQuote && (
                      <p className="text-slate-400 italic">" ...{err.userQuote}... "</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200">
                        <span className="font-bold text-rose-400 mr-1.5">❌ Mistake:</span>
                        <span>"{err.mistake}"</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                        <span className="font-bold text-emerald-400 mr-1.5">✅ Fix:</span>
                        <span>"{err.correction}"</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed pt-1">
                      <strong className="text-indigo-300 mr-1">Rule:</strong>
                      {err.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm text-emerald-200 font-medium">
                <strong>Flawless Grammar!</strong> Zero grammatical errors across all conversational turns.
              </span>
            </div>
          )}

          {/* Say It Better Upgrades */}
          {diagnostic.sayItBetterUpgrades.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Executive & Natural Phrasing Upgrades:</span>
              </div>

              <div className="space-y-3">
                {diagnostic.sayItBetterUpgrades.map((upg, idx) => (
                  <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="text-slate-400">
                      <span className="font-bold text-slate-300">You said: </span>
                      <span>"{upg.original}"</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-200">
                        <span className="font-bold text-indigo-400 block mb-0.5">💬 Native Spoken:</span>
                        <span>"{upg.natural}"</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-200">
                        <span className="font-bold text-purple-400 block mb-0.5">🚀 CEO Authority:</span>
                        <span>"{upg.advanced}"</span>
                      </div>
                    </div>
                    {upg.explanation && (
                      <p className="text-[11px] text-slate-400 italic pt-1">{upg.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Focus Card */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-indigo-300 block">Tomorrow's Personalized Speaking Goal:</span>
              <p className="text-slate-200 leading-relaxed font-medium">{diagnostic.tomorrowsFocus}</p>
            </div>
          </div>

          {/* Return CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                setHasStarted(false);
                setDiagnostic(null);
                onSessionEnded();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              Back to Home Dashboard
            </button>
            <button
              onClick={() => {
                setDiagnostic(null);
                handleStartSession();
              }}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all text-center"
            >
              Start Another Hands-Free Session
            </button>
          </div>
        </div>
      ) : (
        /* 4. ACTIVE LIVE VOICE CALL VIEW */
        <div className="space-y-4">
          {/* Header Strip */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Hands-Free Voice Flow
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </span>
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {customTopic || topic}
                </h2>
              </div>
            </div>

            {/* END CALL BUTTON */}
            <button
              onClick={handleEndAndAnalyze}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <StopCircle className="w-4 h-4" />
              <span>End & Analyze</span>
            </button>
          </div>

          {/* Fluid Pulsing Voice Visualizer Orb */}
          <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-slate-800 relative overflow-hidden">
            {/* 3D Pulsing Orb */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                  phase === 'speaking'
                    ? 'bg-indigo-500/40 animate-ping'
                    : phase === 'listening'
                    ? 'bg-cyan-500/40 animate-pulse'
                    : phase === 'processing'
                    ? 'bg-amber-500/40 animate-spin'
                    : 'bg-slate-700/20'
                }`}
              />
              <div
                className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-2xl ${
                  phase === 'speaking'
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 border-indigo-400 shadow-indigo-500/50 scale-110'
                    : phase === 'listening'
                    ? 'bg-gradient-to-tr from-cyan-600 to-teal-600 border-cyan-400 shadow-cyan-500/50 scale-105'
                    : phase === 'processing'
                    ? 'bg-gradient-to-tr from-amber-600 to-orange-600 border-amber-400 shadow-amber-500/50'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                {phase === 'speaking' ? (
                  <Volume2 className="w-10 h-10 text-white animate-bounce" />
                ) : phase === 'listening' ? (
                  <Mic className="w-10 h-10 text-white animate-pulse" />
                ) : phase === 'processing' ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Headphones className="w-10 h-10 text-slate-400" />
                )}
              </div>
            </div>

            {/* Status Text */}
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-white">
                {phase === 'speaking' && '🗣️ AI Friend is speaking...'}
                {phase === 'listening' && '🎧 Listening to you... (speak freely)'}
                {phase === 'processing' && '⚡ Thinking & formulating response...'}
                {phase === 'idle' && 'Call connected.'}
              </div>
              <p className="text-[11px] text-slate-400">
                {phase === 'listening'
                  ? 'Pause for ~2 seconds when you finish your thought to let AI respond.'
                  : 'Say "End conversation" or tap End & Analyze above to get full diagnostic.'}
              </p>
            </div>

            {/* Interim Speech Preview */}
            {interimText && phase === 'listening' && (
              <div className="max-w-md mx-auto p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 animate-fadeIn">
                <span className="text-cyan-400 font-bold mr-1">Hearing:</span>
                <span>"{interimText}"</span>
              </div>
            )}
          </div>

          {/* Live Conversational Chat Stream */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4 max-h-[380px] overflow-y-auto">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block border-b border-slate-800 pb-2">
              Live Dialogue Stream ({dialogue.length} Turns)
            </span>

            <div className="space-y-3">
              {dialogue.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex gap-3 ${
                    turn.speaker === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      turn.speaker === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-75 mb-1">
                      {turn.speaker === 'user' ? 'You' : 'AI Voice Partner'}
                    </div>
                    <p>{turn.text}</p>
                  </div>
                </div>
              ))}
              <div ref={dialogueEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
