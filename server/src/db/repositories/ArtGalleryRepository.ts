/**
 * Art Gallery Repository
 * 
 * Handles CRUD operations for AI-generated ANSI art pieces.
 */

import type { BBSDatabase } from '../Database.js';
import { v4 as uuidv4 } from 'uuid';

export interface ArtPiece {
  id: string;
  userId: string;
  title: string;
  description?: string;
  artContent: string;
  style?: string;
  createdAt: Date;
  // Joined fields
  authorHandle?: string;
}

export interface CreateArtPieceData {
  userId: string;
  title: string;
  description?: string;
  artContent: string;
  style?: string;
}

export class ArtGalleryRepository {
  constructor(private db: BBSDatabase) {}
  
  /**
   * Create a new art piece
   */
  createArtPiece(data: CreateArtPieceData): ArtPiece {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.run(
      `INSERT INTO art_gallery (id, user_id, title, description, art_content, style, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.userId,
        data.title,
        data.description || null,
        data.artContent,
        data.style || null,
        now
      ]
    );
    
    return this.getArtPiece(id) as ArtPiece;
  }
  
  /**
   * Get art piece by ID
   */
  getArtPiece(id: string): ArtPiece | null {
    const row = this.db.get<any>(
      `SELECT a.*, u.handle as author_handle
       FROM art_gallery a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (!row) return null;
    
    return this.mapToArtPiece(row);
  }
  
  /**
   * Get all art pieces (paginated)
   */
  getAllArtPieces(limit: number = 50, offset: number = 0): ArtPiece[] {
    const rows = this.db.all<any>(
      `SELECT a.*, u.handle as author_handle
       FROM art_gallery a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return rows.map(row => this.mapToArtPiece(row));
  }
  
  /**
   * Get art pieces by user
   */
  getArtPiecesByUser(userId: string, limit: number = 50, offset: number = 0): ArtPiece[] {
    const rows = this.db.all<any>(
      `SELECT a.*, u.handle as author_handle
       FROM art_gallery a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    return rows.map(row => this.mapToArtPiece(row));
  }
  
  /**
   * Get total count of art pieces
   */
  getArtPieceCount(): number {
    const result = this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM art_gallery`
    );
    
    return result?.count || 0;
  }
  
  /**
   * Get count of art pieces by user
   */
  getArtPieceCountByUser(userId: string): number {
    const result = this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM art_gallery WHERE user_id = ?`,
      [userId]
    );
    
    return result?.count || 0;
  }
  
  /**
   * Delete art piece (only owner can delete)
   */
  deleteArtPiece(id: string, userId: string): boolean {
    const result = this.db.run(
      `DELETE FROM art_gallery WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    return result.changes > 0;
  }
  
  /**
   * Map database row to ArtPiece
   */
  private mapToArtPiece(row: any): ArtPiece {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      artContent: row.art_content,
      style: row.style,
      createdAt: new Date(row.created_at),
      authorHandle: row.author_handle
    };
  }
}
