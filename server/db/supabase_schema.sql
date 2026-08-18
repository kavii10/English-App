-- Supabase PostgreSQL Schema for SpeakWise AI

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Learner',
  email TEXT,
  level TEXT NOT NULL DEFAULT 'Intermediate',
  target_daily_minutes INTEGER NOT NULL DEFAULT 5,
  streak INTEGER NOT NULL DEFAULT 7,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Speaking Sessions Table
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Speaking Responses Table
CREATE TABLE IF NOT EXISTS public.speaking_responses (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.speaking_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  ai_prompt TEXT NOT NULL,
  user_transcript TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  repeat_attempt_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Sentence Improvements Table
CREATE TABLE IF NOT EXISTS public.sentence_improvements (
  id TEXT PRIMARY KEY,
  response_id TEXT REFERENCES public.speaking_responses(id) ON DELETE CASCADE,
  original_sentence TEXT NOT NULL,
  corrected_sentence TEXT NOT NULL,
  natural_sentence TEXT NOT NULL,
  advanced_sentence TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Vocabulary Table
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

-- User Flashcards Table
CREATE TABLE IF NOT EXISTS public.user_flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  vocabulary_id TEXT REFERENCES public.vocabulary(id) ON DELETE CASCADE,
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

-- User Mistakes Table
CREATE TABLE IF NOT EXISTS public.user_mistakes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  mistake TEXT NOT NULL,
  correction TEXT NOT NULL,
  explanation TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Daily Missions Table
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  target_weakness TEXT NOT NULL,
  target_vocab_ids_json TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
