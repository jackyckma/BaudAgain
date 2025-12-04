import { Session, SessionState } from '@baudagain/shared';
import { FastifyBaseLogger } from 'fastify';
import { SessionService } from '../services/SessionService.js';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private connectionToSession: Map<string, string> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private sessionService: SessionService;

  constructor(private logger: FastifyBaseLogger) {
    this.sessionService = new SessionService();
    
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60000);
  }

  /**
   * Create a new session for a connection
   */
  createSession(connectionId: string): Session {
    const session = this.sessionService.createSession(connectionId);

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

    const updatedSession = this.sessionService.updateSession(session, updates);
    this.sessions.set(sessionId, updatedSession);
  }

  /**
   * Update session activity timestamp
   */
  touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const updatedSession = this.sessionService.touchSession(session);
      this.sessions.set(sessionId, updatedSession);
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
    const allSessions = Array.from(this.sessions.values());
    const sessionsToRemove = this.sessionService.cleanupSession(allSessions);

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
   * Get all sessions in a specific door
   */
  getSessionsInDoor(doorId: string): Session[] {
    return Array.from(this.sessions.values()).filter(
      session => session.state === SessionState.IN_DOOR && session.data.door?.doorId === doorId
    );
  }

  /**
   * Get session count for a specific door
   */
  getDoorSessionCount(doorId: string): number {
    return this.getSessionsInDoor(doorId).length;
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
