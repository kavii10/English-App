import { Router } from 'express';
import { db } from '../db/database.js';
import { getApiKey, setApiKey, testGeminiApiKey } from '../services/gemini.js';
import { syncUserToSupabase } from '../db/supabase.js';
import { VOCABULARY_SEED_DATA } from '../db/seed.js';

const router = Router();

/**
 * POST /api/user/auth
 * Simple login / registration that creates or restores a unique user account and syncs to Supabase
 */
router.post('/auth', async (req, res) => {
  try {
    const { name = 'Learner', email = '', level = 'Intermediate' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    let user = db.prepare('SELECT * FROM users WHERE id = ? OR email = ?').get(userId, cleanEmail) as any;

    if (!user) {
      db.prepare(`
        INSERT INTO users (id, name, email, level, target_daily_minutes, streak, last_active_date)
        VALUES (?, ?, ?, ?, 5, 0, DATE('now'))
      `).run(userId, name.trim() || 'Learner', cleanEmail, level);

      // Create flashcards for new user
      const insertFlashcardStmt = db.prepare(`
        INSERT OR IGNORE INTO user_flashcards (
          id, user_id, vocabulary_id, mastery_score, review_count, correct_count, incorrect_count,
          interval_days, ease_factor, last_reviewed, next_review, favorite, status, times_used_in_conversation
        ) VALUES (?, ?, ?, 0, 0, 0, 0, 1, 2.5, NULL, CURRENT_TIMESTAMP, 0, 'New', 0)
      `);

      const allVocab = db.prepare('SELECT id, word FROM vocabulary').all() as Array<{ id: string; word: string }>;
      for (const item of allVocab) {
        const flashcardId = `fc_${item.word.replace(/[^a-z0-9]/g, '_')}_${userId}`;
        insertFlashcardStmt.run(flashcardId, userId, item.id);
      }

      // Create today's mission
      const todayStr = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT OR IGNORE INTO daily_missions (
          id, user_id, mission_date, title, topic, target_weakness, target_vocab_ids_json, completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        `msn_${todayStr}_${userId}`,
        userId,
        todayStr,
        "Introduce yourself and share your daily goals with your AI coach",
        "Introduce Yourself & Share Your Daily Goals",
        "Initial Communication Diagnostic",
        JSON.stringify(['vocab-articulate', 'vocab-accomplish', 'vocab-concise', 'vocab-reluctant', 'vocab-overwhelmed'])
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    // Sync user to Supabase
    syncUserToSupabase({
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      streak: user.streak,
      target_daily_minutes: user.target_daily_minutes,
    });

    res.json({
      success: true,
      user,
      message: `Welcome ${user.name}! Connected to your unique profile.`,
    });
  } catch (error: any) {
    console.error('Error in /api/user/auth:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/profile
 */
router.get('/profile', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'usr_default';
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/user/profile
 */
router.put('/profile', (req, res) => {
  try {
    const userId = req.body.userId || 'usr_default';
    const { name, level, target_daily_minutes } = req.body;

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          level = COALESCE(?, level),
          target_daily_minutes = COALESCE(?, target_daily_minutes)
      WHERE id = ?
    `).run(name, level, target_daily_minutes, userId);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json({ user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/settings
 */
router.get('/settings', (req, res) => {
  try {
    const currentKey = getApiKey();
    res.json({
      has_gemini_api_key: Boolean(currentKey && currentKey.length > 0),
      masked_api_key: currentKey ? `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}` : '',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/settings/api-key
 */
router.post('/settings/api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'API Key cannot be empty.' });
    }

    const testResult = await testGeminiApiKey(apiKey.trim());

    if (!testResult.success) {
      return res.status(400).json({ error: testResult.message });
    }

    setApiKey(apiKey.trim());

    res.json({
      success: true,
      message: 'Gemini API Key validated and saved successfully!',
      model: testResult.model,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/privacy/clear-history
 */
router.post('/privacy/clear-history', (req, res) => {
  try {
    const userId = req.body.userId || 'usr_default';
    db.prepare('DELETE FROM speaking_sessions WHERE user_id = ?').run(userId);
    res.json({ success: true, message: 'All speaking session history deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/privacy/reset-mistakes
 */
router.post('/privacy/reset-mistakes', (req, res) => {
  try {
    const userId = req.body.userId || 'usr_default';
    db.prepare('DELETE FROM user_mistakes WHERE user_id = ?').run(userId);
    res.json({ success: true, message: 'Weakness tracking history reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/privacy/reset-flashcards
 */
router.post('/privacy/reset-flashcards', (req, res) => {
  try {
    const userId = req.body.userId || 'usr_default';
    db.prepare(`
      UPDATE user_flashcards
      SET mastery_score = 0, review_count = 0, correct_count = 0, incorrect_count = 0,
          interval_days = 1, status = 'New', times_used_in_conversation = 0, favorite = 0, user_sentence = NULL
      WHERE user_id = ?
    `).run(userId);
    res.json({ success: true, message: 'Vocabulary progress reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/privacy/export
 */
router.get('/privacy/export', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'usr_default';

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const sessions = db.prepare('SELECT * FROM speaking_sessions WHERE user_id = ?').all(userId);
    const flashcards = db.prepare(`
      SELECT uf.*, v.word, v.simple_meaning
      FROM user_flashcards uf
      JOIN vocabulary v ON uf.vocabulary_id = v.id
      WHERE uf.user_id = ?
    `).all(userId);
    const mistakes = db.prepare('SELECT * FROM user_mistakes WHERE user_id = ?').all(userId);

    res.json({
      exported_at: new Date().toISOString(),
      user,
      sessions,
      flashcards,
      mistakes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
