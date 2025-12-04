# User Journey Test: Message Functionality

This test validates message base listing, message reading, and message posting using MCP Chrome DevTools.

**Requirements validated**: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5

## Test Setup

1. Ensure BBS server is running on port 8080
2. Ensure test user exists and test messages are created (run `setup-journey-test-data.ts`)
3. Chrome DevTools MCP should be configured
4. User should be logged in before starting these tests

## Test Steps

### Test 1: Message Base Listing

**Objective**: Verify message base list displays correctly

**Steps**:
1. From main menu, navigate to Messages
2. Wait for message base list to display
3. Take snapshot and screenshot
4. Validate message base list content

**Expected Results**:
- Message base list displays
- Each base shows name and description
- Frame formatting is maintained
- Width constraints are respected
- Selection options are clear

**MCP Commands**:
```javascript
// Navigate to Messages from main menu
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'M' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for message base list
await mcp_chrome_devtools_wait_for({ 
  text: 'message base', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_message_base_list.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 'All lines should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 'Frame borders should be aligned');

// Validate message base list appears
console.assert(
  snapshot.content.toLowerCase().includes('message base') ||
  snapshot.content.toLowerCase().includes('message board'),
  'Message base list should appear'
);

// Validate at least one message base is shown
const hasMessageBase = 
  snapshot.content.toLowerCase().includes('general') ||
  snapshot.content.toLowerCase().includes('test');
console.assert(hasMessageBase, 'At least one message base should be listed');
```

### Test 2: Message List Display

**Objective**: Verify message list shows author handles correctly (not "undefined")

**Steps**:
1. From message base list, select a message base
2. Wait for message list to display
3. Take snapshot and screenshot
4. Validate message list content and author handles

**Expected Results**:
- Message list displays
- Each message shows subject, author, and date
- Author handles are NOT "undefined"
- Author handles are NOT "null"
- Author handles are NOT empty
- Frame formatting is maintained

**MCP Commands**:
```javascript
// Select first message base (usually option 1)
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: '1' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for message list
await mcp_chrome_devtools_wait_for({ 
  text: 'subject', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_message_list.png' 
});
```

**Validation**:
```typescript
import { validateAuthorDisplay, validateLineWidth } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 'All lines should be within 80 characters');

// Validate author handles are not undefined
const authorValidation = validateAuthorDisplay(snapshot.content);
console.assert(authorValidation.authorNotUndefined, 
  'Author handles should not be "undefined"');
console.assert(authorValidation.authorNotNull, 
  'Author handles should not be "null"');
console.assert(authorValidation.authorNotEmpty, 
  'Author handles should not be empty');

// Validate message list structure
const hasSubject = /subject/i.test(snapshot.content);
const hasAuthor = /author|by |from /i.test(snapshot.content);
const hasDate = /date|time|\d{1,2}\/\d{1,2}/i.test(snapshot.content);

console.assert(hasSubject, 'Message list should show subjects');
console.assert(hasAuthor, 'Message list should show authors');
console.assert(hasDate, 'Message list should show dates');

// Log any issues found
if (authorValidation.issues.length > 0) {
  console.error('Author display issues:', authorValidation.issues);
}
```

### Test 3: Message Reading

**Objective**: Verify full message content displays correctly

**Steps**:
1. From message list, select a message to read
2. Wait for message content to display
3. Take snapshot and screenshot
4. Validate message content and author handle

**Expected Results**:
- Full message displays
- Subject is shown
- Author handle is shown (not "undefined")
- Date is shown
- Message body is shown
- Frame formatting is maintained
- Width constraints are respected

**MCP Commands**:
```javascript
// Select first message (usually option 1)
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: '1' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for message content
await mcp_chrome_devtools_wait_for({ 
  text: 'body', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_message_read.png' 
});
```

**Validation**:
```typescript
import { validateAuthorDisplay, validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 'All lines should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 'Frame borders should be aligned');

// Validate author handle
const authorValidation = validateAuthorDisplay(snapshot.content);
console.assert(authorValidation.authorNotUndefined, 
  'Author handle should not be "undefined"');

// Validate message structure
const hasSubject = /subject:/i.test(snapshot.content);
const hasAuthor = /author:|by |from /i.test(snapshot.content);
const hasDate = /date:|time:|\d{1,2}\/\d{1,2}/i.test(snapshot.content);
const hasBody = snapshot.content.length > 200; // Message body should add significant content

console.assert(hasSubject, 'Message should show subject');
console.assert(hasAuthor, 'Message should show author');
console.assert(hasDate, 'Message should show date');
console.assert(hasBody, 'Message should show body content');
```

### Test 4: Message Posting - Initiate

**Objective**: Verify user can initiate message posting

**Steps**:
1. From message list, select option to post new message
2. Wait for subject prompt
3. Take snapshot and screenshot
4. Validate subject prompt appears

**Expected Results**:
- Post option is available
- Subject prompt appears
- Frame formatting is maintained

**MCP Commands**:
```javascript
// Return to message list if needed
// Then select post option (usually 'P' or 'N')
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'P' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for subject prompt
await mcp_chrome_devtools_wait_for({ 
  text: 'subject', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_message_post_subject.png' 
});
```

**Validation**:
```typescript
// Validate subject prompt appears
console.assert(snapshot.content.toLowerCase().includes('subject'), 
  'Subject prompt should appear');
```

### Test 5: Message Posting - Complete

**Objective**: Verify message posting saves with correct author

**Steps**:
1. Enter message subject
2. Wait for body prompt
3. Enter message body
4. Complete posting
5. Verify message appears in list with correct author

