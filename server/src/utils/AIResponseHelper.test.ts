/**
 * AI Response Helper Tests
 * 
 * Tests for AI response rendering with loading indicators and error handling
 */

import { describe, it, expect, vi } from 'vitest';
import { AIResponseHelper } from './AIResponseHelper.js';
import { WebTerminalRenderer } from '../terminal/WebTerminalRenderer.js';
import type { AISysOp } from '../ai/AISysOp.js';

describe('AIResponseHelper', () => {
  const renderer = new WebTerminalRenderer();

  describe('renderAIResponse', () => {
    it('should render AI response without loading indicator', async () => {
      const mockAISysOp = {
        generateWelcome: vi.fn().mockResolvedValue('Welcome to the BBS!'),
      } as unknown as AISysOp;

      const output = await AIResponseHelper.renderAIResponse(
        mockAISysOp,
        () => mockAISysOp.generateWelcome('testuser'),
        renderer,
        'Fallback message'
      );

      expect(output).toContain('Welcome to the BBS!');
      expect(mockAISysOp.generateWelcome).toHaveBeenCalledWith('testuser');
    });

    it('should render AI response with loading indicator', async () => {
      const mockAISysOp = {
        generateWelcome: vi.fn().mockResolvedValue('Welcome!'),
      } as unknown as AISysOp;

      const output = await AIResponseHelper.renderAIResponse(
        mockAISysOp,
        () => mockAISysOp.generateWelcome('testuser'),
        renderer,
        'Fallback message',
        true,
        'Generating welcome message...'
      );

      expect(output).toContain('Generating welcome message...');
      expect(output).toContain('Welcome!');
      expect(output).toContain('⏳');
    });

    it('should render fallback when AI is unavailable', async () => {
      const output = await AIResponseHelper.renderAIResponse(
        undefined,
        () => Promise.resolve('Should not be called'),
        renderer,
        'AI is not available'
      );

      expect(output).toContain('AI is not available');
    });

    it('should render fallback on error', async () => {
      const mockAISysOp = {
        generateWelcome: vi.fn().mockRejectedValue(new Error('AI error')),
      } as unknown as AISysOp;

      const output = await AIResponseHelper.renderAIResponse(
        mockAISysOp,
        () => mockAISysOp.generateWelcome('testuser'),
        renderer,
        'Fallback message'
      );

      expect(output).toContain('Fallback message');
    });
  });

  describe('renderAIResponseWithTimeout', () => {
    it('should render AI response within timeout', async () => {
      const mockAISysOp = {
        respondToPage: vi.fn().mockResolvedValue('Here to help!'),
      } as unknown as AISysOp;

      const output = await AIResponseHelper.renderAIResponseWithTimeout(
        mockAISysOp,
        () => mockAISysOp.respondToPage('user', 'help'),
        renderer,
        'Fallback message',
        5000,
        true,
        'The SysOp is responding...'
      );

      expect(output).toContain('The SysOp is responding...');
      expect(output).toContain('Here to help!');
    });

    it('should timeout and show warning message', async () => {
      const mockAISysOp = {
        respondToPage: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve('Too late'), 100))
        ),
      } as unknown as AISysOp;

      const output = await AIResponseHelper.renderAIResponseWithTimeout(
        mockAISysOp,
        () => mockAISysOp.respondToPage('user', 'help'),
        renderer,
        'Fallback message',
        10, // Very short timeout
        true,
        'Waiting...'
      );

      expect(output).toContain('taking longer than expected');
    });

    it('should render fallback when AI is unavailable', async () => {
      const output = await AIResponseHelper.renderAIResponseWithTimeout(
        undefined,
        () => Promise.resolve('Should not be called'),
        renderer,
        'AI is not available',
        5000
      );

      expect(output).toContain('AI is not available');
    });

    it('should handle non-timeout errors', async () => {
      const mockAISysOp = {
        respondToPage: vi.fn().mockRejectedValue(new Error('Network error')),
      } as unknown as AISysOp;

      const output = await AIResponseHelper.renderAIResponseWithTimeout(
        mockAISysOp,
        () => mockAISysOp.respondToPage('user', 'help'),
        renderer,
        'Fallback message',
        5000
      );

      expect(output).toContain('Fallback message');
    });
  });
});
