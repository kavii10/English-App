import { db } from '../db/database.js';
import { syncMistakeToSupabase } from '../db/supabase.js';

export interface UserMistakeSummary {
  category: string;
  count: number;
  latest_mistake: string;
  latest_correction: string;
  latest_explanation: string;
}

export interface WeaknessProfile {
  top_weakness: string;
  top_weakness_count: number;
  secondary_weakness: string | null;
  top_strength: string;
  has_mistakes: boolean;
  focus_recommendation: {
    focus_title: string;
    why: string;
    mission_topic: string;
    suggested_starter: string;
  };
  breakdown: UserMistakeSummary[];
}

/**
 * Get aggregated weakness profile for user based strictly on recorded real errors
 */
export function getUserWeaknessProfile(userId: string = 'usr_default'): WeaknessProfile {
  const rows = db.prepare(`
    SELECT category, SUM(frequency) as total_freq, mistake, correction, explanation, last_seen
    FROM user_mistakes
    WHERE user_id = ?
    GROUP BY category
    ORDER BY total_freq DESC
  `).all(userId) as Array<{
    category: string;
    total_freq: number;
    mistake: string;
    correction: string;
    explanation: string;
    last_seen: string;
  }>;

  if (rows.length === 0) {
    return {
      top_weakness: 'No recurring weaknesses detected yet',
      top_weakness_count: 0,
      secondary_weakness: null,
      top_strength: 'Ready for initial diagnostic conversation',
      has_mistakes: false,
      focus_recommendation: {
        focus_title: 'Initial Speaking Diagnostic',
        why: 'Complete your first speaking session so SpeakWise AI can diagnose your grammar, vocabulary, and fluency baseline.',
        mission_topic: 'Introduce yourself and share your passions or daily goals',
        suggested_starter: 'Hey there! Tell me a bit about yourself, what you do, and what you enjoy working on.',
      },
      breakdown: [],
    };
  }

  const breakdown: UserMistakeSummary[] = rows.map((r) => ({
    category: r.category,
    count: r.total_freq,
    latest_mistake: r.mistake,
    latest_correction: r.correction,
    latest_explanation: r.explanation,
  }));

  const topCategory = rows[0].category;
  const topCount = rows[0].total_freq;
  const secondaryCategory = rows.length > 1 ? rows[1].category : null;

  // Determine focus recommendation based on the user's real logged top weakness
  let focusTitle = `${topCategory} Precision`;
  let why = `You have made ${topCount} mistake${topCount > 1 ? 's' : ''} in ${topCategory.toLowerCase()} during recent speaking sessions.`;
  let missionTopic = 'A recent challenge or event you took part in';
  let suggestedStarter = 'Hey! Tell me about something you worked on or did recently.';

  if (topCategory.toLowerCase().includes('tense')) {
    focusTitle = 'Past Tense & Narrative Flow';
    why = `You made ${topCount} past-tense related mistakes recently. Practicing past experiences will lock in correct verb forms.`;
    missionTopic = 'A memorable trip, weekend activity, or project you completed';
    suggestedStarter = 'Hey! What did you do over the past weekend, and what was something memorable that happened?';
  } else if (topCategory.toLowerCase().includes('preposition')) {
    focusTitle = 'Prepositions & Idiomatic Phrases';
    why = `You had ${topCount} preposition slips in recent speech. We will practice natural transitive verbs and prepositional links.`;
    missionTopic = 'Describing your daily routine or collaborative work';
    suggestedStarter = 'Tell me about how you organize your day and discuss tasks with others.';
  } else if (topCategory.toLowerCase().includes('article')) {
    focusTitle = 'Definite & Indefinite Articles (A / An / The)';
    why = `You have ${topCount} recorded article omissions. Focusing on nouns will elevate your precision.`;
    missionTopic = 'Describing an object, gadget, or book you love';
    suggestedStarter = 'Tell me about a tool, gadget, or book you use regularly and why you like it.';
  } else if (topCategory.toLowerCase().includes('filler')) {
    focusTitle = 'Filler Word Control & Confident Pausing';
    why = `You frequently use filler words under pressure (${topCount} times recorded). We will practice smooth deliberate pauses.`;
    missionTopic = 'Expressing your opinion on a technology trend';
    suggestedStarter = 'What is your opinion on how modern technology is changing how we communicate?';
  }

  return {
    top_weakness: `${topCategory} (${topCount} mistake${topCount > 1 ? 's' : ''} recorded)`,
    top_weakness_count: topCount,
    secondary_weakness: secondaryCategory ? `${secondaryCategory} (${rows[1]?.total_freq || 0} mistakes)` : null,
    top_strength: 'Actively practicing spoken English dialogue with continuous improvement',
    has_mistakes: true,
    focus_recommendation: {
      focus_title: focusTitle,
      why,
      mission_topic: missionTopic,
      suggested_starter: suggestedStarter,
    },
    breakdown,
  };
}

/**
 * Record a new error into user_mistakes
 */
export function recordUserMistake(
  userId: string,
  category: string,
  mistake: string,
  correction: string,
  explanation: string
) {
  const existing = db.prepare(`
    SELECT id, frequency FROM user_mistakes
    WHERE user_id = ? AND category = ? AND mistake = ?
  `).get(userId, category, mistake) as { id: string; frequency: number } | undefined;

  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE user_mistakes
      SET frequency = frequency + 1, last_seen = ?
      WHERE id = ?
    `).run(now, existing.id);

    syncMistakeToSupabase({
      id: existing.id,
      user_id: userId,
      category,
      mistake,
      correction,
      explanation,
      frequency: existing.frequency + 1,
      last_seen: now,
    });
  } else {
    const id = `mstk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO user_mistakes (id, user_id, category, mistake, correction, explanation, frequency, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, userId, category, mistake, correction, explanation, now);

    syncMistakeToSupabase({
      id,
      user_id: userId,
      category,
      mistake,
      correction,
      explanation,
      frequency: 1,
      last_seen: now,
    });
  }
}
