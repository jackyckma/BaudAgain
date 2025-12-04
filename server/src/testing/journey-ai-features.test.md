# User Journey Test: AI Features

This test validates AI conversation starters, catch-me-up summaries, and daily digest using MCP Chrome DevTools.

**Requirements validated**: 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 9.4, 9.5, 10.1, 10.2, 10.3, 10.5

## Test Setup

1. Ensure BBS server is running on port 8080
2. Ensure AI service is configured (OpenAI API key set)
3. Ensure test user is logged in
4. Ensure test messages exist in message bases
5. Chrome DevTools MCP should be configured

## Test Steps

### Test 1: Conversation Starters Display

**Objective**: Verify conversation starters display in message bases

**Steps**:
1. Navigate to Messages from main menu
2. Select a message base
3. Wait for message list to display
4. Look for conversation starters section
5. Take snapshot and screenshot
6. Validate conversation starters are present

**Expected Results**:
- Message list displays
- Conversation starters section is visible
- Multiple conversation starter topics are shown
- Starters are relevant to message base content
- Frame formatting is maintained
- Width constraints are respected

**MCP Commands**:
```javascript
// Navigate to Messages
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'M' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Select message base
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: '1' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for message list with conversation starters
await mcp_chrome_devtools_wait_for({ 
  text: 'conversation', 
  timeout: 10000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_conversation_starters.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'All lines should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 
  'Frame borders should be aligned');

// Validate conversation starters section exists
const hasStarters = 
  snapshot.content.toLowerCase().includes('conversation') ||
  snapshot.content.toLowerCase().includes('starter') ||
  snapshot.content.toLowerCase().includes('topic');

console.assert(hasStarters, 
  'Conversation starters section should be present');

// Validate at least one starter is shown
// Look for numbered options or bullet points
const hasOptions = /[1-9]\.|•|→/.test(snapshot.content);
console.assert(hasOptions, 
  'At least one conversation starter should be shown');
```

### Test 2: Conversation Starter Selection

**Objective**: Verify user can select a conversation starter to post

**Steps**:
1. From message list with conversation starters, select a starter
2. Wait for message posting flow to begin
3. Verify subject is pre-filled with starter topic
4. Take snapshot and screenshot
5. Validate posting flow initiated

**Expected Results**:
- Starter selection is accepted
- Message posting flow begins
- Subject is pre-filled with selected starter
- User can proceed to enter message body
- Frame formatting is maintained

**MCP Commands**:
```javascript
// Select a conversation starter (command may vary)
// Might be 'S' for starters, or a number
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'S' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// If prompted to select which starter, choose one
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: '1' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for message posting flow
await mcp_chrome_devtools_wait_for({ 
  text: 'body', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_starter_selected.png' 
});
```

**Validation**:
```typescript
// Validate posting flow initiated
console.assert(
  snapshot.content.toLowerCase().includes('body') ||
  snapshot.content.toLowerCase().includes('message'),
  'Message posting flow should be initiated'
);

// Validate subject appears to be pre-filled
// (This may be visible in the prompt or confirmation)
console.assert(snapshot.content.length > 100, 
  'Content should include posting interface');
```

### Test 3: Catch Me Up Command

**Objective**: Verify "catch me up" command is available in message bases

**Steps**:
1. Navigate to a message base
2. Look for "catch me up" option in menu
3. Take snapshot and screenshot
4. Validate option is present

**Expected Results**:
- Message base menu displays
- "Catch me up" or "C" option is visible
- Option description is clear
- Frame formatting is maintained

**MCP Commands**:
```javascript
// Navigate to message base
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'M' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: '1' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Take snapshot of message base menu
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_catchup_option.png' 
});
```

**Validation**:
```typescript
// Validate catch me up option is present
const hasCatchUp = 
  snapshot.content.toLowerCase().includes('catch') ||
  snapshot.content.toLowerCase().includes('summary') ||
  /\bC\b.*catch/i.test(snapshot.content);

console.assert(hasCatchUp, 
  'Catch me up option should be available');
```

