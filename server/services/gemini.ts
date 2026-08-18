import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db/database.js';
import { calculateOverallScore, detectFillerWords, analyzeVocabularyUsage, calculateRepeatComparison } from './scoring.js';
import { recordUserMistake } from './weakness.js';

/**
 * Get active Gemini API Key from database settings or process.env
 */
export function getApiKey(): string {
  const setting = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('gemini_api_key') as { value: string } | undefined;
  if (setting && setting.value && setting.value.trim().length > 0) {
    return setting.value.trim();
  }
  return process.env.GEMINI_API_KEY || '';
}

/**
 * Set Gemini API Key in settings
 */
export function setApiKey(key: string): void {
  db.prepare(`
    INSERT INTO app_settings (key, value)
    VALUES ('gemini_api_key', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key.trim());
}

/**
 * Get configured Gemini generative model
 */
function getModel(modelName: string = 'gemini-3.6-flash') {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
    },
  });
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

export interface ConversationTurnAnalysis {
  transcript: string;
  overall_score: number;
  grammar: {
    score: number;
    errors: Array<{
      category: string;
      mistake: string;
      correction: string;
      explanation: string;
    }>;
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
  sentence_improvements: Array<{
    original: string;
    corrected: string;
    natural: string;
    advanced: string;
    explanation: string;
  }>;
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

export const FOUNDER_POWER_WORDS = [
  'scalability', 'scalable', 'traction', 'paradigm shift', 'competitive moat', 'moat',
  'sustainable growth', 'strategic alignment', 'unit economics', 'value proposition',
  'bottleneck', 'pivot', 'retention', 'velocity', 'monetization', 'milestone',
  'disruptive', 'synergy', 'leverage', 'flywheel', 'market penetration', 'differentiation',
  'ecosystem', 'capital efficiency', 'runway', 'product-market fit', 'frictionless',
  'streamlined', 'mission-critical', 'core competency', 'roi', 'exponential',
  'stakeholder', 'optimize', 'execution', 'benchmark', 'iterate', 'value driver',
  'compelling', 'visionary', 'transformative', 'resilience', 'sustainable'
];

export const POWER_CONNECTORS = [
  'furthermore', 'moreover', 'consequently', 'in particular', 'in essence',
  'on the contrary', 'notably', 'to illustrate', 'ultimately', 'by contrast',
  'as a result', 'in addition', 'specifically', 'nevertheless', 'accordingly',
  'in other words', 'conversely', 'hence', 'thus', 'therefore', 'subsequently'
];

export const WEAK_PHRASES = [
  { phrase: 'i kind of think', alternative: 'I am confident that', why: 'Eliminates hesitation and projects conviction.' },
  { phrase: 'maybe we can', alternative: 'Our strategic plan is to', why: 'Replaces passive guessing with executive action.' },
  { phrase: 'sort of like', alternative: 'Specifically, it operates as', why: 'Provides clarity and crisp positioning.' },
  { phrase: 'i guess', alternative: 'Based on our data', why: 'Grounds your statement in objective authority.' },
  { phrase: 'i am not really sure', alternative: 'We are validating this milestone', why: 'Reframes uncertainty into structured execution.' },
  { phrase: 'hopefully we might', alternative: 'Our roadmap targets', why: 'Replaces hopeful language with goal-oriented leadership.' },
  { phrase: 'it is just', alternative: 'It is exclusively designed to', why: 'Never diminish your product or team with "just".' },
  { phrase: 'we will try to', alternative: 'We are committed to delivering', why: 'Shows accountability and founder resolve.' }
];

export function tokenizeAndColorTranscript(
  transcript: string,
  errors: Array<{ mistake: string; correction: string; explanation: string }> = [],
  fillerWords: Array<{ word: string }> = []
): ColorToken[] {
  if (!transcript || !transcript.trim()) return [];

  const fillerSet = new Set(fillerWords.map((f) => f.word.toLowerCase()));
  const powerSet = new Set(FOUNDER_POWER_WORDS.map((w) => w.toLowerCase()));
  const connectorSet = new Set(POWER_CONNECTORS.map((c) => c.toLowerCase()));

  const words = transcript.split(/\s+/);
  const tokens: ColorToken[] = [];

  for (const rawWord of words) {
    const cleanWord = rawWord.toLowerCase().replace(/[^a-z0-9'-]/g, '');

    // Check if part of a grammar mistake
    const matchedError = errors.find((e) => e.mistake.toLowerCase().includes(cleanWord));

    if (matchedError && cleanWord.length > 2) {
      tokens.push({
        text: rawWord,
        type: 'mistake',
        correction: matchedError.correction,
        explanation: matchedError.explanation,
      });
    } else if (fillerSet.has(cleanWord)) {
      tokens.push({
        text: rawWord,
        type: 'filler',
      });
    } else if (powerSet.has(cleanWord)) {
      tokens.push({
        text: rawWord,
        type: 'power_vocab',
      });
    } else if (connectorSet.has(cleanWord)) {
      tokens.push({
        text: rawWord,
        type: 'connector',
      });
    } else {
      tokens.push({
        text: rawWord,
        type: 'normal',
      });
    }
  }

  return tokens;
}

/**
 * Generate AI Coach opening or contextual follow-up question
 */
export async function generateConversationStarter(params: {
  topic?: string;
  targetVocab?: string[];
  userWeakness?: string;
  difficulty?: string;
}): Promise<string> {
  const { topic = 'Daily Life & Experiences', targetVocab = [], userWeakness = 'Past Tense', difficulty = 'Intermediate' } = params;
  const model = getModel();

  if (!model) {
    // Fallback response
    const starters = [
      `Hey there! Great to talk with you. What was something interesting or challenging that you worked on recently?`,
      `Hello! I'd love to hear about your day. What was one highlight or something you accomplished today?`,
      `Hi! How are things going? Tell me about a project or plan you've been working on lately.`
    ];
    return starters[Math.floor(Math.random() * starters.length)];
  }

  const prompt = `
You are SpeakWise AI, a friendly, encouraging, and natural personal AI English speaking coach.
Start a speaking conversation with the user.

Parameters:
- Topic: ${topic}
- Target vocabulary words to gently encourage (don't force all, just naturally inspire 1 or 2): ${targetVocab.join(', ')}
- User's recent weakness area to help practice: ${userWeakness}
- Difficulty level: ${difficulty}

Guidelines:
- Speak in warm, conversational, natural English (1-2 sentences).
- Ask an engaging open-ended question that makes the user want to speak.
- Do NOT sound like an exam or textbook. Sound like a supportive friend/coach.
- Return ONLY the spoken question text with no quotation marks or prefixes.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^["']|["']$/g, '');
    return text || `Hey there! How has your day been going so far?`;
  } catch (error) {
    console.error('Error generating starter with Gemini:', error);
    return `Hey there! Tell me about an interesting experience or project you worked on recently.`;
  }
}

/**
 * Full turn analysis with structured output
 */
export async function analyzeUserResponse(params: {
  aiPrompt: string;
  userTranscript: string;
  targetVocab?: string[];
  userWeakness?: string;
  difficulty?: string;
  userId?: string;
  mode?: string;
}): Promise<ConversationTurnAnalysis> {
  const {
    aiPrompt,
    userTranscript,
    targetVocab = ['articulate', 'accomplish', 'concise', 'reluctant', 'overwhelmed'],
    userWeakness = 'Past Tense',
    difficulty = 'Intermediate',
    userId = 'usr_default',
    mode = 'conversation',
  } = params;

  // Compute deterministic filler word statistics and vocabulary usage
  const fillerAnalysis = detectFillerWords(userTranscript);
  const vocabUsage = analyzeVocabularyUsage(userTranscript, targetVocab);

  // Founder & CEO Power Words and Weak phrases detection
  const usedPowerWords = Array.from(new Set(FOUNDER_POWER_WORDS.filter((w) => userTranscript.toLowerCase().includes(w.toLowerCase()))));
  const detectedWeak = WEAK_PHRASES.filter((wp) => userTranscript.toLowerCase().includes(wp.phrase.toLowerCase()));

  const model = getModel();

  if (!model) {
    const fallback = generateFallbackAnalysis(aiPrompt, userTranscript, targetVocab, fillerAnalysis, vocabUsage, userId);
    fallback.color_tokens = tokenizeAndColorTranscript(userTranscript, fallback.grammar.errors, fillerAnalysis.items);
    return fallback;
  }

  const systemInstruction = `
