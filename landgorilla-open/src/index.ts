import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { testConnection } from './db';
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import portfolioRoutes from './routes/portfolio';
import borrowerRoutes from './routes/borrowers';
import propertyRoutes from './routes/properties';
import covenantRoutes from './routes/covenants';
import disbursementRoutes from './routes/disbursements';
import paymentRoutes from './routes/payments';
import taskRoutes from './routes/tasks';
import { errorHandler, notFound } from './middleware/errorHandler';
import { auditLog } from './middleware/audit';
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
app.use('/api', auditLog);

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/loans/:loanId/covenants', covenantRoutes);
app.use('/api/loans/:loanId/disbursements', disbursementRoutes);
app.use('/api/loans/:loanId/payments', paymentRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/tasks', taskRoutes);

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

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
