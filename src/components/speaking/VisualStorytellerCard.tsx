import React from 'react';
import { VisualStorytellerAnalysis } from '../../types';
import { Image, Sparkles, Compass, Eye, CheckCircle2 } from 'lucide-react';

interface VisualStorytellerCardProps {
  analysis: VisualStorytellerAnalysis;
  sceneTitle?: string;
}

export const VisualStorytellerCard: React.FC<VisualStorytellerCardProps> = ({
  analysis,
  sceneTitle = 'Descriptive Scene Challenge',
}) => {
  const score = analysis.descriptive_score || 80;
  const spatialVocab = analysis.spatial_vocabulary_used || [];
  const adjectives = analysis.vivid_adjectives_used || [];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-950/80 via-slate-900 to-indigo-950/70 border border-teal-500/30 p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-teal-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
              60-Second Storyteller Diagnostic
            </span>
            <h3 className="text-lg font-extrabold text-white">{sceneTitle}</h3>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Descriptive Score</div>
          <div className="text-xl font-black text-teal-400">{score}/100</div>
        </div>
      </div>

      {/* Storytelling Verdict */}
      <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200">
        <span className="font-bold text-teal-300 mr-1.5">Narrative Flow:</span>
        <span>{analysis.narrative_flow_verdict}</span>
      </div>

      {/* Spatial & Preposition Usage */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Compass className="w-4 h-4 text-teal-400" />
          <span>Spatial & Directional Prepositions:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {spatialVocab.map((sv, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-500/40 text-xs font-mono font-medium"
            >
              ✓ {sv}
            </span>
          ))}
        </div>
      </div>

      {/* Vivid Adjectives */}
      {adjectives.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Vivid Descriptive Adjectives:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {adjectives.map((adj, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-medium"
              >
                ✦ {adj}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
