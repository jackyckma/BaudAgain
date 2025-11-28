import { AIService } from './AIService.js';
import type { BBSConfig } from '../config/ConfigLoader.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * AI SysOp Agent
 * 
 * The AI-powered system operator that welcomes users, provides help,
 * and adds personality to the BBS experience.
 */
export class AISysOp {
  private readonly maxResponseLength = 500;

  constructor(
    private aiService: AIService,
    private config: BBSConfig,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Generate a welcome message for a new user
   */
  async generateWelcome(handle: string): Promise<string> {
    if (!this.config.ai.sysop.enabled || !this.config.ai.sysop.welcomeNewUsers) {
      return AIService.getFallbackMessage('welcome');
    }

    const prompt = `A new user named "${handle}" just registered on the BBS. Welcome them warmly!`;

    try {
      const response = await this.aiService.generateCompletion(
        prompt,
        {
          systemPrompt: this.getSystemPrompt(),
          maxTokens: this.maxResponseLength,
          temperature: 0.8,
        },
        AIService.getFallbackMessage('welcome')
      );

      return this.formatResponse(response);
    } catch (error) {
      this.logger.error({ error, handle }, 'Failed to generate welcome message');
      return AIService.getFallbackMessage('welcome');
    }
  }

  /**
   * Generate a greeting for a returning user
   */
  async generateGreeting(handle: string, lastLogin?: Date): Promise<string> {
    if (!this.config.ai.sysop.enabled) {
      return AIService.getFallbackMessage('greeting');
    }

    const lastLoginText = lastLogin
      ? `Their last login was ${lastLogin.toLocaleString()}.`
      : 'This is their first login after registration.';

    const prompt = `User "${handle}" just logged in. ${lastLoginText} Greet them!`;

    try {
      const response = await this.aiService.generateCompletion(
        prompt,
        {
          systemPrompt: this.getSystemPrompt(),
          maxTokens: this.maxResponseLength,
          temperature: 0.8,
        },
        AIService.getFallbackMessage('greeting')
      );

      return this.formatResponse(response);
    } catch (error) {
      this.logger.error({ error, handle }, 'Failed to generate greeting');
      return AIService.getFallbackMessage('greeting');
    }
  }

  /**
   * Respond to a user paging the SysOp
   */
  async respondToPage(handle: string, question?: string): Promise<string> {
    if (!this.config.ai.sysop.enabled) {
      return AIService.getFallbackMessage('help');
    }

    const prompt = question
      ? `User "${handle}" paged you with this question: "${question}". Help them out!`
      : `User "${handle}" paged you for help. Offer assistance!`;

    try {
      const response = await this.aiService.generateCompletion(
        prompt,
        {
          systemPrompt: this.getSystemPrompt(),
          maxTokens: this.maxResponseLength,
          temperature: 0.7,
        },
        AIService.getFallbackMessage('help')
      );

      return this.formatResponse(response);
    } catch (error) {
      this.logger.error({ error, handle, question }, 'Failed to respond to page');
      return AIService.getFallbackMessage('help');
    }
  }

  /**
   * Get the system prompt for the AI SysOp
   */
  private getSystemPrompt(): string {
    const basePrompt = this.config.ai.sysop.personality;
    const bbsInfo = `
BBS Name: ${this.config.bbs.name}
Tagline: ${this.config.bbs.tagline}
SysOp: ${this.config.bbs.sysopName}

IMPORTANT RULES:
1. Keep responses under ${this.maxResponseLength} characters
2. Include ANSI color codes for visual emphasis:
   - \\x1b[36m for cyan (highlights)
   - \\x1b[33m for yellow (important info)
   - \\x1b[32m for green (positive messages)
   - \\x1b[31m for red (warnings)
   - \\x1b[0m to reset colors
3. Be friendly, helpful, and enthusiastic about the BBS
4. Reference BBS features: message bases, door games, user profiles
5. Keep the nostalgic 1980s BBS vibe alive
`;

    return `${basePrompt}\n\n${bbsInfo}`;
  }

  /**
   * Format and validate the AI response
   */
  private formatResponse(response: string): string {
    // Trim whitespace
    let formatted = response.trim();

    // Convert escaped ANSI codes to actual escape sequences
    // The AI outputs literal strings like "\x1b[36m" which need to be converted
    formatted = formatted.replace(/\\x1b/g, '\x1b');

    // Ensure response ends with proper line breaks
    if (!formatted.endsWith('\n')) {
      formatted += '\n';
    }

    // Truncate if too long (shouldn't happen with maxTokens, but safety check)
    if (formatted.length > this.maxResponseLength) {
      formatted = formatted.substring(0, this.maxResponseLength - 3) + '...';
    }

    // Ensure color codes are properly closed
    if (formatted.includes('\x1b[') && !formatted.endsWith('\x1b[0m\n')) {
      // Add color reset before final newline
      formatted = formatted.trimEnd() + '\x1b[0m\n';
    }

    return formatted;
  }

  /**
   * Check if AI SysOp is enabled
   */
  isEnabled(): boolean {
    return this.config.ai.sysop.enabled;
  }

  /**
   * Get the AI SysOp's personality description
   */
  getPersonality(): string {
    return this.config.ai.sysop.personality;
  }
}
