/**
 * Google Imagen Image Generation Service
 *
 * Uses Google's Imagen 3 model via Gemini API for AI image generation
 * Simpler approach using the same API key as Gemini LLM
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { config } from '../../../config';
import {
  IImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../interfaces/image-provider.interface';

export class GoogleImagenService implements IImageProvider {
  private client: GoogleGenerativeAI;
  private modelName = 'imagen-3.0-generate-001';

  constructor() {
    if (!config.googleGeminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    this.client = new GoogleGenerativeAI(config.googleGeminiApiKey);
    console.log('🎨 Google Imagen service initialized (model: ' + this.modelName + ')');
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      console.log(`🖼️  Generating image with Imagen via Gemini API...`);
      console.log(`   Prompt: "${options.prompt.substring(0, 100)}..."`);

      // Use the Imagen model through Gemini API
      const model = this.client.getGenerativeModel({
        model: this.modelName,
      });

      // Build the generation request
      const generationConfig: any = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Generate image from text prompt
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: options.prompt }]
        }],
        generationConfig,
      });

      const response = result.response;

      // Extract image data from response
      // The response format may vary, but typically contains base64 image data
      // or a URL to the generated image

      // Check if response has inline data (base64 image)
      let imageBuffer: Buffer;

      if (response.candidates && response.candidates[0]?.content?.parts) {
        const parts = response.candidates[0].content.parts;

        // Look for inline data in the response
        for (const part of parts) {
          if ((part as any).inlineData) {
            const inlineData = (part as any).inlineData;
            imageBuffer = Buffer.from(inlineData.data, 'base64');
            break;
          }
        }
      }

      if (!imageBuffer!) {
        // If no inline data, try to get image from text response
        // Some models return URLs or other formats
        const text = response.text();

        // Try to extract base64 data if present in text
        const base64Match = text.match(/data:image\/[^;]+;base64,([^"]+)/);
        if (base64Match) {
          imageBuffer = Buffer.from(base64Match[1], 'base64');
        } else {
          throw new Error('No image data found in response. Response: ' + text.substring(0, 200));
        }
      }

      // Get image metadata
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
          model: this.modelName,
          generationTimeMs,
          seed: options.seed,
        },
      };
    } catch (error: any) {
      console.error('❌ Imagen generation failed:', error.message);

      // Provide helpful error message
      if (error.message.includes('not found') || error.message.includes('not supported')) {
        throw new Error(
          'Imagen model not accessible via this API key. ' +
          'Imagen 3 may require a paid API tier or special access. ' +
          'Consider using Stability AI as an alternative, or check your API key permissions at ' +
          'https://aistudio.google.com/'
        );
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Validate by checking if we can access the Imagen model
      const model = this.client.getGenerativeModel({ model: this.modelName });

      // Try a simple generation
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: 'test' }]
        }]
      });

      return !!result.response;
    } catch (error: any) {
      console.error('❌ Google Imagen API key validation failed:', error.message);
      return false;
    }
  }
}
