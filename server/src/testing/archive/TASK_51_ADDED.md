# Task 51: Fix ANSI Frame Alignment - ADDED TO MILESTONE 7

**Date**: December 3, 2025  
**Status**: ✅ TASK CREATED  
**Priority**: Medium (Important for demo readiness)

## Summary

Added new task to Milestone 7 to systematically fix ANSI frame alignment issues discovered during Task 39 testing.

## Task Details

### Task 51: Fix ANSI frame alignment issues

**Subtasks**:

1. **51.1 Investigate frame alignment root cause**
   - Review ANSIRenderer template system
   - Examine variable substitution logic
   - Check padding calculations
   - Test with different content lengths
   - Verify terminal width detection
   - Document findings

2. **51.2 Implement ANSIFrameBuilder utility**
   - Create utility class for guaranteed frame alignment
   - Implement width calculation that accounts for ANSI codes
   - Add padding normalization
   - Support centering and left-alignment
   - Handle variable content lengths
   - Test with different frame widths

3. **51.3 Implement ANSIFrameValidator for testing**
   - Create validation utility to check frame alignment
   - Verify all corners are present and aligned
   - Check consistent width across all lines
   - Validate vertical borders are aligned
   - Add to test suite

4. **51.4 Update all screens to use ANSIFrameBuilder**
   - Update welcome screen
   - Update goodbye screen
   - Update menu screens
   - Update error message frames
   - Update door game frames
   - Verify alignment across all screens

5. **51.5 Add visual regression tests**
   - Capture baseline screenshots of all framed screens
   - Add automated frame validation to test suite
   - Test with different terminal widths (80, 132 columns)
   - Verify no regressions in alignment

## Requirements Validated

- **Requirement 13.1**: ANSI escape code interpretation
- **Requirement 13.2**: Box-drawing character rendering (CP437)

## Estimated Effort

- **Investigation**: 2-3 hours
- **Implementation**: 4-6 hours
- **Testing**: 2-3 hours
- **Updates**: 2-3 hours
- **Total**: 10-15 hours (1-2 days)

## Priority Justification

**Medium Priority** because:
- ✅ Important for visual polish and professionalism
- ✅ Affects user perception of quality
- ✅ Required for demo readiness
- ❌ Not blocking core functionality
- ❌ Not a security or data integrity issue

## Dependencies

- None - can be implemented independently
- Should be completed before Task 52 (Final checkpoint)

## Success Criteria

1. ✅ All ANSI frames have consistent width
2. ✅ Right and left borders are vertically aligned
3. ✅ Corners form perfect rectangles
4. ✅ No visual gaps or overlaps
5. ✅ Automated tests prevent regressions
6. ✅ Works across different terminal widths

## Related Documentation

- **Issue Analysis**: `server/src/testing/ANSI_FRAME_ALIGNMENT_ISSUE.md`
- **Task 39 Results**: `server/src/testing/TASK_39_RESULTS.md`
- **Visual Evidence**: Screenshots from Task 39 testing

## Implementation Notes

### Key Considerations

1. **ANSI Code Handling**
   - Must strip ANSI codes when calculating width
   - Preserve ANSI codes in output
   - Don't count escape sequences as characters

2. **Padding Strategy**
   - Calculate actual display width (excluding ANSI)
   - Add padding to reach target width
   - Ensure consistent padding on all lines

3. **Template System**
   - May need to update template files
   - Variable substitution must preserve alignment
   - Consider fixed-width templates

4. **Testing Strategy**
   - Unit tests for frame builder
   - Visual regression tests for screens
   - Test with various content lengths
   - Test with different terminal widths

### Proposed Architecture

```typescript
// Frame Builder
class ANSIFrameBuilder {
  constructor(width: number = 70);
  createFrame(title: string, content: string[]): string;
  private centerText(text: string, width: number): string;
  private padLine(text: string, width: number): string;
  private stripANSI(text: string): string;
}

// Frame Validator
class ANSIFrameValidator {
  validate(frameContent: string): FrameValidation;
}

interface FrameValidation {
  width: number;
  height: number;
  isAligned: boolean;
  issues: string[];
  corners: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}
```

## Impact on Milestone 7

### Before Task 51
- User testing complete
- Functional requirements validated
- Visual issues documented

### After Task 51
- ✅ Professional visual appearance
- ✅ Consistent frame alignment
- ✅ Automated validation
- ✅ Demo-ready polish

## Next Steps

1. Complete remaining user testing tasks (40-50)
2. Implement Task 51 during polish phase
3. Verify all frames are aligned
4. Proceed to final checkpoint (Task 52)

## Conclusion

Task 51 has been successfully added to Milestone 7. This ensures the ANSI frame alignment issue will be systematically addressed with proper investigation, implementation, and testing before the system is considered demo-ready.

The task is well-scoped, has clear success criteria, and includes automated testing to prevent regressions. It's appropriately prioritized as "Medium" since it affects visual quality but doesn't block core functionality.

