# Refactoring Priority List - Post Task 43

**Date:** December 3, 2025  
**Context:** Milestone 7 - 30% complete (AI SysOp testing done)  
**Architecture Score:** 8.8/10

---

## Priority Classification

- 🔴 **P0 - Critical:** Must fix before continuing (blocks demo/testing)
- 🟡 **P1 - High:** Should fix soon (affects maintainability)
- 🟢 **P2 - Medium:** Nice to have (optimization/cleanup)
- 🔵 **P3 - Low:** Future enhancement (post-MVP)

---

## 🔴 P0 - Critical (Must Complete Before Task 44)

### P0.1: Fix ANSI Frame Alignment Issues

**Task:** 51.1-51.5  
**Effort:** 4-6 hours  
**Impact:** High - Affects user experience across all screens

**Problem:**
ANSI frames are misaligned due to variable substitution not accounting for ANSI escape codes in width calculations.

**Example:**
```
╔═══════════════════════════════════════════════════════╗
║  Welcome to BaudAgain BBS                            ║  <- Right border misaligned
║  Node 1                                               ║
╚═══════════════════════════════════════════════════════╝
```

**Solution:**
1. Create `ANSIFrameBuilder` utility class
2. Implement proper width calculation (excluding ANSI codes)
3. Create `ANSIFrameValidator` for testing
4. Update all screens to use new builder
5. Add visual regression tests

**Files to Create:**
- `server/src/ansi/ANSIFrameBuilder.ts`
- `server/src/ansi/ANSIFrameValidator.ts`
- `server/src/ansi/ANSIFrameBuilder.test.ts`

**Files to Update:**
- `server/src/ansi/ANSIRenderer.ts`
- `server/src/handlers/MessageHandler.ts`
- `server/src/handlers/DoorHandler.ts`
- `server/src/handlers/MenuHandler.ts`
- `data/ansi/welcome.ans`
- `data/ansi/goodbye.ans`

**Acceptance Criteria:**
- [ ] All frames have consistent width
- [ ] Right borders align properly
- [ ] Variable substitution works correctly
- [ ] Visual regression tests pass
- [ ] All existing tests still pass

**Why P0:**
- Affects every screen in the system
- Impacts demo quality
- User-facing issue
- Discovered during testing (Task 39)

---

## 🟡 P1 - High Priority (Should Complete During Milestone 7)

### P1.1: Split Monolithic routes.ts File

**Task:** 39.1 (from Milestone 6.5)  
**Effort:** 4-6 hours  
**Impact:** High - Improves maintainability

**Problem:**
`server/src/api/routes.ts` is 2119 lines - unmaintainable and violates Single Responsibility Principle.

**Solution:**
Split into separate route files:

```
server/src/api/routes/
├── index.ts              (~100 lines - main registration)
├── auth.routes.ts        (~200 lines - authentication)
├── user.routes.ts        (~300 lines - user management)
├── message.routes.ts     (~400 lines - messages & bases)
├── door.routes.ts        (~500 lines - door games)
├── system.routes.ts      (~200 lines - system admin)
└── config.routes.ts      (~300 lines - AI config assistant)
```

**Implementation Plan:**
1. Create route file structure
2. Extract authentication routes
3. Extract user management routes
4. Extract message routes
5. Extract door game routes
6. Extract system routes
7. Extract config routes
8. Update main routes.ts to import and register
9. Verify all 385 tests still pass

**Acceptance Criteria:**
- [ ] Each route file < 500 lines
- [ ] Clear separation of concerns
- [ ] All tests pass
- [ ] No functional regressions
- [ ] Easier to navigate and maintain

**Why P1:**
- File is becoming unmaintainable
- Merge conflicts likely
- Hard to find specific routes
- Violates best practices

**Can Defer:** Yes, to post-Milestone 7 if time-constrained

---

### P1.2: Create API Response Helper Utilities