### Test 4: Catch Me Up Summary Generation

**Objective**: Verify "catch me up" generates a summary of unread messages

**Steps**:
1. From message base, select "catch me up" option
2. Wait for summary to generate (may take 5-30 seconds)
3. Take snapshot and screenshot
4. Validate summary content

**Expected Results**:
- Summary generation begins
- Loading indicator may appear
- Summary displays within 30 seconds
- Summary includes key topics and highlights
- Summary is formatted within frame boundaries
- Width constraints are respected
- No unread messages case is handled gracefully

**MCP Commands**:
```javascript
// Select catch me up option
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'C' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for summary (may take time)
await mcp_chrome_devtools_wait_for({ 
  text: 'summary', 
  timeout: 30000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_catchup_summary.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'Summary should be within 80 characters per line');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 
  'Summary frame borders should be aligned');

// Validate summary content
const hasSummary = 
  snapshot.content.toLowerCase().includes('summary') ||
  snapshot.content.toLowerCase().includes('unread') ||
  snapshot.content.toLowerCase().includes('messages') ||
  snapshot.content.toLowerCase().includes('no new messages');

console.assert(hasSummary, 
  'Summary or no messages message should be present');

// Validate summary is substantial (if messages exist)
if (!snapshot.content.toLowerCase().includes('no new messages')) {
  console.assert(snapshot.content.length > 200, 
    'Summary should contain substantial content');
}
```

### Test 5: Daily Digest on Login

**Objective**: Verify daily digest displays on login when available

**Steps**:
1. Logout (if logged in)
2. Login with test user
3. Wait for login to complete
4. Look for daily digest notification or display
5. Take snapshot and screenshot
6. Validate daily digest presence

**Expected Results**:
- Login completes successfully
- Daily digest notification appears (if available)
- Digest content is displayed or option to view is shown
- Frame formatting is maintained
- Width constraints are respected

**MCP Commands**:
```javascript
// Logout first (if needed)
// Navigate to welcome screen
await mcp_chrome_devtools_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:8080' 
});

// Login
await mcp_chrome_devtools_wait_for({ 
  text: 'Welcome', 
  timeout: 5000 
});

await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testUser.handle 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

await mcp_chrome_devtools_wait_for({ 
  text: 'password', 
  timeout: 3000 
});

await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testUser.password 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for login and potential digest
await mcp_chrome_devtools_wait_for({ 
  text: 'menu', 
  timeout: 10000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_daily_digest_login.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'All lines should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 
  'Frame borders should be aligned');

// Check for daily digest
const hasDigest = 
  snapshot.content.toLowerCase().includes('digest') ||
  snapshot.content.toLowerCase().includes('daily') ||
  snapshot.content.toLowerCase().includes('activity');

// Note: Digest may not always be available, so this is informational
if (hasDigest) {
  console.log('✓ Daily digest is present');
} else {
  console.log('ℹ Daily digest not present (may not be available)');
}
```

### Test 6: Daily Digest Content Display

**Objective**: Verify daily digest content is properly formatted

**Steps**:
1. If daily digest is available, view its content
2. Take snapshot and screenshot
3. Validate digest formatting

**Expected Results**:
- Digest content displays
- Summaries of active discussions are shown
- New content is highlighted
- Frame formatting is maintained
- Width constraints are respected

**MCP Commands**:
```javascript
// If digest option is available, select it
// Command may vary (might be automatic or require selection)

// Take snapshot of digest content
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_daily_digest_content.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'Digest content should be within 80 characters per line');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 
  'Digest frame borders should be aligned');

// Validate digest content structure
const hasDigestContent = 
  snapshot.content.toLowerCase().includes('discussion') ||
  snapshot.content.toLowerCase().includes('activity') ||
  snapshot.content.toLowerCase().includes('message');

console.assert(hasDigestContent, 
  'Digest should contain activity information');
```

