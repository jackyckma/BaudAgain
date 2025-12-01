# WebSocket Notification System Design

**Date**: 2025-12-01  
**Version**: 1.0

## Overview

The WebSocket notification system provides real-time updates to clients without polling. This complements the REST API by pushing events to subscribed clients.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │◄────────┤  WebSocket   │◄────────┤  Event      │
│  (Browser/  │  Events │  Connection  │ Publish │  Emitter    │
│  Terminal)  │         │   Manager    │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         ▲
                               │ Subscribe               │
                               ▼                         │
                        ┌──────────────┐                │
                        │ Subscription │                │
                        │   Registry   │                │
                        └──────────────┘                │
                                                         │
                        ┌──────────────┐                │
                        │  REST API    │────────────────┘
                        │  Handlers    │   Emit Events
                        └──────────────┘
```

## Event Types

### 1. Message Events

#### message.new
Fired when a new message is posted to a message base.

**Payload**:
```json
{
  "type": "message.new",
  "timestamp": "2025-12-01T10:30:00Z",
  "data": {
    "messageId": "uuid",
    "messageBaseId": "uuid",
    "messageBaseName": "General Discussion",
    "subject": "Hello World",
    "authorHandle": "user123",
    "createdAt": "2025-12-01T10:30:00Z"
  }
}
```

**Subscription Filter**: `messageBaseId`

---

#### message.reply
Fired when a reply is posted to a message.

**Payload**:
```json
{
  "type": "message.reply",
  "timestamp": "2025-12-01T10:31:00Z",
  "data": {
    "messageId": "uuid",
    "parentId": "uuid",
    "messageBaseId": "uuid",
    "subject": "Re: Hello World",
    "authorHandle": "user456",
    "createdAt": "2025-12-01T10:31:00Z"
  }
}
```

**Subscription Filter**: `parentId` or `messageBaseId`

---

### 2. User Events

#### user.joined
Fired when a user connects to the BBS.

**Payload**:
```json
{
  "type": "user.joined",
  "timestamp": "2025-12-01T10:25:00Z",
  "data": {
    "userId": "uuid",
    "handle": "user123",
    "node": 1
  }
}
```

**Subscription Filter**: None (broadcast to all)

---

#### user.left
Fired when a user disconnects from the BBS.

**Payload**:
```json
{
  "type": "user.left",
  "timestamp": "2025-12-01T10:45:00Z",
  "data": {
    "userId": "uuid",
    "handle": "user123",
    "node": 1
  }
}
```

**Subscription Filter**: None (broadcast to all)

---

### 3. System Events

#### system.announcement
Fired when the SysOp sends a system-wide announcement.

**Payload**:
```json
{
  "type": "system.announcement",
  "timestamp": "2025-12-01T11:00:00Z",
  "data": {
    "message": "System maintenance in 10 minutes",
    "priority": "high",
    "expiresAt": "2025-12-01T11:10:00Z"
  }
}
```

**Subscription Filter**: None (broadcast to all)

---

#### system.shutdown
Fired when the BBS is shutting down.

**Payload**:
```json
{
  "type": "system.shutdown",
  "timestamp": "2025-12-01T12:00:00Z",
  "data": {
    "message": "BBS shutting down for maintenance",
    "gracePeriod": 60
  }
}
```

**Subscription Filter**: None (broadcast to all)

---

### 4. Door Game Events

#### door.update
Fired when door game state changes.

**Payload**:
```json
{
  "type": "door.update",
  "timestamp": "2025-12-01T10:35:00Z",
  "data": {
    "doorId": "oracle",
    "sessionId": "uuid",
    "output": "The Oracle speaks...",
    "isComplete": false
  }
}
```

**Subscription Filter**: `sessionId`

---

#### door.entered
Fired when a user enters a door game.

**Payload**:
```json
{
  "type": "door.entered",
  "timestamp": "2025-12-01T10:30:00Z",
  "data": {
    "doorId": "oracle",
    "doorName": "The Oracle",
    "userId": "uuid",
    "handle": "user123"
  }
}
```

**Subscription Filter**: None (broadcast to all)

---

#### door.exited
Fired when a user exits a door game.

**Payload**:
```json
{
  "type": "door.exited",
  "timestamp": "2025-12-01T10:40:00Z",
  "data": {
    "doorId": "oracle",
    "userId": "uuid",
    "handle": "user123"
  }
}
```

**Subscription Filter**: None (broadcast to all)

---

## Client Protocol

### Connection

Clients connect via WebSocket:
```
ws://localhost:8080/ws
```

### Authentication

After connection, client must authenticate:
```json
{
  "action": "authenticate",
  "token": "jwt_token"
}
```

**Response**:
```json
{
  "type": "auth.success",
  "data": {
    "userId": "uuid",
    "handle": "user123"
  }
}
```

Or on failure:
```json
{
  "type": "auth.error",
  "error": "Invalid token"
}
```

---

### Subscription

Subscribe to specific event types:
```json
{
  "action": "subscribe",
  "events": ["message.new", "user.joined", "user.left"]
}
```

**Response**:
```json
{
  "type": "subscription.success",
  "events": ["message.new", "user.joined", "user.left"]
}
```

---

### Subscription with Filters

Subscribe to events with filters:
```json
{
  "action": "subscribe",
  "events": [
    {
      "type": "message.new",
      "filter": {
        "messageBaseId": "uuid"
      }
    }
  ]
}
```

---

### Unsubscribe

Unsubscribe from events:
```json
{
  "action": "unsubscribe",
  "events": ["message.new"]
}
```

---

### Heartbeat

Server sends periodic heartbeat:
```json
{
  "type": "heartbeat",
  "timestamp": "2025-12-01T10:30:00Z"
}
```

Client should respond with:
```json
{
  "action": "pong"
}
```

---

## Server Implementation

### NotificationService

```typescript
class NotificationService {
  private subscriptions: Map<string, Set<WebSocket>>;
  private filters: Map<WebSocket, Map<string, any>>;
  
