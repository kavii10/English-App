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
}): Promise<ConversationTurnAnalysis> {
  const {
    aiPrompt,
    userTranscript,
    targetVocab = ['articulate', 'accomplish', 'concise', 'reluctant', 'overwhelmed'],
    userWeakness = 'Past Tense',
    difficulty = 'Intermediate',
    userId = 'usr_default',
  } = params;

  // Compute deterministic filler word statistics and vocabulary usage
  const fillerAnalysis = detectFillerWords(userTranscript);
  const vocabUsage = analyzeVocabularyUsage(userTranscript, targetVocab);

  const model = getModel();

  if (!model) {
    return generateFallbackAnalysis(aiPrompt, userTranscript, targetVocab, fillerAnalysis, vocabUsage, userId);
  }

  const systemInstruction = `
You are the analysis engine for SpeakWise AI, a high-precision English communication coach.
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
  "encouragement": "short motivating remark"
}
`;

  const userContent = `
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
    };
  } catch (error) {
    console.error('Error analyzing response with Gemini JSON schema, using resilient fallback:', error);
    return generateFallbackAnalysis(aiPrompt, userTranscript, targetVocab, fillerAnalysis, vocabUsage, userId);
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
    console.error('Error generating vocabulary with Gemini:', error);
    return [];
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
