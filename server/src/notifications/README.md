# WebSocket Notification System

## Overview

The WebSocket notification system provides real-time event notifications to connected clients. This enables push-based updates without polling, complementing the REST API with real-time capabilities.

**Requirements**: 17.1 - WebSocket Notification System

## Event Schema

All notification events follow a consistent schema:

```typescript
interface NotificationEvent<T> {
  type: NotificationEventType;  // Event type identifier
  timestamp: string;             // ISO 8601 timestamp
  data: T;                       // Event-specific payload
}
```

### Example Event

```json
{
  "type": "message.new",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "data": {
    "messageId": "abc-123",
    "messageBaseId": "base-456",
    "messageBaseName": "General Discussion",
    "subject": "Hello World",
    "authorHandle": "user123",
    "createdAt": "2025-12-01T10:30:00.000Z"
  }
}
```

## Event Types

### Message Events

#### `message.new`
Fired when a new message is posted to a message base.

**Payload**: `MessageNewPayload`
- `messageId`: Unique identifier of the message
- `messageBaseId`: Unique identifier of the message base
- `messageBaseName`: Name of the message base
- `subject`: Subject line of the message
- `authorHandle`: Handle of the message author
- `createdAt`: ISO 8601 timestamp when created

**Subscription Filter**: `messageBaseId`

**Example**:
```json
{
  "type": "message.new",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "data": {
    "messageId": "msg-001",
    "messageBaseId": "base-general",
    "messageBaseName": "General Discussion",
    "subject": "Welcome to BaudAgain!",
    "authorHandle": "sysop",
    "createdAt": "2025-12-01T10:30:00.000Z"
  }
}
```

---

#### `message.reply`
Fired when a reply is posted to an existing message.

**Payload**: `MessageReplyPayload`
- `messageId`: Unique identifier of the reply
- `parentId`: Unique identifier of the parent message
- `messageBaseId`: Unique identifier of the message base
- `subject`: Subject line of the reply
- `authorHandle`: Handle of the reply author
- `createdAt`: ISO 8601 timestamp when created

**Subscription Filter**: `parentId` or `messageBaseId`

**Example**:
```json
{
  "type": "message.reply",
  "timestamp": "2025-12-01T10:35:00.000Z",
  "data": {
    "messageId": "msg-002",
    "parentId": "msg-001",
    "messageBaseId": "base-general",
    "subject": "Re: Welcome to BaudAgain!",
    "authorHandle": "user123",
    "createdAt": "2025-12-01T10:35:00.000Z"
  }
}
```

---

### User Events

#### `user.joined`
Fired when a user connects to the BBS.

**Payload**: `UserJoinedPayload`
- `userId`: Unique identifier of the user
- `handle`: User's handle/username
- `node`: Node number assigned to the user

**Subscription Filter**: None (broadcast to all)

**Example**:
```json
{
  "type": "user.joined",
  "timestamp": "2025-12-01T10:25:00.000Z",
  "data": {
    "userId": "user-123",
    "handle": "newuser",
    "node": 2
  }
}
```

---

#### `user.left`
Fired when a user disconnects from the BBS.

**Payload**: `UserLeftPayload`
- `userId`: Unique identifier of the user
- `handle`: User's handle/username
- `node`: Node number that was freed

**Subscription Filter**: None (broadcast to all)

**Example**:
```json
{
  "type": "user.left",
  "timestamp": "2025-12-01T10:45:00.000Z",
  "data": {
    "userId": "user-123",
    "handle": "newuser",
    "node": 2
  }
}
```

---

### System Events

#### `system.announcement`
Fired when the SysOp sends a system-wide announcement.

**Payload**: `SystemAnnouncementPayload`
- `message`: Announcement message text
- `priority`: Priority level (`low`, `normal`, `high`, `critical`)
- `expiresAt`: Optional ISO 8601 timestamp when announcement expires

**Subscription Filter**: None (broadcast to all)

**Example**:
```json
{
  "type": "system.announcement",
  "timestamp": "2025-12-01T11:00:00.000Z",
  "data": {
    "message": "System maintenance in 10 minutes",
    "priority": "high",
    "expiresAt": "2025-12-01T11:10:00.000Z"
  }
}
```

---

#### `system.shutdown`
Fired when the BBS is shutting down.

**Payload**: `SystemShutdownPayload`
- `message`: Shutdown message to display
- `gracePeriod`: Grace period in seconds before shutdown

**Subscription Filter**: None (broadcast to all)

**Example**:
```json
{
  "type": "system.shutdown",
  "timestamp": "2025-12-01T12:00:00.000Z",
  "data": {
    "message": "BBS shutting down for maintenance",
    "gracePeriod": 60
  }
}
```

