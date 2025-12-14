import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { config } from './config';
import { redisClient } from './config/redis';
import uploadRoutes from './routes/upload.routes';
import moderationRoutes from './routes/moderation.routes';
import photoRoutes from './routes/photos.routes';
import authRoutes from './routes/auth.routes';
import evolutionRoutes from './routes/evolution.routes';
import { requireAuth } from './middleware/auth.middleware';
import { generalLimiter } from './middleware/rate-limit';
import { initializeStorage } from './services/init-storage';

const app = express();

// Initialize storage buckets
initializeStorage().catch((error) => {
  console.error('❌ Failed to initialize storage:', error);
  process.exit(1);
});

// Middleware
app.use(helmet());

// CORS configuration - Fixed: No longer allows all origins in production
const allowedOrigins = config.nodeEnv === 'development'
  ? ['http://localhost:3000', 'http://localhost:3001']
  : config.allowedOrigins?.split(',').map(origin => origin.trim()) || [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all routes
app.use('/api/', generalLimiter);

// Redis session store configuration
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'morphorama:sess:',
});

// Session middleware - Fixed: Now uses Redis store for persistence
app.use(
  session({
    store: redisStore,
    secret: config.sessionSecret, // Separate session secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    },
  })
);

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'morphorama-backend',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Morphorama API is running',
    version: '1.0.0',
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Upload routes (public)
app.use('/api/upload', uploadRoutes);

// Photo routes (public - for image serving)
app.use('/api/photos', photoRoutes);

// Moderation routes (protected)
app.use('/api/moderation', requireAuth, moderationRoutes);

// Evolution routes (protected - for testing)
app.use('/api/evolution', requireAuth, evolutionRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`🎨 Morphorama Backend running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
