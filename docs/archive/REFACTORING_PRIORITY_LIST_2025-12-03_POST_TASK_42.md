# Refactoring Priority List - Post Task 42

**Date:** December 3, 2025  
**Context:** Message base testing complete, ANSI issues discovered  
**Status:** Critical refactoring required before continuing testing

---

## Priority 0 - Critical (Must Complete Before Demo)

### 🔴 Tasks 51.1-51.5: Fix ANSI Frame Alignment
**Effort:** 6-8 hours  
**Impact:** BLOCKS demo readiness  
**Status:** Not started

**Problem:**
- ANSI frames misaligned across screens
- Text overflows frame boundaries
- Inconsistent widths (53, 55, 57 chars)
- No validation of alignment

**Solution:**
1. **Task 51.1:** Investigate root cause (1 hour)
2. **Task 51.2:** Implement ANSIFrameBuilder utility (2-3 hours)
3. **Task 51.3:** Implement ANSIFrameValidator for testing (1 hour)
4. **Task 51.4:** Update all screens to use ANSIFrameBuilder (2-3 hours)
5. **Task 51.5:** Add visual regression tests (1 hour)

**Files to Update:**
- Create: `server/src/ansi/ANSIFrameBuilder.ts`
- Create: `server/src/ansi/ANSIFrameValidator.ts`
- Update: All handlers (MessageHandler, DoorHandler, MenuHandler, AuthHandler)
- Update: All ANSI templates

---

### 🔴 Task 39.1: Split routes.ts into Modules
**Effort:** 4-6 hours  
**Impact:** Maintainability, code review difficulty  
**Status:** Not started

**Problem:**
- routes.ts is 2038 lines (unmaintainable)
- Violates single responsibility principle
- Difficult to navigate and review
- High merge conflict risk

**Solution:**
Create modular route structure:
```
server/src/api/routes/
├── auth.routes.ts       (~200 lines) - Authentication endpoints
├── user.routes.ts       (~300 lines) - User management
├── message.routes.ts    (~400 lines) - Message operations
├── door.routes.ts       (~500 lines) - Door game operations
├── system.routes.ts     (~200 lines) - System announcements
└── config.routes.ts     (~300 lines) - AI config assistant
```

**Steps:**
1. Create route files (1 hour)
2. Move endpoints to appropriate files (2-3 hours)
3. Update main routes.ts to import and register (30 min)
4. Verify all tests pass (1 hour)

---

### 🔴 Task 39.2: Create APIResponseHelper
**Effort:** 2-3 hours  
**Impact:** Code duplication (-40%), consistency  
**Status:** Not started

**Problem:**
- Error handling duplicated 30+ times
- Inconsistent error responses
- Hard to update error format

**Solution:**
Create `server/src/api/utils/response-helpers.ts`:
```typescript
export class APIResponseHelper {
  static sendServiceUnavailable(reply, serviceName)
  static sendValidationError(reply, message)
  static sendNotFound(reply, resourceType)
  static sendForbidden(reply, message)
  static sendUnauthorized(reply, message)
  static sendRateLimitExceeded(reply, message)
  static sendInternalError(reply, message)
}
```

**Steps:**
1. Create response helper utility (1 hour)
2. Update all routes to use helpers (1-2 hours)
3. Verify all tests pass (30 min)

---

## Priority 1 - High (Complete This Week)

### 🟡 Task 39.3: Add JSON Schema Validation
**Effort:** 3-4 hours  
**Impact:** Code quality, API documentation  
**Status:** Not started

**Problem:**
- Manual validation in every endpoint
- Inconsistent validation patterns
- No automatic API documentation

**Solution:**
Create schema files and use Fastify validation:
```
server/src/api/schemas/
├── auth.schema.ts
├── message.schema.ts
├── door.schema.ts
└── user.schema.ts
```

**Benefits:**
- Automatic validation before handler
- Self-documenting API
- OpenAPI schema generation
- Reduced boilerplate

---

### 🟡 Task 39.4: Optimize Door Timeout Checking
**Effort:** 2-3 hours  
**Impact:** Performance, resource usage  
**Status:** Not started

**Problem:**
- Polling every 5 minutes (inefficient)
- Checks all sessions unnecessarily
- Higher CPU usage

**Solution:**
Replace polling with lazy evaluation:
- Check timeout only on user interaction
- Remove setInterval polling
- Immediate timeout detection

---

### 🟡 Task 39.5: Configure CORS for Production
**Effort:** 30 minutes  
**Impact:** Security  
**Status:** Not started

**Problem:**
- Currently allows all origins (development only)
- Security vulnerability for production

**Solution:**
```typescript
await server.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

---

## Priority 2 - Medium (Next Sprint)

### 🟢 Create Test Helper Utilities
**Effort:** 2-3 hours  
**Impact:** Test maintainability

**Problem:**
- Login code duplicated in every test
- Test setup duplicated
- Hard to update test patterns

**Solution:**
Create helpers in `server/src/testing/mcp-helpers.ts`:
- `loginAsUser(persona): Promise<string>`
- `createTestMessage(baseId, token): Promise<Message>`
- `getMessageBases(token): Promise<MessageBase[]>`

---

### 🟢 Refactor Message Handler State
**Effort:** 3-4 hours  
**Impact:** Code clarity

**Problem:**
- Complex state machine with boolean flags
- Hard to understand state transitions
- Difficult to debug

**Solution:**
Use explicit state pattern with enum:
```typescript
enum MessageState {
  BASE_LIST, IN_BASE, READING_MESSAGE,
  POSTING_SUBJECT, POSTING_BODY
}
```

---

### 🟢 Add Structured Logging
**Effort:** 2-3 hours  
**Impact:** Debugging, monitoring

**Problem:**
- Inconsistent log format
- Hard to parse logs
- Missing context

**Solution:**
Use structured logging with context:
```typescript
logger.info({ userId, action, duration }, 'User action completed');
```

---

## Summary

### Critical Path (Before Demo)
1. ✅ Task 42: Message base testing (COMPLETE)
2. 🔴 Tasks 51.1-51.5: Fix ANSI frames (6-8 hours) **← START HERE**
3. 🔴 Task 39.1: Split routes.ts (4-6 hours)
4. 🔴 Task 39.2: APIResponseHelper (2-3 hours)

**Total Critical Work:** ~14-19 hours

### This Week
5. 🟡 Task 39.3: JSON Schema (3-4 hours)
6. 🟡 Task 39.4: Door timeout (2-3 hours)
7. 🟡 Task 39.5: CORS config (30 min)

**Total This Week:** ~6-8 hours

### Expected Outcomes
- Architecture score: 8.2 → 9.0+
- Code duplication: -40%
- routes.ts: 2038 → ~200 lines per file
- ANSI frames: 100% aligned
- Demo ready: Yes

---

**Created:** December 3, 2025  
**Next Review:** After completing P0 tasks
