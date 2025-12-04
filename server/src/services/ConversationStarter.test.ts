/**
 * ConversationStarter Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationStarter } from './ConversationStarter.js';
import type { AIProvider } from '../ai/AIProvider.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';
import type { FastifyBaseLogger } from 'fastify';

// Mock AI Provider
const createMockAIProvider = (): AIProvider => ({
  generateCompletion: vi.fn().mockResolvedValue('What is your favorite programming language and why?'),
  generateStructured: vi.fn(),
});

// Mock Logger
const createMockLogger = (): FastifyBaseLogger =>
  ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }) as any;

// Helper to create mock messages
const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: `msg_${Math.random()}`,
  baseId: 'base_1',
  userId: `user_${Math.random()}`,
  subject: 'Test Subject',
  body: 'Test message body',
  createdAt: new Date(),
  isDeleted: false,
  authorHandle: 'testuser',
  ...overrides,
});

// Helper to create mock message base
const createMockMessageBase = (overrides: Partial<MessageBase> = {}): MessageBase => ({
  id: 'base_1',
  name: 'General Discussion',
  description: 'General discussion area',
  accessLevelRead: 0,
  accessLevelWrite: 10,
  postCount: 0,
  sortOrder: 0,
  ...overrides,
});

describe('ConversationStarter', () => {
  let conversationStarter: ConversationStarter;
  let mockAIProvider: AIProvider;
  let mockLogger: FastifyBaseLogger;

  beforeEach(() => {
    mockAIProvider = createMockAIProvider();
    mockLogger = createMockLogger();
    conversationStarter = new ConversationStarter(mockAIProvider, mockLogger);
  });

  describe('analyzeActivity', () => {
    it('should analyze activity with no messages', () => {
      const messageBase = createMockMessageBase();
      const messages: Message[] = [];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 72);

      expect(analysis.messageCount).toBe(0);
      expect(analysis.uniqueAuthors).toBe(0);
      expect(analysis.engagementLevel).toBe('none');
      expect(analysis.conversationLull).toBe(true);
      expect(analysis.trendingTopics).toEqual([]);
    });

    it('should analyze activity with recent messages', () => {
      const messageBase = createMockMessageBase();
      const now = new Date();
      const messages: Message[] = [
        createMockMessage({
          userId: 'user1',
          subject: 'Hello World',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
        }),
        createMockMessage({
          userId: 'user2',
          subject: 'World Peace',
          createdAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 min ago
        }),
        createMockMessage({
          userId: 'user1',
          subject: 'Hello Again',
          createdAt: new Date(now.getTime() - 1000 * 60 * 10), // 10 min ago
        }),
      ];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 72);

      expect(analysis.messageCount).toBe(3);
      expect(analysis.uniqueAuthors).toBe(2);
      expect(analysis.conversationLull).toBe(false);
      expect(analysis.hoursSinceLastActivity).toBeLessThan(1);
      expect(analysis.trendingTopics).toContain('world');
      expect(analysis.trendingTopics).toContain('hello');
    });

    it('should detect high engagement', () => {
      const messageBase = createMockMessageBase();
      const now = new Date();
      
      // Create 30 messages over 24 hours (> 10 per day)
      const messages: Message[] = Array.from({ length: 30 }, (_, i) =>
        createMockMessage({
          userId: `user${i % 5}`,
          createdAt: new Date(now.getTime() - i * 1000 * 60 * 60), // Spread over hours
        })
      );

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 24);

      expect(analysis.engagementLevel).toBe('high');
    });

    it('should detect medium engagement', () => {
      const messageBase = createMockMessageBase();
      const now = new Date();
      
      // Create 5 messages over 24 hours (3-10 per day)
      const messages: Message[] = Array.from({ length: 5 }, (_, i) =>
        createMockMessage({
          userId: `user${i}`,
          createdAt: new Date(now.getTime() - i * 1000 * 60 * 60 * 4), // Spread over hours
        })
      );

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 24);

      expect(analysis.engagementLevel).toBe('medium');
    });

    it('should detect low engagement', () => {
      const messageBase = createMockMessageBase();
      const now = new Date();
      
      // Create 2 messages over 24 hours (< 3 per day)
      const messages: Message[] = [
        createMockMessage({ createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12) }),
        createMockMessage({ createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6) }),
      ];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 24);

      expect(analysis.engagementLevel).toBe('low');
    });

    it('should detect conversation lull', () => {
      const messageBase = createMockMessageBase();
      const now = new Date();
      
      // Last message was 25 hours ago
      const messages: Message[] = [
        createMockMessage({
          createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        }),
      ];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 72);

      expect(analysis.conversationLull).toBe(true);
      expect(analysis.hoursSinceLastActivity).toBeGreaterThan(24);
    });

    it('should extract trending topics from subjects', () => {
      const messageBase = createMockMessageBase();
      const messages: Message[] = [
        createMockMessage({ subject: 'Programming in Python' }),
        createMockMessage({ subject: 'Python vs JavaScript' }),
        createMockMessage({ subject: 'Learning Python' }),
        createMockMessage({ subject: 'JavaScript frameworks' }),
      ];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 72);

      expect(analysis.trendingTopics).toContain('python');
      expect(analysis.trendingTopics).toContain('javascript');
    });

    it('should filter stop words from trending topics', () => {
      const messageBase = createMockMessageBase();
      const messages: Message[] = [
        createMockMessage({ subject: 'The best programming language' }),
        createMockMessage({ subject: 'What is the best framework' }),
      ];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 72);

      // Stop words like 'the', 'is', 'what' should be filtered
      expect(analysis.trendingTopics).not.toContain('the');
      expect(analysis.trendingTopics).not.toContain('what');
      expect(analysis.trendingTopics).toContain('programming');
    });

    it('should calculate average message length', () => {
      const messageBase = createMockMessageBase();
      const messages: Message[] = [
        createMockMessage({ body: 'Short' }), // 5 chars
        createMockMessage({ body: 'Medium length message' }), // 21 chars
        createMockMessage({ body: 'A' }), // 1 char
      ];

      const analysis = conversationStarter.analyzeActivity(messageBase, messages, 72);

      expect(analysis.averageMessageLength).toBe(9); // (5 + 21 + 1) / 3
    });
  });

  describe('generateQuestion', () => {
    it('should generate a question with auto style', async () => {
      const messages: Message[] = [
        createMockMessage({ subject: 'Programming' }),
      ];

      const question = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: messages,
        style: 'auto',
      });

      expect(question.question).toBeTruthy();
      expect(question.messageBaseId).toBe('base_1');
      expect(question.messageBaseName).toBe('General Discussion');
      expect(question.style).toBeTruthy();
      expect(question.generatedAt).toBeInstanceOf(Date);
      expect(mockAIProvider.generateCompletion).toHaveBeenCalled();
    });

    it('should generate a question with specific style', async () => {
      const messages: Message[] = [];

      const question = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: messages,
        style: 'fun',
      });

      expect(question.style).toBe('fun');
    });

    it('should clean question text', async () => {
      // Mock AI to return question with prefix
      vi.mocked(mockAIProvider.generateCompletion).mockResolvedValue(
        'Question: What is your favorite color'
      );

      const question = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: [],
        style: 'open-ended',
      });

      // Should remove "Question:" prefix and add question mark
      expect(question.question).toBe('What is your favorite color?');
    });

    it('should add question mark if missing', async () => {
      vi.mocked(mockAIProvider.generateCompletion).mockResolvedValue(
        'What is your favorite color'
      );

      const question = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: [],
        style: 'open-ended',
      });

      expect(question.question.endsWith('?')).toBe(true);
    });

    it('should remove quotes from question', async () => {
      vi.mocked(mockAIProvider.generateCompletion).mockResolvedValue(
        '"What is your favorite color?"'
      );

      const question = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: [],
        style: 'open-ended',
      });

      expect(question.question).toBe('What is your favorite color?');
    });

    it('should generate context based on activity', async () => {
      const now = new Date();
      const messages: Message[] = [
        createMockMessage({
          createdAt: new Date(now.getTime() - 30 * 60 * 60 * 1000), // 30 hours ago
        }),
      ];

      const question = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: messages,
        style: 'auto',
      });

      expect(question.context).toContain('quiet period');
    });

    it('should generate unique question IDs', async () => {
      const question1 = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: [],
        style: 'fun',
      });

      const question2 = await conversationStarter.generateQuestion({
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        recentMessages: [],
        style: 'fun',
      });

      expect(question1.id).not.toBe(question2.id);
    });
  });

  describe('formatQuestion', () => {
    it('should format question with plain text', () => {
      const question = {
        id: 'q_123',
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        question: 'What is your favorite programming language?',
        context: 'Generated to spark new discussions',
        style: 'open-ended' as const,
        generatedAt: new Date('2025-01-01T12:00:00Z'),
      };

      const formatted = conversationStarter.formatQuestion(question);

      expect(formatted.plain).toContain('QUESTION OF THE DAY');
      expect(formatted.plain).toContain(question.question);
      expect(formatted.plain).toContain('AI SysOp');
      expect(formatted.plain).toContain('open-ended');
    });

    it('should format question with ANSI colors', () => {
      const question = {
        id: 'q_123',
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        question: 'What is your favorite programming language?',
        context: 'Generated to spark new discussions',
        style: 'open-ended' as const,
        generatedAt: new Date('2025-01-01T12:00:00Z'),
      };

      const formatted = conversationStarter.formatQuestion(question);

      // Should contain ANSI color codes
      expect(formatted.colored).toContain('\x1b[');
      expect(formatted.colored).toContain(question.question);
    });

    it('should format question with frame', () => {
      const question = {
        id: 'q_123',
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        question: 'What is your favorite programming language?',
        context: 'Generated to spark new discussions',
        style: 'open-ended' as const,
        generatedAt: new Date('2025-01-01T12:00:00Z'),
      };

      const formatted = conversationStarter.formatQuestion(question);

      // Should contain frame borders
      expect(formatted.framed).toContain('╔');
      expect(formatted.framed).toContain('╗');
      expect(formatted.framed).toContain('╚');
      expect(formatted.framed).toContain('╝');
      expect(formatted.framed).toContain('Question of the Day');
    });

    it('should include engagement metrics if available', () => {
      const question = {
        id: 'q_123',
        messageBaseId: 'base_1',
        messageBaseName: 'General Discussion',
        question: 'What is your favorite programming language?',
        context: 'Generated to spark new discussions',
        style: 'open-ended' as const,
        generatedAt: new Date('2025-01-01T12:00:00Z'),
        engagementMetrics: {
          views: 42,
          replies: 7,
          uniqueRepliers: 5,
        },
      };

      const formatted = conversationStarter.formatQuestion(question);

      expect(formatted.plain).toContain('Replies: 7');
      expect(formatted.plain).toContain('Views: 42');
    });
  });

  describe('static methods', () => {
    it('should return available styles', () => {
      const styles = ConversationStarter.getAvailableStyles();

      expect(styles).toContain('open-ended');
      expect(styles).toContain('opinion');
      expect(styles).toContain('creative');
      expect(styles).toContain('technical');
      expect(styles).toContain('fun');
      expect(styles).toHaveLength(5);
    });

    it('should return style descriptions', () => {
      const description = ConversationStarter.getStyleDescription('open-ended');

      expect(description).toBeTruthy();
      expect(description).toContain('Open-ended');
    });

    it('should return descriptions for all styles', () => {
      const styles = ConversationStarter.getAvailableStyles();

      styles.forEach(style => {
        const description = ConversationStarter.getStyleDescription(style);
        expect(description).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('should handle AI provider errors', async () => {
      const error = new Error('AI service unavailable');
      vi.mocked(mockAIProvider.generateCompletion).mockRejectedValue(error);

      await expect(
        conversationStarter.generateQuestion({
          messageBaseId: 'base_1',
          messageBaseName: 'General Discussion',
          recentMessages: [],
          style: 'fun',
        })
      ).rejects.toThrow('Failed to generate conversation starter');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
