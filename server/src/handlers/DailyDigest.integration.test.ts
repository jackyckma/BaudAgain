/**
 * Daily Digest Integration Test
 * 
 * Tests the daily digest functionality in AuthHandler and MenuHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Session, SessionState } from '@baudagain/shared';
import type { HandlerDependencies } from './HandlerDependencies.js';
import { AuthHandler } from './AuthHandler.js';
import { MenuHandler } from './MenuHandler.js';

describe('Daily Digest Integration', () => {
  let mockDeps: HandlerDependencies;
  let mockSession: Session;
  let mockUserService: any;
  let mockDailyDigestService: any;
  let mockMessageRepository: any;
  let mockMessageBaseRepository: any;
  let mockSessionManager: any;

  beforeEach(() => {
    // Create mock services
    mockUserService = {
      authenticateUser: vi.fn(),
      getUserById: vi.fn(),
    };

    mockDailyDigestService = {
      shouldGenerateDigest: vi.fn(),
      generateDigest: vi.fn(),
      formatDigest: vi.fn(),
    };

    mockMessageRepository = {
      findByBaseIdSince: vi.fn(),
    };

    mockMessageBaseRepository = {
      getAllMessageBases: vi.fn(),
    };

    mockSessionManager = {
      updateSession: vi.fn(),
    };

    // Create mock dependencies
    mockDeps = {
      renderer: {
        render: vi.fn((content) => JSON.stringify(content)),
      } as any,
      sessionManager: mockSessionManager,
      userService: mockUserService,
      dailyDigestService: mockDailyDigestService,
      messageRepository: mockMessageRepository,
      messageBaseRepository: mockMessageBaseRepository,
    };

    // Create mock session
    mockSession = {
      id: 'test-session',
      connectionId: 'test-connection',
      state: 'authenticated' as SessionState,
      userId: 'test-user',
      handle: 'testuser',
      currentMenu: 'main',
      lastActivity: new Date(),
      data: {},
    };
  });

  describe('AuthHandler - Login with Digest Available', () => {
    it('should notify user about available digest on login', async () => {
      const authHandler = new AuthHandler(mockUserService, mockDeps);
      
      // Mock user with last login > 24 hours ago
      const lastLogin = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      mockUserService.authenticateUser.mockResolvedValue({
        id: 'test-user',
        handle: 'testuser',
        lastLogin,
      });

      mockDailyDigestService.shouldGenerateDigest.mockReturnValue(true);

      // Set up session for login flow
      mockSession.state = 'authenticating' as SessionState;
      mockSession.data = {
        auth: {
          flow: 'login',
          step: 'password',
          handle: 'testuser',
        },
      };

      const response = await authHandler.handle('password123', mockSession);

      // Verify digest notification is shown
      expect(response).toContain('daily digest is available');
      expect(response).toContain('DIGEST');
      
      // Verify session was updated with digestAvailable flag
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'test-session',
        expect.objectContaining({
          data: expect.objectContaining({
            digestAvailable: true,
          }),
        })
      );
    });

    it('should not show digest notification when user has not been away long enough', async () => {
      const authHandler = new AuthHandler(mockUserService, mockDeps);
      
      // Mock user with recent last login
      const lastLogin = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      mockUserService.authenticateUser.mockResolvedValue({
        id: 'test-user',
        handle: 'testuser',
        lastLogin,
      });

      mockDailyDigestService.shouldGenerateDigest.mockReturnValue(false);

      // Set up session for login flow
      mockSession.state = 'authenticating' as SessionState;
      mockSession.data = {
        auth: {
          flow: 'login',
          step: 'password',
          handle: 'testuser',
        },
      };

      const response = await authHandler.handle('password123', mockSession);

      // Verify no digest notification
      expect(response).not.toContain('daily digest is available');
      expect(response).not.toContain('DIGEST');
    });
  });

  describe('MenuHandler - DIGEST Command', () => {
    it('should generate and display digest when DIGEST command is used', async () => {
      const menuHandler = new MenuHandler(mockDeps);
      
      // Set up session with digest available
      mockSession.data = {
        digestAvailable: true,
      };

      // Mock user with last login
      const lastLogin = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockUserService.getUserById.mockResolvedValue({
        id: 'test-user',
        handle: 'testuser',
        lastLogin,
      });

      // Mock message bases and messages
      mockMessageBaseRepository.getAllMessageBases.mockReturnValue([
        { id: 'base1', name: 'General Discussion' },
      ]);

      mockMessageRepository.findByBaseIdSince.mockReturnValue([
        {
          id: 'msg1',
          subject: 'Test Message',
          authorHandle: 'otheruser',
          body: 'Test content',
          createdAt: new Date(),
        },
      ]);

      // Mock digest generation
      mockDailyDigestService.generateDigest.mockResolvedValue({
        userId: 'test-user',
        lastLogin,
        generatedAt: new Date(),
        totalNewMessages: 1,
        messageBaseSummaries: [
          {
            baseId: 'base1',
            baseName: 'General Discussion',
            messageCount: 1,
            highlights: ['New discussion about testing'],
          },
        ],
        overallSummary: 'Welcome back! There has been some activity.',
      });

      mockDailyDigestService.formatDigest.mockReturnValue({
        plain: 'Digest content',
        colored: 'Colored digest',
        framed: '╔═══ Digest ═══╗\n║ Content      ║\n╚══════════════╝',
      });

      const response = await menuHandler.handle('DIGEST', mockSession);

      // Verify digest was generated and displayed
      expect(mockDailyDigestService.generateDigest).toHaveBeenCalled();
      expect(mockDailyDigestService.formatDigest).toHaveBeenCalled();
      expect(response).toContain('Digest');
      
      // Verify digestAvailable flag was cleared
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'test-session',
        expect.objectContaining({
          data: expect.objectContaining({
            digestAvailable: false,
          }),
        })
      );
    });

    it('should show error when digest not available', async () => {
      const menuHandler = new MenuHandler(mockDeps);
      
      // Set up session without digest available
      mockSession.data = {
        digestAvailable: false,
      };

      const response = await menuHandler.handle('DIGEST', mockSession);

      // Verify error message
      expect(response).toContain('No daily digest available');
      expect(response).toContain('24 hours');
    });

    it('should show error when no new activity', async () => {
      const menuHandler = new MenuHandler(mockDeps);
      
      // Set up session with digest available
      mockSession.data = {
        digestAvailable: true,
      };

      // Mock user with last login
      const lastLogin = new Date(Date.now() - 25 * 60 * 60 * 1000);
      mockUserService.getUserById.mockResolvedValue({
        id: 'test-user',
        handle: 'testuser',
        lastLogin,
      });

      // Mock no message bases with activity
      mockMessageBaseRepository.getAllMessageBases.mockReturnValue([
        { id: 'base1', name: 'General Discussion' },
      ]);

      mockMessageRepository.findByBaseIdSince.mockReturnValue([]);

      const response = await menuHandler.handle('DIGEST', mockSession);

      // Verify no activity message
      expect(response).toContain('No new activity');
    });
  });
});
