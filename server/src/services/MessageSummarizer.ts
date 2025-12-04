/**
 * Message Summarizer Service
 * 
 * Generates AI-powered summaries of message threads with caching support.
 * Formats summaries with ANSI highlighting for terminal display.
 */

import { AIProvider, AIOptions, AIProviderError } from '../ai/AIProvider.js';
import { ANSIColorizer, ColorName } from '../ansi/ANSIColorizer.js';
import { ANSIFrameBuilder, FrameLine } from '../ansi/ANSIFrameBuilder.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';
import type { FastifyBaseLogger } from 'fastify';

export interface SummaryOptions {
  messageBaseId: string;
  messageBaseName?: string;
  maxMessages?: number;
  includeMetadata?: boolean;
}

export interface MessageSummary {
  messageBaseId: string;
  messageBaseName: string;
  messageCount: number;
  summary: string;
  keyPoints: string[];
  activeTopics: string[];
  generatedAt: Date;
  cacheKey: string;
}

export interface FormattedSummary {
  plain: string;
  colored: string;
  framed: string;
}

export class MessageSummarizer {
  private readonly DEFAULT_MAX_MESSAGES = 50;
  private readonly DEFAULT_MAX_TOKENS = 1500;
  private readonly CACHE_EXPIRATION_MS = 3600000; // 1 hour

  // In-memory cache for summaries
  private summaryCache: Map<string, { summary: MessageSummary; expiresAt: number }>;

  constructor(
    private provider: AIProvider,
    private logger: FastifyBaseLogger
  ) {
    this.summaryCache = new Map();
  }

  /**
   * Generate a summary of messages in a message base
   */
  async summarizeMessages(
    messages: Message[],
    options: SummaryOptions
  ): Promise<MessageSummary> {
    const {
      messageBaseId,
      messageBaseName = 'Message Base',
      maxMessages = this.DEFAULT_MAX_MESSAGES,
    } = options;

    // Check cache first
    const cacheKey = this.generateCacheKey(messageBaseId, messages.length);
    const cached = this.getCachedSummary(cacheKey);
    if (cached) {
      this.logger.info(
        { messageBaseId, cacheKey },
        'Returning cached summary'
      );
      return cached;
    }

    this.logger.info(
      { messageBaseId, messageCount: messages.length },
      'Generating message summary'
    );

    // Limit messages to process
    const messagesToSummarize = messages.slice(0, maxMessages);

    if (messagesToSummarize.length === 0) {
      return this.createEmptySummary(messageBaseId, messageBaseName, cacheKey);
    }

    try {
      const prompt = this.buildSummaryPrompt(messagesToSummarize, messageBaseName);
      const systemPrompt = this.getSystemPrompt();

      const aiOptions: AIOptions = {
        maxTokens: this.DEFAULT_MAX_TOKENS,
        temperature: 0.3, // Lower temperature for more focused summaries
        systemPrompt,
      };

      const summaryText = await this.provider.generateCompletion(prompt, aiOptions);

      // Parse the summary response
      const parsedSummary = this.parseSummaryResponse(summaryText);

      const summary: MessageSummary = {
        messageBaseId,
        messageBaseName,
        messageCount: messagesToSummarize.length,
        summary: parsedSummary.summary,
        keyPoints: parsedSummary.keyPoints,
        activeTopics: parsedSummary.activeTopics,
        generatedAt: new Date(),
        cacheKey,
      };

      // Cache the summary
      this.cacheSummary(cacheKey, summary);

      this.logger.info(
        {
          messageBaseId,
          messageCount: messagesToSummarize.length,
          keyPointsCount: parsedSummary.keyPoints.length,
          topicsCount: parsedSummary.activeTopics.length,
        },
        'Message summary generated successfully'
      );

      return summary;
    } catch (error) {
      if (error instanceof AIProviderError) {
        this.logger.error(
          { error: error.toJSON() },
          'AI provider error during summarization'
        );
        throw error;
      }

      this.logger.error({ error }, 'Unexpected error during summarization');
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Build the prompt for message summarization
   */
  private buildSummaryPrompt(messages: Message[], messageBaseName: string): string {
    // Format messages for the prompt
    const formattedMessages = messages.map((msg, index) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      return `[${index + 1}] ${date} - ${msg.authorHandle || 'Unknown'}
Subject: ${msg.subject}
${msg.body.substring(0, 500)}${msg.body.length > 500 ? '...' : ''}
---`;
    }).join('\n\n');

    return `Summarize the following discussion thread from "${messageBaseName}":

${formattedMessages}

Provide a comprehensive summary that includes:
1. A brief overview (2-3 sentences)
2. Key points discussed (3-5 bullet points)
3. Active topics or themes (2-4 topics)

Format your response as follows:
SUMMARY:
[Your 2-3 sentence overview here]

KEY POINTS:
- [Point 1]
- [Point 2]
- [Point 3]

ACTIVE TOPICS:
- [Topic 1]
- [Topic 2]

Keep the summary concise and focused on the main themes and discussions.`;
  }

  /**
   * Get system prompt for summarization
   */
  private getSystemPrompt(): string {
    return `You are an expert at summarizing online discussions and message board threads.

Your role is to:
1. Identify the main themes and topics being discussed
2. Extract key points and important information
3. Provide clear, concise summaries that help users catch up quickly
4. Maintain objectivity and accuracy

Guidelines:
- Focus on substance over style
- Highlight consensus and disagreements
- Note any action items or decisions
- Keep summaries brief but informative
- Use clear, accessible language
- Avoid jargon unless it's community-specific`;
  }

  /**
   * Parse the AI-generated summary response
   */
  private parseSummaryResponse(response: string): {
    summary: string;
    keyPoints: string[];
    activeTopics: string[];
  } {
    const lines = response.split('\n').map(line => line.trim());

    let summary = '';
    const keyPoints: string[] = [];
    const activeTopics: string[] = [];

    let currentSection: 'summary' | 'keyPoints' | 'activeTopics' | null = null;

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        currentSection = 'summary';
        continue;
      } else if (line.startsWith('KEY POINTS:')) {
        currentSection = 'keyPoints';
        continue;
      } else if (line.startsWith('ACTIVE TOPICS:')) {
        currentSection = 'activeTopics';
        continue;
      }

      if (!line || line === '---') continue;

      if (currentSection === 'summary') {
        summary += (summary ? ' ' : '') + line;
      } else if (currentSection === 'keyPoints' && line.startsWith('-')) {
        keyPoints.push(line.substring(1).trim());
      } else if (currentSection === 'activeTopics' && line.startsWith('-')) {
        activeTopics.push(line.substring(1).trim());
      }
    }