---

### Door Game Events

#### `door.update`
Fired when door game state changes.

**Payload**: `DoorUpdatePayload`
- `doorId`: Unique identifier of the door game
- `sessionId`: Session identifier for this door instance
- `output`: Output text to display to the user
- `isComplete`: Whether the door game session is complete

**Subscription Filter**: `sessionId`

**Example**:
```json
{
  "type": "door.update",
  "timestamp": "2025-12-01T10:35:00.000Z",
  "data": {
    "doorId": "oracle",
    "sessionId": "session-789",
    "output": "The Oracle speaks... ✧ Your path is unclear ✧",
    "isComplete": false
  }
}
```

---

#### `door.entered`
Fired when a user enters a door game.

**Payload**: `DoorEnteredPayload`
- `doorId`: Unique identifier of the door game
- `doorName`: Name of the door game
- `userId`: Unique identifier of the user
- `handle`: User's handle/username

**Subscription Filter**: None (broadcast to all)

**Example**:
```json
{
  "type": "door.entered",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "data": {
    "doorId": "oracle",
    "doorName": "The Oracle",
    "userId": "user-123",
    "handle": "seeker"
  }
}
```

---

#### `door.exited`
Fired when a user exits a door game.

**Payload**: `DoorExitedPayload`
- `doorId`: Unique identifier of the door game
- `userId`: Unique identifier of the user
- `handle`: User's handle/username

**Subscription Filter**: None (broadcast to all)

**Example**:
```json
{
  "type": "door.exited",
  "timestamp": "2025-12-01T10:40:00.000Z",
  "data": {
    "doorId": "oracle",
    "userId": "user-123",
    "handle": "seeker"
  }
}
```

---

### Connection Events

#### `auth.success`
Sent when WebSocket authentication succeeds.

**Payload**: `AuthSuccessPayload`
- `userId`: Unique identifier of the authenticated user
- `handle`: User's handle/username

**Example**:
```json
{
  "type": "auth.success",
  "timestamp": "2025-12-01T10:20:00.000Z",
  "data": {
    "userId": "user-123",
    "handle": "user123"
  }
}
```

---

#### `auth.error`
Sent when WebSocket authentication fails.

**Payload**: `AuthErrorPayload`
- `error`: Error message describing the failure

**Example**:
```json
{
  "type": "auth.error",
  "timestamp": "2025-12-01T10:20:00.000Z",
  "data": {
    "error": "Invalid token"
  }
}
```

---

#### `subscription.success`
Sent when event subscription succeeds.

**Payload**: `SubscriptionSuccessPayload`
- `events`: List of event types successfully subscribed to

**Example**:
```json
{
  "type": "subscription.success",
  "timestamp": "2025-12-01T10:21:00.000Z",
  "data": {
    "events": ["message.new", "user.joined", "user.left"]
  }
}
```

---

#### `subscription.error`
Sent when event subscription fails.

**Payload**: `SubscriptionErrorPayload`
- `error`: Error message describing the failure
- `failedEvents`: Optional list of event types that failed

**Example**:
```json
{
  "type": "subscription.error",
  "timestamp": "2025-12-01T10:21:00.000Z",
  "data": {
    "error": "Invalid event type",
    "failedEvents": ["invalid.event"]
  }
}
```

---

#### `heartbeat`
Sent periodically to keep connection alive.

**Payload**: `HeartbeatPayload` (empty)

**Example**:
```json
{
  "type": "heartbeat",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "data": {}
}
```

---

#### `error`
Sent when an error occurs in the notification system.

**Payload**: `ErrorPayload`
- `code`: Error code for programmatic handling
- `message`: Human-readable error message
- `details`: Optional additional error details

**Error Codes**:
- `CONNECTION_ERROR`: Connection-related error
- `SUBSCRIPTION_ERROR`: Subscription-related error
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `AUTHENTICATION_REQUIRED`: Authentication required
- `INVALID_EVENT_TYPE`: Invalid event type
- `INTERNAL_ERROR`: Internal server error

**Example**:
```json
{
  "type": "error",
  "timestamp": "2025-12-01T10:30:00.000Z",
  "data": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many subscription requests",
    "details": {
      "limit": 10,
      "window": "1 minute"
    }
  }
}
```

---

## Client Actions

Clients can send the following actions to the server:

### `authenticate`
Authenticate the WebSocket connection.

```json
{
  "action": "authenticate",
  "token": "jwt_token_here"
}
```

---

### `subscribe`
Subscribe to event types.

