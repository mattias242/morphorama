import { Router, Request, Response } from 'express';
import { photoRepository } from '../database/repositories/photo.repository';
import { moderationLimiter } from '../middleware/rate-limit';
import { validate, paginationSchema, photoIdSchema, moderationActionSchema } from '../middleware/validation';

const router = Router();

// Apply rate limiting to all moderation routes
router.use(moderationLimiter);

// GET /api/moderation/queue - Get pending photos for moderation
router.get('/queue', validate(paginationSchema), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const photos = await photoRepository.findPending(limit, offset);
    const total = await photoRepository.countPending();
    const pages = Math.ceil(total / limit);

    res.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// GET /api/moderation/stats - Get moderation statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await photoRepository.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/moderation/photo/:id - Get single photo details
router.get('/photo/:id', validate(photoIdSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const photo = await photoRepository.findById(id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(photo);
  } catch (error: any) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// PATCH /api/moderation/photo/:id - Approve or reject photo
router.patch('/photo/:id', validate(moderationActionSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const moderatedBy = req.get('x-moderator-name') || 'moderator';

    let photo;
    if (action === 'approve') {
      photo = await photoRepository.approve(id, moderatedBy);
      console.log(`✅ Photo approved: ${id}`);
    } else {
      photo = await photoRepository.reject(id, moderatedBy, reason);
      console.log(`❌ Photo rejected: ${id}`);
    }

    res.json({
      message: `Photo ${action}d successfully`,
      photo,
    });
  } catch (error: any) {
    console.error('Error moderating photo:', error);
    res.status(500).json({ error: 'Failed to moderate photo' });
  }
});

export default router;
