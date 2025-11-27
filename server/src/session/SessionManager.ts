import { Session, SessionState } from '@baudagain/shared';
import { v4 as uuidv4 } from 'uuid';
import { FastifyBaseLogger } from 'fastify';
import { SESSION_TIMEOUT_MS } from '@baudagain/shared';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private connectionToSession: Map<string, string> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private logger: FastifyBaseLogger) {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60000);
  }

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

    this.sessions.set(session.id, session);
    this.connectionToSession.set(connectionId, session.id);

    this.logger.info({ sessionId: session.id, connectionId }, 'Session created');

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session by connection ID
   */
  getSessionByConnection(connectionId: string): Session | undefined {
    const sessionId = this.connectionToSession.get(connectionId);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  /**
   * Update session
   */
  updateSession(sessionId: string, updates: Partial<Session>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn({ sessionId }, 'Attempted to update non-existent session');
      return;
    }

    Object.assign(session, updates, { lastActivity: new Date() });
    this.sessions.set(sessionId, session);
  }

  /**
   * Update session activity timestamp
   */
  touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Remove session
   */
  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.connectionToSession.delete(session.connectionId);
      this.sessions.delete(sessionId);
      this.logger.info({ sessionId }, 'Session removed');
    }
  }

  /**
   * Remove session by connection ID
   */
  removeSessionByConnection(connectionId: string): void {
    const sessionId = this.connectionToSession.get(connectionId);
    if (sessionId) {
      this.removeSession(sessionId);
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clean up inactive sessions (older than SESSION_TIMEOUT_MS)
   */
  cleanupInactiveSessions(): void {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastActivity.getTime();
      if (inactiveTime > SESSION_TIMEOUT_MS) {
        sessionsToRemove.push(sessionId);
      }
    }

    if (sessionsToRemove.length > 0) {
      this.logger.info(
        { count: sessionsToRemove.length },
        'Cleaning up inactive sessions'
      );

      for (const sessionId of sessionsToRemove) {
        this.removeSession(sessionId);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
