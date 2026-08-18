import React from 'react';
import { Bot, Mic, Volume2, Sparkles } from 'lucide-react';
import { AudioWave } from '../common/AudioWave';

interface AIAvatarVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  frequencyData?: number[];
}

export const AIAvatarVisualizer: React.FC<AIAvatarVisualizerProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  frequencyData,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* Concentric pulsing rings when active */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <div className="absolute w-32 h-32 rounded-full bg-indigo-500/20 animate-ping pointer-events-none" />
            <div className="absolute w-40 h-40 rounded-full bg-purple-500/10 animate-pulse-slow pointer-events-none" />
          </>
        )}

        {isSpeaking && (
          <>
            <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
            <div className="absolute w-40 h-40 rounded-full bg-blue-500/10 animate-pulse-slow pointer-events-none" />
          </>
        )}

        {isProcessing && (
          <div className="absolute w-32 h-32 rounded-full border-2 border-indigo-500/40 border-t-transparent animate-spin pointer-events-none" />
        )}

        {/* Central Avatar Orb */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 z-10 ${
            isSpeaking
              ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 shadow-emerald-500/40 scale-105'
              : isListening
              ? 'bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 shadow-purple-500/40 scale-110'
              : isProcessing
              ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 shadow-amber-500/30'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-slate-800 shadow-indigo-500/20'
          }`}
        >
          {isSpeaking ? (
            <Volume2 className="w-9 h-9 text-white animate-bounce" />
          ) : isListening ? (
            <Mic className="w-9 h-9 text-white animate-pulse" />
          ) : isProcessing ? (
            <Sparkles className="w-9 h-9 text-white animate-spin" />
          ) : (
            <Bot className="w-9 h-9 text-white" />
          )}
        </div>
      </div>

      {/* State label */}
      <div className="mt-4 flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
          {isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          {isListening && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
          {isProcessing && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          {!isSpeaking && !isListening && !isProcessing && <span className="w-2 h-2 rounded-full bg-indigo-400" />}

          {isSpeaking
            ? 'AI Coach is Speaking...'
            : isListening
            ? 'Listening to you speak...'
            : isProcessing
            ? 'Analyzing grammar & naturalness...'
            : 'SpeakWise AI Coach Ready'}
        </span>

        {/* Real-time wave bars */}
        <div className="mt-3">
          <AudioWave
            isListening={isListening}
            isSpeaking={isSpeaking}
            bars={frequencyData}
            color={isSpeaking ? 'emerald' : isListening ? 'rose' : 'indigo'}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
