# Refactoring Priority List - Post Task 47

**Date:** December 4, 2025  
**Context:** Milestone 7 - Comprehensive User Testing (40% complete)  
**Architecture Score:** 8.8/10

---

## Priority 0: Critical (Must Fix Before Demo)

### P0-1: Fix ANSI Frame Alignment (Task 53)

**Issue:** ANSI frames not properly aligned across different screens  
**Impact:** User experience, visual quality, demo readiness  
**Effort:** 6-8 hours  
**Files Affected:**
- `server/src/ansi/ANSIRenderer.ts`
- All ANSI template files in `data/ansi/`
- All handlers that generate framed output

**Action Items:**
1. Create `server/src/ansi/ANSIFrameBuilder.ts` utility class
2. Implement width calculation that accounts for ANSI codes
3. Add padding normalization methods
4. Create `server/src/ansi/ANSIFrameValidator.ts` for testing
5. Update all screens to use ANSIFrameBuilder:
   - Welcome screen
   - Goodbye screen
   - Menu screens
   - Error message frames
   - Door game frames
6. Add visual regression tests

**Code Example:**
```typescript
// server/src/ansi/ANSIFrameBuilder.ts
export class ANSIFrameBuilder {
  constructor(private width: number = 55) {}
  
  /**
   * Calculate visible width (excluding ANSI codes)
   */
  private getVisibleWidth(text: string): number {
    return text.replace(/\x1b\[[0-9;]*m/g, '').length;
  }
  
  /**
   * Pad text to exact width
   */
  private padToWidth(text: string, width: number): string {
    const visibleWidth = this.getVisibleWidth(text);
    const padding = width - visibleWidth;
    return text + ' '.repeat(Math.max(0, padding));
  }
  
  /**
   * Create a framed line
   */
  line(content: string): string {
    const paddedContent = this.padToWidth(content, this.width - 4);
    return `║ ${paddedContent} ║\r\n`;
  }
  
  /**
   * Create top border
   */
  top(): string {
    return `╔${'═'.repeat(this.width - 2)}╗\r\n`;
  }
  
  /**
   * Create bottom border
   */
  bottom(): string {
    return `╚${'═'.repeat(this.width - 2)}╝\r\n`;
  }
  
  /**
   * Create separator
   */
  separator(): string {
    return `╠${'═'.repeat(this.width - 2)}╣\r\n`;
  }
}
```

**Testing:**
```typescript
// server/src/ansi/ANSIFrameValidator.test.ts
describe('ANSIFrameValidator', () => {
  it('should validate frame alignment', () => {
    const frame = new ANSIFrameBuilder(55)
      .top()
      .line('Test Content')
      .bottom();
    
    const validator = new ANSIFrameValidator(frame);
    expect(validator.isAligned()).toBe(true);
    expect(validator.getWidth()).toBe(55);
  });
  
  it('should handle ANSI codes in content', () => {
    const frame = new ANSIFrameBuilder(55)
      .top()
      .line('\x1b[32mGreen Text\x1b[0m')
      .bottom();
    
    const validator = new ANSIFrameValidator(frame);
    expect(validator.isAligned()).toBe(true);
  });
});
```

---

## Priority 1: High (Fix Soon)

### P1-1: Fix Door Game Edge Cases

**Issue:** 4 out of 16 door game tests failing (25% failure rate)  
**Impact:** Door game reliability, user experience  
**Effort:** 4-6 hours  
**Files Affected:**
- `server/src/services/DoorService.ts`
- `server/src/db/repositories/DoorSessionRepository.ts`
- `server/src/api/routes/door.routes.ts`

**Specific Failures:**
1. Session reuse/cleanup issue
2. Door session persistence not working
3. Input validation needs improvement
4. Empty input handling needs work

**Action Items:**
1. Review session management in `DoorService.enterDoor()`
2. Fix door session persistence in `DoorSessionRepository`
3. Add input validation in door game endpoints
4. Improve error messages for edge cases
5. Add tests for edge cases

**Code Review Focus:**
```typescript
// server/src/services/DoorService.ts
async enterDoor(userId: string, handle: string, doorId: string): Promise<DoorEnterResult> {
  // TODO: Review session reuse logic
  const session = this.getOrCreateRESTSession(userId, handle);
  
  // TODO: Check if user is already in this door
  if (session.state === SessionState.IN_DOOR && session.data.door?.doorId === doorId) {
    // Handle reuse case properly
  }
  
  // TODO: Verify saved session loading
  let savedSession = null;
  if (this.doorSessionRepo) {
    savedSession = this.doorSessionRepo.getActiveDoorSession(userId, doorId);
  }
}
```

### P1-2: Add Database Indexes

**Issue:** No explicit indexes on frequently queried columns  
**Impact:** Performance degradation as data grows  
**Effort:** 1-2 hours  
**Files Affected:**
- `server/src/db/schema.sql`

**Action Items:**
1. Add index on `messages.base_id`
2. Add index on `messages.created_at`
3. Add index on `users.handle`
4. Add index on `door_sessions.user_id`
5. Add composite index on `door_sessions(user_id, door_id)`

