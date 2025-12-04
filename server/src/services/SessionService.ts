import { Session, SessionState } from '@baudagain/shared';
import { v4 as uuidv4 } from 'uuid';
import { SESSION_TIMEOUT_MS } from '@baudagain/shared';

/**
 * Session Service
 * 
 * Handles session-related business logic including:
 * - Session creation with unique IDs
 * - Session validation
 * - Session cleanup based on inactivity
 */
export class SessionService {
  /**
   * Create a new session for a connection
   */
  createSession(connectionId: string): Session {
    const session: Session = {
      id: uuidv4(),
      connectionId,
      state: SessionState.CONNECTED,
      currentMenu: 'welcome',
      lastActivity: new Date(),
      data: {},
    };

    return session;
  }

  /**
   * Validate if a session is still active based on last activity
   */
  validateSession(session: Session): boolean {
    const now = Date.now();
    const inactiveTime = now - session.lastActivity.getTime();
    return inactiveTime <= SESSION_TIMEOUT_MS;
  }

  /**
   * Determine which sessions should be cleaned up based on inactivity
   */
  cleanupSession(sessions: Session[]): string[] {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    for (const session of sessions) {
      const inactiveTime = now - session.lastActivity.getTime();
      if (inactiveTime > SESSION_TIMEOUT_MS) {
        sessionsToRemove.push(session.id);
      }
    }

    return sessionsToRemove;
  }

  /**
   * Update session activity timestamp
   */
  touchSession(session: Session): Session {
    return {
      ...session,
      lastActivity: new Date(),
    };
  }

  /**
   * Update session with partial updates
   */
  updateSession(session: Session, updates: Partial<Session>): Session {
    return {
      ...session,
      ...updates,
      lastActivity: new Date(),
    };
  }
}
