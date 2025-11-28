import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIOptions } from './AIProvider.js';

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
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
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
