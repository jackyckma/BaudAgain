# Design Document

## Overview

This design addresses critical bugs in the BaudAgain BBS system and integrates newly developed AI features into the user experience. The system currently has several broken user journeys including welcome screen rendering, message viewing, ANSI art display, and missing AI feature integration.

The design focuses on:
1. Fixing ANSI frame rendering issues causing broken welcome screens
2. Resolving message author display bugs ("undefined" author)
3. Enforcing 80-character line width limits for all ANSI content
4. Integrating AI features (conversation starters, summaries, digests) into terminal handlers
5. Creating comprehensive MCP-based browser tests for the complete user journey

## Architecture

### Current Architecture

The BaudAgain BBS follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                        │
│                  (xterm.js terminal)                     │
└─────────────────────────────────────────────────────────┘
                          │
                    WebSocket (/ws)
                          │
┌─────────────────────────────────────────────────────────┐
│                  Connection Layer                        │
│  WebSocketConnection → ConnectionManager                 │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   Session Layer                          │
│              SessionManager → Session                    │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    BBS Core                              │
│         Command Router → Handler Selection               │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│ AuthHandler  │  │MessageHandler│  │ DoorHandler │
└──────────────┘  └──────────────┘  └─────────────┘
        │                 │                 │
┌───────▼──────────────────▼─────────────────▼───────┐
│              Rendering Layer                        │
│  BaseTerminalRenderer → WebTerminalRenderer         │
│  ANSIFrameBuilder → ANSIRenderingService            │
└─────────────────────────────────────────────────────┘
```

### Problem Areas Identified

1. **Welcome Screen Rendering**
   - Multiple welcome frames being sent
   - Duplicate prompts appearing
   - Frame borders not aligned properly
   - Issue: Welcome screen sent in index.ts, but may be sent again by handlers

2. **Message Author Display**
   - Messages showing "by undefined" instead of author handle
   - Issue: MessageRepository joins with users table but authorHandle may not be populated correctly
   - MessageHandler displays `msg.authorHandle` which can be undefined

3. **ANSI Rendering Width**
   - No enforcement of 80-character line width
   - ANSI art in door games exceeds terminal width
   - Frames can be wider than 80 characters
   - Issue: ANSIFrameBuilder and ANSIRenderingService don't enforce max width consistently

4. **AI Features Not Integrated**
   - Conversation starters, summaries, and digests exist as services
   - Not accessible from terminal interface
   - MessageHandler has placeholder code but not fully wired
   - No menu options or commands to access these features

## Components and Interfaces

### 1. ANSI Rendering Components

**ANSIFrameBuilder** (server/src/ansi/ANSIFrameBuilder.ts)
- Builds frames with borders
- Currently doesn't enforce maximum width
- Needs width validation before returning frames

**ANSIRenderingService** (server/src/ansi/ANSIRenderingService.ts)
- High-level rendering service
- Has width validation but may not be used consistently
- Needs to enforce 80-character limit on all output

**BaseTerminalRenderer** (server/src/terminal/BaseTerminalRenderer.ts)
- Renders structured content (welcome, menu, messages)
- Hard-coded box width of 62 characters
- Needs to respect configurable width limits

### 2. Handler Components

**AuthHandler** (server/src/handlers/AuthHandler.ts)
- Handles registration and login
- Sends welcome/greeting messages
- Currently working correctly

**MessageHandler** (server/src/handlers/MessageHandler.ts)
- Handles message base navigation
- Has bugs in author display
- Has placeholder code for AI features (summarization)
- Needs integration of conversation starters

**DoorHandler** (server/src/handlers/DoorHandler.ts)
- Handles door game lifecycle
- Door games may render ANSI art that exceeds width
- Needs width enforcement

### 3. Repository Components

**MessageRepository** (server/src/db/repositories/MessageRepository.ts)
- Joins messages with users table
- Returns `authorHandle` field
- Query appears correct, issue may be in data or display

**UserRepository** (server/src/db/repositories/UserRepository.ts)
- Manages user data
- Provides handle lookup
- Working correctly

### 4. AI Service Components

**ConversationStarter** (server/src/services/ConversationStarter.ts)
- Generates conversation starter questions
- Not integrated into MessageHandler

**MessageSummarizer** (server/src/services/MessageSummarizer.ts)
- Summarizes message threads
- Partially integrated (summarize command exists)
- Needs better UI integration

**DailyDigestService** (server/src/services/DailyDigestService.ts)
- Generates daily activity digests
- Shown on login in AuthHandler
- Working correctly

## Data Models

### Session Data Structure
```typescript
interface Session {
  id: string;
  connectionId: string;
  state: SessionState;
  userId?: string;
  handle?: string;
  currentMenu?: string;
  data: {
    auth?: AuthFlowState;
    message?: MessageFlowState;
    door?: DoorFlowState;
  };
  lastActivity: Date;
}
```

### Message Flow State
```typescript
interface MessageFlowState {
  showingBaseList?: boolean;
  inMessageBase?: boolean;
  currentBaseId?: string;
  readingMessage?: boolean;
  currentMessageId?: string;
  postingMessage?: boolean;
  postStep?: 'subject' | 'body';
  draftSubject?: string;
  viewingSummary?: boolean;
  confirmingSummary?: boolean;
  viewingStarters?: boolean;  // NEW: for conversation starters
}
```

### Message Model
```typescript
interface Message {
  id: string;
  baseId: string;
  parentId?: string;
  userId: string;
  subject: string;
  body: string;
  createdAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
  aiModerationFlag?: string;
  authorHandle?: string;  // Joined from users table
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Before defining correctness properties, let's identify and eliminate redundancy:

**Redundant Properties Identified:**
1. Properties 1.3, 7.3, and 12.1 all test 80-character width enforcement - can be combined into one comprehensive property
2. Properties 4.5 and 5.5 both test that author handle is not "undefined" - can be combined
3. Properties 7.5 and 12.3 both test frame border alignment - can be combined
4. Properties 12.2 and 12.5 both test width enforcement behavior - can be combined

**Consolidated Properties:**
- Single property for 80-character width enforcement across all ANSI content
- Single property for author handle correctness across all messages
- Single property for frame border alignment across all frames
- Single property for width enforcement maintaining formatting

### Correctness Properties

Property 1: 80-character width enforcement
*For any* ANSI content rendered by the Terminal Client (welcome screens, menus, messages, door games, frames), all lines should have a visual width of 80 characters or less
**Validates: Requirements 1.3, 7.3, 12.1**

Property 2: Author handle correctness
*For any* message displayed in the Terminal Client, the author handle field should contain the actual username and never be "undefined" or null
**Validates: Requirements 4.5, 5.5**

Property 3: Posted message author correctness
*For any* message posted by a user, the saved message should have the author handle set to the posting user's handle
**Validates: Requirements 6.4**

Property 4: Frame border alignment
*For any* frame rendered by the Terminal Client, all border characters (top, bottom, left, right) should be properly aligned with consistent width
**Validates: Requirements 7.5, 12.3**

Property 5: Width enforcement preserves formatting
*For any* content that undergoes width enforcement (truncation or wrapping), the resulting output should maintain proper alignment and not have broken ANSI codes
**Validates: Requirements 12.2, 12.5**

## Error Handling

### ANSI Rendering Errors

**Width Exceeded Error**
- When: Content exceeds 80-character limit
- Action: Truncate or wrap content, log warning
- User Impact: Content may be shortened but remains readable

**Frame Validation Error**
- When: Frame borders don't align properly
- Action: Rebuild frame with correct dimensions, log error
- User Impact: Frame may be regenerated, slight delay

**ANSI Code Corruption**
- When: ANSI escape codes are malformed or incomplete
- Action: Strip invalid codes, render as plain text
- User Impact: May lose color formatting but content remains

### Message Display Errors

**Missing Author Handle**
- When: Message has no associated user or handle is null
- Action: Display "Unknown" or "Deleted User" instead of undefined
- User Impact: Clear indication that author is unavailable

**Message Not Found**
- When: User tries to read a deleted or non-existent message
- Action: Display error message, return to message list
- User Impact: Clear error message, graceful fallback

### AI Feature Errors

**AI Service Unavailable**
- When: AI service (OpenAI) is down or rate limited
- Action: Display fallback message, disable AI features temporarily
- User Impact: Can still use BBS without AI features

**Conversation Starter Generation Failed**
- When: AI fails to generate conversation starters
- Action: Hide conversation starter section, log error
- User Impact: Feature not available but doesn't block other functionality

**Summary Generation Timeout**
- When: AI summary takes too long to generate
- Action: Cancel request after 30 seconds, show timeout message
- User Impact: Can retry or skip summary

### Connection Errors

**WebSocket Disconnection**
- When: Network connection is lost
- Action: Clean up session, allow reconnection
- User Impact: Must reconnect and re-authenticate

**Session Timeout**
- When: User inactive for extended period
- Action: Clean up session, require re-authentication
- User Impact: Must log in again

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**ANSI Rendering Tests**
- Test welcome screen renders with single frame
- Test frame borders align correctly
- Test 80-character width enforcement
- Test ANSI code handling (colors, formatting)
- Test width truncation and wrapping

**Message Handler Tests**
- Test message list displays author handles
- Test message reading shows all fields
- Test message posting saves author correctly
- Test conversation starter integration
- Test summary generation integration

**Door Handler Tests**
- Test door game ANSI rendering
- Test width enforcement in door games
- Test frame rendering in doors

**Repository Tests**
- Test message query joins with users table
- Test author handle is populated
- Test handling of deleted users

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property testing library):

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Random seed for reproducibility
- Shrinking enabled for minimal failing examples

