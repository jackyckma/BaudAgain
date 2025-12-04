# Critical Fixes Required - Post Milestone 6 REST API

**Date:** 2025-12-01  
**Priority:** 🔴 CRITICAL - Must fix before proceeding  
**Estimated Time:** 8-10 hours

---

## Overview

The REST API implementation (Tasks 29-31) is functionally complete but has introduced **critical architectural violations** that must be fixed immediately. These issues will cause runtime errors, memory leaks, and maintenance nightmares if not addressed.

---

## Critical Issue #1: Breaking Encapsulation

### Problem
REST API directly accesses private members of DoorHandler using `as any` type casting.

### Evidence
```typescript
// ❌ WRONG - Direct access to private members
const doors = Array.from((doorHandler as any).doors.values());
const door = (doorHandler as any).doors.get(id);
const output = await (doorHandler as any).enterDoor(door, session);
```

### Fix
**File:** `server/src/handlers/DoorHandler.ts`

```typescript
export class DoorHandler implements CommandHandler {
  // ✅ ADD: Public methods for REST API
  public getAllDoors(): Door[] {
    return Array.from(this.doors.values());
  }
  
  public getDoor(doorId: string): Door | undefined {
    return this.doors.get(doorId);
  }
  
  public getDoorTimeout(): number {
    return this.doorTimeoutMs;
  }
  
  // Keep private methods private
  private async enterDoor(door: Door, session: Session): Promise<string> {
    // Existing implementation
  }
}
```

**File:** `server/src/api/routes.ts`

```typescript
// ✅ CORRECT - Use public API
const doors = doorHandler.getAllDoors();
const door = doorHandler.getDoor(id);
```

**Time:** 2-3 hours  
**Impact:** Fixes encapsulation, removes type casting

---

## Critical Issue #2: Pseudo-Session Hack

### Problem
REST API creates fake sessions using `rest-${userId}` as connection ID.

### Evidence
```typescript
// ❌ WRONG - Fake connection ID
const restConnectionId = `rest-${currentUser.id}`;
let session = sessionManager.getSessionByConnection(restConnectionId);

if (!session) {
  session = sessionManager.createSession(restConnectionId);
  session.userId = currentUser.id;
  session.handle = currentUser.handle;
  session.state = 'authenticated' as any;  // Type cast!
  sessionManager.updateSession(session.id, session);
}
```

### Fix
**File:** `server/src/services/DoorSessionService.ts` (NEW)

```typescript
export interface DoorSession {
  id: string;
  userId: string;
  doorId: string;
  gameState: any;
  history: any[];
  createdAt: Date;
  lastActivity: Date;
}

export class DoorSessionService {
  private sessions: Map<string, DoorSession> = new Map();
  
  createSession(userId: string, doorId: string): DoorSession {
    const sessionId = uuidv4();
    const session: DoorSession = {
      id: sessionId,
      userId,
      doorId,
      gameState: {},
      history: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }
  
  getSession(sessionId: string): DoorSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  updateSession(sessionId: string, updates: Partial<DoorSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date();
    }
  }
  
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  cleanupInactiveSessions(timeoutMs: number): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > timeoutMs) {
        this.sessions.delete(id);
      }
    }
  }
}
```

**File:** `server/src/index.ts`

```typescript
// ✅ ADD: Create DoorSessionService
const doorSessionService = new DoorSessionService();

// Add cleanup interval
setInterval(() => {
  doorSessionService.cleanupInactiveSessions(30 * 60 * 1000); // 30 min
}, 5 * 60 * 1000); // Check every 5 min
```

**File:** `server/src/api/routes.ts`

```typescript
// ✅ CORRECT - Use dedicated service
const session = doorSessionService.createSession(currentUser.id, doorId);
```

**Time:** 3-4 hours  
**Impact:** Proper session management, prevents memory leaks

---

## Critical Issue #3: Type Safety Violations

### Problem
Extensive use of `as any` type casting (15+ occurrences).

### Evidence
```typescript
// ❌ WRONG - Type casting everywhere
const currentUser = (request as any).user;  // Repeated 20+ times
session.state = 'authenticated' as any;
const door = (doorHandler as any).doors.get(id);
```

### Fix
**File:** `server/src/api/types.ts` (NEW)

```typescript
import type { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface MessageBaseParams {
  id: string;
}

export interface DoorParams {
  id: string;
}
```

**File:** `server/src/api/routes.ts`

```typescript
// ✅ CORRECT - Use typed requests
import type { AuthenticatedRequest } from './types.js';

server.get('/api/v1/doors', {
  preHandler: authenticateUser
}, async (request: AuthenticatedRequest, reply) => {
  const currentUser = request.user;  // Type-safe!
  // ...
});
```

**Time:** 2-3 hours  
**Impact:** Full type safety restored

---

## Summary

| Issue | File | Time | Priority |
|-------|------|------|----------|
| Breaking Encapsulation | server/src/handlers/DoorHandler.ts<br>server/src/api/routes.ts | 2-3 hours | 🔴 Critical |
| Pseudo-Session Hack | server/src/services/DoorSessionService.ts (NEW)<br>server/src/index.ts<br>server/src/api/routes.ts | 3-4 hours | 🔴 Critical |
| Type Safety Violations | server/src/api/types.ts (NEW)<br>server/src/api/routes.ts | 2-3 hours | 🔴 Critical |

**Total Time:** 8-10 hours

---

## Why These Fixes Are Critical

1. **Type Safety** - Current code defeats TypeScript's purpose, hides bugs
2. **Encapsulation** - Direct private access breaks on refactoring
3. **Memory Leaks** - Pseudo-sessions accumulate without cleanup
4. **Maintainability** - Code is fragile and difficult to change
5. **Security** - Type casting bypasses safety checks

---

## After Fixes

Once these fixes are complete:
- ✅ Code will be type-safe
- ✅ Proper encapsulation maintained
- ✅ No memory leaks
- ✅ Can refactor with confidence
- ✅ Ready for production

---

**Created:** 2025-12-01  
**Status:** Action Required  
**Next Step:** Apply fixes in order listed above

