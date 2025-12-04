# Code Quality Improvements - Post Milestone 6

**Date:** 2025-12-01  
**Priority:** ⚠️ HIGH - Fix after critical issues  
**Estimated Time:** 8-10 hours

---

## Overview

After fixing the critical architectural issues, these code quality improvements will make the REST API more maintainable, testable, and consistent.

---

## Improvement #1: Extract Validation Utilities

### Problem
Input validation logic is duplicated across multiple endpoints.

### Current Code (Duplicated)
```typescript
// Repeated in POST /api/v1/message-bases/:id/messages
if (!subject || subject.trim().length === 0) {
  reply.code(400).send({ 
    error: { code: 'INVALID_INPUT', message: 'Subject is required' }
  });
  return;
}
if (!body || body.trim().length === 0) {
  reply.code(400).send({ 
    error: { code: 'INVALID_INPUT', message: 'Body is required' }
  });
  return;
}

// Repeated in POST /api/v1/messages/:id/replies
// Same validation code again...
```

### Solution
**File:** `server/src/api/validation.ts` (NEW)

```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const messageValidation = {
  subject: (value: string) => {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Subject is required', 'subject');
    }
    if (value.length > 200) {
      throw new ValidationError('Subject too long (max 200 chars)', 'subject');
    }
    return value.trim();
  },
  
  body: (value: string) => {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Body is required', 'body');
    }
    if (value.length > 10000) {
      throw new ValidationError('Body too long (max 10000 chars)', 'body');
    }
    return value.trim();
  },
};

export const doorValidation = {
  input: (value: string) => {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Input is required', 'input');
    }
    if (value.length > 1000) {
      throw new ValidationError('Input too long (max 1000 chars)', 'input');
    }
    return value.trim();
  },
  
  sessionId: (value: string | undefined) => {
    if (value && !isValidUUID(value)) {
      throw new ValidationError('Invalid session ID format', 'sessionId');
    }
    return value;
  },
};

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
```

### Usage
```typescript
// In routes.ts
import { messageValidation, ValidationError } from './validation.js';

try {
  const subject = messageValidation.subject(request.body.subject);
  const body = messageValidation.body(request.body.body);
  
  // Proceed with validated data
  const message = messageService.postMessage({ subject, body, ... });
  return message;
} catch (error) {
  if (error instanceof ValidationError) {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message: error.message,
        field: error.field,
      }
    });
  } else {
    // Handle other errors
  }
}
```

**Time:** 2 hours  
**Impact:** Eliminates duplication, consistent validation

---

## Improvement #2: Standardize Error Handling

### Problem
Error handling patterns vary across endpoints.

### Current Code (Inconsistent)
```typescript
// Pattern 1: Try-catch with specific error codes
try {
  const message = messageService.postMessage({...});
  return {...};
} catch (error) {
  if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
    reply.code(429).send({ error: { code: 'RATE_LIMIT_EXCEEDED', ... }});
  } else {
    reply.code(400).send({ error: { code: 'INVALID_INPUT', ... }});
  }
}

// Pattern 2: No try-catch, direct error response
if (!subject) {
  reply.code(400).send({ error: { code: 'INVALID_INPUT', ... }});
  return;
}

// Pattern 3: Generic error handling
} catch (error) {
  reply.code(500).send({ error: { code: 'INTERNAL_ERROR', ... }});
}
```

### Solution
**File:** `server/src/api/errors.ts` (NEW)

```typescript
import type { FastifyReply } from 'fastify';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public field: string) {
    super(message, 400, 'INVALID_INPUT', { field });
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

export class RateLimitError extends APIError {
  constructor(message: string, public retryAfter: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

export class APIErrorHandler {
  static handle(error: unknown, reply: FastifyReply): void {
    if (error instanceof APIError) {
      reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...error.details,
        }
      });
    } else if (error instanceof Error) {
      // Check for known error patterns
      if (error.message.includes('Rate limit exceeded')) {
        reply.code(429).send({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
          }
        });
      } else {
        // Unknown error
        reply.code(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          }
        });
      }
    } else {
      reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        }
      });
    }
  }
}
```

### Usage
```typescript
// In routes.ts
import { APIErrorHandler, NotFoundError, ForbiddenError } from './errors.js';

server.post('/api/v1/message-bases/:id/messages', {
  preHandler: authenticateUser,
}, async (request: AuthenticatedRequest, reply) => {
  try {
    const { id } = request.params;
    const currentUser = request.user;
    
    // Validate
    const subject = messageValidation.subject(request.body.subject);
    const body = messageValidation.body(request.body.body);
    
    // Check permissions
    const base = messageService.getMessageBase(id);
    if (!base) {
      throw new NotFoundError('Message base not found');
    }
    
    const canWrite = await messageService.canUserWriteBase(currentUser.id, id);
    if (!canWrite) {
      throw new ForbiddenError('Insufficient access level to post to this message base');
    }
    
    // Post message
    const message = messageService.postMessage({ subject, body, ... });
    return message;
    
  } catch (error) {
    APIErrorHandler.handle(error, reply);
  }
});
```

