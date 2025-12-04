/**
 * WebSocket Notification System Types
 * 
 * This module defines the event schema, event type constants, and payload structures
 * for the real-time notification system.
 * 
 * Requirements: 17.1 - WebSocket Notification System
 */

// ============================================================================
// Base Event Schema
// ============================================================================

/**
 * Base notification event structure
 * All notification events follow this schema
 */
export interface NotificationEvent<T = any> {
  /** Event type identifier */
  type: NotificationEventType;
  
  /** ISO 8601 timestamp when the event was created */
  timestamp: string;
  
  /** Event-specific payload data */
  data: T;
}

// ============================================================================
// Event Type Constants
// ============================================================================

/**
 * All supported notification event types
 */
export enum NotificationEventType {
  // Message Events
  MESSAGE_NEW = 'message.new',
  MESSAGE_REPLY = 'message.reply',
  
  // User Events
  USER_JOINED = 'user.joined',
  USER_LEFT = 'user.left',
  
  // System Events
  SYSTEM_ANNOUNCEMENT = 'system.announcement',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  
  // Door Game Events
  DOOR_UPDATE = 'door.update',
  DOOR_ENTERED = 'door.entered',
  DOOR_EXITED = 'door.exited',
  
  // Connection Events
  AUTH_SUCCESS = 'auth.success',
  AUTH_ERROR = 'auth.error',
  SUBSCRIPTION_SUCCESS = 'subscription.success',
  SUBSCRIPTION_ERROR = 'subscription.error',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
}

// ============================================================================
// Message Event Payloads
// ============================================================================

/**
 * Payload for message.new event
 * Fired when a new message is posted to a message base
 */
export interface MessageNewPayload {
  /** Unique identifier of the message */
  messageId: string;
  
  /** Unique identifier of the message base */
  messageBaseId: string;
  
  /** Name of the message base */
  messageBaseName: string;
  
  /** Subject line of the message */
  subject: string;
  
  /** Handle of the message author */
  authorHandle: string;
  
  /** ISO 8601 timestamp when the message was created */
  createdAt: string;
}

/**
 * Payload for message.reply event
 * Fired when a reply is posted to an existing message
 */
export interface MessageReplyPayload {
  /** Unique identifier of the reply message */
  messageId: string;
  
  /** Unique identifier of the parent message */
  parentId: string;
  
  /** Unique identifier of the message base */
  messageBaseId: string;
  
  /** Subject line of the reply */
  subject: string;
  
  /** Handle of the reply author */
  authorHandle: string;
  
  /** ISO 8601 timestamp when the reply was created */
  createdAt: string;
}

// ============================================================================
// User Event Payloads
// ============================================================================

/**
 * Payload for user.joined event
 * Fired when a user connects to the BBS
 */
export interface UserJoinedPayload {
  /** Unique identifier of the user */
  userId: string;
  
  /** User's handle/username */
  handle: string;
  
  /** Node number assigned to the user */
  node: number;
}

/**
 * Payload for user.left event
 * Fired when a user disconnects from the BBS
 */
export interface UserLeftPayload {
  /** Unique identifier of the user */
  userId: string;
  
  /** User's handle/username */
  handle: string;
  
  /** Node number that was freed */
  node: number;
}

// ============================================================================
// System Event Payloads
// ============================================================================

/**
 * Priority level for system announcements
 */
export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Payload for system.announcement event
 * Fired when the SysOp sends a system-wide announcement
 */
export interface SystemAnnouncementPayload {
  /** Announcement message text */
  message: string;
  
  /** Priority level of the announcement */
  priority: AnnouncementPriority;
  
  /** Optional ISO 8601 timestamp when the announcement expires */
  expiresAt?: string;
}

/**
 * Payload for system.shutdown event
 * Fired when the BBS is shutting down
 */
export interface SystemShutdownPayload {
  /** Shutdown message to display to users */
  message: string;
  
  /** Grace period in seconds before shutdown */
  gracePeriod: number;
}

// ============================================================================
// Door Game Event Payloads
// ============================================================================

/**
 * Payload for door.update event
 * Fired when door game state changes
 */
export interface DoorUpdatePayload {
  /** Unique identifier of the door game */
  doorId: string;
  
  /** Session identifier for this door game instance */
  sessionId: string;
  
  /** Output text to display to the user */
  output: string;
  
  /** Whether the door game session is complete */
  isComplete: boolean;
}

/**
 * Payload for door.entered event
 * Fired when a user enters a door game
 */
export interface DoorEnteredPayload {
  /** Unique identifier of the door game */
  doorId: string;
  
  /** Name of the door game */
  doorName: string;
  
  /** Unique identifier of the user */
  userId: string;
  
  /** User's handle/username */
  handle: string;
}

/**
 * Payload for door.exited event
 * Fired when a user exits a door game
 */
export interface DoorExitedPayload {
  /** Unique identifier of the door game */
  doorId: string;
  
  /** Unique identifier of the user */
  userId: string;
  
  /** User's handle/username */
  handle: string;
}

// ============================================================================
// Connection Event Payloads
// ============================================================================

/**
 * Payload for auth.success event
 * Sent when WebSocket authentication succeeds
 */
export interface AuthSuccessPayload {
  /** Unique identifier of the authenticated user */
  userId: string;
  
