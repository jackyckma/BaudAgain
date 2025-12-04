/**
 * Daily Digest Service
 * 
 * Generates "Catch Me Up" summaries for users who have been away.
 * Analyzes activity since last login and highlights new messages.
 */

import { AIProvider, AIOptions, AIProviderError } from '../ai/AIProvider.js';
import { ANSIColorizer } from '../ansi/ANSIColorizer.js';
import { ANSIFrameBuilder, FrameLine } from '../ansi/ANSIFrameBuilder.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';
import type { FastifyBaseLogger } from 'fastify';

export interface DigestOptions {
  userId: string;
  lastLogin: Date;
  messageBasesWithActivity: Array<{
    base: MessageBase;
    newMessages: Message[];
  }>;
}

export interface DailyDigest {
  userId: string;
  lastLogin: Date;
  generatedAt: Date;
  totalNewMessages: number;
  messageBaseSummaries: Array<{
    baseId: string;
    baseName: string;
    messageCount: number;
    highlights: string[];
  }>;
  overallSummary: string;
}

export interface FormattedDigest {
  plain: string;
  colored: string;
  framed: string;
}

export class DailyDigestService {
  private readonly DEFAULT_MAX_TOKENS = 1000;
  private readonly HOURS_AWAY_THRESHOLD = 24;

  constructor(
    private provider: AIProvider,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Check if user should receive a digest (been away > 24 hours)
   */
  shouldGenerateDigest(lastLogin: Date | undefined): boolean {
    if (!lastLogin) {
      return false; // First login, no digest needed
    }

    const hoursSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60);
    return hoursSinceLogin >= this.HOURS_AWAY_THRESHOLD;
  }

  /**
   * Generate a daily digest for a user
   */
  async generateDigest(options: DigestOptions): Promise<DailyDigest> {
    const { userId, lastLogin, messageBasesWithActivity } = options;

    this.logger.info(
      { userId, lastLogin, basesCount: messageBasesWithActivity.length },
      'Generating daily digest'
    );

    // Calculate total new messages
    const totalNewMessages = messageBasesWithActivity.reduce(
      (sum, item) => sum + item.newMessages.length,
      0
    );

    if (totalNewMessages === 0) {
      return this.createEmptyDigest(userId, lastLogin);
    }

    try {
      // Generate summaries for each message base
      const messageBaseSummaries = await Promise.all(
        messageBasesWithActivity.map(item =>
          this.summarizeMessageBase(item.base, item.newMessages)
        )
      );

      // Generate overall summary
      const overallSummary = await this.generateOverallSummary(
        lastLogin,
        messageBaseSummaries,
        totalNewMessages
      );

      const digest: DailyDigest = {
        userId,
        lastLogin,
        generatedAt: new Date(),
        totalNewMessages,
        messageBaseSummaries,
        overallSummary,
      };

      this.logger.info(
        {
          userId,
          totalNewMessages,
          basesCount: messageBaseSummaries.length,
        },
        'Daily digest generated successfully'
      );

      return digest;
    } catch (error) {
      if (error instanceof AIProviderError) {
        this.logger.error(
          { error: error.toJSON() },
          'AI provider error during digest generation'
        );
        throw error;
      }

      this.logger.error({ error }, 'Unexpected error during digest generation');
      throw new Error('Failed to generate digest');
    }
  }

  /**
   * Summarize activity in a single message base
   */
  private async summarizeMessageBase(
    base: MessageBase,
    newMessages: Message[]
  ): Promise<{
    baseId: string;
    baseName: string;
    messageCount: number;
    highlights: string[];
  }> {
    if (newMessages.length === 0) {
      return {
        baseId: base.id,
        baseName: base.name,
        messageCount: 0,
        highlights: [],
      };
    }

    // Build prompt for message base summary
    const prompt = this.buildMessageBaseSummaryPrompt(base.name, newMessages);
    const systemPrompt = this.getSystemPrompt();

    const aiOptions: AIOptions = {
      maxTokens: 300,
      temperature: 0.3,
      systemPrompt,
    };

    const summaryText = await this.provider.generateCompletion(prompt, aiOptions);

    // Parse highlights from response
    const highlights = this.parseHighlights(summaryText);

    return {
      baseId: base.id,
      baseName: base.name,
      messageCount: newMessages.length,
      highlights,
    };
  }

  /**
   * Build prompt for message base summary
   */
  private buildMessageBaseSummaryPrompt(
    baseName: string,
    messages: Message[]
  ): string {
    const formattedMessages = messages.slice(0, 10).map((msg, index) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      return `[${index + 1}] ${date} - ${msg.authorHandle || 'Unknown'}
Subject: ${msg.subject}
${msg.body.substring(0, 200)}${msg.body.length > 200 ? '...' : ''}`;
    }).join('\n\n');

    const messageCountNote = messages.length > 10
      ? `\n\n(Showing first 10 of ${messages.length} messages)`
      : '';

