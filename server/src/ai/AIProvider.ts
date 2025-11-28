/**
 * AI Provider Abstraction
 * 
 * Provides a unified interface for different AI providers (Anthropic, OpenAI, Ollama, etc.)
 * This allows the BBS to switch between providers without changing core logic.
 */

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  /**
   * Generate a text completion from a prompt
   */
  generateCompletion(prompt: string, options?: AIOptions): Promise<string>;

  /**
   * Generate structured output from a prompt
   * Useful for function calling and structured data extraction
   */
  generateStructured<T>(prompt: string, schema: any, options?: AIOptions): Promise<T>;
}

export interface AIConfig {
  provider: 'anthropic' | 'openai' | 'ollama';
  model: string;
  apiKey: string;
}

/**
 * AI Error Codes
 */
export type AIErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'OVERLOADED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE';

/**
 * AI Provider Error
 */
export class AIProviderError extends Error {
  public readonly code: AIErrorCode;
  public readonly originalError?: Error;
  public readonly timestamp: Date;

  constructor(message: string, code: AIErrorCode, originalError?: Error) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIProviderError);
    }
  }

  isRetryable(): boolean {
    return ['TIMEOUT', 'OVERLOADED', 'NETWORK_ERROR'].includes(this.code);
  }

  isConfigurationError(): boolean {
    return this.code === 'INVALID_API_KEY';
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'INVALID_API_KEY':
        return 'AI features are not properly configured. Please contact the SysOp.';
      case 'RATE_LIMIT':
        return 'AI service is busy. Please try again in a moment.';
      case 'TIMEOUT':
      case 'OVERLOADED':
        return 'AI service is temporarily unavailable. Please try again shortly.';
      case 'NETWORK_ERROR':
        return 'Unable to reach AI service. Please check your connection.';
      default:
        return 'AI service encountered an error. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      originalError: this.originalError?.message,
    };
  }
}
