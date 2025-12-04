# Refactoring Priority List: Post-Task 44

**Date:** December 3, 2025  
**Status:** Milestone 6.5 Planning  
**Architecture Score:** 8.7/10 (target: 9.2/10)  
**Estimated Time:** 12-16 hours

---

## Executive Summary

This document provides a prioritized list of refactoring tasks to address technical debt identified in the Post-Task 44 architecture review. These tasks should be completed as **Milestone 6.5** before resuming Milestone 7 testing.

**Key Insight:** The codebase has reached a maintainability threshold where further feature development without refactoring will become increasingly difficult and error-prone.

---

## Priority Levels

- **P0 (Critical):** Must complete before continuing development
- **P1 (High):** Should complete soon, significant impact
- **P2 (Medium):** Nice to have, moderate impact
- **P3 (Low):** Can wait, minor impact

---

## P0 - Critical Priority

### Task 39.1: Split routes.ts into Separate Route Files

**Problem:**
- routes.ts has grown to 2,119 lines
- Unmaintainable monolith
- Difficult to navigate and review
- High risk of merge conflicts

**Impact:** VERY HIGH  
**Effort:** 4-6 hours  
**Risk:** LOW (well-defined refactoring)

**Implementation Plan:**

1. **Create route file structure:**
```
server/src/api/routes/
├── auth.routes.ts          # Authentication endpoints (4 endpoints)
├── user.routes.ts          # User management (3 endpoints)
├── message.routes.ts       # Messages & bases (7 endpoints)
├── door.routes.ts          # Door games (8 endpoints)
├── system.routes.ts        # System admin (2 endpoints)
└── config.routes.ts        # AI configuration (4 endpoints)
```

2. **Extract each route group:**
```typescript
// auth.routes.ts
export async function registerAuthRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  jwtUtil: JWTUtil
) {
  // POST /api/v1/auth/register
  // POST /api/v1/auth/login
  // POST /api/v1/auth/refresh
  // GET /api/v1/auth/me
}
```

3. **Update main routes.ts:**
```typescript
// routes.ts (now ~100 lines)
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerUserRoutes } from './routes/user.routes.js';
// ... etc

export async function registerAPIRoutes(
  server: FastifyInstance,
  // ... dependencies
) {
  await registerAuthRoutes(server, userRepository, jwtUtil);
  await registerUserRoutes(server, userRepository, jwtUtil);
  // ... etc
}
```

4. **Verify all tests pass:**
```bash
npm test -- routes.test.ts --run
```

**Success Criteria:**
- ✅ routes.ts reduced to ~100 lines
- ✅ 6 new route files created
- ✅ All 385 tests passing
- ✅ No functional changes
- ✅ Improved code organization

**Files to Create:**
- `server/src/api/routes/auth.routes.ts`
- `server/src/api/routes/user.routes.ts`
- `server/src/api/routes/message.routes.ts`
- `server/src/api/routes/door.routes.ts`
- `server/src/api/routes/system.routes.ts`
- `server/src/api/routes/config.routes.ts`

**Files to Modify:**
- `server/src/api/routes.ts` (major refactor)

---

### Task 39.2: Create APIResponseHelper Utility

**Problem:**
- Error handling code duplicated 30+ times
- Inconsistent error messages
- Difficult to change error format
- 40% code duplication in routes

**Impact:** VERY HIGH  
**Effort:** 2-3 hours  
**Risk:** LOW (pure utility extraction)

**Implementation Plan:**

