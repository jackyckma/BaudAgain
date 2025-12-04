/**
 * Door Service
 * 
 * Business logic for door game operations.
 * Provides a clean API for REST endpoints without exposing handler internals.
 */

import type { Door } from '../doors/Door.js';
import type { Session } from '@baudagain/shared';
import { SessionState } from '@baudagain/shared';
import type { SessionManager } from '../session/SessionManager.js';
import type { DoorSessionRepository } from '../db/repositories/DoorSessionRepository.js';

export interface DoorEnterResult {
  sessionId: string;
  output: string;
  doorId: string;
  doorName: string;
  resumed: boolean;
}

export interface DoorInputResult {
  sessionId: string;
  output: string;
  exited: boolean;
}

export interface DoorExitResult {
  output: string;
  exited: boolean;
}

export interface DoorInfo {
  id: string;
  name: string;
  description: string;
}

export interface DoorSessionInfo {
  inDoor: boolean;
  sessionId: string | null;
  doorId: string;
  doorName?: string;
  lastActivity?: Date;
  gameState?: any;
  history?: any[];
  hasSavedSession?: boolean;
  savedState?: any;
  savedHistory?: any[];
}

export interface SavedDoorSession {
  doorId: string;
  doorName: string;
  lastActivity: Date;
  createdAt: Date;
  canResume: boolean;
}

export class DoorService {
  constructor(
    private doors: Map<string, Door>,
    private sessionManager: SessionManager,
    private doorSessionRepo?: DoorSessionRepository
  ) {}

  /**
   * Get all available doors
   */
  getDoors(): DoorInfo[] {
    return Array.from(this.doors.values()).map(door => ({
      id: door.id,
      name: door.name,
      description: door.description,
    }));
  }

  /**
   * Get a specific door by ID
   */
  getDoor(doorId: string): Door | null {
    return this.doors.get(doorId) || null;
  }

  /**
   * Enter a door game
   */
  async enterDoor(userId: string, handle: string, doorId: string): Promise<DoorEnterResult> {
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door game not found');
    }

    // Get or create REST session for this user
    const session = this.getOrCreateRESTSession(userId, handle);

    // Check if user is already in this door
    if (session.state === SessionState.IN_DOOR && session.data.door?.doorId === doorId) {
      return {
        sessionId: session.id,
        output: '\r\nYou are already in this door game.\r\n',
        doorId: door.id,
        doorName: door.name,
        resumed: true,
      };
    }

    // Check for saved session
    let savedSession = null;
    if (this.doorSessionRepo) {
      savedSession = this.doorSessionRepo.getActiveDoorSession(userId, doorId);
    }

    // Update session state
    session.state = SessionState.IN_DOOR;
    session.data.door = {
      doorId: door.id,
      gameState: savedSession ? JSON.parse(savedSession.state) : {},
      history: savedSession ? JSON.parse(savedSession.history) : [],
    };

    this.sessionManager.updateSession(session.id, {
      state: session.state,
      data: session.data,
    });

    // Save door session to database if not already saved
    if (this.doorSessionRepo && !savedSession) {
      this.doorSessionRepo.createDoorSession({
        userId,
        doorId: door.id,
        state: session.data.door.gameState,
        history: session.data.door.history,
      });
    }

    // Enter the door
    const output = await door.enter(session);

    // Add resume message if applicable
    const finalOutput = savedSession
      ? '\r\n\x1b[33m[Resuming saved game...]\x1b[0m\r\n\r\n' + output
      : output;

