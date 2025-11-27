import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FastifyBaseLogger } from 'fastify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BBSDatabase {
  private db: Database.Database;

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
    this.initialize();
  }

  private initialize(): void {
    this.logger.info({ dbPath: this.dbPath }, 'Initializing database');
    
    try {
      // Schema path relative to the server directory
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      
      // Execute schema
      this.db.exec(schema);
      
      this.logger.info('Database schema initialized successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize database schema');
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
