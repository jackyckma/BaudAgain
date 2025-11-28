import { AIProvider, AIOptions, AIProviderError } from './AIProvider.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * AI Service
 * 
 * Wraps AI provider with error handling, fallbacks, and retry logic.
 * Provides a resilient interface for AI features throughout the BBS.
 */
export class AIService {
  private retryAttempts: number = 2;
  private retryDelay: number = 1000; // ms

  constructor(
    private provider: AIProvider,
    private logger: FastifyBaseLogger,
    private fallbackEnabled: boolean = true
  ) {}

  /**
   * Generate a completion with error handling and fallbacks
   */
  async generateCompletion(
    prompt: string,
    options?: AIOptions,
    fallbackMessage?: string
  ): Promise<string> {
    let lastError: AIProviderError | null = null;

    // Try with retries for retryable errors
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.provider.generateCompletion(prompt, options);
        
        // Log successful generation
        this.logger.debug(
          { prompt: prompt.substring(0, 100), responseLength: response.length },
          'AI completion generated successfully'
        );
        
        return response;
      } catch (error) {
        if (error instanceof AIProviderError) {
          lastError = error;
          
          // Log the error
          this.logger.warn(
            { error: error.toJSON(), attempt: attempt + 1 },
            'AI provider error'
          );

          // Don't retry configuration errors
          if (error.isConfigurationError()) {
            break;
          }

          // Retry if error is retryable and we have attempts left
          if (error.isRetryable() && attempt < this.retryAttempts) {
            this.logger.info(
              { attempt: attempt + 1, delay: this.retryDelay },
              'Retrying AI request'
            );
            await this.sleep(this.retryDelay);
            continue;
          }

          // No more retries
          break;
        } else {
          // Unknown error
          this.logger.error({ error }, 'Unknown AI error');
          lastError = new AIProviderError(
            'Unknown error occurred',
            'API_ERROR',
            error instanceof Error ? error : undefined
          );
          break;
        }
      }
    }

    // All retries failed, use fallback if enabled
    if (this.fallbackEnabled && fallbackMessage) {
      this.logger.info('Using fallback message for AI response');
      return fallbackMessage;
    }

    // No fallback available, throw the error
    throw lastError || new AIProviderError('AI request failed', 'API_ERROR');
  }

  /**
   * Generate structured output with error handling
   */
  async generateStructured<T>(
    prompt: string,
    schema: any,
    options?: AIOptions
  ): Promise<T | null> {
    try {
      return await this.provider.generateStructured<T>(prompt, schema, options);
    } catch (error) {
      if (error instanceof AIProviderError) {
        this.logger.warn(
          { error: error.toJSON() },
          'AI structured generation failed'
        );
      } else {
        this.logger.error({ error }, 'Unknown AI error in structured generation');
      }
      return null;
    }
  }

  /**
   * Check if AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.provider.generateCompletion('test', { maxTokens: 10 });
      return true;
    } catch (error) {
      this.logger.warn({ error }, 'AI health check failed');
      return false;
    }
  }

  /**
   * Get fallback message for a specific context
   */
  static getFallbackMessage(context: 'welcome' | 'greeting' | 'help' | 'error'): string {
    switch (context) {
      case 'welcome':
        return '\x1b[36mWelcome to BaudAgain BBS!\x1b[0m\n\n' +
               'Thanks for joining our community. Explore the message bases,\n' +
               'try out the door games, and enjoy your stay!\n\n' +
               '\x1b[33mType MENU to see your options.\x1b[0m';

      case 'greeting':
        return '\x1b[36mWelcome back!\x1b[0m\n\n' +
               'Good to see you again. Check out the message bases for new posts!\n\n' +
               '\x1b[33mType MENU to continue.\x1b[0m';

      case 'help':
        return '\x1b[36mHow can I help?\x1b[0m\n\n' +
               'I\'m here to assist you with navigating the BBS.\n' +
               'Try exploring the message bases or door games!\n\n' +
               'Type MENU to see all available options.';

      case 'error':
        return '\x1b[33mThe AI SysOp is temporarily unavailable.\x1b[0m\n\n' +
               'Don\'t worry - all BBS features are still accessible!\n' +
               'Type MENU to continue.';

      default:
        return 'AI service is temporarily unavailable.';
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }

  /**
   * Enable or disable fallbacks
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }
}
