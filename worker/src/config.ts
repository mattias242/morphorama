/**
 * Worker Configuration
 * Simplified config for worker service
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  redisUrl: z.string(),

  // MinIO
  minioEndpoint: z.string(),
  minioPort: z.coerce.number(),
  minioAccessKey: z.string(),
  minioSecretKey: z.string(),
  minioUseSsl: z.boolean().default(false),

  // AI Providers
  imageProvider: z.enum(['google-imagen', 'stability-ai']).default('stability-ai'),
  llmProvider: z.enum(['gemini', 'claude']).default('gemini'),

  // API Keys
  googleGeminiApiKey: z.string().optional(),
  stabilityApiKey: z.string().optional(),

  // Worker
  workerConcurrency: z.coerce.number().default(2),
});

const parseConfig = () => {
  try {
    return configSchema.parse({
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL,
      redisUrl: process.env.REDIS_URL,
      minioEndpoint: process.env.MINIO_ENDPOINT,
      minioPort: process.env.MINIO_PORT,
      minioAccessKey: process.env.MINIO_ACCESS_KEY,
      minioSecretKey: process.env.MINIO_SECRET_KEY,
      minioUseSsl: process.env.MINIO_USE_SSL === 'true',
      imageProvider: process.env.IMAGE_PROVIDER,
      llmProvider: process.env.LLM_PROVIDER,
      googleGeminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
      stabilityApiKey: process.env.STABILITY_API_KEY,
      workerConcurrency: process.env.WORKER_CONCURRENCY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Worker configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseConfig();

console.log('📝 Worker configuration loaded:', {
  nodeEnv: config.nodeEnv,
  imageProvider: config.imageProvider,
  llmProvider: config.llmProvider,
  workerConcurrency: config.workerConcurrency,
});
