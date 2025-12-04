/**
 * Property-Based Tests for NotificationService
 * 
 * Feature: baudagain, Property 61: Notification delivery
 * 
 * Tests universal properties of the notification system using property-based testing.
 * These tests verify that notification delivery works correctly across many randomly
 * generated inputs.
 * 
 * Validates: Requirements 17.1, 17.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NotificationService } from './NotificationService.js';
import { IConnection } from '../connection/IConnection.js';
import {
  NotificationEventType,
  NotificationEvent,
  createNotificationEvent,
  MessageNewPayload,
  UserJoinedPayload,
  SystemAnnouncementPayload,
  AnnouncementPriority,
} from './types.js';

// Mock logger
const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => mockLogger,
} as any;

// Mock connection implementation for property testing
class MockConnection implements IConnection {
  public readonly id: string;
  public isOpen: boolean = true;
  private closeCallback?: () => void;
  public sentMessages: string[] = [];

  constructor(id: string) {
    this.id = id;
  }

  async send(data: string): Promise<void> {
    if (!this.isOpen) {
      throw new Error('Connection is not open');
    }
    this.sentMessages.push(data);
  }

  async close(): Promise<void> {
    this.isOpen = false;
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  onData(callback: (data: string) => void): void {
    // Not used in these tests
  }

  onClose(callback: () => void): void {
    this.closeCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    // Not used in these tests
  }

  // Helper to get parsed messages
  getParsedMessages(): NotificationEvent<any>[] {
    return this.sentMessages.map(msg => JSON.parse(msg));
  }
}

// Arbitraries for generating test data
const eventTypeArbitrary = fc.constantFrom(
  NotificationEventType.MESSAGE_NEW,
  NotificationEventType.USER_JOINED,
  NotificationEventType.USER_LEFT,
  NotificationEventType.SYSTEM_ANNOUNCEMENT,
  NotificationEventType.DOOR_ENTERED,
  NotificationEventType.DOOR_EXITED
);

const messageNewPayloadArbitrary = fc.record({
  messageId: fc.uuid(),
  messageBaseId: fc.uuid(),
  messageBaseName: fc.string({ minLength: 1, maxLength: 50 }),
  subject: fc.string({ minLength: 1, maxLength: 100 }),
  authorHandle: fc.string({ minLength: 3, maxLength: 20 }),
  createdAt: fc.date().map(d => d.toISOString()),
});

const userJoinedPayloadArbitrary = fc.record({
  userId: fc.uuid(),
  handle: fc.string({ minLength: 3, maxLength: 20 }),
  node: fc.integer({ min: 1, max: 10 }),
});

const systemAnnouncementPayloadArbitrary = fc.record({
  message: fc.string({ minLength: 1, maxLength: 500 }),
  priority: fc.constantFrom(
    AnnouncementPriority.LOW,
    AnnouncementPriority.NORMAL,
    AnnouncementPriority.HIGH,
    AnnouncementPriority.CRITICAL
  ),
  expiresAt: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
});

// Generate a notification event with appropriate payload
const notificationEventArbitrary = fc.oneof(
  messageNewPayloadArbitrary.map(payload =>
    createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload)
  ),
  userJoinedPayloadArbitrary.map(payload =>
    createNotificationEvent(NotificationEventType.USER_JOINED, payload)
  ),
  systemAnnouncementPayloadArbitrary.map(payload =>
    createNotificationEvent(NotificationEventType.SYSTEM_ANNOUNCEMENT, payload)
  )
);

describe('NotificationService - Property-Based Tests', () => {
  /**
   * Property 61: Notification delivery
   * 
   * For any notification event, when broadcast to subscribed clients,
   * all subscribed clients should receive the event with proper structure
   * (type, timestamp, data).
   * 
   * Validates: Requirements 17.1, 17.2
   */
  describe('Property 61: Notification delivery', () => {
    it('should deliver notifications to all subscribed clients with proper structure', () => {
      fc.assert(
        fc.property(
          notificationEventArbitrary,
          fc.integer({ min: 1, max: 10 }), // number of subscribed clients
          fc.integer({ min: 0, max: 5 }),  // number of unsubscribed clients
          (event, subscribedCount, unsubscribedCount) => {
            // Setup
            const service = new NotificationService(mockLogger);
            const subscribedConnections: MockConnection[] = [];
            const unsubscribedConnections: MockConnection[] = [];

            // Create subscribed clients
            for (let i = 0; i < subscribedCount; i++) {
              const conn = new MockConnection(`subscribed-${i}`);
              service.registerClient(conn, `user-${i}`);
              service.subscribe(`subscribed-${i}`, [event.type]);
              subscribedConnections.push(conn);
            }

            // Create unsubscribed clients
            for (let i = 0; i < unsubscribedCount; i++) {
              const conn = new MockConnection(`unsubscribed-${i}`);
              service.registerClient(conn, `user-unsub-${i}`);
              // Don't subscribe to the event type
              unsubscribedConnections.push(conn);
            }

            // Execute
            service.broadcast(event);

            // Verify: All subscribed clients received the event
            for (const conn of subscribedConnections) {
              expect(conn.sentMessages.length).toBe(1);
              
              const receivedEvent = conn.getParsedMessages()[0];
              
              // Verify structure (Requirements 17.2)
              expect(receivedEvent).toHaveProperty('type');
              expect(receivedEvent).toHaveProperty('timestamp');
              expect(receivedEvent).toHaveProperty('data');
              
              // Verify content matches
              expect(receivedEvent.type).toBe(event.type);
              expect(receivedEvent.data).toEqual(event.data);
              
              // Verify timestamp is valid ISO 8601
              expect(() => new Date(receivedEvent.timestamp)).not.toThrow();
              expect(new Date(receivedEvent.timestamp).toISOString()).toBe(receivedEvent.timestamp);
            }

            // Verify: Unsubscribed clients did not receive the event
            for (const conn of unsubscribedConnections) {
              expect(conn.sentMessages.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });

    it('should deliver notifications only to clients subscribed to specific event types', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(eventTypeArbitrary, { minLength: 1, maxLength: 3 }).chain(types => 
            fc.tuple(
              fc.constant(types),
              fc.subarray(types, { minLength: 1 }) // subscribed types (subset)
            )
          ),
          fc.integer({ min: 1, max: 5 }), // number of clients
          ([allTypes, subscribedTypes], clientCount) => {
            // Setup
            const service = new NotificationService(mockLogger);
            const connections: MockConnection[] = [];

            // Create clients subscribed to specific types
            for (let i = 0; i < clientCount; i++) {
              const conn = new MockConnection(`client-${i}`);
              service.registerClient(conn, `user-${i}`);
              service.subscribe(`client-${i}`, subscribedTypes);
              connections.push(conn);
            }

            // Execute: Send events for all types
            const events = allTypes.map(type => {
              if (type === NotificationEventType.MESSAGE_NEW) {
                return createNotificationEvent(type, {
                  messageId: 'msg-1',
                  messageBaseId: 'base-1',
                  messageBaseName: 'General',
                  subject: 'Test',
                  authorHandle: 'user',
                  createdAt: new Date().toISOString(),
                } as MessageNewPayload);
              } else if (type === NotificationEventType.USER_JOINED) {
                return createNotificationEvent(type, {
                  userId: 'user-1',
                  handle: 'testuser',
                  node: 1,
                } as UserJoinedPayload);
              } else {
                return createNotificationEvent(type, {
                  message: 'Test announcement',
                  priority: AnnouncementPriority.NORMAL,
                } as SystemAnnouncementPayload);
              }
            });

            events.forEach(event => service.broadcast(event));

            // Verify: Each client received only events they subscribed to
            for (const conn of connections) {
              const receivedEvents = conn.getParsedMessages();
              
              // Should receive exactly as many events as subscribed types
              expect(receivedEvents.length).toBe(subscribedTypes.length);
              
              // All received events should be of subscribed types
              for (const receivedEvent of receivedEvents) {
                expect(subscribedTypes).toContain(receivedEvent.type);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle client disconnections gracefully without affecting other clients', () => {
      fc.assert(
        fc.property(
          notificationEventArbitrary,
          fc.integer({ min: 2, max: 10 }), // total clients
          fc.integer({ min: 1, max: 5 }),  // clients to disconnect
          (event, totalClients, disconnectCount) => {
            // Ensure we don't disconnect more than we have
            const actualDisconnectCount = Math.min(disconnectCount, totalClients - 1);
            
            // Setup
            const service = new NotificationService(mockLogger);
            const connections: MockConnection[] = [];

            // Create clients
            for (let i = 0; i < totalClients; i++) {
              const conn = new MockConnection(`client-${i}`);
              service.registerClient(conn, `user-${i}`);
              service.subscribe(`client-${i}`, [event.type]);
              connections.push(conn);
            }

            // Disconnect some clients
            for (let i = 0; i < actualDisconnectCount; i++) {
              connections[i].isOpen = false;
            }

            // Execute
            service.broadcast(event);

            // Verify: Only open connections received the event
            for (let i = 0; i < totalClients; i++) {
              if (i < actualDisconnectCount) {
                // Disconnected clients should not receive
                expect(connections[i].sentMessages.length).toBe(0);
              } else {
                // Connected clients should receive
                expect(connections[i].sentMessages.length).toBe(1);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve event data integrity across all deliveries', () => {
      fc.assert(
        fc.property(
          messageNewPayloadArbitrary,
          fc.integer({ min: 1, max: 10 }), // number of clients
          (payload, clientCount) => {
            // Setup
            const service = new NotificationService(mockLogger);
            const connections: MockConnection[] = [];

            for (let i = 0; i < clientCount; i++) {
              const conn = new MockConnection(`client-${i}`);
              service.registerClient(conn, `user-${i}`);
              service.subscribe(`client-${i}`, [NotificationEventType.MESSAGE_NEW]);
              connections.push(conn);
            }

            // Execute
            const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload);
            service.broadcast(event);

            // Verify: All clients received identical data
            const receivedPayloads = connections.map(conn => 
              conn.getParsedMessages()[0].data
            );

            // All payloads should be identical to the original
            for (const receivedPayload of receivedPayloads) {
              expect(receivedPayload).toEqual(payload);
            }

            // All payloads should be identical to each other
            for (let i = 1; i < receivedPayloads.length; i++) {
              expect(receivedPayloads[i]).toEqual(receivedPayloads[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include valid timestamps in all delivered notifications', () => {
      fc.assert(
        fc.property(
          notificationEventArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (event, clientCount) => {
            // Setup
            const service = new NotificationService(mockLogger);
            const connections: MockConnection[] = [];

            for (let i = 0; i < clientCount; i++) {
              const conn = new MockConnection(`client-${i}`);
              service.registerClient(conn, `user-${i}`);
              service.subscribe(`client-${i}`, [event.type]);
              connections.push(conn);
            }

            // Execute
            const beforeBroadcast = new Date();
            service.broadcast(event);
            const afterBroadcast = new Date();

            // Verify: All timestamps are valid and within reasonable range
            for (const conn of connections) {
              const receivedEvent = conn.getParsedMessages()[0];
              const timestamp = new Date(receivedEvent.timestamp);

              // Timestamp should be valid
              expect(timestamp.getTime()).not.toBeNaN();
              
              // Timestamp should be in ISO 8601 format
              expect(timestamp.toISOString()).toBe(receivedEvent.timestamp);
              
              // Timestamp should be between before and after broadcast
              expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeBroadcast.getTime() - 1000);
              expect(timestamp.getTime()).toBeLessThanOrEqual(afterBroadcast.getTime() + 1000);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