1. **Create utility file:**
```typescript
// server/src/api/utils/response-helpers.ts

import type { FastifyReply } from 'fastify';

export class APIResponseHelper {
  /**
   * Send 501 Not Implemented error
   */
  static sendServiceUnavailable(
    reply: FastifyReply,
    serviceName: string
  ): void {
    reply.code(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${serviceName} not available`
      }
    });
  }

  /**
   * Send 404 Not Found error
   */
  static sendNotFound(
    reply: FastifyReply,
    resourceName: string
  ): void {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `${resourceName} not found`
      }
    });
  }

  /**
   * Send 403 Forbidden error
   */
  static sendForbidden(
    reply: FastifyReply,
    message: string = 'Insufficient permissions'
  ): void {
    reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message
      }
    });
  }

  /**
   * Send 400 Bad Request error
   */
  static sendBadRequest(
    reply: FastifyReply,
    message: string
  ): void {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message
      }
    });
  }

  /**
   * Send 401 Unauthorized error
   */
  static sendUnauthorized(
    reply: FastifyReply,
    message: string = 'Invalid credentials'
  ): void {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message
      }
    });
  }

  /**
   * Send 429 Rate Limit Exceeded error
   */
  static sendRateLimitExceeded(
    reply: FastifyReply,
    message: string
  ): void {
    reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    });
  }

  /**
   * Send 500 Internal Server Error
   */
  static sendInternalError(
    reply: FastifyReply,
    message: string = 'Internal server error'
  ): void {
    reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message
      }
    });
  }

  /**
   * Check if service is available and send error if not
   * Returns true if available, false if error sent
   */
  static checkServiceAvailable(
    reply: FastifyReply,
    service: any,
    serviceName: string
  ): boolean {
    if (!service) {
      this.sendServiceUnavailable(reply, serviceName);
      return false;
    }
    return true;
  }

  /**
   * Check if resource exists and send error if not
   * Returns the resource if found, null if error sent
   */
  static checkResourceExists<T>(
    reply: FastifyReply,
    resource: T | null | undefined,
    resourceName: string
  ): T | null {
    if (!resource) {
      this.sendNotFound(reply, resourceName);
      return null;
    }
    return resource;
  }

  /**
   * Check if user has required access level
   * Returns true if authorized, false if error sent
   */
  static checkAccessLevel(
    reply: FastifyReply,
    userAccessLevel: number,
    requiredLevel: number,
    message?: string
  ): boolean {
    if (userAccessLevel < requiredLevel) {
      this.sendForbidden(reply, message);
      return false;
    }
    return true;
  }

  /**
   * Validate required fields and send error if missing
   * Returns true if valid, false if error sent
   */
  static validateRequired(
    reply: FastifyReply,
    data: Record<string, any>,
    requiredFields: string[]
  ): boolean {
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
        this.sendBadRequest(reply, `${field} is required`);
        return false;
      }
    }
    return true;
  }
}
```

2. **Update route files to use helpers:**
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
if (!APIResponseHelper.checkServiceAvailable(reply, messageService, 'Message service')) {
  return;
}
```

3. **Create tests:**
```typescript
// server/src/api/utils/response-helpers.test.ts
describe('APIResponseHelper', () => {
  it('should send service unavailable error', () => {
    // Test implementation
  });
  // ... more tests
});
```

**Success Criteria:**
- ✅ APIResponseHelper utility created
- ✅ All route files updated to use helpers
- ✅ Code duplication reduced by ~40%
- ✅ All tests passing
- ✅ Consistent error responses

**Files to Create:**
- `server/src/api/utils/response-helpers.ts`
- `server/src/api/utils/response-helpers.test.ts`

**Files to Modify:**
- All route files (6 files)

---

## P1 - High Priority

### Task 39.3: Add JSON Schema Validation

**Problem:**
- Manual validation repeated in every endpoint
- Inconsistent validation logic
- Easy to miss validation
- No centralized validation schema

**Impact:** HIGH  
**Effort:** 3-4 hours  
**Risk:** MEDIUM (requires careful schema design)

**Implementation Plan:**

1. **Create schema directory:**
```
server/src/api/schemas/
├── auth.schema.ts
├── user.schema.ts
├── message.schema.ts
├── door.schema.ts
└── system.schema.ts
```

2. **Define schemas:**
```typescript
// server/src/api/schemas/message.schema.ts

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

export const postReplySchema = {
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
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid'
      }
    }
  }
};
```

