/**
 * Conversation Starter Service
 * 
 * Analyzes message base activity and generates AI-powered discussion prompts
 * to encourage engagement and spark conversations.
 */

import { AIProvider, AIOptions, AIProviderError } from '../ai/AIProvider.js';
import { ANSIColorizer } from '../ansi/ANSIColorizer.js';
import { ANSIFrameBuilder, FrameLine } from '../ansi/ANSIFrameBuilder.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';
import type { FastifyBaseLogger } from 'fastify';

export interface ActivityAnalysis {
  messageBaseId: string;
  messageBaseName: string;
  recentMessages: Message[];
  messageCount: number;
  uniqueAuthors: number;
  averageMessageLength: number;
  lastActivityDate?: Date;
  hoursSinceLastActivity: number;
  trendingTopics: string[];
  engagementLevel: 'high' | 'medium' | 'low' | 'none';
  conversationLull: boolean;
}

export interface GeneratedQuestion {
  id: string;
  messageBaseId: string;
  messageBaseName: string;
  question: string;
  context: string;
  style: 'open-ended' | 'opinion' | 'creative' | 'technical' | 'fun';
  generatedAt: Date;
  postedAt?: Date;
  postedBy?: string;
  engagementMetrics?: {
    views: number;
    replies: number;
    uniqueRepliers: number;
  };
}

export interface QuestionGenerationOptions {
  messageBaseId: string;
  messageBaseName: string;
  recentMessages: Message[];
  style?: 'open-ended' | 'opinion' | 'creative' | 'technical' | 'fun' | 'auto';
  maxTokens?: number;
}

export interface FormattedQuestion {
  plain: string;
  colored: string;
  framed: string;
}

export class ConversationStarter {
  private readonly DEFAULT_MAX_TOKENS = 500;
  private readonly LULL_THRESHOLD_HOURS = 24;
  private readonly LOW_ENGAGEMENT_THRESHOLD = 3; // messages per day

  constructor(
    private provider: AIProvider,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Analyze activity in a message base
   */
  analyzeActivity(
    messageBase: MessageBase,
    recentMessages: Message[],
    timeWindowHours: number = 72
  ): ActivityAnalysis {
    this.logger.info(
      { messageBaseId: messageBase.id, messageCount: recentMessages.length },
      'Analyzing message base activity'
    );

    // Calculate time since last activity
    const lastActivityDate = recentMessages.length > 0
      ? new Date(Math.max(...recentMessages.map(m => m.createdAt.getTime())))
      : undefined;

    const hoursSinceLastActivity = lastActivityDate
      ? (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Count unique authors
    const uniqueAuthors = new Set(
      recentMessages.map(m => m.userId)
    ).size;

    // Calculate average message length
    const averageMessageLength = recentMessages.length > 0
      ? recentMessages.reduce((sum, m) => sum + m.body.length, 0) / recentMessages.length
      : 0;

    // Extract trending topics from subjects
    const trendingTopics = this.extractTrendingTopics(recentMessages);

    // Determine engagement level
    const messagesPerDay = recentMessages.length / (timeWindowHours / 24);
    let engagementLevel: 'high' | 'medium' | 'low' | 'none';
    
    if (recentMessages.length === 0) {
      engagementLevel = 'none';
    } else if (messagesPerDay >= 10) {
      engagementLevel = 'high';
    } else if (messagesPerDay >= this.LOW_ENGAGEMENT_THRESHOLD) {
      engagementLevel = 'medium';
    } else {
      engagementLevel = 'low';
    }

    // Detect conversation lull
    const conversationLull = hoursSinceLastActivity >= this.LULL_THRESHOLD_HOURS;

    const analysis: ActivityAnalysis = {
      messageBaseId: messageBase.id,
      messageBaseName: messageBase.name,
      recentMessages,
      messageCount: recentMessages.length,
      uniqueAuthors,
      averageMessageLength,
      lastActivityDate,
      hoursSinceLastActivity,
      trendingTopics,
      engagementLevel,
      conversationLull,
    };

    this.logger.info(
      {
        messageBaseId: messageBase.id,
        engagementLevel,
        conversationLull,
        hoursSinceLastActivity: Math.round(hoursSinceLastActivity),
      },
      'Activity analysis complete'
    );

    return analysis;
  }

  /**
   * Extract trending topics from message subjects
   */
  private extractTrendingTopics(messages: Message[]): string[] {
    if (messages.length === 0) return [];

    // Extract keywords from subjects (simple word frequency)
    const wordCounts = new Map<string, number>();
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      're', 'what', 'how', 'why', 'when', 'where', 'who',
    ]);

    messages.forEach(msg => {
      const words = msg.subject
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
    });

    // Sort by frequency and return top topics
    const sortedTopics = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return sortedTopics;
  }

