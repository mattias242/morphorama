import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const s3Client = new S3Client({
  endpoint: `http://${config.minioEndpoint}:${config.minioPort}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.minioAccessKey,
    secretAccessKey: config.minioSecretKey,
  },
  forcePathStyle: true,
});

const buckets = ['uploads', 'evolutions', 'videos'];

async function createBucketIfNotExists(bucketName: string): Promise<void> {
  try {
    // Try to check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket '${bucketName}' already exists`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      // Bucket doesn't exist, create it
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Created bucket '${bucketName}'`);
      } catch (createError) {
        console.error(`❌ Failed to create bucket '${bucketName}':`, createError);
        throw createError;
      }
    } else {
      console.error(`❌ Error checking bucket '${bucketName}':`, error);
      throw error;
    }
  }
}

export async function initializeStorage(): Promise<void> {
  console.log('🪣 Initializing MinIO buckets...');

  for (const bucket of buckets) {
    await createBucketIfNotExists(bucket);
  }

  console.log('✅ All MinIO buckets ready');
}
