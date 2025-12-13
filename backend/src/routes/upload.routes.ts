import { Router, Request, Response } from 'express';
import { upload, generateFilename } from '../middleware/file-upload';
import { photoRepository } from '../database/repositories/photo.repository';
import { storageService } from '../services/storage.service';
import { uploadLimiter } from '../middleware/rate-limit';
import sharp from 'sharp';

const router = Router();

// POST /api/upload - Upload a photo (with rate limiting)
router.post('/', uploadLimiter, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    // Get image metadata
    const metadata = await sharp(file.buffer).metadata();

    // Generate unique filename
    const storedFilename = generateFilename(file.originalname);

    // Upload to MinIO
    const filePath = await storageService.uploadPhoto(
      storedFilename,
      file.buffer,
      file.mimetype
    );

    // Save to database
    const photo = await photoRepository.create({
      original_filename: file.originalname,
      stored_filename: storedFilename,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.mimetype,
      width: metadata.width,
      height: metadata.height,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    console.log(`📸 Photo uploaded: ${photo.id}`);

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: {
        id: photo.id,
        filename: photo.original_filename,
        status: photo.status,
        uploadedAt: photo.uploaded_at,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo', message: error.message });
  }
});

export default router;
