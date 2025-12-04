import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from './AIService.js';
import { AIProvider, AIProviderError } from './AIProvider.js';
import type { FastifyBaseLogger } from 'fastify';

describe('AIService', () => {
  let aiService: AIService;
  let mockProvider: AIProvider;
  let mockLogger: FastifyBaseLogger;

  beforeEach(() => {
    // Create mock provider
    mockProvider = {
      generateCompletion: vi.fn(),
      generateStructured: vi.fn(),
    } as any;

    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    aiService = new AIService(mockProvider, mockLogger, true);
  });

  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      const prompt = 'Test prompt';
      const expectedResponse = 'Test response';

      vi.mocked(mockProvider.generateCompletion).mockResolvedValue(expectedResponse);

      const result = await aiService.generateCompletion(prompt);

      expect(result).toBe(expectedResponse);
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(prompt, undefined);
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should pass options to provider', async () => {
      const prompt = 'Test prompt';
      const options = {
        maxTokens: 100,
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant',
      };

      vi.mocked(mockProvider.generateCompletion).mockResolvedValue('response');

      await aiService.generateCompletion(prompt, options);

      expect(mockProvider.generateCompletion).toHaveBeenCalledWith(prompt, options);
    });

    it('should retry on retryable errors', async () => {
      const prompt = 'Test prompt';
      const error = new AIProviderError('Timeout', 'TIMEOUT');

      vi.mocked(mockProvider.generateCompletion)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('Success after retries');

      const result = await aiService.generateCompletion(prompt);

      expect(result).toBe('Success after retries');
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should not retry on configuration errors', async () => {
      const prompt = 'Test prompt';
      const error = new AIProviderError('Invalid API key', 'INVALID_API_KEY');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      await expect(aiService.generateCompletion(prompt)).rejects.toThrow(error);

      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it('should use fallback message when enabled', async () => {
      const prompt = 'Test prompt';
      const fallbackMessage = 'Fallback response';
      const error = new AIProviderError('API Error', 'API_ERROR');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      const result = await aiService.generateCompletion(prompt, undefined, fallbackMessage);

      expect(result).toBe(fallbackMessage);
      expect(mockLogger.info).toHaveBeenCalledWith('Using fallback message for AI response');
    });

    it('should throw error when fallback is disabled', async () => {
      const aiServiceNoFallback = new AIService(mockProvider, mockLogger, false);
      const prompt = 'Test prompt';
      const error = new AIProviderError('API Error', 'API_ERROR');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      await expect(aiServiceNoFallback.generateCompletion(prompt)).rejects.toThrow(error);
    });

    it('should throw error when no fallback message provided', async () => {
      const prompt = 'Test prompt';
      const error = new AIProviderError('API Error', 'API_ERROR');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      await expect(aiService.generateCompletion(prompt)).rejects.toThrow(error);
    });

    it('should handle unknown errors', async () => {
      const prompt = 'Test prompt';
      const unknownError = new Error('Unknown error');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(unknownError);

      await expect(aiService.generateCompletion(prompt)).rejects.toThrow(AIProviderError);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should respect retry configuration', async () => {
      aiService.setRetryConfig(1, 100); // Only 1 retry

      const prompt = 'Test prompt';
      const error = new AIProviderError('Timeout', 'TIMEOUT');

      vi.mocked(mockProvider.generateCompletion)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      await expect(aiService.generateCompletion(prompt)).rejects.toThrow(error);

      // Should be called twice: initial + 1 retry
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateStructured', () => {
    it('should generate structured output successfully', async () => {
      const prompt = 'Test prompt';
      const schema = { type: 'object' };
      const expectedResponse = { result: 'test' };

      vi.mocked(mockProvider.generateStructured).mockResolvedValue(expectedResponse);

      const result = await aiService.generateStructured(prompt, schema);

      expect(result).toEqual(expectedResponse);
      expect(mockProvider.generateStructured).toHaveBeenCalledWith(prompt, schema, undefined);
    });

    it('should return null on error', async () => {
      const prompt = 'Test prompt';
      const schema = { type: 'object' };
      const error = new AIProviderError('API Error', 'API_ERROR');

      vi.mocked(mockProvider.generateStructured).mockRejectedValue(error);

      const result = await aiService.generateStructured(prompt, schema);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle unknown errors', async () => {
      const prompt = 'Test prompt';
      const schema = { type: 'object' };
      const unknownError = new Error('Unknown error');

      vi.mocked(mockProvider.generateStructured).mockRejectedValue(unknownError);

      const result = await aiService.generateStructured(prompt, schema);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when AI is available', async () => {
      vi.mocked(mockProvider.generateCompletion).mockResolvedValue('test');

      const result = await aiService.healthCheck();

      expect(result).toBe(true);
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith('test', { maxTokens: 10 });
    });

    it('should return false when AI is unavailable', async () => {
      const error = new AIProviderError('API Error', 'API_ERROR');
      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      const result = await aiService.healthCheck();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getFallbackMessage', () => {
    it('should return welcome fallback message', () => {
      const message = AIService.getFallbackMessage('welcome');

      expect(message).toContain('Welcome to BaudAgain BBS');
      expect(message).toContain('MENU');
    });

    it('should return greeting fallback message', () => {
      const message = AIService.getFallbackMessage('greeting');

      expect(message).toContain('Welcome back');
      expect(message).toContain('MENU');
    });

    it('should return help fallback message', () => {
      const message = AIService.getFallbackMessage('help');

      expect(message).toContain('How can I help');
      expect(message).toContain('MENU');
    });

    it('should return error fallback message', () => {
      const message = AIService.getFallbackMessage('error');

      expect(message).toContain('temporarily unavailable');
      expect(message).toContain('MENU');
    });
  });

  describe('setRetryConfig', () => {
    it('should update retry configuration', async () => {
      aiService.setRetryConfig(0, 500); // No retries

      const prompt = 'Test prompt';
      const error = new AIProviderError('Timeout', 'TIMEOUT');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      await expect(aiService.generateCompletion(prompt)).rejects.toThrow(error);

      // Should only be called once (no retries)
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });
  });

  describe('setFallbackEnabled', () => {
    it('should disable fallbacks', async () => {
      aiService.setFallbackEnabled(false);

      const prompt = 'Test prompt';
      const fallbackMessage = 'Fallback response';
      const error = new AIProviderError('API Error', 'API_ERROR');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      await expect(aiService.generateCompletion(prompt, undefined, fallbackMessage)).rejects.toThrow(error);
    });

    it('should enable fallbacks', async () => {
      aiService.setFallbackEnabled(false);
      aiService.setFallbackEnabled(true);

      const prompt = 'Test prompt';
      const fallbackMessage = 'Fallback response';
      const error = new AIProviderError('API Error', 'API_ERROR');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      const result = await aiService.generateCompletion(prompt, undefined, fallbackMessage);

      expect(result).toBe(fallbackMessage);
    });
  });

  describe('error handling with retries', () => {
    it('should stop retrying after max attempts', async () => {
      aiService.setRetryConfig(2, 10); // 2 retries with short delay

      const prompt = 'Test prompt';
      const error = new AIProviderError('Overloaded', 'OVERLOADED');

      vi.mocked(mockProvider.generateCompletion).mockRejectedValue(error);

      await expect(aiService.generateCompletion(prompt)).rejects.toThrow(error);

      // Should be called 3 times: initial + 2 retries
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(3);
    });

    it('should succeed on last retry attempt', async () => {
      aiService.setRetryConfig(2, 10);

      const prompt = 'Test prompt';
      const error = new AIProviderError('Network Error', 'NETWORK_ERROR');

      vi.mocked(mockProvider.generateCompletion)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('Success on last try');

      const result = await aiService.generateCompletion(prompt);

      expect(result).toBe('Success on last try');
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(3);
    });
  });
});
