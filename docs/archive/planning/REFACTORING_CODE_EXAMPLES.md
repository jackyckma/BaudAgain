# Refactoring Code Examples - REST API Cleanup
**Date:** 2025-12-01  
**Purpose:** Concrete code examples for each refactoring task

---

## 1. Fix Type Safety (1 hour)

### Step 1: Create Type Definitions

**File:** `server/src/api/types.ts` (NEW)

```typescript
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      handle: string;
      accessLevel: number;
    };
  }
}

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Step 2: Update Routes

**Before:**
```typescript
const currentUser = (request as any).user;
```

**After:**
```typescript
const currentUser = request.user;
if (!currentUser) {
  return APIError.unauthorized(reply);
}
```

---

## 2. Extract Error Utilities (2 hours)

### Create Error Utility Class

**File:** `server/src/api/errors.ts` (NEW)

```typescript
import type { FastifyReply } from 'fastify';
import type { APIErrorResponse } from './types.js';

export class APIError {
  /**
   * 401 Unauthorized
   */
  static unauthorized(reply: FastifyReply, message?: string): void {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: message || 'Authentication required'
      }
    } as APIErrorResponse);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(reply: FastifyReply, message: string): void {
    reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message
      }
    } as APIErrorResponse);
  }

  /**
   * 404 Not Found
   */
  static notFound(reply: FastifyReply, resourceName: string): void {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `${resourceName} not found`
      }
    } as APIErrorResponse);
  }

  /**
   * 400 Bad Request - Invalid Input
   */
  static invalidInput(reply: FastifyReply, message: string): void {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message
      }
    } as APIErrorResponse);
  }

  /**
   * 409 Conflict
   */
  static conflict(reply: FastifyReply, message: string): void {
    reply.code(409).send({
      error: {
        code: 'CONFLICT',
        message
      }
    } as APIErrorResponse);
  }

  /**
   * 429 Rate Limit Exceeded
   */
  static rateLimitExceeded(reply: FastifyReply, message: string): void {
    reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    } as APIErrorResponse);
  }

  /**
   * 500 Internal Server Error
   */
  static internalError(reply: FastifyReply, message?: string): void {
    reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: message || 'An internal error occurred'
      }
    } as APIErrorResponse);
  }

  /**
   * 501 Not Implemented
   */
  static serviceUnavailable(reply: FastifyReply, serviceName: string): void {
    reply.code(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${serviceName} service not available`
      }
    } as APIErrorResponse);
  }
}
```

### Usage Examples

**Before:**
```typescript
if (!messageService) {
  reply.code(501).send({ 
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Message service not available'
    }
  });
  return;
}

if (!base) {
  reply.code(404).send({ 
    error: {
      code: 'NOT_FOUND',
      message: 'Message base not found'
    }
  });
  return;
}

if (!canWrite) {
  reply.code(403).send({ 
    error: {
      code: 'FORBIDDEN',
      message: 'Insufficient access level'
    }
  });
  return;
}
```

**After:**
```typescript
if (!messageService) {
  return APIError.serviceUnavailable(reply, 'Message');
}

if (!base) {
  return APIError.notFound(reply, 'Message base');
}

if (!canWrite) {
  return APIError.forbidden(reply, 'Insufficient access level to post');
}
```


---

## 3. Extract Validation Utilities (2 hours)

### Create Validation Utility Class

**File:** `server/src/api/validation.ts` (NEW)

```typescript
import type { FastifyReply } from 'fastify';
import { APIError } from './errors.js';

export class RequestValidator {
  /**
   * Validate that a field is not empty
   */
  static validateRequired(
    reply: FastifyReply,
    value: any,
    fieldName: string
  ): boolean {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      APIError.invalidInput(reply, `${fieldName} is required`);
      return false;
    }
    return true;
  }

  /**
   * Validate message input (subject and body)
   */
  static validateMessageInput(
    reply: FastifyReply,
    subject: string,
    body: string
  ): boolean {
    if (!this.validateRequired(reply, subject, 'Subject')) {
      return false;
    }
    if (!this.validateRequired(reply, body, 'Body')) {
      return false;
    }
    return true;
  }

  /**
   * Validate user credentials
   */
  static validateCredentials(
    reply: FastifyReply,
    handle: string,
    password: string
  ): boolean {
    if (!this.validateRequired(reply, handle, 'Handle')) {
      return false;
    }
    if (!this.validateRequired(reply, password, 'Password')) {
      return false;
    }
    return true;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(
    page?: number,
    limit?: number
  ): { page: number; limit: number } {
    const validPage = Math.max(1, Number(page) || 1);
    const validLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    return { page: validPage, limit: validLimit };
  }

  /**
   * Validate access level
   */
  static validateAccessLevel(
    reply: FastifyReply,
    accessLevel: number
  ): boolean {
    if (typeof accessLevel !== 'number' || accessLevel < 0 || accessLevel > 255) {
      APIError.invalidInput(reply, 'Access level must be between 0 and 255');
      return false;
    }
    return true;
  }

  /**
   * Validate handle format
   */
  static validateHandleFormat(
    reply: FastifyReply,
    handle: string
  ): boolean {
    if (handle.length < 3 || handle.length > 20) {
      APIError.invalidInput(reply, 'Handle must be between 3 and 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      APIError.invalidInput(reply, 'Handle can only contain letters, numbers, and underscores');
      return false;
    }
    return true;
  }

  /**
   * Validate password format
   */
  static validatePasswordFormat(
    reply: FastifyReply,
    password: string
  ): boolean {
    if (password.length < 6) {
      APIError.invalidInput(reply, 'Password must be at least 6 characters');
      return false;
    }
    return true;
  }
}
```

### Usage Examples

**Before:**
```typescript
if (!subject || subject.trim().length === 0) {
  reply.code(400).send({ 
    error: {
      code: 'INVALID_INPUT',
      message: 'Subject is required'
    }
  });
  return;
}

if (!body || body.trim().length === 0) {
  reply.code(400).send({ 
    error: {
      code: 'INVALID_INPUT',
      message: 'Body is required'
    }
  });
  return;
}
```

**After:**
```typescript
if (!RequestValidator.validateMessageInput(reply, subject, body)) {
  return;
}
```

**Before:**
```typescript
if (!handle || !password) {
  reply.code(400).send({ 
    error: {
      code: 'INVALID_INPUT',
      message: 'Handle and password are required'
    }
  });
  return;
}

if (handle.length < 3 || handle.length > 20) {
  reply.code(400).send({ 
    error: {
      code: 'INVALID_INPUT',
      message: 'Handle must be between 3 and 20 characters'
    }
  });
  return;
}
```

**After:**
```typescript
if (!RequestValidator.validateCredentials(reply, handle, password)) {
  return;
}

if (!RequestValidator.validateHandleFormat(reply, handle)) {
  return;
}
```


---

## 4. Fix Door Handler Access (3-4 hours)

### Step 1: Add Public Methods to DoorHandler

**File:** `server/src/handlers/DoorHandler.ts` (MODIFY)

```typescript
export interface DoorInfo {
  id: string;
  name: string;
  description: string;
}

export class DoorHandler implements CommandHandler {
  private doors: Map<string, Door> = new Map();
  
  // ... existing private methods ...
  
  /**
   * PUBLIC: Get all available doors
   */
  public getAllDoors(): DoorInfo[] {
    return Array.from(this.doors.values()).map(door => ({
      id: door.id,
      name: door.name,
      description: door.description
    }));
  }
  
  /**
   * PUBLIC: Get door by ID
   */
  public getDoorById(doorId: string): Door | null {
    return this.doors.get(doorId) || null;
  }
  
  /**
   * PUBLIC: Register a door (already exists, make sure it's public)
   */
  public registerDoor(door: Door): void {
    this.doors.set(door.id, door);
  }
}
```

### Step 2: Update Routes to Use Public Methods

**Before:**
```typescript
// ❌ WRONG - Direct access to private member
const doors = Array.from((doorHandler as any).doors.values());

// ❌ WRONG - Access private member
const door = (doorHandler as any).doors.get(id);

// ❌ WRONG - Call private method
const output = await (doorHandler as any).enterDoor(door, session);
```

**After:**
```typescript
// ✅ CORRECT - Use public method
const doorInfos = doorHandler.getAllDoors();

// ✅ CORRECT - Use public method
const door = doorHandler.getDoorById(id);

// ✅ CORRECT - Use door's public interface
const output = await door.enter(session);
```

### Step 3: Update Door Endpoints

**File:** `server/src/api/routes.ts` (MODIFY)

**GET /api/v1/doors - Before:**
```typescript
const doors = Array.from((doorHandler as any).doors.values());

return {
  doors: doors.map((door: any) => ({
    id: door.id,
    name: door.name,
    description: door.description,
  })),
};
```

**GET /api/v1/doors - After:**
```typescript
const doors = doorHandler.getAllDoors();

return { doors };
```

**POST /api/v1/doors/:id/enter - Before:**
```typescript
const door = (doorHandler as any).doors.get(id);
if (!door) {
  return APIError.notFound(reply, 'Door game');
}

const output = await (doorHandler as any).enterDoor(door, session);
```

**POST /api/v1/doors/:id/enter - After:**
```typescript
const door = doorHandler.getDoorById(id);
if (!door) {
  return APIError.notFound(reply, 'Door game');
}

// Create or get session
const session = await this.getOrCreateDoorSession(currentUser.id, id);

// Enter door directly
const output = await door.enter(session);

// Save session state
if (doorSessionRepository) {
  const savedSession = doorSessionRepository.getActiveDoorSession(currentUser.id, id);
  if (!savedSession) {
    doorSessionRepository.createDoorSession({
      userId: currentUser.id,
      doorId: id,
      state: session.data.door?.gameState || {},
      history: session.data.door?.history || []
    });
  }
}
```


---

## 5. Create DoorService (4-5 hours)

### Step 1: Create DoorService Class

**File:** `server/src/services/DoorService.ts` (NEW)

```typescript
import type { Door } from '../doors/Door.js';
import type { DoorHandler, DoorInfo } from '../handlers/DoorHandler.js';
import type { SessionManager } from '../session/SessionManager.js';
import type { DoorSessionRepository } from '../db/repositories/DoorSessionRepository.js';
import type { Session } from '@baudagain/shared';
import { SessionState } from '@baudagain/shared';

export interface DoorEnterResult {
  sessionId: string;
  output: string;
  doorId: string;
  doorName: string;
}

export interface DoorInputResult {
  sessionId: string;
  output: string;
  exited: boolean;
}

export interface DoorExitResult {
  output: string;
  exited: boolean;
}

export class DoorService {
  constructor(
    private doorHandler: DoorHandler,
    private sessionManager: SessionManager,
    private doorSessionRepository?: DoorSessionRepository
  ) {}

  /**
   * Get all available doors
   */
  getAllDoors(): DoorInfo[] {
    return this.doorHandler.getAllDoors();
  }

  /**
   * Get door by ID
   */
  getDoor(doorId: string): Door | null {
    return this.doorHandler.getDoorById(doorId);
  }

  /**
   * Enter a door game
   */
  async enterDoor(userId: string, doorId: string): Promise<DoorEnterResult> {
    // 1. Validate door exists
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door not found');
    }

    // 2. Get or create session for this user
    const session = await this.getOrCreateDoorSession(userId, doorId);

    // 3. Check if user has a saved session
    let savedSession = null;
    if (this.doorSessionRepository) {
      savedSession = this.doorSessionRepository.getActiveDoorSession(userId, doorId);
    }

    // 4. Restore saved state if exists
    if (savedSession) {
      session.data.door = {
        doorId: doorId,
        gameState: JSON.parse(savedSession.state),
        history: JSON.parse(savedSession.history)
      };
    } else {
      session.data.door = {
        doorId: doorId,
        gameState: {},
        history: []
      };
    }

    // 5. Update session state
    session.state = SessionState.IN_DOOR;
    this.sessionManager.updateSession(session.id, {
      state: session.state,
      data: session.data
    });

    // 6. Enter the door
    const output = await door.enter(session);

    // 7. Save session to database
    if (this.doorSessionRepository && !savedSession) {
      this.doorSessionRepository.createDoorSession({
        userId: userId,
        doorId: doorId,
        state: session.data.door.gameState,
        history: session.data.door.history
      });
    }

    return {
      sessionId: session.id,
      output: savedSession ? '\r\n\x1b[33m[Resuming saved game...]\x1b[0m\r\n\r\n' + output : output,
      doorId: door.id,
      doorName: door.name
    };
  }

  /**
   * Process door input
   */
  async processDoorInput(
    userId: string,
    doorId: string,
    sessionId: string,
    input: string
  ): Promise<DoorInputResult> {
    // 1. Validate door exists
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door not found');
    }

    // 2. Get session
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // 3. Verify session belongs to user
    if (session.userId !== userId) {
      throw new Error('Session does not belong to user');
    }

    // 4. Verify session is in correct door
    if (session.data.door?.doorId !== doorId) {
      throw new Error('Session is not in this door game');
    }

    // 5. Process input
    const output = await door.processInput(input, session);

    // 6. Update session activity
    this.sessionManager.touchSession(session.id);

    // 7. Save session state
    if (this.doorSessionRepository && session.data.door) {
      const savedSession = this.doorSessionRepository.getActiveDoorSession(userId, doorId);
      if (savedSession) {
        this.doorSessionRepository.updateDoorSession(
          savedSession.id,
          session.data.door.gameState,
          session.data.door.history
        );
      }
    }

    // 8. Check if user exited
    const exited = session.state !== SessionState.IN_DOOR;

    return {
      sessionId: session.id,
      output,
      exited
    };
  }

  /**
   * Exit a door game
   */
  async exitDoor(userId: string, doorId: string, sessionId: string): Promise<DoorExitResult> {
    // 1. Validate door exists
    const door = this.getDoor(doorId);
    if (!door) {
      throw new Error('Door not found');
    }

    // 2. Get session
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // 3. Verify session belongs to user
    if (session.userId !== userId) {
      throw new Error('Session does not belong to user');
    }

    // 4. Call door's exit method
    let exitMessage = '';
    try {
      exitMessage = await door.exit(session);
    } catch (error) {
      console.error(`Error exiting door ${door.id}:`, error);
      exitMessage = '\r\nExiting door game...\r\n\r\n';
    }

    // 5. Delete saved session
    if (this.doorSessionRepository && session.data.door?.doorId) {
      const savedSession = this.doorSessionRepository.getActiveDoorSession(userId, doorId);
      if (savedSession) {
        this.doorSessionRepository.deleteDoorSession(savedSession.id);
      }
    }

    // 6. Clear door state
    session.state = SessionState.IN_MENU;
    session.data.door = undefined;
    this.sessionManager.updateSession(session.id, {
      state: SessionState.IN_MENU,
      data: { ...session.data, door: undefined }
    });

    return {
      output: exitMessage + 'Returning to main menu...\r\n\r\n',
      exited: true
    };
  }

  /**
   * Get or create a door session for a user
   */
  private async getOrCreateDoorSession(userId: string, doorId: string): Promise<Session> {
    // For REST API, use a consistent connection ID pattern
    const restConnectionId = `rest-door-${userId}-${doorId}`;
    
    let session = this.sessionManager.getSessionByConnection(restConnectionId);
    
    if (!session) {
      session = this.sessionManager.createSession(restConnectionId);
      session.userId = userId;
      session.state = SessionState.AUTHENTICATED;
      this.sessionManager.updateSession(session.id, session);
    }
    
    return session;
  }
}
```

### Step 2: Update Routes to Use DoorService

**File:** `server/src/api/routes.ts` (MODIFY)

**Before:**
```typescript
const door = doorHandler.getDoorById(id);
const session = /* complex session management */;
const output = await door.enter(session);
/* complex state management */
```

**After:**
```typescript
const result = await doorService.enterDoor(currentUser.id, id);
return {
  sessionId: result.sessionId,
  output: result.output,
  doorId: result.doorId,
  doorName: result.doorName
};
```

### Step 3: Register DoorService in index.ts

**File:** `server/src/index.ts` (MODIFY)

```typescript
import { DoorService } from './services/DoorService.js';

// After creating doorHandler
const doorService = new DoorService(
  doorHandler,
  sessionManager,
  doorSessionRepository
);

// Pass to registerAPIRoutes
await registerAPIRoutes(
  server,
  userRepository,
  sessionManager,
  jwtUtil,
  config,
  messageBaseRepository,
  messageService,
  doorHandler,
  doorService  // ADD THIS
);
```


---

## 6. Fix Session Management (2-3 hours)

### Step 1: Create RESTSessionManager

**File:** `server/src/session/RESTSessionManager.ts` (NEW)

```typescript
export interface RESTSession {
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  data: {
    door?: {
      doorId: string;
      sessionId: string;
    };
  };
}

export class RESTSessionManager {
  private sessions: Map<string, RESTSession> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup inactive sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Get or create a session for a user
   */
  getOrCreateSession(userId: string): RESTSession {
    let session = this.sessions.get(userId);
    
    if (!session) {
      session = {
        userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        data: {}
      };
      this.sessions.set(userId, session);
    } else {
      // Update last activity
      session.lastActivity = new Date();
    }
    
    return session;
  }

  /**
   * Get a session by user ID
   */
  getSession(userId: string): RESTSession | null {
    return this.sessions.get(userId) || null;
  }

  /**
   * Update session data
   */
  updateSession(userId: string, data: Partial<RESTSession['data']>): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.data = { ...session.data, ...data };
      session.lastActivity = new Date();
    }
  }

  /**
   * Touch session (update last activity)
   */
  touchSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Delete a session
   */
  deleteSession(userId: string): void {
    this.sessions.delete(userId);
  }

  /**
   * Cleanup inactive sessions (older than 1 hour)
   */
  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [userId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > oneHour) {
        this.sessions.delete(userId);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
```

### Step 2: Update Routes to Use RESTSessionManager

**Before:**
```typescript
// ❌ WRONG - Pseudo-session hack
const restConnectionId = `rest-${currentUser.id}`;
let session = sessionManager.getSessionByConnection(restConnectionId);

if (!session) {
  session = sessionManager.createSession(restConnectionId);
  session.userId = currentUser.id;
  session.handle = currentUser.handle;
  session.state = 'authenticated' as any;
  sessionManager.updateSession(session.id, session);
}
```

**After:**
```typescript
// ✅ CORRECT - Use RESTSessionManager
const restSession = restSessionManager.getOrCreateSession(currentUser.id);

// Store door session info in REST session
restSession.data.door = {
  doorId: id,
  sessionId: result.sessionId
};
```

### Step 3: Update Door Endpoints

**File:** `server/src/api/routes.ts` (MODIFY)

**POST /api/v1/doors/:id/enter - After:**
```typescript
server.post('/api/v1/doors/:id/enter', {
  preHandler: authenticateUser,
  config: {
    rateLimit: {
      max: 30,
      timeWindow: '1 minute',
    },
  },
}, async (request, reply) => {
  if (!doorService) {
    return APIError.serviceUnavailable(reply, 'Door game');
  }
  
  const { id } = request.params as { id: string };
  const currentUser = request.user;
  if (!currentUser) {
    return APIError.unauthorized(reply);
  }
  
  try {
    // Use DoorService
    const result = await doorService.enterDoor(currentUser.id, id);
    
    // Track in REST session
    const restSession = restSessionManager.getOrCreateSession(currentUser.id);
    restSession.data.door = {
      doorId: id,
      sessionId: result.sessionId
    };
    
    return {
      sessionId: result.sessionId,
      output: result.output,
      doorId: result.doorId,
      doorName: result.doorName,
    };
  } catch (error) {
    return APIError.internalError(reply, error instanceof Error ? error.message : undefined);
  }
});
```

### Step 4: Register RESTSessionManager in index.ts

**File:** `server/src/index.ts` (MODIFY)

```typescript
import { RESTSessionManager } from './session/RESTSessionManager.js';

// Create REST session manager
const restSessionManager = new RESTSessionManager();

// Pass to registerAPIRoutes
await registerAPIRoutes(
  server,
  userRepository,
  sessionManager,
  jwtUtil,
  config,
  messageBaseRepository,
  messageService,
  doorHandler,
  doorService,
  restSessionManager  // ADD THIS
);

// Cleanup on shutdown
process.on('SIGTERM', () => {
  restSessionManager.destroy();
  // ... other cleanup
});
```

---

## Summary

These code examples provide concrete implementations for all 6 refactoring tasks:

1. **Type Safety** - Extend Fastify types, remove `as any`
2. **Error Utilities** - Create APIError class, replace 50+ error blocks
3. **Validation Utilities** - Create RequestValidator class, replace 15+ validation blocks
4. **Door Handler Access** - Add public methods, remove private access
5. **DoorService** - Extract business logic, proper service layer
6. **Session Management** - Create RESTSessionManager, remove pseudo-session hack

**Total Effort:** 14-17 hours  
**Critical Path:** 8-9 hours (Tasks 1-4)

**Next Steps:**
1. Implement tasks 1-4 immediately (Phase 1)
2. Test thoroughly after each task
3. Implement tasks 5-6 in next sprint (Phase 2)
4. Continue with Milestone 6 remaining tasks

---

**Document Created:** 2025-12-01  
**Status:** Ready for Implementation
