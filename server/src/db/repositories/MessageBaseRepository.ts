/**
 * Message Base Repository
 * 
 * Handles CRUD operations for message bases (forums).
 */

import type { BBSDatabase } from '../Database.js';
import { v4 as uuidv4 } from 'uuid';

export interface MessageBase {
  id: string;
  name: string;
  description?: string;
  accessLevelRead: number;
  accessLevelWrite: number;
  postCount: number;
  lastPostAt?: Date;
  sortOrder: number;
}

export interface CreateMessageBaseData {
  name: string;
  description?: string;
  accessLevelRead?: number;
  accessLevelWrite?: number;
  sortOrder?: number;
}

export class MessageBaseRepository {
  constructor(private db: BBSDatabase) {}
  
  /**
   * Create a new message base
   */
  createMessageBase(data: CreateMessageBaseData): MessageBase {
    const id = uuidv4();
    
    this.db.run(
      `INSERT INTO message_bases (id, name, description, access_level_read, access_level_write, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.description || null,
        data.accessLevelRead ?? 0,
        data.accessLevelWrite ?? 10,
        data.sortOrder ?? 0
      ]
    );
    
    return this.getMessageBase(id) as MessageBase;
  }
  
  /**
   * Get message base by ID
   */
  getMessageBase(id: string): MessageBase | null {
    const row = this.db.get<any>(
      `SELECT * FROM message_bases WHERE id = ?`,
      [id]
    );
    
    if (!row) return null;
    
    return this.mapToMessageBase(row);
  }
  
  /**
   * Get all message bases ordered by sort_order
   */
  getAllMessageBases(): MessageBase[] {
    const rows = this.db.all<any>(
      `SELECT * FROM message_bases ORDER BY sort_order ASC, name ASC`
    );
    
    return rows.map(row => this.mapToMessageBase(row));
  }
  
  /**
   * Get message bases accessible by user
   */
  getAccessibleMessageBases(userAccessLevel: number): MessageBase[] {
    const rows = this.db.all<any>(
      `SELECT * FROM message_bases 
       WHERE access_level_read <= ?
       ORDER BY sort_order ASC, name ASC`,
      [userAccessLevel]
    );
    
    return rows.map(row => this.mapToMessageBase(row));
  }
  
  /**
   * Update message base
   */
  updateMessageBase(id: string, data: Partial<CreateMessageBaseData>): void {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.accessLevelRead !== undefined) {
      updates.push('access_level_read = ?');
      values.push(data.accessLevelRead);
    }
    if (data.accessLevelWrite !== undefined) {
      updates.push('access_level_write = ?');
      values.push(data.accessLevelWrite);
    }
    if (data.sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(data.sortOrder);
    }
    
    if (updates.length === 0) return;
    
    values.push(id);
    
    this.db.run(
      `UPDATE message_bases SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }
  
  /**
   * Delete message base
   */
  deleteMessageBase(id: string): void {
    this.db.run(
      `DELETE FROM message_bases WHERE id = ?`,
      [id]
    );
  }
  
  /**
   * Increment post count
   */
  incrementPostCount(id: string): void {
    this.db.run(
      `UPDATE message_bases 
       SET post_count = post_count + 1, last_post_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
  }
  
  /**
   * Map database row to MessageBase
   */
  private mapToMessageBase(row: any): MessageBase {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      accessLevelRead: row.access_level_read,
      accessLevelWrite: row.access_level_write,
      postCount: row.post_count,
      lastPostAt: row.last_post_at ? new Date(row.last_post_at) : undefined,
      sortOrder: row.sort_order
    };
  }
}
