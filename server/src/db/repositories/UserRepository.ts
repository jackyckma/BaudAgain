import { BBSDatabase } from '../Database.js';
import { User, UserPreferences } from '@baudagain/shared';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  constructor(private db: BBSDatabase) {}

  /**
   * Create a new user
   */
  create(
    handle: string,
    passwordHash: string,
    options?: {
      realName?: string;
      location?: string;
      bio?: string;
      accessLevel?: number;
    }
  ): User {
    const id = uuidv4();
    const now = new Date().toISOString();
    const preferences: UserPreferences = {
      terminalType: 'ansi',
      screenWidth: 80,
      screenHeight: 24,
    };

    this.db.run(
      `INSERT INTO users (id, handle, password_hash, real_name, location, bio, access_level, created_at, preferences)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        handle,
        passwordHash,
        options?.realName || null,
        options?.location || null,
        options?.bio || null,
        options?.accessLevel || 10,
        now,
        JSON.stringify(preferences),
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find user by ID
   */
  findById(id: string): User | undefined {
    const row = this.db.get<any>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return row ? this.mapRowToUser(row) : undefined;
  }

  /**
   * Find user by handle
   */
  findByHandle(handle: string): User | undefined {
    const row = this.db.get<any>(
      'SELECT * FROM users WHERE handle = ?',
      [handle]
    );

    return row ? this.mapRowToUser(row) : undefined;
  }

  /**
   * Check if handle exists
   */
  handleExists(handle: string): boolean {
    const result = this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE handle = ?',
      [handle]
    );
    return result ? result.count > 0 : false;
  }

  /**
   * Update last login time
   */
  updateLastLogin(userId: string): void {
    const now = new Date().toISOString();
    this.db.run(
      'UPDATE users SET last_login = ?, total_calls = total_calls + 1 WHERE id = ?',
      [now, userId]
    );
  }

  /**
   * Update user preferences
   */
  updatePreferences(userId: string, preferences: UserPreferences): void {
    this.db.run(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [JSON.stringify(preferences), userId]
    );
  }

  /**
   * Get all users
   */
  findAll(): User[] {
    const rows = this.db.all<any>('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(row => this.mapRowToUser(row));
  }

  /**
   * Map database row to User object
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      handle: row.handle,
      passwordHash: row.password_hash,
      realName: row.real_name || undefined,
      location: row.location || undefined,
      bio: row.bio || undefined,
      accessLevel: row.access_level,
      createdAt: new Date(row.created_at),
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      totalCalls: row.total_calls,
      totalPosts: row.total_posts,
      preferences: JSON.parse(row.preferences),
    };
  }
}
