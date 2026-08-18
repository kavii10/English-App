-- Supabase PostgreSQL Schema with Open RLS Policies for SpeakWise AI

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Learner',
  email TEXT,
  level TEXT NOT NULL DEFAULT 'Intermediate',
  target_daily_minutes INTEGER NOT NULL DEFAULT 5,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Speaking Sessions Table
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  grammar_score NUMERIC NOT NULL DEFAULT 0,
  vocabulary_score NUMERIC NOT NULL DEFAULT 0,
  fluency_score NUMERIC NOT NULL DEFAULT 0,
  naturalness_score NUMERIC NOT NULL DEFAULT 0,
  sentence_score NUMERIC NOT NULL DEFAULT 0,
  target_vocab_used_count INTEGER NOT NULL DEFAULT 0,
  total_words_spoken INTEGER NOT NULL DEFAULT 0,
  filler_words_count INTEGER NOT NULL DEFAULT 0,
  sentences_improved_count INTEGER NOT NULL DEFAULT 0,
  strengths_json TEXT,
  improvements_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Speaking Responses Table
CREATE TABLE IF NOT EXISTS public.speaking_responses (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  turn_number INTEGER NOT NULL,
  ai_prompt TEXT NOT NULL,
  user_transcript TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  repeat_attempt_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Sentence Improvements Table
CREATE TABLE IF NOT EXISTS public.sentence_improvements (
  id TEXT PRIMARY KEY,
  response_id TEXT,
  original_sentence TEXT NOT NULL,
  corrected_sentence TEXT NOT NULL,
  natural_sentence TEXT NOT NULL,
  advanced_sentence TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create Vocabulary Table
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  pronunciation TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  simple_meaning TEXT NOT NULL,
  contextual_meaning TEXT NOT NULL,
  example_sentence TEXT NOT NULL,
  synonyms_json TEXT NOT NULL,
  antonyms_json TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create User Flashcards Table
CREATE TABLE IF NOT EXISTS public.user_flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  vocabulary_id TEXT,
  mastery_score NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'New',
  user_sentence TEXT,
  times_used_in_conversation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Create User Mistakes Table
CREATE TABLE IF NOT EXISTS public.user_mistakes (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  category TEXT NOT NULL,
  mistake TEXT NOT NULL,
  correction TEXT NOT NULL,
  explanation TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Create Daily Missions Table
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  mission_date DATE NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  target_weakness TEXT NOT NULL,
  target_vocab_ids_json TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- DISABLE ROW LEVEL SECURITY (or enable public access) so anon client key can store data safely:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentence_improvements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mistakes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions DISABLE ROW LEVEL SECURITY;
