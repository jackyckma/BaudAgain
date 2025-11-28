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
