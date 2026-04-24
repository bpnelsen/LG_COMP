import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { testConnection } from './db';
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import portfolioRoutes from './routes/portfolio';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  try {
    await testConnection();
    app.listen(PORT, () => {
      logger.info(`LoanScope API running on port ${PORT}`, {
        env: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

start();

export default app;
