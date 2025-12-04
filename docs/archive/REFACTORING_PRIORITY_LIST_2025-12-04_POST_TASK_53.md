# Refactoring Priority List - Post Task 53

**Date**: December 4, 2025  
**Context**: Actionable refactoring tasks identified in architecture review  
**Current Architecture Score**: 9.1/10  
**Target Score**: 9.3-9.5/10

---

## Priority 0: Critical (Block Progress)

**Status**: ✅ None - No blocking issues

---

## Priority 1: High (Address Soon)

### P1.1: Remove Unused Imports in DoorHandler

**File**: `server/src/handlers/DoorHandler.ts`  
**Lines**: 5-6  
**Issue**: Unused imports create code clutter

**Current Code**:
```typescript
import { ContentType } from '@baudagain/shared';  // ❌ Unused
import type { MenuContent } from '@baudagain/shared';  // ❌ Unused
```

**Fix**:
```typescript
// Remove both imports - they are not used anywhere in the file
```

**Impact**: Code cleanliness  
**Effort**: 5 minutes  
**Risk**: None  
**Tests Affected**: None

---

### P1.2: Extract Template System from ANSIRenderer

**File**: `server/src/ansi/ANSIRenderer.ts`  
**Issue**: ANSIRenderer has too many responsibilities

**Current Responsibilities**:
1. Template file loading
2. Variable substitution
3. Frame building
4. Screen rendering
5. ANSI file management

**Proposed Solution**: Create TemplateManager class

**New File**: `server/src/ansi/TemplateManager.ts`
```typescript
/**
 * Template Manager
 * 
 * Handles loading and processing of ANSI template files.
 */
export class TemplateManager {
  private templateCache: Map<string, string> = new Map();
  
  constructor(private templateDir: string) {}
  
  /**
   * Load a template file with caching
   */
  loadTemplate(name: string): string {
    // Validate filename (no path traversal)
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new Error('Invalid template name');
    }
    
    // Check cache first
    if (this.templateCache.has(name)) {
      return this.templateCache.get(name)!;
    }
    
    // Load from disk
    const templatePath = path.join(this.templateDir, name);
    
    // Ensure path is within templateDir
    const resolvedPath = path.resolve(templatePath);
    const resolvedDir = path.resolve(this.templateDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error('Invalid template path');
    }
    
    const content = fs.readFileSync(templatePath, 'utf-8');
    this.templateCache.set(name, content);
    return content;
  }
  
  /**
   * Substitute variables in template
   */
  substituteVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }
  
  /**
   * Clear template cache (useful for testing)
   */
  clearCache(): void {
    this.templateCache.clear();
  }
}
```

**Updated**: `server/src/ansi/ANSIRenderer.ts`
```typescript
export class ANSIRenderer {
  private frameBuilder: ANSIFrameBuilder;
  private templateManager: TemplateManager;
  
  constructor(ansiDir: string) {
    this.frameBuilder = new ANSIFrameBuilder(80);
    this.templateManager = new TemplateManager(ansiDir);
  }
  
  // Keep only rendering methods
  renderWelcomeScreen(variables: Record<string, string>): string {
    // Use frameBuilder for dynamic rendering
  }
  
  renderGoodbyeScreen(variables: Record<string, string>): string {
    // Use frameBuilder for dynamic rendering
  }
  
  // Legacy method for backward compatibility
  loadTemplate(name: string): string {
    return this.templateManager.loadTemplate(name);
  }
}
```

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Template caching built-in
- ✅ Path validation for security
- ✅ Easier to test independently
- ✅ Better maintainability

**Impact**: Architecture improvement, security hardening  
**Effort**: 3-4 hours  
**Risk**: Low (backward compatible)  
**Tests Affected**: ANSIRenderer tests (update to use TemplateManager)

**Implementation Steps**:
1. Create TemplateManager class (1 hour)
2. Write TemplateManager tests (1 hour)
3. Update ANSIRenderer to use TemplateManager (1 hour)
4. Update ANSIRenderer tests (30 minutes)
5. Verify all tests pass (30 minutes)

---

## Priority 2: Medium (Address This Sprint)

### P2.1: Complete Template Migration

**Context**: Two systems coexist (templates vs frame builder)

**Current State**:
- `welcome.ans` - Template file (not used, replaced by renderWelcomeScreen)
- `goodbye.ans` - Template file (not used, replaced by renderGoodbyeScreen)
- `renderWelcomeScreen()` - Uses frame builder
- `renderGoodbyeScreen()` - Uses frame builder