**Simple subscription**:
```json
{
  "action": "subscribe",
  "events": ["message.new", "user.joined", "user.left"]
}
```

**Subscription with filters**:
```json
{
  "action": "subscribe",
  "events": [
    {
      "type": "message.new",
      "filter": {
        "messageBaseId": "base-general"
      }
    },
    "user.joined"
  ]
}
```

---

### `unsubscribe`
Unsubscribe from event types.

```json
{
  "action": "unsubscribe",
  "events": ["message.new"]
}
```

---

### `pong`
Respond to heartbeat.

```json
{
  "action": "pong"
}
```

---

## Event Filters

Filters allow clients to subscribe to specific subsets of events:

### Available Filters

- `messageBaseId`: Filter message events by message base
- `parentId`: Filter reply events by parent message
- `sessionId`: Filter door events by session
- `userId`: Filter events by user
- `doorId`: Filter door events by door game

### Filter Examples

**Subscribe to messages in a specific base**:
```json
{
  "action": "subscribe",
  "events": [
    {
      "type": "message.new",
      "filter": { "messageBaseId": "base-general" }
    }
  ]
}
```

**Subscribe to door updates for your session**:
```json
{
  "action": "subscribe",
  "events": [
    {
      "type": "door.update",
      "filter": { "sessionId": "my-session-id" }
    }
  ]
}
```

---

## Usage Examples

### TypeScript Client

```typescript
import {
  NotificationEvent,
  NotificationEventType,
  MessageNewPayload,
  createNotificationEvent,
  isEventType
} from './notifications';

// Create an event
const event = createNotificationEvent<MessageNewPayload>(
  NotificationEventType.MESSAGE_NEW,
  {
    messageId: 'msg-001',
    messageBaseId: 'base-general',
    messageBaseName: 'General Discussion',
    subject: 'Hello World',
    authorHandle: 'user123',
    createdAt: new Date().toISOString()
  }
);

// Type guard usage
function handleEvent(event: NotificationEvent) {
  if (isEventType<MessageNewPayload>(event, NotificationEventType.MESSAGE_NEW)) {
    console.log('New message:', event.data.subject);
  }
}
```

### JavaScript Client

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    action: 'authenticate',
    token: 'your-jwt-token'
  }));
  
  // Subscribe to events
  ws.send(JSON.stringify({
    action: 'subscribe',
    events: ['message.new', 'user.joined']
  }));
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  
  switch (notification.type) {
    case 'message.new':
      console.log('New message:', notification.data.subject);
      break;
    case 'user.joined':
      console.log('User joined:', notification.data.handle);
      break;
    case 'heartbeat':
      ws.send(JSON.stringify({ action: 'pong' }));
      break;
  }
};
```

---

## Implementation Notes

### Broadcast vs. Filtered Events

- **Broadcast events** (user.joined, user.left, system.*): Sent to all connected clients
- **Filtered events** (message.*, door.*): Only sent to clients with matching filters

### Event Ordering

Events are delivered in the order they are generated, but network conditions may affect delivery timing.

### Error Handling

Clients should handle connection errors gracefully and implement reconnection logic with exponential backoff.

### Rate Limiting

- Max 10 subscription requests per minute per client
- Max 100 events per minute per client
- Automatic disconnection if limits exceeded

---

## Next Steps

1. Implement `NotificationService` class
2. Implement `SubscriptionRegistry` class
3. Add WebSocket authentication middleware
4. Integrate with REST API handlers
5. Add comprehensive tests
6. Update terminal client to use notifications

---

## References

- Requirements: 17.1 - WebSocket Notification System
- Design Document: Milestone 6 - Hybrid Architecture
- WebSocket Notification Design: WEBSOCKET_NOTIFICATION_DESIGN.md


---

## NotificationService API

The `NotificationService` class manages WebSocket notification broadcasting and event subscriptions.

### Initialization

```typescript
import { NotificationService } from './notifications';
import { logger } from './logger';

const notificationService = new NotificationService(logger);
```

### Client Management

#### Register Client

```typescript
// Register with authentication
notificationService.registerClient(connection, userId);

// Register without authentication
notificationService.registerClient(connection);
```

#### Authenticate Client

```typescript
notificationService.authenticateClient(connectionId, userId);
```

#### Unregister Client

```typescript
notificationService.unregisterClient(connectionId);
```

#### Check Registration

```typescript
const isRegistered = notificationService.isClientRegistered(connectionId);
```

#### Get Client Info

```typescript
const client = notificationService.getClient(connectionId);
console.log(client?.userId, client?.authenticated);
```

### Subscription Management

#### Subscribe to Events

```typescript
// Simple subscription
const result = notificationService.subscribe(connectionId, [
  NotificationEventType.MESSAGE_NEW,
  NotificationEventType.USER_JOINED,
]);

