# Refactoring Recommendations: Post-Task 40

**Date:** December 3, 2025  
**Context:** Milestone 7 - 20% Complete (Tasks 38-40 done)  
**Trigger:** Architecture review after login flow testing completion

---

## Executive Summary

This document provides **specific, actionable recommendations** for improving code quality while maintaining existing functionality. All recommendations are prioritized and include estimated effort.

**Total Technical Debt:** 15-20 hours  
**Critical Path Items:** 12-17 hours (must complete before Task 45)

---

## Priority 0: Critical Issues (Complete Before Task 45)

### 1. Fix ANSI Frame Alignment Issues ⚠️ URGENT

**Problem:** Inconsistent frame rendering discovered during testing  
**Impact:** User experience, visual consistency  
**Effort:** 6-8 hours  
**Status:** Task 51 created with 5 subtasks

**Action Items:**
- [ ] Task 51.1: Investigate frame alignment root cause (1 hour)
- [ ] Task 51.2: Implement ANSIFrameBuilder utility (2 hours)
- [ ] Task 51.3: Implement ANSIFrameValidator for testing (1 hour)
- [ ] Task 51.4: Update all screens to use ANSIFrameBuilder (2-3 hours)
- [ ] Task 51.5: Add visual regression tests (1-2 hours)

**Implementation Example:**

```typescript
// server/src/terminal/ANSIFrameBuilder.ts
export class ANSIFrameBuilder {
  private width: number;
  private lines: string[] = [];
  private padding: number = 2;

  constructor(width: number = 55) {
    this.width = width;
  }

  addTitle(title: string, centered: boolean = true): this {
    if (centered) {
      const padding = Math.floor((this.width - title.length - 2) / 2);
      const line = ' '.repeat(padding) + title + ' '.repeat(this.width - padding - title.length - 2);
      this.lines.push('║' + line + '║');
    } else {
      this.lines.push('║  ' + title.padEnd(this.width - 4) + '  ║');
    }
    return this;
  }

  addLine(text: string, indent: number = 2): this {
    const maxWidth = this.width - 4 - indent;
    const wrapped = this.wordWrap(text, maxWidth);
    
    wrapped.forEach(line => {
      const indentStr = ' '.repeat(indent);
      const paddedLine = (indentStr + line).padEnd(this.width - 2);
      this.lines.push('║' + paddedLine + '║');
    });
    
    return this;
  }

  addSeparator(): this {
    this.lines.push('╠' + '═'.repeat(this.width - 2) + '╣');
    return this;
  }

  addBlankLine(): this {
    this.lines.push('║' + ' '.repeat(this.width - 2) + '║');
    return this;
  }

  build(): string {
    const top = '╔' + '═'.repeat(this.width - 2) + '╗';
    const bottom = '╚' + '═'.repeat(this.width - 2) + '╝';
    return '\r\n' + [top, ...this.lines, bottom].join('\r\n') + '\r\n';
  }

  private wordWrap(text: string, width: number): string[] {
    if (text.length <= width) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}

// Usage example:
const frame = new ANSIFrameBuilder(55)
  .addTitle('WELCOME TO BAUDAGAIN BBS')
  .addSeparator()
  .addLine('Please enter your credentials to continue.')
  .addBlankLine()
  .addLine('Handle: ', 0)
  .build();
```

**Testing:**

```typescript
// server/src/terminal/ANSIFrameValidator.ts
export class ANSIFrameValidator {
  static validate(frame: string, expectedWidth: number = 55): ValidationResult {
    const lines = frame.split('\r\n').filter(l => l.length > 0);
    const errors: string[] = [];
    
    // Check all lines have same width
    lines.forEach((line, index) => {
      if (line.length !== expectedWidth) {
        errors.push(`Line ${index}: Expected width ${expectedWidth}, got ${line.length}`);
      }
    });
    
    // Check frame characters
    if (!lines[0].startsWith('╔') || !lines[0].endsWith('╗')) {
      errors.push('Invalid top border');
    }
    
    if (!lines[lines.length - 1].startsWith('╚') || !lines[lines.length - 1].endsWith('╝')) {
      errors.push('Invalid bottom border');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      width: expectedWidth,
      actualWidths: lines.map(l => l.length)
    };
  }
}
```

---

### 2. Split Monolithic routes.ts File

**Problem:** Single file with 2038 lines handling 19 endpoints  
**Impact:** Maintainability, code review difficulty, testing complexity  
**Effort:** 4-6 hours

