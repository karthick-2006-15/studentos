import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import path from 'path';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import calendarRoutes from './routes/calendarRoutes';
import courseRoutes from './routes/courseRoutes';
import documentRoutes from './routes/documentRoutes';
import academicRoutes from './routes/academicRoutes';
import habitRoutes from './routes/habitRoutes';
import studyPlanRoutes from './routes/studyPlanRoutes';
import codingRoutes from './routes/codingRoutes';
import spotifyRoutes from './routes/spotifyRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// Security & Parsing Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});
app.use('/api', generalLimiter);

// Static uploads directory
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'NEXUS Student OS API',
    time: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use(errorHandler);

// Background Cron Jobs for automated notifications
cron.schedule('0 8 * * *', () => {
  logger.info('[Scheduler] Running 8:00 AM Morning Briefing dispatcher');
});

cron.schedule('0 21 * * *', () => {
  logger.info('[Scheduler] Running 9:00 PM Evening Review dispatcher');
});

// Start Server
const startServer = async () => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`🚀 NEXUS API Server active on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
};

startServer().catch(err => {
  logger.error('Failed to start server:', err);
});
