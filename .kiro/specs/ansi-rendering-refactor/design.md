# Design Document: ANSI Rendering Architecture Refactor

## Overview

This design introduces a centralized ANSI rendering architecture that solves the persistent frame alignment issues in BaudAgain BBS. The core insight is that ANSI rendering is complex enough to warrant a dedicated service layer that handles all the edge cases (visual width calculation, line wrapping prevention, context-specific formatting) in one place.

The design is intentionally simple and focused on MVP delivery - no caching, no complex optimizations, just reliable rendering that works.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Handlers, Services, Routes)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Uses
                 ▼
┌─────────────────────────────────────────────────────────┐
│              ANSIRenderingService                        │
│  - Centralized rendering logic                          │
│  - Context-aware output                                 │
│  - Guaranteed alignment                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Uses
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Core Utilities                              │
│  - ANSIFrameBuilder (frames/boxes)                      │
│  - ANSIColorizer (color management)                     │
│  - ANSIWidthCalculator (visual width)                   │
│  - ANSIValidator (validation)                           │
└─────────────────────────────────────────────────────────┘
```

### Key Principle

**Single Responsibility**: Each component has one job and does it well.

## Components and Interfaces

### 1. ANSIRenderingService

The main service that coordinates all ANSI rendering.

```typescript
interface RenderContext {
  type: 'terminal' | 'telnet' | 'web';
  width: number;  // Target width (e.g., 80 columns)
}

interface RenderOptions {
  context: RenderContext;
  validate?: boolean;  // Auto-validate output (default: true in dev)
}

class ANSIRenderingService {
  /**
   * Render a frame with content
   */
  renderFrame(options: FrameOptions, context: RenderContext): string;
  
  /**
   * Render text with color
   */
  renderText(text: string, color?: string, context: RenderContext): string;
  
  /**
   * Render a template with variables
   */
  renderTemplate(templateName: string, variables: Record<string, string>, context: RenderContext): string;
  
  /**
   * Get line ending for context
   */
  getLineEnding(context: RenderContext): string;
}
```

### 2. ANSIFrameBuilder

Builds frames with guaranteed alignment (already exists, but needs refinement).

```typescript
interface FrameOptions {
  width: number;
  style: 'single' | 'double';
  padding: number;
}

interface FrameContent {
  lines: FrameLine[];
}

interface FrameLine {
  text: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

class ANSIFrameBuilder {
  constructor(options: FrameOptions);
  
  /**
   * Build a simple frame
   */
  build(content: FrameContent): string[];  // Returns array of lines
  
  /**
   * Build a frame with title
   */
  buildWithTitle(title: string, content: FrameContent, titleColor?: string): string[];
  
  /**
   * Calculate visual width (strips ANSI codes)
   */
  private visualWidth(text: string): number;
  
  /**
   * Pad text to exact width
   */
  private padLine(text: string, width: number, align: string): string;
}
```

### 3. ANSIColorizer

Manages color application and conversion.

```typescript
type ColorName = 'red' | 'green' | 'blue' | 'yellow' | 'cyan' | 'magenta' | 'white' | 'gray';

class ANSIColorizer {
  /**
   * Apply color to text (adds reset automatically)
   */
  colorize(text: string, color: ColorName): string;
  
  /**
   * Convert ANSI codes to HTML
   */
  toHTML(ansiText: string): string;
  
  /**
   * Strip all ANSI codes
   */
  strip(ansiText: string): string;
  
  /**
   * Get ANSI code for color
   */
  private getANSICode(color: ColorName): string;
}
```

### 4. ANSIWidthCalculator

Calculates visual width correctly.

```typescript
class ANSIWidthCalculator {
  /**
   * Calculate visual width (strips ANSI, handles Unicode)
   */
  static calculate(text: string): number;
  
  /**
   * Check if text fits in width
   */
  static fitsIn(text: string, width: number): boolean;
  
  /**
   * Truncate text to fit width
   */
  static truncate(text: string, width: number, ellipsis?: string): string;
}
```

### 5. ANSIValidator

Validates rendered output.

```typescript
interface ValidationResult {
  valid: boolean;
  issues: string[];
  width?: number;
  height?: number;
}

class ANSIValidator {
  /**
   * Validate frame alignment
   */
  static validateFrame(content: string): ValidationResult;
  
  /**
   * Validate all lines have same width
   */
  static validateWidth(lines: string[]): ValidationResult;
  
