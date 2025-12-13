import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';

// MinIO S3 client configuration
const s3Client = new S3Client({
  endpoint: `http://${config.minioEndpoint}:${config.minioPort}`,
  region: 'us-east-1', // MinIO doesn't care about region
  credentials: {
    accessKeyId: config.minioAccessKey,
    secretAccessKey: config.minioSecretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

export class StorageService {
  private readonly uploadsBucket = 'uploads';
  private readonly evolutionsBucket = 'evolutions';
  private readonly videosBucket = 'videos';

  constructor() {
    console.log('📦 Storage service initialized (MinIO)');
  }

  // Upload file to MinIO
  async uploadFile(
    bucket: string,
    key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      const filePath = `${bucket}/${key}`;
      console.log(`✅ Uploaded: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  // Upload photo
  async uploadPhoto(filename: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    return this.uploadFile(this.uploadsBucket, filename, fileBuffer, contentType);
  }

  // Upload evolution frame
  async uploadEvolutionFrame(
    evolutionId: string,
    iteration: number,
    fileBuffer: Buffer
  ): Promise<string> {
    const key = `${evolutionId}/frame-${iteration.toString().padStart(3, '0')}.png`;
    return this.uploadFile(this.evolutionsBucket, key, fileBuffer, 'image/png');
  }

  // Upload video
  async uploadVideo(evolutionId: string, fileBuffer: Buffer): Promise<string> {
    const key = `${evolutionId}.mp4`;
    return this.uploadFile(this.videosBucket, key, fileBuffer, 'video/mp4');
  }

  // Download file from MinIO
  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('❌ Download error:', error);
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  // Delete file from MinIO
  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      console.log(`🗑️  Deleted: ${bucket}/${key}`);
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  // Get public URL for file (for development - MinIO direct access)
  getPublicUrl(bucket: string, key: string): string {
    return `http://${config.minioEndpoint}:${config.minioPort}/${bucket}/${key}`;
  }

  // Save file from buffer to local filesystem (for temp processing)
  async saveToTemp(filename: string, buffer: Buffer): Promise<string> {
    const tempPath = path.join(process.cwd(), 'temp', filename);
    const fs = await import('fs/promises');
    await fs.writeFile(tempPath, buffer);
    return tempPath;
  }

  // Read file from local filesystem
  async readFromTemp(filename: string): Promise<Buffer> {
    const tempPath = path.join(process.cwd(), 'temp', filename);
    const fs = await import('fs/promises');
    return fs.readFile(tempPath);
  }
}

export const storageService = new StorageService();