console.log('Success:', result.success);
console.log('Failed:', result.failed);

// Subscription with filters
notificationService.subscribe(connectionId, [
  {
    type: NotificationEventType.MESSAGE_NEW,
    filter: { messageBaseId: 'general' }
  },
  {
    type: NotificationEventType.DOOR_UPDATE,
    filter: { sessionId: 'session-123' }
  }
]);
```

#### Unsubscribe from Events

```typescript
notificationService.unsubscribe(connectionId, [
  NotificationEventType.MESSAGE_NEW
]);
```

#### Get Client Subscriptions

```typescript
const subscriptions = notificationService.getClientSubscriptions(connectionId);
subscriptions.forEach(sub => {
  console.log(`Event: ${sub.eventType}, Filter:`, sub.filter);
});
```

### Broadcasting Events

#### Broadcast to All Subscribers

```typescript
const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, {
  messageId: 'msg-123',
  messageBaseId: 'general',
  messageBaseName: 'General Discussion',
  subject: 'Hello World',
  authorHandle: 'testuser',
  createdAt: new Date().toISOString(),
});

await notificationService.broadcast(event);
```

#### Broadcast to Specific Client

```typescript
await notificationService.broadcastToClient(connectionId, event);
```

#### Broadcast to Multiple Clients

```typescript
await notificationService.broadcastToClients([conn1, conn2, conn3], event);
```

#### Broadcast to Authenticated Clients

```typescript
await notificationService.broadcastToAuthenticated(event);
```

### Error Handling

```typescript
await notificationService.sendError(
  connectionId,
  NotificationErrorCode.SUBSCRIPTION_ERROR,
  'Invalid subscription request',
  { details: 'Event type not supported' }
);
```

### Statistics and Monitoring

#### Get Service Statistics

```typescript
const stats = notificationService.getStats();
console.log(`Clients: ${stats.clientCount}`);
console.log(`Authenticated: ${stats.authenticatedCount}`);
console.log(`Total subscriptions: ${stats.totalSubscriptions}`);
console.log(`Event types: ${stats.eventTypeCount}`);
```

#### Get Subscription Count

```typescript
const count = notificationService.getSubscriptionCount(
  NotificationEventType.MESSAGE_NEW
);
console.log(`MESSAGE_NEW subscribers: ${count}`);
```

#### Get Active Event Types

```typescript
const activeTypes = notificationService.getActiveEventTypes();
console.log('Active event types:', activeTypes);
```

### Complete Integration Example

```typescript
import { NotificationService } from './notifications';
import { WebSocketConnection } from './connection';
import { createNotificationEvent, NotificationEventType } from './notifications';

// Initialize service
const notificationService = new NotificationService(logger);

// WebSocket connection handler
websocket.on('connection', (ws) => {
  const connection = new WebSocketConnection(ws);
  
  // Register client
  notificationService.registerClient(connection);
  
  // Handle client messages
  connection.onData(async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.action) {
        case 'authenticate':
          // Authenticate user
          const userId = await authenticateToken(message.token);
          notificationService.authenticateClient(connection.id, userId);
          
          // Send success event
          const authEvent = createNotificationEvent(
            NotificationEventType.AUTH_SUCCESS,
            { userId, handle: 'user123' }
          );
          await notificationService.broadcastToClient(connection.id, authEvent);
          break;
          
        case 'subscribe':
          // Subscribe to events
          const result = notificationService.subscribe(
            connection.id,
            message.events
          );
          
          // Send confirmation
          if (result.success.length > 0) {
            const subEvent = createNotificationEvent(
              NotificationEventType.SUBSCRIPTION_SUCCESS,
              { events: result.success }
            );
            await notificationService.broadcastToClient(connection.id, subEvent);
          }
          
          if (result.failed.length > 0) {
            await notificationService.sendError(
              connection.id,
              NotificationErrorCode.SUBSCRIPTION_ERROR,
              'Some subscriptions failed',
              { failedEvents: result.failed }
            );
          }
          break;
          
        case 'unsubscribe':
          notificationService.unsubscribe(connection.id, message.events);
          break;
          
        case 'pong':
          // Handle heartbeat response
          break;
      }
    } catch (error) {
      await notificationService.sendError(
        connection.id,
        NotificationErrorCode.INTERNAL_ERROR,
        'Failed to process message',
        { error: error.message }
      );
    }
  });
});