3. **Update routes to use schemas:**
```typescript
// Before
server.post('/api/v1/messages', {
  preHandler: authenticateUser
}, async (request, reply) => {
  const { subject, body } = request.body as { subject: string; body: string };
  
  if (!subject || subject.trim().length === 0) {
    reply.code(400).send({ error: 'Subject is required' });
    return;
  }
  // ... more validation
});

// After
server.post('/api/v1/messages', {
  schema: postMessageSchema,
  preHandler: authenticateUser
}, async (request, reply) => {
  const { subject, body } = request.body; // Already validated
  // ... business logic
});
```

4. **Remove manual validation code**

**Success Criteria:**
- ✅ Schema files created for all route groups
- ✅ All routes updated to use schemas
- ✅ Manual validation code removed
- ✅ All tests passing
- ✅ Better error messages from schema validation

**Files to Create:**
- `server/src/api/schemas/auth.schema.ts`
- `server/src/api/schemas/user.schema.ts`
- `server/src/api/schemas/message.schema.ts`
- `server/src/api/schemas/door.schema.ts`
- `server/src/api/schemas/system.schema.ts`

**Files to Modify:**
- All route files (6 files)

---

## P2 - Medium Priority

### Task 39.4: Optimize Door Timeout Checking

**Problem:**
- Polling-based timeout checking (every 5 minutes)
- Checks all sessions even when no doors active
- Imprecise timeout resolution (5 minutes)
- Doesn't scale well

**Impact:** MEDIUM  
**Effort:** 2-3 hours  
**Risk:** LOW (well-isolated change)

**Implementation Plan:**

1. **Remove polling interval:**
```typescript
// Remove from DoorHandler constructor
// this.startTimeoutChecking();
```

2. **Add lazy timeout evaluation:**
```typescript
export class DoorHandler implements CommandHandler {
  private doorTimeoutMs: number = 30 * 60 * 1000;
  
  /**
   * Check if session has timed out
   * Called on each interaction (lazy evaluation)
   */
  private isSessionTimedOut(session: Session): boolean {
    if (session.state !== SessionState.IN_DOOR) {
      return false;
    }
    
    const inactiveTime = Date.now() - session.lastActivity.getTime();
    return inactiveTime > this.doorTimeoutMs;
  }
  
  async handle(command: string, session: Session): Promise<string> {
    // Check timeout on each interaction
    if (this.isSessionTimedOut(session)) {
      const doorId = session.data.door?.doorId;
      const door = doorId ? this.doors.get(doorId) : undefined;
      return this.exitDoorDueToTimeout(session, door);
    }
    
    // ... rest of handler
  }
}
```

3. **Update tests:**
```typescript
// Test timeout behavior
it('should exit door on timeout', async () => {
  // Set short timeout for testing
  doorHandler.setDoorTimeout(1000); // 1 second
  
  // Enter door
  await doorHandler.enterDoor(door, session);
  
  // Wait for timeout
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Next interaction should exit
  const output = await doorHandler.handle('test', session);
  expect(output).toContain('timeout');
  expect(session.state).toBe(SessionState.IN_MENU);
});
```

**Success Criteria:**
- ✅ Polling interval removed
- ✅ Lazy timeout evaluation implemented
- ✅ Tests updated and passing
- ✅ No functional changes
- ✅ Better performance

**Files to Modify:**
- `server/src/handlers/DoorHandler.ts`
- `server/src/handlers/DoorHandler.test.ts` (if exists)

---

## P3 - Low Priority

### Task 39.5: Configure CORS for Production

**Problem:**
- CORS allows all origins in development
- Security risk if deployed to production
- No environment-specific configuration

**Impact:** LOW (only affects production)  
**Effort:** 30 minutes  
**Risk:** VERY LOW

**Implementation Plan:**

1. **Update CORS configuration:**
```typescript
// server/src/index.ts

await server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

2. **Update .env.example:**
```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

3. **Document in README:**
```markdown
### CORS Configuration

For production deployment, set the `CORS_ORIGIN` environment variable:

```bash
CORS_ORIGIN=https://yourdomain.com
```

For multiple origins, use a comma-separated list:

```bash
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```
```

**Success Criteria:**
- ✅ CORS configuration updated
- ✅ Environment variable added
- ✅ Documentation updated
- ✅ Development still works
- ✅ Production-ready