**Time:** 2-3 hours  
**Impact:** Consistent error handling, cleaner code

---

## Improvement #3: Create DoorService

### Problem
Door endpoints directly manipulate DoorHandler, bypassing service layer.

### Current Flow
```
REST API → DoorHandler (private methods) → Door
```

### Correct Flow
```
REST API → DoorService → DoorHandler → Door
```

### Solution
**File:** `server/src/services/DoorService.ts` (NEW)

```typescript
import type { DoorHandler } from '../handlers/DoorHandler.js';
import type { DoorSessionService, DoorSession } from './DoorSessionService.js';
import { NotFoundError, ForbiddenError } from '../api/errors.js';

export class DoorService {
  constructor(
    private doorHandler: DoorHandler,
    private doorSessionService: DoorSessionService
  ) {}
  
  /**
   * Get all available doors
   */
  getAllDoors() {
    return this.doorHandler.getAllDoors().map(door => ({
      id: door.id,
      name: door.name,
      description: door.description,
    }));
  }
  
  /**
   * Enter a door game
   */
  async enterDoor(userId: string, doorId: string): Promise<{
    sessionId: string;
    output: string;
    doorId: string;
    doorName: string;
  }> {
    // Get door
    const door = this.doorHandler.getDoor(doorId);
    if (!door) {
      throw new NotFoundError('Door game not found');
    }
    
    // Create session
    const session = this.doorSessionService.createSession(userId, doorId);
    
    // Enter door
    const output = await door.enter(this.convertToLegacySession(session));
    
    return {
      sessionId: session.id,
      output,
      doorId: door.id,
      doorName: door.name,
    };
  }
  
  /**
   * Process input in door game
   */
  async processDoorInput(
    sessionId: string,
    userId: string,
    input: string
  ): Promise<{ output: string; exited: boolean }> {
    // Get session
    const session = this.doorSessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found. Please enter the door first.');
    }
    
    // Verify ownership
    if (session.userId !== userId) {
      throw new ForbiddenError('Session does not belong to current user');
    }
    
    // Get door
    const door = this.doorHandler.getDoor(session.doorId);
    if (!door) {
      throw new NotFoundError('Door game not found');
    }
    
    // Process input
    const legacySession = this.convertToLegacySession(session);
    const output = await door.processInput(input, legacySession);
    
    // Update session
    this.doorSessionService.updateSession(sessionId, {
      gameState: legacySession.data.door?.gameState,
      history: legacySession.data.door?.history,
    });
    
    // Check if exited
    const exited = legacySession.state !== 'in_door';
    
    return { output, exited };
  }
  
  /**
   * Exit door game
   */
  async exitDoor(
    sessionId: string,
    userId: string
  ): Promise<{ output: string }> {
    // Get session
    const session = this.doorSessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    
    // Verify ownership
    if (session.userId !== userId) {
      throw new ForbiddenError('Session does not belong to current user');
    }
    
    // Get door
    const door = this.doorHandler.getDoor(session.doorId);
    if (!door) {
      throw new NotFoundError('Door game not found');
    }
    
    // Exit door
    const legacySession = this.convertToLegacySession(session);
    const output = await door.exit(legacySession);
    
    // Delete session
    this.doorSessionService.deleteSession(sessionId);
    
    return { output };
  }
  
  /**
   * Get door session info
   */
  getDoorSession(sessionId: string, userId: string): DoorSession | null {
    const session = this.doorSessionService.getSession(sessionId);
    
    if (!session || session.userId !== userId) {
      return null;
    }
    
    return session;
  }
  
  /**
   * Get door statistics
   */
  getDoorStats(doorId: string) {
    const door = this.doorHandler.getDoor(doorId);
    if (!door) {
      throw new NotFoundError('Door game not found');
    }
    
    // Count active sessions for this door
    const activeSessions = this.doorSessionService.getActiveSessionCount(doorId);
    
    return {
      doorId: door.id,
      doorName: door.name,
      activeSessions,
      timeout: this.doorHandler.getDoorTimeout(),
    };
  }
  
  /**
   * Convert DoorSession to legacy Session format
   * (temporary until we refactor door games to use DoorSession directly)
   */
  private convertToLegacySession(doorSession: DoorSession): any {
    return {
      id: doorSession.id,
      userId: doorSession.userId,
      state: 'in_door',
      data: {
        door: {
          doorId: doorSession.doorId,
          gameState: doorSession.gameState,
          history: doorSession.history,
        }
      },
      lastActivity: doorSession.lastActivity,
    };
  }
}
```

