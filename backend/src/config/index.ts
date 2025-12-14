import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema with validation
const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),

  // Database
  databaseUrl: z.string(),

  // Redis
  redisUrl: z.string(),

  // MinIO/S3
  minioEndpoint: z.string(),
  minioPort: z.coerce.number(),
  minioAccessKey: z.string(),
  minioSecretKey: z.string(),
  minioUseSsl: z.boolean().default(false),

  // AI Providers
  imageProvider: z.enum(['google-imagen', 'stability-ai', 'huggingface']).default('huggingface'),
  llmProvider: z.enum(['gemini', 'claude']).default('gemini'),
  musicProvider: z.string().default('suno'),

  // API Keys (conditional requirements based on providers)
  googleGeminiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  stabilityApiKey: z.string().optional(),
  huggingfaceApiKey: z.string().optional(),
  sunoApiKey: z.string().optional(),

  // Instagram
  instagramAccessToken: z.string().optional(),
  instagramAccountId: z.string().optional(),

  // Security
  jwtSecret: z.string(),
  sessionSecret: z.string(),
  moderatorPassword: z.string(),
  allowedOrigins: z.string().optional(),

  // Worker
  workerConcurrency: z.coerce.number().default(2),

  // Scheduler
  scheduleInterval: z.string().default('24h'),
});

// Parse and validate configuration
const parseConfig = () => {
  try {
    const parsed = configSchema.parse({
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL,
      redisUrl: process.env.REDIS_URL,
      minioEndpoint: process.env.MINIO_ENDPOINT,
      minioPort: process.env.MINIO_PORT,
      minioAccessKey: process.env.MINIO_ACCESS_KEY,
      minioSecretKey: process.env.MINIO_SECRET_KEY,
      minioUseSsl: process.env.MINIO_USE_SSL === 'true',
      imageProvider: process.env.IMAGE_PROVIDER,
      llmProvider: process.env.LLM_PROVIDER,
      musicProvider: process.env.MUSIC_PROVIDER,
      googleGeminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      stabilityApiKey: process.env.STABILITY_API_KEY,
      huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
      sunoApiKey: process.env.SUNO_API_KEY,
      instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID,
      jwtSecret: process.env.JWT_SECRET,
      sessionSecret: process.env.SESSION_SECRET,
      moderatorPassword: process.env.MODERATOR_PASSWORD,
      allowedOrigins: process.env.ALLOWED_ORIGINS,
      workerConcurrency: process.env.WORKER_CONCURRENCY,
      scheduleInterval: process.env.SCHEDULE_INTERVAL,
    });

    // Validate provider-specific API keys
    const missingKeys: string[] = [];

    if (parsed.llmProvider === 'gemini' && !parsed.googleGeminiApiKey) {
      missingKeys.push('GOOGLE_GEMINI_API_KEY (required for LLM provider: gemini)');
    }

    if (parsed.llmProvider === 'claude' && !parsed.anthropicApiKey) {
      missingKeys.push('ANTHROPIC_API_KEY (required for LLM provider: claude)');
    }

    if (parsed.imageProvider === 'google-imagen' && !parsed.googleGeminiApiKey) {
      missingKeys.push('GOOGLE_GEMINI_API_KEY (required for image provider: google-imagen)');
    }

    if (parsed.imageProvider === 'stability-ai' && !parsed.stabilityApiKey) {
      missingKeys.push('STABILITY_API_KEY (required for image provider: stability-ai)');
    }

    if (parsed.imageProvider === 'huggingface' && !parsed.huggingfaceApiKey) {
      missingKeys.push('HUGGINGFACE_API_KEY (required for image provider: huggingface)');
    }

    if (missingKeys.length > 0) {
      console.error('❌ Missing required API keys:');
      missingKeys.forEach((key) => {
        console.error(`  - ${key}`);
      });
      console.error('\nCurrent provider configuration:');
      console.error(`  - LLM Provider: ${parsed.llmProvider}`);
      console.error(`  - Image Provider: ${parsed.imageProvider}`);
      process.exit(1);
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseConfig();

// Log configuration (without sensitive data)
console.log('📝 Configuration loaded:', {
  nodeEnv: config.nodeEnv,
  port: config.port,
  imageProvider: config.imageProvider,
  llmProvider: config.llmProvider,
  musicProvider: config.musicProvider,
  workerConcurrency: config.workerConcurrency,
  scheduleInterval: config.scheduleInterval,
});