**SQL Changes:**
```sql
-- server/src/db/schema.sql
CREATE INDEX IF NOT EXISTS idx_messages_base_id ON messages(base_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE INDEX IF NOT EXISTS idx_door_sessions_user_id ON door_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_door_sessions_user_door ON door_sessions(user_id, door_id);
```

---

## Priority 2: Medium (Nice to Have)

### P2-1: Create Shared Validation Library

**Issue:** Validation logic duplicated between frontend and backend  
**Impact:** Maintainability, consistency  
**Effort:** 2-3 hours  
**Files Affected:**
- `packages/shared/src/validation.ts` (new)
- `client/control-panel/src/pages/*.tsx`
- `server/src/utils/ValidationUtils.ts`

**Action Items:**
1. Create `packages/shared/src/validation.ts`
2. Move common validation functions to shared package
3. Export validation functions for use in both frontend and backend
4. Update frontend components to use shared validation
5. Update backend services to use shared validation

**Code Example:**
```typescript
// packages/shared/src/validation.ts
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateHandle(handle: string): ValidationResult {
  if (handle.length < 3) {
    return { valid: false, error: 'Handle must be at least 3 characters' };
  }
  if (handle.length > 20) {
    return { valid: false, error: 'Handle must be at most 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    return { valid: false, error: 'Handle can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

export function validateMessageBaseNameLength(name: string): ValidationResult {
  return validateLength(name, 1, 100, 'Message base name');
}

export function validateMessageSubject(subject: string): ValidationResult {
  return validateLength(subject, 1, 200, 'Subject');
}

export function validateMessageBody(body: string): ValidationResult {
  return validateLength(body, 1, 10000, 'Message body');
}

function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (value.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  if (value.length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  }
  return { valid: true };
}
```

**Usage in Frontend:**
```typescript
// client/control-panel/src/pages/MessageBases.tsx
import { validateMessageBaseNameLength } from '@baudagain/shared';

const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const validation = validateMessageBaseNameLength(formData.name);
  if (!validation.valid) {
    setError(validation.error!);
    return;
  }
  
  // Proceed with creation
};
```

### P2-2: Implement Caching

**Issue:** No caching for frequently accessed data  
**Impact:** Performance, scalability  
**Effort:** 4-6 hours  
**Files Affected:**
- `server/src/cache/CacheService.ts` (new)
- `server/src/services/MessageService.ts`
- `server/src/services/UserService.ts`

**Action Items:**
1. Create `CacheService` class with TTL support
2. Add caching to `MessageService.getAccessibleMessageBases()`
3. Add caching to `UserService.findById()`
4. Implement cache invalidation on updates
5. Add cache statistics endpoint

**Code Example:**
```typescript
// server/src/cache/CacheService.ts
export class CacheService {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  
  set(key: string, value: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

---

## Priority 3: Low (Future Enhancement)

### P3-1: Add JSDoc Comments

**Issue:** Some internal functions lack JSDoc comments  
**Impact:** Documentation, maintainability  
**Effort:** 2-3 hours  
**Files Affected:** Various

**Action Items:**
1. Add JSDoc to complex functions in services
2. Add JSDoc to utility functions
3. Add JSDoc to repository methods
4. Configure TypeDoc for API documentation generation

### P3-2: Remove Unused Imports

**Issue:** Unused imports in some files (e.g., DoorHandler.ts)  
**Impact:** Code cleanliness  
**Effort:** 30 minutes  
**Files Affected:**
- `server/src/handlers/DoorHandler.ts`
- Others (run linter to find)

**Action Items:**
1. Run ESLint with unused imports rule
2. Remove unused imports
3. Add pre-commit hook to prevent future unused imports

**Example:**
```typescript
// server/src/handlers/DoorHandler.ts
// Remove these unused imports:
import { ContentType } from '@baudagain/shared';  // ❌ Unused
import type { MenuContent } from '@baudagain/shared';  // ❌ Unused
```

---

## Summary

### Immediate Actions (Before Demo)
1. **P0-1: Fix ANSI Frame Alignment** - 6-8 hours - **CRITICAL**

### Short-Term Actions (This Week)
2. **P1-1: Fix Door Game Edge Cases** - 4-6 hours
3. **P1-2: Add Database Indexes** - 1-2 hours

### Medium-Term Actions (Next Sprint)
4. **P2-1: Create Shared Validation Library** - 2-3 hours
5. **P2-2: Implement Caching** - 4-6 hours

### Long-Term Actions (Future)
6. **P3-1: Add JSDoc Comments** - 2-3 hours
7. **P3-2: Remove Unused Imports** - 30 minutes

### Total Estimated Effort
- **Critical Path:** 6-8 hours (P0-1)
- **High Priority:** 5-8 hours (P1-1, P1-2)
- **Medium Priority:** 6-9 hours (P2-1, P2-2)
- **Low Priority:** 2.5-3.5 hours (P3-1, P3-2)
- **Total:** 19.5-28.5 hours

---

**Next Steps:**
1. Begin Task 53 (ANSI frame alignment) immediately
2. Schedule P1 items for after Task 53 completion
3. Plan P2 items for next sprint
4. Defer P3 items to future maintenance cycles
