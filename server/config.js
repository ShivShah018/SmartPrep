import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 8000),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 25),
  maxFiles: Number(process.env.MAX_FILES || 15),
};