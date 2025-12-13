/**
 * Morphorama Worker
 *
 * Processes evolution jobs from the queue
 * Note: This worker currently imports from ../backend for simplicity.
 * In production, consider creating a shared package or duplicating necessary code.
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';

// Note: In a proper microservices setup, we would duplicate or share these modules
// For now, we'll note that the evolution processor should be integrated here
// The actual processor logic should be adapted to the worker environment

console.log('🔧 Morphorama Worker starting...');
console.log(`Environment: ${config.nodeEnv}`);
console.log(`Image Provider: ${config.imageProvider}`);
console.log(`LLM Provider: ${config.llmProvider}`);

// Redis connection
const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

console.log('📡 Redis: Connected');

/**
 * Evolution Worker
 * Processes 60-iteration photo evolution jobs
 *
 * TODO: Import the evolution processor from backend/src/queue/processors/evolution.processor.ts
 * For now, we're creating a placeholder. The actual implementation should:
 * 1. Initialize AI services (Gemini, Stability AI)
 * 2. Initialize database connections
 * 3. Initialize storage service (MinIO)
 * 4. Run the 60-iteration loop
 */
const evolutionWorker = new Worker(
  'evolution',
  async (job) => {
    console.log(`\n🚀 Processing evolution job ${job.id}`);
    console.log(`Data:`, job.data);

    // TODO: Call processEvolution() from evolution.processor.ts
    // For now, return a placeholder response
    console.warn('⚠️  Evolution processor not yet integrated');
    console.warn('   Worker needs evolution processor implementation');
    console.warn('   See: backend/src/queue/processors/evolution.processor.ts');

    return {
      status: 'placeholder',
      message: 'Evolution processor integration pending',
    };
  },
  {
    connection,
    concurrency: config.workerConcurrency,
  }
);

// Event handlers
evolutionWorker.on('completed', (job, result) => {
  console.log(`✅ Evolution job ${job.id} completed`);
  console.log(`   Result:`, result);
});

evolutionWorker.on('failed', (job, err) => {
  console.error(`❌ Evolution job ${job?.id} failed:`, err.message);
});

evolutionWorker.on('progress', (job, progress) => {
  console.log(`📊 Evolution job ${job.id} progress:`, progress);
});

console.log('✅ Morphorama Worker ready (listening to "evolution" queue)');
console.log(`   Concurrency: ${config.workerConcurrency}`);

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🔌 Shutting down worker...');
  await evolutionWorker.close();
  await connection.quit();
  console.log('✅ Worker stopped gracefully');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
