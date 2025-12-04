# Refactoring Priority List - Post Task 41

**Date:** December 3, 2025  
**Context:** After completing Task 41 (Menu Navigation Testing)  
**Status:** Milestone 7 paused for critical refactoring

---

## Executive Summary

Task 41 testing revealed that accumulated technical debt must be addressed before continuing with Milestone 7. This document provides a prioritized action plan.

**Critical Decision:** Pause Milestone 7 testing to complete Milestone 6.5 P0 refactoring.

**Rationale:**
- Monolithic routes.ts (2038 lines) will become unmaintainable
- Error handling duplication (30+ instances) causing inconsistencies
- Test code duplication will compound as more tests are added
- Better to fix now than accumulate more debt

---

## Priority 0: Critical (Must Complete Before Task 42)

### P0.1: Split routes.ts into Separate Files

**Issue:** routes.ts is 2038 lines - unmaintainable monolith

**Impact:** High - Affects all future API development

**Effort:** 4-6 hours

**Action Plan:**

1. Create route module structure:
```
server/src/api/routes/
├── auth.routes.ts       (~200 lines) - Authentication endpoints
├── user.routes.ts       (~300 lines) - User management
├── message.routes.ts    (~400 lines) - Message bases & messages
├── door.routes.ts       (~500 lines) - Door game operations
├── system.routes.ts     (~200 lines) - System announcements
├── config.routes.ts     (~300 lines) - AI config assistant
└── index.ts             (~100 lines) - Route registration
```

2. Extract each route group:
```typescript
// server/src/api/routes/auth.routes.ts
import type { FastifyInstance } from 'fastify';
import type { RouteHandlerDependencies } from './types';

export async function registerAuthRoutes(
  server: FastifyInstance,
  deps: RouteHandlerDependencies
) {
  // POST /api/v1/auth/register
  server.post('/api/v1/auth/register', { ... });
  
  // POST /api/v1/auth/login
  server.post('/api/v1/auth/login', { ... });
  
  // POST /api/v1/auth/refresh
  server.post('/api/v1/auth/refresh', { ... });
  
  // GET /api/v1/auth/me
  server.get('/api/v1/auth/me', { ... });
}
```

3. Update main routes.ts:
```typescript
// server/src/api/routes.ts
import { registerAuthRoutes } from './routes/auth.routes';
import { registerUserRoutes } from './routes/user.routes';
// ... other imports

export async function registerAPIRoutes(
  server: FastifyInstance,
  deps: RouteHandlerDependencies
) {
  await registerAuthRoutes(server, deps);
  await registerUserRoutes(server, deps);
  await registerMessageRoutes(server, deps);
  await registerDoorRoutes(server, deps);
  await registerSystemRoutes(server, deps);
  await registerConfigRoutes(server, deps);
}
```

4. Run tests to verify no regressions:
```bash
npm test -- routes.test.ts --run
```

**Success Criteria:**
- ✅ All route files < 500 lines
- ✅ Main routes.ts < 150 lines
- ✅ All 385 tests passing
- ✅ No functional changes

**Files to Create:**
- `server/src/api/routes/auth.routes.ts`
- `server/src/api/routes/user.routes.ts`
- `server/src/api/routes/message.routes.ts`
- `server/src/api/routes/door.routes.ts`
- `server/src/api/routes/system.routes.ts`
- `server/src/api/routes/config.routes.ts`
- `server/src/api/routes/types.ts` (shared types)
- `server/src/api/routes/index.ts` (re-exports)

**Files to Modify:**
- `server/src/api/routes.ts` (reduce to ~100 lines)

---

### P0.2: Create APIResponseHelper Utility

**Issue:** Error handling code duplicated 30+ times

**Impact:** High - Causes inconsistencies and code bloat

**Effort:** 2-3 hours

**Action Plan:**

1. Create response helper utility:
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
   * Send 400 Bad Request error
   */
  static sendBadRequest(
    reply: FastifyReply,
    message: string,
    details?: any
  ): void {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message,
        details
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
   * Send 401 Unauthorized error
   */
  static sendUnauthorized(
    reply: FastifyReply,
    message: string = 'Authentication required'
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
   * Check if service is available, send error if not
   * @returns true if available, false if error sent
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
   * Check if resource exists, send error if not
   * @returns resource if exists, null if error sent
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
   * Check if user has permission, send error if not
   * @returns true if has permission, false if error sent
   */
  static checkPermission(
    reply: FastifyReply,
    hasPermission: boolean,
    message?: string
  ): boolean {
    if (!hasPermission) {
      this.sendForbidden(reply, message);
      return false;
    }
    return true;
  }

  /**
   * Validate required fields, send error if missing
   * @returns true if valid, false if error sent
   */
  static validateRequired(
    reply: FastifyReply,
    data: Record<string, any>,
    requiredFields: string[]
  ): boolean {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      this.sendBadRequest(
        reply,
        `Missing required fields: ${missing.join(', ')}`
      );
      return false;
    }
    
    return true;
  }
}
```

2. Update routes to use helper:

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
```