**Property 1: 80-character width enforcement**
```typescript
// Feature: user-journey-testing-and-fixes, Property 1: 80-character width enforcement
fc.assert(
  fc.property(
    fc.array(fc.string()),  // Generate random content lines
    (contentLines) => {
      const rendered = renderANSIContent(contentLines);
      const lines = rendered.split('\n');
      return lines.every(line => 
        ANSIWidthCalculator.calculate(line) <= 80
      );
    }
  ),
  { numRuns: 100 }
);
```

**Property 2: Author handle correctness**
```typescript
// Feature: user-journey-testing-and-fixes, Property 2: Author handle correctness
fc.assert(
  fc.property(
    fc.record({
      userId: fc.uuid(),
      handle: fc.string({ minLength: 3, maxLength: 20 }),
      subject: fc.string(),
      body: fc.string()
    }),
    async (messageData) => {
      // Create user and message
      const user = await createUser(messageData.handle);
      const message = await createMessage({
        userId: user.id,
        subject: messageData.subject,
        body: messageData.body
      });
      
      // Retrieve and check
      const retrieved = await getMessage(message.id);
      return retrieved.authorHandle !== undefined && 
             retrieved.authorHandle !== null &&
             retrieved.authorHandle === messageData.handle;
    }
  ),
  { numRuns: 100 }
);
```

