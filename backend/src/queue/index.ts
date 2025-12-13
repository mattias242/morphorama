/**
 * BullMQ Queue Configuration
 *
 * Sets up Redis-backed job queues for asynchronous processing
 */

import { Queue, QueueEvents } from 'bullmq';
import { config } from '../config';

/**
 * Redis connection configuration
 */
const redisConnection = {
  connection: {
    url: config.redisUrl,
  },
};

/**
 * Evolution Queue
 * Handles 60-iteration photo evolution jobs
 */
export const evolutionQueue = new Queue('evolution', {
  ...redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

/**
 * Queue Events
 * Listen to queue events for logging and monitoring
 */
const evolutionQueueEvents = new QueueEvents('evolution', redisConnection);

// Event listeners
evolutionQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`✅ Job ${jobId} completed successfully`);
});

evolutionQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed: ${failedReason}`);
});

evolutionQueueEvents.on('progress', ({ jobId, data }) => {
  console.log(`📊 Job ${jobId} progress: ${JSON.stringify(data)}`);
});

/**
 * Graceful shutdown
 */
export const closeQueues = async () => {
  console.log('🔌 Closing queues...');
  await evolutionQueue.close();
  await evolutionQueueEvents.close();
  console.log('✅ Queues closed');
};

// Log initialization
console.log('📬 BullMQ queues initialized');

// Export queue for adding jobs
export { Queue, QueueEvents };
