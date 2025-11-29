/**
 * Door Session Repository
 * 
 * Handles persistence of door game sessions to the database.
 * Allows users to resume door games after disconnection.
 */

import type { BBSDatabase } from '../Database.js';
import { v4 as uuidv4 } from 'uuid';

export interface DoorSession {
  id: string;
  userId: string;
  doorId: string;
  state: string;  // JSON string
  history: string;  // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDoorSessionData {
  userId: string;
  doorId: string;
  state: any;
  history?: any[];
}

export class DoorSessionRepository {
  constructor(private db: BBSDatabase) {}
  
  /**
   * Create a new door session
   */
  createDoorSession(data: CreateDoorSessionData): DoorSession {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.run(
      `INSERT INTO door_sessions (id, user_id, door_id, state, history, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.userId,
        data.doorId,
        JSON.stringify(data.state),
        JSON.stringify(data.history || []),
        now,
        now
      ]
    );
    
    return this.getDoorSession(id) as DoorSession;
  }
  
  /**
   * Get door session by ID
   */
  getDoorSession(id: string): DoorSession | null {
    const row = this.db.get<any>(
      `SELECT * FROM door_sessions WHERE id = ?`,
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      doorId: row.door_id,
      state: row.state,
      history: row.history,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  /**
   * Get active door session for user and door
   */
  getActiveDoorSession(userId: string, doorId: string): DoorSession | null {
    const row = this.db.get<any>(
      `SELECT * FROM door_sessions 
       WHERE user_id = ? AND door_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, doorId]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      doorId: row.door_id,
      state: row.state,
      history: row.history,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  /**
   * Update door session
   */
  updateDoorSession(id: string, state: any, history?: any[]): void {
    const now = new Date().toISOString();
    
    this.db.run(
      `UPDATE door_sessions 
       SET state = ?, history = ?, updated_at = ?
       WHERE id = ?`,
      [
        JSON.stringify(state),
        history ? JSON.stringify(history) : undefined,
        now,
        id
      ]
    );
  }
  
  /**
   * Delete door session
   */
  deleteDoorSession(id: string): void {
    this.db.run(
      `DELETE FROM door_sessions WHERE id = ?`,
      [id]
    );
  }
  
  /**
   * Delete all door sessions for a user
   */
  deleteUserDoorSessions(userId: string): void {
    this.db.run(
      `DELETE FROM door_sessions WHERE user_id = ?`,
      [userId]
    );
  }
}
