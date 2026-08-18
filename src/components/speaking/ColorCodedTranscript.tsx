import React, { useState } from 'react';
import { ColorToken } from '../../types';
import { AlertCircle, Sparkles, Zap, HelpCircle } from 'lucide-react';

interface ColorCodedTranscriptProps {
  tokens?: ColorToken[];
  rawText: string;
  isLive?: boolean;
}

export const ColorCodedTranscript: React.FC<ColorCodedTranscriptProps> = ({
  tokens = [],
  rawText,
  isLive = false,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<ColorToken | null>(null);

  // If tokens aren't computed yet (e.g. live speech), render live text with pulse
  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans">
        {rawText || <span className="text-slate-500 italic">Listening to your speech...</span>}
      </div>
    );
  }

  // Count stats
  const fillerCount = tokens.filter((t) => t.type === 'filler').length;
  const powerCount = tokens.filter((t) => t.type === 'power_vocab').length;
  const connectorCount = tokens.filter((t) => t.type === 'connector').length;
  const mistakeCount = tokens.filter((t) => t.type === 'mistake').length;

  return (
    <div className="space-y-3">
      {/* Legend & Stats Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{powerCount} Power Vocab</span>
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
            <span>{connectorCount} Connectors</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>{fillerCount} Fillers</span>
          </span>
          {mistakeCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>{mistakeCount} Grammar Fixes</span>
            </span>
          )}
        </div>
        <span className="text-slate-500 text-[10px]">Tap highlighted words for details</span>
      </div>

      {/* Interactive Subtitle Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 text-sm sm:text-base leading-relaxed tracking-wide font-sans">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          {tokens.map((token, index) => {
            if (token.type === 'mistake') {
              return (
                <span
                  key={index}
                  onClick={() => setActiveTooltip(activeTooltip === token ? null : token)}
                  className="cursor-pointer px-1.5 py-0.5 rounded-md bg-rose-950/80 text-rose-200 border border-rose-500/50 font-medium hover:bg-rose-900/90 transition-all underline decoration-rose-500 decoration-wavy"
                  title="Grammar mistake - tap to view fix"
                >
                  {token.text}
                </span>
              );
            }

            if (token.type === 'filler') {
              return (
                <span
                  key={index}
                  className="px-1.5 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-500/40 font-mono text-xs font-semibold"
                  title="Filler word"
                >
                  {token.text}
                </span>
              );
            }

            if (token.type === 'power_vocab') {
              return (
                <span
                  key={index}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm shadow-emerald-500/20"
                  title="Advanced / Power Vocabulary"
                >
                  {token.text}
                </span>
              );
            }

            if (token.type === 'connector') {
              return (
                <span
                  key={index}
                  className="px-1.5 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-semibold"
                  title="Structure & Transition Connector"
                >
                  {token.text}
                </span>
              );
            }

            return (
              <span key={index} className="text-slate-100">
                {token.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tooltip Overlay */}
      {activeTooltip && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between text-rose-400 font-bold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Grammar Correction</span>
            </span>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-rose-300 font-mono line-through">"{activeTooltip.text}"</span>
            <span className="text-slate-400">&rarr;</span>
            <span className="text-emerald-400 font-bold font-mono">"{activeTooltip.correction}"</span>
          </div>
          {activeTooltip.explanation && (
            <p className="text-slate-300 text-[11px] pt-1 leading-relaxed">
              {activeTooltip.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
