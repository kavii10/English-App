import { Router } from 'express';
import { db } from '../db/database.js';
import { getUserWeaknessProfile } from '../services/weakness.js';

const router = Router();

/**
 * GET /api/missions/today
 * Returns today's personalized AI mission based on weaknesses & vocabulary
 */
router.get('/today', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'usr_default';
    const todayStr = new Date().toISOString().split('T')[0];

    let mission = db.prepare('SELECT * FROM daily_missions WHERE user_id = ? AND mission_date = ?').get(userId, todayStr) as any;

    if (!mission) {
      const weaknessProfile = getUserWeaknessProfile(userId);
      const topVocab = db.prepare('SELECT id, word FROM vocabulary LIMIT 5').all() as any[];
      const vocabIds = topVocab.map((v) => v.id);

      const missionId = `msn_${todayStr}_${userId}`;
      const title = `Speak for 3 minutes: ${weaknessProfile.focus_recommendation.mission_topic}`;

      db.prepare(`
        INSERT INTO daily_missions (
          id, user_id, mission_date, title, topic, target_weakness, target_vocab_ids_json, completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        missionId,
        userId,
        todayStr,
        title,
        weaknessProfile.focus_recommendation.mission_topic,
        weaknessProfile.focus_recommendation.focus_title,
        JSON.stringify(vocabIds)
      );

      mission = db.prepare('SELECT * FROM daily_missions WHERE id = ?').get(missionId);
    }

    const vocabIds = JSON.parse(mission.target_vocab_ids_json || '[]');
    const vocabWords = db.prepare(`SELECT * FROM vocabulary WHERE id IN (${vocabIds.map(() => '?').join(',') || "''"})`).all(...vocabIds) as any[];

    res.json({
      ...mission,
      completed: Boolean(mission.completed),
      target_vocabulary: vocabWords.map((v) => ({
        ...v,
        synonyms: JSON.parse(v.synonyms_json || '[]'),
        antonyms: JSON.parse(v.antonyms_json || '[]'),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching today mission:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/missions/complete
 */
router.post('/complete', (req, res) => {
  try {
    const { missionId, score = 85 } = req.body;
    db.prepare('UPDATE daily_missions SET completed = 1, score = ? WHERE id = ?').run(score, missionId);
    res.json({ success: true, message: 'Mission marked complete!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
