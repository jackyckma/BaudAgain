# Refactoring Priority List - Post Milestone 6
**Date:** 2025-12-01  
**Status:** Action Required  
**Estimated Total Effort:** 20-30 hours

---

## Executive Summary

Milestone 6 successfully implemented the hybrid REST + WebSocket architecture, but **architectural shortcuts** were taken that must be addressed. This document provides a prioritized list of refactoring tasks to restore architectural integrity.

**Critical Finding:** REST API violates encapsulation by accessing private handler methods with type casts.

---

## Priority 0: Critical (Must Fix - 9-13 hours)

### Task 1: Create DoorService
**Effort:** 4-6 hours  
**Impact:** Eliminates architectural violation  
**Files:** Create `server/src/services/DoorService.ts`, update `routes.ts`, `index.ts`

**Problem:** REST API accesses private DoorHandler methods with `(doorHandler as any)`

**Solution:**
```typescript
export class DoorService {
  getDoors(): Door[]
  getDoor(doorId: string): Door | null
  async enterDoor(userId: string, handle: string, doorId: string): Promise<DoorEnterResult>
  async sendInput(userId: string, doorId: string, input: string): Promise<DoorInputResult>
  async exitDoor(userId: string, doorId: string): Promise<DoorExitResult>
}
```

---

### Task 2: Consolidate Authentication Middleware
**Effort:** 1 hour  
**Impact:** Eliminates code duplication  
**Files:** `server/src/api/routes.ts`

**Problem:** Two nearly identical auth middlewares (`authenticateUser` and `authenticate`)

**Solution:**
```typescript
const createAuthMiddleware = (options: { requireSysOp?: boolean } = {}) => {
  return async (request: any, reply: any) => {
    // Single implementation with options
  };
};

const authenticateUser = createAuthMiddleware();
const authenticateSysOp = createAuthMiddleware({ requireSysOp: true });
```

---

### Task 3: Add Proper TypeScript Types
**Effort:** 4-6 hours  
**Impact:** Restores type safety  
**Files:** Create `server/src/api/types.ts`, update `routes.ts`

**Problem:** 15+ instances of `(request as any)` and `(handler as any)`

**Solution:**
```typescript
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

export interface DoorEnterResult {
  sessionId: string;
  output: string;
  doorId: string;
  doorName: string;
  resumed: boolean;
}
```

---

## Priority 1: High (Should Fix - 9-12 hours)

### Task 4: Create APIErrorHandler Utility
**Effort:** 2 hours  
**Impact:** Consistent error responses  
**Files:** Create `server/src/api/utils/error-handler.ts`, update `routes.ts`

**Problem:** Three different error response formats

**Solution:**
```typescript
export class APIErrorHandler {
  static notFound(reply: FastifyReply, message: string)
  static unauthorized(reply: FastifyReply, message: string)
  static forbidden(reply: FastifyReply, message: string)
  static badRequest(reply: FastifyReply, message: string)
  static rateLimit(reply: FastifyReply, message: string)
}
```

---

### Task 5: Create RequestValidator Middleware
**Effort:** 3-4 hours  
**Impact:** Eliminates validation duplication  
**Files:** Create `server/src/api/middleware/validation.middleware.ts`, update `routes.ts`

**Problem:** Validation logic repeated 15+ times

**Solution:**
```typescript
export class RequestValidator {
  static requireFields(fields: string[])
  static validateLength(field: string, min: number, max: number)
  static validateEmail(field: string)
  static validateAccessLevel(field: string)
}
```

---

### Task 6: Split routes.ts into Multiple Files
**Effort:** 4-6 hours  
**Impact:** Improves maintainability  
**Files:** Create `server/src/api/routes/*.ts`, update `index.ts`

**Problem:** routes.ts is 2167 lines (too large)

**Solution:**
```
server/src/api/
├── routes/
│   ├── auth.routes.ts (authentication endpoints)
│   ├── users.routes.ts (user management)
│   ├── messages.routes.ts (message bases & messages)
│   ├── doors.routes.ts (door games)
│   └── system.routes.ts (system announcements)
├── middleware/
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
├── utils/
│   └── error-handler.ts
└── index.ts (register all routes)
```

