/**
 * Evolution Routes
 *
 * API endpoints for testing and monitoring evolution jobs
 */

import express from 'express';
import { evolutionRepository } from '../database/repositories/evolution.repository';
import { evolutionFrameRepository } from '../database/repositories/evolution-frame.repository';
import { photoRepository } from '../database/repositories/photo.repository';
import { storageService } from '../services/storage.service';
import { evolutionQueue } from '../queue';
import { processEvolution } from '../queue/processors/evolution.processor';

const router = express.Router();

/**
 * POST /api/evolution/start/:photoId
 * Manually trigger an evolution for a specific photo
 */
router.post('/start/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    // Validate photo exists and is approved
    const photo = await photoRepository.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.status !== 'approved') {
      return res.status(400).json({
        error: 'Photo must be approved before evolution',
        photoStatus: photo.status,
      });
    }

    // Create evolution record
    const evolution = await evolutionRepository.create({
      source_photo_id: photoId,
      total_iterations: req.body.iterations || 60,
    });

    // Option 1: Add to queue (requires worker to be running)
    if (req.body.useQueue) {
      const job = await evolutionQueue.add('process-evolution', {
        evolutionId: evolution.id,
        sourcePhotoId: photoId,
      });

      await evolutionRepository.updateStatus(evolution.id, 'queued');

      return res.status(202).json({
        message: 'Evolution job queued',
        evolution,
        jobId: job.id,
        note: 'Job will be processed by worker service',
      });
    }

    // Option 2: Process directly (for testing without worker)
    // This runs in the background and returns immediately
    console.log(`🚀 Starting direct evolution processing for ${evolution.id}`);

    // Run processor in background (non-blocking)
    processEvolution({
      data: {
        evolutionId: evolution.id,
        sourcePhotoId: photoId,
      },
      id: evolution.id,
      updateProgress: async (progress: any) => {
        console.log(`Progress: ${JSON.stringify(progress)}`);
      },
    } as any).catch((error) => {
      console.error(`Evolution ${evolution.id} failed:`, error);
    });

    return res.status(202).json({
      message: 'Evolution started (processing in background)',
      evolution,
      note: 'Check progress with GET /api/evolution/:id',
    });
  } catch (error: any) {
    console.error('Error starting evolution:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/evolution/:id
 * Get evolution status and progress
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const evolution = await evolutionRepository.findById(id);
    if (!evolution) {
      return res.status(404).json({ error: 'Evolution not found' });
    }

    const frameCount = await evolutionFrameRepository.countFrames(id);

    return res.json({
      evolution,
      progress: {
        frames: frameCount,
        total: evolution.total_iterations,
        percentage: Math.round((frameCount / evolution.total_iterations) * 100),
      },
    });
  } catch (error: any) {
    console.error('Error fetching evolution:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/evolution/:id/frames
 * List all frames for an evolution
 */
router.get('/:id/frames', async (req, res) => {
  try {
    const { id } = req.params;

    const evolution = await evolutionRepository.findById(id);
    if (!evolution) {
      return res.status(404).json({ error: 'Evolution not found' });
    }

    const frames = await evolutionFrameRepository.findByEvolutionId(id);

    return res.json({
      evolution_id: id,
      total_frames: frames.length,
      frames: frames.map((frame) => ({
        iteration: frame.iteration_number,
        file_path: frame.file_path,
        prompt: frame.prompt_used,
        size_mb: (frame.file_size / 1024 / 1024).toFixed(2),
        generation_time_ms: frame.generation_time_ms,
        provider: frame.provider,
        created_at: frame.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching frames:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/evolution/:id/frames/:iteration
 * Get specific frame image
 */
router.get('/:id/frames/:iteration/image', async (req, res) => {
  try {
    const { id, iteration } = req.params;

    const frame = await evolutionFrameRepository.findByIteration(id, parseInt(iteration));
    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Extract bucket and key from file path
    // Format: "evolutions/{evolutionId}/frame-{iteration}.png"
    const pathParts = frame.file_path.split('/');
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join('/');

    const imageBuffer = await storageService.downloadFile(bucket, key);

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="frame-${iteration}.png"`);
    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Error fetching frame image:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/evolution/stats
 * Get overall evolution statistics
 */
router.get('/', async (req, res) => {
  try {
    const evolutionStats = await evolutionRepository.getStats();
    const frameStats = await evolutionFrameRepository.getStats();

    return res.json({
      evolutions: evolutionStats,
      frames: frameStats,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/evolution/recent
 * Get recent evolutions
 */
router.get('/list/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const evolutions = await evolutionRepository.getRecent(limit);

    return res.json({ evolutions });
  } catch (error: any) {
    console.error('Error fetching recent evolutions:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
