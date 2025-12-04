/**
 * Tests for notification event types
 * 
 * These tests verify that the notification event type system works correctly.
 */

import { describe, it, expect } from 'vitest';
import {
  NotificationEventType,
  createNotificationEvent,
  isEventType,
  MessageNewPayload,
  UserJoinedPayload,
  SystemAnnouncementPayload,
  AnnouncementPriority,
  NotificationErrorCode,
} from './types';
import {
  isBroadcastEvent,
  isFilterableEvent,
  getFilterFields,
  isValidEventType,
  getEventCategory,
  MESSAGE_EVENTS,
  USER_EVENTS,
  SYSTEM_EVENTS,
  DOOR_EVENTS,
} from './constants';

describe('Notification Event Types', () => {
  describe('createNotificationEvent', () => {
    it('should create a properly formatted event', () => {
      const payload: MessageNewPayload = {
        messageId: 'msg-001',
        messageBaseId: 'base-general',
        messageBaseName: 'General Discussion',
        subject: 'Test Message',
        authorHandle: 'testuser',
        createdAt: '2025-12-01T10:00:00.000Z',
      };

      const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, payload);

      expect(event.type).toBe(NotificationEventType.MESSAGE_NEW);
      expect(event.timestamp).toBeDefined();
      expect(event.data).toEqual(payload);
      expect(new Date(event.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should create events with different payload types', () => {
      const userPayload: UserJoinedPayload = {
        userId: 'user-123',
        handle: 'newuser',
        node: 1,
      };

      const event = createNotificationEvent(NotificationEventType.USER_JOINED, userPayload);

      expect(event.type).toBe(NotificationEventType.USER_JOINED);
      expect(event.data).toEqual(userPayload);
    });

    it('should create system announcement with priority', () => {
      const payload: SystemAnnouncementPayload = {
        message: 'System maintenance in 10 minutes',
        priority: AnnouncementPriority.HIGH,
        expiresAt: '2025-12-01T11:00:00.000Z',
      };

      const event = createNotificationEvent(NotificationEventType.SYSTEM_ANNOUNCEMENT, payload);

      expect(event.type).toBe(NotificationEventType.SYSTEM_ANNOUNCEMENT);
      expect(event.data.priority).toBe(AnnouncementPriority.HIGH);
    });
  });

  describe('isEventType', () => {
    it('should correctly identify event types', () => {
      const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, {
        messageId: 'msg-001',
        messageBaseId: 'base-general',
        messageBaseName: 'General',
        subject: 'Test',
        authorHandle: 'user',
        createdAt: '2025-12-01T10:00:00.000Z',
      });

      expect(isEventType<MessageNewPayload>(event, NotificationEventType.MESSAGE_NEW)).toBe(true);
      expect(isEventType<UserJoinedPayload>(event, NotificationEventType.USER_JOINED)).toBe(false);
    });
  });

  describe('Event Type Constants', () => {
    it('should have all message event types', () => {
      expect(MESSAGE_EVENTS).toContain(NotificationEventType.MESSAGE_NEW);
      expect(MESSAGE_EVENTS).toContain(NotificationEventType.MESSAGE_REPLY);
    });

    it('should have all user event types', () => {
      expect(USER_EVENTS).toContain(NotificationEventType.USER_JOINED);
      expect(USER_EVENTS).toContain(NotificationEventType.USER_LEFT);
    });

    it('should have all system event types', () => {
      expect(SYSTEM_EVENTS).toContain(NotificationEventType.SYSTEM_ANNOUNCEMENT);
      expect(SYSTEM_EVENTS).toContain(NotificationEventType.SYSTEM_SHUTDOWN);
    });

    it('should have all door event types', () => {
      expect(DOOR_EVENTS).toContain(NotificationEventType.DOOR_UPDATE);
      expect(DOOR_EVENTS).toContain(NotificationEventType.DOOR_ENTERED);
      expect(DOOR_EVENTS).toContain(NotificationEventType.DOOR_EXITED);
    });
  });

  describe('isBroadcastEvent', () => {
    it('should identify broadcast events correctly', () => {
      expect(isBroadcastEvent(NotificationEventType.USER_JOINED)).toBe(true);
      expect(isBroadcastEvent(NotificationEventType.USER_LEFT)).toBe(true);
      expect(isBroadcastEvent(NotificationEventType.SYSTEM_ANNOUNCEMENT)).toBe(true);
      expect(isBroadcastEvent(NotificationEventType.SYSTEM_SHUTDOWN)).toBe(true);
      expect(isBroadcastEvent(NotificationEventType.DOOR_ENTERED)).toBe(true);
      expect(isBroadcastEvent(NotificationEventType.DOOR_EXITED)).toBe(true);
    });

    it('should identify non-broadcast events correctly', () => {
      expect(isBroadcastEvent(NotificationEventType.MESSAGE_NEW)).toBe(false);
      expect(isBroadcastEvent(NotificationEventType.MESSAGE_REPLY)).toBe(false);
      expect(isBroadcastEvent(NotificationEventType.DOOR_UPDATE)).toBe(false);
    });
  });

  describe('isFilterableEvent', () => {
    it('should identify filterable events correctly', () => {
      expect(isFilterableEvent(NotificationEventType.MESSAGE_NEW)).toBe(true);
      expect(isFilterableEvent(NotificationEventType.MESSAGE_REPLY)).toBe(true);
      expect(isFilterableEvent(NotificationEventType.DOOR_UPDATE)).toBe(true);
    });

    it('should identify non-filterable events correctly', () => {
      expect(isFilterableEvent(NotificationEventType.USER_JOINED)).toBe(false);
      expect(isFilterableEvent(NotificationEventType.SYSTEM_ANNOUNCEMENT)).toBe(false);
    });
  });

  describe('getFilterFields', () => {
    it('should return correct filter fields for message.new', () => {
      const fields = getFilterFields(NotificationEventType.MESSAGE_NEW);
      expect(fields).toContain('messageBaseId');
    });

    it('should return correct filter fields for message.reply', () => {
      const fields = getFilterFields(NotificationEventType.MESSAGE_REPLY);
      expect(fields).toContain('messageBaseId');
      expect(fields).toContain('parentId');
    });

    it('should return correct filter fields for door.update', () => {
      const fields = getFilterFields(NotificationEventType.DOOR_UPDATE);
      expect(fields).toContain('sessionId');
      expect(fields).toContain('doorId');
    });

    it('should return empty array for non-filterable events', () => {
      const fields = getFilterFields(NotificationEventType.USER_JOINED);
      expect(fields).toEqual([]);
    });
  });

  describe('isValidEventType', () => {
    it('should validate correct event types', () => {
      expect(isValidEventType('message.new')).toBe(true);
      expect(isValidEventType('user.joined')).toBe(true);
      expect(isValidEventType('system.announcement')).toBe(true);
      expect(isValidEventType('door.update')).toBe(true);
    });

    it('should reject invalid event types', () => {
      expect(isValidEventType('invalid.event')).toBe(false);
      expect(isValidEventType('message.invalid')).toBe(false);
      expect(isValidEventType('')).toBe(false);
    });
  });

  describe('getEventCategory', () => {
    it('should return correct category for message events', () => {
      expect(getEventCategory(NotificationEventType.MESSAGE_NEW)).toBe('message');
      expect(getEventCategory(NotificationEventType.MESSAGE_REPLY)).toBe('message');
    });

    it('should return correct category for user events', () => {
      expect(getEventCategory(NotificationEventType.USER_JOINED)).toBe('user');
      expect(getEventCategory(NotificationEventType.USER_LEFT)).toBe('user');
    });

    it('should return correct category for system events', () => {
      expect(getEventCategory(NotificationEventType.SYSTEM_ANNOUNCEMENT)).toBe('system');
      expect(getEventCategory(NotificationEventType.SYSTEM_SHUTDOWN)).toBe('system');
    });

    it('should return correct category for door events', () => {
      expect(getEventCategory(NotificationEventType.DOOR_UPDATE)).toBe('door');
      expect(getEventCategory(NotificationEventType.DOOR_ENTERED)).toBe('door');
      expect(getEventCategory(NotificationEventType.DOOR_EXITED)).toBe('door');
    });

    it('should return correct category for connection events', () => {
      expect(getEventCategory(NotificationEventType.AUTH_SUCCESS)).toBe('connection');
      expect(getEventCategory(NotificationEventType.HEARTBEAT)).toBe('connection');
    });
  });

  describe('Error Codes', () => {
    it('should have all error codes defined', () => {
      expect(NotificationErrorCode.CONNECTION_ERROR).toBe('CONNECTION_ERROR');
      expect(NotificationErrorCode.SUBSCRIPTION_ERROR).toBe('SUBSCRIPTION_ERROR');
      expect(NotificationErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(NotificationErrorCode.AUTHENTICATION_REQUIRED).toBe('AUTHENTICATION_REQUIRED');
      expect(NotificationErrorCode.INVALID_EVENT_TYPE).toBe('INVALID_EVENT_TYPE');
      expect(NotificationErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });

  describe('Announcement Priority', () => {
    it('should have all priority levels defined', () => {
      expect(AnnouncementPriority.LOW).toBe('low');
      expect(AnnouncementPriority.NORMAL).toBe('normal');
      expect(AnnouncementPriority.HIGH).toBe('high');
      expect(AnnouncementPriority.CRITICAL).toBe('critical');
    });
  });
});