**Property 3: Posted message author correctness**
```typescript
// Feature: user-journey-testing-and-fixes, Property 3: Posted message author correctness
fc.assert(
  fc.property(
    fc.record({
      handle: fc.string({ minLength: 3, maxLength: 20 }),
      subject: fc.string(),
      body: fc.string()
    }),
    async (postData) => {
      const user = await createUser(postData.handle);
      const session = createSession(user.id, user.handle);
      
      // Post message through handler
      await messageHandler.handle(`POST`, session);
      await messageHandler.handle(postData.subject, session);
      await messageHandler.handle(postData.body, session);
      
      // Verify posted message has correct author
      const messages = await getMessages();
      const posted = messages.find(m => m.subject === postData.subject);
      
      return posted && posted.authorHandle === postData.handle;
    }
  ),
  { numRuns: 100 }
);
```

**Property 4: Frame border alignment**
```typescript
// Feature: user-journey-testing-and-fixes, Property 4: Frame border alignment
fc.assert(
  fc.property(
    fc.array(fc.string()),  // Generate random frame content
    (contentLines) => {
      const frame = buildFrame(contentLines);
      const validation = ANSIFrameBuilder.validate(frame);
      return validation.valid && validation.issues.length === 0;
    }
  ),
  { numRuns: 100 }
);
```