// Example: Broadcasting when a message is posted
async function postMessage(messageData) {
  // Save to database
  const message = await messageRepository.create(messageData);
  
  // Broadcast notification
  const event = createNotificationEvent(NotificationEventType.MESSAGE_NEW, {
    messageId: message.id,
    messageBaseId: message.baseId,
    messageBaseName: message.baseName,
    subject: message.subject,
    authorHandle: message.authorHandle,
    createdAt: message.createdAt,
  });
  
  await notificationService.broadcast(event);
  
  return message;
}

// Example: Broadcasting when a user joins
async function handleUserJoin(userId, handle, node) {
  const event = createNotificationEvent(NotificationEventType.USER_JOINED, {
    userId,
    handle,
    node,
  });
  
  await notificationService.broadcastToAuthenticated(event);
}
```

### Configuration Limits

The service enforces these limits:

- **MAX_SUBSCRIPTIONS_PER_CLIENT**: 50 subscriptions per client
- **MAX_CONNECTIONS**: 1000 concurrent connections
- **HEARTBEAT_INTERVAL_MS**: 30 seconds
- **CLIENT_TIMEOUT_MS**: 60 seconds
- **MAX_SUBSCRIPTION_REQUESTS_PER_MINUTE**: 10 requests per minute
- **MAX_EVENTS_PER_MINUTE**: 100 events per minute

### Best Practices

1. **Always register clients** when they connect
2. **Authenticate early** to enable full functionality
3. **Use filters** to reduce unnecessary event traffic
4. **Handle errors gracefully** and inform clients
5. **Monitor statistics** to detect issues
6. **Clean up subscriptions** when clients disconnect (automatic)
7. **Use type guards** for type-safe event handling
8. **Batch related events** when possible to reduce overhead

### Testing

The NotificationService includes comprehensive unit tests covering:

- Client registration and unregistration
- Authentication
- Subscription management
- Event broadcasting
- Filtering
- Error handling
- Statistics

Run tests with:
```bash
npm test -- NotificationService.test.ts --run
```

---

---

## Message Notification Integration

The MessageService automatically broadcasts `message.new` events when messages are posted. This integration is transparent to callers and doesn't affect message posting functionality.

### How It Works

1. **MessageService** receives NotificationService as an optional dependency
2. When a message is posted successfully, MessageService broadcasts a notification
3. Notification includes message details and message base information
4. Broadcast happens asynchronously and doesn't block message posting
5. If notification fails, the error is logged but message posting succeeds

### Code Example

```typescript
// In server initialization
const notificationService = new NotificationService(logger);
const messageService = new MessageService(
  messageBaseRepo,
  messageRepo,
  userRepo,
  notificationService  // Optional - enables notifications
);

// When a message is posted
const message = messageService.postMessage({
  baseId: 'general',
  userId: 'user-123',
  subject: 'Hello World',
  body: 'This is my first message!'
});

// Notification is automatically broadcast to subscribers:
// {
//   "type": "message.new",
//   "timestamp": "2025-12-01T12:00:00.000Z",
//   "data": {
//     "messageId": "msg-789",
//     "messageBaseId": "general",
//     "messageBaseName": "General Discussion",
//     "subject": "Hello World",
//     "authorHandle": "user123",
//     "createdAt": "2025-12-01T12:00:00.000Z"
//   }
// }
```

### Client Subscription

Clients can subscribe to message notifications with optional filtering:

```javascript
// Subscribe to all new messages
ws.send(JSON.stringify({
  action: 'subscribe',
  events: ['message.new']
}));

// Subscribe to messages in a specific base
ws.send(JSON.stringify({
  action: 'subscribe',
  events: [
    {
      type: 'message.new',
      filter: { messageBaseId: 'general' }
    }
  ]
}));

// Handle incoming notifications
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  
  if (notification.type === 'message.new') {
    console.log(`New message in ${notification.data.messageBaseName}:`);
    console.log(`  Subject: ${notification.data.subject}`);
    console.log(`  Author: ${notification.data.authorHandle}`);
    
    // Update UI, play sound, show notification, etc.
    updateMessageList(notification.data);
  }
};
```

### Testing

The message notification integration includes comprehensive tests:

```bash
npm test -- MessageService.test.ts --run
```

Tests verify:
- Notifications are broadcast when messages are posted
- Correct event payload structure
- Graceful handling when notification service is unavailable
- Error handling when broadcast fails
- No impact on message posting if notifications fail

---

## Implementation Status

- [x] Task 32.1: Event types and schema (Complete)
- [x] Task 32.2: NotificationService implementation (Complete)
- [x] Task 32.3: Real-time message updates (Complete)
- [ ] Task 32.4: Real-time user activity updates
