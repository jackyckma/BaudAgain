# Implementation Plan

- [x] 1. Fix welcome screen rendering issues
- [x] 1.1 Investigate and fix duplicate welcome screen/prompt issue
  - Review server/src/index.ts WebSocket connection handler
  - Ensure welcome screen and prompt sent only once
  - Check for duplicate sends in AuthHandler
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Fix welcome screen frame alignment
  - Update BaseTerminalRenderer.renderWelcomeScreen to ensure proper border alignment
  - Verify frame width calculations
  - Test with various content lengths
  - _Requirements: 1.4, 1.5_

- [x] 2. Implement 80-character width enforcement
- [x] 2.1 Add width validation to ANSIFrameBuilder
  - Add max width parameter to FrameOptions
  - Implement width checking before returning frames
  - Throw error or truncate when width exceeded
  - _Requirements: 1.3, 12.1_

- [x] 2.2 Update ANSIRenderingService to enforce width limits
  - Ensure all render methods validate width
  - Add width enforcement to renderFrame and renderFrameWithTitle
  - Update error handling for width violations
  - _Requirements: 12.1, 12.2_

- [x] 2.3 Modify BaseTerminalRenderer to respect width limits
  - Update hard-coded box width from 62 to configurable value
  - Ensure all rendering methods respect TERMINAL_WIDTH constant
  - Add width enforcement to renderWelcomeScreen, renderMenu, etc.
  - _Requirements: 1.3, 12.3_

- [x] 2.4 Write property test for width enforcement
  - **Property 1: 80-character width enforcement**
  - **Validates: Requirements 1.3, 7.3, 12.1**

- [x] 2.5 Write property test for width enforcement preserving formatting
  - **Property 5: Width enforcement preserves formatting**
  - **Validates: Requirements 12.2, 12.5**

- [x] 3. Fix message author display bugs
- [x] 3.1 Investigate message author "undefined" issue
  - Review MessageRepository.getMessages query
  - Check user join and authorHandle population
  - Test with various message scenarios (active users, deleted users)
  - _Requirements: 4.5, 5.5_

- [x] 3.2 Fix MessageHandler to display author handles correctly
  - Update showMessageList to handle missing author handles
  - Update readMessage to handle missing author handles
  - Add fallback display for deleted/unknown users ("Unknown" instead of "undefined")
  - _Requirements: 4.4, 4.5, 5.2, 5.5_

- [x] 3.3 Ensure posted messages save author handle correctly
  - Review MessageHandler.handlePostingFlow
  - Verify userId is passed correctly to messageService.postMessage
  - Ensure MessageRepository.createMessage populates author correctly
  - _Requirements: 6.4_

- [x] 3.4 Write property test for author handle correctness
  - **Property 2: Author handle correctness**
  - **Validates: Requirements 4.5, 5.5**

- [x] 3.5 Write property test for posted message author correctness
  - **Property 3: Posted message author correctness**
  - **Validates: Requirements 6.4**

- [x] 4. Integrate AI conversation starters into message bases
- [x] 4.1 Add conversation starter display to MessageHandler
  - Update showMessageList to include conversation starters section
  - Add command to view/select conversation starters
  - Implement caching for generated starters
  - _Requirements: 8.1, 8.5_

- [x] 4.2 Implement conversation starter selection flow
  - Add handler for selecting a conversation starter
  - Pre-fill message subject with selected starter
  - Initiate posting flow with starter as subject
  - _Requirements: 8.3_

- [x] 4.3 Handle edge cases for conversation starters
  - Display helpful message when no starters available
  - Handle AI service errors gracefully
  - Add timeout for starter generation
  - _Requirements: 8.4_

- [x] 5. Improve "catch me up" summary integration
- [x] 5.1 Add "catch me up" command to message base menu
  - Update showMessageList to show "C" option for catch-me-up
  - Add command handler for "C" or "CATCHUP"
  - _Requirements: 9.1_

- [x] 5.2 Implement catch-me-up summary display
  - Generate summary of unread messages
  - Format summary within frame boundaries
  - Handle edge case when no unread messages
  - _Requirements: 9.2, 9.4, 9.5_

- [x] 6. Enhance daily digest on login
- [x] 6.1 Improve daily digest display in AuthHandler
  - Ensure digest shows on login when available
  - Format digest content properly
  - Add option to skip digest and go to menu
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 7. Fix door game ANSI rendering
- [x] 7.1 Add width enforcement to DoorHandler
  - Intercept door game output before sending to client
  - Apply width enforcement to all door output
  - Ensure frames in doors respect 80-character limit
  - _Requirements: 7.3, 7.5_

- [x] 7.2 Update door games to use ANSIRenderingService
  - Modify existing door games to use rendering service
  - Ensure all ANSI art goes through width validation
  - Test with Art Studio door game
  - _Requirements: 7.2, 7.4_

- [x] 7.3 Write property test for frame border alignment
  - **Property 4: Frame border alignment**
  - **Validates: Requirements 7.5, 12.3**

- [x] 8. Create MCP-based browser test suite
- [x] 8.1 Set up MCP test infrastructure
  - Create test helper functions for MCP interactions
  - Set up test data (users, messages, message bases)
  - Configure browser automation
  - _Requirements: 11.1_

- [x] 8.2 Write welcome screen and registration tests
  - Test welcome screen displays correctly
  - Test registration flow creates account
  - Verify single frame and single prompt
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8.3 Write login and navigation tests
  - Test login flow authenticates user
  - Test main menu displays after login
  - Test navigation to messages, doors
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 8.4 Write message functionality tests
  - Test message base listing
  - Test message list shows author handles (not "undefined")
  - Test message reading displays full content
  - Test message posting saves with correct author
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8.5 Write door game tests
  - Test door game listing
  - Test door game launching
  - Test ANSI rendering within 80 characters
  - Test frame alignment in doors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.6 Write AI feature tests
  - Test conversation starters display in message bases
  - Test conversation starter selection
  - Test "catch me up" summary generation
  - Test daily digest on login
  - _Requirements: 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 9.4, 9.5, 10.1, 10.2, 10.3, 10.5_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create comprehensive test documentation
- [x] 10.1 Document MCP test execution
  - Create guide for running MCP browser tests
  - Document test data setup
  - Add troubleshooting section
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10.2 Document manual testing procedures
  - Create manual testing checklist
  - Document expected behaviors
  - Add screenshots/examples
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Final checkpoint - Verify complete user journey
  - Ensure all tests pass, ask the user if questions arise.