**Decision Required**: Choose migration path

**Option A: Complete Migration** (Recommended)
- Remove template files (welcome.ans, goodbye.ans)
- Use frame builder exclusively
- Update documentation

**Option B: Clear Separation**
- Keep templates for static content
- Use frame builder for dynamic content
- Document when to use each

**Recommendation**: Option A (complete migration)

**Rationale**:
- Frame builder provides better alignment
- Dynamic content is more flexible
- Reduces maintenance burden
- Consistent approach

**Implementation**:
1. Verify no code uses welcome.ans or goodbye.ans directly
2. Remove template files
3. Update documentation
4. Update any references in comments

**Impact**: Consistency, maintainability  
**Effort**: 1-2 hours  
**Risk**: Very low  
**Tests Affected**: None (templates already replaced)

---

### P2.2: Consolidate Frame Utilities

**Context**: Frame-related utilities are growing

**Current Structure**:
```
server/src/ansi/
├── ANSIFrameBuilder.ts
├── ANSIFrameBuilder.test.ts
├── ANSIFrameValidator.ts
├── ANSIFrameValidator.test.ts
├── ANSIRenderer.ts
├── ANSIRenderer.test.ts
└── visual-regression.test.ts
```

**Proposed Structure**:
```
server/src/ansi/
├── frame/
│   ├── index.ts              # Public exports
│   ├── ANSIFrameBuilder.ts
│   ├── ANSIFrameValidator.ts
│   ├── types.ts              # Shared types
│   └── __tests__/
│       ├── ANSIFrameBuilder.test.ts
│       ├── ANSIFrameValidator.test.ts
│       └── visual-regression.test.ts
├── ANSIRenderer.ts
├── ANSIRenderer.test.ts
└── TemplateManager.ts        # After P1.2
```

**Benefits**:
- ✅ Clear organization
- ✅ Easier to find frame-related code
- ✅ Scalable for future additions
- ✅ Clean public API via index.ts

**Implementation**:
1. Create frame/ subdirectory
2. Move frame-related files
3. Create index.ts with exports
4. Update imports across codebase
5. Verify all tests pass

**Impact**: Organization, scalability  
**Effort**: 1-2 hours  
**Risk**: Low (mechanical refactoring)  
**Tests Affected**: Import paths only

---

### P2.3: Create Frame Presets

**Context**: Common frame patterns used repeatedly

**Proposed**: `server/src/ansi/frame/presets.ts`

```typescript
/**
 * Frame Presets
 * 
 * Common frame patterns for consistent UI across the BBS.
 */
export class FramePresets {
  /**
   * Create a menu frame with title and options
   */
  static menu(title: string, options: string[], width: number = 80): string {
    const builder = new ANSIFrameBuilder(width);
    builder.addTitle(title);
    builder.addDivider();
    
    options.forEach(option => {
      builder.addLine(option);
    });
    
    return builder.build();
  }
  
  /**
   * Create an error message frame
   */
  static error(message: string, width: number = 60): string {
    return new ANSIFrameBuilder(width)
      .addLine('⚠️  ERROR', Alignment.CENTER)
      .addDivider()
      .addLine(message, Alignment.CENTER)
      .build();
  }
  
  /**
   * Create a success message frame
   */
  static success(message: string, width: number = 60): string {
    return new ANSIFrameBuilder(width)
      .addLine('✓ SUCCESS', Alignment.CENTER)
      .addDivider()
      .addLine(message, Alignment.CENTER)
      .build();
  }
  
  /**
   * Create an info message frame
   */
  static info(title: string, lines: string[], width: number = 80): string {
    const builder = new ANSIFrameBuilder(width);
    builder.addTitle(title);
    builder.addDivider();
    
    lines.forEach(line => {
      builder.addLine(line);
    });
    
    return builder.build();
  }
  
  /**
   * Create a centered message frame
   */
  static centeredMessage(message: string, width: number = 60): string {
    return new ANSIFrameBuilder(width)
      .addLine(message, Alignment.CENTER)
      .build();
  }
}
```

**Usage Examples**:
```typescript
// Menu
const menuFrame = FramePresets.menu('Main Menu', [
  '1. Message Bases',
  '2. Door Games',
  '3. User List',
  'Q. Quit'
]);

// Error
const errorFrame = FramePresets.error('Invalid command. Please try again.');

// Success
const successFrame = FramePresets.success('Message posted successfully!');

// Info
const infoFrame = FramePresets.info('System Information', [
  'BBS Name: BaudAgain',
  'Node: 1',
  'Uptime: 2 days'
]);
```