### Usage
```typescript
// In routes.ts
import { DoorService } from '../services/DoorService.js';

// Inject service
const doorService = new DoorService(doorHandler, doorSessionService);

// Use in endpoints
server.post('/api/v1/doors/:id/enter', {
  preHandler: authenticateUser,
}, async (request: AuthenticatedRequest, reply) => {
  try {
    const { id } = request.params;
    const result = await doorService.enterDoor(request.user.id, id);
    return result;
  } catch (error) {
    APIErrorHandler.handle(error, reply);
  }
});
```

**Time:** 3-4 hours  
**Impact:** Proper service layer, better testability

---

## Improvement #4: Split routes.ts into Multiple Files

### Problem
Single file with 1845 lines is difficult to navigate and maintain.

### Current Structure
```
server/src/api/
└── routes.ts (1845 lines)
```

### Proposed Structure
```
server/src/api/
├── routes/
│   ├── auth.ts       (authentication endpoints)
│   ├── users.ts      (user management)
│   ├── messages.ts   (message operations)
│   ├── doors.ts      (door game operations)
│   └── index.ts      (register all routes)
├── middleware/
│   ├── auth.ts       (authentication middleware)
│   └── permissions.ts (permission checks)
├── validation.ts     (input validation)
├── errors.ts         (error handling)
└── types.ts          (TypeScript types)
```

### Implementation
**File:** `server/src/api/routes/auth.ts` (NEW)

```typescript
import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../../db/repositories/UserRepository.js';
import type { JWTUtil } from '../../auth/jwt.js';
import bcrypt from 'bcrypt';
import { APIErrorHandler } from '../errors.js';

export async function registerAuthRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  jwtUtil: JWTUtil
) {
  // POST /api/v1/auth/register
  server.post('/api/v1/auth/register', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      // Implementation
    } catch (error) {
      APIErrorHandler.handle(error, reply);
    }
  });
  
  // POST /api/v1/auth/login
  server.post('/api/v1/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      // Implementation
    } catch (error) {
      APIErrorHandler.handle(error, reply);
    }
  });
  
  // More auth endpoints...
}
```

**File:** `server/src/api/routes/index.ts` (NEW)

```typescript
import type { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from './auth.js';
import { registerUserRoutes } from './users.js';
import { registerMessageRoutes } from './messages.js';
import { registerDoorRoutes } from './doors.js';

export async function registerAllRoutes(
  server: FastifyInstance,
  dependencies: any
) {
  await registerAuthRoutes(server, dependencies.userRepository, dependencies.jwtUtil);
  await registerUserRoutes(server, dependencies.userRepository, dependencies.jwtUtil);
  await registerMessageRoutes(server, dependencies.messageService, dependencies.jwtUtil);
  await registerDoorRoutes(server, dependencies.doorService, dependencies.jwtUtil);
}
```

**Time:** 4-5 hours  
**Impact:** Better organization, easier navigation

---

## Summary

| Improvement | File | Time | Priority |
|-------------|------|------|----------|
| Extract Validation | server/src/api/validation.ts (NEW) | 2 hours | ⚠️ High |
| Standardize Errors | server/src/api/errors.ts (NEW) | 2-3 hours | ⚠️ High |
| Create DoorService | server/src/services/DoorService.ts (NEW) | 3-4 hours | ⚠️ High |
| Split routes.ts | server/src/api/routes/* (NEW) | 4-5 hours | ⚠️ Medium |

**Total Time:** 11-14 hours

---

## Implementation Order

### Week 1: Critical Fixes
1. Fix encapsulation (2-3 hours)
2. Fix pseudo-sessions (3-4 hours)
3. Fix type safety (2-3 hours)

### Week 2: Code Quality
4. Extract validation (2 hours)
5. Standardize errors (2-3 hours)
6. Create DoorService (3-4 hours)

### Week 3: Refactoring
7. Split routes.ts (4-5 hours)
8. Add unit tests (8-10 hours)

---

## Benefits After Improvements

- ✅ No code duplication
- ✅ Consistent error handling
- ✅ Proper service layer
- ✅ Clean code organization
- ✅ Easy to test
- ✅ Easy to maintain
- ✅ Production-ready

---

**Created:** 2025-12-01  
**Status:** Recommended  
**Next Step:** Complete critical fixes first, then apply these improvements

