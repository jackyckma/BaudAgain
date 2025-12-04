# BaudAgain BBS Architecture

**Last Updated:** December 4, 2025  
**Status:** Milestone 6 Complete (100%) - Hybrid Architecture Fully Implemented ✅  
**Latest:** ANSI Rendering Refactor Section 1 Complete - Core Utilities ✅

## Overview

BaudAgain is built with a layered architecture that separates concerns and enables extensibility. The system follows the Chain of Responsibility pattern for command routing and uses dependency injection throughout.

The architecture has evolved to support a **hybrid approach**: REST API for user actions and WebSocket for real-time notifications, while maintaining the authentic BBS terminal experience.

## High-Level Flow

### Traditional BBS Flow (WebSocket)
```
User Input → WebSocket → Connection Layer → Session Layer → BBSCore → Handler → Response
```

### Hybrid Architecture Flow (REST + WebSocket)
```
User Actions → REST API → Handler → Response (JSON)
Server Events → WebSocket → Notification Service → Client Updates
```

## Architecture Layers

### 1. Connection Layer (Protocol Abstraction)

**Location**: `server/src/connection/`

**Purpose**: Abstract away the underlying connection protocol (WebSocket, Telnet, SSH)

**Components**:
- `IConnection` - Interface defining connection contract
- `WebSocketConnection` - WebSocket implementation
- `ConnectionManager` - Tracks all active connections

**Key Benefit**: Add new protocols without changing BBS logic

### 2. Session Layer (State Management)

**Location**: `server/src/session/`

**Purpose**: Track user state throughout their BBS visit

**Components**:
- `Session` - User state data structure
- `SessionManager` - Session lifecycle management

**Session Contains**:
- Connection ID
- User ID (when authenticated)
- Current state (connected, authenticating, in_menu, in_door, etc.)
- Current location (menu/door)
- Custom data (for door games)
- Last activity timestamp

**Key Benefit**: Persistent state across user's entire session

### 3. BBSCore (Command Router)

**Location**: `server/src/core/`

**Purpose**: Route user commands to appropriate handlers

**Components**:
- `BBSCore` - Central command router
- `CommandHandler` - Interface for all handlers

**How It Works**:
1. Receives user input
2. Asks each handler: "Can you handle this?"
3. First handler that says "yes" processes it
4. Returns response to user

**Key Benefit**: Chain of Responsibility pattern - add handlers without modifying core

### 4. Handlers (Business Logic)

**Location**: `server/src/handlers/`

**Purpose**: Implement specific BBS functionality

**Handler Interface**:
```typescript
interface CommandHandler {
  canHandle(command: string, session: Session): boolean;
  handle(command: string, session: Session): Promise<string>;
}
```

**Current Handlers**:
- `AuthHandler` - User registration and login with password masking
- `MenuHandler` - Menu navigation and Page SysOp functionality

**Planned Handlers**:
- `MessageHandler` - Message board operations
- `DoorHandler` - Door game management

**Key Benefit**: Independent, testable business logic modules

### 5. Terminal Rendering Layer

**Location**: `server/src/terminal/`, `server/src/ansi/`, `packages/shared/src/terminal.ts`

**Purpose**: Separate content from presentation

**Components**:
- Content Types (WelcomeScreen, Menu, Message, Prompt, Error)
- `TerminalRenderer` - Interface for renderers
- `WebTerminalRenderer` - Renders for xterm.js
- `ANSITerminalRenderer` - Renders for raw ANSI terminals

**ANSI Utilities** (New - Dec 4, 2025):
- `ANSIWidthCalculator` - Calculates visual width of strings with ANSI codes
  - Strips ANSI escape codes (which take no visual space)
  - Handles Unicode character widths (emoji, CJK characters)
  - Handles box-drawing characters
- `ANSIColorizer` - Manages color application and conversion
  - Named color API (red, green, blue, yellow, cyan, magenta, white, gray)
  - Automatic reset code insertion
  - ANSI to HTML conversion for web contexts
  - ANSI code stripping
- `ANSIValidator` - Validates output formatting
  - Frame alignment validation (all lines same width)
  - Border integrity checking
  - Detailed error messages with line numbers
- `ANSIFrameBuilder` - Builds bordered frames with proper alignment
- `ANSIFrameValidator` - Validates frame structure for testing

**Key Benefit**: Handlers create structured content, renderers handle formatting with proper ANSI support

### 6. Data Layer

**Location**: `server/src/db/`

