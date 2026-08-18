import { Router } from 'express';
import { db } from '../db/database.js';
import {
  generateConversationStarter,
  analyzeUserResponse,
  compareSpokenRepeatAttempt,
} from '../services/gemini.js';
import { getUserWeaknessProfile } from '../services/weakness.js';
import { calculateOverallScore } from '../services/scoring.js';
import { syncSessionToSupabase } from '../db/supabase.js';

const router = Router();

/**
 * POST /api/conversation/start
 * Starts a new speaking session, sets up target vocabulary and weakness context, generates opening question
 */
router.post('/start', async (req, res) => {
  try {
    const userId = req.body.userId || 'usr_default';
    const difficulty = req.body.difficulty || 'Intermediate';
    const topic = req.body.topic || 'Daily Experiences & Personal Goals';

    // 1. Get today's target 5 vocabulary words
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const allVocab = db.prepare('SELECT word FROM vocabulary ORDER BY id ASC').all() as Array<{ word: string }>;
    const targetVocab = allVocab.slice(0, 5).map((v) => v.word);

    // 2. Get user weakness profile
    const weaknessProfile = getUserWeaknessProfile(userId);
    const primaryWeakness = weaknessProfile.top_weakness;

    // 3. Generate opening prompt with Gemini
    const aiPrompt = await generateConversationStarter({
      topic,
      targetVocab,
      userWeakness: primaryWeakness,
      difficulty,
    });

    // 4. Create speaking session record
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO speaking_sessions (
        id, user_id, topic, difficulty, duration_seconds, overall_score,
        grammar_score, vocabulary_score, fluency_score, naturalness_score, sentence_score,
        target_vocab_used_count, total_words_spoken, filler_words_count, sentences_improved_count
      ) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    `).run(sessionId, userId, topic, difficulty);

    res.json({
      sessionId,
      aiPrompt,
      topic,
      difficulty,
      targetVocab,
      userWeakness: primaryWeakness,
      focusRecommendation: weaknessProfile.focus_recommendation,
    });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversation/turn
 * Process user speech response, perform AI analysis, 3-tier sentence improvement
 */
router.post('/turn', async (req, res) => {
  try {
    const {
      sessionId,
      turnNumber = 1,
      aiPrompt,
      userTranscript,
      targetVocab = [],
      difficulty = 'Intermediate',
      userWeakness = 'Past Tense',
      userId = 'usr_default',
    } = req.body;

    if (!userTranscript || !userTranscript.trim()) {
      return res.status(400).json({ error: 'User transcript cannot be empty.' });
    }

    // Run structured analysis
    const analysis = await analyzeUserResponse({
      aiPrompt,
      userTranscript: userTranscript.trim(),
      targetVocab,
      difficulty,
      userWeakness,
      userId,
    });

    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Save response to DB
    db.prepare(`
      INSERT INTO speaking_responses (
        id, session_id, turn_number, ai_prompt, user_transcript, analysis_json
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      responseId,
      sessionId,
      turnNumber,
      aiPrompt,
      userTranscript.trim(),
      JSON.stringify(analysis)
    );

    // Save sentence improvements
    const insertImprovementStmt = db.prepare(`
      INSERT INTO sentence_improvements (
        id, response_id, original_sentence, corrected_sentence, natural_sentence, advanced_sentence, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const imp of analysis.sentence_improvements) {
      const impId = `imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      insertImprovementStmt.run(
        impId,
        responseId,
        imp.original,
        imp.corrected,
        imp.natural,
        imp.advanced,
        imp.explanation
      );
    }

    // Update target vocabulary usage counts in user_flashcards if matched
    if (analysis.vocabulary.target_words_used.length > 0) {
      const updateVocabUsageStmt = db.prepare(`
        UPDATE user_flashcards
        SET times_used_in_conversation = times_used_in_conversation + 1
        WHERE user_id = ? AND vocabulary_id IN (
          SELECT id FROM vocabulary WHERE LOWER(word) = LOWER(?)
        )
      `);

      for (const word of analysis.vocabulary.target_words_used) {
        updateVocabUsageStmt.run(userId, word);
      }
    }

    res.json({
      responseId,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing conversation turn:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversation/repeat-compare
 * Analyzes the user's spoken repeat attempt (Attempt 2) and compares against Attempt 1
 */
router.post('/repeat-compare', async (req, res) => {
  try {
    const {
      sessionId,
      responseId,
      targetSentence,
      attempt1Scores,
      attempt2Transcript,
    } = req.body;

    if (!attempt2Transcript || !attempt2Transcript.trim()) {
      return res.status(400).json({ error: 'Attempt 2 transcript cannot be empty.' });
    }

    const comparison = await compareSpokenRepeatAttempt({
      targetSentence,
      attempt1Scores,
      attempt2Transcript: attempt2Transcript.trim(),
    });

    // Update response record with repeat attempt data
    if (responseId) {
      db.prepare(`
        UPDATE speaking_responses
        SET repeat_attempt_json = ?
        WHERE id = ?
      `).run(JSON.stringify({ targetSentence, attempt2Transcript, comparison }), responseId);
    }

    res.json({ success: true, comparison });
  } catch (error: any) {
    console.error('Error comparing repeat attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversation/end
 * Finalizes session, aggregates metrics, generates recap and tomorrow's personalized focus
 */
router.post('/end', async (req, res) => {
  try {
    const { sessionId, durationSeconds = 180, userId = 'usr_default' } = req.body;

    const responses = db.prepare(`
      SELECT * FROM speaking_responses WHERE session_id = ? ORDER BY turn_number ASC
    `).all(sessionId) as any[];

    if (responses.length === 0) {
      return res.json({
        sessionId,
        durationSeconds,
        overallScore: 75,
        strengths: ['Started a conversation and practiced English.'],
        improvements: ['Complete at least 2 conversational turns for in-depth analytics.'],
        targetVocabUsed: 0,
        sentencesImproved: 0,
        fillerWordsCount: 0,
        tomorrowsFocus: 'Daily conversation practice with vocabulary reinforcement.',
      });
    }

    // Aggregate statistics across turns
    let totalGrammar = 0;
    let totalVocab = 0;
    let totalFluency = 0;
    let totalNaturalness = 0;
    let totalSentence = 0;
    let totalWordsSpoken = 0;
    let totalFillers = 0;
    let totalImprovedCount = 0;
    const allUsedVocab = new Set<string>();

    for (const r of responses) {
      const analysis = JSON.parse(r.analysis_json);
      totalGrammar += analysis.grammar?.score || 75;
      totalVocab += analysis.vocabulary?.score || 75;
      totalFluency += analysis.fluency?.score || 75;
      totalNaturalness += analysis.naturalness?.score || 75;
      totalSentence += analysis.sentence_formation?.score || 75;
      totalWordsSpoken += analysis.vocabulary?.total_words || 0;
      totalFillers += analysis.fluency?.filler_count || 0;
      totalImprovedCount += analysis.sentence_improvements?.length || 1;

      if (Array.isArray(analysis.vocabulary?.target_words_used)) {
        analysis.vocabulary.target_words_used.forEach((w: string) => allUsedVocab.add(w));
      }
    }

    const count = responses.length;
    const avgGrammar = Math.round(totalGrammar / count);
    const avgVocab = Math.round(totalVocab / count);
    const avgFluency = Math.round(totalFluency / count);
    const avgNaturalness = Math.round(totalNaturalness / count);
    const avgSentence = Math.round(totalSentence / count);

    const overallScore = calculateOverallScore({
      grammar: avgGrammar,
      vocabulary: avgVocab,
      fluency: avgFluency,
      naturalness: avgNaturalness,
      sentence_formation: avgSentence,
    });

    const strengths = [
      avgSentence >= 78 ? 'Solid sentence construction & clear logic' : 'Clear communication of main ideas',
      avgVocab >= 80 ? 'Good vocabulary breadth and context fit' : 'Natural word choice',
      allUsedVocab.size > 0 ? `Successfully used ${allUsedVocab.size} target vocabulary words in real dialogue` : 'Good conversational engagement',
    ];

    const weaknessProfile = getUserWeaknessProfile(userId);
    const improvements = [
      weaknessProfile.top_weakness,
      totalFillers > 4 ? `Reduce filler words (detected ${totalFillers} fillers) by pausing deliberately` : 'Smooth conversational pacing',
      'Continue practicing natural idiomatic variations',
    ];

    const tomorrowsFocus = weaknessProfile.focus_recommendation.focus_title + ': ' + weaknessProfile.focus_recommendation.why;

    // Save aggregated values into speaking_sessions
    db.prepare(`
      UPDATE speaking_sessions
      SET duration_seconds = ?,
          overall_score = ?,
          grammar_score = ?,
          vocabulary_score = ?,
          fluency_score = ?,
          naturalness_score = ?,
          sentence_score = ?,
          target_vocab_used_count = ?,
          total_words_spoken = ?,
          filler_words_count = ?,
          sentences_improved_count = ?,
          strengths_json = ?,
          improvements_json = ?
      WHERE id = ?
    `).run(
      durationSeconds,
      overallScore,
      avgGrammar,
      avgVocab,
      avgFluency,
      avgNaturalness,
      avgSentence,
      allUsedVocab.size,
      totalWordsSpoken,
      totalFillers,
      totalImprovedCount,
      JSON.stringify(strengths),
      JSON.stringify(improvements),
      sessionId
    );

    // Update user streak & last active
    db.prepare(`
      UPDATE users
      SET streak = streak + 1, last_active_date = DATE('now')
      WHERE id = ?
    `).run(userId);

    // Mark today's mission as completed
    const todayStr = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE daily_missions
      SET completed = 1, score = ?
      WHERE user_id = ? AND mission_date = ?
    `).run(overallScore, userId, todayStr);

    // Sync session to Supabase database
    syncSessionToSupabase({
      id: sessionId,
      user_id: userId,
      topic: responses[0]?.ai_prompt ? 'English Conversation Practice' : 'Daily Life',
      duration_seconds: durationSeconds,
      overall_score: overallScore,
      grammar_score: avgGrammar,
      vocabulary_score: avgVocab,
      fluency_score: avgFluency,
      naturalness_score: avgNaturalness,
      sentence_score: avgSentence,
      target_vocab_used_count: allUsedVocab.size,
      total_words_spoken: totalWordsSpoken,
      filler_words_count: totalFillers,
      sentences_improved_count: totalImprovedCount,
      strengths,
      improvements,
    });

    res.json({
      sessionId,
      durationSeconds,
      overallScore,
      scores: {
        grammar: avgGrammar,
        vocabulary: avgVocab,
        fluency: avgFluency,
        naturalness: avgNaturalness,
        sentence_formation: avgSentence,
      },
      strengths,
      improvements,
      targetVocabUsed: allUsedVocab.size,
      targetVocabWords: Array.from(allUsedVocab),
      sentencesImproved: totalImprovedCount,
      fillerWordsCount: totalFillers,
      totalWordsSpoken,
      tomorrowsFocus,
    });
  } catch (error: any) {
    console.error('Error ending conversation session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversation/sessions
 * List recent speaking sessions
 */
router.get('/sessions', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'usr_default';
    const limit = Number(req.query.limit) || 10;

    const rows = db.prepare(`
      SELECT * FROM speaking_sessions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    const sessions = rows.map((s) => ({
      ...s,
      strengths: JSON.parse(s.strengths_json || '[]'),
      improvements: JSON.parse(s.improvements_json || '[]'),
    }));

    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversation/sessions/:id
 * Get full session details including responses and sentence improvements
 */
router.get('/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const session = db.prepare('SELECT * FROM speaking_sessions WHERE id = ?').get(id) as any;

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const responses = db.prepare(`
      SELECT * FROM speaking_responses WHERE session_id = ? ORDER BY turn_number ASC
    `).all(id) as any[];

    const enrichedResponses = responses.map((r) => {
      const improvements = db.prepare(`
        SELECT * FROM sentence_improvements WHERE response_id = ?
      `).all(r.id);

      return {
        ...r,
        analysis: JSON.parse(r.analysis_json || '{}'),
        repeat_attempt: r.repeat_attempt_json ? JSON.parse(r.repeat_attempt_json) : null,
        improvements,
      };
    });

    res.json({
      session: {
        ...session,
        strengths: JSON.parse(session.strengths_json || '[]'),
        improvements: JSON.parse(session.improvements_json || '[]'),
      },
      responses: enrichedResponses,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/conversation/sessions/:id
 * Delete a specific speaking session
 */
router.delete('/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM speaking_sessions WHERE id = ?').run(id);
    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