  // Subscribe client to events
  subscribe(ws: WebSocket, events: string[], filters?: Map<string, any>): void;
  
  // Unsubscribe client from events
  unsubscribe(ws: WebSocket, events: string[]): void;
  
  // Broadcast event to all subscribed clients
  broadcast(event: NotificationEvent): void;
  
  // Send event to specific client
  send(ws: WebSocket, event: NotificationEvent): void;
  
  // Clean up disconnected clients
  cleanup(ws: WebSocket): void;
}
```

### Event Emitter Integration

```typescript
// In MessageService
async postMessage(data: PostMessageData): Promise<Message> {
  const message = await this.repository.create(data);
  
  // Emit notification event
  this.notificationService.broadcast({
    type: 'message.new',
    timestamp: new Date().toISOString(),
    data: {
      messageId: message.id,
      messageBaseId: message.messageBaseId,
      messageBaseName: message.messageBaseName,
      subject: message.subject,
      authorHandle: message.authorHandle,
      createdAt: message.createdAt
    }
  });
  
  return message;
}
```

---

## Subscription Registry

### Data Structure

```typescript
interface Subscription {
  clientId: string;
  websocket: WebSocket;
  events: Set<string>;
  filters: Map<string, any>;
  authenticatedUserId?: string;
}

class SubscriptionRegistry {
  private subscriptions: Map<string, Subscription>;
  private eventIndex: Map<string, Set<string>>; // event type -> client IDs
  
