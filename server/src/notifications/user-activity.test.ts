/**
 * User Activity Notification Tests
 * 
 * Tests for user join/leave event broadcasting and system announcements.
 * 
 * Requirements: 17.1 - WebSocket Notification System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationService } from './NotificationService.js';
import { 
  NotificationEventType, 
  createNotificationEvent, 
  UserJoinedPayload, 
  UserLeftPayload,
  SystemAnnouncementPayload,
  AnnouncementPriority,
  DoorEnteredPayload,
  DoorExitedPayload
} from './types.js';
import { IConnection } from '../connection/IConnection.js';

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

// Mock connection
class MockConnection implements IConnection {
  id: string;
  isOpen: boolean = true;
  private dataHandlers: ((data: string) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];
  sentMessages: string[] = [];

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
    this.closeHandlers.forEach(handler => handler());
  }

  onData(callback: (data: string) => void): void {
    this.dataHandlers.push(callback);
  }

  onClose(callback: () => void): void {
    this.closeHandlers.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorHandlers.push(callback);
  }

  // Helper to simulate receiving data
  simulateData(data: string): void {
    this.dataHandlers.forEach(handler => handler(data));
  }

  // Helper to get last sent message as parsed JSON
  getLastMessage(): any {
    if (this.sentMessages.length === 0) return null;
    return JSON.parse(this.sentMessages[this.sentMessages.length - 1]);
  }
}

describe('User Activity Notifications', () => {
  let notificationService: NotificationService;
  let connection1: MockConnection;
  let connection2: MockConnection;

  beforeEach(() => {
    notificationService = new NotificationService(mockLogger);
    connection1 = new MockConnection('conn1');
    connection2 = new MockConnection('conn2');
  });

  describe('User Joined Events', () => {
    it('should broadcast user joined event to authenticated clients', async () => {
      // Register two authenticated clients
      notificationService.registerClient(connection1, 'user1');
      notificationService.registerClient(connection2, 'user2');
      notificationService.authenticateClient('conn1', 'user1');
      notificationService.authenticateClient('conn2', 'user2');

      // Create user joined event
      const userJoinedPayload: UserJoinedPayload = {
        userId: 'user3',
        handle: 'NewUser',
        node: 1,
      };
      const userJoinedEvent = createNotificationEvent(
        NotificationEventType.USER_JOINED,
        userJoinedPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(userJoinedEvent);

      // Verify both clients received the event
      expect(connection1.sentMessages.length).toBe(1);
      expect(connection2.sentMessages.length).toBe(1);

      const message1 = connection1.getLastMessage();
      expect(message1.type).toBe(NotificationEventType.USER_JOINED);
      expect(message1.data.userId).toBe('user3');
      expect(message1.data.handle).toBe('NewUser');
      expect(message1.data.node).toBe(1);
    });

    it('should not broadcast user joined event to unauthenticated clients', async () => {
      // Register one authenticated and one unauthenticated client
      notificationService.registerClient(connection1, 'user1');
      notificationService.registerClient(connection2);
      notificationService.authenticateClient('conn1', 'user1');

      // Create user joined event
      const userJoinedPayload: UserJoinedPayload = {
        userId: 'user2',
        handle: 'NewUser',
        node: 1,
      };
      const userJoinedEvent = createNotificationEvent(
        NotificationEventType.USER_JOINED,
        userJoinedPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(userJoinedEvent);

      // Verify only authenticated client received the event
      expect(connection1.sentMessages.length).toBe(1);
      expect(connection2.sentMessages.length).toBe(0);
    });
  });

  describe('User Left Events', () => {
    it('should broadcast user left event to authenticated clients', async () => {
      // Register two authenticated clients
      notificationService.registerClient(connection1, 'user1');
      notificationService.registerClient(connection2, 'user2');
      notificationService.authenticateClient('conn1', 'user1');
      notificationService.authenticateClient('conn2', 'user2');

      // Create user left event
      const userLeftPayload: UserLeftPayload = {
        userId: 'user3',
        handle: 'LeavingUser',
        node: 1,
      };
      const userLeftEvent = createNotificationEvent(
        NotificationEventType.USER_LEFT,
        userLeftPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(userLeftEvent);

      // Verify both clients received the event
      expect(connection1.sentMessages.length).toBe(1);
      expect(connection2.sentMessages.length).toBe(1);

      const message1 = connection1.getLastMessage();
      expect(message1.type).toBe(NotificationEventType.USER_LEFT);
      expect(message1.data.userId).toBe('user3');
      expect(message1.data.handle).toBe('LeavingUser');
      expect(message1.data.node).toBe(1);
    });
  });

  describe('System Announcements', () => {
    it('should broadcast system announcement to authenticated clients', async () => {
      // Register two authenticated clients
      notificationService.registerClient(connection1, 'user1');
      notificationService.registerClient(connection2, 'user2');
      notificationService.authenticateClient('conn1', 'user1');
      notificationService.authenticateClient('conn2', 'user2');

      // Create system announcement event
      const announcementPayload: SystemAnnouncementPayload = {
        message: 'Server maintenance in 10 minutes',
        priority: AnnouncementPriority.HIGH,
      };
      const announcementEvent = createNotificationEvent(
        NotificationEventType.SYSTEM_ANNOUNCEMENT,
        announcementPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(announcementEvent);

      // Verify both clients received the event
      expect(connection1.sentMessages.length).toBe(1);
      expect(connection2.sentMessages.length).toBe(1);

      const message1 = connection1.getLastMessage();
      expect(message1.type).toBe(NotificationEventType.SYSTEM_ANNOUNCEMENT);
      expect(message1.data.message).toBe('Server maintenance in 10 minutes');
      expect(message1.data.priority).toBe(AnnouncementPriority.HIGH);
    });

    it('should include expiration time in announcement if provided', async () => {
      // Register authenticated client
      notificationService.registerClient(connection1, 'user1');
      notificationService.authenticateClient('conn1', 'user1');

      // Create system announcement with expiration
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const announcementPayload: SystemAnnouncementPayload = {
        message: 'Limited time event!',
        priority: AnnouncementPriority.NORMAL,
        expiresAt,
      };
      const announcementEvent = createNotificationEvent(
        NotificationEventType.SYSTEM_ANNOUNCEMENT,
        announcementPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(announcementEvent);

      // Verify client received the event with expiration
      const message = connection1.getLastMessage();
      expect(message.data.expiresAt).toBe(expiresAt);
    });
  });

  describe('Door Game Events', () => {
    it('should broadcast door entered event to authenticated clients', async () => {
      // Register two authenticated clients
      notificationService.registerClient(connection1, 'user1');
      notificationService.registerClient(connection2, 'user2');
      notificationService.authenticateClient('conn1', 'user1');
      notificationService.authenticateClient('conn2', 'user2');

      // Create door entered event
      const doorEnteredPayload: DoorEnteredPayload = {
        doorId: 'the_oracle',
        doorName: 'The Oracle',
        userId: 'user1',
        handle: 'Player1',
      };
      const doorEnteredEvent = createNotificationEvent(
        NotificationEventType.DOOR_ENTERED,
        doorEnteredPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(doorEnteredEvent);

      // Verify both clients received the event
      expect(connection1.sentMessages.length).toBe(1);
      expect(connection2.sentMessages.length).toBe(1);

      const message1 = connection1.getLastMessage();
      expect(message1.type).toBe(NotificationEventType.DOOR_ENTERED);
      expect(message1.data.doorId).toBe('the_oracle');
      expect(message1.data.doorName).toBe('The Oracle');
      expect(message1.data.userId).toBe('user1');
      expect(message1.data.handle).toBe('Player1');
    });

    it('should broadcast door exited event to authenticated clients', async () => {
      // Register two authenticated clients
      notificationService.registerClient(connection1, 'user1');
      notificationService.registerClient(connection2, 'user2');
      notificationService.authenticateClient('conn1', 'user1');
      notificationService.authenticateClient('conn2', 'user2');

      // Create door exited event
      const doorExitedPayload: DoorExitedPayload = {
        doorId: 'the_oracle',
        userId: 'user1',
        handle: 'Player1',
      };
      const doorExitedEvent = createNotificationEvent(
        NotificationEventType.DOOR_EXITED,
        doorExitedPayload
      );

      // Broadcast event
      await notificationService.broadcastToAuthenticated(doorExitedEvent);

      // Verify both clients received the event
      expect(connection1.sentMessages.length).toBe(1);
      expect(connection2.sentMessages.length).toBe(1);

      const message1 = connection1.getLastMessage();
      expect(message1.type).toBe(NotificationEventType.DOOR_EXITED);
      expect(message1.data.doorId).toBe('the_oracle');
      expect(message1.data.userId).toBe('user1');
      expect(message1.data.handle).toBe('Player1');
    });
  });

  describe('Event Timestamp', () => {
    it('should include ISO 8601 timestamp in all events', async () => {
      // Register authenticated client
      notificationService.registerClient(connection1, 'user1');
      notificationService.authenticateClient('conn1', 'user1');

      // Create and broadcast event
      const userJoinedPayload: UserJoinedPayload = {
        userId: 'user2',
        handle: 'NewUser',
        node: 1,
      };
      const userJoinedEvent = createNotificationEvent(
        NotificationEventType.USER_JOINED,
        userJoinedPayload
      );

      await notificationService.broadcastToAuthenticated(userJoinedEvent);

      // Verify timestamp format
      const message = connection1.getLastMessage();
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe('string');
      
      // Verify it's a valid ISO 8601 date
      const date = new Date(message.timestamp);
      expect(date.toISOString()).toBe(message.timestamp);
    });
  });
});