**Expected Results**:
- Subject is accepted
- Body prompt appears
- Body is accepted
- Message is posted successfully
- Message appears in list
- Author handle is correct (matches logged-in user)

**MCP Commands**:
```javascript
import { JOURNEY_TEST_PERSONAS } from './user-journey-mcp-helpers';

const testUser = JOURNEY_TEST_PERSONAS.EXISTING_USER;
const testSubject = `Test Message ${Date.now()}`;
const testBody = 'This is a test message to verify posting functionality.';

// Enter subject
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testSubject 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for body prompt
await mcp_chrome_devtools_wait_for({ 
  text: 'body', 
  timeout: 3000 
});

// Enter body
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testBody 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for confirmation or return to list
await mcp_chrome_devtools_wait_for({ 
  text: 'posted', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_message_posted.png' 
});

// Return to message list to verify
// (Commands may vary based on current state)

// Take another snapshot of message list
const listSnapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_message_list_after_post.png' 
});
```

**Validation**:
```typescript
// Validate message was posted
console.assert(
  snapshot.content.toLowerCase().includes('posted') ||
  snapshot.content.toLowerCase().includes('success'),
  'Message posting should succeed'
);

// Validate message appears in list with correct author
console.assert(listSnapshot.content.includes(testSubject), 
  'Posted message should appear in list');

console.assert(listSnapshot.content.includes(testUser.handle), 
  'Posted message should show correct author handle');

// Validate author is not undefined
const authorValidation = validateAuthorDisplay(listSnapshot.content);
console.assert(authorValidation.authorNotUndefined, 
  'Posted message author should not be "undefined"');
```

### Test 6: Verify API - Message Author Correctness

**Objective**: Verify via API that posted message has correct author

**Steps**:
1. Use API to fetch the posted message
2. Verify author handle matches logged-in user
3. Verify author handle is not undefined or null

**Expected Results**:
- API returns message with correct author
- Author handle matches logged-in user
- Author handle is not undefined or null

**API Validation**:
```typescript
import { JourneyTestAPI, JOURNEY_TEST_PERSONAS } from './user-journey-mcp-helpers';

const api = new JourneyTestAPI();
const testUser = JOURNEY_TEST_PERSONAS.EXISTING_USER;

// Login to get token
await api.loginUser(testUser.handle, testUser.password);

// Get message bases
const basesResult = await api.getMessageBases();
console.assert(basesResult.success, 'Should get message bases');

if (basesResult.bases && basesResult.bases.length > 0) {
  const firstBase = basesResult.bases[0];
  
  // Get messages
  const messagesResult = await api.getMessages(firstBase.id);
  console.assert(messagesResult.success, 'Should get messages');
  
  if (messagesResult.messages) {
    // Find our posted message
    const postedMessage = messagesResult.messages.find(m => 
      m.subject === testSubject
    );
    
    console.assert(postedMessage !== undefined, 'Posted message should exist');
    console.assert(postedMessage.authorHandle === testUser.handle, 
      'Author handle should match logged-in user');
    console.assert(postedMessage.authorHandle !== undefined, 
      'Author handle should not be undefined');
    console.assert(postedMessage.authorHandle !== null, 
      'Author handle should not be null');
    console.assert(postedMessage.authorHandle !== '', 
      'Author handle should not be empty');
  }
}
```

## Test Execution Checklist

- [ ] Test 1: Message Base Listing
  - [ ] Navigate to Messages
  - [ ] Wait for message base list
  - [ ] Take snapshot and screenshot
  - [ ] Validate list content

- [ ] Test 2: Message List Display
  - [ ] Select message base
  - [ ] Wait for message list
  - [ ] Take snapshot and screenshot
  - [ ] Validate author handles (not "undefined")

- [ ] Test 3: Message Reading
  - [ ] Select message
  - [ ] Wait for message content
  - [ ] Take snapshot and screenshot
  - [ ] Validate full content and author

- [ ] Test 4: Message Posting - Initiate
  - [ ] Select post option
  - [ ] Wait for subject prompt
  - [ ] Take snapshot and screenshot
  - [ ] Validate prompt appears

- [ ] Test 5: Message Posting - Complete
  - [ ] Enter subject
  - [ ] Enter body
  - [ ] Complete posting
  - [ ] Verify message in list
  - [ ] Validate correct author

- [ ] Test 6: Verify API - Message Author Correctness
  - [ ] Fetch message via API
  - [ ] Verify author handle
  - [ ] Validate not undefined/null

## Success Criteria

All tests must pass with:
- ✓ Message base list displays correctly
- ✓ Message list shows all messages
- ✓ Author handles are NEVER "undefined"
- ✓ Author handles are NEVER "null"
- ✓ Author handles are NEVER empty
- ✓ Full message content displays correctly
- ✓ Message posting works
- ✓ Posted messages have correct author
- ✓ All frames within 80 characters
- ✓ All borders properly aligned

## Troubleshooting

**Issue**: Author shows as "undefined"
- This is a BUG (Requirements 4.5, 5.5 violation)
- Document with screenshots
- Check MessageRepository query
- Check MessageHandler display logic

**Issue**: Message list doesn't display
- Check message base has messages
- Check user has read access
- Check server logs for errors

**Issue**: Cannot post message
- Check user has write access
- Check message base allows posting
- Check server logs for errors

**Issue**: Posted message doesn't appear
- Check message was actually saved
- Refresh message list
- Check via API

## Notes

- Screenshots are saved to `screenshots/` directory
- All validation functions are in `user-journey-mcp-helpers.ts`
- Test user must be logged in before running these tests
- Test messages should exist in database
- Author handle validation is CRITICAL for these tests
- Any "undefined" author is a bug that must be fixed