**Action Items:**
1. Create route module structure (30 minutes)
2. Move authentication routes (1 hour)
3. Move user routes (1 hour)
4. Move message routes (1.5 hours)
5. Move door routes (1.5 hours)
6. Move system/config routes (1 hour)
7. Update main routes.ts (30 minutes)
8. Verify all tests pass (30 minutes)

**Implementation:**

```typescript
// server/src/api/routes/auth.routes.ts
import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../../db/repositories/UserRepository.js';
import type { JWTUtil } from '../../auth/jwt.js';
import { createUserAuthMiddleware } from '../middleware/auth.middleware.js';
import bcrypt from 'bcrypt';

export async function registerAuthRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  jwtUtil: JWTUtil
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);

  // POST /api/v1/auth/register
  server.post('/api/v1/auth/register', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' }
    }
  }, async (request, reply) => {
    // Implementation moved from routes.ts
  });

  // POST /api/v1/auth/login
  server.post('/api/v1/auth/login', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' }
    }
  }, async (request, reply) => {
    // Implementation moved from routes.ts
  });

  // POST /api/v1/auth/refresh
  server.post('/api/v1/auth/refresh', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' }
    }
  }, async (request, reply) => {
    // Implementation moved from routes.ts
  });

  // GET /api/v1/auth/me
  server.get('/api/v1/auth/me', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    // Implementation moved from routes.ts
  });
}
```

```typescript
// server/src/api/routes/index.ts
export { registerAuthRoutes } from './auth.routes.js';
export { registerUserRoutes } from './user.routes.js';
export { registerMessageRoutes } from './message.routes.js';
export { registerDoorRoutes } from './door.routes.js';
export { registerSystemRoutes } from './system.routes.js';
export { registerConfigRoutes } from './config.routes.js';
```

```typescript
// server/src/api/routes.ts (simplified)
import {
  registerAuthRoutes,
  registerUserRoutes,
  registerMessageRoutes,
  registerDoorRoutes,
  registerSystemRoutes,
  registerConfigRoutes
} from './routes/index.js';

export async function registerAPIRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  sessionManager: SessionManager,
  jwtUtil: JWTUtil,
  config: BBSConfig,
  messageBaseRepository?: MessageBaseRepository,
  messageService?: MessageService,
  doorService?: DoorService,
  notificationService?: NotificationService,
  aiConfigAssistant?: AIConfigAssistant
) {
  server.log.info('🔧 Registering REST API routes...');
  
  // Register route modules
  await registerAuthRoutes(server, userRepository, jwtUtil);
  await registerUserRoutes(server, userRepository, jwtUtil);
  await registerMessageRoutes(server, messageBaseRepository, messageService, jwtUtil);
  await registerDoorRoutes(server, doorService, sessionManager, jwtUtil);
  await registerSystemRoutes(server, notificationService, jwtUtil);
  await registerConfigRoutes(server, aiConfigAssistant, jwtUtil);
  
  // Legacy control panel endpoints
  await registerLegacyRoutes(server, userRepository, jwtUtil);
  
  server.log.info('✅ REST API routes registered successfully');
}
```

**Benefits:**
- Each route module ~200-500 lines (manageable)
- Easier code review (review only affected module)
- Better testability (test route groups independently)
- Clearer ownership and responsibility

---

### 3. Create APIResponseHelper Utility

**Problem:** Error handling duplicated 30+ times  
**Impact:** Maintainability, consistency  
**Effort:** 2-3 hours

**Action Items:**
1. Create response helper utility (1 hour)
2. Update routes to use helpers (1-1.5 hours)
3. Verify error responses consistent (30 minutes)

**Implementation:**

