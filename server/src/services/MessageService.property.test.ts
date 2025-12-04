/**
 * Property-Based Tests for MessageService
 * 
 * Feature: user-journey-testing-and-fixes
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the MessageService.
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { BBSDatabase } from '../db/Database.js';
import { MessageRepository } from '../db/repositories/MessageRepository.js';
import { UserRepository } from '../db/repositories/UserRepository.js';
import { MessageBaseRepository } from '../db/repositories/MessageBaseRepository.js';
import { MessageService } from './MessageService.js';
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
  const testDbPath = path.join(process.cwd(), `test-message-service-${randomBytes(8).toString('hex')}.db`);
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

describe('MessageService Property-Based Tests', () => {
  /**
   * Feature: user-journey-testing-and-fixes, Property 3: Posted message author correctness
   * Validates: Requirements 6.4
   * 
   * For any message posted by a user, the saved message should have the author handle 
   * set to the posting user's handle.
   */
  describe('Property 3: Posted message author correctness', () => {
    it('should save posted messages with correct author handle', async () => {
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
            const messageService = new MessageService(
              messageBaseRepo,
              messageRepo,
              userRepo
            );

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

              // Post message through service
              const postedMessage = messageService.postMessage({
                baseId: base.id,
                userId: user.id,
                subject: data.subject,
                body: data.body,
              });

              // Verify the posted message has correct author handle
              return (
                postedMessage.authorHandle !== undefined &&
                postedMessage.authorHandle !== null &&
                postedMessage.authorHandle === data.handle
              );
            } finally {
              cleanupDatabase(db, testDbPath);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retrieve posted messages with correct author handle', async () => {
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
            const messageService = new MessageService(
              messageBaseRepo,
              messageRepo,
              userRepo
            );

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

              // Post message through service
              const postedMessage = messageService.postMessage({
                baseId: base.id,
                userId: user.id,
                subject: data.subject,
                body: data.body,
              });

              // Retrieve the message
              const retrievedMessage = messageService.getMessage(postedMessage.id);

              // Verify the retrieved message has correct author handle
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

    it('should list posted messages with correct author handles', async () => {
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
            const messageService = new MessageService(
              messageBaseRepo,
              messageRepo,
              userRepo
            );

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

              // Post message through service
              messageService.postMessage({
                baseId: base.id,
                userId: user.id,
                subject: data.subject,
                body: data.body,
              });

              // Get messages from the base
              const messages = messageService.getMessages(base.id);

              // Verify all messages have correct author handle
              return messages.every(msg =>
                msg.authorHandle !== undefined &&
                msg.authorHandle !== null &&
                msg.authorHandle === data.handle
              );
            } finally {
              cleanupDatabase(db, testDbPath);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