**Task:** 39.2 (from Milestone 6.5)  
**Effort:** 2-3 hours  
**Impact:** Medium - Reduces code duplication by ~40%

**Problem:**
Error handling patterns repeated 30+ times across routes.ts:

```typescript
// Repeated pattern #1 (service unavailable)
if (!messageService) {
  reply.code(501).send({ 
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Message service not available'
    }
  });
  return;
}

// Repeated pattern #2 (invalid input)
if (!subject || subject.trim().length === 0) {
  reply.code(400).send({ 
    error: {
      code: 'INVALID_INPUT',
      message: 'Subject is required'
    }
  });
  return;
}

// Repeated pattern #3 (not found)
if (!message) {
  reply.code(404).send({ 
    error: {
      code: 'NOT_FOUND',
      message: 'Message not found'
    }
  });
  return;
}
```

**Solution:**
Create `server/src/api/utils/response-helpers.ts`:

```typescript
export class APIResponseHelper {
  // Service availability
  static sendServiceUnavailable(reply: FastifyReply, serviceName: string) {
    reply.code(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${serviceName} not available`
      }
    });
  }

  // Validation errors
  static sendInvalidInput(reply: FastifyReply, message: string) {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message
      }
    });
  }

  // Not found errors
  static sendNotFound(reply: FastifyReply, resourceName: string) {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `${resourceName} not found`
      }
    });
  }

  // Authorization errors
  static sendForbidden(reply: FastifyReply, message: string) {
    reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message
      }
    });
  }

  // Rate limit errors
  static sendRateLimitExceeded(reply: FastifyReply, message: string) {
    reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    });
  }

  // Internal errors
  static sendInternalError(reply: FastifyReply, message: string) {
    reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message
      }
    });
  }
}
```

**Usage Example:**
```typescript
// Before
if (!messageService) {
  reply.code(501).send({ 
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Message service not available'
    }
  });
  return;
}

// After
if (!messageService) {
  return APIResponseHelper.sendServiceUnavailable(reply, 'Message service');
}
```

**Acceptance Criteria:**
- [ ] Helper class created with all common patterns
- [ ] All routes updated to use helpers
- [ ] Code duplication reduced by ~40%
- [ ] All tests pass
- [ ] Consistent error responses

**Why P1:**
- Significant code duplication
- Inconsistent error messages
- Hard to maintain
- Easy win for code quality

**Can Defer:** Yes, can be done incrementally

---

### P1.3: Extract Common Handler Patterns

**Effort:** 3-4 hours  
**Impact:** Medium - Reduces handler duplication

**Problem:**
Similar patterns in MessageHandler and DoorHandler:

```typescript
// MessageHandler.ts
private showMessageBaseList(session: Session): string {
  let output = '\r\n';
  output += '╔═══════════════════════════════════════════════════════╗\r\n';
  output += '║                  MESSAGE BASES                        ║\r\n';
  output += '╠═══════════════════════════════════════════════════════╣\r\n';
  // ... frame building
}

// DoorHandler.ts
private showDoorMenu(message?: string): string {
  let output = message || '';
  output += '\r\n';
  output += '╔═══════════════════════════════════════════════════════╗\r\n';
  output += '║                   DOOR GAMES                          ║\r\n';
  output += '╠═══════════════════════════════════════════════════════╣\r\n';
  // ... frame building
}
```

**Solution:**
Will be addressed by P0.1 (ANSIFrameBuilder). Once frame builder is in place, update handlers to use it:

```typescript
// After P0.1
private showMessageBaseList(session: Session): string {
  const frame = new ANSIFrameBuilder(55)
    .addLine('MESSAGE BASES', 'center')
    .addSeparator()
    .addLine('1. General Discussion (42)', 'left')
    .addLine('2. Tech Support (15)', 'left')
    .addLine('', 'left')
    .addLine('Q. Return to Main Menu', 'left')
    .build();
  
  return '\r\n' + frame + '\r\nSelect: ';
}
```

**Acceptance Criteria:**
- [ ] Handlers use ANSIFrameBuilder
- [ ] No manual frame building
- [ ] Consistent frame appearance
- [ ] All tests pass

**Why P1:**
- Code duplication
- Inconsistent formatting
- Will be fixed by P0.1

**Dependency:** Requires P0.1 completion

---

## 🟢 P2 - Medium Priority (Post-Milestone 7)

### P2.1: Optimize Door Timeout Checking

**Task:** 39.4 (from Milestone 6.5)  
**Effort:** 2-3 hours  
**Impact:** Low - Performance optimization

**Problem:**
Polling-based timeout checking every 5 minutes is inefficient:

```typescript
// Current: DoorHandler.ts
private startTimeoutChecking(): void {
  this.timeoutCheckInterval = setInterval(() => {
    this.checkDoorTimeouts();
  }, 5 * 60 * 1000); // Check every 5 minutes
}

