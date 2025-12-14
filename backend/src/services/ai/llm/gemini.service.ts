/**
 * Google Gemini LLM Service
 *
 * Uses Google's Gemini model with vision capabilities to analyze images
 * and generate creative evolution prompts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config';
import {
  ILLMProvider,
  PromptGenerationOptions,
  PromptGenerationResult,
} from '../interfaces/llm-provider.interface';

export class GeminiService implements ILLMProvider {
  private client: GoogleGenerativeAI;
  private modelName = 'gemini-2.0-flash-exp';

  constructor() {
    if (!config.googleGeminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    this.client = new GoogleGenerativeAI(config.googleGeminiApiKey);
    console.log('🤖 Gemini LLM service initialized (model: ' + this.modelName + ')');
  }

  async analyzeImageAndGeneratePrompt(
    options: PromptGenerationOptions
  ): Promise<PromptGenerationResult> {
    const startTime = Date.now();

    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });

      // Convert image buffer to base64
      const base64Image = options.imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(options.imageBuffer);

      // Build system prompt based on iteration
      const systemPrompt = this.buildSystemPrompt(options);

      console.log(`🎨 Generating evolution prompt (iteration ${options.iteration})...`);

      // Call Gemini with vision
      const result = await model.generateContent([
        systemPrompt,
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
      ]);

      const response = result.response;
      const prompt = response.text().trim();

      const generationTimeMs = Date.now() - startTime;

      console.log(`✅ Prompt generated in ${generationTimeMs}ms: "${prompt.substring(0, 100)}..."`);

      return {
        prompt,
        metadata: {
          model: this.modelName,
          generationTimeMs,
          iteration: options.iteration,
        },
      };
    } catch (error: any) {
      console.error('❌ Gemini prompt generation failed:', error.message);
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      // Simple test generation
      const result = await model.generateContent('Test');
      return !!result.response.text();
    } catch (error: any) {
      console.error('❌ Gemini API key validation failed:', error.message);
      return false;
    }
  }

  /**
   * Build iteration-aware system prompt for evolution
   */
  private buildSystemPrompt(options: PromptGenerationOptions): string {
    if (options.iteration === 1) {
      // First iteration: analyze original photo
      return `You are a creative AI art director working on an experimental photo evolution project.

Analyze this photograph carefully and create an imaginative transformation prompt that will evolve it into something unexpected and artistic.

Guidelines:
- Be bold and creative - think surreal, dreamlike, or fantastical transformations
- Focus on visual elements, mood, composition, and style
- The evolution should be interesting but not completely unrecognizable
- Keep the prompt concise (1-2 sentences, max 100 words)
- Return ONLY the image generation prompt, no explanations

Example good prompts:
- "Transform into a vibrant underwater scene with coral architecture and bioluminescent creatures"
- "Evolve into a steampunk mechanical world with brass gears and Victorian aesthetics"
- "Shift into a surreal melting dreamscape with Salvador Dali-inspired flowing forms"

Now analyze the image and create your evolution prompt:`;
    } else {
      // Subsequent iterations: continue evolution
      const previousContext = options.previousPrompt
        ? `\n\nPrevious evolution prompt: "${options.previousPrompt}"`
        : '';

      return `You are continuing an artistic photo evolution sequence (iteration ${options.iteration} of 60).

Analyze this evolved image and create the NEXT transformation prompt that continues the creative journey.${previousContext}

Guidelines:
- Build upon the current visual state while introducing new creative elements
- Maintain some continuity with previous iterations but keep evolving
- Be imaginative - introduce new themes, styles, or surreal elements
- Keep the prompt concise (1-2 sentences, max 100 words)
- Return ONLY the image generation prompt, no explanations

Create the next evolution prompt:`;
    }
  }

  /**
   * Detect MIME type from image buffer
   */
  private detectMimeType(buffer: Buffer): string {
    // PNG signature
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }

    // JPEG signature
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // WebP signature
    if (
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    // GIF signature
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }

    // Default to JPEG
    return 'image/jpeg';
  }
}
