/**
 * MessageHandler Integration Tests
 * 
 * Tests the integration of conversation starters into the message handler.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageHandler } from './MessageHandler.js';
import { SessionState } from '@baudagain/shared';
import type { Session } from '@baudagain/shared';

describe('MessageHandler - Conversation Starters Integration', () => {
  let messageHandler: MessageHandler;
  let mockDeps: any;
  let mockSession: Session;

  beforeEach(() => {
    // Create mock dependencies
    mockDeps = {
      renderer: {
        renderWelcomeScreen: vi.fn(),
        renderMenu: vi.fn(),
      },
      sessionManager: {
        getSession: vi.fn(),
        updateSession: vi.fn(),
      },
      messageService: {
        getMessageBase: vi.fn().mockReturnValue({
          id: 'base1',
          name: 'General Discussion',
          postCount: 10,
        }),
        getMessages: vi.fn().mockReturnValue([
          {
            id: 'msg1',
            subject: 'Test Message',
            authorHandle: 'testuser',
            body: 'Test body',
            createdAt: new Date(),
          },
        ]),
        getAccessibleMessageBases: vi.fn().mockReturnValue([
          {
            id: 'base1',
            name: 'General Discussion',
            postCount: 10,
          },
        ]),
      },
      conversationStarter: {
        generateQuestion: vi.fn().mockResolvedValue({
          id: 'q1',
          messageBaseId: 'base1',
          messageBaseName: 'General Discussion',
          question: 'What is your favorite programming language?',
          context: 'Generated to spark new discussions',
          style: 'open-ended',
          generatedAt: new Date(),
        }),
      },
    };

    // Create mock session
    mockSession = {
      id: 'session1',
      connectionId: 'conn1',
      state: SessionState.AUTHENTICATED,
      userId: 'user1',
      handle: 'testuser',
      currentMenu: 'main',
      data: {
        message: {
          inMessageBase: true,
          currentBaseId: 'base1',
        },
      },
      lastActivity: new Date(),
    };

    messageHandler = new MessageHandler(mockDeps);
  });

  it('should show conversation starters option when available', async () => {
    const output = await messageHandler.handle('M', mockSession);
    
    expect(output).toContain('💡 Need inspiration?');
    expect(output).toContain('[C] Starters');
  });

  it('should not show conversation starters option when service unavailable', async () => {
    // Remove conversation starter service
    mockDeps.conversationStarter = undefined;
    messageHandler = new MessageHandler(mockDeps);
    
    const output = await messageHandler.handle('M', mockSession);
    
    expect(output).not.toContain('💡 Need inspiration?');
    expect(output).not.toContain('[C] Starters');
  });

  it('should generate and display conversation starters', async () => {
    // First navigate to message base
    await messageHandler.handle('M', mockSession);
    
    // Then request conversation starters
    const output = await messageHandler.handle('C', mockSession);
    
    expect(output).toContain('CONVERSATION STARTERS');
    expect(output).toContain('What is your favorite programming language?');
    expect(mockDeps.conversationStarter.generateQuestion).toHaveBeenCalled();
  });

  it('should cache conversation starters for 1 hour', async () => {
    // First request
    await messageHandler.handle('M', mockSession);
    await messageHandler.handle('C', mockSession);
    
    expect(mockDeps.conversationStarter.generateQuestion).toHaveBeenCalledTimes(3); // 3 styles
    
    // Reset mock
    mockDeps.conversationStarter.generateQuestion.mockClear();
    
    // Second request (should use cache)
    await messageHandler.handle('Q', mockSession); // Go back
    await messageHandler.handle('C', mockSession);
    
    expect(mockDeps.conversationStarter.generateQuestion).not.toHaveBeenCalled();
  });

  it('should handle conversation starter selection', async () => {
    // Navigate to starters
    await messageHandler.handle('M', mockSession);
    await messageHandler.handle('C', mockSession);
    
    // Select first starter
    const output = await messageHandler.handle('1', mockSession);
    
    expect(output).toContain('POST NEW MESSAGE');
    expect(output).toContain('What is your favorite programming language?');
    expect(output).toContain('Enter message body');
  });

  it('should handle errors gracefully when generation fails', async () => {
    mockDeps.conversationStarter.generateQuestion.mockRejectedValue(
      new Error('AI service unavailable')
    );
    
    await messageHandler.handle('M', mockSession);
    const output = await messageHandler.handle('C', mockSession);
    
    expect(output).toContain('Unable to generate conversation starters');
  });

  it('should handle timeout for conversation starter generation', async () => {
    // Mock a slow generation that will timeout (11 seconds, timeout is 10)
    mockDeps.conversationStarter.generateQuestion.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 11000))
    );
    
    await messageHandler.handle('M', mockSession);
    const output = await messageHandler.handle('C', mockSession);
    
    // Should show error message since all generations timed out
    expect(output).toContain('Unable to generate conversation starters');
  }, 35000); // Increase test timeout to allow for 3 timeouts

  it('should show helpful message when no messages exist', async () => {
    mockDeps.messageService.getMessages.mockReturnValue([]);
    
    await messageHandler.handle('M', mockSession);
    const output = await messageHandler.handle('C', mockSession);
    
    expect(output).toContain('No messages yet');
  });
});