private checkDoorTimeouts(): void {
  const now = Date.now();
  const allSessions = this.deps.sessionManager.getAllSessions();
  
  for (const session of allSessions) {
    if (session.state === SessionState.IN_DOOR) {
      const inactiveTime = now - session.lastActivity.getTime();
      if (inactiveTime > this.doorTimeoutMs) {
        // Exit door
      }
    }
  }
}
```

**Solution:**
Lazy evaluation - check timeout only when door is accessed:

```typescript
// Proposed: DoorService.ts
async sendInput(userId: string, doorId: string, input: string) {
  const session = this.getSession(userId, doorId);
  
  // Check timeout lazily
  if (this.isSessionTimedOut(session)) {
    await this.exitDoorDueToTimeout(session);
    throw new Error('Session timed out due to inactivity');
  }
  
  // Process input
  return await this.processInput(session, input);
}

private isSessionTimedOut(session: Session): boolean {
  const inactiveTime = Date.now() - session.lastActivity.getTime();
  return inactiveTime > this.doorTimeoutMs;
}
```

**Benefits:**
- No polling overhead
- Timeout checked exactly when needed
- More accurate timeout detection
- Simpler code

**Acceptance Criteria:**
- [ ] Remove polling interval
- [ ] Add lazy timeout checking
- [ ] All timeout tests pass
- [ ] No functional regressions

**Why P2:**
- Performance optimization
- Not critical for functionality
- Low risk change

---

### P2.2: Add JSON Schema Validation

**Task:** 39.3 (from Milestone 6.5)  
**Effort:** 3-4 hours  
**Impact:** Low - Code quality improvement

**Problem:**
Manual validation in every endpoint:

```typescript
// Current
if (!subject || subject.trim().length === 0) {
  reply.code(400).send({ error: 'Subject is required' });
  return;
}

if (subject.length > 200) {
  reply.code(400).send({ error: 'Subject too long' });
  return;
}
```

**Solution:**
Use Fastify JSON Schema validation:

```typescript
// Proposed: server/src/api/schemas/message.schema.ts
export const postMessageSchema = {
  body: {
    type: 'object',
    required: ['subject', 'body'],
    properties: {
      subject: {
        type: 'string',
        minLength: 1,
        maxLength: 200
      },
      body: {
        type: 'string',
        minLength: 1,
        maxLength: 10000
      }
    }
  }
};

// Usage
server.post('/api/v1/messages', {
  schema: postMessageSchema,
  preHandler: authenticateUser
}, async (request, reply) => {
  // Validation automatic - no manual checks needed
});
```

**Acceptance Criteria:**
- [ ] Schema files created for all endpoints
- [ ] Manual validation removed
- [ ] All tests pass
- [ ] Validation still works correctly

**Why P2:**
- Code quality improvement
- Not critical for functionality
- Can be done incrementally

---

### P2.3: Configure CORS for Production

**Task:** 39.5 (from Milestone 6.5)  
**Effort:** 30 minutes  
**Impact:** Low - Security improvement

**Problem:**
CORS currently allows all origins (development setting):

```typescript
// Current: server/src/index.ts
await server.register(cors, {
  origin: true // Allow all origins
});
```

**Solution:**
Environment-based CORS configuration:

```typescript
// Proposed
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'];

