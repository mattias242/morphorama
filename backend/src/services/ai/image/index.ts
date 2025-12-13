/**
 * Image Provider Factory
 *
 * Exports the configured image generation provider based on application config
 */

import { config } from '../../config';
import { IImageProvider } from '../interfaces/image-provider.interface';
import { GoogleImagenService } from './google-imagen.service';
import { StabilityAIService } from './stability-ai.service';

/**
 * Factory function to get the configured image provider
 */
export const getImageProvider = (): IImageProvider => {
  switch (config.imageProvider) {
    case 'google-imagen':
      console.warn(
        '⚠️  Google Imagen requires Vertex AI setup. ' +
        'If you encounter errors, switch to stability-ai in config.'
      );
      return new GoogleImagenService();

    case 'stability-ai':
      return new StabilityAIService();

    default:
      throw new Error(`Unknown image provider: ${config.imageProvider}`);
  }
};

// Singleton export
export const imageProvider = getImageProvider();
