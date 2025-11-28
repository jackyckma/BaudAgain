# BaudAgain BBS Architecture

## Overview

BaudAgain is built with a layered architecture that separates concerns and enables extensibility. The system follows the Chain of Responsibility pattern for command routing and uses dependency injection throughout.

## High-Level Flow

```
User Input → WebSocket → Connection Layer → Session Layer → BBSCore → Handler → Response
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
- `EchoHandler` - Temporary testing handler

**Planned Handlers**:
- `AuthHandler` - Registration and login
- `MenuHandler` - Menu navigation
- `MessageHandler` - Message board operations
- `DoorHandler` - Door game management

**Key Benefit**: Independent, testable business logic modules

### 5. Terminal Rendering Layer

**Location**: `server/src/terminal/`, `packages/shared/src/terminal.ts`

**Purpose**: Separate content from presentation

**Components**:
- Content Types (WelcomeScreen, Menu, Message, Prompt, Error)
- `TerminalRenderer` - Interface for renderers
- `WebTerminalRenderer` - Renders for xterm.js
- `ANSITerminalRenderer` - Renders for raw ANSI terminals

**Key Benefit**: Handlers create structured content, renderers handle formatting

### 6. Data Layer

**Location**: `server/src/db/`

**Purpose**: Database access and persistence

**Components**:
- `BBSDatabase` - SQLite connection management
- `UserRepository` - User CRUD operations
- Additional repositories (planned)

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
├── db/                      # Data access
│   ├── Database.ts
│   └── repositories/
│       └── UserRepository.ts
├── ansi/                    # Legacy ANSI renderer
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

---

**Last Updated**: 2024-11-28
**Version**: 0.1.0 (Milestone 1 - Hello BBS)
