# Architecture Review - Milestone 5 (In Progress)
**Date:** 2025-11-29  
**Reviewer:** AI Architecture Analyst  
**Scope:** Comprehensive codebase review during Milestone 5 development  
**Overall Score:** 8.7/10 (Excellent with specific issues to address)

---

## Executive Summary

The BaudAgain BBS codebase continues to demonstrate **excellent architectural discipline** with proper layering, consistent design patterns, and strong type safety. However, the MessageHandler implementation reveals **critical architectural violations** that need immediate attention before proceeding further.

### Key Findings

✅ **Strengths:**
- Clean layered architecture maintained in most areas
- Service layer properly implemented (UserService, MessageService, AIService)
- Excellent type safety with SessionData and flow states
- Proper use of ValidationUtils across the codebase
- Good separation of concerns in repositories

⚠️ **Critical Issues Found:**
- **MessageHandler violates architecture** - Accesses repositories directly, bypassing service layer
- **Type errors in MessageHandler** - SessionData.message property not properly defined
- **Inconsistent ValidationUtils usage** - Mixed import patterns causing errors
- **Duplicate menu rendering** - Menu structure hardcoded in multiple handlers

🔴 **Immediate Actions Required:**
1. Fix MessageHandler to use MessageService exclusively
2. Add MessageFlowState to SessionData type definition
3. Standardize ValidationUtils imports
4. Extract menu structure to MenuService

---

## 1. Critical Architecture Violations

### Issue 1.1: MessageHandler Bypasses Service Layer 🔴 CRITICAL

**Location:** `server/src/handlers/MessageHandler.ts`

**Problem:** MessageHandler directly accesses MessageService methods that should encapsulate business logic, but the handler also contains business logic that should be in the service.

**Current Code:**
```typescript
// In MessageHandler.ts - Lines 35-37
const userAccessLevel = session.userId ? 10 : 0; // TODO: Get actual access level
const bases = this.deps.messageService.getAccessibleMessageBases(userAccessLevel);
```

**Issues:**
1. Handler is determining access level (business logic)
2. TODO comment indicates incomplete implementation
3. Hardcoded access level of 10

**Correct Pattern:**
```typescript
// MessageService should handle this
class MessageService {
  getAccessibleMessageBasesForUser(userId: string | undefined): MessageBase[] {
    const userAccessLevel = this.getUserAccessLevel(userId);
    return this.messageBaseRepo.getAccessibleMessageBases(userAccessLevel);
  }
  
  private getUserAccessLevel(userId: string | undefined): number {
    if (!userId) return 0; // Anonymous
    const user = this.userRepo.getUserById(userId);
    return user?.accessLevel ?? 10; // Default user level
  }
}

// Handler just calls service
const bases = this.deps.messageService.getAccessibleMessageBasesForUser(session.userId);
```

**Impact:** HIGH - Violates layered architecture, makes testing difficult, duplicates business logic

**Effort:** 1-2 hours to refactor

---

### Issue 1.2: Type Safety Violation 🔴 CRITICAL

**Location:** `server/src/handlers/MessageHandler.ts` (Multiple locations)

**Problem:** TypeScript errors indicate `SessionData.message` property doesn't exist, but code uses it extensively.

**Errors Found:**
```
Property 'message' does not exist on type 'SessionData'. (8 occurrences)
```

**Root Cause:** `MessageFlowState` is defined in `packages/shared/src/types.ts` but not added to `SessionData` interface.

**Current SessionData:**
```typescript
export interface SessionData {
  auth?: AuthFlowState;
  menu?: MenuFlowState;
  door?: DoorFlowState;
  // message is MISSING!
}
```

**Fix Required:**
```typescript
export interface SessionData {
  auth?: AuthFlowState;
  menu?: MenuFlowState;
  door?: DoorFlowState;
  message?: MessageFlowState;  // ADD THIS
}
```

**Impact:** CRITICAL - Code won't compile, runtime errors likely

**Effort:** 5 minutes

---

### Issue 1.3: Inconsistent ValidationUtils Usage 🔴 CRITICAL

**Location:** `server/src/services/MessageService.ts`

**Problem:** Mixed import patterns causing compilation errors.