```typescript
// server/src/api/utils/response-helpers.ts
import type { FastifyReply } from 'fastify';

export class APIResponseHelper {
  /**
   * Send 501 Not Implemented response
   */
  static sendServiceUnavailable(reply: FastifyReply, serviceName: string): void {
    reply.code(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${serviceName} not available`
      }
    });
  }

  /**
   * Send 404 Not Found response
   */
  static sendNotFound(reply: FastifyReply, resource: string): void {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`
      }
    });
  }

  /**
   * Send 400 Bad Request response
   */
  static sendValidationError(reply: FastifyReply, message: string): void {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message
      }
    });
  }

  /**
   * Send 403 Forbidden response
   */
  static sendForbidden(reply: FastifyReply, message: string = 'Insufficient permissions'): void {
    reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message
      }
    });
  }

  /**
   * Send 401 Unauthorized response
   */
  static sendUnauthorized(reply: FastifyReply, message: string = 'Authentication required'): void {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message
      }
    });
  }

  /**
   * Send 429 Rate Limit Exceeded response
   */
  static sendRateLimitExceeded(reply: FastifyReply, message?: string): void {
    reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Rate limit exceeded'
      }
    });
  }

  /**
   * Send 500 Internal Server Error response
   */
  static sendInternalError(reply: FastifyReply, message: string = 'Internal server error'): void {
    reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message
      }
    });
  }

  /**
   * Check if service is available, send error if not
   * @returns true if service available, false if error sent
   */
  static checkServiceAvailable<T>(
    reply: FastifyReply,
    service: T | undefined,
    serviceName: string
  ): service is T {
    if (!service) {
      this.sendServiceUnavailable(reply, serviceName);
      return false;
    }
    return true;
  }

  /**
   * Validate required fields, send error if missing
   * @returns true if all fields present, false if error sent
   */
  static validateRequired(
    reply: FastifyReply,
    data: Record<string, any>,
    requiredFields: string[]
  ): boolean {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      this.sendValidationError(
        reply,
        `Missing required fields: ${missing.join(', ')}`
      );
      return false;
    }
    
    return true;
  }

  /**
   * Check user permission, send error if insufficient
   * @returns true if permission granted, false if error sent
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
}
```

**Usage Example:**

```typescript
// Before:
if (!messageService) {
  reply.code(501).send({ 
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Message service not available'
    }
  });
  return;
}

// After:
if (!APIResponseHelper.checkServiceAvailable(reply, messageService, 'Message service')) {
  return;
}

// Before:
if (!subject || subject.trim().length === 0) {
  reply.code(400).send({ 
    error: {
      code: 'INVALID_INPUT',
      message: 'Subject is required'
    }
  });
  return;
}

// After:
if (!APIResponseHelper.validateRequired(reply, { subject }, ['subject'])) {
  return;
}

// Before:
if (currentUser.accessLevel < 255) {
  reply.code(403).send({ 
    error: {
      code: 'FORBIDDEN',
      message: 'Admin access required'
    }
  });
  return;
}

// After:
if (!APIResponseHelper.checkPermission(reply, currentUser.accessLevel >= 255, 'Admin access required')) {
  return;
}
```

**Benefits:**
- Reduces code duplication by ~40%
- Consistent error responses
- Easier to update error format globally
- Better testability

---

## Priority 1: High Priority Issues (Complete During Milestone 6.5)

### 4. Add JSON Schema Validation

**Problem:** Three different validation approaches used  
**Impact:** Code consistency, maintainability  
**Effort:** 3-4 hours

**Implementation:**

```typescript
// server/src/api/schemas/auth.schemas.ts
export const registerSchema = {
  body: {
    type: 'object',
    required: ['handle', 'password'],
    properties: {
      handle: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      password: {
        type: 'string',
        minLength: 6
      },
      realName: { type: 'string', maxLength: 100 },
      location: { type: 'string', maxLength: 100 },
      bio: { type: 'string', maxLength: 500 }
    }
  }
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['handle', 'password'],
    properties: {
      handle: { type: 'string' },
      password: { type: 'string' }
    }
  }
};
```

```typescript
// server/src/api/schemas/message.schemas.ts
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
```

```typescript
// Usage in routes:
import { registerSchema, loginSchema } from '../schemas/auth.schemas.js';

server.post('/api/v1/auth/register', {
  schema: registerSchema,
  config: {
    rateLimit: { max: 10, timeWindow: '1 minute' }
  }
}, async (request, reply) => {
  // No manual validation needed - Fastify validates automatically
  const { handle, password, realName, location, bio } = request.body;
  // ... rest of implementation
});
```

**Benefits:**
- Automatic validation by Fastify
- Consistent validation across all endpoints
- Better error messages
- OpenAPI schema generation

---

### 5. Optimize Door Timeout Checking

**Problem:** Polling every 5 minutes regardless of activity  
**Impact:** Performance, resource usage  
**Effort:** 2-3 hours

**Implementation:**

```typescript
// server/src/handlers/DoorHandler.ts
export class DoorHandler implements CommandHandler {
  private doorTimeoutMs: number = 30 * 60 * 1000;
  
  // Remove polling interval
  // private timeoutCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(private deps: DoorHandlerDependencies) {
    // Don't start polling
    // this.startTimeoutChecking();
  }
  
  /**
   * Check if session has timed out (lazy evaluation)
   */
  private checkSessionTimeout(session: Session): boolean {
    if (session.state !== SessionState.IN_DOOR) {
      return false;
    }
    
    const inactiveTime = Date.now() - session.lastActivity.getTime();
    
    if (inactiveTime > this.doorTimeoutMs) {
      const doorId = session.data.door?.doorId;
      const door = doorId ? this.doors.get(doorId) : undefined;
      
      console.log(`Door timeout for session ${session.id} in door ${doorId}`);
      
      // Exit door due to timeout
      this.exitDoorDueToTimeout(session, door).catch(error => {
        console.error(`Error exiting door on timeout:`, error);
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle the command (with timeout check)
   */
  async handle(command: string, session: Session): Promise<string> {
    // Check timeout on every interaction
    if (this.checkSessionTimeout(session)) {
      return '\r\n\x1b[33mYour door session has timed out due to inactivity.\x1b[0m\r\n\r\n' +
             'Returning to main menu...\r\n\r\n';
    }
    
    // ... rest of handler implementation
  }
}
```

**Benefits:**
- No background polling (saves CPU)
- Timeout checked only when needed
- More responsive (immediate timeout detection)
- Simpler code (no interval management)

---

### 6. Refactor Test Code Duplication

**Problem:** Similar test patterns duplicated across test files  
**Impact:** Test maintainability  
**Effort:** 2-3 hours

**Implementation:**

```typescript
// server/src/testing/mcp-helpers.ts

export interface TestResult {
  success: boolean;
  status: number;
  data: any;
  error?: any;
}

export interface TestStep {
  step: string;
  success: boolean;
  details: string;
  validation?: any;
  screenshot?: string;
}

/**
 * Test an API endpoint
 */
export async function testAPIEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<TestResult> {
  const url = `${TEST_URLS.API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();
  
  return {
    success: response.ok,
    status: response.status,
    data,
    error: response.ok ? undefined : data.error
  };
}

/**
 * Create a test step result
 */
export function createTestStep(
  step: string,
  success: boolean,
  details: string,
  validation?: any
): TestStep {
  return { step, success, details, validation };
}

/**
 * Test user login
 */
export async function testLogin(
  handle: string,
  password: string
): Promise<{ result: TestStep; token?: string }> {
  const apiResult = await testAPIEndpoint('/auth/login', 'POST', {
    handle,
    password
  });
  
  const result = createTestStep(
    'User Login',
    apiResult.success,
    apiResult.success 
      ? `Successfully logged in as: ${handle}`
      : `Login failed: ${JSON.stringify(apiResult.error)}`,
    apiResult.success ? {
      hasToken: !!apiResult.data.token,
      hasUser: !!apiResult.data.user,
      handleMatches: apiResult.data.user?.handle === handle
    } : undefined
  );
  
  return {
    result,
    token: apiResult.success ? apiResult.data.token : undefined
  };
}

/**
 * Test user registration
 */
export async function testRegistration(
  handle: string,
  password: string,
  additionalData?: any
): Promise<{ result: TestStep; token?: string }> {
  const apiResult = await testAPIEndpoint('/auth/register', 'POST', {
    handle,
    password,
    ...additionalData
  });
  
  const result = createTestStep(
    'User Registration',
    apiResult.success,
    apiResult.success 
      ? `Successfully registered: ${handle}`
      : `Registration failed: ${JSON.stringify(apiResult.error)}`,
    apiResult.success ? {
      hasToken: !!apiResult.data.token,
      hasUser: !!apiResult.data.user,
      handleMatches: apiResult.data.user?.handle === handle
    } : undefined
  );
  
  return {
    result,
    token: apiResult.success ? apiResult.data.token : undefined
  };
}

/**
 * Print test results
 */
export function printTestResults(results: TestStep[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  
  let passCount = 0;
  let failCount = 0;
  
  results.forEach((result) => {
    const status = result.success ? '✓ PASS' : '✗ FAIL';
    const color = result.success ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`\n${color}${status}${reset} ${result.step}`);
    console.log(`  ${result.details}`);
    
    if (result.validation) {
      console.log('  Validation:', JSON.stringify(result.validation, null, 2));
    }
    
    if (result.success) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(60));
}
```

**Usage:**

```typescript
// test-login-flow.ts (simplified)
import { testLogin, testAPIEndpoint, createTestStep, printTestResults } from './mcp-helpers';

async function runTests() {
  const results: TestStep[] = [];
  
  // Test valid login
  const { result: loginResult, token } = await testLogin(
    TEST_PERSONAS.RETURNING_USER.handle,
    TEST_PERSONAS.RETURNING_USER.password
  );
  results.push(loginResult);
  
  // Test token validation
  if (token) {
    const meResult = await testAPIEndpoint('/auth/me', 'GET', undefined, token);
    results.push(createTestStep(
      'Token Validation',
      meResult.success,
      meResult.success 
        ? `Token validated for: ${meResult.data.handle}`
        : `Token validation failed: ${meResult.error}`
    ));
  }
  
  // Test invalid login
  const { result: invalidResult } = await testLogin(
    TEST_PERSONAS.RETURNING_USER.handle,
    'WrongPassword123!'
  );
  results.push(createTestStep(
    'Invalid Password Test',
    !invalidResult.success, // Should fail
    invalidResult.success 
      ? 'ERROR: Invalid password accepted'
      : 'Correctly rejected invalid password'
  ));
  
  printTestResults(results);
  return results.every(r => r.success) ? 0 : 1;
}
```

**Benefits:**
- Reduces test code by ~50%
- Consistent test patterns
- Easier to add new tests
- Better test output formatting

---

## Priority 2: Medium Priority Issues (Address Later)

### 7. Configure CORS Properly

**Effort:** 30 minutes

```typescript
// server/src/index.ts
await server.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN || 'https://yourdomain.com'
    : true, // Allow all in development
  credentials: true
});
```

### 8. Add Request/Response Type Definitions

**Effort:** 2-3 hours

```typescript
// server/src/api/types/requests.ts
export interface LoginRequest {
  handle: string;
  password: string;
}

