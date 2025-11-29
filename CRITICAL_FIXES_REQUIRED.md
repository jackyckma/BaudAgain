# Critical Fixes Required - Milestone 5

**Date:** 2025-11-29  
**Priority:** 🔴 CRITICAL - Must fix before proceeding  
**Estimated Time:** 2 hours

---

## Overview

The architecture review has identified **3 critical issues** that must be fixed before continuing Milestone 5 development. These issues will cause compilation errors and violate the established architecture.

---

## Critical Issue #1: Type Safety Broken

### Problem
`MessageFlowState` is defined but not added to `SessionData` interface, causing 8 TypeScript errors in MessageHandler.

### Error Messages
```
Property 'message' does not exist on type 'SessionData'. (8 occurrences)
```

### Fix
**File:** `packages/shared/src/types.ts`  
**Line:** 42 (after `door?: DoorFlowState;`)

```typescript
export interface SessionData {
  auth?: AuthFlowState;
  menu?: MenuFlowState;
  door?: DoorFlowState;
  message?: MessageFlowState;  // ADD THIS LINE
}
```

**Time:** 5 minutes  
**Impact:** Code will compile

---

## Critical Issue #2: ValidationUtils Import Inconsistency

### Problem
MessageService imports ValidationUtils functions as named imports but uses them as namespace methods.

### Current Code (WRONG)
```typescript
// Line 8: Named imports
import { validateLength, sanitizeInput } from '../utils/ValidationUtils.js';

// Line 68: Namespace usage (ERROR!)
const subjectValidation = ValidationUtils.validateLength(data.subject, 1, 200);
```

### Fix
**File:** `server/src/services/MessageService.ts`  
**Lines:** 68-78

```typescript
// Replace ValidationUtils.validateLength with validateLength
const subjectValidation = validateLength(data.subject, 1, 200, 'Subject');
if (!subjectValidation.valid) {
  throw new Error(subjectValidation.error || 'Invalid subject');
}

// Replace ValidationUtils.validateLength with validateLength
const bodyValidation = validateLength(data.body, 1, 10000, 'Body');
if (!bodyValidation.valid) {
  throw new Error(bodyValidation.error || 'Invalid message body');
}

// Replace ValidationUtils.sanitizeInput with sanitizeInput
const sanitizedData: CreateMessageData = {
  ...data,
  subject: sanitizeInput(data.subject),
  body: sanitizeInput(data.body)
};
```

**Time:** 10 minutes  
**Impact:** Code will compile

---

## Critical Issue #3: MessageHandler Violates Architecture

### Problem
MessageHandler contains business logic (access level determination) and doesn't properly delegate to MessageService.

### Current Code (WRONG)
```typescript
// In MessageHandler - Line 35
const userAccessLevel = session.userId ? 10 : 0; // TODO: Get actual access level
const bases = this.deps.messageService.getAccessibleMessageBases(userAccessLevel);
```

**Issues:**
1. Handler determines access level (business logic)
2. Hardcoded access level of 10
3. TODO comment indicates incomplete implementation
4. Same pattern repeated 3 times in the file

### Fix Part 1: Add Methods to MessageService
**File:** `server/src/services/MessageService.ts`

```typescript
/**
 * Get message bases accessible by user
 */
async getAccessibleMessageBasesForUser(userId: string | undefined): Promise<MessageBase[]> {
  const accessLevel = await this.getUserAccessLevel(userId);
  return this.messageBaseRepo.getAccessibleMessageBases(accessLevel);
}

/**
 * Get user access level
 */
private async getUserAccessLevel(userId: string | undefined): Promise<number> {
  if (!userId) {
    return 0; // Anonymous users
  }
  
  // Get user from repository
  const user = await this.userRepo.getUserById(userId);
  return user?.accessLevel ?? 10; // Default user level
}

/**
 * Check if user can read from message base
 */
async canUserReadBase(userId: string | undefined, baseId: string): Promise<boolean> {
  const base = this.getMessageBase(baseId);
  if (!base) return false;
  
  const accessLevel = await this.getUserAccessLevel(userId);
  return accessLevel >= base.accessLevelRead;
}

/**
 * Check if user can write to message base
 */
async canUserWriteBase(userId: string | undefined, baseId: string): Promise<boolean> {
  const base = this.getMessageBase(baseId);
  if (!base) return false;
  
  const accessLevel = await this.getUserAccessLevel(userId);
  return accessLevel >= base.accessLevelWrite;
}
```