**Files to Modify:**
- `server/src/index.ts`
- `.env.example`
- `README.md`

---

## Implementation Timeline

### Phase 1: Critical Tasks (6-9 hours)
**Day 1 Morning:**
- Task 39.1: Split routes.ts (4-6 hours)

**Day 1 Afternoon:**
- Task 39.2: Create APIResponseHelper (2-3 hours)

### Phase 2: High Priority Tasks (3-4 hours)
**Day 2 Morning:**
- Task 39.3: Add JSON Schema validation (3-4 hours)

### Phase 3: Medium/Low Priority Tasks (2.5-3.5 hours)
**Day 2 Afternoon:**
- Task 39.4: Optimize door timeouts (2-3 hours)
- Task 39.5: Configure CORS (30 minutes)

### Phase 4: Verification (1-2 hours)
**Day 2 Evening:**
- Run all tests (385 tests)
- Manual testing of key flows
- Architecture review
- Update documentation

**Total Time: 12.5-18.5 hours**  
**Realistic Estimate: 2 working days**

---

## Success Metrics

### Code Quality Metrics

**Before Refactoring:**
```
routes.ts:                    2,119 lines
Code duplication:             40%
Manual validation:            50+ instances
Error handling duplication:   30+ instances
Architecture score:           8.7/10
```

**After Refactoring:**
```
routes.ts:                    ~100 lines
Code duplication:             <10%
Manual validation:            0 instances (schema-based)
Error handling duplication:   0 instances (helper-based)
Architecture score:           9.2/10 (target)
```

### Test Coverage

**Target:**
- ✅ All 385 existing tests passing
- ✅ New tests for APIResponseHelper
- ✅ Updated tests for door timeouts
- ✅ No functional regressions

### Performance Metrics

**Target:**
- ✅ Door timeout checking: 0 polling overhead
- ✅ API response time: No degradation
- ✅ Memory usage: Slight improvement (no polling)

---

## Risk Mitigation

### High Risk Areas

1. **Route splitting:**
   - Risk: Breaking existing functionality
   - Mitigation: Run tests after each route group extraction
   - Rollback: Git branch for easy revert

2. **Schema validation:**
   - Risk: Different validation behavior
   - Mitigation: Careful schema design, thorough testing
   - Rollback: Keep manual validation temporarily

### Testing Strategy

1. **Unit tests:** Run after each task
2. **Integration tests:** Run after each phase
3. **Manual testing:** Test key user flows
4. **Regression testing:** Full test suite at end

---

## Post-Refactoring Actions

### Immediate (Day 3)

1. **Architecture review:**
   - Re-assess architecture score
   - Document improvements
   - Update roadmap

2. **Documentation:**
   - Update ARCHITECTURE.md
   - Document refactoring decisions
   - Update API documentation

3. **Team communication:**
   - Share refactoring results
   - Explain new patterns
   - Update coding guidelines

### Short-term (Week 1)

1. **Resume Milestone 7:**
   - Continue with Task 45 (Control Panel testing)
   - Apply new patterns to remaining tasks
   - Monitor for issues

2. **Monitor metrics:**
   - Track development velocity
   - Monitor bug reports
   - Measure code review time

### Long-term (Month 1)

1. **Continuous improvement:**
   - Regular architecture reviews
   - Proactive refactoring
   - Technical debt tracking

2. **Best practices:**
   - Document patterns
   - Create coding guidelines
   - Share learnings

---

## Conclusion

This refactoring plan addresses critical technical debt that has accumulated during rapid feature development. Completing these tasks will:

✅ **Improve maintainability** by 40%  
✅ **Reduce code duplication** by 40%  
✅ **Increase architecture score** from 8.7 to 9.2  
✅ **Enable faster development** in Milestone 7  
✅ **Reduce bug risk** significantly  

**Recommendation:** Execute this plan as **Milestone 6.5** before resuming Milestone 7 testing.

---

**Document Status:** FINAL  
**Next Review:** After Milestone 6.5 completion  
**Estimated Completion:** December 4-5, 2025