**After:**
```typescript
if (!APIResponseHelper.checkServiceAvailable(reply, messageService, 'Message service')) {
  return;
}
```

3. Update all route files to use helper

4. Run tests to verify:
```bash
npm test -- routes.test.ts --run
```

**Success Criteria:**
- ✅ APIResponseHelper utility created
- ✅ All routes updated to use helper
- ✅ Code duplication reduced by ~40%
- ✅ All tests passing

**Files to Create:**
- `server/src/api/utils/response-helpers.ts`
- `server/src/api/utils/response-helpers.test.ts`

**Files to Modify:**
- All route files (auth.routes.ts, user.routes.ts, etc.)

---

## Priority 1: High (Should Complete Soon)

### P1.1: Extract Test Helpers

**Issue:** Login code duplicated in every test file

**Impact:** Medium - Test maintenance burden

**Effort:** 2 hours

**Action Plan:**

1. Add helpers to mcp-helpers.ts:
```typescript
// server/src/testing/mcp-helpers.ts

/**
 * Login user and return JWT token
 */
export async function loginUser(persona: TestPersona): Promise<string> {
  const response = await fetch(`${TEST_URLS.API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: persona.handle,
      password: persona.password,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.token;
}

/**
 * Fetch with authentication
 */
export async function fetchWithAuth(
  url: string,
  token: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Expect successful response
 */
export async function expectSuccess(
  response: Response,
  step: string
): Promise<any> {
  if (!response.ok) {
    throw new Error(`${step} failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Expect error response
 */
export async function expectError(
  response: Response,
  expectedStatus: number,
  step: string
): Promise<void> {
  if (response.ok) {
    throw new Error(`${step} should have failed but succeeded`);
  }
  if (response.status !== expectedStatus) {
    throw new Error(
      `${step} returned ${response.status}, expected ${expectedStatus}`
    );
  }
}
```

2. Update test files to use helpers:

**Before:**
```typescript
const loginResponse = await fetch(`${apiUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    handle: TEST_PERSONAS.RETURNING_USER.handle,
    password: TEST_PERSONAS.RETURNING_USER.password,
  }),
});

const loginData = await loginResponse.json() as any;

if (!loginResponse.ok || !loginData.token) {
  results.push({
    step: 'Login',
    success: false,
    details: 'Failed to login',
  });
  return results;
}
```

**After:**
```typescript
try {
  const token = await loginUser(TEST_PERSONAS.RETURNING_USER);
  // Use token...
} catch (error) {
  results.push({
    step: 'Login',
    success: false,
    details: error.message,
  });
  return results;
}
```

3. Update all test files

**Success Criteria:**
- ✅ Test helpers extracted
- ✅ All test files updated
- ✅ Code duplication reduced
- ✅ All tests passing

**Files to Modify:**
- `server/src/testing/mcp-helpers.ts`
- `server/src/testing/test-menu-navigation.ts`
- `server/src/testing/test-login-flow.ts`
- `server/src/testing/test-registration-flow.ts`

---

### P1.2: Standardize Validation with JSON Schema

**Issue:** Validation done differently across routes

**Impact:** Medium - Inconsistent error messages

**Effort:** 3-4 hours

**Action Plan:**

1. Create schema files:
```typescript
// server/src/api/schemas/auth.schemas.ts
export const registerSchema = {
  body: {
    type: 'object',
    required: ['handle', 'password'],
    properties: {
      handle: { type: 'string', minLength: 3, maxLength: 20 },
      password: { type: 'string', minLength: 6 },
      realName: { type: 'string', maxLength: 100 },
      location: { type: 'string', maxLength: 100 },
      bio: { type: 'string', maxLength: 500 },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['handle', 'password'],
    properties: {
      handle: { type: 'string' },
      password: { type: 'string' },
    },
  },
};
```

2. Update routes to use schemas:
```typescript
// Before
server.post('/api/v1/auth/register', async (request, reply) => {
  const { handle, password } = request.body as any;
  
  if (!handle || !password) {
    reply.code(400).send({ error: 'Handle and password required' });
    return;
  }
  
  if (handle.length < 3 || handle.length > 20) {
    reply.code(400).send({ error: 'Handle must be 3-20 characters' });
    return;
  }
  // ...
});

// After
server.post('/api/v1/auth/register', {
  schema: registerSchema
}, async (request, reply) => {
  // Validation already done by Fastify
  const { handle, password } = request.body as RegisterBody;
  // ...
});
```

3. Create schemas for all routes

**Success Criteria:**
- ✅ Schema files created
- ✅ All routes use schemas
- ✅ Manual validation removed
- ✅ All tests passing

**Files to Create:**
- `server/src/api/schemas/auth.schemas.ts`
- `server/src/api/schemas/message.schemas.ts`
- `server/src/api/schemas/door.schemas.ts`
- `server/src/api/schemas/user.schemas.ts`

---

### P1.3: Optimize Door Timeout Checking

**Issue:** DoorHandler uses polling for timeout checking

**Impact:** Low - Minor performance impact

**Effort:** 2-3 hours

**Action Plan:**

1. Remove polling interval:
```typescript
// Remove from DoorHandler constructor
// this.startTimeoutChecking();
```

2. Add lazy timeout check:
```typescript
// DoorHandler.ts
private isSessionTimedOut(session: Session): boolean {
  if (session.state !== SessionState.IN_DOOR) {
    return false;
  }
  
  const inactiveTime = Date.now() - session.lastActivity.getTime();
  return inactiveTime > this.doorTimeoutMs;
}

private async checkTimeoutOnAccess(session: Session): Promise<boolean> {
  if (this.isSessionTimedOut(session)) {
    const doorId = session.data.door?.doorId;
    const door = doorId ? this.doors.get(doorId) : undefined;
    await this.exitDoorDueToTimeout(session, door);
    return true;
  }
  return false;
}
```

3. Check timeout on every access:
```typescript
async handle(command: string, session: Session): Promise<string> {
  // Check timeout before processing
  if (await this.checkTimeoutOnAccess(session)) {
    return 'Your door session has timed out due to inactivity.\r\n';
  }
  
  // ... rest of handling
}
```

4. Update tests

**Success Criteria:**
- ✅ Polling removed
- ✅ Lazy evaluation implemented
- ✅ Timeout behavior unchanged
- ✅ All tests passing

**Files to Modify:**
- `server/src/handlers/DoorHandler.ts`

---

## Priority 2: Medium (Nice to Have)

### P2.1: Fix ANSI Frame Alignment (Task 51)

**Issue:** ANSI frames not properly aligned

**Impact:** Medium - Visual display issues

**Effort:** 6-8 hours

**Action Plan:** See Task 51.1-51.5 in tasks.md

**Success Criteria:**
- ✅ ANSIFrameBuilder implemented
- ✅ ANSIFrameValidator implemented
- ✅ All screens updated
- ✅ Visual regression tests added

---

### P2.2: Add API Response Types

**Issue:** API responses use `any` type

**Impact:** Low - No type safety

**Effort:** 4-6 hours

**Action Plan:**

1. Define response types:
```typescript
// server/src/api/types.ts
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

export interface MessageBaseResponse {
  id: string;
  name: string;
  description?: string;
  accessLevelRead: number;
  accessLevelWrite: number;
  postCount: number;
  lastPostAt?: string;
  sortOrder: number;
}

// ... more types
```

2. Update test files to use types:
```typescript
const loginData = await loginResponse.json() as LoginResponse;
const basesData = await basesResponse.json() as MessageBaseResponse[];
```

**Success Criteria:**
- ✅ Response types defined
- ✅ Test files updated
- ✅ Type safety improved

---

## Timeline

### Week 1 (Current)

**Day 1-2: P0 Refactoring**
- [ ] P0.1: Split routes.ts (4-6 hours)
- [ ] P0.2: Create APIResponseHelper (2-3 hours)
- [ ] Run full test suite
- [ ] Update documentation

**Day 3: P1 Improvements**
- [ ] P1.1: Extract test helpers (2 hours)
- [ ] P1.2: Standardize validation (3-4 hours)
- [ ] Run full test suite

**Day 4: P1 Completion + Task 51**
- [ ] P1.3: Optimize door timeout (2-3 hours)
- [ ] P2.1: Start Task 51 (ANSI frames)

**Day 5: Task 51 Completion**
- [ ] P2.1: Complete Task 51
- [ ] Run full test suite
- [ ] Update documentation

### Week 2

**Day 6-10: Resume Milestone 7**
- [ ] Task 42: Message base testing
- [ ] Task 43: AI SysOp testing
- [ ] Task 44: Door game testing
- [ ] Task 45: Control panel testing
- [ ] Continue with remaining tasks

---

## Success Metrics

### Code Quality Metrics

**Before Refactoring:**
- routes.ts: 2038 lines
- Error handling duplication: 30+ instances
- Test code duplication: 3+ files
- Architecture score: 8.4/10

**After Refactoring:**
- routes.ts: < 150 lines
- Error handling duplication: 0 instances
- Test code duplication: 0 instances
- Architecture score: 9.0+/10

### Test Metrics

**Must Maintain:**
- ✅ All 385 tests passing
- ✅ No functional regressions
- ✅ Test coverage maintained

---

## Risk Mitigation

### Risk 1: Breaking Changes

**Mitigation:**
- Run full test suite after each change
- Test manually if needed
- Keep changes small and focused

### Risk 2: Schedule Delay

**Mitigation:**
- Focus on P0 items only initially
- P1 items can be done in parallel with testing
- P2 items can be deferred

### Risk 3: Scope Creep

**Mitigation:**
- Stick to defined action items
- No new features during refactoring
- Document any new issues for later

---

## Conclusion

This refactoring is critical for long-term maintainability. The 2-3 day investment now will save weeks of pain later. All P0 items must be completed before resuming Milestone 7 testing.

**Next Steps:**
1. Review and approve this plan
2. Begin P0.1 (Split routes.ts)
3. Complete P0.2 (APIResponseHelper)
4. Resume Milestone 7 testing

---

**Document Created:** December 3, 2025  
**Status:** Ready for implementation  
**Estimated Completion:** December 5-6, 2025