**Note:** MessageService needs UserRepository injected:
```typescript
constructor(
  private messageBaseRepo: MessageBaseRepository,
  private messageRepo: MessageRepository,
  private userRepo: UserRepository  // ADD THIS
) {}
```

### Fix Part 2: Update MessageHandler
**File:** `server/src/handlers/MessageHandler.ts`

Replace all 3 occurrences of access level logic:

```typescript
// OLD (Line 35):
const userAccessLevel = session.userId ? 10 : 0; // TODO: Get actual access level
const bases = this.deps.messageService.getAccessibleMessageBases(userAccessLevel);

// NEW:
const bases = await this.deps.messageService.getAccessibleMessageBasesForUser(session.userId);
```

```typescript
// OLD (Line 88):
const userAccessLevel = 10; // TODO: Get actual access level

// NEW:
const canRead = await this.deps.messageService.canUserReadBase(session.userId, messageState.currentBaseId);
if (!canRead) {
  return '\r\nYou do not have permission to read this message base.\r\n\r\n' +
         this.showMessageBaseList(session);
}
```

```typescript
// OLD (Line 177):
const userAccessLevel = 10; // TODO: Get actual access level
if (!this.deps.messageService.canWrite(base, userAccessLevel)) {

// NEW:
const canWrite = await this.deps.messageService.canUserWriteBase(session.userId, messageState.currentBaseId);
if (!canWrite) {
```

### Fix Part 3: Update index.ts
**File:** `server/src/index.ts`

```typescript
// OLD:
const messageService = new MessageService(messageBaseRepository, messageRepository);

// NEW:
const messageService = new MessageService(messageBaseRepository, messageRepository, userRepository);
```

**Time:** 1-2 hours  
**Impact:** Proper architecture, no business logic in handler

---

## Additional Cleanup

### Remove Unused Imports
**File:** `server/src/handlers/MessageHandler.ts`

```typescript
// Remove these lines:
import { ContentType } from '@baudagain/shared';  // Line 7 - UNUSED
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';  // Line 10 - UNUSED
import type { Message } from '../db/repositories/MessageRepository.js';  // Line 11 - UNUSED
```

**Time:** 2 minutes

---

## Testing After Fixes

### 1. Verify Compilation
```bash
cd server
npm run build
```

Should complete without errors.

### 2. Verify Type Safety
```bash
cd server
npx tsc --noEmit
```

Should show no errors related to SessionData.message.

### 3. Manual Testing
1. Start server
2. Login as user
3. Try accessing message bases
4. Verify access level checks work

---

## Summary

| Issue | File | Time | Priority |
|-------|------|------|----------|
| Add MessageFlowState to SessionData | packages/shared/src/types.ts | 5 min | 🔴 Critical |
| Fix ValidationUtils imports | server/src/services/MessageService.ts | 10 min | 🔴 Critical |
| Refactor MessageHandler | server/src/services/MessageService.ts<br>server/src/handlers/MessageHandler.ts<br>server/src/index.ts | 1-2 hours | 🔴 Critical |
| Remove unused imports | server/src/handlers/MessageHandler.ts | 2 min | Low |

**Total Time:** ~2 hours

---

## Why These Fixes Are Critical

1. **Type Safety** - Code won't compile without MessageFlowState in SessionData
2. **Architecture** - Business logic in handlers violates layered architecture
3. **Maintainability** - Current pattern makes testing difficult
4. **Security** - Access level checks are incomplete and hardcoded

---

## After Fixes

Once these fixes are complete:
- ✅ Code will compile
- ✅ Architecture will be correct
- ✅ Access control will work properly
- ✅ Can continue Milestone 5 with confidence

---

**Created:** 2025-11-29  
**Status:** Action Required  
**Next Step:** Apply fixes in order listed above
