# Refactoring Priority List - Post Milestone 6 REST API
**Date:** 2025-12-01  
**Status:** Action Required

## 🔴 CRITICAL - Fix Immediately (8-9 hours)

### 1. Fix Type Safety (1 hour)
**Problem:** 50+ occurrences of `(request as any).user`  
**Impact:** No compile-time type checking  
**Files:** `server/src/api/routes.ts`, new `server/src/api/types.ts`

**Action:**
```typescript
// Create server/src/api/types.ts
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      handle: string;
      accessLevel: number;
    };
  }
}
```

Then replace all `(request as any).user` with `request.user`

---

### 2. Extract Error Utilities (2 hours)
**Problem:** 50+ duplicate error responses  
**Impact:** Maintenance nightmare, inconsistency  
**Files:** new `server/src/api/errors.ts`, `server/src/api/routes.ts`

**Action:**
```typescript
// Create server/src/api/errors.ts
export class APIError {
  static serviceUnavailable(reply: FastifyReply, serviceName: string): void
  static notFound(reply: FastifyReply, resourceName: string): void
  static forbidden(reply: FastifyReply, message: string): void
  static invalidInput(reply: FastifyReply, message: string): void
  static unauthorized(reply: FastifyReply): void
}
```

Replace 50+ error blocks with utility calls

---

### 3. Extract Validation Utilities (2 hours)
**Problem:** 15+ duplicate validation blocks  
**Impact:** Code bloat, inconsistency  
**Files:** new `server/src/api/validation.ts`, `server/src/api/routes.ts`

**Action:**
```typescript
// Create server/src/api/validation.ts
export class RequestValidator {
  static validateRequired(reply, value, fieldName): boolean
  static validateMessageInput(reply, subject, body): boolean
  static validateUserInput(reply, handle, password): boolean
}
```

Replace 15+ validation blocks with utility calls

---

### 4. Fix Door Handler Access (3-4 hours)
**Problem:** Direct access to private members via `(doorHandler as any)`  
**Impact:** Violates encapsulation, breaks OOP  
**Files:** `server/src/handlers/DoorHandler.ts`, `server/src/api/routes.ts`

**Action:**
```typescript
// Add to DoorHandler
export class DoorHandler {
  public getAllDoors(): DoorInfo[]
  public getDoorById(doorId: string): Door | null
}
```

Remove all `(doorHandler as any)` casts

---

## ⚠️ HIGH PRIORITY - Fix Next Sprint (6-8 hours)

### 5. Create DoorService (4-5 hours)
**Problem:** Door logic scattered, no service layer  
**Impact:** Violates architecture, hard to test  
**Files:** new `server/src/services/DoorService.ts`, `server/src/api/routes.ts`

**Action:**
```typescript
// Create server/src/services/DoorService.ts
export class DoorService {
  getAllDoors(): DoorInfo[]
  getDoor(doorId: string): Door | null
  async enterDoor(userId, doorId): Promise<DoorEnterResult>
  async processDoorInput(userId, doorId, sessionId, input): Promise<DoorInputResult>
  async exitDoor(userId, doorId, sessionId): Promise<DoorExitResult>
}
```

Update REST endpoints to use DoorService

---

### 6. Fix Session Management (2-3 hours)
**Problem:** REST creates pseudo-sessions with `rest-${userId}`  
**Impact:** Inconsistent, potential collisions  
**Files:** new `server/src/session/RESTSessionManager.ts`, `server/src/api/routes.ts`

**Action:**
```typescript
// Create server/src/session/RESTSessionManager.ts
export class RESTSessionManager {
  getOrCreateSession(userId: string): RESTSession
  touchSession(userId: string): void
  cleanupInactiveSessions(): void
}
```

Remove pseudo-session hack from routes

---

## 📊 Impact Summary

| Issue | Occurrences | Effort | Priority |
|-------|-------------|--------|----------|
| Type safety violations | 50+ | 1h | 🔴 P0 |
| Error duplication | 50+ | 2h | 🔴 P0 |
| Validation duplication | 15+ | 2h | 🔴 P0 |
| Private member access | 5 | 3-4h | 🔴 P0 |
| Missing DoorService | N/A | 4-5h | ⚠️ P1 |
| Session inconsistency | N/A | 2-3h | ⚠️ P1 |

**Total Effort:** 14-17 hours  
**Critical Path:** 8-9 hours (Phase 1)

---

## ✅ Success Criteria

After Phase 1 (Critical):
- [ ] No `as any` type assertions in routes.ts
- [ ] All errors use APIError utility
- [ ] All validation uses RequestValidator utility
- [ ] No direct access to private members
- [ ] Code compiles without warnings

After Phase 2 (High Priority):
- [ ] DoorService handles all door logic
- [ ] REST and WebSocket use same service
- [ ] Proper session management
- [ ] No architectural violations

---

## 🚀 Recommended Approach

1. **Stop adding features** - Fix quality issues first
2. **Fix Phase 1** - 8-9 hours, do immediately
3. **Test thoroughly** - Ensure no regressions
4. **Fix Phase 2** - 6-8 hours, do next sprint
5. **Continue Milestone 6** - Add remaining features

**Rationale:** Current code quality issues will compound if more features are added. Fix the foundation first.

---

**Created:** 2025-12-01  
**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 fixes
