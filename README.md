# SpeakWise AI — Production AI English Speaking Coach

**SpeakWise AI** is a modern, responsive web application designed to help users improve spoken English communication, vocabulary, grammar, fluency, sentence formation, and conversational confidence through real-time AI conversations.

---

## 🌟 Key Features

- **🎙️ Real-Time Spoken AI Partner**: Natural voice dialogue powered by Web Speech API, with continuous voice transcription and keyboard input fallback.
- **🧠 Educational Grammar Diagnosis**: Analyzes responses and explains the underlying grammatical rationale (*Verb Tense, Prepositions, Articles, Subject-Verb Agreement, Word Order, Plurals*).
- **✨ 3-Tier "Say It Better" Engine**: Generates *Corrected*, *Natural* (fluent idiomatic phrasing), and *Advanced* (polished workplace phrasing) sentence variations.
- **🔁 Repeat & Compare System**: Allows users to practice speaking improved sentences with immediate score comparison (*Attempt 1 vs Attempt 2*).
- **📚 Dynamic AI Vocabulary & Spaced Repetition (SM-2)**: Generates high-utility English communication words with Google Gemini 3.6 Flash and schedules reviews on progressive intervals.
- **📊 Real-Time Analytics Dashboard**: Deterministic weighted communication score, speaking speed (WPM), time spoken, filler word frequency, and weakness tracking.
- **📱 Fully Mobile-Optimized**: PWA-ready with full-screen mobile app support.
- **☁️ Supabase Cloud & SQLite Dual-Sync**: Cloud persistence with offline fallback.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/kavii10/English-App.git
cd English-App

# Install dependencies
npm install
```

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
```

### Run Locally
```bash
npm run dev
```
- Web App: `http://localhost:5173/`
- Backend API: `http://localhost:3001/`

### Production Build
```bash
npm run build
npm start
```