**Property 5: Width enforcement preserves formatting**
```typescript
// Feature: user-journey-testing-and-fixes, Property 5: Width enforcement preserves formatting
fc.assert(
  fc.property(
    fc.string({ minLength: 100 }),  // Generate long strings
    (longContent) => {
      const enforced = enforceWidth(longContent, 80);
      const lines = enforced.split('\n');
      
      // Check all lines are within width
      const widthOk = lines.every(line => 
        ANSIWidthCalculator.calculate(line) <= 80
      );
      
      // Check no broken ANSI codes (no incomplete escape sequences)
      const noBrokenCodes = !enforced.match(/\x1b\[[0-9;]*$/);
      
      return widthOk && noBrokenCodes;
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing (MCP-Based Browser Tests)

Integration tests will use MCP (Model Context Protocol) Chrome DevTools to test the complete user journey in a real browser:

**Test Scenarios:**
1. Welcome screen display and registration flow
2. Login flow and main menu navigation
3. Message base browsing and message reading
4. Message posting with author verification
5. Door game launching and ANSI rendering
6. AI feature access (conversation starters, summaries, digests)

**MCP Test Approach:**
- Use `mcp_chrome_devtools_navigate_page` to load BBS URL
- Use `mcp_chrome_devtools_take_snapshot` to capture terminal state
- Use `mcp_chrome_devtools_fill` to enter text input
- Use `mcp_chrome_devtools_click` to interact with UI
- Verify output using snapshot text analysis
- Fall back to API verification when MCP doesn't show correct results

**Test Data Setup:**
- Create test users with known handles
- Create test message bases with sample messages
- Ensure test messages have proper author handles
- Create test door games with ANSI art

### Manual Testing Checklist

- [ ] Welcome screen displays single frame with proper borders
- [ ] Registration creates account and logs in
- [ ] Login shows personalized greeting
- [ ] Message list shows author handles (not "undefined")
- [ ] Message reading displays full content with author
- [ ] Message posting saves with correct author
- [ ] Door games render ANSI art within 80 characters
- [ ] Conversation starters appear in message bases
- [ ] "Catch me up" summary generates correctly
- [ ] Daily digest shows on login when available
- [ ] All frames respect 80-character width limit
- [ ] ANSI colors render correctly throughout

## Implementation Notes

### Priority Order

1. **Critical Bugs (P0)** - Fix immediately
   - Welcome screen duplication
   - Message author "undefined" bug
   - 80-character width enforcement

2. **Feature Integration (P1)** - Implement next
   - Conversation starters in message bases
   - Catch-me-up summary access
   - Daily digest improvements

3. **Testing (P2)** - Implement alongside fixes
   - MCP browser tests
   - Property-based tests
   - Integration tests

### Code Changes Required

**ANSI Rendering Layer:**
- Add width enforcement to ANSIFrameBuilder
- Update ANSIRenderingService to validate all output
- Modify BaseTerminalRenderer to respect width limits

**Message Handler:**
- Fix author handle display in message list
- Fix author handle display in message reading
- Add conversation starter command/display
- Improve summary UI integration

**Door Handler:**
- Add width enforcement for door game output
- Validate ANSI art before sending to client

**Welcome Screen:**
- Ensure welcome screen sent only once on connection
- Remove duplicate prompt sending

**Database/Repository:**
- Verify message-user join query
- Add fallback for missing author handles
- Test with deleted users

### Configuration

**Width Limits:**
```typescript
const TERMINAL_WIDTH = 80;  // Standard terminal width
const FRAME_WIDTH = 80;     // Maximum frame width
const CONTENT_WIDTH = 76;   // Content width (frame - borders - padding)
```

**AI Feature Timeouts:**
```typescript
const CONVERSATION_STARTER_TIMEOUT = 10000;  // 10 seconds
const SUMMARY_TIMEOUT = 30000;               // 30 seconds
const DIGEST_TIMEOUT = 30000;                // 30 seconds
```

### Dependencies

- fast-check: ^3.x (property-based testing)
- MCP Chrome DevTools: (browser testing)
- xterm.js: (terminal emulation - already in use)
- OpenAI API: (AI features - already in use)

### Backward Compatibility

All changes maintain backward compatibility:
- Existing message data remains valid
- User accounts unaffected
- Session management unchanged
- API endpoints unchanged

### Performance Considerations

- Width enforcement adds minimal overhead (< 1ms per render)
- Conversation starter caching reduces AI API calls
- Summary generation may take 5-30 seconds (show loading indicator)
- Frame validation can be disabled in production for performance

### Security Considerations

- ANSI code injection: Strip or escape user-provided ANSI codes
- Width enforcement prevents terminal overflow attacks
- Author handle verification prevents impersonation
- AI feature rate limiting prevents abuse