    return {
      sessionId: session.id,
      output: finalOutput,
      doorId: door.id,
      doorName: door.name,
      resumed: savedSession !== null,
    };
  }

  /**
   * Send input to a door game
   */
  async sendInput(
    userId: string,
    doorId: string,
    input: string,
    sessionId?: string
  ): Promise<DoorInputResult> {
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door game not found');
    }

    // Get the session
    const session = this.getSession(userId, sessionId);
    if (!session) {
      throw new Error('Session not found. Please enter the door first.');
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      throw new Error('Session does not belong to current user');
    }

    // Verify user is actually IN a door (not just authenticated)
    if (session.state !== SessionState.IN_DOOR) {
      throw new Error('Session not found. Please enter the door first.');
    }

    // Verify user is in the correct door
    if (session.data.door?.doorId !== doorId) {
      throw new Error('Session is not in this door game');
    }

    // Process input through the door
    const output = await door.processInput(input, session);

    // Save door session state to database
    if (this.doorSessionRepo && session.data.door) {
      const savedSession = this.doorSessionRepo.getActiveDoorSession(userId, doorId);
      if (savedSession) {
        this.doorSessionRepo.updateDoorSession(
          savedSession.id,
          session.data.door.gameState,
          session.data.door.history
        );
      }
    }

    // Update session activity
    this.sessionManager.touchSession(session.id);

    // Check if user exited the door
    const exited = session.state !== SessionState.IN_DOOR;

    return {
      sessionId: session.id,
      output,
      exited,
    };
  }

  /**
   * Exit a door game
   */
  async exitDoor(userId: string, doorId: string, sessionId?: string): Promise<DoorExitResult> {
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door game not found');
    }

    // Get the session
    const session = this.getSession(userId, sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      throw new Error('Session does not belong to current user');
    }

    // Call door's exit method
    let exitMessage = '';
    try {
      exitMessage = await door.exit(session);
    } catch (error) {
      console.error(`Error exiting door ${door.id}:`, error);
      exitMessage = '\r\nExiting door game...\r\n\r\n';
    }

    // Delete saved door session from database
    if (this.doorSessionRepo && session.data.door?.doorId) {
      const savedSession = this.doorSessionRepo.getActiveDoorSession(userId, session.data.door.doorId);
      if (savedSession) {
        this.doorSessionRepo.deleteDoorSession(savedSession.id);
      }
    }

    // Clear door state
    session.state = SessionState.AUTHENTICATED;
    session.data.door = undefined;
    this.sessionManager.updateSession(session.id, {
      state: SessionState.AUTHENTICATED,
      data: { ...session.data, door: undefined },
    });

    return {
      output: exitMessage + 'Returning to main menu...\r\n\r\n',
      exited: true,
    };
  }

  /**
   * Get door session information
   */
  getDoorSessionInfo(userId: string, doorId: string): DoorSessionInfo {
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door game not found');
    }

    // Check for active in-memory session
    const restConnectionId = `rest-${userId}`;
    const session = this.sessionManager.getSessionByConnection(restConnectionId);

    if (session && session.state === SessionState.IN_DOOR && session.data.door?.doorId === doorId) {
      return {
        inDoor: true,
        sessionId: session.id,
        doorId,
        doorName: door.name,
        lastActivity: session.lastActivity,
        gameState: session.data.door?.gameState || {},
        history: session.data.door?.history || [],
      };
    }

    // Check for saved session in database
    if (this.doorSessionRepo) {
      const savedSession = this.doorSessionRepo.getActiveDoorSession(userId, doorId);
      if (savedSession) {
        return {
          inDoor: false,
          hasSavedSession: true,
          sessionId: null,
          doorId,
          doorName: door.name,
          lastActivity: savedSession.updatedAt,
          savedState: JSON.parse(savedSession.state),
          savedHistory: JSON.parse(savedSession.history),
        };
      }
    }

    return {
      inDoor: false,
      hasSavedSession: false,
      sessionId: null,
      doorId,
    };
  }

  /**
   * Get all saved door sessions for a user
   */
  getSavedSessions(userId: string): SavedDoorSession[] {
    if (!this.doorSessionRepo) {
      return [];
    }

    const savedSessions: SavedDoorSession[] = [];

    for (const door of this.doors.values()) {
      const savedSession = this.doorSessionRepo.getActiveDoorSession(userId, door.id);
      if (savedSession) {
        savedSessions.push({
          doorId: door.id,
          doorName: door.name,
          lastActivity: savedSession.updatedAt,
          createdAt: savedSession.createdAt,
          canResume: true,
        });
      }
    }

    return savedSessions;
  }

  /**
   * Get or create a REST session for a user
   */
  private getOrCreateRESTSession(userId: string, handle: string): Session {
    const restConnectionId = `rest-${userId}`;
    let session = this.sessionManager.getSessionByConnection(restConnectionId);

    if (!session) {
      session = this.sessionManager.createSession(restConnectionId);
      session.userId = userId;
      session.handle = handle;
      session.state = SessionState.AUTHENTICATED;
      this.sessionManager.updateSession(session.id, session);
    }

    return session;
  }

  /**
   * Get a session by ID or connection ID
   */
  private getSession(userId: string, sessionId?: string): Session | null {
    if (sessionId) {
      return this.sessionManager.getSession(sessionId) || null;
    }

    const restConnectionId = `rest-${userId}`;
    return this.sessionManager.getSessionByConnection(restConnectionId) || null;
  }
}
