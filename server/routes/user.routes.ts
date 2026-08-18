import { Router } from 'express';
import { db } from '../db/database.js';
import { getApiKey, setApiKey, testGeminiApiKey } from '../services/gemini.js';

const router = Router();

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
