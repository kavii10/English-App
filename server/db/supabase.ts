import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://chveznbjyxlegnrertan.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
    console.log('✅ Supabase Client initialized for:', supabaseUrl);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!supabase) {
    return { connected: false, error: 'Supabase client not initialized (missing URL or Key)' };
  }

  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.log('Supabase connection note:', error.message);
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Connection test failed' };
  }
}

/**
 * Upsert User Profile into Supabase
 */
export async function syncUserToSupabase(userData: {
  id: string;
  name: string;
  email?: string;
  level?: string;
  streak?: number;
  target_daily_minutes?: number;
}) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('users').upsert({
      id: userData.id,
      name: userData.name,
      email: userData.email || null,
      level: userData.level || 'Intermediate',
      streak: userData.streak ?? 0,
      target_daily_minutes: userData.target_daily_minutes || 5,
      last_active_date: new Date().toISOString().split('T')[0],
    });
    if (error) {
      console.warn('Supabase syncUser warning:', error.message);
    } else {
      console.log(`✅ Synced user ${userData.id} to Supabase`);
    }
  } catch (err: any) {
    console.warn('Supabase user sync error:', err?.message);
  }
}

/**
 * Helper to sync or save a speaking session to Supabase
 */
export async function syncSessionToSupabase(sessionData: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('speaking_sessions').upsert({
      id: sessionData.id || sessionData.sessionId,
      user_id: sessionData.user_id || 'usr_default',
      topic: sessionData.topic || 'English Conversation',
      difficulty: sessionData.difficulty || 'Intermediate',
      duration_seconds: sessionData.duration_seconds || sessionData.durationSeconds || 0,
      overall_score: sessionData.overall_score || sessionData.overallScore || 0,
      grammar_score: sessionData.grammar_score || sessionData.scores?.grammar || 0,
      vocabulary_score: sessionData.vocabulary_score || sessionData.scores?.vocabulary || 0,
      fluency_score: sessionData.fluency_score || sessionData.scores?.fluency || 0,
      naturalness_score: sessionData.naturalness_score || sessionData.scores?.naturalness || 0,
      sentence_score: sessionData.sentence_score || sessionData.scores?.sentence_formation || 0,
      target_vocab_used_count: sessionData.target_vocab_used_count || sessionData.targetVocabUsed || 0,
      total_words_spoken: sessionData.total_words_spoken || sessionData.totalWordsSpoken || 0,
      filler_words_count: sessionData.filler_words_count || sessionData.fillerWordsCount || 0,
      sentences_improved_count: sessionData.sentences_improved_count || sessionData.sentencesImproved || 0,
      strengths_json: JSON.stringify(sessionData.strengths || []),
      improvements_json: JSON.stringify(sessionData.improvements || []),
    });

    if (error) {
      console.warn('Note on Supabase session sync:', error.message);
    } else {
      console.log(`✅ Synced speaking session ${sessionData.id} to Supabase`);
    }
  } catch (err: any) {
    console.warn('Supabase session sync error:', err?.message);
  }
}

/**
 * Helper to sync flashcard review to Supabase
 */
export async function syncFlashcardToSupabase(flashcardData: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('user_flashcards').upsert({
      id: flashcardData.id,
      user_id: flashcardData.user_id,
      vocabulary_id: flashcardData.vocabulary_id,
      mastery_score: flashcardData.mastery_score ?? 0,
      review_count: flashcardData.review_count ?? 0,
      correct_count: flashcardData.correct_count ?? 0,
      incorrect_count: flashcardData.incorrect_count ?? 0,
      interval_days: flashcardData.interval_days ?? 1,
      ease_factor: flashcardData.ease_factor ?? 2.5,
      status: flashcardData.status || 'New',
      last_reviewed: flashcardData.last_reviewed || null,
      next_review: flashcardData.next_review || new Date().toISOString(),
    });
    if (error) {
      console.warn('Note on Supabase flashcard sync:', error.message);
    } else {
      console.log(`✅ Synced flashcard ${flashcardData.id} to Supabase`);
    }
  } catch (err: any) {
    console.warn('Supabase flashcard sync error:', err?.message);
  }
}

/**
 * Helper to sync mistake to Supabase
 */
export async function syncMistakeToSupabase(mistakeData: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('user_mistakes').upsert({
      id: mistakeData.id,
      user_id: mistakeData.user_id,
      category: mistakeData.category,
      mistake: mistakeData.mistake,
      correction: mistakeData.correction,
      explanation: mistakeData.explanation,
      frequency: mistakeData.frequency || 1,
      last_seen: mistakeData.last_seen || new Date().toISOString(),
    });
    if (error) {
      console.warn('Note on Supabase mistake sync:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase mistake sync error:', err?.message);
  }
}
