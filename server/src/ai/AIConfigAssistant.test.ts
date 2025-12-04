import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIConfigAssistant } from './AIConfigAssistant.js';
import { ConfigLoader, BBSConfig } from '../config/ConfigLoader.js';
import { AIProvider } from './AIProvider.js';
import type { FastifyBaseLogger } from 'fastify';

describe('AIConfigAssistant', () => {
  let aiConfigAssistant: AIConfigAssistant;
  let mockAIProvider: AIProvider;
  let mockConfigLoader: ConfigLoader;
  let mockLogger: FastifyBaseLogger;
  let mockConfig: BBSConfig;

  beforeEach(() => {
    // Create mock config
    mockConfig = {
      bbs: {
        name: 'Test BBS',
        tagline: 'Test Tagline',
        sysopName: 'TestSysOp',
        maxNodes: 4,
        defaultAccessLevel: 10,
        theme: 'test',
      },
      network: {
        websocketPort: 8080,
      },
      ai: {
        provider: 'anthropic',
        model: 'test-model',
        sysop: {
          enabled: true,
          personality: 'Test personality',
          welcomeNewUsers: true,
          participateInChat: true,
          chatFrequency: 'only_when_paged',
        },
        doors: {
          enabled: true,
          maxTokensPerTurn: 150,
        },
      },
      security: {
        passwordMinLength: 6,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        rateLimit: {
          messagesPerHour: 30,
          doorRequestsPerMinute: 10,
        },
      },
      appearance: {
        welcomeScreen: 'welcome.ans',
        goodbyeScreen: 'goodbye.ans',
        menuTemplate: 'menu.ans',
      },
      messageBases: [],
      doors: [],
    };

    // Create mock AI provider
    mockAIProvider = {
      generateCompletion: vi.fn().mockResolvedValue('Test response'),
      generateStructured: vi.fn().mockResolvedValue(null),
    } as any;

    // Create mock config loader
    mockConfigLoader = {
      getConfig: vi.fn().mockReturnValue(mockConfig),
      save: vi.fn(),
    } as any;

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any;

    aiConfigAssistant = new AIConfigAssistant(
      mockAIProvider,
      mockConfigLoader,
      mockLogger
    );
  });

  describe('processRequest', () => {
    it('should process a simple request', async () => {
      const result = await aiConfigAssistant.processRequest('Change the BBS name to New BBS');

      expect(result.response).toBe('Test response');
      expect(mockAIProvider.generateCompletion).toHaveBeenCalled();
    });

    it('should maintain conversation history', async () => {
      await aiConfigAssistant.processRequest('First message');
      await aiConfigAssistant.processRequest('Second message');

      const history = aiConfigAssistant.getConversationHistory();
      expect(history).toHaveLength(4); // 2 user messages + 2 assistant responses
    });
  });

  describe('resetConversation', () => {
    it('should clear conversation history', async () => {
      await aiConfigAssistant.processRequest('Test message');
      expect(aiConfigAssistant.getConversationHistory()).toHaveLength(2);

      aiConfigAssistant.resetConversation();
      expect(aiConfigAssistant.getConversationHistory()).toHaveLength(0);
    });
  });

  describe('applyChanges', () => {
    it('should save configuration changes', async () => {
      const change = {
        description: 'Update BBS name',
        preview: 'name: Test BBS → New BBS',
        changes: {
          bbs: {
            ...mockConfig.bbs,
            name: 'New BBS',
          },
        },
      };

      const result = await aiConfigAssistant.applyChanges(change);

      expect(mockConfigLoader.save).toHaveBeenCalled();
      expect(result.requiresRestart).toBe(false);
    });

    it('should indicate restart required for AI provider changes', async () => {
      const change = {
        description: 'Update AI provider',
        preview: 'provider: anthropic → openai',
        changes: {
          ai: {
            ...mockConfig.ai,
            provider: 'openai' as any,
          },
        },
      };

      const result = await aiConfigAssistant.applyChanges(change);

      expect(result.requiresRestart).toBe(true);
    });

    it('should indicate restart required for network changes', async () => {
      const change = {
        description: 'Update port',
        preview: 'port: 8080 → 9090',
        changes: {
          network: {
            websocketPort: 9090,
          },
        },
      };

      const result = await aiConfigAssistant.applyChanges(change);

      expect(result.requiresRestart).toBe(true);
    });
  });
});