You are the analysis engine for SpeakWise AI, an elite English communication coach and Executive Leadership Trainer.
Analyze the user's spoken response to the AI's previous prompt.

CRITICAL ACCURACY RULES:
1. Do NOT invent fake errors. Accept valid conversational variations.
2. Distinguish informal spoken English from genuine grammatical mistakes.
3. For grammar mistakes: identify category (Verb Tense, Prepositions, Articles, Subject-Verb Agreement, Word Order, Plurals, Pronouns, Modals), the exact mistake snippet, the corrected snippet, and an educational explanation (e.g. "Because you are describing a past event, use the past tense 'met' instead of 'meet'").
4. Provide "Say It Better" improvements for the user's sentence:
   - "corrected": Grammatically precise version fixing errors.
   - "natural": How a fluent native speaker naturally says it in daily conversation.
   - "advanced": Polished, concise, professional version (NOT overly complex jargon).
   - "explanation": Concise, encouraging reason.
5. Provide a natural follow-up question to keep the conversation flowing smoothly.
6. Provide score estimates between 40 and 100 for grammar, vocabulary, fluency, naturalness, and sentence_formation.
7. If mode is "pitch" (Founder & CEO mode), evaluate executive presence, investor conviction, vision clarity, and leadership phrasing.
8. If mode is "storyteller", evaluate descriptive vocabulary, narrative pacing, and scene visualization.

Return STRICT JSON matching this schema:
{
  "grammar": {
    "score": number,
    "errors": [
      {
        "category": "Verb Tense | Prepositions | Articles | Subject-Verb Agreement | Word Order | Plural/Singular | Pronouns | Modals | General",
        "mistake": "exact mistake snippet",
        "correction": "corrected snippet",
        "explanation": "clear educational reason"
      }
    ]
  },
  "vocabulary": {
    "score": number,
    "advanced_words": ["word1", "word2"],
    "suggestions": ["alternative or higher-impact phrasing"]
  },
  "fluency": {
    "score": number,
    "feedback": "observations on pacing and flow"
  },
  "naturalness": {
    "score": number,
    "feedback": "feedback on how native/idiomatic the response sounded"
  },
  "sentence_formation": {
    "score": number,
    "structure_quality": "description of clause structure"
  },
  "sentence_improvements": [
    {
      "original": "user original sentence",
      "corrected": "grammatically corrected sentence",
      "natural": "conversational natural version",
      "advanced": "polished professional version",
      "explanation": "why this sounds better"
    }
  ],
  "repeat_task": {
    "sentence": "the most impactful natural/corrected sentence for the user to practice speaking aloud",
    "focus_tip": "pronunciation or phrasing tip"
  },
  "follow_up_question": "natural conversational follow-up question continuing the topic",
  "encouragement": "short motivating remark",
  "executive_pitch": {
    "executive_presence_score": number,
    "vision_clarity_score": number,
    "persuasiveness_score": number,
    "weak_phrases_detected": [
      { "original": "weak phrase snippet", "strong_alternative": "executive authority alternative", "why": "reason" }
    ],
    "founder_power_words_used": ["word1"],
    "founder_power_words_recommended": ["scalable", "strategic alignment", "competitive moat"],
    "investor_readiness_verdict": "Clear, compelling executive summary verdict",
    "leadership_feedback": "Actionable feedback for founder communication"
  },
  "visual_storyteller": {
    "descriptive_score": number,
    "spatial_vocabulary_used": ["in the foreground", "surrounded by"],
    "narrative_flow_verdict": "Engaging storytelling flow",
    "vivid_adjectives_used": ["bustling", "vibrant"]
  }
}
`;

  const userContent = `
