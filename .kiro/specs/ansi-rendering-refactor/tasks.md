# Implementation Plan: ANSI Rendering Architecture Refactor

- [x] 1. Create core utility classes
- [x] 1.1 Implement ANSIWidthCalculator with visual width calculation
  - Strip ANSI escape codes using regex
  - Handle Unicode character width (most chars = 1, some emoji = 2)
  - Handle box-drawing characters (always 1)
  - _Requirements: 4.1, 4.2_

- [x] 1.2 Write property test for ANSIWidthCalculator
  - **Property 4: Visual width calculation strips ANSI codes**
  - **Validates: Requirements 4.1**

- [x] 1.3 Implement ANSIColorizer for color management
  - Provide colorize() method with named colors
  - Automatically add reset codes after colored text
  - Implement toHTML() for web context conversion
  - Implement strip() to remove all ANSI codes
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 1.4 Write property test for ANSIColorizer
  - **Property 3: Colorization preserves visual width**
  - **Validates: Requirements 3.4**
  - **Property 9: Colors include reset codes**
  - **Validates: Requirements 7.2**

- [x] 1.5 Implement ANSIValidator for output validation
  - Validate frame alignment (all lines same width)
  - Validate borders are intact
  - Provide detailed error messages
  - _Requirements: 9.1, 9.2_

- [x] 1.6 Write property test for ANSIValidator
  - **Property 12: Validation provides specific errors**
  - **Validates: Requirements 9.2**

- [x] 2. Refactor ANSIFrameBuilder
- [x] 2.1 Update ANSIFrameBuilder to return arrays of lines
  - Change build() to return string[] instead of joined string
  - Update buildWithTitle() similarly
  - Keep visual width calculation logic
  - _Requirements: 3.1, 3.3, 8.2_

- [x] 2.2 Write property test for frame alignment
  - **Property 1: Frame lines have uniform visual width**
  - **Validates: Requirements 3.1**

- [x] 2.3 Write property test for frame width limits
  - **Property 2: Frames fit within target width**
  - **Validates: Requirements 3.3**

- [x] 2.4 Update ANSIFrameBuilder to use ANSIWidthCalculator
  - Replace internal width calculation with ANSIWidthCalculator
  - Update padding logic to use visual width
  - _Requirements: 4.4_

- [x] 2.5 Write property test for padding
  - **Property 5: Padding produces exact width**
  - **Validates: Requirements 4.4**

- [x] 3. Create ANSIRenderingService
- [x] 3.1 Implement RenderContext types and constants
  - Define RenderContext interface
  - Create common context constants (TERMINAL_80, TELNET_80, WEB_80)
  - _Requirements: 2.1, 2.5_

- [x] 3.2 Implement line ending management
  - Create getLineEnding() method
  - Return LF for terminal/web, CRLF for telnet
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3.3 Write property test for line endings
  - **Property 7: Line endings match context**
  - **Validates: Requirements 6.1, 2.4**
  - **Property 8: No mixed line endings**
  - **Validates: Requirements 6.5**

- [x] 3.4 Implement renderFrame() method
  - Accept FrameOptions and RenderContext
  - Use ANSIFrameBuilder to build frame
  - Join lines with appropriate line ending
  - Optionally validate output
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 3.5 Write property test for context-specific rendering
  - **Property 13: Context-specific rendering succeeds**
  - **Validates: Requirements 2.1**

- [x] 3.6 Implement renderText() method
  - Apply colors using ANSIColorizer
  - Handle context-specific formatting
  - _Requirements: 7.1, 7.2_

- [x] 3.7 Write property test for color leakage
  - **Property 11: No color leakage between lines**
  - **Validates: Requirements 7.5**

- [x] 3.8 Implement renderTemplate() method
  - Load template definition
  - Substitute variables
  - Render using renderFrame()
  - Validate alignment is maintained
  - _Requirements: 5.1, 5.2_

