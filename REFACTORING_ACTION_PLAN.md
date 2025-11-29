# Refactoring Action Plan - Post Milestone 4
**Date:** 2025-11-29  
**Status:** Ready for Implementation  
**Estimated Total Effort:** 20-25 hours  

---

## Overview

This document provides a prioritized, actionable plan for addressing technical debt and improving code quality identified in the architecture review. Each task includes specific code changes, estimated effort, and expected benefits.

---

## Priority 0: Critical (Must Fix Before Production)

### ✅ NONE

All critical security and functionality issues have been addressed.

---

## Priority 1: High (Should Fix in Next Sprint)

### Task 1.1: Extract MenuService from MenuHandler

**Effort:** 2-3 hours  
**Impact:** High - Improves testability and configurability  
**Files to Create:** `server/src/services/MenuService.ts`  
**Files to Modify:** `server/src/handlers/MenuHandler.ts`, `server/src/index.ts`  

**Implementation Steps:**

1. Create `MenuService.ts`:
```typescript
import type { Menu, MenuOption } from '@baudagain/shared';
import type { BBSConfig } from '../config/ConfigLoader.js';

export class MenuService {
  private menus: Map<string, Menu> = new Map();

  constructor(config: BBSConfig) {
    this.initializeMenus(config);
  }

  private initializeMenus(config: BBSConfig): void {
    // Main menu
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

  getMenu(menuId: string): Menu | undefined {
    return this.menus.get(menuId);
  }

  getMenuForUser(menuId: string, accessLevel: number): Menu | undefined {
    const menu = this.getMenu(menuId);
    if (!menu) return undefined;

    // Filter options based on access level (future enhancement)
    return menu;
  }

  findOption(menuId: string, key: string): MenuOption | undefined {
    const menu = this.getMenu(menuId);
    if (!menu) return undefined;

    return menu.options.find(opt => opt.key.toUpperCase() === key.toUpperCase());
  }

  setMenu(menu: Menu): void {
    this.menus.set(menu.id, menu);
  }
}
```

2. Update `MenuHandler.ts`:
```typescript
export class MenuHandler implements CommandHandler {
  constructor(
    private menuService: MenuService,  // Add this
    private deps: HandlerDependencies
  ) {}

  // Remove initializeMenus() method
  // Remove private menus: Map<string, Menu>

  private displayMenu(menuId: string): string {
    const menu = this.menuService.getMenu(menuId);
    if (!menu) {
      return 'Menu not found.\r\n';
    }
    // ... rest of method
  }

  private async handleMenuOption(option: MenuOption, session: Session): Promise<string> {
    // Use menuService.findOption() instead of direct map access
  }
}
```

3. Update `index.ts`:
```typescript
const menuService = new MenuService(config);
const menuHandler = new MenuHandler(menuService, handlerDeps);
```

**Testing:**
- Verify menu display works
- Verify menu navigation works
- Verify option selection works

---

### Task 1.2: Extract DoorService from DoorHandler

**Effort:** 1-2 hours  
**Impact:** Medium - Improves organization and testability  
**Files to Create:** `server/src/services/DoorService.ts`  
**Files to Modify:** `server/src/handlers/DoorHandler.ts`, `server/src/index.ts`  

**Implementation Steps:**

1. Create `DoorService.ts`:
```typescript
import type { Door } from '../doors/Door.js';

export class DoorService {
  private doors: Map<string, Door> = new Map();

  registerDoor(door: Door): void {
    this.doors.set(door.id, door);
  }

  getDoor(doorId: string): Door | undefined {
    return this.doors.get(doorId);
  }

  getAllDoors(): Door[] {
    return Array.from(this.doors.values());
  }

  getDoorByIndex(index: number): Door | undefined {
    const doors = this.getAllDoors();
    return doors[index - 1];
  }

  getDoorCount(): number {
    return this.doors.size;
  }
}
```

2. Update `DoorHandler.ts`:
```typescript
export class DoorHandler implements CommandHandler {
  constructor(
    private doorService: DoorService,  // Add this
    private deps: DoorHandlerDependencies
  ) {}

  // Remove private doors: Map<string, Door>
  // Remove registerDoor() method

  private async handleDoorSelection(command: string, session: Session): Promise<string> {
    // Use doorService.getDoorByIndex() instead of direct map access
    const door = this.doorService.getDoorByIndex(doorIndex);
    // ...
  }

  private showDoorMenu(message?: string): string {
    // Use doorService.getAllDoors() instead of this.doors.values()
    const doors = this.doorService.getAllDoors();
    // ...
  }
}
```

