import { db } from './database.js';

export const VOCABULARY_SEED_DATA = [
  {
    id: 'vocab-articulate',
    word: 'articulate',
    pronunciation: '/ɑːrˈtɪk.jə.lət/',
    part_of_speech: 'adjective / verb',
    simple_meaning: 'Able to express thoughts and ideas clearly and effectively.',
    contextual_meaning: 'Used in professional and academic settings to describe someone who communicates ideas fluently or the act of clearly pronouncing and stating thoughts.',
    example_sentence: 'She was remarkably articulate during the panel discussion, explaining complex algorithms with ease.',
    synonyms: ['expressive', 'coherent', 'fluent', 'lucid', 'eloquent'],
    antonyms: ['inarticulate', 'hesitant', 'unclear', 'muddled'],
    difficulty: 'Intermediate',
    category: 'Communication',
  },
  {
    id: 'vocab-accomplish',
    word: 'accomplish',
    pronunciation: '/əˈkɑːm.plɪʃ/',
    part_of_speech: 'verb',
    simple_meaning: 'To complete or achieve something successfully after effort.',
    contextual_meaning: 'Commonly used in workplace goals, project reviews, and personal achievements to describe reaching a milestone.',
    example_sentence: 'We managed to accomplish all our quarterly targets two weeks ahead of schedule.',
    synonyms: ['achieve', 'fulfill', 'execute', 'attain', 'realize'],
    antonyms: ['fail', 'abandon', 'neglect', 'give up'],
    difficulty: 'Beginner',
    category: 'Career',
  },
  {
    id: 'vocab-concise',
    word: 'concise',
    pronunciation: '/kənˈsaɪs/',
    part_of_speech: 'adjective',
    simple_meaning: 'Giving a lot of information clearly and in a few words.',
    contextual_meaning: 'Crucial for business emails, presentations, and daily conversations where brevity and clarity prevent misunderstandings.',
    example_sentence: 'Keep your presentation concise so the audience stays engaged throughout the summary.',
    synonyms: ['brief', 'succinct', 'compact', 'to the point', 'pithy'],
    antonyms: ['wordy', 'verbose', 'lengthy', 'redundant'],
    difficulty: 'Intermediate',
    category: 'Communication',
  },
  {
    id: 'vocab-reluctant',
    word: 'reluctant',
    pronunciation: '/rɪˈlʌk.tənt/',
    part_of_speech: 'adjective',
    simple_meaning: 'Unwilling and hesitant to do something.',
    contextual_meaning: 'Describes hesitation when taking risks, speaking in public, or adopting unfamiliar procedures.',
    example_sentence: 'At first, he was reluctant to speak in public, but with daily practice, he gained immense confidence.',
    synonyms: ['hesitant', 'unwilling', 'cautious', 'disinclined', 'reserved'],
    antonyms: ['eager', 'willing', 'enthusiastic', 'ready'],
    difficulty: 'Intermediate',
    category: 'Everyday',
  },
  {
    id: 'vocab-overwhelmed',
    word: 'overwhelmed',
    pronunciation: '/ˌoʊ.vɚˈwelmd/',
    part_of_speech: 'adjective',
    simple_meaning: 'Feeling overpowered by a strong emotion, pressure, or too much work.',
    contextual_meaning: 'Widely used in daily conversation and modern work life to express having more tasks or emotional load than one can easily handle.',
    example_sentence: 'Whenever I feel overwhelmed with work, I break my tasks into 15-minute manageable chunks.',
    synonyms: ['swamped', 'overburdened', 'stressed', 'inundated', 'engulfed'],
    antonyms: ['calm', 'relaxed', 'in control', 'at ease'],
    difficulty: 'Intermediate',
    category: 'Everyday',
  },
  {
    id: 'vocab-collaborate',
    word: 'collaborate',
    pronunciation: '/kəˈlæb.ə.reɪt/',
    part_of_speech: 'verb',
    simple_meaning: 'To work together with others to produce or create something.',
    contextual_meaning: 'Essential term in team environments, project work, and cross-functional partnerships.',
    example_sentence: 'Our engineering and marketing teams collaborated closely to launch the new feature seamlessly.',
    synonyms: ['cooperate', 'partner', 'team up', 'join forces'],
    antonyms: ['compete', 'resist', 'work alone', 'disagree'],
    difficulty: 'Beginner',
    category: 'Career',
  },
  {
    id: 'vocab-meticulous',
    word: 'meticulous',
    pronunciation: '/məˈtɪk.jə.ləs/',
    part_of_speech: 'adjective',
    simple_meaning: 'Showing great attention to detail; very careful and precise.',
    contextual_meaning: 'High-value word for describing thorough work ethic, quality assurance, research, or careful planning.',
    example_sentence: 'Thanks to her meticulous review of the contract, we avoided several costly legal pitfalls.',
    synonyms: ['thorough', 'diligent', 'rigorous', 'precise', 'scrupulous'],
    antonyms: ['careless', 'sloppy', 'negligent', 'hasty'],
    difficulty: 'Advanced',
    category: 'Career',
  },
  {
    id: 'vocab-resilient',
    word: 'resilient',
    pronunciation: '/rɪˈzɪl.jənt/',
    part_of_speech: 'adjective',
    simple_meaning: 'Able to withstand or recover quickly from difficult conditions.',
    contextual_meaning: 'Used to praise individuals, teams, or systems that bounce back from setbacks or hardships.',
    example_sentence: 'The team remained resilient despite the server outage and resolved the issue within an hour.',
    synonyms: ['adaptable', 'tough', 'tenacious', 'hardy', 'buoyant'],
    antonyms: ['fragile', 'vulnerable', 'weak', 'brittle'],
    difficulty: 'Intermediate',
    category: 'Academic',
  },
  {
    id: 'vocab-facilitate',
    word: 'facilitate',
    pronunciation: '/fəˈsɪl.ə.teɪt/',
    part_of_speech: 'verb',
    simple_meaning: 'To make an action or process easy or easier.',
    contextual_meaning: 'Frequently used in leadership, meeting hosting, and workflow improvements.',
    example_sentence: 'The project manager facilitated a smooth discussion between the design and development teams.',
    synonyms: ['enable', 'assist', 'expedite', 'streamline', 'foster'],
    antonyms: ['hinder', 'obstruct', 'delay', 'impede'],
    difficulty: 'Advanced',
    category: 'Career',
  },
  {
    id: 'vocab-clarify',
    word: 'clarify',
    pronunciation: '/ˈklær.ə.faɪ/',
    part_of_speech: 'verb',
    simple_meaning: 'To make a statement or situation less confused and more comprehensible.',
    contextual_meaning: 'A primary communication verb used in polite conversation and meetings to clear up ambiguities.',
    example_sentence: 'Could you please clarify your question so I can provide the exact information you need?',
    synonyms: ['explain', 'elucidate', 'simplify', 'illuminate', 'define'],
    antonyms: ['confuse', 'complicate', 'obscure', 'muddle'],
    difficulty: 'Beginner',
    category: 'Communication',
  },
  {
    id: 'vocab-figure-out',
    word: 'figure out',
    pronunciation: '/ˈfɪɡ.jɚ aʊt/',
    part_of_speech: 'phrasal verb',
    simple_meaning: 'To understand or solve something after thinking about it.',
    contextual_meaning: 'Natural everyday conversational expression used in place of formal verbs like "deduce" or "calculate".',
    example_sentence: 'It took us a while to figure out why the audio wasn\'t recording properly.',
    synonyms: ['understand', 'work out', 'solve', 'decipher', 'comprehend'],
    antonyms: ['misunderstand', 'overlook', 'ignore'],
    difficulty: 'Beginner',
    category: 'Phrasal Verbs',
  },
  {
    id: 'vocab-bring-up',
    word: 'bring up',
    pronunciation: '/brɪŋ ʌp/',
    part_of_speech: 'phrasal verb',
    simple_meaning: 'To introduce a topic into a conversation or meeting.',
    contextual_meaning: 'Very common in meeting discussions and casual chats when mentioning an idea or issue.',
    example_sentence: 'I was hesitant to bring up the budget problem during the kickoff meeting.',
    synonyms: ['mention', 'raise', 'introduce', 'propose', 'broach'],
    antonyms: ['ignore', 'suppress', 'bottle up', 'hide'],
    difficulty: 'Beginner',
    category: 'Phrasal Verbs',
  },
  {
    id: 'vocab-persuasive',
    word: 'persuasive',
    pronunciation: '/pɚˈsweɪ.sɪv/',
    part_of_speech: 'adjective',
    simple_meaning: 'Good at convincing someone to do or believe something through reasoning.',
    contextual_meaning: 'Essential for negotiations, speeches, and pitching ideas.',
    example_sentence: 'He gave a persuasive argument that convinced the committee to approve our project budget.',
    synonyms: ['convincing', 'compelling', 'influential', 'potent', 'cogent'],
    antonyms: ['unconvincing', 'weak', 'ineffective', 'plausible'],
    difficulty: 'Intermediate',
    category: 'Communication',
  },
  {
    id: 'vocab-come-up-with',
    word: 'come up with',
    pronunciation: '/kʌm ʌp wɪð/',
    part_of_speech: 'phrasal verb',
    simple_meaning: 'To think of or produce an idea, suggestion, or solution.',
    contextual_meaning: 'Universally used in brainstorming, problem-solving, and creative discussions.',
    example_sentence: 'We need to come up with three creative ideas before tomorrow morning\'s presentation.',
    synonyms: ['invent', 'devise', 'propose', 'generate', 'formulate'],
    antonyms: ['forget', 'dismiss', 'abandon'],
    difficulty: 'Beginner',
    category: 'Phrasal Verbs',
  },
  {
    id: 'vocab-ambiguous',
    word: 'ambiguous',
    pronunciation: '/æmˈbɪɡ.ju.əs/',
    part_of_speech: 'adjective',
    simple_meaning: 'Open to more than one interpretation; not having an obvious or single meaning.',
    contextual_meaning: 'Critical for evaluating instructions, sentences, and specifications that need clarification.',
    example_sentence: 'The instructions in the email were somewhat ambiguous, so I called the client for clarification.',
    synonyms: ['unclear', 'vague', 'equivocal', 'open-ended', 'murky'],
    antonyms: ['clear', 'unambiguous', 'explicit', 'definite', 'lucid'],
    difficulty: 'Advanced',
    category: 'Academic',
  }
];