  /**
   * Generate a contextual discussion question
   */
  async generateQuestion(
    options: QuestionGenerationOptions
  ): Promise<GeneratedQuestion> {
    const {
      messageBaseId,
      messageBaseName,
      recentMessages,
      style = 'auto',
      maxTokens = this.DEFAULT_MAX_TOKENS,
    } = options;

    this.logger.info(
      { messageBaseId, messageBaseName, style },
      'Generating conversation starter'
    );

    try {
      // Analyze activity first
      const analysis = this.analyzeActivity(
        { id: messageBaseId, name: messageBaseName } as MessageBase,
        recentMessages
      );

      // Determine question style if auto
      const questionStyle = style === 'auto'
        ? this.determineQuestionStyle(analysis)
        : style;

      // Build prompt
      const prompt = this.buildQuestionPrompt(analysis, questionStyle);
      const systemPrompt = this.getSystemPrompt(questionStyle);

      const aiOptions: AIOptions = {
        maxTokens,
        temperature: 0.8, // Higher temperature for creative questions
        systemPrompt,
      };

      const questionText = await this.provider.generateCompletion(prompt, aiOptions);

      // Clean up the question
      const cleanedQuestion = this.cleanQuestion(questionText);

      // Generate context explanation
      const context = this.generateContext(analysis, questionStyle);

      const question: GeneratedQuestion = {
        id: this.generateQuestionId(),
        messageBaseId,
        messageBaseName,
        question: cleanedQuestion,
        context,
        style: questionStyle,
        generatedAt: new Date(),
      };

      this.logger.info(
        {
          messageBaseId,
          questionStyle,
          questionLength: cleanedQuestion.length,
        },
        'Conversation starter generated successfully'
      );

      return question;
    } catch (error) {
      if (error instanceof AIProviderError) {
        this.logger.error(
          { error: error.toJSON() },
          'AI provider error during question generation'
        );
        throw error;
      }

      this.logger.error({ error }, 'Unexpected error during question generation');
      throw new Error('Failed to generate conversation starter');
    }
  }

