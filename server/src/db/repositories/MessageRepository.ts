/**
 * Message Repository
 * 
 * Handles CRUD operations for messages within message bases.
 */

import type { BBSDatabase } from '../Database.js';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  baseId: string;
  parentId?: string;
  userId: string;
  subject: string;
  body: string;
  createdAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
  aiModerationFlag?: string;
  // Joined fields
  authorHandle?: string;
}

export interface CreateMessageData {
  baseId: string;
  userId: string;
  subject: string;
  body: string;
  parentId?: string;
}

export class MessageRepository {
  constructor(private db: BBSDatabase) {}
  
  /**
   * Create a new message
   */
  createMessage(data: CreateMessageData): Message {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.run(
      `INSERT INTO messages (id, base_id, parent_id, user_id, subject, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.baseId,
        data.parentId || null,
        data.userId,
        data.subject,
        data.body,
        now
      ]
    );
    
    return this.getMessage(id) as Message;
  }
  
  /**
   * Get message by ID
   */
  getMessage(id: string): Message | null {
    const row = this.db.get<any>(
      `SELECT m.*, u.handle as author_handle
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.id = ? AND m.is_deleted = 0`,
      [id]
    );
    
    if (!row) return null;
    
    return this.mapToMessage(row);
  }
  
  /**
   * Get messages in a message base
   */
  getMessages(baseId: string, limit: number = 50, offset: number = 0): Message[] {
    const rows = this.db.all<any>(
      `SELECT m.*, u.handle as author_handle
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.base_id = ? AND m.is_deleted = 0 AND m.parent_id IS NULL
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [baseId, limit, offset]
    );
    
    return rows.map(row => this.mapToMessage(row));
  }
  
  /**
   * Get replies to a message
   */
  getReplies(parentId: string): Message[] {
    const rows = this.db.all<any>(
      `SELECT m.*, u.handle as author_handle
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.parent_id = ? AND m.is_deleted = 0
       ORDER BY m.created_at ASC`,
      [parentId]
    );
    
    return rows.map(row => this.mapToMessage(row));
  }
  
  /**
   * Get message count for a base
   */
  getMessageCount(baseId: string): number {
    const result = this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages 
       WHERE base_id = ? AND is_deleted = 0 AND parent_id IS NULL`,
      [baseId]
    );
    
    return result?.count || 0;
  }
  
  /**
   * Get messages in a message base since a specific date
   */
  findByBaseIdSince(baseId: string, since: Date): Message[] {
    const sinceIso = since.toISOString();
    
    const rows = this.db.all<any>(
      `SELECT m.*, u.handle as author_handle
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.base_id = ? AND m.is_deleted = 0 AND m.created_at > ?
       ORDER BY m.created_at DESC`,
      [baseId, sinceIso]
    );
    
    return rows.map(row => this.mapToMessage(row));
  }
  
  /**
   * Get recent messages across all bases
   */
  getRecentMessages(limit: number = 10): Message[] {
    const rows = this.db.all<any>(
      `SELECT m.*, u.handle as author_handle
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.is_deleted = 0
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [limit]
    );
    
    return rows.map(row => this.mapToMessage(row));
  }
  
  /**
   * Update message
   */
  updateMessage(id: string, subject: string, body: string): void {
    const now = new Date().toISOString();
    
    this.db.run(
      `UPDATE messages 
       SET subject = ?, body = ?, edited_at = ?
       WHERE id = ?`,
      [subject, body, now, id]
    );
  }
  
  /**
   * Soft delete message
   */
  deleteMessage(id: string): void {
    this.db.run(
      `UPDATE messages SET is_deleted = 1 WHERE id = ?`,
      [id]
    );
  }
  
  /**
   * Set AI moderation flag
   */
  setModerationFlag(id: string, flag: string): void {
    this.db.run(
      `UPDATE messages SET ai_moderation_flag = ? WHERE id = ?`,
      [flag, id]
    );
  }
  
  /**
   * Map database row to Message
   */
  private mapToMessage(row: any): Message {
    return {
      id: row.id,
      baseId: row.base_id,
      parentId: row.parent_id,
      userId: row.user_id,
      subject: row.subject,
      body: row.body,
      createdAt: new Date(row.created_at),
      editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
      isDeleted: row.is_deleted === 1,
      aiModerationFlag: row.ai_moderation_flag,
      authorHandle: row.author_handle
    };
  }
}
