# Task 53.1: ANSI Frame Alignment Investigation Report

**Date**: December 4, 2025  
**Task**: 53.1 Investigate frame alignment root cause  
**Status**: ✅ COMPLETE

## Executive Summary

The ANSI frame alignment issue has been identified. The root cause is **inconsistent line widths** in the ANSI template files. Lines within the same frame have different visual character counts, causing the right borders to appear misaligned.

## Root Cause Analysis

### Issue 1: welcome.ans - Severe Width Inconsistency

**Width Range**: 78-100 characters (22 character difference)

**Problem Lines**:
- **Line 20** (status line with variables): 100 characters
  ```
  ║  Node {{node}} of {{max_nodes}}  │  {{caller_count}} callers today  │  Running BaudAgain v0.1    ║
  ```
  This line is significantly longer than the frame borders (80 chars)

- **Line 18** (tagline): 78 characters
  ```
  ║         "Where the spirits of the old 'net still whisper..."               ║
  ```
  This line is 2 characters shorter than the frame borders

- **Most lines**: 79-80 characters (inconsistent by 1 character)

**Impact**: The welcome screen frame appears severely broken with right borders at different horizontal positions.

### Issue 2: goodbye.ans - Minor Width Inconsistency

**Width Range**: 59-61 characters (2 character difference)

**Problem Lines**:
- **Border lines**: 61 characters (correct)
- **Empty lines**: 61 characters (correct)
- **Content lines**: 59-60 characters (1-2 characters short)
  - Line 4: 59 characters (emoji line)
  - Lines 8, 10, 11, 13: 60 characters (text content)

**Impact**: The goodbye screen frame has minor misalignment, less noticeable but still incorrect.

## Technical Analysis

### Variable Substitution Issue

The template system uses `{{variable}}` placeholders that get replaced at runtime:
```
{{node}} → "1" (1 char) or "10" (2 chars)
{{max_nodes}} → "4" (1 char) or "100" (3 chars)
{{caller_count}} → "0" (1 char) or "999" (3 chars)
```

**Problem**: The template line is designed for maximum-length values, making it too long when shorter values are substituted.

### Padding Calculation Issue

The current ANSIRenderer does NOT:
- Calculate visual width (excluding ANSI codes)
- Normalize padding to ensure consistent width
- Account for variable-length substitutions
- Validate frame alignment

### Terminal Width Detection

The templates assume:
- **welcome.ans**: 80-column terminal
- **goodbye.ans**: 61-column frame (centered in 80-column terminal)

However, the actual content doesn't match these assumptions.

## Code Review Findings

### ANSIRenderer.ts

**Current Implementation**:
```typescript
private substituteVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}
```

**Issues**:
1. No width calculation after substitution
2. No padding adjustment
3. No validation of frame alignment

### BaseTerminalRenderer.ts

**Current Implementation**:
```typescript
protected centerText(text: string, width: number): string {
  const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, Math.floor((width - visibleLength) / 2));
  return ' '.repeat(padding) + text + ' '.repeat(width - padding - visibleLength);
}

protected padRight(text: string, width: number): string {
  const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, width - visibleLength);
  return text + ' '.repeat(padding);
}
```

**Good**: These methods correctly strip ANSI codes for width calculation  
**Problem**: They're not used by the template system

## Test Results

### Analysis Script Output

```
=== welcome.ans ===
Width range: 78 - 100 characters
⚠️  INCONSISTENT WIDTH: 22 character difference

=== goodbye.ans ===
Width range: 59 - 61 characters
⚠️  INCONSISTENT WIDTH: 2 character difference
```

### Visual Inspection

Screenshots from Task 40-47 testing show:
- Welcome screen: Right borders clearly misaligned
- Goodbye screen: Subtle misalignment
- Menu screens: Generated programmatically, appear correct
- Error frames: Not tested yet

## Recommended Solutions

### Solution 1: Fix Template Files (Quick Fix)

**Approach**: Manually adjust template files to have consistent width

**Pros**:
- Quick to implement
- No code changes needed
- Works for static content

**Cons**:
- Doesn't fix variable substitution issue
- Manual process, error-prone
- Doesn't prevent future issues

**Effort**: 1-2 hours

### Solution 2: Implement ANSIFrameBuilder (Recommended)

**Approach**: Create utility class that guarantees frame alignment

**Features**:
- Calculate visual width (strip ANSI codes)
- Normalize padding for all lines
- Handle variable-length content
- Support centering and left-alignment
- Validate frame structure

**Pros**:
- Guarantees alignment
- Reusable for all frames
- Handles dynamic content
- Prevents future issues

**Cons**:
- Requires code changes
- Need to update all frame generation

**Effort**: 4-6 hours

### Solution 3: Hybrid Approach (Best)

**Approach**: Implement ANSIFrameBuilder + fix existing templates

**Steps**:
1. Create ANSIFrameBuilder utility
2. Create ANSIFrameValidator for testing
3. Fix existing template files
4. Update renderers to use new utilities
5. Add validation tests

**Pros**:
- Fixes immediate issues
- Provides long-term solution
- Comprehensive testing

**Cons**:
- Most effort required

**Effort**: 6-8 hours

## Recommendations

### Immediate Actions

1. **Implement ANSIFrameBuilder** (Task 53.2)
   - Create utility class with width calculation
   - Support variable content lengths
   - Handle ANSI codes correctly

2. **Implement ANSIFrameValidator** (Task 53.3)
   - Create validation utility
   - Add to test suite
   - Prevent regressions

3. **Update Templates** (Task 53.4)
   - Fix welcome.ans (priority: high)
   - Fix goodbye.ans (priority: medium)
   - Update all other frames

4. **Add Visual Tests** (Task 53.5)
   - Capture baseline screenshots
   - Automated validation
   - Test different terminal widths

### Priority

**High Priority**:
- welcome.ans (22 char difference, very visible)
- ANSIFrameBuilder implementation

**Medium Priority**:
- goodbye.ans (2 char difference, less visible)
- ANSIFrameValidator implementation

**Low Priority**:
- Visual regression tests
- Documentation updates

## Conclusion

The ANSI frame alignment issue is caused by **inconsistent line widths** in template files, particularly in welcome.ans where variable substitution creates lines that are 22 characters longer than the frame borders.

The recommended solution is to implement **ANSIFrameBuilder** utility that:
1. Calculates visual width correctly (excluding ANSI codes)
2. Normalizes padding to ensure consistent width
3. Handles variable-length content dynamically
4. Validates frame structure

This will fix the immediate issue and prevent future alignment problems.

## Next Steps

Proceed to **Task 53.2**: Implement ANSIFrameBuilder utility

---

**Investigation Complete**: ✅  
**Root Cause Identified**: ✅  
**Solution Recommended**: ✅  
**Ready for Implementation**: ✅
