/**
 * NotificationService Tests
 * 
 * Tests for the notification broadcasting and subscription system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './NotificationService';
import { IConnection } from '../connection/IConnection';
import {
  NotificationEventType,
  createNotificationEvent,
  MessageNewPayload,
  UserJoinedPayload,
  NotificationErrorCode,
} from './types';

// Mock connection implementation
class MockConnection implements IConnection {
  public readonly id: string;
  public isOpen: boolean = true;
  private dataCallback?: (data: string) => void;
  private closeCallback?: () => void;
  private errorCallback?: (error: Error) => void;
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
    this.dataCallback = callback;
  }

  onClose(callback: () => void): void {
    this.closeCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  // Test helper to trigger close
  triggerClose(): void {
    if (this.closeCallback) {
      this.closeCallback();
    }
  }
}

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn(() => mockLogger),
} as any;

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService(mockLogger);
    vi.clearAllMocks();
  });

  describe('Client Management', () => {
    it('should register a new client', () => {
      const connection = new MockConnection('conn-1');
      
      service.registerClient(connection);
      
      expect(service.isClientRegistered('conn-1')).toBe(true);
      expect(service.getClientCount()).toBe(1);
    });

    it('should register a client with user ID', () => {
      const connection = new MockConnection('conn-1');
      
      service.registerClient(connection, 'user-123');
      
      const client = service.getClient('conn-1');
      expect(client).toBeDefined();
      expect(client?.userId).toBe('user-123');
      expect(client?.authenticated).toBe(true);
    });

    it('should unregister a client', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      service.unregisterClient('conn-1');
      
      expect(service.isClientRegistered('conn-1')).toBe(false);
      expect(service.getClientCount()).toBe(0);
    });

    it('should automatically unregister client on connection close', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      connection.triggerClose();
      
      expect(service.isClientRegistered('conn-1')).toBe(false);
    });

    it('should authenticate a client', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      service.authenticateClient('conn-1', 'user-456');
      
      const client = service.getClient('conn-1');
      expect(client?.userId).toBe('user-456');
      expect(client?.authenticated).toBe(true);
    });

    it('should get all clients', () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      
      service.registerClient(conn1);
      service.registerClient(conn2);
      
      const clients = service.getAllClients();
      expect(clients).toHaveLength(2);
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe client to event type', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      const result = service.subscribe('conn-1', [NotificationEventType.MESSAGE_NEW]);
      
      expect(result.success).toContain(NotificationEventType.MESSAGE_NEW);
      expect(result.failed).toHaveLength(0);
      
      const subscriptions = service.getClientSubscriptions('conn-1');
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].eventType).toBe(NotificationEventType.MESSAGE_NEW);
    });

    it('should subscribe client to multiple event types', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      const result = service.subscribe('conn-1', [
        NotificationEventType.MESSAGE_NEW,
        NotificationEventType.USER_JOINED,
      ]);
      
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      
      const subscriptions = service.getClientSubscriptions('conn-1');
      expect(subscriptions).toHaveLength(2);
    });

    it('should subscribe with filter', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      const result = service.subscribe('conn-1', [
        {
          type: NotificationEventType.MESSAGE_NEW,
          filter: { messageBaseId: 'base-1' },
        },
      ]);
      
      expect(result.success).toHaveLength(1);
      
      const subscriptions = service.getClientSubscriptions('conn-1');
      expect(subscriptions[0].filter).toEqual({ messageBaseId: 'base-1' });
    });

    it('should reject invalid event type', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      const result = service.subscribe('conn-1', ['invalid.event.type']);
      
      expect(result.success).toHaveLength(0);
      expect(result.failed).toContain('invalid.event.type');
    });

    it('should reject subscription for non-existent client', () => {
      const result = service.subscribe('non-existent', [NotificationEventType.MESSAGE_NEW]);
      
      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
    });

    it('should unsubscribe client from event type', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      service.subscribe('conn-1', [NotificationEventType.MESSAGE_NEW]);
      
      service.unsubscribe('conn-1', [NotificationEventType.MESSAGE_NEW]);
      
      const subscriptions = service.getClientSubscriptions('conn-1');
      expect(subscriptions).toHaveLength(0);
    });

    it('should clean up subscriptions when client unregisters', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      service.subscribe('conn-1', [
        NotificationEventType.MESSAGE_NEW,
        NotificationEventType.USER_JOINED,
      ]);
      
      service.unregisterClient('conn-1');
      
      expect(service.getSubscriptionCount(NotificationEventType.MESSAGE_NEW)).toBe(0);
      expect(service.getSubscriptionCount(NotificationEventType.USER_JOINED)).toBe(0);
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast event to subscribed client', async () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      service.subscribe('conn-1', [NotificationEventType.MESSAGE_NEW]);
      
      const payload: MessageNewPayload = {
        messageId: 'msg-1',
        messageBaseId: 'base-1',
        messageBaseName: 'General',
        subject: 'Test Message',
        authorHandle: 'testuser',
        createdAt: new Date().toISOString(),
      };
      
      const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload);
      await service.broadcast(event);
      
      expect(connection.sentMessages).toHaveLength(1);
      const sentEvent = JSON.parse(connection.sentMessages[0]);
      expect(sentEvent.type).toBe(NotificationEventType.MESSAGE_NEW);
      expect(sentEvent.data.messageId).toBe('msg-1');
    });

    it('should not broadcast to unsubscribed clients', async () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      // Not subscribed to MESSAGE_NEW
      
      const payload: MessageNewPayload = {
        messageId: 'msg-1',
        messageBaseId: 'base-1',
        messageBaseName: 'General',
        subject: 'Test Message',
        authorHandle: 'testuser',
        createdAt: new Date().toISOString(),
      };
      
      const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload);
      await service.broadcast(event);
      
      expect(connection.sentMessages).toHaveLength(0);
    });

    it('should broadcast to multiple subscribed clients', async () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      
      service.registerClient(conn1);
      service.registerClient(conn2);
      service.subscribe('conn-1', [NotificationEventType.USER_JOINED]);
      service.subscribe('conn-2', [NotificationEventType.USER_JOINED]);
      
      const payload: UserJoinedPayload = {
        userId: 'user-1',
        handle: 'testuser',
        node: 1,
      };
      
      const event = createNotificationEvent(NotificationEventType.USER_JOINED, payload);
      await service.broadcast(event);
      
      expect(conn1.sentMessages).toHaveLength(1);
      expect(conn2.sentMessages).toHaveLength(1);
    });

    it('should filter events based on subscription filter', async () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      
      service.registerClient(conn1);
      service.registerClient(conn2);
      
      // conn-1 subscribes to base-1 only
      service.subscribe('conn-1', [
        {
          type: NotificationEventType.MESSAGE_NEW,
          filter: { messageBaseId: 'base-1' },
        },
      ]);
      
      // conn-2 subscribes to base-2 only
      service.subscribe('conn-2', [
        {
          type: NotificationEventType.MESSAGE_NEW,
          filter: { messageBaseId: 'base-2' },
        },
      ]);
      
      // Send message to base-1
      const payload: MessageNewPayload = {
        messageId: 'msg-1',
        messageBaseId: 'base-1',
        messageBaseName: 'General',
        subject: 'Test Message',
        authorHandle: 'testuser',
        createdAt: new Date().toISOString(),
      };
      
      const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload);
      await service.broadcast(event);
      
      // Only conn-1 should receive it
      expect(conn1.sentMessages).toHaveLength(1);
      expect(conn2.sentMessages).toHaveLength(0);
    });

    it('should broadcast to specific client', async () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      
      service.registerClient(conn1);
      service.registerClient(conn2);
      
      const payload: UserJoinedPayload = {
        userId: 'user-1',
        handle: 'testuser',
        node: 1,
      };
      
      const event = createNotificationEvent(NotificationEventType.USER_JOINED, payload);
      await service.broadcastToClient('conn-1', event);
      
      expect(conn1.sentMessages).toHaveLength(1);
      expect(conn2.sentMessages).toHaveLength(0);
    });

    it('should broadcast to authenticated clients only', async () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      const conn3 = new MockConnection('conn-3');
      
      service.registerClient(conn1, 'user-1'); // authenticated
      service.registerClient(conn2); // not authenticated
      service.registerClient(conn3, 'user-3'); // authenticated
      
      const payload: UserJoinedPayload = {
        userId: 'user-1',
        handle: 'testuser',
        node: 1,
      };
      
      const event = createNotificationEvent(NotificationEventType.USER_JOINED, payload);
      await service.broadcastToAuthenticated(event);
      
      expect(conn1.sentMessages).toHaveLength(1);
      expect(conn2.sentMessages).toHaveLength(0);
      expect(conn3.sentMessages).toHaveLength(1);
    });

    it('should not send to closed connections', async () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      service.subscribe('conn-1', [NotificationEventType.MESSAGE_NEW]);
      
      connection.isOpen = false;
      
      const payload: MessageNewPayload = {
        messageId: 'msg-1',
        messageBaseId: 'base-1',
        messageBaseName: 'General',
        subject: 'Test Message',
        authorHandle: 'testuser',
        createdAt: new Date().toISOString(),
      };
      
      const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload);
      await service.broadcast(event);
      
      // Should not throw, but also should not send
      expect(connection.sentMessages).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should send error event to client', async () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      await service.sendError(
        'conn-1',
        NotificationErrorCode.SUBSCRIPTION_ERROR,
        'Test error message'
      );
      
      expect(connection.sentMessages).toHaveLength(1);
      const sentEvent = JSON.parse(connection.sentMessages[0]);
      expect(sentEvent.type).toBe(NotificationEventType.ERROR);
      expect(sentEvent.data.code).toBe(NotificationErrorCode.SUBSCRIPTION_ERROR);
      expect(sentEvent.data.message).toBe('Test error message');
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      
      service.registerClient(conn1, 'user-1');
      service.registerClient(conn2);
      
      service.subscribe('conn-1', [
        NotificationEventType.MESSAGE_NEW,
        NotificationEventType.USER_JOINED,
      ]);
      service.subscribe('conn-2', [NotificationEventType.MESSAGE_NEW]);
      
      const stats = service.getStats();
      
      expect(stats.clientCount).toBe(2);
      expect(stats.authenticatedCount).toBe(1);
      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.eventTypeCount).toBe(2);
    });

    it('should return subscription count for event type', () => {
      const conn1 = new MockConnection('conn-1');
      const conn2 = new MockConnection('conn-2');
      
      service.registerClient(conn1);
      service.registerClient(conn2);
      
      service.subscribe('conn-1', [NotificationEventType.MESSAGE_NEW]);
      service.subscribe('conn-2', [NotificationEventType.MESSAGE_NEW]);
      
      const count = service.getSubscriptionCount(NotificationEventType.MESSAGE_NEW);
      expect(count).toBe(2);
    });

    it('should return active event types', () => {
      const connection = new MockConnection('conn-1');
      service.registerClient(connection);
      
      service.subscribe('conn-1', [
        NotificationEventType.MESSAGE_NEW,
        NotificationEventType.USER_JOINED,
      ]);
      
      const activeTypes = service.getActiveEventTypes();
      expect(activeTypes).toHaveLength(2);
      expect(activeTypes).toContain(NotificationEventType.MESSAGE_NEW);
      expect(activeTypes).toContain(NotificationEventType.USER_JOINED);
    });
  });
});