Practice Mode: ${mode}
AI Coach Asked: "${aiPrompt}"
User Spoke: "${userTranscript}"
Target Vocabulary for Today: ${JSON.stringify(targetVocab)}
Difficulty Level: ${difficulty}
User's known recurring weakness: ${userWeakness}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n' + userContent }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const rawJson = result.response.text();
    const parsed = JSON.parse(rawJson);

    // Record mistakes into user_mistakes for weakness tracking
    if (parsed.grammar && Array.isArray(parsed.grammar.errors)) {
      for (const err of parsed.grammar.errors) {
        if (err.category && err.mistake && err.correction) {
          recordUserMistake(userId, err.category, err.mistake, err.correction, err.explanation || '');
        }
      }
    }

    // Deterministic overall score calculation
    const gScore = Number(parsed.grammar?.score) || (parsed.grammar?.errors?.length === 0 ? 92 : 70);
    const vScore = Number(parsed.vocabulary?.score) || (vocabUsage.target_vocab_count > 0 ? 88 : 75);
    const fScore = Math.max(40, (Number(parsed.fluency?.score) || 80) - (fillerAnalysis.total_count * 3));
    const nScore = Number(parsed.naturalness?.score) || 78;
    const sScore = Number(parsed.sentence_formation?.score) || 80;

    const overallScore = calculateOverallScore({
      grammar: gScore,
      vocabulary: vScore,
      fluency: fScore,
      naturalness: nScore,
      sentence_formation: sScore,
    });

    // Extract improvements
    let improvements = parsed.sentence_improvements || [];
    if (!Array.isArray(improvements) || improvements.length === 0) {
      improvements = [{
        original: userTranscript,
        corrected: userTranscript,
        natural: userTranscript,
        advanced: userTranscript,
        explanation: 'Your sentence was clear and effectively conveyed your thought.',
      }];
    }

    const repeatSentence = parsed.repeat_task?.sentence || improvements[0]?.natural || improvements[0]?.corrected || userTranscript;
    const colorTokens = tokenizeAndColorTranscript(userTranscript, parsed.grammar?.errors || [], fillerAnalysis.items);

    // Executive Pitch calculations (if mode === 'pitch' or default)
    const execPitch: ExecutivePitchAnalysis = {
      executive_presence_score: Number(parsed.executive_pitch?.executive_presence_score) || Math.min(100, Math.max(45, overallScore + (usedPowerWords.length * 4) - (detectedWeak.length * 5))),
      vision_clarity_score: Number(parsed.executive_pitch?.vision_clarity_score) || Math.min(100, Math.max(50, sScore + 5)),
      persuasiveness_score: Number(parsed.executive_pitch?.persuasiveness_score) || Math.min(100, Math.max(50, vScore + (usedPowerWords.length * 3))),
      weak_phrases_detected: parsed.executive_pitch?.weak_phrases_detected?.length ? parsed.executive_pitch.weak_phrases_detected : detectedWeak.map(dw => ({ original: dw.phrase, strong_alternative: dw.alternative, why: dw.why })),
      founder_power_words_used: usedPowerWords,
      founder_power_words_recommended: parsed.executive_pitch?.founder_power_words_recommended || ['scalable', 'competitive moat', 'strategic alignment', 'value driver'],
      investor_readiness_verdict: parsed.executive_pitch?.investor_readiness_verdict || (usedPowerWords.length > 1 ? 'Strong, authoritative communication with clear commercial value.' : 'Promising clarity. Incorporate more decisive leadership and commercial power words.'),
      leadership_feedback: parsed.executive_pitch?.leadership_feedback || 'Replace filler words with deliberate 2-second pauses to command executive presence.',
    };

    // Visual Storyteller calculations
    const visualStory: VisualStorytellerAnalysis = {
      descriptive_score: Number(parsed.visual_storyteller?.descriptive_score) || Math.min(100, Math.max(50, vScore + 5)),
      spatial_vocabulary_used: parsed.visual_storyteller?.spatial_vocabulary_used || ['in the background', 'alongside', 'surrounded by'],
      narrative_flow_verdict: parsed.visual_storyteller?.narrative_flow_verdict || 'Clear chronological storytelling with expressive descriptions.',
      vivid_adjectives_used: parsed.visual_storyteller?.vivid_adjectives_used || ['compelling', 'vibrant', 'focused'],
    };

    return {
      transcript: userTranscript,
      overall_score: overallScore,
      grammar: {
        score: gScore,
        errors: parsed.grammar?.errors || [],
      },
      vocabulary: {
        score: vScore,
        total_words: vocabUsage.total_words,
        unique_words: vocabUsage.unique_words,
        target_words_used: vocabUsage.target_vocab_matched,
        advanced_words: parsed.vocabulary?.advanced_words || [],
        suggestions: parsed.vocabulary?.suggestions || [],
      },
      fluency: {
        score: fScore,
        filler_count: fillerAnalysis.total_count,
        filler_words: fillerAnalysis.items,
        advice: fillerAnalysis.advice,
      },
      naturalness: {
        score: nScore,
        feedback: parsed.naturalness?.feedback || 'Good conversational flow.',
      },
      sentence_formation: {
        score: sScore,
        structure_quality: parsed.sentence_formation?.structure_quality || 'Clear structure.',
      },
      sentence_improvements: improvements,
      repeat_task: {
        sentence: repeatSentence,
        focus_tip: parsed.repeat_task?.focus_tip || 'Focus on smooth rhythm and connecting the words naturally.',
      },
      follow_up_question: parsed.follow_up_question || 'That sounds interesting! What happened next?',
      encouragement: parsed.encouragement || 'Great job expressing your ideas clearly!',
      color_tokens: colorTokens,
      executive_pitch: execPitch,
      visual_storyteller: visualStory,
    };
  } catch (error) {
    console.error('Error analyzing response with Gemini JSON schema, using resilient fallback:', error);
    const fallback = generateFallbackAnalysis(aiPrompt, userTranscript, targetVocab, fillerAnalysis, vocabUsage, userId);
    fallback.color_tokens = tokenizeAndColorTranscript(userTranscript, fallback.grammar.errors, fillerAnalysis.items);
    return fallback;
  }
}

