import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';

import vocabularyRoutes from './routes/vocabulary.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import missionsRoutes from './routes/missions.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize SQLite DB & Seed data
initDatabase();
seedDatabase();

// API Routes
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'SpeakWise AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend in production build if present
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for non-API routes (SPA client routing)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('SpeakWise AI Backend Running. Start Vite dev server for frontend.');
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err?.message || 'Internal Server Error',
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 SpeakWise AI Server running on port ${PORT}`);
});
