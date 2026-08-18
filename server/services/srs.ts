export type SRSGrade = 1 | 2 | 3 | 4; // 1: Again/Forgot, 2: Hard, 3: Good, 4: Easy

export interface SRSState {
  review_count: number;
  correct_count: number;
  incorrect_count: number;
  interval_days: number;
  ease_factor: number;
  mastery_score: number;
  status: 'New' | 'Learning' | 'Mastered' | 'Difficult';
  last_reviewed: string;
  next_review: string;
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 */
export function calculateNextReview(
  currentState: {
    review_count: number;
    correct_count: number;
    incorrect_count: number;
    interval_days: number;
    ease_factor: number;
    mastery_score: number;
  },
  grade: SRSGrade
): SRSState {
  let { review_count, correct_count, incorrect_count, interval_days, ease_factor } = currentState;
  
  review_count += 1;
  ease_factor = ease_factor || 2.5;

  if (grade < 3) {
    // Failed recall (Again / Hard)
    incorrect_count += 1;
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else {
    // Successful recall (Good / Easy)
    correct_count += 1;
    if (review_count === 1) {
      interval_days = 1;
    } else if (review_count === 2) {
      interval_days = 3;
    } else if (review_count === 3) {
      interval_days = 7;
    } else {
      const bonus = grade === 4 ? 1.3 : 1.0;
      interval_days = Math.max(1, Math.round(interval_days * ease_factor * bonus));
    }

    // SM-2 Ease Factor calculation
    // grade mapped to 0-5 scale: grade 3 -> 4, grade 4 -> 5
    const q = grade === 4 ? 5 : 4;
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  // Calculate Mastery Score (0 - 100%)
  let masteryScore = 0;
  if (review_count > 0) {
    const accuracy = correct_count / (correct_count + incorrect_count);
    const intervalWeight = Math.min(1.0, interval_days / 14);
    masteryScore = Math.min(100, Math.round((accuracy * 60) + (intervalWeight * 40)));
  }

  // Determine Status
  let status: 'New' | 'Learning' | 'Mastered' | 'Difficult' = 'Learning';
  if (masteryScore >= 85 && interval_days >= 7) {
    status = 'Mastered';
  } else if (grade === 1 || (incorrect_count > correct_count && review_count >= 2)) {
    status = 'Difficult';
  } else if (review_count === 0) {
    status = 'New';
  }

  const now = new Date();
  const nextDate = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);

  return {
    review_count,
    correct_count,
    incorrect_count,
    interval_days,
    ease_factor: Number(ease_factor.toFixed(2)),
    mastery_score: masteryScore,
    status,
    last_reviewed: now.toISOString(),
    next_review: nextDate.toISOString(),
  };
}