- [x] 3.9 Write property test for template substitution
  - **Property 6: Template substitution maintains alignment**
  - **Validates: Requirements 5.2**

- [x] 4. Add web context support
- [x] 4.1 Implement web-specific rendering in ANSIRenderingService
  - Convert ANSI codes to HTML using ANSIColorizer.toHTML()
  - Ensure no raw ANSI codes in output
  - Use LF line endings
  - _Requirements: 2.3, 7.4_

- [x] 4.2 Write property test for web rendering
  - **Property 10: Web rendering has no ANSI codes**
  - **Validates: Requirements 2.3, 7.4**

- [x] 4.3 Update test-frames-visual.html to use new service
  - Remove ansiToHtml() function (use service instead)
  - Call ANSIRenderingService with WEB_80 context
  - Verify frames render correctly
  - _Requirements: 2.3_

- [x] 5. Add terminal width enforcement
- [x] 5.1 Implement width checking in ANSIRenderingService
  - Check all lines fit within context width
  - Throw WidthExceededError if any line is too wide
  - _Requirements: 2.2, 3.3_

- [x] 5.2 Write property test for terminal width
  - **Property 14: Terminal rendering prevents wrapping**
  - **Validates: Requirements 2.2**

- [x] 6. Migrate ANSIRenderer to use new service
- [x] 6.1 Update ANSIRenderer.renderWelcomeScreen()
  - Use ANSIRenderingService.renderFrame() instead of direct frame building
  - Pass appropriate RenderContext
  - Keep existing API intact
  - _Requirements: 1.1, 1.2_

- [x] 6.2 Update ANSIRenderer.renderGoodbyeScreen()
  - Use ANSIRenderingService.renderFrame() instead of direct frame building
  - Pass appropriate RenderContext
  - Keep existing API intact
  - _Requirements: 1.1, 1.2_

- [x] 6.3 Update ANSIRenderer.render() to accept context parameter
  - Add optional context parameter (default to TERMINAL_80)
  - Pass context through to rendering service
  - _Requirements: 2.1, 2.5_

- [x] 7. Update tests and validation
- [x] 7.1 Update existing ANSIRenderer tests
  - Ensure tests still pass with new implementation
  - Add tests for context parameter
  - _Requirements: 9.3_

- [x] 7.2 Update ANSIFrameBuilder tests
  - Update tests to expect string[] instead of string
  - Add tests for new width calculator integration
  - _Requirements: 9.3_

- [x] 7.3 Run visual verification script
  - Execute verify-ansi-rendering.ts
  - Verify welcome and goodbye screens render correctly
  - Check all variable combinations work
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Update browser demo
- [x] 8.1 Fix test-frames-visual.html rendering
  - Use ANSIRenderingService with WEB_80 context
  - Verify frames display with proper colors
  - Verify no ANSI codes visible as text
  - Verify perfect alignment
  - _Requirements: 2.3, 3.1_

- [x] 8.2 Test in actual browser using MCP Chrome DevTools
  - Open test-frames-visual.html
  - Take screenshot
  - Verify welcome screen shows yellow/magenta colors
  - Verify goodbye screen shows cyan colors
  - Verify no alignment issues
  - _Requirements: 2.3, 3.1_

- [x] 9. Final validation and cleanup
- [x] 9.1 Run all property-based tests
  - Ensure all 15 properties pass with 100+ iterations
  - Fix any failures
  - _Requirements: All_

- [x] 9.2 Run integration tests
  - Test welcome/goodbye screen rendering
  - Test all three contexts (terminal, telnet, web)
  - Test variable substitution
  - _Requirements: All_

- [x] 9.3 Update documentation
  - Document ANSIRenderingService API
  - Add usage examples
  - Document migration guide
  - _Requirements: 10.3_

- [x] 9.4 Clean up temporary test files
  - Remove test-render.ts if no longer needed
  - Remove any debug scripts
  - Keep verify-ansi-rendering.ts for future use
  - _Requirements: 10.5_