**Benefits**:
- ✅ Consistent UI patterns
- ✅ Reduced code duplication
- ✅ Easier to maintain visual style
- ✅ Better developer experience

**Impact**: Developer experience, consistency  
**Effort**: 2-3 hours  
**Risk**: None (additive)  
**Tests Affected**: None (new functionality)

---

## Priority 3: Low (Address When Convenient)

### P3.1: Create Test Helpers

**Context**: Test setup code is duplicated

**Proposed**: `server/src/ansi/frame/__tests__/helpers.ts`

```typescript
/**
 * Test Helpers for Frame Testing
 */

/**
 * Create a test frame with given lines
 */
export function createTestFrame(width: number, lines: string[]): string {
  const builder = new ANSIFrameBuilder(width);
  lines.forEach(line => builder.addLine(line));
  return builder.build();
}

/**
 * Assert that a frame is valid
 */
export function assertFrameValid(frame: string): void {
  const result = ANSIFrameValidator.validate(frame);
  if (!result.valid) {
    throw new Error(`Frame validation failed:\n${result.issues.join('\n')}`);
  }
}

/**
 * Assert that a frame has expected width
 */
export function assertFrameWidth(frame: string, expectedWidth: number): void {
  const lines = frame.split('\n').filter(line => line.length > 0);
  const widths = lines.map(line => stripAnsi(line).length);
  const uniqueWidths = [...new Set(widths)];
  
  if (uniqueWidths.length !== 1 || uniqueWidths[0] !== expectedWidth) {
    throw new Error(
      `Expected consistent width of ${expectedWidth}, ` +
      `but got widths: ${uniqueWidths.join(', ')}`
    );
  }
}

/**
 * Strip ANSI codes from text
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Count lines in frame
 */
export function countFrameLines(frame: string): number {
  return frame.split('\n').filter(line => line.length > 0).length;
}
```

**Usage**:
```typescript
import { createTestFrame, assertFrameValid, assertFrameWidth } from './helpers';

describe('ANSIFrameBuilder', () => {
  it('should create valid frame', () => {
    const frame = createTestFrame(80, ['Line 1', 'Line 2']);
    assertFrameValid(frame);
    assertFrameWidth(frame, 80);
  });
});
```

**Benefits**:
- ✅ Reduced test duplication
- ✅ Consistent test patterns
- ✅ Easier to maintain tests
- ✅ Better test readability

**Impact**: Test quality, maintainability  
**Effort**: 2-3 hours  
**Risk**: None (test-only)  
**Tests Affected**: All frame tests (improved)

---

## Summary

### Effort Estimates

| Priority | Tasks | Total Effort | Impact |
|----------|-------|--------------|--------|
| **P1** | 2 tasks | 3-4 hours | High |
| **P2** | 3 tasks | 4-7 hours | Medium |
| **P3** | 1 task | 2-3 hours | Low |
| **Total** | 6 tasks | 9-14 hours | - |

### Recommended Schedule

**Sprint 1** (This Week):
- ✅ P1.1: Remove unused imports (5 min)
- ✅ P1.2: Extract template system (3-4 hours)
- ✅ P2.1: Complete template migration (1-2 hours)

**Sprint 2** (Next Week):
- ✅ P2.2: Consolidate frame utilities (1-2 hours)
- ✅ P2.3: Create frame presets (2-3 hours)

**Sprint 3** (When Convenient):
- ✅ P3.1: Create test helpers (2-3 hours)

### Expected Impact

**After P1 Completion**:
- Architecture Score: 9.2/10 (+0.1)
- Code Quality: Improved
- Security: Hardened

**After P2 Completion**:
- Architecture Score: 9.4/10 (+0.3)
- Organization: Excellent
- Developer Experience: Improved

**After P3 Completion**:
- Architecture Score: 9.5/10 (+0.4)
- Test Quality: Excellent
- Maintainability: Excellent

---

## Conclusion

The refactoring priorities are well-defined and achievable. The codebase is in excellent shape (9.1/10), and these improvements will bring it to near-perfect quality (9.5/10).

**Recommendation**: Address P1 tasks this week, P2 tasks next week, and P3 tasks when convenient. No tasks block progress on Milestone 7.

