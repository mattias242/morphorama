import { Router, Request, Response } from 'express';
import { storageService } from '../services/storage.service';
import { photoRepository } from '../database/repositories/photo.repository';
import { validate, photoIdSchema } from '../middleware/validation';

const router = Router();

// GET /api/photos/:id/image - Get photo image
router.get('/:id/image', validate(photoIdSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get photo metadata from database
    const photo = await photoRepository.findById(id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Download image from MinIO
    const imageBuffer = await storageService.downloadFile('uploads', photo.stored_filename);

    // Set content type and send image
    res.set('Content-Type', photo.mime_type);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Error fetching photo image:', error);
    res.status(500).json({ error: 'Failed to fetch photo image' });
  }
});

export default router;