export interface RegisterRequest {
  handle: string;
  password: string;
  realName?: string;
  location?: string;
  bio?: string;
}

export interface PostMessageRequest {
  subject: string;
  body: string;
}

// server/src/api/types/responses.ts
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

export interface MessageResponse {
  id: string;
  baseId: string;
  subject: string;
  body: string;
  authorHandle: string;
  createdAt: string;
}
```

---

## Implementation Timeline

### Week 1: Critical Fixes (12-17 hours)

**Monday-Tuesday:**
- Task 51.1-51.3: ANSI frame investigation and utilities (4 hours)

**Wednesday-Thursday:**
- Task 51.4-51.5: Update screens and add tests (3-4 hours)
- Start routes.ts splitting (2 hours)

**Friday:**
- Complete routes.ts splitting (2-4 hours)
- Create APIResponseHelper (2-3 hours)

### Week 2: High Priority Improvements (7-10 hours)

**Monday-Tuesday:**
- Add JSON Schema validation (3-4 hours)

**Wednesday:**
- Optimize door timeout checking (2-3 hours)

**Thursday-Friday:**
- Refactor test code duplication (2-3 hours)

### Week 3: Medium Priority Improvements (2.5-3.5 hours)

**Monday:**
- Configure CORS properly (30 minutes)
- Add request/response type definitions (2-3 hours)

---

## Success Metrics

### Code Quality Metrics

**Before Refactoring:**
- routes.ts: 2038 lines
- Error handling duplication: 30+ instances
- Test code duplication: ~50%
- Architecture score: 8.2/10

**After Refactoring:**
- routes.ts: ~100 lines (main registration)
- Route modules: 6 files, 200-500 lines each
- Error handling duplication: <5 instances
- Test code duplication: <20%
- Architecture score: 9.2/10 (target)

### Maintainability Improvements

- **Code Review Time:** -60% (smaller, focused changes)
- **Bug Fix Time:** -40% (easier to locate issues)
- **New Feature Time:** -30% (less code to understand)
- **Test Writing Time:** -50% (reusable test utilities)

---

## Risk Mitigation

### Risk 1: Breaking Changes During Refactoring

**Mitigation:**
- Run full test suite after each change
- Use git branches for each refactoring task
- Test API endpoints with Postman collection
- Verify terminal client still works

### Risk 2: Time Overruns

**Mitigation:**
- Prioritize P0 items only before Task 45
- Defer P1 and P2 items to Milestone 6.5
- Use time-boxing (stop after estimated time)
- Document any incomplete work

### Risk 3: Introducing New Bugs

**Mitigation:**
- Maintain 100% test coverage
- Use TypeScript strict mode
- Code review all changes
- Test with real user scenarios

---

## Conclusion

These refactoring recommendations address **critical technical debt** accumulated during rapid development. Completing the **P0 items (12-17 hours)** before Task 45 will:

1. ✅ Fix user-facing ANSI frame issues
2. ✅ Improve long-term maintainability
3. ✅ Reduce bug risk
4. ✅ Speed up future development

The **P1 items (7-10 hours)** can be completed during Milestone 6.5, and **P2 items (2.5-3.5 hours)** can be deferred to post-Milestone 7.

**Recommended Action:** Begin Task 51 (ANSI frame alignment) immediately, as it's blocking further testing progress.

---

**Document Status:** ✅ Complete  
**Next Review:** After Task 51 completion  
**Approved By:** AI Architecture Agent  
**Date:** December 3, 2025