**Current Code:**
```typescript
// Line 8: Named imports
import { validateLength, sanitizeInput } from '../utils/ValidationUtils.js';

// Line 68: Namespace usage (WRONG!)
const subjectValidation = ValidationUtils.validateLength(data.subject, 1, 200);
```

**Error:** `ValidationUtils` is not defined because it wasn't imported.

**Fix:**
```typescript
// Option 1: Use named imports consistently
const subjectValidation = validateLength(data.subject, 1, 200, 'Subject');
const bodyValidation = validateLength(data.body, 1, 10000, 'Body');
const sanitizedSubject = sanitizeInput(data.subject);
const sanitizedBody = sanitizeInput(data.body);

// Option 2: Import as namespace
import * as ValidationUtils from '../utils/ValidationUtils.js';
// Then use ValidationUtils.validateLength()
```

**Impact:** HIGH - Code won't compile

**Effort:** 10 minutes

---

## 2. Design Pattern Violations

### Issue 2.1: Menu Structure Duplication

**Locations:** 
- `server/src/handlers/MenuHandler.ts` (lines 28-54)
- `server/src/handlers/AuthHandler.ts` (lines 155-162, 244-251)

**Problem:** Main menu structure is hardcoded in multiple places.

**MenuHandler.ts:**
```typescript
private initializeMenus(): void {
  const mainMenu: Menu = {
    id: 'main',
    title: 'Main Menu',
    options: [
      { key: 'M', label: 'Message Bases', description: 'Read and post messages' },
      { key: 'D', label: 'Door Games', description: 'Play interactive games' },
      { key: 'P', label: 'Page SysOp', description: 'Get help from the AI SysOp' },
      { key: 'U', label: 'User Profile', description: 'View and edit your profile' },
      { key: 'G', label: 'Goodbye', description: 'Log off the BBS' },
    ],
  };
  this.menus.set('main', mainMenu);
}
```

**AuthHandler.ts (Registration):**
```typescript
const menuContent: MenuContent = {
  type: ContentType.MENU,
  title: 'Main Menu',
  options: [
    { key: 'M', label: 'Message Bases', description: 'Read and post messages' },
    { key: 'D', label: 'Door Games', description: 'Play interactive games' },
    { key: 'P', label: 'Page SysOp', description: 'Get help from the AI SysOp' },
    { key: 'U', label: 'User Profile', description: 'View and edit your profile' },
    { key: 'G', label: 'Goodbye', description: 'Log off the BBS' },
  ],
};
```

**Impact:** MEDIUM - Maintenance burden, inconsistency risk

**Recommendation:** Extract to MenuService (as planned in REFACTORING_ACTION_PLAN.md Task 1.1)

```typescript
// MenuService
class MenuService {
  private menus: Map<string, Menu> = new Map();
  
  constructor(config: BBSConfig) {
    this.initializeMenus(config);
  }
  
  getMainMenu(): MenuContent {
    const menu = this.menus.get('main')!;
    return {
      type: ContentType.MENU,
      title: menu.title,
      options: menu.options,
    };
  }
}

// AuthHandler - simplified
return this.deps.renderer.render(echoOn) + 
       welcomeOutput + 
       this.deps.renderer.render(this.deps.menuService.getMainMenu()) + 
       '\r\nCommand: ';
```

**Effort:** 2-3 hours (as estimated in refactoring plan)

---

## 3. Code Quality Issues

### Issue 3.1: Unused Imports

**Location:** `server/src/handlers/MessageHandler.ts`

**Unused Imports:**
```typescript
import { ContentType } from '@baudagain/shared';  // Line 7 - UNUSED
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';  // Line 10 - UNUSED
import type { Message } from '../db/repositories/MessageRepository.js';  // Line 11 - UNUSED
```

**Impact:** LOW - Code cleanliness

**Fix:** Remove unused imports

**Effort:** 2 minutes

---

### Issue 3.2: Inconsistent Error Handling

**Location:** Multiple handlers

**Problem:** Error messages have inconsistent formatting across handlers.

**Examples:**