export function seedDatabase() {
  // 1. Seed Clean Default User
  const defaultUserId = 'usr_default';
  const userCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(defaultUserId);
  
  if (!userCheck) {
    db.prepare(`
      INSERT INTO users (id, name, email, level, target_daily_minutes, streak, last_active_date)
      VALUES (?, ?, ?, ?, ?, ?, DATE('now'))
    `).run(defaultUserId, 'Learner', 'learner@speakwise.ai', 'Intermediate', 5, 0);
    console.log('Created fresh user profile with 0 streak.');
  }

  // 2. Seed Clean Vocabulary Catalog (All flashcards start as 'New' with 0 mastery)
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

  for (let i = 0; i < VOCABULARY_SEED_DATA.length; i++) {
    const item = VOCABULARY_SEED_DATA[i];
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

    const flashcardId = `fc_${item.word}_${defaultUserId}`;
    insertFlashcardStmt.run(flashcardId, defaultUserId, item.id);
  }

  // 3. Clean Today's Mission (Initial Diagnostic / Conversational Practice)
  const todayStr = new Date().toISOString().split('T')[0];
  const missionCheck = db.prepare('SELECT id FROM daily_missions WHERE user_id = ? AND mission_date = ?').get(defaultUserId, todayStr);
  if (!missionCheck) {
    db.prepare(`
      INSERT INTO daily_missions (
        id, user_id, mission_date, title, topic, target_weakness, target_vocab_ids_json, completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      `msn_${todayStr}`,
      defaultUserId,
      todayStr,
      "Speak for 3 minutes to introduce yourself and test your spoken fluency",
      "Introduce Yourself & Share Your Daily Goals",
      "Initial Communication Diagnostic",
      JSON.stringify(['vocab-articulate', 'vocab-accomplish', 'vocab-concise', 'vocab-reluctant', 'vocab-overwhelmed'])
    );
    console.log('Initialized clean today mission.');
  }
}