  add(subscription: Subscription): void;
  remove(clientId: string): void;
  getSubscribers(eventType: string, filters?: any): Subscription[];
}
```

---

## Filtering Logic

### Filter Matching

```typescript
function matchesFilter(event: NotificationEvent, filter: any): boolean {
  if (!filter) return true;
  
  for (const [key, value] of Object.entries(filter)) {
    if (event.data[key] !== value) {
      return false;
    }
  }
  
  return true;
}
```

### Example

Event:
```json
{
  "type": "message.new",
  "data": {
    "messageBaseId": "abc-123",
    "subject": "Hello"
  }
}
```

Filter:
```json
{
  "messageBaseId": "abc-123"
}
```

Result: **Match** ✅

---

## Performance Considerations

### Connection Limits
- Max 1000 concurrent WebSocket connections
- Graceful degradation if limit reached
- Priority for authenticated users

### Message Batching
- Batch multiple events within 100ms window
- Reduce WebSocket overhead
- Configurable batch size

### Subscription Limits
- Max 50 event subscriptions per client
- Prevent resource exhaustion
- Clear error messages

---

## Error Handling

### Connection Errors

```json
{
  "type": "error",
  "error": {
    "code": "CONNECTION_ERROR",
    "message": "Connection lost"
  }
}
```

### Subscription Errors

```json
{
  "type": "error",
  "error": {
    "code": "SUBSCRIPTION_ERROR",
    "message": "Invalid event type"
  }
}
```

### Rate Limiting

```json
{
  "type": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many subscription requests"
  }
}
```

---

## Security

### Authentication Required
- All WebSocket connections must authenticate
- JWT token validated on connection
- Unauthenticated connections closed after 10 seconds

### Authorization
- Event visibility based on user access level
- Message base access levels enforced
- Door game access levels enforced

### Rate Limiting
- Max 10 subscription requests per minute
- Max 100 events per minute per client
- Automatic disconnection if exceeded

---

## Backward Compatibility

### Existing WebSocket Commands
- Current terminal commands remain functional
- New notification system runs in parallel
- Clients can use either or both

### Migration Path
1. Add notification system alongside existing WebSocket
2. Update terminal client to use notifications
3. Deprecate old command-based approach (future)

---

## Testing Strategy

### Unit Tests
- Subscription management
- Filter matching logic
- Event broadcasting

### Integration Tests
- End-to-end event flow
- Multiple client scenarios
- Filter combinations

### Load Tests
- 1000 concurrent connections
- High-frequency events
- Memory usage monitoring

---

## Implementation Checklist

- [ ] Create NotificationService class
- [ ] Implement SubscriptionRegistry
- [ ] Add WebSocket authentication
- [ ] Implement event broadcasting
- [ ] Add filter matching
- [ ] Integrate with REST API handlers
- [ ] Add heartbeat mechanism
- [ ] Implement rate limiting
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update terminal client
- [ ] Document client protocol

---

## Example Client Implementation

```typescript
class BBSNotificationClient {
  private ws: WebSocket;
  private token: string;
  private handlers: Map<string, Function[]>;
  
  constructor(url: string, token: string) {
    this.ws = new WebSocket(url);
    this.token = token;
    this.handlers = new Map();
    
    this.ws.onopen = () => this.authenticate();
    this.ws.onmessage = (event) => this.handleMessage(event);
  }
  
  private authenticate() {
    this.send({
      action: 'authenticate',
      token: this.token
    });
  }
  
  subscribe(events: string[]) {
    this.send({
      action: 'subscribe',
      events
    });
  }
  
  on(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
  
  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    const handlers = this.handlers.get(data.type) || [];
    handlers.forEach(handler => handler(data));
  }
  
  private send(data: any) {
    this.ws.send(JSON.stringify(data));
  }
}

// Usage
const client = new BBSNotificationClient('ws://localhost:8080/ws', token);

client.on('message.new', (event) => {
  console.log('New message:', event.data.subject);
});

client.subscribe(['message.new', 'user.joined']);
```

---

## Next Steps

1. Implement NotificationService
2. Add WebSocket authentication
3. Integrate with existing REST API
4. Update terminal client
5. Add comprehensive tests
6. Document client usage
