/**
 * Property-Based Tests for MessageRepository
 * 
 * Feature: user-journey-testing-and-fixes
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the MessageRepository.
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { BBSDatabase } from '../Database.js';
import { MessageRepository } from './MessageRepository.js';
import { UserRepository } from './UserRepository.js';
import { MessageBaseRepository } from './MessageBaseRepository.js';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// Mock logger for testing
const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => mockLogger,
  level: 'info',
} as any;

// Helper to create a fresh database for each test iteration
async function createTestDatabase() {
  const testDbPath = path.join(process.cwd(), `test-messages-${randomBytes(8).toString('hex')}.db`);
  const db = new BBSDatabase(testDbPath, mockLogger);
  await db.ready();
  return { db, testDbPath };
}

// Helper to cleanup database
function cleanupDatabase(db: BBSDatabase, testDbPath: string) {
  try {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe('MessageRepository Property-Based Tests', () => {

  /**
   * Feature: user-journey-testing-and-fixes, Property 2: Author handle correctness
   * Validates: Requirements 4.5, 5.5
   * 
   * For any message displayed in the Terminal Client, the author handle field should contain 
   * the actual username and never be "undefined" or null.
   */
  describe('Property 2: Author handle correctness', () => {
    it('should always have authorHandle populated for messages with valid users', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            handle: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          // Generate random message data
          fc.record({
            subject: fc.string({ minLength: 1, maxLength: 100 }),
            body: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async (userData, messageData) => {
            // Create fresh database for this iteration
            const { db, testDbPath } = await createTestDatabase();
            const messageRepo = new MessageRepository(db);
            const userRepo = new UserRepository(db);
            const messageBaseRepo = new MessageBaseRepository(db);

            try {
              // Create a message base
              const base = messageBaseRepo.createMessageBase({
                name: 'Test Base',
                description: 'Test',
                accessLevelRead: 0,
                accessLevelWrite: 10,
              });

              // Create user
              const user = userRepo.create(userData.handle, userData.password);

              // Create message
              const message = messageRepo.createMessage({
                baseId: base.id,
                userId: user.id,
                subject: messageData.subject,
                body: messageData.body,
              });

              // Verify authorHandle is populated and matches user handle
              const result = (
                message.authorHandle !== undefined &&
                message.authorHandle !== null &&
                message.authorHandle === userData.handle
              );

              return result;
            } finally {
              cleanupDatabase(db, testDbPath);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have authorHandle populated when retrieving a single message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            handle: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            subject: fc.string({ minLength: 1, maxLength: 100 }),
            body: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async (data) => {
            const { db, testDbPath } = await createTestDatabase();
            const messageRepo = new MessageRepository(db);
            const userRepo = new UserRepository(db);
            const messageBaseRepo = new MessageBaseRepository(db);

            try {
              // Create a message base
              const base = messageBaseRepo.createMessageBase({
                name: 'Test Base',
                description: 'Test',
                accessLevelRead: 0,
                accessLevelWrite: 10,
              });

              // Create user
              const user = userRepo.create(data.handle, data.password);

              // Create message
              const createdMessage = messageRepo.createMessage({
                baseId: base.id,
                userId: user.id,
                subject: data.subject,
                body: data.body,
              });

              // Retrieve the message by ID
              const retrievedMessage = messageRepo.getMessage(createdMessage.id);

              // Verify authorHandle is populated
              return (
                retrievedMessage !== null &&
                retrievedMessage.authorHandle !== undefined &&
                retrievedMessage.authorHandle !== null &&
                retrievedMessage.authorHandle === data.handle
              );
            } finally {
              cleanupDatabase(db, testDbPath);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle messages with deleted users gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            handle: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            subject: fc.string({ minLength: 1, maxLength: 100 }),
            body: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async (data) => {
            const { db, testDbPath } = await createTestDatabase();
            const messageRepo = new MessageRepository(db);
            const userRepo = new UserRepository(db);
            const messageBaseRepo = new MessageBaseRepository(db);

            try {
              // Create a message base
              const base = messageBaseRepo.createMessageBase({
                name: 'Test Base',
                description: 'Test',
                accessLevelRead: 0,
                accessLevelWrite: 10,
              });

              // Create user
              const user = userRepo.create(data.handle, data.password);

              // Create message
              const message = messageRepo.createMessage({
                baseId: base.id,
                userId: user.id,
                subject: data.subject,
                body: data.body,
              });

              // Temporarily disable foreign keys to simulate deleted user scenario
              db.run('PRAGMA foreign_keys = OFF', []);
              
              // Delete the user from database (simulate deleted user)
              db.run('DELETE FROM users WHERE id = ?', [user.id]);
              
              // Re-enable foreign keys
              db.run('PRAGMA foreign_keys = ON', []);

              // Retrieve the message - should still work with LEFT JOIN
              const retrievedMessage = messageRepo.getMessage(message.id);

              // Message should exist but authorHandle should be null/undefined
              // This is acceptable - the handler will display "Unknown"
              return retrievedMessage !== null;
            } finally {
              cleanupDatabase(db, testDbPath);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
