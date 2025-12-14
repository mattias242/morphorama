/**
 * Hugging Face Image Generation Service
 *
 * Uses Hugging Face Inference API for image generation
 * Supports models like Stable Diffusion, FLUX, etc.
 */

import { HfInference } from '@huggingface/inference';
import sharp from 'sharp';
import { config } from '../../../config';
import {
  IImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../interfaces/image-provider.interface';

export class HuggingFaceService implements IImageProvider {
  private client: HfInference;

  // Popular models - can be configured
  private model = 'black-forest-labs/FLUX.1-schnell'; // Fast and good quality
  // Alternatives:
  // - 'stabilityai/stable-diffusion-xl-base-1.0' (SDXL)
  // - 'stabilityai/stable-diffusion-3-medium' (SD3)
  // - 'black-forest-labs/FLUX.1-dev' (Better quality, slower)

  constructor() {
    if (!config.huggingfaceApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    this.client = new HfInference(config.huggingfaceApiKey);
    console.log('🤗 Hugging Face service initialized (model: ' + this.model + ')');
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      console.log(`🖼️  Generating image with Hugging Face (${this.model})...`);
      console.log(`   Prompt: "${options.prompt.substring(0, 100)}..."`);

      // Build parameters
      const parameters: any = {};

      if (options.negativePrompt) {
        parameters.negative_prompt = options.negativePrompt;
      }

      if (options.seed !== undefined) {
        parameters.seed = options.seed;
      }

      // Use the official Hugging Face SDK
      const result = await this.client.textToImage({
        model: this.model,
        inputs: options.prompt,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
      });

      // Convert response to Buffer (HF SDK returns Blob-like object)
      let imageBuffer: Buffer;
      if (result && typeof result === 'object' && 'arrayBuffer' in result) {
        const arrayBuffer = await (result as any).arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else if (typeof result === 'string') {
        // If it's a base64 string
        imageBuffer = Buffer.from(result, 'base64');
      } else {
        throw new Error('Unexpected response type from Hugging Face API');
      }

      // Validate it's actually an image
      if (imageBuffer.length < 100) {
        throw new Error('Invalid image data received (too small)');
      }

      // Get image metadata using sharp
      const metadata = await sharp(imageBuffer).metadata();

      const generationTimeMs = Date.now() - startTime;

      console.log(
        `✅ Image generated in ${generationTimeMs}ms (${metadata.width}x${metadata.height})`
      );

      return {
        imageBuffer,
        mimeType: `image/${metadata.format || 'png'}`,
        width: metadata.width || 1024,
        height: metadata.height || 1024,
        metadata: {
          model: this.model,
          generationTimeMs,
          seed: options.seed,
          format: metadata.format,
        },
      };
    } catch (error: any) {
      console.error('❌ Hugging Face generation failed:', error.message);

      // Provide helpful error messages
      if (error.message.includes('Model') && error.message.includes('loading')) {
        throw new Error(
          'Model is loading. This can take 20-60 seconds on first use. ' +
          'Please retry in a moment.'
        );
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Invalid Hugging Face API key. Get one at https://huggingface.co/settings/tokens'
        );
      }

      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Upgrade your Hugging Face plan or wait a moment. ' +
          'https://huggingface.co/pricing'
        );
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Test with a simple request using the SDK
      await this.client.textToImage({
        model: this.model,
        inputs: 'test',
      });
      return true;
    } catch (error: any) {
      // Model loading is okay, it means the key is valid
      if (error.message && error.message.includes('loading')) {
        return true;
      }
      console.error('❌ Hugging Face API key validation failed:', error.message);
      return false;
    }
  }

  /**
   * Change the model being used
   * Useful for switching between different Stable Diffusion versions
   */
  setModel(modelId: string): void {
    this.model = modelId;
    console.log(`🤗 Switched to model: ${modelId}`);
  }
}
