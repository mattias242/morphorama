/**
 * LLM Provider Factory
 *
 * Exports the configured LLM provider based on application config
 */

import { config } from '../../../config';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import { GeminiService } from './gemini.service';

/**
 * Factory function to get the configured LLM provider
 */
export const getLLMProvider = (): ILLMProvider => {
  switch (config.llmProvider) {
    case 'gemini':
      return new GeminiService();
    case 'claude':
      throw new Error('Claude provider not yet implemented');
    default:
      throw new Error(`Unknown LLM provider: ${config.llmProvider}`);
  }
};

// Singleton export
export const llmProvider = getLLMProvider();
