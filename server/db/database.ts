import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'speakwise.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- User profile & stats
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Learner',
      email TEXT,
      level TEXT NOT NULL DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced
      target_daily_minutes INTEGER NOT NULL DEFAULT 5,
      streak INTEGER NOT NULL DEFAULT 7,
      last_active_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings (e.g. custom Gemini API Key, voice preferences)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Speaking Sessions
    CREATE TABLE IF NOT EXISTS speaking_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Intermediate',
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      overall_score REAL NOT NULL DEFAULT 0,
      grammar_score REAL NOT NULL DEFAULT 0,
      vocabulary_score REAL NOT NULL DEFAULT 0,
      fluency_score REAL NOT NULL DEFAULT 0,
      naturalness_score REAL NOT NULL DEFAULT 0,
      sentence_score REAL NOT NULL DEFAULT 0,
      target_vocab_used_count INTEGER NOT NULL DEFAULT 0,
      total_words_spoken INTEGER NOT NULL DEFAULT 0,
      filler_words_count INTEGER NOT NULL DEFAULT 0,
      sentences_improved_count INTEGER NOT NULL DEFAULT 0,
      strengths_json TEXT,
      improvements_json TEXT,
      tomorrows_focus TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Speaking Responses (Individual conversational turns)
    CREATE TABLE IF NOT EXISTS speaking_responses (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      ai_prompt TEXT NOT NULL,
      user_transcript TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      repeat_attempt_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES speaking_sessions(id) ON DELETE CASCADE
    );

    -- Sentence Improvements (3-tier: Correct, Natural, Advanced)
    CREATE TABLE IF NOT EXISTS sentence_improvements (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL,
      original_sentence TEXT NOT NULL,
      corrected_sentence TEXT NOT NULL,
      natural_sentence TEXT NOT NULL,
      advanced_sentence TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (response_id) REFERENCES speaking_responses(id) ON DELETE CASCADE
    );

    -- Vocabulary Core Catalog
    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL UNIQUE,
      pronunciation TEXT NOT NULL,
      part_of_speech TEXT NOT NULL,
      simple_meaning TEXT NOT NULL,
      contextual_meaning TEXT NOT NULL,
      example_sentence TEXT NOT NULL,
      synonyms_json TEXT NOT NULL,
      antonyms_json TEXT NOT NULL,
      difficulty TEXT NOT NULL, -- Beginner, Intermediate, Advanced
      category TEXT NOT NULL, -- Communication, Career, Academic, Everyday, Phrasal Verbs
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User Flashcards (SRS state)
    CREATE TABLE IF NOT EXISTS user_flashcards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      vocabulary_id TEXT NOT NULL,
      mastery_score REAL NOT NULL DEFAULT 0, -- 0 to 100%
      review_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      incorrect_count INTEGER NOT NULL DEFAULT 0,
      interval_days INTEGER NOT NULL DEFAULT 1,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      last_reviewed DATETIME,
      next_review DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      favorite INTEGER NOT NULL DEFAULT 0, -- 0 or 1
      status TEXT NOT NULL DEFAULT 'New', -- New, Learning, Mastered, Difficult
      user_sentence TEXT,
      times_used_in_conversation INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
      UNIQUE(user_id, vocabulary_id)
    );

    -- User Mistakes Track (Personal Weakness Engine)
    CREATE TABLE IF NOT EXISTS user_mistakes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL, -- Verb Tense, Prepositions, Articles, Subject-Verb Agreement, Word Order, Singular/Plural, Filler Word, etc.
      mistake TEXT NOT NULL,
      correction TEXT NOT NULL,
      explanation TEXT NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 1,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Daily Missions
    CREATE TABLE IF NOT EXISTS daily_missions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mission_date TEXT NOT NULL,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      target_weakness TEXT NOT NULL,
      target_vocab_ids_json TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indexes for high-performance lookups
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON speaking_sessions(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_responses_session ON speaking_responses(session_id);
    CREATE INDEX IF NOT EXISTS idx_flashcards_user_status ON user_flashcards(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON user_flashcards(user_id, next_review);
    CREATE INDEX IF NOT EXISTS idx_mistakes_user_cat ON user_mistakes(user_id, category);
  `);

  try {
    db.exec(`ALTER TABLE speaking_sessions ADD COLUMN tomorrows_focus TEXT`);
  } catch (e) {
    // Column already exists
  }

  console.log('Database initialized successfully at', dbPath);
}

/**
 * Ensures a user record exists in the users table to prevent FOREIGN KEY errors
 */
export function ensureUserExists(userId: string, name?: string, email?: string): void {
  if (!userId) return;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    const defaultName = name || (userId.startsWith('usr_') ? userId.replace('usr_', '').replace(/_/g, ' ') : 'Learner');
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, level, streak, last_active_date)
      VALUES (?, ?, ?, 'Intermediate', 1, DATE('now'))
    `).run(userId, defaultName, email || null);
  }
}
