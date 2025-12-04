/**
 * WebSocket Notification System Constants
 * 
 * This module provides constant values and configuration for the notification system.
 * 
 * Requirements: 17.1 - WebSocket Notification System
 */

import { NotificationEventType } from './types';

// ============================================================================
// Event Type Groups
// ============================================================================

/**
 * Message-related event types
 */
export const MESSAGE_EVENTS = [
  NotificationEventType.MESSAGE_NEW,
  NotificationEventType.MESSAGE_REPLY,
] as const;

/**
 * User-related event types
 */
export const USER_EVENTS = [
  NotificationEventType.USER_JOINED,
  NotificationEventType.USER_LEFT,
] as const;

/**
 * System-related event types
 */
export const SYSTEM_EVENTS = [
  NotificationEventType.SYSTEM_ANNOUNCEMENT,
  NotificationEventType.SYSTEM_SHUTDOWN,
] as const;

/**
 * Door game-related event types
 */
export const DOOR_EVENTS = [
  NotificationEventType.DOOR_UPDATE,
  NotificationEventType.DOOR_ENTERED,
  NotificationEventType.DOOR_EXITED,
] as const;

/**
 * Connection-related event types
 */
export const CONNECTION_EVENTS = [
  NotificationEventType.AUTH_SUCCESS,
  NotificationEventType.AUTH_ERROR,
  NotificationEventType.SUBSCRIPTION_SUCCESS,
  NotificationEventType.SUBSCRIPTION_ERROR,
  NotificationEventType.HEARTBEAT,
  NotificationEventType.ERROR,
] as const;

/**
 * All event types that should be broadcast to all clients (no filtering)
 */
export const BROADCAST_EVENTS = [
  NotificationEventType.USER_JOINED,
  NotificationEventType.USER_LEFT,
  NotificationEventType.SYSTEM_ANNOUNCEMENT,
  NotificationEventType.SYSTEM_SHUTDOWN,
  NotificationEventType.DOOR_ENTERED,
  NotificationEventType.DOOR_EXITED,
] as const;

/**
 * All event types that support filtering
 */
export const FILTERABLE_EVENTS = [
  NotificationEventType.MESSAGE_NEW,
  NotificationEventType.MESSAGE_REPLY,
  NotificationEventType.DOOR_UPDATE,
] as const;

/**
 * All valid event types
 */
export const ALL_EVENT_TYPES = [
  ...MESSAGE_EVENTS,
  ...USER_EVENTS,
  ...SYSTEM_EVENTS,
  ...DOOR_EVENTS,
] as const;

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Maximum number of concurrent WebSocket connections
 */
export const MAX_CONNECTIONS = 1000;

/**
 * Maximum number of event subscriptions per client
 */
export const MAX_SUBSCRIPTIONS_PER_CLIENT = 50;

/**
 * Maximum number of subscription requests per minute per client
 */
export const MAX_SUBSCRIPTION_REQUESTS_PER_MINUTE = 10;

/**
 * Maximum number of events per minute per client
 */
export const MAX_EVENTS_PER_MINUTE = 100;

/**
 * Heartbeat interval in milliseconds (30 seconds)
 */
export const HEARTBEAT_INTERVAL_MS = 30000;

/**
 * Client timeout in milliseconds if no pong received (60 seconds)
 */
export const CLIENT_TIMEOUT_MS = 60000;

/**
 * Unauthenticated connection timeout in milliseconds (10 seconds)
 */
export const UNAUTHENTICATED_TIMEOUT_MS = 10000;

/**
 * Event batching window in milliseconds (100ms)
 */
export const EVENT_BATCH_WINDOW_MS = 100;

/**
 * Maximum batch size for events
 */
export const MAX_BATCH_SIZE = 10;

// ============================================================================
// Filter Field Mappings
// ============================================================================

/**
 * Maps event types to their supported filter fields
 */
export const EVENT_FILTER_FIELDS: Record<string, string[]> = {
  [NotificationEventType.MESSAGE_NEW]: ['messageBaseId'],
  [NotificationEventType.MESSAGE_REPLY]: ['messageBaseId', 'parentId'],
  [NotificationEventType.DOOR_UPDATE]: ['sessionId', 'doorId'],
};

/**
 * Maps filter fields to the data field they should match against
 */
export const FILTER_FIELD_MAPPINGS: Record<string, string> = {
  messageBaseId: 'messageBaseId',
  parentId: 'parentId',
  sessionId: 'sessionId',
  userId: 'userId',
  doorId: 'doorId',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an event type is a broadcast event
 */
export function isBroadcastEvent(eventType: NotificationEventType): boolean {
  return BROADCAST_EVENTS.includes(eventType as any);
}

/**
 * Check if an event type supports filtering
 */
export function isFilterableEvent(eventType: NotificationEventType): boolean {
  return FILTERABLE_EVENTS.includes(eventType as any);
}

/**
 * Get supported filter fields for an event type
 */
export function getFilterFields(eventType: NotificationEventType): string[] {
  return EVENT_FILTER_FIELDS[eventType] || [];
}

/**
 * Check if an event type is valid
 */
export function isValidEventType(eventType: string): eventType is NotificationEventType {
  return Object.values(NotificationEventType).includes(eventType as NotificationEventType);
}

/**
 * Get event type category
 */
export function getEventCategory(eventType: NotificationEventType): string {
  if (MESSAGE_EVENTS.includes(eventType as any)) return 'message';
  if (USER_EVENTS.includes(eventType as any)) return 'user';
  if (SYSTEM_EVENTS.includes(eventType as any)) return 'system';
  if (DOOR_EVENTS.includes(eventType as any)) return 'door';
  if (CONNECTION_EVENTS.includes(eventType as any)) return 'connection';
  return 'unknown';
}
