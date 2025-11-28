import type { AIProvider, AIConfig } from './AIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';

/**
 * AI Provider Factory
 * 
 * Creates AI provider instances based on configuration.
 * This allows the BBS to support multiple AI providers without changing core logic.
 */
export class AIProviderFactory {
  /**
   * Create an AI provider based on configuration
   */
  static create(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.model);

      case 'openai':
        // Future implementation
        throw new Error('OpenAI provider not yet implemented');

      case 'ollama':
        // Future implementation
        throw new Error('Ollama provider not yet implemented');

      default:
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }
  }

  /**
   * Create an AI provider from environment variables
   * Useful for development and testing
   */
  static createFromEnv(): AIProvider {
    const provider = (process.env.AI_PROVIDER || 'anthropic') as AIConfig['provider'];
    const model = process.env.AI_MODEL || 'claude-3-5-haiku-20241022';
    const apiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!apiKey && provider === 'anthropic') {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    return AIProviderFactory.create({
      provider,
      model,
      apiKey,
    });
  }
}