  /** User's handle/username */
  handle: string;
}

/**
 * Payload for auth.error event
 * Sent when WebSocket authentication fails
 */
export interface AuthErrorPayload {
  /** Error message describing the authentication failure */
  error: string;
}

/**
 * Payload for subscription.success event
 * Sent when event subscription succeeds
 */
export interface SubscriptionSuccessPayload {
  /** List of event types successfully subscribed to */
  events: string[];
}

/**
 * Payload for subscription.error event
 * Sent when event subscription fails
 */
export interface SubscriptionErrorPayload {
  /** Error message describing the subscription failure */
  error: string;
  
  /** List of event types that failed to subscribe */
  failedEvents?: string[];
}

/**
 * Payload for heartbeat event
 * Sent periodically to keep connection alive
 */
export interface HeartbeatPayload {
  // No additional data needed - timestamp is in base event
}

/**
 * Error codes for notification system errors
 */
export enum NotificationErrorCode {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Payload for error event
 * Sent when an error occurs in the notification system
 */
export interface ErrorPayload {
  /** Error code for programmatic handling */
  code: NotificationErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional additional error details */
  details?: any;
}

// ============================================================================
// Typed Event Helpers
// ============================================================================

/**
 * Type-safe notification event creators
 * These ensure the correct payload type is used for each event type
 */

export type MessageNewEvent = NotificationEvent<MessageNewPayload>;
export type MessageReplyEvent = NotificationEvent<MessageReplyPayload>;
export type UserJoinedEvent = NotificationEvent<UserJoinedPayload>;
export type UserLeftEvent = NotificationEvent<UserLeftPayload>;
export type SystemAnnouncementEvent = NotificationEvent<SystemAnnouncementPayload>;
export type SystemShutdownEvent = NotificationEvent<SystemShutdownPayload>;
export type DoorUpdateEvent = NotificationEvent<DoorUpdatePayload>;
export type DoorEnteredEvent = NotificationEvent<DoorEnteredPayload>;
export type DoorExitedEvent = NotificationEvent<DoorExitedPayload>;
export type AuthSuccessEvent = NotificationEvent<AuthSuccessPayload>;
export type AuthErrorEvent = NotificationEvent<AuthErrorPayload>;
export type SubscriptionSuccessEvent = NotificationEvent<SubscriptionSuccessPayload>;
export type SubscriptionErrorEvent = NotificationEvent<SubscriptionErrorPayload>;
export type HeartbeatEvent = NotificationEvent<HeartbeatPayload>;
export type ErrorEvent = NotificationEvent<ErrorPayload>;

/**
 * Union type of all possible notification events
 */
export type AnyNotificationEvent =
  | MessageNewEvent
  | MessageReplyEvent
  | UserJoinedEvent
  | UserLeftEvent
  | SystemAnnouncementEvent
  | SystemShutdownEvent
  | DoorUpdateEvent
  | DoorEnteredEvent
  | DoorExitedEvent
  | AuthSuccessEvent
  | AuthErrorEvent
  | SubscriptionSuccessEvent
  | SubscriptionErrorEvent
  | HeartbeatEvent
  | ErrorEvent;

// ============================================================================
// Event Factory Functions
// ============================================================================

/**
 * Creates a properly formatted notification event with timestamp
 */
export function createNotificationEvent<T>(
  type: NotificationEventType,
  data: T
): NotificationEvent<T> {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Type guard to check if an event is of a specific type
 */
export function isEventType<T>(
  event: NotificationEvent,
  type: NotificationEventType
): event is NotificationEvent<T> {
  return event.type === type;
}

// ============================================================================
// Subscription Filter Types
// ============================================================================

/**
 * Filter criteria for event subscriptions
 * Allows clients to subscribe to specific subsets of events
 */
export interface EventFilter {
  /** Filter by message base ID (for message events) */
  messageBaseId?: string;
  
  /** Filter by parent message ID (for reply events) */
  parentId?: string;
  
  /** Filter by session ID (for door events) */
  sessionId?: string;
  
  /** Filter by user ID */
  userId?: string;
  
  /** Filter by door ID */
  doorId?: string;
}

/**
 * Subscription request with optional filters
 */
export interface EventSubscription {
  /** Event type to subscribe to */
  type: NotificationEventType | string;
  
  /** Optional filter criteria */
  filter?: EventFilter;
}

// ============================================================================
// Client Action Types
// ============================================================================

/**
 * Actions that clients can send to the server
 */
export enum ClientAction {
  AUTHENTICATE = 'authenticate',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PONG = 'pong',
}

/**
 * Client message for authentication
 */
export interface AuthenticateAction {
  action: ClientAction.AUTHENTICATE;
  token: string;
}

/**
 * Client message for subscribing to events
 */
export interface SubscribeAction {
  action: ClientAction.SUBSCRIBE;
  events: (string | EventSubscription)[];
}

/**
 * Client message for unsubscribing from events
 */
export interface UnsubscribeAction {
  action: ClientAction.UNSUBSCRIBE;
  events: string[];
}

/**
 * Client message for heartbeat response
 */
export interface PongAction {
  action: ClientAction.PONG;
}

/**
 * Union type of all client actions
 */
export type ClientMessage =
  | AuthenticateAction
  | SubscribeAction
  | UnsubscribeAction
  | PongAction;
