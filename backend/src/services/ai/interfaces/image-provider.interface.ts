/**
 * Image Generation Provider Interface
 *
 * Abstract interface for AI image generation services (Google Imagen, Stability AI, etc.)
 * Allows switching between providers while maintaining consistent API
 */

export interface ImageGenerationOptions {
  /** Text prompt describing the desired image */
  prompt: string;

  /** Optional source image for img2img transformations */
  sourceImage?: Buffer;

  /** Aspect ratio for generated image */
  aspectRatio?: '1:1' | '16:9';

  /** Random seed for reproducible generations */
  seed?: number;

  /** Negative prompt to avoid certain elements */
  negativePrompt?: string;
}

export interface ImageGenerationResult {
  /** Generated image as buffer */
  imageBuffer: Buffer;

  /** MIME type of generated image (e.g., 'image/png') */
  mimeType: string;

  /** Image width in pixels */
  width: number;

  /** Image height in pixels */
  height: number;

  /** Additional metadata from the provider */
  metadata?: {
    model?: string;
    generationTimeMs?: number;
    seed?: number;
    [key: string]: any;
  };
}

export interface IImageProvider {
  /**
   * Generate an image from a text prompt
   * @param options - Generation options including prompt and parameters
   * @returns Generated image with metadata
   */
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;

  /**
   * Validate that the API key is configured and working
   * @returns true if API key is valid
   */
  validateApiKey(): Promise<boolean>;
}