    return `Summarize the new activity in "${baseName}" message base:

${formattedMessages}${messageCountNote}

Provide 2-3 brief highlights (one sentence each) about the most interesting or important topics discussed.
Format as a simple list:
- [Highlight 1]
- [Highlight 2]
- [Highlight 3]`;
  }

  /**
   * Generate overall summary across all message bases
   */
  private async generateOverallSummary(
    lastLogin: Date,
    messageBaseSummaries: Array<{
      baseId: string;
      baseName: string;
      messageCount: number;
      highlights: string[];
    }>,
    totalNewMessages: number
  ): Promise<string> {
    const hoursSinceLogin = Math.floor(
      (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60)
    );

    const summaryData = messageBaseSummaries
      .map(
        summary =>
          `${summary.baseName} (${summary.messageCount} new):\n${summary.highlights
            .map(h => `  - ${h}`)
            .join('\n')}`
      )
      .join('\n\n');

    const prompt = `Generate a brief welcome-back message for a user who has been away for ${hoursSinceLogin} hours.

Activity summary:
${summaryData}

Total new messages: ${totalNewMessages}

Write a friendly 2-3 sentence summary that:
1. Welcomes them back
2. Highlights the most interesting activity
3. Encourages them to catch up

Keep it warm and engaging, like a helpful friend catching you up.`;

    const systemPrompt = this.getSystemPrompt();

    const aiOptions: AIOptions = {
      maxTokens: 200,
      temperature: 0.7,
      systemPrompt,
    };

    return this.provider.generateCompletion(prompt, aiOptions);
  }

  /**
   * Get system prompt for digest generation
   */
  private getSystemPrompt(): string {
    return `You are a helpful BBS assistant that creates "Catch Me Up" summaries for returning users.

Your role is to:
1. Identify the most interesting and important activity
2. Highlight key discussions and topics
3. Make users feel welcomed and informed
4. Keep summaries brief and scannable

Guidelines:
- Be warm and friendly
- Focus on substance over style
- Highlight what's new and interesting
- Use clear, accessible language
- Keep it concise - users want to catch up quickly`;
  }

  /**
   * Parse highlights from AI response
   */
  private parseHighlights(response: string): string[] {
    const lines = response.split('\n').map(line => line.trim());
    const highlights: string[] = [];

    for (const line of lines) {
      if (line.startsWith('-') || line.startsWith('•')) {
        const highlight = line.substring(1).trim();
        if (highlight) {
          highlights.push(highlight);
        }
      }
    }

    // If no bullet points found, try to split by sentences
    if (highlights.length === 0) {
      const sentences = response
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      return sentences.slice(0, 3);
    }

    return highlights.slice(0, 3); // Limit to 3 highlights
  }

  /**
   * Create an empty digest for users with no new activity
   */
  private createEmptyDigest(userId: string, lastLogin: Date): DailyDigest {
    return {
      userId,
      lastLogin,
      generatedAt: new Date(),
      totalNewMessages: 0,
      messageBaseSummaries: [],
      overallSummary: 'Welcome back! Things have been quiet since your last visit. Why not start a new conversation?',
    };
  }

  /**
   * Format digest with ANSI colors and framing
   */
  formatDigest(digest: DailyDigest, frameWidth: number = 80): FormattedDigest {
    const hoursSinceLogin = Math.floor(
      (Date.now() - digest.lastLogin.getTime()) / (1000 * 60 * 60)
    );

    // Build plain text version
    const plainLines: string[] = [];
    plainLines.push('═══ CATCH ME UP ═══');
    plainLines.push('');
    plainLines.push(`You've been away for ${hoursSinceLogin} hours`);
    plainLines.push(`${digest.totalNewMessages} new messages since your last visit`);
    plainLines.push('');
    plainLines.push(digest.overallSummary);

    if (digest.messageBaseSummaries.length > 0) {
      plainLines.push('');
      plainLines.push('WHAT YOU MISSED:');
      plainLines.push('');

      digest.messageBaseSummaries.forEach(summary => {
        plainLines.push(`${summary.baseName} (${summary.messageCount} new)`);
        summary.highlights.forEach(highlight => {
          plainLines.push(`  • ${highlight}`);
        });
        plainLines.push('');
      });
    }

    const plain = plainLines.join('\n');

    // Build colored version
    const coloredLines: string[] = [];
    coloredLines.push(ANSIColorizer.colorize('═══ CATCH ME UP ═══', 'cyan'));
    coloredLines.push('');
    coloredLines.push(
      ANSIColorizer.colorize(
        `You've been away for ${hoursSinceLogin} hours`,
        'white'
      )
    );
    coloredLines.push(
      ANSIColorizer.colorize(
        `${digest.totalNewMessages} new messages since your last visit`,
        'yellow'
      )
    );
    coloredLines.push('');
    coloredLines.push(ANSIColorizer.colorize(digest.overallSummary, 'white'));

    if (digest.messageBaseSummaries.length > 0) {
      coloredLines.push('');
      coloredLines.push(ANSIColorizer.colorize('WHAT YOU MISSED:', 'yellow'));
      coloredLines.push('');

      digest.messageBaseSummaries.forEach(summary => {
        coloredLines.push(
          ANSIColorizer.colorize(
            `${summary.baseName} (${summary.messageCount} new)`,
            'cyan'
          )
        );
        summary.highlights.forEach(highlight => {
          coloredLines.push(ANSIColorizer.colorize(`  • ${highlight}`, 'green'));
        });
        coloredLines.push('');
      });
    }

    const colored = coloredLines.join('\n');

    // Build framed version
    const frameLines: FrameLine[] = [];

    // Add colored content to frame
    coloredLines.forEach(line => {
      frameLines.push({ text: line, align: 'left' });
    });

    const frameBuilder = new ANSIFrameBuilder({
      width: frameWidth,
      padding: 2,
      style: 'double',
      align: 'left',
    });

    const framedLines = frameBuilder.buildWithTitle(
      'What You Missed',
      frameLines,
      '\x1b[36m' // Cyan for title
    );

    const framed = framedLines.join('\n');

    return { plain, colored, framed };
  }
}