await server.register(cors, {
  origin: corsOrigins,
  credentials: true
});
```

**Acceptance Criteria:**
- [ ] CORS_ORIGINS environment variable
- [ ] Default to localhost for development
- [ ] Documentation updated
- [ ] Control panel still works

**Why P2:**
- Security improvement
- Not critical for development
- Easy to implement

---

## 🔵 P3 - Low Priority (Future Enhancements)

### P3.1: Create Base Handler Class

**Effort:** 2-3 hours  
**Impact:** Low - Code organization

**Problem:**
Handlers have some common patterns that could be extracted.

**Solution:**
Create `BaseHandler` class with common functionality:

```typescript
// Proposed: server/src/handlers/BaseHandler.ts
export abstract class BaseHandler implements CommandHandler {
  protected deps: HandlerDependencies;
  
  constructor(deps: HandlerDependencies) {
    this.deps = deps;
  }
  
  abstract canHandle(command: string, session: Session): boolean;
  abstract handle(command: string, session: Session): Promise<string>;
  
  // Common utilities
  protected wordWrap(text: string, width: number): string[] {
    // Shared implementation
  }
  
  protected buildFrame(title: string, content: string[]): string {
    // Use ANSIFrameBuilder
  }
}
```

**Why P3:**
- Nice to have
- Not critical
- Low impact

---

### P3.2: Add Request/Response Logging Middleware

**Effort:** 1-2 hours  
**Impact:** Low - Debugging aid

**Solution:**
Add structured logging for all API requests:

```typescript
// Proposed: server/src/api/middleware/logging.middleware.ts
export function createLoggingMiddleware(logger: FastifyBaseLogger) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now();
    
    reply.addHook('onSend', async () => {
      const duration = Date.now() - start;
      logger.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration,
        userId: (request as any).user?.id
      }, 'API request completed');
    });
  };
}
```

**Why P3:**
- Debugging aid
- Not critical
- Can add later

---

## Summary

### Critical Path (Must Complete)

1. **P0.1: Fix ANSI Frame Alignment** (4-6 hours)
   - Blocks demo quality
   - Affects all screens
   - Must complete before Task 44

### High Priority (Should Complete)

2. **P1.1: Split routes.ts** (4-6 hours)
   - Can defer to post-Milestone 7
   - Improves maintainability
   - Low risk

3. **P1.2: Response Helpers** (2-3 hours)
   - Can do incrementally
   - Reduces duplication
   - Easy win

4. **P1.3: Extract Handler Patterns** (3-4 hours)
   - Depends on P0.1
   - Reduces duplication
   - Improves consistency

### Medium Priority (Post-Milestone 7)

5. **P2.1: Optimize Door Timeouts** (2-3 hours)
6. **P2.2: JSON Schema Validation** (3-4 hours)
7. **P2.3: CORS Configuration** (30 minutes)

### Total Effort Estimates

- **P0 (Critical):** 4-6 hours
- **P1 (High):** 9-13 hours
- **P2 (Medium):** 6-8 hours
- **P3 (Low):** 3-5 hours

**Total:** 22-32 hours of refactoring work

### Recommended Schedule

**Before Task 44 (Door Game Testing):**
- Complete P0.1 (ANSI frames) - **REQUIRED**

**During Milestone 7:**
- Consider P1.1 (split routes.ts) if time permits
- Can defer to post-Milestone 7

**Post-Milestone 7:**
- Complete P1.1, P1.2, P1.3
- Complete P2.1, P2.2, P2.3
- Consider P3 items

---

**Document Created:** December 3, 2025  
**Next Review:** After P0.1 completion  
**Status:** Ready for implementation