3. Update `index.ts`:
```typescript
const doorService = new DoorService();
doorService.registerDoor(oracleDoor);

const doorHandlerDeps = {
  ...handlerDeps,
  doorSessionRepository,
  doorService  // Add this
};
const doorHandler = new DoorHandler(doorHandlerDeps);
```

**Testing:**
- Verify door menu displays
- Verify door selection works
- Verify door entry/exit works

---

### Task 1.3: Consolidate Terminal Rendering with BaseTerminalRenderer

**Effort:** 2 hours  
**Impact:** Medium - Reduces code duplication  
**Files to Modify:** `server/src/terminal/WebTerminalRenderer.ts`, `server/src/terminal/ANSITerminalRenderer.ts`  

**Implementation Steps:**

1. Update `WebTerminalRenderer.ts`:
```typescript
import { BaseTerminalRenderer } from './BaseTerminalRenderer.js';

export class WebTerminalRenderer extends BaseTerminalRenderer {
  // Remove duplicate methods that exist in BaseTerminalRenderer:
  // - centerText()
  // - wrapText()
  // - formatMenu() (if it exists)

  // Keep only web-specific overrides
  protected renderRawANSI(ansi: string): string {
    // Web-specific ANSI handling (if any)
    return ansi;
  }

  // Override only if web-specific behavior needed
  render(content: Content): string {
    // Use super.render() for common content types
    // Override only for web-specific rendering
    return super.render(content);
  }
}
```

2. Update `ANSITerminalRenderer.ts`:
```typescript
import { BaseTerminalRenderer } from './BaseTerminalRenderer.js';

export class ANSITerminalRenderer extends BaseTerminalRenderer {
  // Remove duplicate methods

  protected renderRawANSI(ansi: string): string {
    // Raw ANSI passthrough
    return ansi;
  }
}
```

3. Review `BaseTerminalRenderer.ts` and ensure all common methods are there:
```typescript
export abstract class BaseTerminalRenderer implements TerminalRenderer {
  protected centerText(text: string, width: number): string {
    // Common implementation
  }

  protected wrapText(text: string, width: number): string {
    // Common implementation
  }

  protected formatMenu(menu: MenuContent): string {
    // Common menu formatting
  }

  abstract render(content: Content): string;
}
```

**Testing:**
- Verify welcome screen renders correctly
- Verify menus render correctly
- Verify ANSI colors work
- Verify no visual regressions

---

### Task 1.4: Standardize Error Message Formatting

**Effort:** 2 hours  
**Impact:** Medium - Improves UX consistency  
**Files to Create:** `server/src/utils/MessageFormatter.ts`  
**Files to Modify:** All handlers  

**Implementation Steps:**

