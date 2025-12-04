# User Journey Test: Welcome Screen and Registration

This test validates the welcome screen display and new user registration flow using MCP Chrome DevTools.

**Requirements validated**: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5

## Test Setup

1. Ensure BBS server is running on port 8080
2. Ensure test data is set up (run `setup-journey-test-data.ts`)
3. Chrome DevTools MCP should be configured

## Test Steps

### Test 1: Welcome Screen Display

**Objective**: Verify welcome screen displays correctly with proper ANSI formatting

**Steps**:
1. Navigate to http://localhost:8080
2. Wait for welcome screen to load (max 5 seconds)
3. Take snapshot of page content
4. Take screenshot for visual verification
5. Validate welcome screen content

**Expected Results**:
- Welcome screen displays within 5 seconds
- Single welcome frame with proper borders
- ANSI formatting is present (colors, box-drawing)
- "Enter your handle" prompt appears exactly once
- Frame width does not exceed 80 characters
- All borders are properly aligned

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders, countPrompts } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 'All lines should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 'Frame borders should be aligned');

// Validate single prompt
const promptValidation = countPrompts(snapshot.content);
console.assert(promptValidation.singlePrompt, 'Should have exactly one prompt');
```

**MCP Commands**:
```javascript
// Navigate to terminal
await mcp_chrome_devtools_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:8080' 
});

// Wait for welcome screen
await mcp_chrome_devtools_wait_for({ 
  text: 'Welcome', 
  timeout: 5000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_welcome_screen.png' 
});
```

### Test 2: Registration Flow - NEW Command

**Objective**: Verify NEW command initiates registration flow

**Steps**:
1. From welcome screen, enter "NEW" command
2. Wait for registration prompt
3. Take snapshot and screenshot
4. Validate registration prompt appears

**Expected Results**:
- Registration prompt appears after entering NEW
- Prompt asks for handle
- Frame formatting is maintained
- Width constraints are respected

**MCP Commands**:
```javascript
// Enter NEW command
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'NEW' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for registration prompt
await mcp_chrome_devtools_wait_for({ 
  text: 'handle', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_registration_prompt.png' 
});
```

### Test 3: Registration Flow - Handle Entry

**Objective**: Verify handle entry and validation

**Steps**:
1. Enter a unique test handle
2. Wait for password prompt
3. Take snapshot and screenshot
4. Validate password prompt appears

**Expected Results**:
- Handle is accepted
- Password prompt appears
- Frame formatting is maintained

**MCP Commands**:
```javascript
import { JOURNEY_TEST_PERSONAS } from './user-journey-mcp-helpers';

const testUser = JOURNEY_TEST_PERSONAS.NEW_USER;

// Enter handle
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testUser.handle 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for password prompt
await mcp_chrome_devtools_wait_for({ 
  text: 'password', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_password_prompt.png' 
});
```

### Test 4: Registration Flow - Password Entry

**Objective**: Verify password entry and account creation

**Steps**:
1. Enter password
2. Wait for password confirmation prompt
3. Enter password again
4. Wait for main menu or profile prompts
5. Take snapshot and screenshot
6. Validate successful registration

**Expected Results**:
- Password is accepted
- Account is created
- User is logged in
- Main menu displays or profile setup begins

**MCP Commands**:
```javascript
// Enter password
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testUser.password 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for confirmation
await mcp_chrome_devtools_wait_for({ 
  text: 'confirm', 
  timeout: 3000 
});

// Confirm password
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testUser.password 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for success (main menu or profile setup)
await mcp_chrome_devtools_wait_for({ 
  text: 'Menu', 
  timeout: 5000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_registration_complete.png' 
});
```

### Test 5: Verify Single Frame and Single Prompt

**Objective**: Verify welcome screen has exactly one frame and one prompt

**Steps**:
1. Navigate to welcome screen (fresh page load)
2. Take snapshot
3. Count frames and prompts
4. Validate counts

**Expected Results**:
- Exactly one welcome frame
- Exactly one "Enter your handle" prompt
- No duplicate content

**Validation**:
```typescript
import { countPrompts, validateFrameBorders } from './user-journey-mcp-helpers';

// Count prompts
const promptValidation = countPrompts(snapshot.content);
console.assert(promptValidation.promptCount === 1, 
  `Expected 1 prompt, found ${promptValidation.promptCount}`);

// Count frames (look for top borders)
const topBorderCount = (snapshot.content.match(/[┌╔]/g) || []).length;
console.assert(topBorderCount === 1, 
  `Expected 1 frame, found ${topBorderCount} top borders`);
```

## Test Execution Checklist

- [ ] Test 1: Welcome Screen Display
  - [ ] Navigate to terminal URL
  - [ ] Wait for welcome screen
  - [ ] Take snapshot and screenshot
  - [ ] Validate width (80 chars max)
  - [ ] Validate frame borders
  - [ ] Validate single prompt

- [ ] Test 2: Registration Flow - NEW Command
  - [ ] Enter NEW command
  - [ ] Wait for registration prompt
  - [ ] Take snapshot and screenshot
  - [ ] Validate prompt appears

- [ ] Test 3: Registration Flow - Handle Entry
  - [ ] Enter unique handle
  - [ ] Wait for password prompt
  - [ ] Take snapshot and screenshot
  - [ ] Validate password prompt

- [ ] Test 4: Registration Flow - Password Entry
  - [ ] Enter password
  - [ ] Confirm password
  - [ ] Wait for main menu
  - [ ] Take snapshot and screenshot
  - [ ] Validate successful registration

- [ ] Test 5: Verify Single Frame and Single Prompt
  - [ ] Fresh page load
  - [ ] Count frames and prompts
  - [ ] Validate counts are exactly 1

## Success Criteria

All tests must pass with:
- ✓ Welcome screen displays correctly
- ✓ Single frame with proper borders
- ✓ Single prompt (no duplicates)
- ✓ All lines within 80 characters
- ✓ Registration flow completes successfully
- ✓ User account is created
- ✓ User is logged in after registration

## Troubleshooting

**Issue**: Welcome screen doesn't load
- Check BBS server is running
- Check WebSocket connection
- Check browser console for errors

**Issue**: Multiple prompts appear
- This is a bug (Requirement 1.2 violation)
- Document the issue with screenshots
- Report line numbers where duplicates occur

**Issue**: Frame borders misaligned
- This is a bug (Requirement 1.4 violation)
- Document with screenshots
- Report specific alignment issues

**Issue**: Lines exceed 80 characters
- This is a bug (Requirement 1.3 violation)
- Document which lines exceed limit
- Report actual widths

## Notes

- Screenshots are saved to `screenshots/` directory
- All validation functions are in `user-journey-mcp-helpers.ts`
- Test data setup is in `setup-journey-test-data.ts`
- Each test should be independent and repeatable
