export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  level: UserLevel;
  target_daily_minutes: number;
  streak: number;
  last_active_date?: string;
  created_at?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation: string;
  part_of_speech: string;
  simple_meaning: string;
  contextual_meaning: string;
  example_sentence: string;
  synonyms: string[];
  antonyms: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Communication' | 'Career' | 'Academic' | 'Everyday' | 'Phrasal Verbs';
  flashcard?: FlashcardItem;
}

export interface FlashcardItem {
  id: string;
  vocabulary_id?: string;
  user_id?: string;
  word?: string;
  pronunciation?: string;
  part_of_speech?: string;
  simple_meaning?: string;
  contextual_meaning?: string;
  example_sentence?: string;
  synonyms?: string[];
  antonyms?: string[];
  difficulty?: string;
  category?: string;
  mastery_score: number;
  review_count: number;
  correct_count: number;
  incorrect_count: number;
  interval_days: number;
  last_reviewed: string | null;
  next_review: string;
  favorite: boolean;
  status: 'New' | 'Learning' | 'Mastered' | 'Difficult';
  user_sentence: string | null;
  times_used_in_conversation: number;
}

export interface GrammarError {
  category: string;
  mistake: string;
  correction: string;
  explanation: string;
}

export interface SentenceImprovement {
  original: string;
  corrected: string;
  natural: string;
  advanced: string;
  explanation: string;
}

export interface TurnAnalysis {
  transcript: string;
  overall_score: number;
  grammar: {
    score: number;
    errors: GrammarError[];
  };
  vocabulary: {
    score: number;
    total_words: number;
    unique_words: number;
    target_words_used: string[];
    advanced_words: string[];
    suggestions: string[];
  };
  fluency: {
    score: number;
    filler_count: number;
    filler_words: Array<{ word: string; count: number }>;
    advice: string;
  };
  naturalness: {
    score: number;
    feedback: string;
  };
  sentence_formation: {
    score: number;
    structure_quality: string;
  };
  sentence_improvements: SentenceImprovement[];
  repeat_task: {
    sentence: string;
    focus_tip: string;
  };
  follow_up_question: string;
  encouragement: string;
  color_tokens?: ColorToken[];
  executive_pitch?: ExecutivePitchAnalysis;
  visual_storyteller?: VisualStorytellerAnalysis;
}

export interface ColorToken {
  text: string;
  type: 'normal' | 'filler' | 'power_vocab' | 'connector' | 'mistake';
  correction?: string;
  explanation?: string;
}

export interface ExecutivePitchAnalysis {
  executive_presence_score: number;
  vision_clarity_score: number;
  persuasiveness_score: number;
  weak_phrases_detected: Array<{ original: string; strong_alternative: string; why: string }>;
  founder_power_words_used: string[];
  founder_power_words_recommended: string[];
  investor_readiness_verdict: string;
  leadership_feedback: string;
}

export interface VisualStorytellerAnalysis {
  descriptive_score: number;
  spatial_vocabulary_used: string[];
  narrative_flow_verdict: string;
  vivid_adjectives_used: string[];
}

export interface RepeatComparisonResult {
  attempt1: { grammar: number; naturalness: number; fluency: number; overall: number };
  attempt2: { grammar: number; naturalness: number; fluency: number; overall: number };
  deltas: {
    grammar: number;
    naturalness: number;
    fluency: number;
    overall: number;
  };
  improved: boolean;
  praise: string;
  ai_feedback?: string;
}

export interface SpeakingTurn {
  id?: string;
  turnNumber: number;
  aiPrompt: string;
  userTranscript: string;
  analysis: TurnAnalysis;
  repeatResult?: RepeatComparisonResult;
  timestamp: string;
}

export interface SpeakingSessionSummary {
  sessionId: string;
  durationSeconds: number;
  overallScore: number;
  scores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    naturalness: number;
    sentence_formation: number;
  };
  strengths: string[];
  improvements: string[];
  targetVocabUsed: number;
  targetVocabWords: string[];
  sentencesImproved: number;
  fillerWordsCount: number;
  totalWordsSpoken: number;
  tomorrowsFocus: string;
}

export interface DailyMission {
  id: string;
  mission_date: string;
  title: string;
  topic: string;
  target_weakness: string;
  completed: boolean;
  score: number | null;
  target_vocabulary: VocabularyItem[];
}

export interface AnalyticsOverview {
  overall_score: number;
  weekly_delta: string;
  sub_scores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    naturalness: number;
    sentence_formation: number;
    filler_control: number;
  };
  speaking_stats: {
    total_sessions: number;
    total_speaking_seconds: number;
    total_speaking_time_formatted: string;
    total_words_spoken: number;
    words_per_minute: number;
    total_sentences_improved: number;
    total_target_vocab_used: number;
    streak_days: number;
  };
  weakness_profile: {
    top_weakness: string;
    top_weakness_count: number;
    secondary_weakness: string | null;
    top_strength: string;
    focus_recommendation: {
      focus_title: string;
      why: string;
      mission_topic: string;
      suggested_starter: string;
    };
    breakdown: Array<{
      category: string;
      count: number;
      latest_mistake: string;
      latest_correction: string;
      latest_explanation: string;
    }>;
  };
}

export interface HandsFreeMasterDiagnostic {
  topic: string;
  durationSeconds: number;
  totalTurns: number;
  totalUserWords: number;
  overallScore: number;
  scores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    naturalness: number;
    executive_presence: number;
  };
  allGrammarErrors: Array<{
    category: string;
    mistake: string;
    correction: string;
    explanation: string;
    userQuote: string;
  }>;
  fillerAnalysis: {
    totalCount: number;
    fillers: Array<{ word: string; count: number }>;
    advice: string;
  };
  founderPowerWordsUsed: string[];
  sayItBetterUpgrades: Array<{
    original: string;
    corrected: string;
    natural: string;
    advanced: string;
    explanation: string;
  }>;
  strengths: string[];
  improvements: string[];
  tomorrowsFocus: string;
  encouragement: string;
}