1. Create `MessageFormatter.ts`:
```typescript
/**
 * Message Formatter Utility
 * 
 * Provides consistent formatting for user-facing messages.
 */

export class MessageFormatter {
  /**
   * Format an error message
   */
  static error(message: string): string {
    return `\r\n\x1b[31m❌ ${message}\x1b[0m\r\n\r\n`;
  }

  /**
   * Format a warning message
   */
  static warning(message: string): string {
    return `\r\n\x1b[33m⚠️  ${message}\x1b[0m\r\n\r\n`;
  }

  /**
   * Format an info message
   */
  static info(message: string): string {
    return `\r\n\x1b[36mℹ️  ${message}\x1b[0m\r\n\r\n`;
  }

  /**
   * Format a success message
   */
  static success(message: string): string {
    return `\r\n\x1b[32m✅ ${message}\x1b[0m\r\n\r\n`;
  }

  /**
   * Format a system message (no color)
   */
  static system(message: string): string {
    return `\r\n${message}\r\n\r\n`;
  }

  /**
   * Format a prompt (no newlines)
   */
  static prompt(message: string): string {
    return message;
  }
}
```

2. Update handlers to use MessageFormatter:

**AuthHandler.ts:**
```typescript
// Before:
return 'Authentication error. Please try again.\r\n';

// After:
return MessageFormatter.error('Authentication error. Please try again.');
```

**MenuHandler.ts:**
```typescript
// Before:
return '\r\n\x1b[33mThe AI SysOp is not available at this time.\x1b[0m\r\n';

// After:
return MessageFormatter.warning('The AI SysOp is not available at this time.');
```

**DoorHandler.ts:**
```typescript
// Before:
return '\r\nError entering door game. Returning to main menu.\r\n\r\n';

// After:
return MessageFormatter.error('Error entering door game. Returning to main menu.');
```

3. Update all error messages across the codebase.

**Testing:**
- Verify all error messages display correctly
- Verify colors render properly
- Verify spacing is consistent

---

### Task 1.5: Remove Unused Imports

**Effort:** 15 minutes  
**Impact:** Low - Code cleanliness  
**Files to Modify:** `server/src/handlers/DoorHandler.ts`  

**Implementation Steps:**

1. Remove unused imports from `DoorHandler.ts`:
```typescript
// Remove these lines:
import { ContentType } from '@baudagain/shared';
import type { MenuContent } from '@baudagain/shared';
```

2. Run TypeScript compiler to verify no errors.

3. Search for other unused imports:
```bash
# Use your IDE's "Optimize Imports" feature
# Or manually review each file
```

**Testing:**
- Verify code compiles
- Verify no runtime errors

---

## Priority 2: Medium (Should Fix Soon)

### Task 2.1: Add Unit Tests for Services

**Effort:** 4-6 hours  
**Impact:** High - Reduces test debt  
**Files to Create:** Multiple test files  

**Implementation Steps:**

1. Set up test framework (if not already done):
```bash
npm install --save-dev vitest @vitest/ui
```

2. Create `server/src/services/UserService.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './UserService.js';
import type { UserRepository } from '../db/repositories/UserRepository.js';

// Mock UserRepository
const createMockUserRepository = (): UserRepository => ({
  getUserByHandle: async (handle: string) => null,
  createUser: async (user: any) => ({ ...user, id: '123' }),
  updateLastLogin: async (userId: string) => {},
} as any);

describe('UserService', () => {
  let userService: UserService;
  let mockRepo: UserRepository;

  beforeEach(() => {
    mockRepo = createMockUserRepository();
    userService = new UserService(mockRepo);
  });

  describe('validateHandle', () => {
    it('should accept valid handles', () => {
      const result = userService.validateHandle('validuser');
      expect(result.valid).toBe(true);
    });

    it('should reject handles that are too short', () => {
      const result = userService.validateHandle('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject handles that are too long', () => {
      const result = userService.validateHandle('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 20 characters');
    });

    it('should reject handles with invalid characters', () => {
      const result = userService.validateHandle('user@name');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letters, numbers, and underscores');
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const result = userService.validatePassword('password123');
      expect(result.valid).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      const result = userService.validatePassword('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const user = await userService.createUser({
        handle: 'testuser',
        password: 'password123',
      });

      expect(user).toBeDefined();
      expect(user.handle).toBe('testuser');
      expect(user.passwordHash).not.toBe('password123');
    });

    it('should reject duplicate handles', async () => {
      mockRepo.getUserByHandle = async () => ({ handle: 'existing' } as any);

      await expect(
        userService.createUser({ handle: 'existing', password: 'pass' })
      ).rejects.toThrow('Handle already taken');
    });
  });
});
```

3. Create `server/src/utils/ValidationUtils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateHandle, validatePassword, sanitizeInput } from './ValidationUtils.js';

describe('ValidationUtils', () => {
  describe('validateHandle', () => {
    it('should validate correct handles', () => {
      expect(validateHandle('user123').valid).toBe(true);
      expect(validateHandle('test_user').valid).toBe(true);
    });

    it('should reject invalid handles', () => {
      expect(validateHandle('ab').valid).toBe(false);
      expect(validateHandle('user@name').valid).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove null bytes', () => {
      const result = sanitizeInput('test\0string');
      expect(result).toBe('teststring');
    });

    it('should remove ANSI escape sequences', () => {
      const result = sanitizeInput('test\x1b[31mred\x1b[0m');
      expect(result).toBe('testred');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  test  ');
      expect(result).toBe('test');
    });
  });
});
```

4. Run tests:
```bash
cd server
npm test
```

**Testing:**
- All tests should pass
- Aim for 80%+ coverage on services

---

### Task 2.2: Add Configuration Validation

**Effort:** 1 hour  
**Impact:** Medium - Fail fast on invalid config  
**Files to Modify:** `server/src/config/ConfigLoader.ts`, `server/src/index.ts`  

**Implementation Steps:**

1. Add validation method to `ConfigLoader.ts`:
```typescript
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

export class ConfigLoader {
  // ... existing methods

  validateConfig(): ConfigValidationResult {
    const errors: string[] = [];

    // Validate BBS settings
    if (!this.config.bbs.name || this.config.bbs.name.trim() === '') {
      errors.push('BBS name is required');
    }

    if (this.config.bbs.maxNodes < 1) {
      errors.push('Max nodes must be at least 1');
    }

    // Validate AI settings
    if (this.config.ai.sysop.enabled) {
      if (!process.env.ANTHROPIC_API_KEY) {
        errors.push('ANTHROPIC_API_KEY environment variable required when AI is enabled');
      }

      if (!this.config.ai.model) {
        errors.push('AI model must be specified when AI is enabled');
      }
    }

    // Validate JWT settings
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your_jwt_secret_here_change_in_production') {
      errors.push('JWT_SECRET environment variable must be set to a secure value');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

2. Update `index.ts` to validate on startup:
```typescript
// After loading config
const validation = configLoader.validateConfig();
if (!validation.valid) {
  server.log.error({ errors: validation.errors }, 'Configuration validation failed');
  console.error('\n❌ Configuration Errors:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  console.error('\nPlease fix the configuration and try again.\n');
  process.exit(1);
}

server.log.info('Configuration validated successfully');
```

**Testing:**
- Test with invalid config (missing BBS name)
- Test with missing API key
- Test with invalid JWT secret
- Verify server fails to start with clear error messages

---

### Task 2.3: Improve Type Safety (Fix `as any`)

**Effort:** 30 minutes  
**Impact:** Low-Medium - Better type safety  
**Files to Modify:** `server/src/index.ts`  

**Implementation Steps:**

1. Fix the type assertion in `index.ts`:
```typescript
// Before:
const jwtUtil = new JWTUtil(jwtConfig as any);

// After:
const jwtUtil = new JWTUtil({
  secret: jwtConfig.secret,
  expiresIn: jwtConfig.expiresIn as any, // StringValue type is complex, this is acceptable
});
```

2. Or update `JWTConfig` interface to accept string:
```typescript
export interface JWTConfig {
  secret: string;
  expiresIn?: string | number;  // Simplify type
}
```

**Testing:**
- Verify code compiles
- Verify JWT tokens work correctly

---

## Priority 3: Low (Nice to Have)

### Task 3.1: Add Performance Monitoring

**Effort:** 2-3 hours  
**Impact:** Low - Better observability  

**Implementation Steps:**

1. Add timing middleware to Fastify
2. Log slow database queries
3. Track AI response times
4. Monitor session counts

**Defer to:** Post-MVP

---

### Task 3.2: Implement Caching

**Effort:** 3-4 hours  
**Impact:** Low - Performance improvement  

**Implementation Steps:**

1. Add Redis or in-memory cache
2. Cache frequently accessed users
3. Cache menu structures
4. Add cache invalidation

**Defer to:** Post-MVP

---

## Implementation Schedule

### Sprint 1 (Week 1)
- ✅ Task 1.1: Extract MenuService (2-3 hours)
- ✅ Task 1.2: Extract DoorService (1-2 hours)
- ✅ Task 1.3: Consolidate Terminal Rendering (2 hours)
- ✅ Task 1.5: Remove Unused Imports (15 min)

**Total: 5-7 hours**

### Sprint 2 (Week 2)
- ✅ Task 1.4: Standardize Error Messages (2 hours)
- ✅ Task 2.1: Add Unit Tests (4-6 hours)
- ✅ Task 2.2: Add Config Validation (1 hour)
- ✅ Task 2.3: Fix Type Safety (30 min)

**Total: 7-9 hours**

### Total Effort: 12-16 hours

---

## Success Criteria

### Code Quality Metrics

**Before Refactoring:**
- Service Layer Completeness: 40%
- Code Duplication: Medium
- Test Coverage: 0%
- Type Safety: 95%

**After Refactoring:**
- Service Layer Completeness: 90%
- Code Duplication: Low
- Test Coverage: 70%+
- Type Safety: 98%

### Functional Requirements

- ✅ All existing functionality continues to work
- ✅ No regressions in user experience
- ✅ All tests pass
- ✅ Code compiles without errors

---

## Risk Assessment

### Low Risk Tasks
- Task 1.5: Remove Unused Imports
- Task 2.2: Add Config Validation
- Task 2.3: Fix Type Safety

### Medium Risk Tasks
- Task 1.1: Extract MenuService (requires careful testing)
- Task 1.2: Extract DoorService (requires careful testing)
- Task 1.4: Standardize Error Messages (many files to update)

### High Risk Tasks
- Task 1.3: Consolidate Terminal Rendering (affects display logic)
- Task 2.1: Add Unit Tests (new infrastructure)

**Mitigation:**
- Test thoroughly after each task
- Keep changes small and focused
- Commit after each successful task
- Have rollback plan ready

---

## Conclusion

This refactoring plan addresses the technical debt identified in the architecture review while maintaining system stability. The tasks are prioritized by impact and risk, with clear implementation steps and success criteria.

**Recommendation:** Complete Priority 1 tasks before starting Milestone 5. Priority 2 tasks can be done in parallel with Milestone 5 development.

---

**Plan Created:** 2025-11-29  
**Status:** Ready for Implementation  
**Estimated Completion:** 2 weeks (part-time)