    // Fallback if parsing fails
    if (!summary && !keyPoints.length && !activeTopics.length) {
      summary = response.trim();
    }

    return { summary, keyPoints, activeTopics };
  }

  /**
   * Create an empty summary for message bases with no messages
   */
  private createEmptySummary(
    messageBaseId: string,
    messageBaseName: string,
    cacheKey: string
  ): MessageSummary {
    return {
      messageBaseId,
      messageBaseName,
      messageCount: 0,
      summary: 'This message base is currently empty. Be the first to start a discussion!',
      keyPoints: [],
      activeTopics: [],
      generatedAt: new Date(),
      cacheKey,
    };
  }

  /**
   * Wrap text to fit within a specified width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Format summary with ANSI colors and framing
   */
  formatSummary(summary: MessageSummary, frameWidth: number = 80): FormattedSummary {
    // Calculate content width (frame width - borders - padding)
    const contentWidth = frameWidth - 2 - 4; // 2 for borders, 4 for padding (2 each side)
    
    // Build plain text version
    const plainLines: string[] = [];
    plainLines.push(`Message Base: ${summary.messageBaseName}`);
    plainLines.push(`Messages Analyzed: ${summary.messageCount}`);
    plainLines.push('');
    plainLines.push('SUMMARY:');
    
    // Wrap summary text
    const summaryLines = this.wrapText(summary.summary, contentWidth);
    plainLines.push(...summaryLines);

    if (summary.keyPoints.length > 0) {
      plainLines.push('');
      plainLines.push('KEY POINTS:');
      summary.keyPoints.forEach(point => {
        const wrappedPoint = this.wrapText(`• ${point}`, contentWidth);
        plainLines.push(...wrappedPoint);
      });
    }

    if (summary.activeTopics.length > 0) {
      plainLines.push('');
      plainLines.push('ACTIVE TOPICS:');
      summary.activeTopics.forEach(topic => {
        const wrappedTopic = this.wrapText(`• ${topic}`, contentWidth);
        plainLines.push(...wrappedTopic);
      });
    }

    plainLines.push('');
    plainLines.push(`Generated: ${summary.generatedAt.toLocaleString()}`);

    const plain = plainLines.join('\n');

    // Build colored version
    const coloredLines: string[] = [];
    coloredLines.push(ANSIColorizer.colorize(`Message Base: ${summary.messageBaseName}`, 'cyan'));
    coloredLines.push(ANSIColorizer.colorize(`Messages Analyzed: ${summary.messageCount}`, 'white'));
    coloredLines.push('');
    coloredLines.push(ANSIColorizer.colorize('SUMMARY:', 'yellow'));
    
    // Wrap and colorize summary text
    summaryLines.forEach(line => {
      coloredLines.push(ANSIColorizer.colorize(line, 'white'));
    });

    if (summary.keyPoints.length > 0) {
      coloredLines.push('');
      coloredLines.push(ANSIColorizer.colorize('KEY POINTS:', 'yellow'));
      summary.keyPoints.forEach(point => {
        const wrappedPoint = this.wrapText(`• ${point}`, contentWidth);
        wrappedPoint.forEach(line => {
          coloredLines.push(ANSIColorizer.colorize(line, 'green'));
        });
      });
    }

    if (summary.activeTopics.length > 0) {
      coloredLines.push('');
      coloredLines.push(ANSIColorizer.colorize('ACTIVE TOPICS:', 'yellow'));
      summary.activeTopics.forEach(topic => {
        const wrappedTopic = this.wrapText(`• ${topic}`, contentWidth);
        wrappedTopic.forEach(line => {
          coloredLines.push(ANSIColorizer.colorize(line, 'magenta'));
        });
      });
    }

    coloredLines.push('');
    coloredLines.push(ANSIColorizer.colorize(`Generated: ${summary.generatedAt.toLocaleString()}`, 'white'));

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
      'Thread Summary',
      frameLines,
      '\x1b[33m' // Yellow for title
    );

    const framed = framedLines.join('\n');

    return { plain, colored, framed };
  }

  /**
   * Generate cache key for a message base
   */
  private generateCacheKey(messageBaseId: string, messageCount: number): string {
    return `${messageBaseId}:${messageCount}`;
  }

  /**
   * Get cached summary if available and not expired
   */
  getCachedSummary(cacheKey: string): MessageSummary | null {
    const cached = this.summaryCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.summaryCache.delete(cacheKey);
      return null;
    }

    return cached.summary;
  }

  /**
   * Cache a summary
   */
  private cacheSummary(cacheKey: string, summary: MessageSummary): void {
    const expiresAt = Date.now() + this.CACHE_EXPIRATION_MS;
    this.summaryCache.set(cacheKey, { summary, expiresAt });

    this.logger.debug(
      { cacheKey, expiresAt: new Date(expiresAt) },
      'Summary cached'
    );
  }

  /**
   * Invalidate cache for a message base
   */
  invalidateCache(messageBaseId: string): void {
    // Remove all cache entries for this message base
    const keysToDelete: string[] = [];
    
    for (const [key] of this.summaryCache) {
      if (key.startsWith(`${messageBaseId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.summaryCache.delete(key));

    this.logger.info(
      { messageBaseId, invalidatedCount: keysToDelete.length },
      'Cache invalidated for message base'
    );
  }

  /**
   * Clear all cached summaries
   */
  clearCache(): void {
    const size = this.summaryCache.size;
    this.summaryCache.clear();
    
    this.logger.info(
      { clearedCount: size },
      'All summary cache cleared'
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ cacheKey: string; expiresAt: Date }>;
  } {
    const entries = Array.from(this.summaryCache.entries()).map(([cacheKey, data]) => ({
      cacheKey,
      expiresAt: new Date(data.expiresAt),
    }));

    return {
      size: this.summaryCache.size,
      entries,
    };
  }
}