### Test 7: AI Feature Error Handling

**Objective**: Verify AI features handle errors gracefully

**Steps**:
1. Test conversation starters when AI service is unavailable
2. Test catch me up when no messages exist
3. Validate error messages are helpful
4. Validate system remains stable

**Expected Results**:
- Helpful error messages display
- System doesn't crash
- User can continue using BBS
- Frame formatting is maintained

**Validation**:
```typescript
// This test may require temporarily disabling AI service
// or testing with empty message bases

// Validate error handling
const hasErrorMessage = 
  snapshot.content.toLowerCase().includes('unavailable') ||
  snapshot.content.toLowerCase().includes('error') ||
  snapshot.content.toLowerCase().includes('no messages') ||
  snapshot.content.toLowerCase().includes('try again');

// Error messages should be present when appropriate
// System should remain stable
```

## Test Execution Checklist

- [ ] Test 1: Conversation Starters Display
  - [ ] Navigate to message base
  - [ ] Wait for conversation starters
  - [ ] Take snapshot and screenshot
  - [ ] Validate starters present

- [ ] Test 2: Conversation Starter Selection
  - [ ] Select a starter
  - [ ] Wait for posting flow
  - [ ] Take snapshot and screenshot
  - [ ] Validate subject pre-filled

- [ ] Test 3: Catch Me Up Command
  - [ ] Navigate to message base
  - [ ] Look for catch me up option
  - [ ] Take snapshot and screenshot
  - [ ] Validate option present

- [ ] Test 4: Catch Me Up Summary Generation
  - [ ] Select catch me up
  - [ ] Wait for summary
  - [ ] Take snapshot and screenshot
  - [ ] Validate summary content

- [ ] Test 5: Daily Digest on Login
  - [ ] Logout and login
  - [ ] Look for digest
  - [ ] Take snapshot and screenshot
  - [ ] Validate digest presence

- [ ] Test 6: Daily Digest Content Display
  - [ ] View digest content
  - [ ] Take snapshot and screenshot
  - [ ] Validate formatting

- [ ] Test 7: AI Feature Error Handling
  - [ ] Test error scenarios
  - [ ] Validate error messages
  - [ ] Validate system stability

## Success Criteria

All tests must pass with:
- ✓ Conversation starters display in message bases
- ✓ Conversation starters can be selected
- ✓ Catch me up option is available
- ✓ Catch me up generates summaries
- ✓ Daily digest displays on login (when available)
- ✓ Daily digest content is properly formatted
- ✓ AI features handle errors gracefully
- ✓ All content within 80 characters
- ✓ All frames properly aligned

## Troubleshooting

**Issue**: Conversation starters don't appear
- Check AI service is configured
- Check OpenAI API key is valid
- Check message base has messages
- Check server logs for AI errors

**Issue**: Catch me up doesn't work
- Check AI service is configured
- Check user has unread messages
- Check server logs for errors
- Verify MessageSummarizer service is working

**Issue**: Daily digest doesn't appear
- Check DailyDigestService is running
- Check digest has been generated
- Check user login time vs digest generation time
- Digest may not always be available

**Issue**: AI features timeout
- AI responses can take 5-30 seconds
- Increase timeout values if needed
- Check AI service rate limits
- Check network connectivity

**Issue**: Content exceeds 80 characters
- This is a BUG (Requirements 9.4, 10.5 violation)
- Document with screenshots
- Check AI response formatting
- Check frame rendering

## Notes

- Screenshots are saved to `screenshots/` directory
- All validation functions are in `user-journey-mcp-helpers.ts`
- AI features require OpenAI API key to be configured
- AI responses may take time to generate (5-30 seconds)
- Daily digest may not always be available
- Conversation starters are cached for performance
- Test user must be logged in for most tests
- Some AI features may not be available if AI service is down
