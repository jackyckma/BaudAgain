import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from './SessionService.js';
import { SessionState } from '@baudagain/shared';
import type { Session } from '@baudagain/shared';

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    sessionService = new SessionService();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const connectionId = 'conn-123';
      const session = sessionService.createSession(connectionId);

      expect(session.id).toBeDefined();
      expect(session.connectionId).toBe(connectionId);
      expect(session.state).toBe(SessionState.CONNECTED);
      expect(session.currentMenu).toBe('welcome');
      expect(session.lastActivity).toBeInstanceOf(Date);
      expect(session.data).toEqual({});
    });

    it('should create sessions with different IDs', () => {
      const session1 = sessionService.createSession('conn-1');
      const session2 = sessionService.createSession('conn-2');

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('validateSession', () => {
    it('should return true for active session', () => {
      const session: Session = {
        id: 'session-1',
        connectionId: 'conn-1',
        state: SessionState.AUTHENTICATED,
        currentMenu: 'main',
        lastActivity: new Date(),
        data: {},
      };

      expect(sessionService.validateSession(session)).toBe(true);
    });

    it('should return false for inactive session', () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 hours ago

      const session: Session = {
        id: 'session-1',
        connectionId: 'conn-1',
        state: SessionState.AUTHENTICATED,
        currentMenu: 'main',
        lastActivity: oldDate,
        data: {},
      };

      expect(sessionService.validateSession(session)).toBe(false);
    });
  });

  describe('cleanupSession', () => {
    it('should identify inactive sessions for cleanup', () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 hours ago

      const activeSessions: Session[] = [
        {
          id: 'session-1',
          connectionId: 'conn-1',
          state: SessionState.AUTHENTICATED,
          currentMenu: 'main',
          lastActivity: new Date(),
          data: {},
        },
        {
          id: 'session-2',
          connectionId: 'conn-2',
          state: SessionState.AUTHENTICATED,
          currentMenu: 'main',
          lastActivity: oldDate,
          data: {},
        },
        {
          id: 'session-3',
          connectionId: 'conn-3',
          state: SessionState.AUTHENTICATED,
          currentMenu: 'main',
          lastActivity: new Date(),
          data: {},
        },
      ];

      const toRemove = sessionService.cleanupSession(activeSessions);

      expect(toRemove).toHaveLength(1);
      expect(toRemove).toContain('session-2');
    });

    it('should return empty array when all sessions are active', () => {
      const activeSessions: Session[] = [
        {
          id: 'session-1',
          connectionId: 'conn-1',
          state: SessionState.AUTHENTICATED,
          currentMenu: 'main',
          lastActivity: new Date(),
          data: {},
        },
        {
          id: 'session-2',
          connectionId: 'conn-2',
          state: SessionState.AUTHENTICATED,
          currentMenu: 'main',
          lastActivity: new Date(),
          data: {},
        },
      ];

      const toRemove = sessionService.cleanupSession(activeSessions);

      expect(toRemove).toHaveLength(0);
    });
  });

  describe('touchSession', () => {
    it('should update session lastActivity timestamp', () => {
      const oldDate = new Date('2024-01-01');
      const session: Session = {
        id: 'session-1',
        connectionId: 'conn-1',
        state: SessionState.AUTHENTICATED,
        currentMenu: 'main',
        lastActivity: oldDate,
        data: {},
      };

      const updatedSession = sessionService.touchSession(session);

      expect(updatedSession.lastActivity.getTime()).toBeGreaterThan(oldDate.getTime());
      expect(updatedSession.id).toBe(session.id);
      expect(updatedSession.connectionId).toBe(session.connectionId);
    });
  });

  describe('updateSession', () => {
    it('should update session with partial updates', () => {
      const session: Session = {
        id: 'session-1',
        connectionId: 'conn-1',
        state: SessionState.CONNECTED,
        currentMenu: 'welcome',
        lastActivity: new Date('2024-01-01'),
        data: {},
      };

      const updatedSession = sessionService.updateSession(session, {
        state: SessionState.AUTHENTICATED,
        userId: 'user-123',
        handle: 'testuser',
      });

      expect(updatedSession.state).toBe(SessionState.AUTHENTICATED);
      expect(updatedSession.userId).toBe('user-123');
      expect(updatedSession.handle).toBe('testuser');
      expect(updatedSession.lastActivity.getTime()).toBeGreaterThan(session.lastActivity.getTime());
    });

    it('should preserve unchanged fields', () => {
      const session: Session = {
        id: 'session-1',
        connectionId: 'conn-1',
        state: SessionState.CONNECTED,
        currentMenu: 'welcome',
        lastActivity: new Date('2024-01-01'),
        data: { auth: { flow: 'login', step: 'handle' } },
      };

      const updatedSession = sessionService.updateSession(session, {
        state: SessionState.AUTHENTICATING,
      });

      expect(updatedSession.id).toBe(session.id);
      expect(updatedSession.connectionId).toBe(session.connectionId);
      expect(updatedSession.currentMenu).toBe(session.currentMenu);
      expect(updatedSession.data).toEqual(session.data);
    });
  });
});