/**
 * Compare spoken repeat attempt against original and target sentence
 */
export async function compareSpokenRepeatAttempt(params: {
  targetSentence: string;
  attempt1Scores: { grammar: number; naturalness: number; fluency: number; overall: number };
  attempt2Transcript: string;
}) {
  const { targetSentence, attempt1Scores, attempt2Transcript } = params;
  const fillerAnalysis = detectFillerWords(attempt2Transcript);
  const model = getModel();

  if (!model) {
    // Intelligent fallback scoring
    const lengthRatio = Math.min(1, attempt2Transcript.length / Math.max(1, targetSentence.length));
    const gScore = Math.min(100, Math.round(attempt1Scores.grammar + (lengthRatio > 0.8 ? 25 : 10)));
    const nScore = Math.min(100, Math.round(attempt1Scores.naturalness + (lengthRatio > 0.8 ? 20 : 8)));
    const fScore = Math.max(50, Math.round(attempt1Scores.fluency + 15 - (fillerAnalysis.total_count * 4)));
    const sScore = Math.min(100, Math.round(gScore * 0.9 + 10));

    const overallScore = calculateOverallScore({
      grammar: gScore,
      vocabulary: 85,
      fluency: fScore,
      naturalness: nScore,
      sentence_formation: sScore,
    });

    return calculateRepeatComparison(attempt1Scores, {
      grammar: gScore,
      naturalness: nScore,
      fluency: fScore,
      overall: overallScore,
    });
  }

  const prompt = `
The user was asked to repeat an improved sentence to practice spoken English.
Target improved sentence: "${targetSentence}"
User's repeated spoken transcript (Attempt 2): "${attempt2Transcript}"

Rate Attempt 2 strictly from 0-100 on:
- grammar: (did they successfully use correct grammar from the target?)
- naturalness: (how natural was the delivery and word sequence?)
- fluency: (was it smooth without excessive hesitation?)
- sentence_formation: (structure quality)

Return STRICT JSON:
{
  "grammar": number,
  "naturalness": number,
  "fluency": number,
  "sentence_formation": number,
  "feedback": "short encouraging highlight of what improved"
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(result.response.text());
    const gScore = Number(parsed.grammar) || 90;
    const nScore = Number(parsed.naturalness) || 88;
    const fScore = Math.max(40, (Number(parsed.fluency) || 85) - fillerAnalysis.total_count * 3);
    const sScore = Number(parsed.sentence_formation) || 88;

    const overallScore = calculateOverallScore({
      grammar: gScore,
      vocabulary: 88,
      fluency: fScore,
      naturalness: nScore,
      sentence_formation: sScore,
    });

    const comparison = calculateRepeatComparison(attempt1Scores, {
      grammar: gScore,
      naturalness: nScore,
      fluency: fScore,
      overall: overallScore,
    });

    return {
      ...comparison,
      ai_feedback: parsed.feedback || 'Great repeat attempt! Your sentence structure is much sharper.',
    };
  } catch (error) {
    console.error('Error comparing repeat attempt with Gemini:', error);
    const gScore = Math.min(95, attempt1Scores.grammar + 20);
    const nScore = Math.min(92, attempt1Scores.naturalness + 18);
    const fScore = Math.min(90, attempt1Scores.fluency + 12);
    const overallScore = calculateOverallScore({
      grammar: gScore,
      vocabulary: 85,
      fluency: fScore,
      naturalness: nScore,
      sentence_formation: 90,
    });
    return calculateRepeatComparison(attempt1Scores, {
      grammar: gScore,
      naturalness: nScore,
      fluency: fScore,
      overall: overallScore,
    });
  }
}

/**
 * Evaluate user custom sentence for vocabulary flashcard practice
 */
export async function evaluateFlashcardSentence(params: {
  word: string;
  meaning: string;
  userSentence: string;
}) {
  const { word, meaning, userSentence } = params;
  const model = getModel();

  if (!model) {
    const containsWord = userSentence.toLowerCase().includes(word.toLowerCase().replace(/^(to\s+)/, ''));
    return {
      is_valid: containsWord,
      score: containsWord ? 88 : 50,
      corrected_sentence: userSentence,
      feedback: containsWord
        ? `Great sentence! You used "${word}" in a clear and appropriate context.`
        : `Try to include the word "${word}" directly in your sentence.`,
      better_alternative: `Here is another natural way: "${userSentence.trim()}"`,
    };
  }

  const prompt = `
Evaluate the user's practice sentence for the vocabulary word "${word}".
Word Meaning: "${meaning}"
User's Sentence: "${userSentence}"

Check:
1. Did the user use the word "${word}" (or standard inflection) correctly and in proper context?
2. Is the grammar accurate?
3. How natural does the sentence sound?

Return STRICT JSON:
{
  "is_valid": boolean,
  "score": number (0-100),
  "corrected_sentence": "sentence with any grammar issues fixed",
  "feedback": "constructive 1-2 sentence feedback explaining how well the word was used",
  "better_alternative": "a natural, idiomatic variation"
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Error evaluating flashcard sentence with Gemini:', error);
    return {
      is_valid: true,
      score: 85,
      corrected_sentence: userSentence,
      feedback: `Good sentence structure using "${word}".`,
      better_alternative: userSentence,
    };
  }
}

/**
 * Test Gemini API Key connectivity
 */
export async function testGeminiApiKey(key: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!key || !key.trim()) {
    return { success: false, message: 'API key is empty.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(key.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent('Say "SpeakWise API Connected Successfully" in 5 words.');
    const text = result.response.text();
    return { success: true, message: text.trim(), model: 'gemini-3.6-flash' };
  } catch (error: any) {
    console.error('Gemini Key Test Error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to authenticate with Google Gemini API. Please check your key.',
    };
  }
}

export interface GeneratedVocabItem {
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
}

/**
 * Generate 5 new practical vocabulary items with Gemini AI
 */
