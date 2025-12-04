# ANSI Rendering Architecture Refactor

## Problem Statement

The BaudAgain BBS has persistent ANSI frame rendering issues where frames appear misaligned in terminals and web browsers. The root cause is architectural - we lack a centralized, reliable mechanism for rendering ANSI content.

## Solution

Create a centralized ANSI rendering architecture with:

1. **ANSIRenderingService** - Single source of truth for all ANSI rendering
2. **Context-aware rendering** - Different output for terminal, telnet, and web
3. **Guaranteed alignment** - Property-based tests ensure frames are always aligned
4. **Simple API** - Easy to use and migrate existing code

## Key Components

- **ANSIRenderingService**: Main service coordinating all rendering
- **ANSIWidthCalculator**: Accurate visual width calculation
- **ANSIColorizer**: Color management and HTML conversion
- **ANSIValidator**: Output validation with detailed errors
- **ANSIFrameBuilder**: Frame construction (refactored)

## Correctness Properties

15 properties tested with 100+ iterations each:

1. Frame lines have uniform visual width
2. Frames fit within target width
3. Colorization preserves visual width
4. Visual width calculation strips ANSI codes
5. Padding produces exact width
6. Template substitution maintains alignment
7. Line endings match context
8. No mixed line endings
9. Colors include reset codes
10. Web rendering has no ANSI codes
11. No color leakage between lines
12. Validation provides specific errors
13. Context-specific rendering succeeds
14. Terminal rendering prevents wrapping
15. Unicode width calculation

## Implementation Approach

1. Create new utility classes (no breaking changes)
2. Refactor ANSIFrameBuilder to return arrays
3. Implement ANSIRenderingService
4. Add web context support
5. Migrate ANSIRenderer to use new service
6. Update tests and validation
7. Fix browser demo
8. Final validation and cleanup

## Success Criteria

- ✅ All 15 properties pass with 100+ test iterations
- ✅ Welcome/goodbye screens render perfectly in browser
- ✅ No line wrapping in 80-column terminal
- ✅ Migration completed with no regressions
- ✅ Simpler, more maintainable code

## Files

- `requirements.md` - Detailed requirements with acceptance criteria
- `design.md` - Architecture, components, and correctness properties
- `tasks.md` - Step-by-step implementation plan
- `README.md` - This file

## Getting Started

To begin implementation:

1. Review the requirements document
2. Study the design document
3. Follow the tasks in order
4. Run property tests after each component
5. Validate with browser demo at the end

## Timeline Estimate

- Core utilities: 2-3 hours
- ANSIRenderingService: 2-3 hours
- Migration and testing: 2-3 hours
- **Total: 6-9 hours for complete implementation**

This is suitable for MVP delivery before the hackathon deadline.
