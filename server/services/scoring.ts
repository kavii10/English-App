export interface ScoreBreakdown {
  grammar: number;
  vocabulary: number;
  fluency: number;
  naturalness: number;
  sentence_formation: number;
  overall: number;
}

export interface FillerWordOccurrence {
  word: string;
  count: number;
  positions?: number[];
}

export interface VocabularyUsageMetrics {
  total_words: number;
  unique_words: number;
  repeated_words: string[];
  target_vocab_matched: string[];
  target_vocab_count: number;
  diversity_ratio: number;
}

/**
 * Deterministic scoring system as required in Section 23:
 * Overall Score = Grammar * 0.25 + Vocabulary * 0.20 + Fluency * 0.20 + Naturalness * 0.20 + Sentence Formation * 0.15
 */
export function calculateOverallScore(metrics: {
  grammar: number;
  vocabulary: number;
  fluency: number;
  naturalness: number;
  sentence_formation: number;
}): number {
  const g = Math.max(0, Math.min(100, Math.round(metrics.grammar)));
  const v = Math.max(0, Math.min(100, Math.round(metrics.vocabulary)));
  const f = Math.max(0, Math.min(100, Math.round(metrics.fluency)));
  const n = Math.max(0, Math.min(100, Math.round(metrics.naturalness)));
  const s = Math.max(0, Math.min(100, Math.round(metrics.sentence_formation)));

  const overall = g * 0.25 + v * 0.20 + f * 0.20 + n * 0.20 + s * 0.15;
  return Math.round(overall);
}

/**
 * Context-aware filler word detector
 * Identifies: um, uh, actually, basically, like, you know, i mean, so (at beginning or repeated)
 */
export function detectFillerWords(text: string): {
  total_count: number;
  items: FillerWordOccurrence[];
  most_frequent: string | null;
  advice: string;
} {
  if (!text || !text.trim()) {
    return { total_count: 0, items: [], most_frequent: null, advice: '' };
  }

  const cleanText = text.toLowerCase();
  const fillerPatterns: { pattern: RegExp; name: string }[] = [
    { pattern: /\b(um+|uh+|er+|ah+)\b/gi, name: 'um/uh' },
    { pattern: /\bactually\b/gi, name: 'actually' },
    { pattern: /\bbasically\b/gi, name: 'basically' },
    { pattern: /\byou know\b/gi, name: 'you know' },
    { pattern: /\bi mean\b/gi, name: 'I mean' },
    { pattern: /\b(like)\b(?!\s+(to|a|the|my|her|his|an|it|this|that|they|we|you|i)\b)/gi, name: 'like (filler)' },
    { pattern: /(?:^|[.?!]\s+)\bso\b(?=,?\s+)/gi, name: 'so (filler starter)' },
  ];

  const counts: Record<string, number> = {};
  let totalCount = 0;

  for (const { pattern, name } of fillerPatterns) {
    const matches = cleanText.match(pattern);
    if (matches && matches.length > 0) {
      counts[name] = (counts[name] || 0) + matches.length;
      totalCount += matches.length;
    }
  }

  const items: FillerWordOccurrence[] = Object.entries(counts).map(([word, count]) => ({
    word,
    count,
  })).sort((a, b) => b.count - a.count);

  let mostFrequent = items.length > 0 ? items[0].word : null;
  let advice = '';

  if (totalCount > 0) {
    if (mostFrequent?.includes('actually') || mostFrequent?.includes('basically')) {
      advice = `Instead of using "${mostFrequent}" repeatedly, try taking a brief 1-second relaxed pause before continuing your thought.`;
    } else if (mostFrequent?.includes('um') || mostFrequent?.includes('uh')) {
      advice = `Practice steady breathing between clauses. A deliberate silent pause sounds much more confident than saying "um".`;
    } else {
      advice = `Notice when you reach for "${mostFrequent || 'filler words'}". Silence feels longer to you than to your listener.`;
    }
  } else {
    advice = `Excellent pacing! No distracting filler words detected in this response.`;
  }

  return {
    total_count: totalCount,
    items,
    most_frequent: mostFrequent,
    advice,
  };
}

/**
 * Analyze vocabulary richness and detect whether target daily vocabulary was utilized
 */
export function analyzeVocabularyUsage(
  text: string,
  targetVocabularyWords: string[] = []
): VocabularyUsageMetrics {
  if (!text || !text.trim()) {
    return {
      total_words: 0,
      unique_words: 0,
      repeated_words: [],
      target_vocab_matched: [],
      target_vocab_count: 0,
      diversity_ratio: 0,
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const totalWords = words.length;
  const wordFreq: Record<string, number> = {};

  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  }

  const uniqueWords = Object.keys(wordFreq).length;
  const repeatedWords = Object.entries(wordFreq)
    .filter(([word, count]) => count > 2 && word.length > 3 && !['that', 'with', 'this', 'have', 'from', 'they', 'what'].includes(word))
    .map(([word]) => word);

  // Check matching target vocabulary (including base forms & inflections: e.g. accomplish, accomplished, accomplishing)
  const matchedTargets: string[] = [];
  const normalizedText = text.toLowerCase();

  for (const target of targetVocabularyWords) {
    const root = target.toLowerCase().replace(/^(to\s+)/, '').trim();
    // simple stem check
    const rootPrefix = root.length > 5 ? root.slice(0, -2) : root;
    const regex = new RegExp(`\\b${rootPrefix}[a-z]*\\b`, 'i');
    if (regex.test(normalizedText)) {
      matchedTargets.push(target);
    }
  }

  const diversityRatio = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 0;

  return {
    total_words: totalWords,
    unique_words: uniqueWords,
    repeated_words: repeatedWords,
    target_vocab_matched: matchedTargets,
    target_vocab_count: matchedTargets.length,
    diversity_ratio: diversityRatio,
  };
}

/**
 * Repeat-and-Compare Delta Calculation (Section 8, 20)
 */
export function calculateRepeatComparison(
  attempt1: { grammar: number; naturalness: number; fluency: number; overall: number },
  attempt2: { grammar: number; naturalness: number; fluency: number; overall: number }
) {
  const grammarDelta = attempt2.grammar - attempt1.grammar;
  const naturalnessDelta = attempt2.naturalness - attempt1.naturalness;
  const fluencyDelta = attempt2.fluency - attempt1.fluency;
  const overallDelta = attempt2.overall - attempt1.overall;

  let praiseMessage = '';
  if (grammarDelta >= 15 || overallDelta >= 15) {
    praiseMessage = `🎉 Fantastic improvement! Your grammar improved by ${grammarDelta > 0 ? '+' : ''}${grammarDelta} points.`;
  } else if (overallDelta > 0) {
    praiseMessage = `✨ Great job! Your sentence sounds noticeably more natural and confident (+${overallDelta} pts).`;
  } else {
    praiseMessage = `👍 Solid repeat effort! Practice speaking this sentence one more time smoothly.`;
  }

  return {
    attempt1,
    attempt2,
    deltas: {
      grammar: grammarDelta,
      naturalness: naturalnessDelta,
      fluency: fluencyDelta,
      overall: overallDelta,
    },
    improved: overallDelta > 0 || grammarDelta > 0,
    praise: praiseMessage,
  };
}