export async function generateMoreVocabulary(params: {
  existingWords?: string[];
  category?: string;
  difficulty?: string;
}): Promise<GeneratedVocabItem[]> {
  const { existingWords = [], category = 'Communication', difficulty = 'Intermediate' } = params;
  const model = getModel();

  if (!model) {
    // Intelligent fallback generator
    const fallbackBank: GeneratedVocabItem[] = [
      {
        id: `vocab-${Date.now()}-1`,
        word: 'seamless',
        pronunciation: '/ˈsiːm.ləs/',
        part_of_speech: 'adjective',
        simple_meaning: 'Smooth and continuous without any problems, pauses, or obvious joins.',
        contextual_meaning: 'Widely used in tech, presentations, and team workflows to describe effortless execution.',
        example_sentence: 'The transition to the new communication platform was completely seamless.',
        synonyms: ['smooth', 'effortless', 'flawless', 'unbroken', 'coherent'],
        antonyms: ['clunky', 'interrupted', 'disjointed'],
        difficulty: 'Intermediate',
        category: 'Career',
      },
      {
        id: `vocab-${Date.now()}-2`,
        word: 'navigate',
        pronunciation: '/ˈnæv.ə.ɡeɪt/',
        part_of_speech: 'verb',
        simple_meaning: 'To plan and direct the course of something, or manage a difficult situation.',
        contextual_meaning: 'Commonly used in workplace discussions for managing complex interpersonal or project challenges.',
        example_sentence: 'She helped the team navigate through the ambiguous project requirements.',
        synonyms: ['steer', 'manage', 'handle', 'guide', 'negotiate'],
        antonyms: ['muddle', 'get lost', 'mismanage'],
        difficulty: 'Intermediate',
        category: 'Communication',
      },
      {
        id: `vocab-${Date.now()}-3`,
        word: 'proactive',
        pronunciation: '/proʊˈæk.tɪv/',
        part_of_speech: 'adjective',
        simple_meaning: 'Taking action in advance to prevent problems rather than just reacting to them.',
        contextual_meaning: 'A premier career and self-improvement word describing taking personal initiative.',
        example_sentence: 'Being proactive in asking for feedback helped him refine his speaking skills rapidly.',
        synonyms: ['enterprising', 'forward-thinking', 'initiative-taking', 'dynamic'],
        antonyms: ['reactive', 'passive', 'sluggish'],
        difficulty: 'Intermediate',
        category: 'Career',
      },
      {
        id: `vocab-${Date.now()}-4`,
        word: 'synthesize',
        pronunciation: '/ˈsɪn.θə.saɪz/',
        part_of_speech: 'verb',
        simple_meaning: 'To combine different ideas, facts, or styles to form a single coherent whole.',
        contextual_meaning: 'Used when summarizing lengthy discussions or research into clear speaking points.',
        example_sentence: 'He was able to synthesize everyone’s feedback into three actionable steps.',
        synonyms: ['integrate', 'summarize', 'unify', 'amalgamate', 'blend'],
        antonyms: ['separate', 'disintegrate', 'divide'],
        difficulty: 'Advanced',
        category: 'Academic',
      },
      {
        id: `vocab-${Date.now()}-5`,
        word: 'wrap up',
        pronunciation: '/ræp ʌp/',
        part_of_speech: 'phrasal verb',
        simple_meaning: 'To complete or conclude a discussion, meeting, or task.',
        contextual_meaning: 'Extremely popular everyday conversational idiom used at the end of meetings or activities.',
        example_sentence: 'Let’s wrap up today’s discussion by reviewing our key action items.',
        synonyms: ['conclude', 'finish', 'finalize', 'wind up', 'complete'],
        antonyms: ['start', 'begin', 'open', 'initiate'],
        difficulty: 'Beginner',
        category: 'Phrasal Verbs',
      },
    ];
    return fallbackBank;
  }

  const prompt = `
You are the vocabulary curriculum engine for SpeakWise AI.
Generate exactly 5 NEW practical, high-utility English vocabulary words or useful phrasal verbs for spoken communication.

Requirements:
- Target Category: ${category} (or mix of Career, Communication, Academic, Everyday, Phrasal Verbs)
- Target Difficulty: ${difficulty}
- Avoid these existing words already in database: ${JSON.stringify(existingWords.slice(-50))}
- Focus on real-world communication words people actually use in daily, academic, or workplace conversations.
- Do NOT provide obscure dictionary words. Provide practical words like "seamless", "proactive", "navigate", "elaborate", "wrap up", "stand out", "leverage", etc.

Return STRICT JSON matching this schema:
{
  "words": [
    {
      "word": "string",
      "pronunciation": "/IPA transcription/",
      "part_of_speech": "noun | verb | adjective | adverb | phrasal verb",
      "simple_meaning": "clear definition in simple plain English",
      "contextual_meaning": "explanation of how to use it in conversation or meetings",
      "example_sentence": "a natural sentence someone would say aloud",
      "synonyms": ["syn1", "syn2", "syn3"],
      "antonyms": ["ant1", "ant2"],
      "difficulty": "Beginner | Intermediate | Advanced",
      "category": "Communication | Career | Academic | Everyday | Phrasal Verbs"
    }
  ]
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(result.response.text());
    const items: GeneratedVocabItem[] = (parsed.words || []).map((w: any) => ({
      id: `vocab-${w.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      word: w.word.toLowerCase().trim(),
      pronunciation: w.pronunciation || '/prəˈnʌn.si.eɪ.ʃən/',
      part_of_speech: w.part_of_speech || 'word',
      simple_meaning: w.simple_meaning || '',
      contextual_meaning: w.contextual_meaning || '',
      example_sentence: w.example_sentence || '',
      synonyms: Array.isArray(w.synonyms) ? w.synonyms : [],
      antonyms: Array.isArray(w.antonyms) ? w.antonyms : [],
      difficulty: w.difficulty || difficulty,
      category: w.category || category,
    }));

    return items;
  } catch (error) {
    console.error('Error generating vocabulary with Gemini, using curated high-impact vocabulary fallback:', error);
    const fallbackPool: Array<Omit<GeneratedVocabItem, 'id'>> = [
      {
        word: 'streamline',
        pronunciation: '/ˈstriːm.laɪn/',
        part_of_speech: 'verb',
        simple_meaning: 'To make a system, process, or workflow simpler, faster, and more efficient.',
        contextual_meaning: 'Used frequently in startups and meetings to describe removing unnecessary steps.',
        example_sentence: 'We need to streamline our onboarding process to help new users get started faster.',
        synonyms: ['simplify', 'optimize', 'clarify'],
        antonyms: ['complicate', 'delay'],
        difficulty: 'Intermediate',
        category: 'Career',
      },
      {
        word: 'articulate',
        pronunciation: '/ɑːˈtɪk.jə.lət/',
        part_of_speech: 'adjective',
        simple_meaning: 'Able to express thoughts, arguments, and ideas clearly and effectively in speech.',
        contextual_meaning: 'A high-praise adjective for founders, leaders, and confident speakers.',
        example_sentence: 'She gave an articulate presentation that convinced all the stakeholders.',
        synonyms: ['fluent', 'eloquent', 'persuasive'],
        antonyms: ['unclear', 'hesitant'],
        difficulty: 'Advanced',
        category: 'Communication',
      },
      {
        word: 'pragmatic',
        pronunciation: '/præɡˈmæt.ɪk/',
        part_of_speech: 'adjective',
        simple_meaning: 'Dealing with situations sensibly and realistically based on practical results rather than theory.',
        contextual_meaning: 'Essential for discussing decisions, product roadmaps, and problem solving.',
        example_sentence: 'Taking a pragmatic approach helped us ship the MVP on time.',
        synonyms: ['practical', 'realistic', 'sensible'],
        antonyms: ['idealistic', 'impractical'],
        difficulty: 'Advanced',
        category: 'Career',
      },
      {
        word: 'leverage',
        pronunciation: '/ˈlev.ər.ɪdʒ/',
        part_of_speech: 'verb',
        simple_meaning: 'To use something to maximum advantage.',
        contextual_meaning: 'Everyday executive and professional verb for utilizing resources, tools, or strengths.',
        example_sentence: 'We can leverage our existing audience to test this new product concept.',
        synonyms: ['utilize', 'capitalize on', 'exploit'],
        antonyms: ['waste', 'ignore'],
        difficulty: 'Intermediate',
        category: 'Career',
      },
      {
        word: 'resilient',
        pronunciation: '/rɪˈzɪl.jənt/',
        part_of_speech: 'adjective',
        simple_meaning: 'Able to withstand or recover quickly from difficult conditions or failures.',
        contextual_meaning: 'Key term for personal growth, leadership, and startup persistence.',
        example_sentence: 'A resilient founder learns from every setback and keeps building.',
        synonyms: ['adaptable', 'tough', 'enduring'],
        antonyms: ['fragile', 'vulnerable'],
        difficulty: 'Intermediate',
        category: 'Communication',
      },
      {
        word: 'synthesize',
        pronunciation: '/ˈsɪn.θə.saɪz/',
        part_of_speech: 'verb',
        simple_meaning: 'To combine complex pieces of information into a clear, unified summary.',
        contextual_meaning: 'Used when summarizing meetings, customer interviews, and research findings.',
        example_sentence: 'Let me synthesize the three main points discussed in today meeting.',
        synonyms: ['integrate', 'summarize', 'unify'],
        antonyms: ['separate', 'dissect'],
        difficulty: 'Advanced',
        category: 'Communication',
      },
    ];

    const existingSet = new Set(existingWords.map((w) => w.toLowerCase()));
    const freshWords = fallbackPool.filter((w) => !existingSet.has(w.word.toLowerCase()));
    const selected = freshWords.length >= 3 ? freshWords.slice(0, 5) : fallbackPool.slice(0, 5);

    return selected.map((w) => ({
      ...w,
      id: `vocab-${w.word.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));
  }
}

/**
 * Resilient offline / fallback analysis engine
 */
function generateFallbackAnalysis(
  aiPrompt: string,
  userTranscript: string,
  targetVocab: string[],
  fillerAnalysis: ReturnType<typeof detectFillerWords>,
  vocabUsage: ReturnType<typeof analyzeVocabularyUsage>,
  userId: string
): ConversationTurnAnalysis {
  const errors: Array<{ category: string; mistake: string; correction: string; explanation: string }> = [];
  let correctedSentence = userTranscript;
  let naturalSentence = userTranscript;
  let advancedSentence = userTranscript;

  const lower = userTranscript.toLowerCase();

  // Rule 1: Past tense slips (e.g. "i meet", "i go to college yesterday")
  if (lower.includes('yesterday') || lower.includes('last week') || lower.includes('past')) {
    if (/\b(i go|i meet|i discuss about|i see)\b/i.test(userTranscript)) {
      if (lower.includes('i go')) {
        errors.push({
          category: 'Verb Tense',
          mistake: 'I go',
          correction: 'I went',
          explanation: 'When speaking about past events, use the simple past tense "went" instead of "go".',
        });
        correctedSentence = correctedSentence.replace(/\bi go\b/gi, 'I went');
      }
      if (lower.includes('i meet')) {
        errors.push({
          category: 'Verb Tense',
          mistake: 'I meet',
          correction: 'I met',
          explanation: 'Because this happened in the past, use the past tense "met".',
        });
        correctedSentence = correctedSentence.replace(/\bi meet\b/gi, 'I met');
      }
    }
  }

  // Rule 2: "discuss about" -> "discuss"
  if (/\bdiscuss(?:ed)?\s+about\b/i.test(userTranscript)) {
    errors.push({
      category: 'Prepositions',
      mistake: 'discussed about',
      correction: 'discussed',
      explanation: 'The verb "discuss" is transitive and takes a direct object without the preposition "about".',
    });
    correctedSentence = correctedSentence.replace(/\bdiscuss(ed)?\s+about\b/gi, 'discuss$1');
  }

  // Rule 3: Missing preposition "went college" -> "went to college"
  if (/\bwent\s+college\b/i.test(userTranscript)) {
    errors.push({
      category: 'Prepositions',
      mistake: 'went college',
      correction: 'went to college',
      explanation: 'Use the preposition "to" after directional movement verbs like "went" when naming a destination.',
    });
    correctedSentence = correctedSentence.replace(/\bwent\s+college\b/gi, 'went to college');
  }

  // Record detected mistakes
  for (const err of errors) {
    recordUserMistake(userId, err.category, err.mistake, err.correction, err.explanation);
  }

  // Create natural and advanced variations
  if (errors.length > 0) {
    naturalSentence = correctedSentence
      .replace(/I went to college and met my friends/i, 'I went to college today and met up with some friends')
      .replace(/We discussed our project/i, 'We talked through our project ideas');
    advancedSentence = naturalSentence
      .replace(/met up with some friends/i, 'caught up with a few colleagues and discussed our project milestones');
  } else {
    naturalSentence = `Generally, ${userTranscript.charAt(0).toLowerCase() + userTranscript.slice(1)}`;
    advancedSentence = `To elaborate further, ${userTranscript.charAt(0).toLowerCase() + userTranscript.slice(1)}`;
  }

  const gScore = Math.max(55, 95 - errors.length * 15);
  const vScore = vocabUsage.target_vocab_count > 0 ? 90 : 75;
  const fScore = Math.max(45, 88 - fillerAnalysis.total_count * 4);
  const nScore = errors.length === 0 ? 86 : 72;
  const sScore = Math.min(90, Math.max(60, vocabUsage.total_words > 10 ? 82 : 70));

  const overallScore = calculateOverallScore({
    grammar: gScore,
    vocabulary: vScore,
    fluency: fScore,
    naturalness: nScore,
    sentence_formation: sScore,
  });

  const repeatTarget = errors.length > 0 ? correctedSentence : naturalSentence;

  return {
    transcript: userTranscript,
    overall_score: overallScore,
    grammar: {
      score: gScore,
      errors,
    },
    vocabulary: {
      score: vScore,
      total_words: vocabUsage.total_words,
      unique_words: vocabUsage.unique_words,
      target_words_used: vocabUsage.target_vocab_matched,
      advanced_words: vocabUsage.target_vocab_matched,
      suggestions: ['Try incorporating concise phrasing for smoother delivery.'],
    },
    fluency: {
      score: fScore,
      filler_count: fillerAnalysis.total_count,
      filler_words: fillerAnalysis.items,
      advice: fillerAnalysis.advice,
    },
    naturalness: {
      score: nScore,
      feedback: errors.length === 0 ? 'Natural rhythm and clear communication.' : 'Grammar adjustments will make your speech sound more native.',
    },
    sentence_formation: {
      score: sScore,
      structure_quality: 'Complete sentence with clear subject-verb relationship.',
    },
    sentence_improvements: [
      {
        original: userTranscript,
        corrected: correctedSentence,
        natural: naturalSentence,
        advanced: advancedSentence,
        explanation: errors.length > 0
          ? 'Fixed verb tense and prepositions for clarity and natural flow.'
          : 'Enhanced sentence with conversational idioms.',
      },
    ],
    repeat_task: {
      sentence: repeatTarget,
      focus_tip: 'Speak with a relaxed cadence and emphasize key action verbs.',
    },
    follow_up_question: `That is really interesting! What did you and your group decide to do next?`,
    encouragement: 'Great effort speaking your thoughts clearly!',
  };
}

/**
 * Ultra-fast conversational reply generator for Hands-Free Friend mode
 */
export async function generateHandsFreeFriendReply(params: {
  topic: string;
  dialogue: Array<{ speaker: 'user' | 'ai'; text: string }>;
  difficulty?: string;
}): Promise<string> {
  const { topic, dialogue, difficulty = 'Intermediate' } = params;
  const model = getModel();

  if (!model || dialogue.length === 0) {
    return "That's really interesting! Tell me more about why you feel that way.";
  }

  const lastUserTurn = dialogue[dialogue.length - 1]?.text || '';
  const historyText = dialogue
    .map((d) => `${d.speaker === 'user' ? 'User' : 'AI Friend'}: "${d.text}"`)
    .join('\n');

  const prompt = `
You are SpeakWise AI acting as a smart, warm, encouraging English conversational partner and Founder Mentor.
You are in a continuous hands-free voice call with the user.

Conversation Topic: ${topic}
Target English Level: ${difficulty}

Dialogue History So Far:
${historyText}

CRITICAL RULES FOR VOICE CONVERSATION:
1. Speak in 1 to 2 short, natural, conversational sentences (maximum 35 words).
2. React genuinely to what the user just said (validate, ask an insightful follow-up, or share a perspective).
3. Do NOT lecture, do NOT list bullet points, and do NOT correct grammar during the conversation.
4. Keep the energy engaging so the user wants to reply immediately.
5. Return ONLY the spoken response text with NO quotes or stage directions.
`;

  try {
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim().replace(/^["']|["']$/g, '');
    return reply || "I see what you mean! How did that experience impact your goals?";
  } catch (error) {
    console.error('Error generating hands-free reply:', error);
    return "That makes a lot of sense. What do you think is the next big step?";
  }
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

/**
 * Comprehensive Master Diagnostic after a Hands-Free conversation completes
 */
export async function analyzeEntireHandsFreeSession(params: {
  topic: string;
  dialogue: Array<{ speaker: 'user' | 'ai'; text: string }>;
  durationSeconds: number;
  userId: string;
}): Promise<HandsFreeMasterDiagnostic> {
  const { topic, dialogue, durationSeconds, userId } = params;
  const userTurns = dialogue.filter((d) => d.speaker === 'user');
  const userFullTranscript = userTurns.map((u) => u.text).join(' ');

  const fillerStats = detectFillerWords(userFullTranscript);
  const totalUserWords = userFullTranscript.split(/\s+/).filter(Boolean).length;
  const powerWordsUsed = Array.from(new Set(FOUNDER_POWER_WORDS.filter((w) => userFullTranscript.toLowerCase().includes(w.toLowerCase()))));

  const model = getModel();

  if (!model || userTurns.length === 0) {
    return {
      topic,
      durationSeconds,
      totalTurns: userTurns.length,
      totalUserWords,
      overallScore: 78,
      scores: { grammar: 80, vocabulary: 75, fluency: 78, naturalness: 76, executive_presence: 75 },
      allGrammarErrors: [],
      fillerAnalysis: { totalCount: fillerStats.total_count, fillers: fillerStats.items, advice: fillerStats.advice },
      founderPowerWordsUsed: powerWordsUsed,
      sayItBetterUpgrades: [],
      strengths: ['Spoke naturally in a continuous conversational flow.', 'Maintained active dialogue across multiple turns.'],
      improvements: ['Reduce filler words by pausing before complex ideas.'],
      tomorrowsFocus: 'Focus on fluid sentence transitions and consistent verb tenses.',
      encouragement: 'Great job completing your hands-free English conversation!',
    };
  }

  const prompt = `
You are the Chief Linguistic Analyst for SpeakWise AI.
The user just completed a continuous hands-free spoken English session with an AI voice partner.
Analyze the ENTIRE multi-turn conversation and provide a comprehensive Master Diagnostic.

Session Topic: ${topic}
Session Duration: ${durationSeconds} seconds
Full Dialogue Transcript:
${dialogue.map((d) => `[${d.speaker.toUpperCase()}]: ${d.text}`).join('\n')}

DIAGNOSTIC REQUIREMENTS:
1. Identify all genuine grammar mistakes made by the USER across the entire conversation with clear educational explanations.
2. Provide 2-3 "Say It Better" upgrades for key sentences spoken by the user (Corrected, Natural Native, and Polished Executive/Advanced).
3. Score each dimension objectively between 45 and 100.
4. Highlight 2 key strengths and 2 actionable improvement areas.
5. Provide a personalized "Tomorrow's Focus" recommendation.

Return STRICT JSON matching this schema:
{
  "overallScore": number,
  "scores": {
    "grammar": number,
    "vocabulary": number,
    "fluency": number,
    "naturalness": number,
    "executive_presence": number
  },
  "allGrammarErrors": [
    {
      "category": "Verb Tense | Prepositions | Articles | Subject-Verb Agreement | Word Order | Plural/Singular | Pronouns | Modals | General",
      "mistake": "exact mistake snippet",
      "correction": "corrected snippet",
      "explanation": "clear educational reason",
      "userQuote": "the user's sentence containing the mistake"
    }
  ],
  "sayItBetterUpgrades": [
    {
      "original": "user sentence",
      "corrected": "grammatically corrected",
      "natural": "conversational natural native version",
      "advanced": "polished CEO / executive version",
      "explanation": "why this sounds better"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "tomorrowsFocus": "Specific actionable focus for tomorrow's practice",
  "encouragement": "Empowering feedback for the user's progress"
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(result.response.text());

    // Record mistakes into user_mistakes for long-term weakness tracking
    if (Array.isArray(parsed.allGrammarErrors)) {
      for (const err of parsed.allGrammarErrors) {
        if (err.category && err.mistake && err.correction) {
          recordUserMistake(userId, err.category, err.mistake, err.correction, err.explanation || '');
        }
      }
    }

    const gScore = Number(parsed.scores?.grammar) || (parsed.allGrammarErrors?.length === 0 ? 92 : 75);
    const vScore = Number(parsed.scores?.vocabulary) || (powerWordsUsed.length > 0 ? 88 : 78);
    const fScore = Math.max(45, (Number(parsed.scores?.fluency) || 82) - (fillerStats.total_count * 2));
    const nScore = Number(parsed.scores?.naturalness) || 80;
    const eScore = Number(parsed.scores?.executive_presence) || (powerWordsUsed.length > 1 ? 85 : 75);

    const overallScore = Math.round((gScore * 0.25) + (vScore * 0.2) + (fScore * 0.2) + (nScore * 0.2) + (eScore * 0.15));

    return {
      topic,
      durationSeconds,
      totalTurns: userTurns.length,
      totalUserWords,
      overallScore: parsed.overallScore || overallScore,
      scores: {
        grammar: gScore,
        vocabulary: vScore,
        fluency: fScore,
        naturalness: nScore,
        executive_presence: eScore,
      },
      allGrammarErrors: parsed.allGrammarErrors || [],
      fillerAnalysis: {
        totalCount: fillerStats.total_count,
        fillers: fillerStats.items,
        advice: fillerStats.advice,
      },
      founderPowerWordsUsed: powerWordsUsed,
      sayItBetterUpgrades: parsed.sayItBetterUpgrades || [],
      strengths: parsed.strengths || ['Maintained continuous conversational flow.'],
      improvements: parsed.improvements || ['Practice using more diverse descriptive vocabulary.'],
      tomorrowsFocus: parsed.tomorrowsFocus || 'Daily conversational flow with targeted grammar precision.',
      encouragement: parsed.encouragement || 'Outstanding work! Hands-free conversation builds natural muscle memory fast.',
    };
  } catch (error) {
    console.error('Error analyzing hands-free session with Gemini:', error);
    return {
      topic,
      durationSeconds,
      totalTurns: userTurns.length,
      totalUserWords,
      overallScore: 80,
      scores: { grammar: 82, vocabulary: 78, fluency: 80, naturalness: 78, executive_presence: 76 },
      allGrammarErrors: [],
      fillerAnalysis: { totalCount: fillerStats.total_count, fillers: fillerStats.items, advice: fillerStats.advice },
      founderPowerWordsUsed: powerWordsUsed,
      sayItBetterUpgrades: [],
      strengths: ['Great continuous speaking stamina.'],
      improvements: ['Incorporate more complex clause connectors.'],
      tomorrowsFocus: 'Natural phrasing and transition words.',
      encouragement: 'Great job staying consistent!',
    };
  }
}