---

## Priority 2: Medium (Should Fix Soon - 9-12 hours)

### Task 7: Add REST API Integration Tests
**Effort:** 4-6 hours  
**Impact:** Ensures API correctness  
**Files:** Expand `server/src/api/routes.test.ts`

**Missing Coverage:**
- Door game REST endpoints
- System announcement endpoint
- Error handling paths

---

### Task 8: Standardize Repository Method Names
**Effort:** 1 hour  
**Impact:** Consistency  
**Files:** `MessageBaseRepository.ts`, `MessageRepository.ts`

**Problem:** Inconsistent naming (`getMessageBase` vs `findById`)

**Solution:** Standardize to `find*` pattern

---

### Task 9: Add Token Refresh Endpoint
**Effort:** 2 hours  
**Impact:** Better UX  
**Files:** `server/src/api/routes/auth.routes.ts`

**Missing:** Token refresh mechanism

---

### Task 10: Complete Documentation
**Effort:** 2-3 hours  
**Impact:** Developer experience  
**Files:** Create docs in `docs/` folder

**Missing:**
- REST API usage examples
- Mobile app development guide
- Troubleshooting guide

---

## Implementation Schedule

### Week 1: Critical Fixes
- **Day 1-2:** Task 1 (DoorService) - 4-6 hours
- **Day 3:** Task 2 (Auth Middleware) - 1 hour
- **Day 3-4:** Task 3 (TypeScript Types) - 4-6 hours

**Total:** 9-13 hours

---

### Week 2: High Priority
- **Day 1:** Task 4 (APIErrorHandler) - 2 hours
- **Day 2-3:** Task 5 (RequestValidator) - 3-4 hours
- **Day 4-5:** Task 6 (Split routes.ts) - 4-6 hours

**Total:** 9-12 hours

---

### Week 3: Medium Priority
- **Day 1-2:** Task 7 (REST API Tests) - 4-6 hours
- **Day 3:** Task 8 (Repository Names) - 1 hour
- **Day 4:** Task 9 (Token Refresh) - 2 hours
- **Day 5:** Task 10 (Documentation) - 2-3 hours

**Total:** 9-12 hours

---

## Success Criteria

### Code Quality Metrics

**Before Refactoring:**
- Type Safety: 92% (15+ `as any` casts)
- Code Duplication: Medium (6/10)
- Architecture Compliance: 8.5/10
- routes.ts: 2167 lines

**After Refactoring:**
- Type Safety: 98% (< 3 `as any` casts)
- Code Duplication: Low (9/10)
- Architecture Compliance: 9.5/10
- Largest file: < 500 lines

### Functional Requirements

- ✅ All existing functionality continues to work
- ✅ No regressions in user experience
- ✅ All tests pass
- ✅ Code compiles without errors
- ✅ No type casts to access private methods

---

## Risk Assessment

### Low Risk Tasks
- Task 2: Auth Middleware (isolated change)
- Task 4: APIErrorHandler (new utility)
- Task 8: Repository Names (simple rename)

### Medium Risk Tasks
- Task 3: TypeScript Types (affects many files)
- Task 5: RequestValidator (changes validation flow)
- Task 10: Documentation (no code changes)

### High Risk Tasks
- Task 1: DoorService (major refactoring)
- Task 6: Split routes.ts (large file reorganization)
- Task 7: REST API Tests (new test infrastructure)

**Mitigation:**
- Test thoroughly after each task
- Keep changes small and focused
- Commit after each successful task
- Have rollback plan ready
- Run full test suite after each change

---

## Conclusion

These refactoring tasks will restore architectural integrity while maintaining all functionality. The tasks are prioritized by impact and risk, with clear implementation steps and success criteria.

**Recommendation:** Complete Priority 0 tasks before any new feature development.

---

**Created:** 2025-12-01  
**Status:** Ready for Implementation  
**Estimated Completion:** 3 weeks (part-time)
