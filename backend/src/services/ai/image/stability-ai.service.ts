/**
 * Stability AI Image Generation Service
 *
 * Uses Stability AI's API for image generation
 * Simpler alternative to Google Imagen for initial implementation
 */

import sharp from 'sharp';
import { config } from '../../../config';
import {
  IImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../interfaces/image-provider.interface';

export class StabilityAIService implements IImageProvider {
  private apiKey: string;
  private baseUrl = 'https://api.stability.ai/v2beta/stable-image/generate';
  private model = 'sd3.5-large';

  constructor() {
    if (!config.stabilityApiKey) {
      throw new Error('Stability AI API key not configured');
    }

    this.apiKey = config.stabilityApiKey;
    console.log('🎨 Stability AI service initialized (model: ' + this.model + ')');
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      console.log(`🖼️  Generating image with Stability AI...`);
      console.log(`   Prompt: "${options.prompt.substring(0, 100)}..."`);

      // Prepare form data for Stability AI API
      const formData = new FormData();
      formData.append('prompt', options.prompt);
      formData.append('output_format', 'png');

      // Set aspect ratio (Stability AI uses string format like "1:1", "16:9")
      if (options.aspectRatio) {
        formData.append('aspect_ratio', options.aspectRatio);
      } else {
        formData.append('aspect_ratio', '1:1');
      }

      // Add negative prompt if provided
      if (options.negativePrompt) {
        formData.append('negative_prompt', options.negativePrompt);
      }

      // Add seed if provided (for reproducibility)
      if (options.seed) {
        formData.append('seed', options.seed.toString());
      }

      // Add source image for img2img if provided
      if (options.sourceImage) {
        const blob = new Blob([options.sourceImage], { type: 'image/png' });
        formData.append('image', blob, 'source.png');
        formData.append('mode', 'image-to-image');
        formData.append('strength', '0.7'); // How much to transform (0-1)
      }

      // Make API request
      const response = await fetch(`https://api.stability.ai/v2beta/stable-image/generate/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stability AI API error (${response.status}): ${errorText}`);
      }

      // Get image buffer from response
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Get image metadata using sharp
      const metadata = await sharp(imageBuffer).metadata();

      const generationTimeMs = Date.now() - startTime;

      console.log(`✅ Image generated in ${generationTimeMs}ms (${metadata.width}x${metadata.height})`);

      return {
        imageBuffer,
        mimeType: 'image/png',
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
      console.error('❌ Stability AI generation failed:', error.message);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Test API key with a simple generation request
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error: any) {
      console.error('❌ Stability AI API key validation failed:', error.message);
      return false;
    }
  }
}