  /**
   * Determine appropriate question style based on activity analysis
   */
  private determineQuestionStyle(
    analysis: ActivityAnalysis
  ): 'open-ended' | 'opinion' | 'creative' | 'technical' | 'fun' {
    // If there's a conversation lull, use engaging styles
    if (analysis.conversationLull) {
      return Math.random() > 0.5 ? 'fun' : 'creative';
    }

    // If engagement is low, use accessible styles
    if (analysis.engagementLevel === 'low') {
      return 'open-ended';
    }

    // If there are trending topics, ask opinions
    if (analysis.trendingTopics.length > 0) {
      return 'opinion';
    }

    // Default to open-ended
    return 'open-ended';
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionPrompt(
    analysis: ActivityAnalysis,
    style: string
  ): string {
    const activitySummary = this.buildActivitySummary(analysis);

    const styleGuidance: Record<string, string> = {
      'open-ended': 'Ask an open-ended question that invites diverse perspectives and experiences.',
      'opinion': 'Ask for opinions on a relevant topic, encouraging debate and discussion.',
      'creative': 'Ask a creative or imaginative question that sparks fun and interesting responses.',
      'technical': 'Ask a technical or practical question that invites knowledge sharing.',
      'fun': 'Ask a fun, lighthearted question that brings joy and entertainment.',
    };

    return `Generate a discussion question for the "${analysis.messageBaseName}" message base.

${activitySummary}

Style: ${styleGuidance[style]}

Requirements:
- Make it relevant to the community's interests
- Keep it concise (1-2 sentences)
- Make it engaging and thought-provoking
- Avoid yes/no questions
- Don't reference the activity analysis directly
- Just provide the question itself, no preamble or explanation

Generate the question now:`;
  }

  /**
   * Build activity summary for prompt
   */
  private buildActivitySummary(analysis: ActivityAnalysis): string {
    const parts: string[] = [];

    parts.push(`Recent activity: ${analysis.messageCount} messages in the last 72 hours`);
    parts.push(`Engagement level: ${analysis.engagementLevel}`);
    parts.push(`Unique participants: ${analysis.uniqueAuthors}`);

    if (analysis.conversationLull) {
      parts.push(`Note: There's been a lull in conversation (${Math.round(analysis.hoursSinceLastActivity)} hours since last message)`);
    }

    if (analysis.trendingTopics.length > 0) {
      parts.push(`Trending topics: ${analysis.trendingTopics.join(', ')}`);
    }

    if (analysis.recentMessages.length > 0) {
      parts.push('\nRecent discussion themes:');
      const recentSubjects = analysis.recentMessages
        .slice(0, 5)
        .map(m => `- ${m.subject}`)
        .join('\n');
      parts.push(recentSubjects);
    }

    return parts.join('\n');
  }

  /**
   * Get system prompt for question generation
   */
  private getSystemPrompt(style: string): string {
    const basePrompt = `You are an expert community manager for a vintage BBS (Bulletin Board System).

Your role is to generate engaging discussion questions that:
1. Spark interesting conversations
2. Encourage community participation
3. Build on existing interests and topics
4. Create a welcoming, inclusive atmosphere
5. Match the nostalgic, friendly vibe of classic BBSs

Guidelines:
- Be warm and conversational
- Avoid corporate or formal language
- Think like a friendly SysOp who knows their community
- Make questions accessible to all skill levels
- Encourage storytelling and personal experiences`;

    const styleGuidance: Record<string, string> = {
      'open-ended': `
Style: Open-Ended Questions
- Ask "what", "how", or "why" questions
- Invite personal experiences and stories
- Allow for diverse perspectives
- Example: "What's your favorite memory of the early internet?"`,

      'opinion': `
Style: Opinion Questions
- Ask for viewpoints on relevant topics
- Encourage respectful debate
- Present interesting dilemmas or choices
- Example: "Which was better: BBSs or early web forums?"`,

      'creative': `
Style: Creative Questions
- Spark imagination and creativity
- Encourage fun, playful responses
- Think outside the box
- Example: "If you could design your dream BBS door game, what would it be?"`,

      'technical': `
Style: Technical Questions
- Ask about skills, knowledge, or experiences
- Encourage knowledge sharing
- Make it accessible to beginners too
- Example: "What's the most interesting thing you've learned about ANSI art?"`,

      'fun': `
Style: Fun Questions
- Keep it lighthearted and entertaining
- Encourage humor and joy
- Build community through shared fun
- Example: "What's the most ridiculous username you've ever seen on a BBS?"`,
    };

    return `${basePrompt}\n${styleGuidance[style] || styleGuidance['open-ended']}`;
  }

  /**
   * Clean generated question text
   */
  private cleanQuestion(questionText: string): string {
    // Remove any preamble or explanation
    let cleaned = questionText.trim();

    // Remove common prefixes
    const prefixes = [
      'Question:',
      'Here\'s a question:',
      'How about:',
      'Try this:',
      'Consider:',
    ];

    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length).trim();
      }
    }

    // Remove quotes if the entire question is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1).trim();
    }

    // Ensure it ends with a question mark
    if (!cleaned.endsWith('?')) {
      cleaned += '?';
    }

    return cleaned;
  }

  /**
   * Generate context explanation for the question
   */
  private generateContext(
    analysis: ActivityAnalysis,
    style: string
  ): string {
    const parts: string[] = [];

    if (analysis.conversationLull) {
      parts.push('Generated to revive conversation after a quiet period');
    } else if (analysis.engagementLevel === 'low') {
      parts.push('Generated to encourage more participation');
    } else if (analysis.trendingTopics.length > 0) {
      parts.push(`Based on trending topics: ${analysis.trendingTopics.slice(0, 3).join(', ')}`);
    } else {
      parts.push('Generated to spark new discussions');
    }

    parts.push(`Style: ${style}`);

    return parts.join('. ');
  }

  /**
   * Generate unique question ID
   */
  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Format question with ANSI colors and framing
   */
  formatQuestion(
    question: GeneratedQuestion,
    frameWidth: number = 80
  ): FormattedQuestion {
    // Build plain text version
    const plainLines: string[] = [];
    plainLines.push('═══ QUESTION OF THE DAY ═══');
    plainLines.push('');
    plainLines.push(question.question);
    plainLines.push('');
    plainLines.push(`Posted by: AI SysOp`);
    plainLines.push(`Style: ${question.style}`);
    plainLines.push(`Generated: ${question.generatedAt.toLocaleString()}`);

    if (question.engagementMetrics) {
      plainLines.push('');
      plainLines.push(`Replies: ${question.engagementMetrics.replies} | Views: ${question.engagementMetrics.views}`);
    }

    const plain = plainLines.join('\n');

    // Build colored version
    const coloredLines: string[] = [];
    coloredLines.push(ANSIColorizer.colorize('═══ QUESTION OF THE DAY ═══', 'yellow'));
    coloredLines.push('');
    coloredLines.push(ANSIColorizer.colorize(question.question, 'cyan'));
    coloredLines.push('');
    coloredLines.push(ANSIColorizer.colorize('Posted by: AI SysOp', 'magenta'));
    coloredLines.push(ANSIColorizer.colorize(`Style: ${question.style}`, 'white'));
    coloredLines.push(ANSIColorizer.colorize(`Generated: ${question.generatedAt.toLocaleString()}`, 'white'));

    if (question.engagementMetrics) {
      coloredLines.push('');
      coloredLines.push(
        ANSIColorizer.colorize(
          `Replies: ${question.engagementMetrics.replies} | Views: ${question.engagementMetrics.views}`,
          'green'
        )
      );
    }

    const colored = coloredLines.join('\n');

    // Build framed version
    const frameLines: FrameLine[] = [];

    // Add colored content to frame
    coloredLines.forEach(line => {
      frameLines.push({ text: line, align: 'center' });
    });

    const frameBuilder = new ANSIFrameBuilder({
      width: frameWidth,
      padding: 2,
      style: 'double',
      align: 'center',
    });

    const framedLines = frameBuilder.buildWithTitle(
      'Question of the Day',
      frameLines,
      '\x1b[33m' // Yellow for title
    );

    const framed = framedLines.join('\n');

    return { plain, colored, framed };
  }

  /**
   * Get available question styles
   */
  static getAvailableStyles(): Array<'open-ended' | 'opinion' | 'creative' | 'technical' | 'fun'> {
    return ['open-ended', 'opinion', 'creative', 'technical', 'fun'];
  }

  /**
   * Get style description for display
   */
  static getStyleDescription(
    style: 'open-ended' | 'opinion' | 'creative' | 'technical' | 'fun'
  ): string {
    const descriptions = {
      'open-ended': 'Open-ended questions that invite diverse perspectives',
      'opinion': 'Opinion questions that encourage debate and discussion',
      'creative': 'Creative questions that spark imagination',
      'technical': 'Technical questions that invite knowledge sharing',
      'fun': 'Fun, lighthearted questions for entertainment',
    };
    return descriptions[style];
  }
}
