/**
 * LLM Provider Interface
 *
 * Abstract interface for Large Language Model services (Gemini, Claude, etc.)
 * Used for analyzing images and generating creative prompts for evolution
 */

export interface PromptGenerationOptions {
  /** Image to analyze (original photo or previous evolution frame) */
  imageBuffer: Buffer;

  /** Current iteration number (1-60) */
  iteration: number;

  /** Previous iteration's prompt for continuity */
  previousPrompt?: string;

  /** Additional context or theme guidance */
  context?: string;
}

export interface PromptGenerationResult {
  /** Generated prompt for image generation */
  prompt: string;

  /** Optional reasoning about the prompt generation */
  reasoning?: string;

  /** Additional metadata from the LLM */
  metadata?: {
    model?: string;
    tokensUsed?: number;
    generationTimeMs?: number;
    [key: string]: any;
  };
}

export interface ILLMProvider {
  /**
   * Analyze an image and generate a creative evolution prompt
   * @param options - Image and iteration context
   * @returns Generated prompt with metadata
   */
  analyzeImageAndGeneratePrompt(options: PromptGenerationOptions): Promise<PromptGenerationResult>;

  /**
   * Validate that the API key is configured and working
   * @returns true if API key is valid
   */
  validateApiKey(): Promise<boolean>;
}
