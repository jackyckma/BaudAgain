import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIOptions, AIProviderError } from './AIProvider.js';

/**
 * Anthropic AI Provider
 * 
 * Implements the AIProvider interface using the Anthropic Claude API.
 * Supports models like Claude 3.5 Haiku and Claude 3.5 Sonnet.
 */
export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(
    private apiKey: string,
    private model: string = 'claude-3-5-haiku-20241022'
  ) {
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  /**
   * Generate a text completion from a prompt
   */
  async generateCompletion(prompt: string, options?: AIOptions): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature || 0.7,
        system: options?.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from the response
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in AI response');
      }

      return textContent.text;
    } catch (error) {
      // Enhanced error handling with specific error types
      if (error instanceof Error) {
        // Check for specific Anthropic API errors
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('api key')) {
          throw new AIProviderError(
            'Invalid or missing API key. Please check your ANTHROPIC_API_KEY environment variable.',
            'INVALID_API_KEY',
            error
          );
        }
        
        if (errorMessage.includes('rate limit')) {
          throw new AIProviderError(
            'Rate limit exceeded. Please try again in a moment.',
            'RATE_LIMIT',
            error
          );
        }
        
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          throw new AIProviderError(
            'Request timed out. The AI service may be experiencing high load.',
            'TIMEOUT',
            error
          );
        }
        
        if (errorMessage.includes('overloaded')) {
          throw new AIProviderError(
            'AI service is currently overloaded. Please try again shortly.',
            'OVERLOADED',
            error
          );
        }
        
        // Generic error
        throw new AIProviderError(
          `Anthropic API error: ${error.message}`,
          'API_ERROR',
          error
        );
      }
      throw error;
    }
  }

  /**
   * Generate structured output from a prompt
   * Uses Anthropic's tool use feature for structured data extraction
   */
  async generateStructured<T>(
    prompt: string,
    schema: any,
    options?: AIOptions
  ): Promise<T> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature || 0.7,
        system: options?.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools: [
          {
            name: 'structured_output',
            description: 'Output structured data according to the schema',
            input_schema: schema,
          },
        ],
        tool_choice: { type: 'tool', name: 'structured_output' },
      });

      // Extract tool use from response
      const toolUse = response.content.find((block) => block.type === 'tool_use');
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new Error('No tool use in AI response');
      }

      return toolUse.input as T;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the current model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Set a different model
   */
  setModel(model: string): void {
    this.model = model;
  }
}
