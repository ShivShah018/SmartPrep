import app from './app.js';
import { config } from './config.js';
import { initDatabase } from './config/database.js';

async function startServer() {
  await initDatabase();

  app.listen(config.port, () => {
    console.log(`[SmartPrep] Server listening on http://localhost:${config.port}`);
    console.log(`[SmartPrep] Gemini ${config.geminiApiKey ? 'configured' : 'NOT configured (set GEMINI_API_KEY)'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});