**Purpose**: Database access and persistence

**Components**:
- `BBSDatabase` - SQLite connection management (server/src/db/Database.ts)
- `UserRepository` - User CRUD operations
- `MessageRepository` - Message CRUD operations
- `MessageBaseRepository` - Message base management
- `DoorSessionRepository` - Door game session tracking

**Database File Organization**:
- **SINGLE SOURCE OF TRUTH**: `server/src/db/Database.ts`
- All repositories import from `../Database.js`
- Schema definition: `server/src/db/schema.sql`
- Runtime database file: `data/bbs.db` (created on first run)
- **DO NOT** create duplicate Database.ts files in other locations
- **DO NOT** create database files in packages/shared or node_modules

**Key Benefit**: Repository pattern isolates data access

## Request Flow Example

**User types "help":**

1. WebSocket receives input
2. WebSocketConnection triggers onData callback
3. index.ts calls `bbsCore.processInput(sessionId, "help")`
4. BBSCore:
   - Gets session from SessionManager
   - Updates activity timestamp
   - Loops through handlers
5. EchoHandler:
   - canHandle() returns true
   - handle() processes command
   - Returns formatted response
6. BBSCore returns response
7. Response sent through WebSocket
8. xterm.js displays in browser

## Design Patterns Used

### Chain of Responsibility
- BBSCore + Handlers
- Request passes through chain until handled

### Strategy Pattern
- Terminal Renderers
- Different rendering strategies for different terminals

### Repository Pattern
- Data access abstraction
- Isolates database logic

### Dependency Injection
- Managers receive logger instances
- BBSCore receives SessionManager
- Handlers receive repositories

### Interface Segregation
- Small, focused interfaces (IConnection)
- Easy to implement new types

## Key Architectural Decisions

### Why Separate Connection from Session?
- Connections are protocol-specific (WebSocket, Telnet)
- Sessions are protocol-agnostic (user state)
- Allows protocol changes without affecting session logic

### Why BBSCore Instead of Direct Handler Calls?
- Centralized routing logic
- Easy to add/remove handlers
- Consistent error handling
- Logging and monitoring in one place

### Why Structured Content Instead of Raw ANSI?
- Handlers don't need to know about ANSI codes
- Can support multiple terminal types
- Easier to test (compare objects, not strings)
- Future-proof for web UI

### Why Handler Interface Instead of Base Class?
- Composition over inheritance
- Handlers can implement multiple interfaces
- More flexible for testing (easy to mock)

## File Structure

```
server/src/
├── core/                    # Command routing
│   ├── BBSCore.ts
│   ├── CommandHandler.ts
│   └── index.ts
├── handlers/                # Business logic
│   └── EchoHandler.ts
├── connection/              # Protocol abstraction
│   ├── IConnection.ts
│   ├── WebSocketConnection.ts
│   └── ConnectionManager.ts
├── session/                 # State management
│   └── SessionManager.ts
├── terminal/                # Rendering
│   ├── WebTerminalRenderer.ts
│   ├── ANSITerminalRenderer.ts
│   └── index.ts
├── db/                      # Data access (SINGLE DATABASE FILE)
│   ├── Database.ts          # ⚠️ ONLY database class - DO NOT DUPLICATE
│   ├── schema.sql           # Database schema definition
│   └── repositories/        # Data access layer
│       ├── UserRepository.ts
│       ├── MessageRepository.ts
│       ├── MessageBaseRepository.ts
│       └── DoorSessionRepository.ts
├── ansi/                    # ANSI rendering utilities
│   ├── ANSIRenderer.ts      # Main ANSI renderer
│   ├── ANSIFrameBuilder.ts  # Frame construction
│   ├── ANSIFrameValidator.ts # Frame validation
│   ├── ANSIWidthCalculator.ts # Visual width calculation
│   ├── ANSIColorizer.ts     # Color management
│   ├── ANSIValidator.ts     # Output validation
│   └── visual-regression.test.ts # Visual tests
│   └── ANSIRenderer.ts
└── index.ts                 # Server setup

packages/shared/src/
├── types.ts                 # Shared types
├── terminal.ts              # Terminal content types
├── constants.ts             # Shared constants
└── index.ts

client/terminal/src/
└── main.ts                  # xterm.js client
```

## Testing Strategy

### Unit Tests
- Test handlers independently
- Mock SessionManager and repositories
- Verify command routing logic

### Integration Tests
- Test complete request flow
- Verify session state changes
- Test handler interactions

