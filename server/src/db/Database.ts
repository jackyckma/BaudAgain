import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FastifyBaseLogger } from 'fastify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BBSDatabase {
  private db: Database.Database;

  private initPromise: Promise<void>;

  constructor(
    private dbPath: string,
    private logger: FastifyBaseLogger
  ) {
    // Ensure directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints
    this.initPromise = this.initialize();
  }

  /**
   * Wait for database initialization to complete
   */
  async ready(): Promise<void> {
    try {
      await this.initPromise;
      this.validateInitialization();
    } catch (error) {
      this.logger.error({ error }, 'Database initialization failed');
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that database was properly initialized
   */
  private validateInitialization(): void {
    try {
      // Check if critical tables exist
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
      const tableNames = tables.map(t => t.name);
      
      const requiredTables = ['users', 'message_bases', 'messages', 'door_sessions', 'activity_log'];
      const missingTables = requiredTables.filter(t => !tableNames.includes(t));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
      }
      
      this.logger.info({ tables: tableNames }, 'Database validation successful');
    } catch (error) {
      this.logger.error({ error }, 'Database validation failed');
      throw error;
    }
  }

  private async initialize(): Promise<void> {
    this.logger.info({ dbPath: this.dbPath }, 'Initializing database');
    
    try {
      // Schema path relative to the server directory
      const schemaPath = join(__dirname, 'schema.sql');
      this.logger.info({ schemaPath }, 'Loading schema file');
      
      const schema = readFileSync(schemaPath, 'utf-8');
      this.logger.info({ schemaLength: schema.length }, 'Schema file loaded');
      
      // Execute schema
      this.db.exec(schema);
      this.logger.info('Database schema executed successfully');
      
      // Verify tables were created
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
      this.logger.info({ tables: tables.map(t => t.name) }, 'Tables created');
      
      // Seed default data if needed
      await this.seedDefaultData();
      
      this.logger.info('Database initialization complete');
    } catch (error) {
      this.logger.error({ 
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 'Failed to initialize database schema');
      throw error;
    }
  }

  /**
   * Seed default data (message bases, etc.)
   */
  private async seedDefaultData(): Promise<void> {
    try {
      // Check if message bases exist
      const baseCount = this.db.prepare('SELECT COUNT(*) as count FROM message_bases').get() as { count: number };
      
      if (baseCount.count === 0) {
        this.logger.info('Seeding default message bases');
        
        const { v4: uuidv4 } = await import('uuid');
        
        const defaultBases = [
          {
            id: uuidv4(),
            name: 'General Discussion',
            description: 'General topics and casual conversation',
            access_level_read: 0,
            access_level_write: 10,
            sort_order: 1
          },
          {
            id: uuidv4(),
            name: 'BBS Talk',
            description: 'Discussion about BBS systems and retro computing',
            access_level_read: 0,
            access_level_write: 10,
            sort_order: 2
          },
          {
            id: uuidv4(),
            name: 'AI & Technology',
            description: 'Artificial intelligence and modern technology',
            access_level_read: 0,
            access_level_write: 10,
            sort_order: 3
          }
        ];
        
        const stmt = this.db.prepare(`
          INSERT INTO message_bases (id, name, description, access_level_read, access_level_write, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const base of defaultBases) {
          stmt.run(base.id, base.name, base.description, base.access_level_read, base.access_level_write, base.sort_order);
        }
        
        this.logger.info(`Seeded ${defaultBases.length} default message bases`);
      } else {
        this.logger.info({ count: baseCount.count }, 'Message bases already exist, skipping seed');
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to seed default data');
      throw error;
    }
  }

  /**
   * Get the underlying database instance
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.logger.info('Closing database connection');
    this.db.close();
  }

  /**
   * Run a query that doesn't return results (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params?: any[]): Database.RunResult {
    return this.db.prepare(sql).run(params);
  }

  /**
   * Get a single row
   */
  get<T = any>(sql: string, params?: any[]): T | undefined {
    return this.db.prepare(sql).get(params) as T | undefined;
  }

  /**
   * Get all rows
   */
  all<T = any>(sql: string, params?: any[]): T[] {
    return this.db.prepare(sql).all(params) as T[];
  }

  /**
   * Begin a transaction
   */
  transaction<T>(fn: () => T): T {
    const txn = this.db.transaction(fn);
    return txn();
  }
}
