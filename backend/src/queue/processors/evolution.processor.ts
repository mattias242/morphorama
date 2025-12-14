/**
 * Evolution Processor - "Telephone Game" Experiment
 *
 * Handles iterative image regeneration to observe AI drift/mutation
 * Each iteration: takes previous image → regenerates with static prompt → repeat
 * No creative prompting - just pure iterative img2img to see how the image evolves
 */

import { Job } from 'bullmq';
import sharp from 'sharp';
import { evolutionRepository } from '../../database/repositories/evolution.repository';
import { evolutionFrameRepository } from '../../database/repositories/evolution-frame.repository';
import { photoRepository } from '../../database/repositories/photo.repository';
import { storageService } from '../../services/storage.service';
import { imageProvider } from '../../services/ai/image';

export interface EvolutionJobData {
  evolutionId: string;
  sourcePhotoId: string;
}

export interface EvolutionJobResult {
  evolutionId: string;
  framesGenerated: number;
  totalDurationSeconds: number;
  status: 'completed' | 'failed';
}

/**
 * Process a single evolution job (60 iterations)
 */
export async function processEvolution(job: Job<EvolutionJobData>): Promise<EvolutionJobResult> {
  const { evolutionId, sourcePhotoId } = job.data;
  const startTime = Date.now();

  console.log(`\n🚀 Starting evolution ${evolutionId} for photo ${sourcePhotoId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    // 1. Fetch evolution details
    const evolution = await evolutionRepository.findById(evolutionId);
    if (!evolution) {
      throw new Error(`Evolution ${evolutionId} not found`);
    }

    // 2. Fetch source photo
    const photo = await photoRepository.findById(sourcePhotoId);
    if (!photo) {
      throw new Error(`Source photo ${sourcePhotoId} not found`);
    }

    console.log(`📸 Source photo: ${photo.original_filename} (${photo.width}x${photo.height})`);

    // 3. Download original photo from storage
    const sourceImageBuffer = await storageService.downloadFile('uploads', photo.stored_filename);

    // 4. Update evolution status to processing
    await evolutionRepository.updateStatus(evolutionId, 'processing');

    // 5. Start evolution loop (60 iterations)
    // Using a static prompt for the "telephone game" experiment
    const STATIC_PROMPT = 'Recreate this image exactly as it appears, maintaining all details, colors, composition, and style';
    let previousFrameBuffer = sourceImageBuffer;

    for (let iteration = 1; iteration <= evolution.total_iterations; iteration++) {
      console.log(`\n📍 Iteration ${iteration}/${evolution.total_iterations}`);
      console.log(`─────────────────────────────────────────────────────────`);

      try {
        // Simple telephone game: Image → AI regeneration → repeat
        console.log(`🎨 Regenerating image (telephone game iteration)...`);
        console.log(`💡 Prompt: "${STATIC_PROMPT}"`);

        const imageResult = await imageProvider.generateImage({
          prompt: STATIC_PROMPT,
          sourceImage: previousFrameBuffer, // img2img with previous iteration
          aspectRatio: '1:1',
        });

        // Step C: Get image metadata
        const imageMetadata = await sharp(imageResult.imageBuffer).metadata();
        console.log(
          `📐 Image generated: ${imageMetadata.width}x${imageMetadata.height}, ` +
          `${(imageResult.imageBuffer.length / 1024 / 1024).toFixed(2)}MB`
        );

        // Step D: Upload to MinIO
        const framePath = await storageService.uploadEvolutionFrame(
          evolutionId,
          iteration,
          imageResult.imageBuffer
        );

        // Step E: Save frame to database
        await evolutionFrameRepository.create({
          evolution_id: evolutionId,
          iteration_number: iteration,
          file_path: framePath,
          file_size: imageResult.imageBuffer.length,
          width: imageMetadata.width,
          height: imageMetadata.height,
          prompt_used: STATIC_PROMPT,
          generation_time_ms: imageResult.metadata?.generationTimeMs || 0,
          provider: imageResult.metadata?.model || 'unknown',
          model_version: imageResult.metadata?.model,
        });

        // Step F: Update evolution progress
        await evolutionRepository.updateProgress(evolutionId, iteration);

        // Step G: Update job progress
        await job.updateProgress({
          iteration,
          total: evolution.total_iterations,
          percentage: Math.round((iteration / evolution.total_iterations) * 100),
        });

        console.log(`✅ Frame ${iteration} completed and saved`);

        // Step H: Use this frame as the next iteration's source
        previousFrameBuffer = imageResult.imageBuffer;

        // Optional: Small delay to avoid rate limiting
        if (iteration < evolution.total_iterations) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

      } catch (error: any) {
        console.error(`❌ Error in iteration ${iteration}:`, error.message);

        // Retry logic: if iteration fails, retry up to 3 times
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying iteration ${iteration} (attempt ${retryCount}/${maxRetries})...`);

          try {
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff

            // Retry the failed iteration
            const imageResult = await imageProvider.generateImage({
              prompt: STATIC_PROMPT,
              sourceImage: previousFrameBuffer,
              aspectRatio: '1:1',
            });

            const imageMetadata = await sharp(imageResult.imageBuffer).metadata();
            const framePath = await storageService.uploadEvolutionFrame(
              evolutionId,
              iteration,
              imageResult.imageBuffer
            );

            await evolutionFrameRepository.create({
              evolution_id: evolutionId,
              iteration_number: iteration,
              file_path: framePath,
              file_size: imageResult.imageBuffer.length,
              width: imageMetadata.width,
              height: imageMetadata.height,
              prompt_used: STATIC_PROMPT,
              generation_time_ms: imageResult.metadata?.generationTimeMs || 0,
              provider: imageResult.metadata?.model || 'unknown',
              model_version: imageResult.metadata?.model,
            });

            await evolutionRepository.updateProgress(evolutionId, iteration);
            previousFrameBuffer = imageResult.imageBuffer;

            console.log(`✅ Retry successful for iteration ${iteration}`);
            break; // Success, exit retry loop

          } catch (retryError: any) {
            console.error(`❌ Retry ${retryCount} failed:`, retryError.message);
            if (retryCount >= maxRetries) {
              throw new Error(`Failed after ${maxRetries} retries: ${retryError.message}`);
            }
          }
        }
      }
    }

    // 6. Mark evolution as completed
    await evolutionRepository.markComplete(evolutionId);

    const totalDurationSeconds = Math.round((Date.now() - startTime) / 1000);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Evolution ${evolutionId} completed successfully!`);
    console.log(`   Frames: ${evolution.total_iterations}`);
    console.log(`   Duration: ${totalDurationSeconds}s (${Math.round(totalDurationSeconds / 60)}min)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
      evolutionId,
      framesGenerated: evolution.total_iterations,
      totalDurationSeconds,
      status: 'completed',
    };

  } catch (error: any) {
    console.error(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`❌ Evolution ${evolutionId} failed: ${error.message}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Mark evolution as failed
    await evolutionRepository.markFailed(evolutionId, error.message);

    const totalDurationSeconds = Math.round((Date.now() - startTime) / 1000);

    return {
      evolutionId,
      framesGenerated: 0,
      totalDurationSeconds,
      status: 'failed',
    };
  }
}