  /**
   * Validate borders are intact
   */
  static validateBorders(content: string, style: 'single' | 'double'): ValidationResult;
}
```

## Data Models

### RenderContext

```typescript
interface RenderContext {
  type: 'terminal' | 'telnet' | 'web';
  width: number;
}

// Common contexts
const CONTEXTS = {
  TERMINAL_80: { type: 'terminal', width: 80 },
  TERMINAL_132: { type: 'terminal', width: 132 },
  TELNET_80: { type: 'telnet', width: 80 },
  WEB_80: { type: 'web', width: 80 },
} as const;
```

### Template Definition

```typescript
interface Template {
  name: string;
  width: number;
  style: 'single' | 'double';
  content: FrameContent;
  variables: string[];  // List of variable names used
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Frame lines have uniform visual width
*For any* rendered frame, all lines should have identical visual width when ANSI codes are stripped.
**Validates: Requirements 3.1**

### Property 2: Frames fit within target width
*For any* frame and target width, the frame's visual width should be less than or equal to the target width.
**Validates: Requirements 3.3**

### Property 3: Colorization preserves visual width
*For any* text, applying color codes should not change its visual width.
**Validates: Requirements 3.4**

### Property 4: Visual width calculation strips ANSI codes
*For any* string with ANSI codes, visual width should equal the length of the string after stripping all ANSI escape codes.
**Validates: Requirements 4.1**

### Property 5: Padding produces exact width
*For any* text padded to width W, the visual width of the padded result should be exactly W.
**Validates: Requirements 4.4**

### Property 6: Template substitution maintains alignment
*For any* template and variable values, the rendered frame should have uniform line widths.
**Validates: Requirements 5.2**

### Property 7: Line endings match context
*For any* content and render context, all line endings should match the context's expected line ending type (LF for terminal/web, CRLF for telnet).
**Validates: Requirements 6.1, 2.4**

### Property 8: No mixed line endings
*For any* rendered output, all line endings should be of the same type (no mixing of LF and CRLF).
**Validates: Requirements 6.5**

### Property 9: Colors include reset codes
*For any* text with color applied, the output should end with an ANSI reset code.
**Validates: Requirements 7.2**

### Property 10: Web rendering has no ANSI codes
*For any* ANSI content rendered for web context, the output should contain no ANSI escape codes.
**Validates: Requirements 2.3, 7.4**

### Property 11: No color leakage between lines
*For any* multi-line colored content, each line should start and end with proper color codes (no color bleeding from previous lines).
**Validates: Requirements 7.5**

### Property 12: Validation provides specific errors
*For any* invalid ANSI content, validation should return at least one specific error message describing the issue.
**Validates: Requirements 9.2**

### Property 13: Context-specific rendering succeeds
*For any* valid render context (terminal, telnet, web), the rendering service should successfully produce output without errors.
**Validates: Requirements 2.1**

### Property 14: Terminal rendering prevents wrapping
*For any* content rendered for terminal context with width W, no line should exceed W characters in visual width.
**Validates: Requirements 2.2**

### Property 15: Unicode width calculation
*For any* string containing Unicode characters, visual width should correctly account for character cell width (e.g., most characters = 1 cell, some emoji = 2 cells).
**Validates: Requirements 4.2**

## Error Handling

### Error Types

```typescript
class ANSIRenderingError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ANSIRenderingError';
  }
}

class FrameAlignmentError extends ANSIRenderingError {
  constructor(message: string, public lineWidths: number[]) {
    super(message, { lineWidths });
    this.name = 'FrameAlignmentError';
  }
}

class WidthExceededError extends ANSIRenderingError {
  constructor(public actualWidth: number, public maxWidth: number) {
    super(`Content width ${actualWidth} exceeds maximum ${maxWidth}`);
    this.name = 'WidthExceededError';
  }
}
```

### Error Handling Strategy

1. **Validation Errors**: Throw descriptive errors when validation fails
2. **Width Errors**: Throw when content exceeds target width
3. **Template Errors**: Throw when template variables are missing
4. **Context Errors**: Throw when invalid context is provided

## Testing Strategy

### Unit Testing

- Test each utility class independently
- Test visual width calculation with various inputs (ANSI codes, Unicode, box-drawing chars)
- Test colorization with all supported colors
- Test frame building with different widths and styles
- Test line ending conversion for each context type

### Property-Based Testing

We will use `fast-check` for property-based testing in TypeScript.

Each correctness property will be implemented as a property-based test that runs 100+ iterations with random inputs.

Example property test structure:
```typescript
import fc from 'fast-check';

describe('Property 1: Frame lines have uniform visual width', () => {
  it('should have all lines with same visual width', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 40, max: 132 }),
        (lines, width) => {
          const frame = frameBuilder.build({ lines: lines.map(text => ({ text })) });
          const widths = frame.map(line => calculator.calculate(line));
          const uniqueWidths = [...new Set(widths)];
          return uniqueWidths.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

- Test ANSIRenderingService with real templates
- Test rendering welcome/goodbye screens
- Test variable substitution in templates
- Test context switching (terminal → web → telnet)

### Visual Regression Testing

- Capture rendered output for known templates
- Compare against golden files
- Detect unintended visual changes

## Migration Strategy

### Phase 1: Create New Services (No Breaking Changes)

1. Implement ANSIRenderingService
2. Implement utility classes
3. Add comprehensive tests
4. Keep existing code working

### Phase 2: Migrate ANSIRenderer

1. Update ANSIRenderer to use ANSIRenderingService internally
2. Keep existing API intact
3. Test that output matches (or improves)

### Phase 3: Update Callers (Gradual)

1. Update handlers to use new service directly
2. Remove old template files if needed
3. Update tests

### Phase 4: Cleanup

1. Remove deprecated code
2. Remove old utilities
3. Update documentation

## Implementation Notes

### Key Insights

1. **Visual Width is Hard**: ANSI codes, Unicode, and box-drawing characters all complicate width calculation. Centralize this logic.

2. **Context Matters**: Terminal, telnet, and web have different requirements. Don't try to use one output for all.

3. **Validation is Essential**: Catch alignment issues before they reach users.

4. **Simplicity Wins**: For MVP, focus on correctness over performance.

### Technical Decisions

1. **Use Arrays of Lines**: Instead of joining with `\n` or `\r\n` immediately, work with arrays of lines and join at the last moment based on context.

2. **Immutable Operations**: Each rendering operation returns new strings/arrays rather than mutating.

3. **Fail Fast**: Throw errors immediately when alignment issues are detected.

4. **Test-Driven**: Write property tests first, then implement to make them pass.

## Dependencies

- `fast-check`: Property-based testing library
- Existing `ANSIFrameBuilder`: Will be refactored/enhanced
- Existing `ANSIFrameValidator`: Will be integrated

## Success Criteria

1. All 15 correctness properties pass with 100+ test iterations each
2. Welcome and goodbye screens render perfectly in browser demo
3. No line wrapping issues in 80-column terminal
4. Migration completed with no visual regressions
5. Code is simpler and easier to understand than before
