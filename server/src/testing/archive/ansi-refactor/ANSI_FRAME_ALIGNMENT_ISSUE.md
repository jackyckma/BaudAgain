# ANSI Frame Alignment Issue

**Discovered During**: Task 39 - New User Registration Flow Testing  
**Date**: December 3, 2025  
**Severity**: Medium (Visual Quality Issue)  
**Status**: 🔍 DOCUMENTED - Needs Investigation

## Issue Description

ANSI box-drawing frames are not properly aligned in the terminal display. The right-side vertical bars appear at inconsistent horizontal positions, breaking the visual integrity of the frames.

## Visual Evidence

Screenshot shows:
1. **Goodbye message frame**: Right vertical bars (│) misaligned
2. **Welcome screen frames**: Multiple instances stacking with alignment issues
3. **Frame corners**: Not forming clean rectangles
4. **Horizontal lines**: Inconsistent width

## Expected Behavior

ANSI frames should:
- Form perfect rectangles with aligned corners
- Have consistent width across all instances
- Right and left borders should be vertically aligned
- No gaps or overlaps in box-drawing characters

## Current Behavior

- Right vertical bars appear at different horizontal positions
- Frames appear "broken" or "jagged"
- Multiple frame instances overlap
- Visual appearance is unprofessional

## Technical Context

### ANSI Box-Drawing Characters Used
- `┌` (U+250C) - Top-left corner
- `─` (U+2500) - Horizontal line
- `┐` (U+2510) - Top-right corner
- `│` (U+2502) - Vertical line
- `└` (U+2514) - Bottom-left corner
- `┘` (U+2518) - Bottom-right corner

### Potential Root Causes

1. **Variable Content Width**
   - Frame width calculated incorrectly
   - Content padding not consistent
   - Terminal width assumptions wrong

2. **ANSI Escape Code Issues**
   - Color codes affecting character positioning
   - Cursor positioning commands incorrect
   - Line wrapping behavior

3. **Terminal Rendering**
   - xterm.js configuration issue
   - Font metrics inconsistent
   - Character width calculations wrong

4. **Template System**
   - Variable substitution affecting width
   - Padding calculations incorrect
   - Fixed-width assumptions broken

## Impact

### User Experience
- **Severity**: Medium
- **Impact**: Visual polish and professionalism
- **Frequency**: Every screen with frames
- **User Perception**: "Looks broken" or "unfinished"

### Requirements
- **Requirement 13.2**: Box-drawing character rendering
  - Status: ⚠️ PARTIAL - Characters render but alignment is wrong
- **Requirement 13.1**: ANSI escape code interpretation
  - Status: ⚠️ PARTIAL - Colors work but positioning may be affected

## Recommended Approach

### Option 1: Programmatic Frame Validation (Recommended)
**Pros**: Catches issues automatically, prevents regressions  
**Cons**: Requires development effort

**Implementation**:
1. Create frame validation utility
2. Check frame dimensions match content
3. Verify all corners and edges align
4. Add to test suite

```typescript
interface FrameValidation {
  width: number;
  height: number;
  topLeftCorner: { x: number; y: number };
  topRightCorner: { x: number; y: number };
  bottomLeftCorner: { x: number; y: number };
  bottomRightCorner: { x: number; y: number };
  isAligned: boolean;
  issues: string[];
}

function validateANSIFrame(content: string): FrameValidation {
  // Parse ANSI content
  // Find box-drawing characters
  // Calculate positions
  // Verify alignment
  // Return validation result
}
```

### Option 2: Manual Visual Testing
**Pros**: Quick to implement  
**Cons**: Doesn't prevent regressions, time-consuming

**Implementation**:
1. Add "visual frame check" to test checklist
2. Capture screenshots for each screen
3. Manual review of alignment
4. Document issues found

### Option 3: Fixed-Width Frame System
**Pros**: Guarantees alignment  
**Cons**: Less flexible, may not fit all content

**Implementation**:
1. Define standard frame widths (e.g., 60, 70, 80 chars)
2. Pad/truncate content to fit
3. Use template system with fixed dimensions
4. Test across different terminal sizes

## Investigation Steps

### 1. Identify Root Cause
- [ ] Check ANSIRenderer template system
- [ ] Review variable substitution logic
- [ ] Examine padding calculations
- [ ] Test with different content lengths
- [ ] Check terminal width detection

### 2. Review Rendering Code
- [ ] Examine `server/src/ansi/ANSIRenderer.ts`
- [ ] Check `server/src/terminal/WebTerminalRenderer.ts`
- [ ] Review template files in `data/ansi/`
- [ ] Verify xterm.js configuration

### 3. Test Scenarios
- [ ] Welcome screen with different BBS names
- [ ] Goodbye message
- [ ] Menu screens
- [ ] Error messages with frames
- [ ] Different terminal widths (80, 132 columns)

### 4. Fix Implementation
- [ ] Implement frame width calculation
- [ ] Add padding normalization
- [ ] Update templates if needed
- [ ] Add validation tests
- [ ] Verify across all screens

## Proposed Solution Architecture

### Frame Builder Utility