### Property-Based Tests
- Test with random inputs
- Verify invariants hold
- Test edge cases

## Future Enhancements

### Planned Features
- Authentication system (AuthHandler)
- Menu navigation (MenuHandler)
- Message boards (MessageHandler)
- Door games (DoorHandler)
- AI integration (AISysOp)
- Configuration system (config.yaml)

### Potential Improvements
- Handler priority system
- Middleware pipeline
- Event system for cross-handler communication
- Plugin architecture for third-party handlers

## Performance Considerations

### Session Cleanup
- Automatic cleanup of inactive sessions (60 min timeout)
- Runs every minute
- Prevents memory leaks

### Connection Management
- Graceful shutdown closes all connections
- Cleanup on disconnect
- Error handling prevents crashes

### Handler Efficiency
- Handlers checked in registration order
- First match wins (short-circuit evaluation)
- Async handlers don't block others

## Common Pitfalls to Avoid

### ⚠️ Database File Duplication
**NEVER** create multiple Database.ts files. The system has ONE database class:
- **Correct Location**: `server/src/db/Database.ts`
- **Import Pattern**: `import { BBSDatabase } from '../Database.js'` (from repositories)
- **Wrong Locations**: packages/shared, node_modules, client directories
- **Why**: Multiple database files cause connection conflicts, initialization issues, and data inconsistency

### ⚠️ Circular Dependencies
- Handlers should not import other handlers
- Use BBSCore for handler communication
- Repositories should not import handlers

### ⚠️ Session State Mutation
- Always update session through SessionManager
- Don't modify session objects directly
- Use immutable patterns where possible

### ⚠️ Async Handler Errors
- Always wrap async operations in try-catch
- Return user-friendly error messages
- Log detailed errors for debugging

## Security Considerations

### Input Validation
- All input trimmed and validated
- Handlers responsible for their own validation
- BBSCore catches handler errors

### Session Security
- Session IDs are UUIDs
- Activity timestamps prevent session hijacking
- Automatic timeout for inactive sessions

### Error Handling
- Handler errors don't crash server
- Generic error messages to users
- Detailed logging for debugging

## Monitoring and Logging

### What Gets Logged
- Connection events (connect, disconnect)
- Session lifecycle (create, update, remove)
- Command processing (input, handler, response)
- Errors (with context)

### Log Levels
- INFO: Normal operations
- WARN: Unusual but handled situations
- ERROR: Failures requiring attention

## Deployment

### Development
- Hot reload with tsx watch
- Detailed logging
- CORS enabled for local development

### Production (Future)
- Process manager (PM2)
- Log aggregation
- Health check endpoint
- Graceful shutdown

## New Components (Milestone 2-3)

### AI Integration Layer

**Location**: `server/src/ai/`

**Purpose**: Provide AI-powered features through abstracted provider interface

**Components**:
- `AIProvider` - Interface for AI providers
- `AnthropicProvider` - Claude implementation
- `AIProviderFactory` - Creates provider instances
- `AIService` - High-level AI service
- `AISysOp` - AI-powered system operator

**Key Features**:
- Welcome message generation
- User greeting generation
- Page SysOp responses
- ANSI color code formatting
- Fallback responses

### REST API Layer

**Location**: `server/src/api/`

**Purpose**: Provide HTTP REST API for control panel

**Components**:
- `routes.ts` - API endpoints and authentication

**Endpoints**:
- `POST /api/login` - SysOp authentication
- `GET /api/dashboard` - System statistics
- `GET /api/users` - User management
- `GET /api/message-bases` - Message base management
- `GET /api/ai-settings` - AI configuration

**Authentication**: Bearer token with SysOp access level check (>= 255)

### Control Panel (React SPA)

**Location**: `client/control-panel/`

**Purpose**: Web-based administration interface

**Tech Stack**:
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling

**Pages**:
- Dashboard - Real-time system stats
- Users - User management table
- Message Bases - Message base configuration
- AI Settings - AI SysOp configuration

**Features**:
- SysOp authentication
- Real-time data updates (5s refresh)
- Responsive design
- Token-based session management

### Terminal Enhancements

**Echo Control System**:
- Custom OSC escape sequences for password masking
- Client-side echo state management
- Secure password input

**Content Types**:
- `EchoControlContent` - Control terminal echo on/off
- Enhanced `PromptContent` with echo control

## Hybrid Architecture (Milestone 6)

### Overview

