import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import analysisRoutes from './routes/analysis.routes.js';
import documentRoutes from './routes/documents.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { notFound, errorHandler } from './utils/errors.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      geminiConfigured: Boolean(config.geminiApiKey),
      geminiModel: config.geminiModel,
    },
  });
});

// Mounted Routes
app.use('/api', analysisRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;