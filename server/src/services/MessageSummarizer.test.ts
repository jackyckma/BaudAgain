/**
 * MessageSummarizer Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageSummarizer } from './MessageSummarizer.js';
import { AIProvider, AIProviderError } from '../ai/AIProvider.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { FastifyBaseLogger } from 'fastify';

// Mock AI Provider
class MockAIProvider implements AIProvider {
  async generateCompletion(prompt: string): Promise<string> {
    return `SUMMARY:
This is a test summary of the discussion. Users are discussing various topics related to BBS systems and retro computing.

KEY POINTS:
- Users are excited about the new features
- There's interest in AI integration
- Some concerns about performance

ACTIVE TOPICS:
- BBS Revival
- AI Features
- Performance Optimization`;
  }

  async generateStructured<T>(prompt: string, schema: any, options?: any): Promise<T> {
    throw new Error('Not implemented in mock');
  }
}

// Mock Logger
const mockLogger: FastifyBaseLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn(() => mockLogger),
  level: 'info',
  silent: vi.fn(),
} as any;

// Helper to create mock messages
function createMockMessage(
  id: string,
  subject: string,
  body: string,
  authorHandle: string = 'testuser'
): Message {
  return {
    id,
    baseId: 'base1',
    userId: 'user1',
    subject,
    body,
    authorHandle,
    createdAt: new Date(),
    isDeleted: false,
  };
}

describe('MessageSummarizer', () => {
  let summarizer: MessageSummarizer;
  let mockProvider: MockAIProvider;

  beforeEach(() => {
    mockProvider = new MockAIProvider();
    summarizer = new MessageSummarizer(mockProvider, mockLogger);
  });

  describe('summarizeMessages', () => {
    it('should generate a summary for messages', async () => {
      const messages: Message[] = [
        createMockMessage('1', 'Welcome to BBS', 'This is the first message'),
        createMockMessage('2', 'AI Features', 'The AI integration is amazing'),
        createMockMessage('3', 'Performance', 'How fast is the system?'),
      ];

      const summary = await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'General Discussion',
      });

      expect(summary.messageBaseId).toBe('base1');
      expect(summary.messageBaseName).toBe('General Discussion');
      expect(summary.messageCount).toBe(3);
      expect(summary.summary).toBeTruthy();
      expect(summary.keyPoints.length).toBeGreaterThan(0);
      expect(summary.activeTopics.length).toBeGreaterThan(0);
      expect(summary.generatedAt).toBeInstanceOf(Date);
    });

    it('should return empty summary for no messages', async () => {
      const summary = await summarizer.summarizeMessages([], {
        messageBaseId: 'base1',
        messageBaseName: 'Empty Base',
      });

      expect(summary.messageCount).toBe(0);
      expect(summary.summary).toContain('empty');
      expect(summary.keyPoints).toEqual([]);
      expect(summary.activeTopics).toEqual([]);
    });

    it('should cache summaries', async () => {
      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      // First call - should generate
      const summary1 = await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      // Second call - should use cache
      const summary2 = await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      expect(summary1.cacheKey).toBe(summary2.cacheKey);
      expect(summary1.generatedAt).toEqual(summary2.generatedAt);
    });

    it('should limit messages to maxMessages', async () => {
      const messages: Message[] = Array.from({ length: 100 }, (_, i) =>
        createMockMessage(`${i}`, `Subject ${i}`, `Body ${i}`)
      );

      const summary = await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Large Base',
        maxMessages: 10,
      });

      expect(summary.messageCount).toBe(10);
    });
  });

  describe('formatSummary', () => {
    it('should format summary with plain, colored, and framed versions', async () => {
      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      const summary = await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      const formatted = summarizer.formatSummary(summary);

      expect(formatted.plain).toBeTruthy();
      expect(formatted.colored).toBeTruthy();
      expect(formatted.framed).toBeTruthy();

      // Plain should not contain ANSI codes
      expect(formatted.plain).not.toContain('\x1b[');

      // Colored should contain ANSI codes
      expect(formatted.colored).toContain('\x1b[');

      // Framed should contain box-drawing characters
      expect(formatted.framed).toMatch(/[╔╗╚╝═║]/);
    });

    it('should include all summary sections in formatted output', async () => {
      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      const summary = await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      const formatted = summarizer.formatSummary(summary);

      expect(formatted.plain).toContain('Message Base:');
      expect(formatted.plain).toContain('Messages Analyzed:');
      expect(formatted.plain).toContain('SUMMARY:');
      expect(formatted.plain).toContain('KEY POINTS:');
      expect(formatted.plain).toContain('ACTIVE TOPICS:');
      expect(formatted.plain).toContain('Generated:');
    });
  });

  describe('cache management', () => {
    it('should invalidate cache for a message base', async () => {
      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      // Generate and cache summary
      await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      // Verify cache has entry
      let stats = summarizer.getCacheStats();
      expect(stats.size).toBe(1);

      // Invalidate cache
      summarizer.invalidateCache('base1');

      // Verify cache is empty
      stats = summarizer.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear all cache', async () => {
      const messages1: Message[] = [
        createMockMessage('1', 'Test 1', 'Test message 1'),
      ];
      const messages2: Message[] = [
        createMockMessage('2', 'Test 2', 'Test message 2'),
      ];

      // Generate summaries for different bases
      await summarizer.summarizeMessages(messages1, {
        messageBaseId: 'base1',
        messageBaseName: 'Base 1',
      });
      await summarizer.summarizeMessages(messages2, {
        messageBaseId: 'base2',
        messageBaseName: 'Base 2',
      });

      // Verify cache has entries
      let stats = summarizer.getCacheStats();
      expect(stats.size).toBe(2);

      // Clear all cache
      summarizer.clearCache();

      // Verify cache is empty
      stats = summarizer.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      await summarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      const stats = summarizer.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].cacheKey).toBeTruthy();
      expect(stats.entries[0].expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('error handling', () => {
    it('should handle AI provider errors', async () => {
      const errorProvider = new MockAIProvider();
      errorProvider.generateCompletion = vi.fn().mockRejectedValue(
        new AIProviderError('API Error', 'API_ERROR')
      );

      const errorSummarizer = new MessageSummarizer(errorProvider, mockLogger);

      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      await expect(
        errorSummarizer.summarizeMessages(messages, {
          messageBaseId: 'base1',
          messageBaseName: 'Test Base',
        })
      ).rejects.toThrow();
    });

    it('should handle malformed AI responses', async () => {
      const malformedProvider = new MockAIProvider();
      malformedProvider.generateCompletion = vi.fn().mockResolvedValue(
        'This is just plain text without proper formatting'
      );

      const malformedSummarizer = new MessageSummarizer(malformedProvider, mockLogger);

      const messages: Message[] = [
        createMockMessage('1', 'Test', 'Test message'),
      ];

      const summary = await malformedSummarizer.summarizeMessages(messages, {
        messageBaseId: 'base1',
        messageBaseName: 'Test Base',
      });

      // Should still return a summary, using the raw response as fallback
      expect(summary.summary).toBeTruthy();
    });
  });
});
