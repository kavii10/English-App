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
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.users" does not exist')) {
      // If table doesn't exist yet, connection is still valid
      console.log('Supabase connection responded:', error.message);
    }
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Connection test failed' };
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
      topic: sessionData.topic,
      difficulty: sessionData.difficulty || 'Intermediate',
      duration_seconds: sessionData.duration_seconds || sessionData.durationSeconds,
      overall_score: sessionData.overall_score || sessionData.overallScore,
      grammar_score: sessionData.grammar_score || sessionData.scores?.grammar,
      vocabulary_score: sessionData.vocabulary_score || sessionData.scores?.vocabulary,
      fluency_score: sessionData.fluency_score || sessionData.scores?.fluency,
      naturalness_score: sessionData.naturalness_score || sessionData.scores?.naturalness,
      sentence_score: sessionData.sentence_score || sessionData.scores?.sentence_formation,
      target_vocab_used_count: sessionData.target_vocab_used_count || sessionData.targetVocabUsed,
      total_words_spoken: sessionData.total_words_spoken || sessionData.totalWordsSpoken,
      filler_words_count: sessionData.filler_words_count || sessionData.fillerWordsCount,
      sentences_improved_count: sessionData.sentences_improved_count || sessionData.sentencesImproved,
      strengths_json: JSON.stringify(sessionData.strengths || []),
      improvements_json: JSON.stringify(sessionData.improvements || []),
    });

    if (error) {
      console.warn('Note on Supabase session sync (table may need migrations):', error.message);
    } else {
      console.log('Synced speaking session to Supabase successfully.');
    }
  } catch (err) {
    console.warn('Supabase session sync skipped:', err);
  }
}

/**
 * Helper to sync flashcard review to Supabase
 */
export async function syncFlashcardToSupabase(flashcardData: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('user_flashcards').upsert(flashcardData);
    if (error) {
      console.warn('Note on Supabase flashcard sync:', error.message);
    }
  } catch (err) {
    console.warn('Supabase flashcard sync skipped:', err);
  }
}