Milestone 6 introduces a hybrid architecture that combines REST API for actions with WebSocket for real-time notifications. This provides the best of both worlds:

- **REST API**: Testable, stateless, standard HTTP operations
- **WebSocket**: Real-time notifications for live updates

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Terminal   │  │ Control Panel│  │  Mobile App  │     │
│  │   Client     │  │   (React)    │  │ (React Native│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         │ REST API         │ REST API         │ REST API   │
│         │ WebSocket        │ WebSocket        │ WebSocket  │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    BBS Server (Node.js)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              REST API Layer                            │  │
│  │  • Authentication (JWT)                                │  │
│  │  • User Management                                     │  │
│  │  • Message Operations                                  │  │
│  │  • Door Game Operations                                │  │
│  │  • Rate Limiting                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              WebSocket Layer                           │  │
│  │  • Connection Management                               │  │
│  │  • Notification Broadcasting                           │  │
│  │  • Event Subscriptions                                 │  │
│  │  • Fallback Command Handling                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Notification Service                      │  │
│  │  • Event Types (MESSAGE_NEW, USER_JOINED, etc.)       │  │
│  │  • Subscription Management                             │  │
│  │  • Broadcast Logic                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Service Layer                             │  │
│  │  • UserService                                         │  │
│  │  • MessageService                                      │  │
│  │  • SessionService                                      │  │
│  │  • DoorService                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Data Layer                                │  │
│  │  • Repositories (User, Message, Door)                 │  │
│  │  • SQLite Database                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### REST API Design

**Base URL**: `http://localhost:8080/api/v1`

**Authentication**: JWT tokens in `Authorization: Bearer <token>` header

**Endpoint Categories**:

1. **Authentication** (`/auth`)
   - `POST /auth/register` - Register new user
   - `POST /auth/login` - Login and get JWT token
   - `POST /auth/refresh` - Refresh JWT token
   - `GET /auth/me` - Get current user info

2. **Users** (`/users`)
   - `GET /users` - List users (admin only)
   - `GET /users/:id` - Get user profile
   - `PATCH /users/:id` - Update user profile

3. **Message Bases** (`/message-bases`)
   - `GET /message-bases` - List message bases
   - `GET /message-bases/:id` - Get message base details
   - `POST /message-bases` - Create message base (admin)
   - `PATCH /message-bases/:id` - Update message base (admin)
   - `DELETE /message-bases/:id` - Delete message base (admin)

4. **Messages** (`/messages`)
   - `GET /message-bases/:baseId/messages` - List messages
   - `GET /messages/:id` - Get message details
   - `POST /message-bases/:baseId/messages` - Post new message
   - `POST /messages/:id/replies` - Post reply

5. **Door Games** (`/doors`)
   - `GET /doors` - List available doors
   - `POST /doors/:id/enter` - Enter door game
   - `POST /doors/:id/input` - Send input to door
   - `POST /doors/:id/exit` - Exit door game
   - `GET /doors/:id/session` - Get session info
   - `POST /doors/:id/resume` - Resume saved session

6. **System** (`/system`)
   - `POST /system/announcement` - Send system announcement (admin)

**Response Format**:
```json
{
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

**Error Codes**:
- `INVALID_INPUT` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Not authorized
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMIT_EXCEEDED` (429) - Rate limit exceeded
- `INTERNAL_ERROR` (500) - Server error

### WebSocket Notification System

**Connection**: `ws://localhost:8080`

**Authentication**: Send auth message with JWT token after connecting

**Event Types**:
- `MESSAGE_NEW` - New message posted
- `USER_JOINED` - User logged in
- `USER_LEFT` - User logged out
- `SYSTEM_ANNOUNCEMENT` - System announcement
- `DOOR_UPDATE` - Door game update

**Subscription Model**:
```javascript
// Subscribe to specific events
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT']
}));
```

**Notification Format**:
```json
{
  "type": "MESSAGE_NEW",
  "timestamp": "2025-12-03T10:00:00.000Z",
  "data": {
    "messageId": "...",
    "messageBaseId": "...",
    "messageBaseName": "General Discussion",
    "subject": "Hello!",
    "authorId": "...",
    "authorHandle": "testuser"
  }
}
```

### API Patterns

#### 1. JWT Authentication

All protected endpoints require JWT authentication:

```typescript
// Middleware checks token
const authMiddleware = async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'No token' } });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};
```

#### 2. Rate Limiting

Different rate limits for different endpoint types:

```typescript
// Authentication endpoints: 10 requests/minute
// Read operations: 100 requests/15 minutes
// Write operations: 30 requests/minute
// Message posting: 30 messages/hour
```

#### 3. Pagination

List endpoints support pagination:

```typescript
GET /message-bases/:id/messages?page=1&limit=50

Response:
{
  "messages": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 4. Error Handling

Consistent error responses across all endpoints:

```typescript
try {
  // Operation
} catch (error) {
  return reply.code(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Operation failed',
      details: {}
    }
  });
}
```

### Notification Service Architecture

**Location**: `server/src/notifications/`

**Components**:
- `NotificationService` - Core notification broadcasting
- `types.ts` - Event type definitions
- `constants.ts` - Event type constants

**Key Features**:
- Type-safe event definitions
- Subscription filtering
- Graceful error handling
- No blocking on delivery failures

**Usage Example**:
```typescript
// Broadcast new message notification
notificationService.broadcast({
  type: NotificationEventType.MESSAGE_NEW,
  timestamp: new Date(),
  data: {
    messageId: message.id,
    messageBaseId: message.messageBaseId,
    messageBaseName: messageBase.name,
    subject: message.subject,
    authorId: message.authorId,
    authorHandle: message.authorHandle
  }
});
```

### Hybrid Client Pattern

The terminal client uses a hybrid approach:

1. **REST API for Actions**:
   - User login/registration
   - Posting messages
   - Entering/exiting doors
   - Sending door input

2. **WebSocket for Notifications**:
   - New message alerts
   - User activity updates
   - System announcements

3. **Graceful Fallback**:
   - If REST API unavailable, fall back to WebSocket commands
   - Maintain same user experience
   - Log fallback events

**Implementation**:
```typescript
async function postMessage(baseId, subject, body) {
  try {
    // Try REST API first
    const response = await fetch(`${API_URL}/message-bases/${baseId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subject, body })
    });
    return await response.json();
  } catch (error) {
    // Fall back to WebSocket command
    console.log('REST API unavailable, using WebSocket fallback');
    return sendWebSocketCommand('POST_MESSAGE', { baseId, subject, body });
  }
}
```

### Benefits of Hybrid Architecture

1. **Testability**: REST API is easily testable with standard HTTP tools
2. **Real-time Updates**: WebSocket provides instant notifications
3. **Mobile-Friendly**: REST API perfect for mobile app development
4. **Scalability**: Stateless REST API scales horizontally
5. **Developer Experience**: Standard HTTP patterns, OpenAPI documentation
6. **Flexibility**: Clients can choose REST-only, WebSocket-only, or hybrid
7. **Backwards Compatible**: Existing WebSocket clients continue to work

### Migration Path

**Phase 1**: Implement REST API alongside WebSocket (✅ Complete)
**Phase 2**: Add WebSocket notifications (✅ Complete)
**Phase 3**: Update terminal client to hybrid mode (✅ Complete)
**Phase 4**: Build mobile apps using REST API (Future)
**Phase 5**: Deprecate WebSocket commands (Optional, Future)

### Performance Considerations

1. **Connection Pooling**: Reuse HTTP connections with keep-alive
2. **Caching**: Cache message bases and user lists
3. **Pagination**: Limit result set sizes
4. **Rate Limiting**: Prevent abuse and ensure fair usage
5. **WebSocket Efficiency**: Only send notifications to subscribed clients

### Security Enhancements

1. **JWT Tokens**: Secure, stateless authentication
2. **Token Expiration**: 24-hour token lifetime
3. **Rate Limiting**: Prevent brute force and abuse
4. **Input Validation**: Validate all API inputs
5. **CORS Configuration**: Restrict origins in production

### Documentation

- **OpenAPI Specification**: `server/openapi.yaml` - Complete API reference with examples
- **API README**: `server/API_README.md` - Comprehensive API usage guide
- **curl Examples**: `server/API_CURL_EXAMPLES.md` - Command-line examples for all endpoints
- **Code Examples**: `server/API_CODE_EXAMPLES.md` - JavaScript, Python, and React integration examples
- **Postman Collection**: `server/BaudAgain-API.postman_collection.json` - Import-ready collection for testing
- **Mobile Guide**: `server/MOBILE_APP_GUIDE.md` - React Native mobile app development guide
- **Performance Testing**: `server/PERFORMANCE_TESTING.md` - Benchmarking guide and results

---

**Last Updated**: 2025-12-03
**Version**: 0.6.0 (Milestone 6 - Hybrid Architecture Complete)
