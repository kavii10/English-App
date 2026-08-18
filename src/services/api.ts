import {
  UserProfile,
  VocabularyItem,
  FlashcardItem,
  TurnAnalysis,
  RepeatComparisonResult,
  SpeakingSessionSummary,
  DailyMission,
  AnalyticsOverview,
  HandsFreeMasterDiagnostic,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Vocabulary & Flashcards
  async getTodayVocabulary(userId: string = 'usr_default'): Promise<{ words: VocabularyItem[] }> {
    return fetchJson<{ words: VocabularyItem[] }>(`${API_BASE}/vocabulary/today?userId=${userId}`);
  },

  async generateMoreVocabulary(params?: { category?: string; difficulty?: string; userId?: string }): Promise<{ success: boolean; message: string; words: VocabularyItem[] }> {
    return fetchJson<{ success: boolean; message: string; words: VocabularyItem[] }>(`${API_BASE}/vocabulary/generate-more`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  async getFlashcards(filter: string = 'All', search: string = '', userId: string = 'usr_default'): Promise<{ flashcards: FlashcardItem[] }> {
    return fetchJson<{ flashcards: FlashcardItem[] }>(
      `${API_BASE}/vocabulary/flashcards?userId=${userId}&filter=${encodeURIComponent(filter)}&search=${encodeURIComponent(search)}`
    );
  },

  async reviewFlashcard(flashcardId: string, grade: 1 | 2 | 3 | 4): Promise<{ success: boolean; updatedCard: any }> {
    return fetchJson<{ success: boolean; updatedCard: any }>(`${API_BASE}/vocabulary/flashcards/${flashcardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    });
  },

  async toggleFavoriteFlashcard(flashcardId: string): Promise<{ success: boolean; favorite: boolean }> {
    return fetchJson<{ success: boolean; favorite: boolean }>(`${API_BASE}/vocabulary/flashcards/${flashcardId}/favorite`, {
      method: 'POST',
    });
  },

  async updateFlashcardStatus(flashcardId: string, status: string): Promise<{ success: boolean; status: string; mastery_score: number }> {
    return fetchJson<{ success: boolean; status: string; mastery_score: number }>(`${API_BASE}/vocabulary/flashcards/${flashcardId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  async practiceFlashcardSentence(flashcardId: string, sentence: string): Promise<{ success: boolean; evaluation: any }> {
    return fetchJson<{ success: boolean; evaluation: any }>(`${API_BASE}/vocabulary/flashcards/${flashcardId}/practice-sentence`, {
      method: 'POST',
      body: JSON.stringify({ sentence }),
    });
  },

  // Conversation
  async startConversation(params: { topic?: string; difficulty?: string; userId?: string }): Promise<{
    sessionId: string;
    aiPrompt: string;
    topic: string;
    difficulty: string;
    targetVocab: string[];
    userWeakness: string;
    focusRecommendation: any;
  }> {
    return fetchJson(`${API_BASE}/conversation/start`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async submitConversationTurn(params: {
    sessionId: string;
    turnNumber: number;
    aiPrompt: string;
    userTranscript: string;
    targetVocab?: string[];
    difficulty?: string;
    userWeakness?: string;
    userId?: string;
    mode?: string;
  }): Promise<{ responseId: string; analysis: TurnAnalysis }> {
    return fetchJson(`${API_BASE}/conversation/turn`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async submitRepeatComparison(params: {
    sessionId: string;
    responseId: string;
    targetSentence: string;
    attempt1Scores: { grammar: number; naturalness: number; fluency: number; overall: number };
    attempt2Transcript: string;
  }): Promise<{ success: boolean; comparison: RepeatComparisonResult }> {
    return fetchJson(`${API_BASE}/conversation/repeat-compare`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async endConversation(params: { sessionId: string; durationSeconds: number; userId?: string }): Promise<SpeakingSessionSummary> {
    return fetchJson<SpeakingSessionSummary>(`${API_BASE}/conversation/end`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getRecentSessions(userId: string = 'usr_default', limit: number = 10): Promise<{ sessions: any[] }> {
    return fetchJson<{ sessions: any[] }>(`${API_BASE}/conversation/sessions?userId=${userId}&limit=${limit}`);
  },

  async getSessionDetails(sessionId: string): Promise<{ session: any; responses: any[] }> {
    return fetchJson<{ session: any; responses: any[] }>(`${API_BASE}/conversation/sessions/${sessionId}`);
  },

  // Missions
  async getTodayMission(userId: string = 'usr_default'): Promise<DailyMission> {
    return fetchJson<DailyMission>(`${API_BASE}/missions/today?userId=${userId}`);
  },

  // Analytics
  async getAnalyticsOverview(userId: string = 'usr_default'): Promise<AnalyticsOverview> {
    return fetchJson<AnalyticsOverview>(`${API_BASE}/analytics/overview?userId=${userId}`);
  },

  async getScoreTrends(userId: string = 'usr_default'): Promise<{ trends: any[] }> {
    return fetchJson<{ trends: any[] }>(`${API_BASE}/analytics/trends?userId=${userId}`);
  },

  async getFillerStats(): Promise<any> {
    return fetchJson<any>(`${API_BASE}/analytics/fillers`);
  },

  async getVocabMasteryStats(userId: string = 'usr_default'): Promise<any> {
    return fetchJson<any>(`${API_BASE}/analytics/vocab-mastery?userId=${userId}`);
  },

  // User & Auth
  async loginOrRegister(data: { name?: string; email: string; level?: string }): Promise<{ success: boolean; user: UserProfile; message: string }> {
    return fetchJson<{ success: boolean; user: UserProfile; message: string }>(`${API_BASE}/user/auth`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getUserProfile(userId: string = 'usr_default'): Promise<{ user: UserProfile }> {
    return fetchJson<{ user: UserProfile }>(`${API_BASE}/user/profile?userId=${userId}`);
  },

  async updateUserProfile(data: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return fetchJson<{ user: UserProfile }>(`${API_BASE}/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getSettings(): Promise<{ has_gemini_api_key: boolean; masked_api_key: string }> {
    return fetchJson<{ has_gemini_api_key: boolean; masked_api_key: string }>(`${API_BASE}/user/settings`);
  },

  async saveGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
    return fetchJson<{ success: boolean; message: string; model?: string }>(`${API_BASE}/user/settings/api-key`, {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  },

  async clearConversationHistory(userId: string = 'usr_default'): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/user/privacy/clear-history`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async resetMistakes(userId: string = 'usr_default'): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/user/privacy/reset-mistakes`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async resetFlashcards(userId: string = 'usr_default'): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/user/privacy/reset-flashcards`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async exportLearningData(userId: string = 'usr_default'): Promise<any> {
    return fetchJson<any>(`${API_BASE}/user/privacy/export?userId=${userId}`);
  },

  // Hands-Free Continuous Voice Flow
  async getHandsFreeReply(params: {
    topic: string;
    dialogue: Array<{ speaker: 'user' | 'ai'; text: string }>;
    difficulty?: string;
  }): Promise<{ reply: string }> {
    return fetchJson(`${API_BASE}/conversation/hands-free/reply`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async analyzeHandsFreeSession(params: {
    topic: string;
    dialogue: Array<{ speaker: 'user' | 'ai'; text: string }>;
    durationSeconds: number;
    userId?: string;
  }): Promise<{ sessionId: string; diagnostic: HandsFreeMasterDiagnostic }> {
    return fetchJson(`${API_BASE}/conversation/hands-free/analyze`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
