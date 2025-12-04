/**
 * Tests for DailyDigestService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyDigestService } from './DailyDigestService.js';
import type { AIProvider } from '../ai/AIProvider.js';
import type { FastifyBaseLogger } from 'fastify';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';

describe('DailyDigestService', () => {
  let service: DailyDigestService;
  let mockProvider: AIProvider;
  let mockLogger: FastifyBaseLogger;

  beforeEach(() => {
    mockProvider = {
      generateCompletion: vi.fn(),
    } as any;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as any;

    service = new DailyDigestService(mockProvider, mockLogger);
  });

  describe('shouldGenerateDigest', () => {
    it('should return false for first-time users (no lastLogin)', () => {
      expect(service.shouldGenerateDigest(undefined)).toBe(false);
    });

    it('should return false if user logged in less than 24 hours ago', () => {
      const recentLogin = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
      expect(service.shouldGenerateDigest(recentLogin)).toBe(false);
    });

    it('should return true if user logged in more than 24 hours ago', () => {
      const oldLogin = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      expect(service.shouldGenerateDigest(oldLogin)).toBe(true);
    });

    it('should return true if user logged in exactly 24 hours ago', () => {
      const exactLogin = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      expect(service.shouldGenerateDigest(exactLogin)).toBe(true);
    });
  });

  describe('generateDigest', () => {
    it('should generate empty digest when no new messages', async () => {
      const lastLogin = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const digest = await service.generateDigest({
        userId: 'user-1',
        lastLogin,
        messageBasesWithActivity: [],
      });

      expect(digest.userId).toBe('user-1');
      expect(digest.totalNewMessages).toBe(0);
      expect(digest.messageBaseSummaries).toHaveLength(0);
      expect(digest.overallSummary).toContain('quiet');
    });

    it('should generate digest with message base summaries', async () => {
      const lastLogin = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const messageBase: MessageBase = {
        id: 'base-1',
        name: 'General Discussion',
        description: 'General chat',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        postCount: 5,
        sortOrder: 0,
      };

      const messages: Message[] = [
        {
          id: 'msg-1',
          baseId: 'base-1',
          userId: 'user-2',
          authorHandle: 'alice',
          subject: 'Hello World',
          body: 'This is a test message',
          createdAt: new Date(),
          isDeleted: false,
        },
        {
          id: 'msg-2',
          baseId: 'base-1',
          userId: 'user-3',
          authorHandle: 'bob',
          subject: 'Re: Hello World',
          body: 'This is a reply',
          createdAt: new Date(),
          isDeleted: false,
        },
      ];

      // Mock AI responses
      vi.mocked(mockProvider.generateCompletion)
        .mockResolvedValueOnce('- Alice started a discussion about testing\n- Bob replied with helpful feedback')
        .mockResolvedValueOnce('Welcome back! There has been some interesting activity in General Discussion. Check out the new conversations!');

      const digest = await service.generateDigest({
        userId: 'user-1',
        lastLogin,
        messageBasesWithActivity: [
          {
            base: messageBase,
            newMessages: messages,
          },
        ],
      });

      expect(digest.userId).toBe('user-1');
      expect(digest.totalNewMessages).toBe(2);
      expect(digest.messageBaseSummaries).toHaveLength(1);
      expect(digest.messageBaseSummaries[0].baseName).toBe('General Discussion');
      expect(digest.messageBaseSummaries[0].messageCount).toBe(2);
      expect(digest.messageBaseSummaries[0].highlights.length).toBeGreaterThan(0);
      expect(digest.overallSummary).toContain('Welcome back');
    });

    it('should handle multiple message bases', async () => {
      const lastLogin = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const base1: MessageBase = {
        id: 'base-1',
        name: 'General',
        description: 'General chat',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        postCount: 2,
        sortOrder: 0,
      };

      const base2: MessageBase = {
        id: 'base-2',
        name: 'Tech Talk',
        description: 'Technology discussions',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        postCount: 3,
        sortOrder: 1,
      };

      const messages1: Message[] = [
        {
          id: 'msg-1',
          baseId: 'base-1',
          userId: 'user-2',
          authorHandle: 'alice',
          subject: 'Test',
          body: 'Test message',
          createdAt: new Date(),
          isDeleted: false,
        },
      ];

      const messages2: Message[] = [
        {
          id: 'msg-2',
          baseId: 'base-2',
          userId: 'user-3',
          authorHandle: 'bob',
          subject: 'AI Discussion',
          body: 'Let\'s talk about AI',
          createdAt: new Date(),
          isDeleted: false,
        },
      ];

      // Mock AI responses
      vi.mocked(mockProvider.generateCompletion)
        .mockResolvedValueOnce('- Alice posted a test message')
        .mockResolvedValueOnce('- Bob started an AI discussion')
        .mockResolvedValueOnce('Welcome back! Activity in both General and Tech Talk. Lots to catch up on!');

      const digest = await service.generateDigest({
        userId: 'user-1',
        lastLogin,
        messageBasesWithActivity: [
          { base: base1, newMessages: messages1 },
          { base: base2, newMessages: messages2 },
        ],
      });

      expect(digest.totalNewMessages).toBe(2);
      expect(digest.messageBaseSummaries).toHaveLength(2);
    });
  });

  describe('formatDigest', () => {
    it('should format digest with plain text', () => {
      const digest = {
        userId: 'user-1',
        lastLogin: new Date(Date.now() - 25 * 60 * 60 * 1000),
        generatedAt: new Date(),
        totalNewMessages: 5,
        messageBaseSummaries: [
          {
            baseId: 'base-1',
            baseName: 'General',
            messageCount: 5,
            highlights: ['New discussion started', 'Active conversation'],
          },
        ],
        overallSummary: 'Welcome back! Check out the new activity.',
      };

      const formatted = service.formatDigest(digest);

      expect(formatted.plain).toContain('CATCH ME UP');
      expect(formatted.plain).toContain('5 new messages');
      expect(formatted.plain).toContain('General');
      expect(formatted.plain).toContain('New discussion started');
    });

    it('should format digest with ANSI colors', () => {
      const digest = {
        userId: 'user-1',
        lastLogin: new Date(Date.now() - 25 * 60 * 60 * 1000),
        generatedAt: new Date(),
        totalNewMessages: 3,
        messageBaseSummaries: [
          {
            baseId: 'base-1',
            baseName: 'Tech',
            messageCount: 3,
            highlights: ['AI discussion'],
          },
        ],
        overallSummary: 'Welcome back!',
      };

      const formatted = service.formatDigest(digest);

      // Check for ANSI escape codes
      expect(formatted.colored).toContain('\x1b[');
      expect(formatted.framed).toContain('\x1b[');
    });

    it('should handle empty digest', () => {
      const digest = {
        userId: 'user-1',
        lastLogin: new Date(Date.now() - 25 * 60 * 60 * 1000),
        generatedAt: new Date(),
        totalNewMessages: 0,
        messageBaseSummaries: [],
        overallSummary: 'Things have been quiet.',
      };

      const formatted = service.formatDigest(digest);

      expect(formatted.plain).toContain('0 new messages');
      expect(formatted.plain).toContain('quiet');
    });
  });
});
