# Refactoring Priority List
**Date:** December 4, 2025  
**Context:** Post-ANSI Rendering Refactor Specification  
**Architecture Score:** 9.1/10

---

## Priority 0: Critical (Must Fix Immediately)

**None** ✅

All critical issues have been resolved.

---

## Priority 1: High (Fix Before Production)

### P1.1: Execute ANSI Rendering Refactoring 🎯 **NEW**

**Issue:** ANSI rendering logic needs comprehensive refactoring as specified  
**Impact:** Maintainability, extensibility, correctness  
**Effort:** 3-4 days  
**Files:** Multiple in `server/src/ansi/` and `server/src/terminal/`

**Specification:** `.kiro/specs/ansi-rendering-refactor/`

**Implementation Phases:**
1. ✅ Phase 1: Core utility classes (ANSIWidthCalculator, ANSIColorizer, ANSIValidator)
2. ✅ Phase 2: Refactor ANSIFrameBuilder to use utilities
3. ✅ Phase 3: Create ANSIRenderingService with RenderContext
4. ✅ Phase 4: Add web context support
5. ✅ Phase 5: Add terminal width enforcement
6. ✅ Phase 6: Migrate ANSIRenderer to use new service
7. ✅ Phase 7: Update tests and validation
8. ✅ Phase 8: Update browser demo
9. ✅ Phase 9: Final validation and cleanup

**Benefits:**
- Eliminates width calculation duplication
- Formalizes context-specific rendering (terminal, telnet, web)
- Adds 15 property-based tests for correctness
- Improves long-term maintainability
- Makes it easier to add new rendering contexts

**Recommendation:** Start with Phase 1-2 (core utilities) as they are low-risk and high-value.

---

## Priority 2: Medium (Fix Soon)

### P2.1: Remove Unused Imports in DoorHandler

**Issue:** Unused imports cluttering code  
**Impact:** Code cleanliness  
**Effort:** 1 minute  
**File:** `server/src/handlers/DoorHandler.ts`

**Action:**
```typescript
// Remove these lines:
import { ContentType } from '@baudagain/shared';
import type { MenuContent } from '@baudagain/shared';
```

### P2.2: Extract Menu Definition to Shared Location

**Issue:** Main menu structure duplicated between AuthHandler and MenuHandler  
**Impact:** Maintainability, consistency  
**Effort:** 15 minutes  
**Files:** `server/src/handlers/AuthHandler.ts`, `server/src/handlers/MenuHandler.ts`

**Current Problem:**
```typescript
// AuthHandler.ts - Lines 150-160
const menuContent: MenuContent = {
  type: ContentType.MENU,
  title: 'Main Menu',
  options: [
    { key: 'M', label: 'Message Bases', ... },
    // ... duplicated from MenuHandler
  ],
};
```

**Solution Option 1:** Call MenuHandler's display method
```typescript
// AuthHandler.ts
return this.deps.renderer.render(echoOn) + 
       welcomeOutput + 
       this.deps.menuHandler.displayMenu('main');
```

**Solution Option 2:** Extract to shared constant
```typescript
// shared/menus.ts
export const MAIN_MENU: Menu = {
  id: 'main',
  title: 'Main Menu',
  options: [...]
};
```

**Recommendation:** Option 1 (call MenuHandler) is cleaner and maintains single source of truth.

---

## Priority 3: Low (Nice to Have)

### P3.1: Consider Renderer Factory Pattern

**Issue:** Renderer instantiation could be more elegant  
**Impact:** Code organization, extensibility  
**Effort:** 1-2 hours  
**Files:** New file `server/src/terminal/RendererFactory.ts`

**Proposed Implementation:**
```typescript
export class RendererFactory {
  static create(context: RenderContext): TerminalRenderer {
    switch (context.type) {
      case 'terminal':
        return new ANSITerminalRenderer(context);
      case 'web':
        return new WebTerminalRenderer(context);
      case 'telnet':
        return new TelnetTerminalRenderer(context);
      default:
        throw new Error(`Unknown context type: ${context.type}`);
    }
  }
}
```

**Benefits:**
- Cleaner renderer instantiation
- Easier to add new renderer types
- Better encapsulation

**Note:** This becomes more valuable after the ANSI rendering refactoring is complete.

---

## Completed Refactorings ✅

### ✅ Task 53: ANSI Frame Alignment
- Implemented ANSIFrameBuilder utility
- Implemented ANSIFrameValidator for testing
- Updated all screens to use ANSIFrameBuilder
- Added visual regression tests
- All frames now properly aligned

### ✅ Task 47: Control Panel Testing
- Dashboard functionality validated
- Users management tested
- Message Bases management tested
- AI Settings page verified

### ✅ Task 39: API Routes Refactoring
- Split monolithic routes.ts into 6 manageable files
- Reduced code duplication by ~40%
- All 385 tests passing

### ✅ Milestone 6: Hybrid Architecture
- REST API fully functional (19 endpoints)
- WebSocket notifications working
- Terminal client refactored
- Comprehensive documentation

---

## Summary

**Total Issues:** 3
- **P0 (Critical):** 0
- **P1 (High):** 1
- **P2 (Medium):** 2
- **P3 (Low):** 1 (optional)

**Recommended Focus:**
1. **P1.1:** Begin ANSI rendering refactoring (Phases 1-2 first)
2. **P2.1:** Quick cleanup of unused imports
3. **P2.2:** Extract menu definition (optional, low impact)

**Timeline:**
- P2.1: 1 minute
- P2.2: 15 minutes
- P1.1: 3-4 days (can be done incrementally)

**Architecture Health:** EXCELLENT (9.1/10)

The codebase is in excellent shape. The main remaining work is the planned ANSI rendering refactoring, which has a clear specification and implementation plan.