```typescript
class ANSIFrameBuilder {
  private width: number;
  private padding: number = 2;
  
  constructor(width: number = 70) {
    this.width = width;
  }
  
  /**
   * Create a framed box with guaranteed alignment
   */
  createFrame(title: string, content: string[]): string {
    const innerWidth = this.width - 4; // Account for borders and padding
    
    // Top border
    const top = `┌${'─'.repeat(innerWidth)}┐`;
    
    // Title (centered)
    const titleLine = this.centerText(title, innerWidth);
    
    // Content lines (padded)
    const contentLines = content.map(line => 
      this.padLine(line, innerWidth)
    );
    
    // Bottom border
    const bottom = `└${'─'.repeat(innerWidth)}┘`;
    
    return [
      top,
      `│ ${titleLine} │`,
      `├${'─'.repeat(innerWidth)}┤`,
      ...contentLines.map(line => `│ ${line} │`),
      bottom
    ].join('\r\n');
  }
  
  private centerText(text: string, width: number): string {
    const stripped = this.stripANSI(text);
    const padding = Math.max(0, width - stripped.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }
  
  private padLine(text: string, width: number): string {
    const stripped = this.stripANSI(text);
    const padding = Math.max(0, width - stripped.length);
    return text + ' '.repeat(padding);
  }
  
  private stripANSI(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }
}
```

### Validation Utility

```typescript
class ANSIFrameValidator {
  /**
   * Validate that a frame is properly aligned
   */
  validate(frameContent: string): FrameValidation {
    const lines = frameContent.split(/\r?\n/);
    const issues: string[] = [];
    
    // Strip ANSI codes for width calculation
    const strippedLines = lines.map(line => 
      line.replace(/\x1b\[[0-9;]*m/g, '')
    );
    
    // Check all lines have same width
    const widths = strippedLines.map(line => line.length);
    const expectedWidth = widths[0];
    
    widths.forEach((width, index) => {
      if (width !== expectedWidth) {
        issues.push(`Line ${index} width mismatch: expected ${expectedWidth}, got ${width}`);
      }
    });
    
    // Check corners are present
    const firstLine = strippedLines[0];
    const lastLine = strippedLines[strippedLines.length - 1];
    
    if (!firstLine.startsWith('┌') || !firstLine.endsWith('┐')) {
      issues.push('Top border missing proper corners');
    }
    
    if (!lastLine.startsWith('└') || !lastLine.endsWith('┘')) {
      issues.push('Bottom border missing proper corners');
    }
    
    // Check vertical borders
    for (let i = 1; i < strippedLines.length - 1; i++) {
      const line = strippedLines[i];
      if (!line.startsWith('│') || !line.endsWith('│')) {
        issues.push(`Line ${i} missing vertical borders`);
      }
    }
    
    return {
      width: expectedWidth,
      height: lines.length,
      isAligned: issues.length === 0,
      issues,
      topLeftCorner: { x: 0, y: 0 },
      topRightCorner: { x: expectedWidth - 1, y: 0 },
      bottomLeftCorner: { x: 0, y: lines.length - 1 },
      bottomRightCorner: { x: expectedWidth - 1, y: lines.length - 1 },
    };
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('ANSIFrameBuilder', () => {
  it('should create frames with consistent width', () => {
    const builder = new ANSIFrameBuilder(70);
    const frame = builder.createFrame('Test', ['Line 1', 'Line 2']);
    const validator = new ANSIFrameValidator();
    const result = validator.validate(frame);
    expect(result.isAligned).toBe(true);
  });
  
  it('should handle ANSI color codes without affecting width', () => {
    const builder = new ANSIFrameBuilder(70);
    const frame = builder.createFrame(
      '\x1b[35mTest\x1b[0m',
      ['\x1b[32mLine 1\x1b[0m']
    );
    const validator = new ANSIFrameValidator();
    const result = validator.validate(frame);
    expect(result.isAligned).toBe(true);
  });
});
```

### Visual Regression Tests
- Capture screenshots of all framed screens
- Compare against baseline images
- Flag any alignment changes
- Manual review of flagged changes

## Priority and Timeline

### Priority: Medium
- Not blocking core functionality
- Affects user experience and polish
- Important for demo readiness

### Recommended Timeline
1. **Investigation**: 2-3 hours
2. **Fix Implementation**: 4-6 hours
3. **Testing**: 2-3 hours
4. **Total**: 1-2 days

### When to Address
- **Option A**: Before demo/release (recommended)
- **Option B**: As part of polish phase (Milestone 7)
- **Option C**: Create separate task for post-MVP

## Related Requirements

- **Requirement 13.1**: ANSI escape code interpretation
- **Requirement 13.2**: Box-drawing character rendering (CP437)
- **Requirement 13.3**: Color variant support
- **Requirement 1.2**: ANSI-formatted welcome screen

## Recommendation

**Create a new task** in the spec to address this systematically:

### Proposed Task: "Fix ANSI Frame Alignment"

**Subtasks**:
1. Investigate root cause of frame misalignment
2. Implement ANSIFrameBuilder utility with guaranteed alignment
3. Implement ANSIFrameValidator for automated testing
4. Update all screens to use new frame builder
5. Add visual regression tests
6. Verify alignment across all screens

**Priority**: Medium  
**Effort**: 1-2 days  
**Dependencies**: None  
**Milestone**: 7 (Polish & Demo Readiness)

## Conclusion

This is a legitimate quality issue that should be addressed before considering the system "demo-ready". While it doesn't block functionality, it significantly impacts the visual polish and professional appearance of the BBS.

**Recommended Action**: Create a new task in Milestone 7 to systematically fix frame alignment with proper validation to prevent regressions.

