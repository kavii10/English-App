import { Router } from 'express';
import { db, ensureUserExists } from '../db/database.js';
import { calculateNextReview, SRSGrade } from '../services/srs.js';
import { evaluateFlashcardSentence, generateMoreVocabulary } from '../services/gemini.js';
import { syncFlashcardToSupabase } from '../db/supabase.js';

const router = Router();

/**
 * GET /api/vocabulary/today
 * Returns 5 curated vocabulary words for today and ensures user flashcards exist.
 */
router.get('/today', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'usr_default';
    ensureUserExists(userId);
    
    // Get 5 words for today (rotating based on day of year)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const allVocab = db.prepare('SELECT * FROM vocabulary ORDER BY id ASC').all() as any[];
    
    if (allVocab.length === 0) {
      return res.json({ words: [] });
    }

    const startIndex = (dayOfYear * 5) % allVocab.length;
    const selectedVocab: any[] = [];
    for (let i = 0; i < Math.min(5, allVocab.length); i++) {
      selectedVocab.push(allVocab[(startIndex + i) % allVocab.length]);
    }

    // Ensure flashcards exist for user
    const insertFlashcardStmt = db.prepare(`
      INSERT OR IGNORE INTO user_flashcards (
        id, user_id, vocabulary_id, mastery_score, review_count, correct_count, incorrect_count,
        interval_days, ease_factor, last_reviewed, next_review, favorite, status, times_used_in_conversation
      ) VALUES (?, ?, ?, 0, 0, 0, 0, 1, 2.5, NULL, CURRENT_TIMESTAMP, 0, 'New', 0)
    `);

    const enrichedWords = selectedVocab.map((v) => {
      const flashcardId = `fc_${v.word}_${userId}`;
      insertFlashcardStmt.run(flashcardId, userId, v.id);

      const flashcard = db.prepare('SELECT * FROM user_flashcards WHERE user_id = ? AND vocabulary_id = ?').get(userId, v.id) as any;

      return {
        ...v,
        synonyms: JSON.parse(v.synonyms_json || '[]'),
        antonyms: JSON.parse(v.antonyms_json || '[]'),
        flashcard: flashcard || {
          id: flashcardId,
          mastery_score: 0,
          status: 'New',
          review_count: 0,
          favorite: 0,
          times_used_in_conversation: 0,
        },
      };
    });

    res.json({ words: enrichedWords });
  } catch (error: any) {
    console.error('Error fetching today vocab:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vocabulary/generate-more
 * Uses Gemini AI to generate 5 brand new communication vocabulary words and automatically saves them as user flashcards.
 */
router.post('/generate-more', async (req, res) => {
  try {
    const userId = req.body.userId || 'usr_default';
    const category = req.body.category || 'Communication';
    const difficulty = req.body.difficulty || 'Intermediate';

    // Get list of existing words to prevent duplicates
    const existing = db.prepare('SELECT word FROM vocabulary').all() as Array<{ word: string }>;
    const existingWords = existing.map((e) => e.word.toLowerCase());

    const newItems = await generateMoreVocabulary({
      existingWords,
      category,
      difficulty,
    });

    if (newItems.length === 0) {
      return res.status(500).json({ error: 'Failed to generate new vocabulary from AI.' });
    }

    const insertVocabStmt = db.prepare(`
      INSERT OR IGNORE INTO vocabulary (
        id, word, pronunciation, part_of_speech, simple_meaning, 
        contextual_meaning, example_sentence, synonyms_json, antonyms_json, difficulty, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFlashcardStmt = db.prepare(`
      INSERT OR IGNORE INTO user_flashcards (
        id, user_id, vocabulary_id, mastery_score, review_count, correct_count, incorrect_count,
        interval_days, ease_factor, last_reviewed, next_review, favorite, status, times_used_in_conversation
      ) VALUES (?, ?, ?, 0, 0, 0, 0, 1, 2.5, NULL, CURRENT_TIMESTAMP, 0, 'New', 0)
    `);

    const savedWords: any[] = [];

    for (const item of newItems) {
      insertVocabStmt.run(
        item.id,
        item.word,
        item.pronunciation,
        item.part_of_speech,
        item.simple_meaning,
        item.contextual_meaning,
        item.example_sentence,
        JSON.stringify(item.synonyms),
        JSON.stringify(item.antonyms),
        item.difficulty,
        item.category
      );

      const flashcardId = `fc_${item.word.replace(/[^a-z0-9]/g, '_')}_${userId}`;
      insertFlashcardStmt.run(flashcardId, userId, item.id);

      // Sync to Supabase
      syncFlashcardToSupabase({
        id: flashcardId,
        vocabulary_id: item.id,
        user_id: userId,
        mastery_score: 0,
        review_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        interval_days: 1,
        ease_factor: 2.5,
        status: 'New',
        last_reviewed: null,
      });

      savedWords.push({
        ...item,
        flashcard: {
          id: flashcardId,
          mastery_score: 0,
          status: 'New',
          review_count: 0,
          favorite: false,
          times_used_in_conversation: 0,
        },
      });
    }

    res.json({
      success: true,
      message: `Generated and stored ${savedWords.length} new vocabulary words into your Flashcards!`,
      words: savedWords,
    });
  } catch (error: any) {
    console.error('Error in generate-more vocabulary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vocabulary/flashcards
 * List all flashcards with filters: category (All, New, Learning, Mastered, Difficult, Favorites), search
 */
router.get('/flashcards', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'usr_default';
    const filter = (req.query.filter as string) || 'All';
    const search = ((req.query.search as string) || '').trim().toLowerCase();

    let query = `
      SELECT 
        uf.id as flashcard_id,
        uf.mastery_score,
        uf.review_count,
        uf.correct_count,
        uf.incorrect_count,
        uf.interval_days,
        uf.last_reviewed,
        uf.next_review,
        uf.favorite,
        uf.status,
        uf.user_sentence,
        uf.times_used_in_conversation,
        v.id as vocabulary_id,
        v.word,
        v.pronunciation,
        v.part_of_speech,
        v.simple_meaning,
        v.contextual_meaning,
        v.example_sentence,
        v.synonyms_json,
        v.antonyms_json,
        v.difficulty,
        v.category
      FROM user_flashcards uf
      JOIN vocabulary v ON uf.vocabulary_id = v.id
      WHERE uf.user_id = ?
    `;

    const params: any[] = [userId];

    if (filter === 'Favorites') {
      query += ' AND uf.favorite = 1';
    } else if (['New', 'Learning', 'Mastered', 'Difficult'].includes(filter)) {
      query += ' AND uf.status = ?';
      params.push(filter);
    }

    if (search) {
      query += ' AND (LOWER(v.word) LIKE ? OR LOWER(v.simple_meaning) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY uf.favorite DESC, uf.next_review ASC';

    const rows = db.prepare(query).all(...params) as any[];

    const flashcards = rows.map((r) => ({
      id: r.flashcard_id,
      vocabulary_id: r.vocabulary_id,
      word: r.word,
      pronunciation: r.pronunciation,
      part_of_speech: r.part_of_speech,
      simple_meaning: r.simple_meaning,
      contextual_meaning: r.contextual_meaning,
      example_sentence: r.example_sentence,
      synonyms: JSON.parse(r.synonyms_json || '[]'),
      antonyms: JSON.parse(r.antonyms_json || '[]'),
      difficulty: r.difficulty,
      category: r.category,
      mastery_score: r.mastery_score,
      review_count: r.review_count,
      correct_count: r.correct_count,
      incorrect_count: r.incorrect_count,
      interval_days: r.interval_days,
      last_reviewed: r.last_reviewed,
      next_review: r.next_review,
      favorite: Boolean(r.favorite),
      status: r.status,
      user_sentence: r.user_sentence,
      times_used_in_conversation: r.times_used_in_conversation,
    }));

    res.json({ flashcards });
  } catch (error: any) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vocabulary/flashcards/:id/review
 * Submit a spaced repetition recall rating (1: Again, 2: Hard, 3: Good, 4: Easy)
 */
router.post('/flashcards/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body; // 1, 2, 3, or 4

    const validGrade = Number(grade) as SRSGrade;
    if (![1, 2, 3, 4].includes(validGrade)) {
      return res.status(400).json({ error: 'Grade must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).' });
    }

    const card = db.prepare('SELECT * FROM user_flashcards WHERE id = ?').get(id) as any;
    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found.' });
    }

    const nextState = calculateNextReview(
      {
        review_count: card.review_count,
        correct_count: card.correct_count,
        incorrect_count: card.incorrect_count,
        interval_days: card.interval_days,
        ease_factor: card.ease_factor,
        mastery_score: card.mastery_score,
      },
      validGrade
    );

    db.prepare(`
      UPDATE user_flashcards
      SET review_count = ?, correct_count = ?, incorrect_count = ?, interval_days = ?,
          ease_factor = ?, mastery_score = ?, status = ?, last_reviewed = ?, next_review = ?
      WHERE id = ?
    `).run(
      nextState.review_count,
      nextState.correct_count,
      nextState.incorrect_count,
      nextState.interval_days,
      nextState.ease_factor,
      nextState.mastery_score,
      nextState.status,
      nextState.last_reviewed,
      nextState.next_review,
      id
    );

    // Sync to Supabase
    syncFlashcardToSupabase({
      id,
      vocabulary_id: card.vocabulary_id,
      user_id: card.user_id,
      mastery_score: nextState.mastery_score,
      review_count: nextState.review_count,
      correct_count: nextState.correct_count,
      incorrect_count: nextState.incorrect_count,
      interval_days: nextState.interval_days,
      ease_factor: nextState.ease_factor,
      status: nextState.status,
      last_reviewed: nextState.last_reviewed,
      next_review: nextState.next_review,
    });

    res.json({ success: true, updatedCard: nextState });
  } catch (error: any) {
    console.error('Error reviewing flashcard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vocabulary/flashcards/:id/favorite
 * Toggle favorite flag
 */
router.post('/flashcards/:id/favorite', (req, res) => {
  try {
    const { id } = req.params;
    const card = db.prepare('SELECT favorite FROM user_flashcards WHERE id = ?').get(id) as any;
    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found.' });
    }

    const newFavorite = card.favorite ? 0 : 1;
    db.prepare('UPDATE user_flashcards SET favorite = ? WHERE id = ?').run(newFavorite, id);

    res.json({ success: true, favorite: Boolean(newFavorite) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vocabulary/flashcards/:id/status
 * Manually update status (Mastered, Learning, Difficult, New)
 */
router.post('/flashcards/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['New', 'Learning', 'Mastered', 'Difficult'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const mastery = status === 'Mastered' ? 100 : (status === 'Difficult' ? 25 : 50);

    db.prepare('UPDATE user_flashcards SET status = ?, mastery_score = ? WHERE id = ?').run(status, mastery, id);
    res.json({ success: true, status, mastery_score: mastery });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vocabulary/flashcards/:id/practice-sentence
 * AI evaluation of user-created sentence using the word
 */
router.post('/flashcards/:id/practice-sentence', async (req, res) => {
  try {
    const { id } = req.params;
    const { sentence } = req.body;

    if (!sentence || !sentence.trim()) {
      return res.status(400).json({ error: 'Sentence cannot be empty.' });
    }

    const row = db.prepare(`
      SELECT uf.id, v.word, v.simple_meaning, uf.user_id
      FROM user_flashcards uf
      JOIN vocabulary v ON uf.vocabulary_id = v.id
      WHERE uf.id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Flashcard not found.' });
    }

    const evaluation = await evaluateFlashcardSentence({
      word: row.word,
      meaning: row.simple_meaning,
      userSentence: sentence.trim(),
    });

    // Save sentence to flashcard
    db.prepare('UPDATE user_flashcards SET user_sentence = ? WHERE id = ?').run(sentence.trim(), id);

    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error evaluating practice sentence:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/vocabulary/flashcards/:id
 * Remove or reset flashcard
 */
router.delete('/flashcards/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`
      UPDATE user_flashcards 
      SET status = 'New', mastery_score = 0, review_count = 0, correct_count = 0, 
          incorrect_count = 0, favorite = 0, user_sentence = NULL
      WHERE id = ?
    `).run(id);
    res.json({ success: true, message: 'Flashcard reset to default state.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