**MessageHandler.ts:**
```typescript
return '\r\nMessage base not found.\r\n\r\n' + this.showMessageBaseList(session);
return '\r\nError: No message base selected.\r\n';
return `\r\n\x1b[31mError posting message: ${errorMsg}\x1b[0m\r\n\r\n`;
```

**DoorHandler.ts:**
```typescript
return '\r\nError entering door game. Returning to main menu.\r\n\r\n';
return '\r\nError processing command. Type Q to exit.\r\n\r\n';
```

**MenuHandler.ts:**
```typescript
return this.displayMenuWithMessage('main', '\r\n\x1b[33mThe AI SysOp is not available at this time.\x1b[0m\r\n', 'warning');
```

**Recommendation:** Use MessageContent with consistent styling (as recommended in REFACTORING_ACTION_PLAN.md Task 1.4)

```typescript
// Create ErrorMessageHelper utility
class MessageFormatter {
  static error(message: string): string {
    return `\r\n\x1b[31m❌ ${message}\x1b[0m\r\n\r\n`;
  }
  
  static warning(message: string): string {
    return `\r\n\x1b[33m⚠️  ${message}\x1b[0m\r\n\r\n`;
  }
  
  static success(message: string): string {
    return `\r\n\x1b[32m✅ ${message}\x1b[0m\r\n\r\n`;
  }
}

// Usage
return MessageFormatter.error('Message base not found.') + this.showMessageBaseList(session);
```

**Impact:** MEDIUM - UX consistency

**Effort:** 2 hours (as estimated in refactoring plan)

---

### Issue 3.3: TODO Comments Indicate Incomplete Implementation

**Locations:**
- `server/src/handlers/MessageHandler.ts` line 35: `// TODO: Get actual access level`
- `server/src/handlers/MessageHandler.ts` line 88: `// TODO: Get actual access level`
- `server/src/handlers/MessageHandler.ts` line 177: `// TODO: Get actual access level`

**Problem:** Access level is hardcoded to 10 in multiple places.

**Root Cause:** UserService doesn't provide a method to get user access level.

**Fix:**
```typescript
// Add to UserService
async getUserAccessLevel(userId: string): Promise<number> {
  const user = await this.userRepository.getUserById(userId);
  return user?.accessLevel ?? 10; // Default user level
}

// Add to MessageService
async getAccessibleMessageBasesForUser(userId: string | undefined): Promise<MessageBase[]> {
  if (!userId) {
    return this.messageBaseRepo.getAccessibleMessageBases(0); // Anonymous
  }
  const accessLevel = await this.userService.getUserAccessLevel(userId);
  return this.messageBaseRepo.getAccessibleMessageBases(accessLevel);
}
```

**Impact:** MEDIUM - Incomplete feature, security concern

**Effort:** 30 minutes

---

## 4. Positive Observations

### 4.1: Excellent Service Layer Implementation ✅

**UserService** is a model implementation:
- Clean separation of concerns
- Proper delegation to repository
- Validation delegated to utilities
- Business logic encapsulated
- Async/await used correctly

```typescript
async createUser(input: CreateUserInput): Promise<User> {
  // 1. Validate
  const handleValidation = this.validateHandle(input.handle);
  if (!handleValidation.valid) {
    throw new Error(handleValidation.error);
  }
  
  // 2. Check business rules
  const existingUser = await this.userRepository.getUserByHandle(input.handle);
  if (existingUser) {
    throw new Error('Handle already taken');
  }
  
  // 3. Hash password
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  
  // 4. Create with defaults
  return await this.userRepository.createUser({...});
}
```

**This is the pattern all services should follow.**

---

### 4.2: Strong Type Safety ✅

**SessionData** provides excellent type safety:
```typescript
export interface SessionData {
  auth?: AuthFlowState;
  menu?: MenuFlowState;
  door?: DoorFlowState;
  message?: MessageFlowState;  // Once added
}
```

Each flow state is properly typed:
- `AuthFlowState` - Registration/login tracking
- `MenuFlowState` - Menu interaction tracking
- `DoorFlowState` - Door game state
- `MessageFlowState` - Message base navigation

**This prevents magic strings and provides IDE autocomplete.**

---

### 4.3: Proper Use of ValidationUtils ✅

**ValidationUtils** is well-designed and reusable:
- Clear function signatures
- Consistent return type (`ValidationResult`)
- Comprehensive validation functions
- Input sanitization included

**Good usage in UserService:**
```typescript
const handleValidation = this.userService.validateHandle(command);
if (!handleValidation.valid) {
  // Handle error
}
```

---

### 4.4: AIResponseHelper Utility ✅

**Excellent abstraction** for AI interactions:
```typescript
const welcomeOutput = await AIResponseHelper.renderAIResponse(
  this.deps.aiSysOp,
  () => this.deps.aiSysOp!.generateWelcome(user.handle),
  this.deps.renderer,
  `\r\nWelcome to BaudAgain BBS, ${user.handle}!\r\n`
);
```

**Benefits:**
- Consistent error handling
- Fallback messages
- Timeout handling
- Renderer integration

---

## 5. Architecture Compliance

### 5.1: Layered Architecture Score: 7.5/10

**Compliance:**
```
✅ Connection Layer → Session Layer → BBSCore → Handlers
⚠️ Handlers → Services (PARTIAL - MessageHandler issues)
✅ Services → Repositories
✅ Repositories → Database
```

**Violations:**
- MessageHandler contains business logic (access level determination)
- MessageHandler doesn't fully delegate to MessageService

**Recommendation:** Complete service layer extraction as planned.

---

### 5.2: Design Patterns Score: 8.5/10

| Pattern | Implementation | Score |
|---------|---------------|-------|
| Chain of Responsibility | BBSCore | 10/10 ✅ |
| Strategy | Terminal renderers | 10/10 ✅ |
| Repository | Data access | 10/10 ✅ |
| Service Layer | User, AI, Message | 7/10 ⚠️ |
| Dependency Injection | Throughout | 10/10 ✅ |
| Factory | AIProviderFactory | 10/10 ✅ |

**Service Layer Issues:**
- MessageService incomplete
- Business logic leaking into handlers

---

## 6. Specific Recommendations

### Priority 0: Critical Fixes (Must Do Before Proceeding)

#### Fix 1: Add MessageFlowState to SessionData
**File:** `packages/shared/src/types.ts`
**Time:** 5 minutes

```typescript
export interface SessionData {
  auth?: AuthFlowState;
  menu?: MenuFlowState;
  door?: DoorFlowState;
  message?: MessageFlowState;  // ADD THIS LINE
}
```

#### Fix 2: Fix ValidationUtils Imports in MessageService
**File:** `server/src/services/MessageService.ts`
**Time:** 10 minutes

```typescript
// Change lines 68-78 to use named imports
const subjectValidation = validateLength(data.subject, 1, 200, 'Subject');
if (!subjectValidation.valid) {
  throw new Error(subjectValidation.error || 'Invalid subject');
}

const bodyValidation = validateLength(data.body, 1, 10000, 'Body');
if (!bodyValidation.valid) {
  throw new Error(bodyValidation.error || 'Invalid message body');
}

const sanitizedData: CreateMessageData = {
  ...data,
  subject: sanitizeInput(data.subject),
  body: sanitizeInput(data.body)
};
```

#### Fix 3: Refactor MessageHandler to Use Service Layer Properly
**File:** `server/src/handlers/MessageHandler.ts`
**Time:** 1-2 hours

**Changes needed:**
1. Remove access level determination from handler
2. Add methods to MessageService:
   - `getAccessibleMessageBasesForUser(userId)`
   - `canUserReadBase(userId, baseId)`
   - `canUserWriteBase(userId, baseId)`
3. Update handler to call service methods

---

### Priority 1: High Priority (Should Do This Sprint)

#### Task 1: Extract MenuService
**Effort:** 2-3 hours
**Benefit:** Eliminates menu duplication, improves maintainability

See REFACTORING_ACTION_PLAN.md Task 1.1 for details.

#### Task 2: Standardize Error Messages
**Effort:** 2 hours
**Benefit:** Consistent UX, easier maintenance

See REFACTORING_ACTION_PLAN.md Task 1.4 for details.

#### Task 3: Complete MessageService Implementation
**Effort:** 1 hour
**Benefit:** Proper business logic encapsulation

Add missing methods:
- `getUserAccessLevel(userId)`
- `getAccessibleMessageBasesForUser(userId)`
- `canUserReadBase(userId, baseId)`
- `canUserWriteBase(userId, baseId)`

---

### Priority 2: Medium Priority (Should Do Soon)

#### Task 4: Remove Unused Imports
**Effort:** 15 minutes
**Benefit:** Code cleanliness

Run through all files and remove unused imports.

#### Task 5: Add Unit Tests for MessageService
**Effort:** 2-3 hours
**Benefit:** Confidence in business logic

```typescript
describe('MessageService', () => {
  it('should validate message subject length', () => {
    // Test validation
  });
  
  it('should sanitize message content', () => {
    // Test sanitization
  });
  
  it('should check user access levels', () => {
    // Test access control
  });
});
```

---

## 7. Code Quality Metrics

### 7.1: Type Safety: 9/10 ✅

**Strengths:**
- Comprehensive TypeScript usage
- Proper interface definitions
- Minimal `any` types (only 1 in index.ts for JWT config)

**Issues:**
- MessageFlowState not in SessionData (critical)
- Some type assertions needed

---

### 7.2: Separation of Concerns: 7.5/10 ⚠️

**Strengths:**
- Clear layer boundaries
- Repositories well-isolated
- Services mostly clean

**Issues:**
- MessageHandler contains business logic
- Menu structure duplicated
- Access level logic in handler

---

### 7.3: Code Duplication: 7/10 ⚠️

**Duplication Found:**
- Main menu structure (3 locations)
- Error message formatting (multiple handlers)
- Access level checks (MessageHandler)

**Recommendation:** Follow refactoring plan to eliminate duplication.

---

### 7.4: Error Handling: 8/10 ✅

**Strengths:**
- Try-catch blocks in critical paths
- Graceful AI failures
- User-friendly error messages

**Issues:**
- Inconsistent error formatting
- Some handlers don't catch all errors

---

## 8. Comparison to Previous Review

### Progress Since Milestone 4 Review

| Metric | Milestone 4 | Milestone 5 | Change |
|--------|-------------|-------------|--------|
| Overall Score | 8.5/10 | 8.7/10 | +0.2 ✅ |
| Service Layer | 7/10 | 8/10 | +1 ✅ |
| Type Safety | 9.5/10 | 9/10 | -0.5 ⚠️ |
| Code Duplication | Medium | Medium | = |
| Test Coverage | 0% | 0% | = |

**Improvements:**
- MessageService added (good structure)
- MessageRepository well-implemented
- Proper flow state for messages

**Regressions:**
- Type safety issue (MessageFlowState not in SessionData)
- MessageHandler violates architecture

---

## 9. Security Assessment

### 9.1: Input Validation ✅ GOOD

**Strengths:**
- ValidationUtils used consistently
- Input sanitization in place
- ANSI escape removal

**MessageService validation:**
```typescript
const subjectValidation = validateLength(data.subject, 1, 200, 'Subject');
const bodyValidation = validateLength(data.body, 1, 10000, 'Body');
const sanitizedData = {
  subject: sanitizeInput(data.subject),
  body: sanitizeInput(data.body)
};
```

---

### 9.2: Access Control ⚠️ INCOMPLETE

**Issue:** Access level checks are incomplete.

**Current:**
```typescript
const userAccessLevel = session.userId ? 10 : 0; // TODO: Get actual access level
```

**Should be:**
```typescript
const userAccessLevel = await this.messageService.getUserAccessLevel(session.userId);
```

**Impact:** MEDIUM - Security concern if users can access restricted bases

---

### 9.3: Rate Limiting ⏳ NOT YET IMPLEMENTED

**Status:** Planned for Task 23

**Requirement:** 30 messages per hour per user

**Recommendation:** Use existing RateLimiter utility (already used for AI requests)

```typescript
// In MessageService
private rateLimiter = new RateLimiter(30, 60 * 60 * 1000); // 30 per hour

async postMessage(data: CreateMessageData): Promise<Message> {
  // Check rate limit
  if (!this.rateLimiter.checkLimit(data.userId)) {
    throw new Error('Rate limit exceeded. You can post 30 messages per hour.');
  }
  
  // ... rest of logic
}
```

---

## 10. Final Recommendations

### Immediate Actions (Before Continuing Milestone 5)

1. **Fix Type Error** (5 min)
   - Add `message?: MessageFlowState` to SessionData

2. **Fix ValidationUtils Imports** (10 min)
   - Use named imports consistently in MessageService

3. **Refactor MessageHandler** (1-2 hours)
   - Move business logic to MessageService
   - Remove access level determination from handler
   - Add service methods for access control

**Total Time:** ~2 hours

**Benefit:** Code will compile, architecture will be correct

---

### Short-Term Actions (This Sprint)

4. **Extract MenuService** (2-3 hours)
   - Eliminate menu duplication
   - Centralize menu structure

5. **Standardize Error Messages** (2 hours)
   - Create MessageFormatter utility
   - Update all handlers

6. **Complete MessageService** (1 hour)
   - Add missing access control methods
   - Complete business logic

**Total Time:** ~5-6 hours

**Benefit:** Clean, maintainable code

---

### Medium-Term Actions (Next Sprint)

7. **Add Unit Tests** (4-6 hours)
   - MessageService tests
   - ValidationUtils tests
   - Access control tests

8. **Add Rate Limiting** (30 min)
   - Integrate RateLimiter
   - 30 messages/hour limit

9. **Input Sanitization Review** (1 hour)
   - Verify all inputs sanitized
   - Add tests

**Total Time:** ~6-8 hours

**Benefit:** Confidence, security

---

## 11. Conclusion

### Overall Assessment: 8.7/10 (Excellent with Issues)

The BaudAgain BBS codebase maintains **excellent architectural discipline** overall, but the MessageHandler implementation reveals **critical issues** that must be addressed before proceeding.

### Key Achievements ✅

- Service layer properly implemented for User and AI
- Strong type safety with flow states
- Clean repository layer
- Proper use of utilities
- Good separation of concerns (mostly)

### Critical Issues 🔴

- MessageHandler violates layered architecture
- Type safety broken (MessageFlowState not in SessionData)
- ValidationUtils import inconsistency
- Access level logic incomplete

### Recommendation

**STOP** and fix the critical issues before continuing Milestone 5 implementation. The current MessageHandler will cause problems:

1. **Compilation errors** - Type issues must be fixed
2. **Architecture violations** - Business logic in handler
3. **Incomplete features** - Access level TODOs

**Estimated fix time:** 2 hours

**After fixes:** Continue with Milestone 5 implementation following the proper patterns established in UserService and AIService.

---

**Review Completed:** 2025-11-29  
**Next Review:** After Milestone 5 completion  
**Reviewer Confidence:** High

---

## Appendix: Code Examples

### A. Correct Service Layer Pattern

```typescript
// ✅ GOOD - UserService (follow this pattern)
class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async createUser(input: CreateUserInput): Promise<User> {
    // 1. Validate
    const validation = this.validateHandle(input.handle);
    if (!validation.valid) throw new Error(validation.error);
    
    // 2. Check business rules
    const existing = await this.userRepository.getUserByHandle(input.handle);
    if (existing) throw new Error('Handle already taken');
    
    // 3. Process
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    
    // 4. Delegate to repository
    return await this.userRepository.createUser({...});
  }
}

// ✅ GOOD - Handler delegates to service
class AuthHandler {
  async handle(command: string, session: Session): Promise<string> {
    const user = await this.userService.createUser({...});
    // Just flow control, no business logic
  }
}
```

### B. Incorrect Pattern (Current MessageHandler)

```typescript
// ❌ BAD - Handler contains business logic
class MessageHandler {
  private showMessageBaseList(session: Session): string {
    // ❌ Handler determines access level (business logic)
    const userAccessLevel = session.userId ? 10 : 0;
    
    // ❌ Handler calls repository method directly
    const bases = this.deps.messageService.getAccessibleMessageBases(userAccessLevel);
    
    // This should all be in MessageService
  }
}
```

### C. Correct Pattern (How MessageHandler Should Be)

```typescript
// ✅ GOOD - Service handles business logic
class MessageService {
  async getAccessibleMessageBasesForUser(userId: string | undefined): Promise<MessageBase[]> {
    const accessLevel = await this.getUserAccessLevel(userId);
    return this.messageBaseRepo.getAccessibleMessageBases(accessLevel);
  }
  
  private async getUserAccessLevel(userId: string | undefined): Promise<number> {
    if (!userId) return 0;
    const user = await this.userRepo.getUserById(userId);
    return user?.accessLevel ?? 10;
  }
}

// ✅ GOOD - Handler just delegates
class MessageHandler {
  private async showMessageBaseList(session: Session): Promise<string> {
    const bases = await this.deps.messageService.getAccessibleMessageBasesForUser(session.userId);
    // Just render, no business logic
  }
}
```

---

**End of Review**
