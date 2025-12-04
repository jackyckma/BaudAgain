# User Journey Test: Login and Navigation

This test validates the login flow and main menu navigation using MCP Chrome DevTools.

**Requirements validated**: 3.1, 3.2, 3.3, 3.5

## Test Setup

1. Ensure BBS server is running on port 8080
2. Ensure test user exists (run `setup-journey-test-data.ts`)
3. Chrome DevTools MCP should be configured
4. Test user credentials: JourneyVet / VetPass456!

## Test Steps

### Test 1: Login Flow - Handle Entry

**Objective**: Verify existing user can enter handle at welcome prompt

**Steps**:
1. Navigate to http://localhost:8080
2. Wait for welcome screen
3. Enter existing user handle
4. Wait for password prompt
5. Take snapshot and screenshot
6. Validate password prompt appears

**Expected Results**:
- Welcome screen displays
- Handle is accepted
- Password prompt appears
- Frame formatting is maintained
- Width constraints are respected

**MCP Commands**:
```javascript
import { JOURNEY_TEST_PERSONAS } from './user-journey-mcp-helpers';

const testUser = JOURNEY_TEST_PERSONAS.EXISTING_USER;

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
  filePath: 'screenshots/journey_login_password_prompt.png' 
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

// Validate password prompt appears
console.assert(snapshot.content.toLowerCase().includes('password'), 
  'Password prompt should appear');
```

### Test 2: Login Flow - Authentication

**Objective**: Verify user can authenticate with correct password

**Steps**:
1. From password prompt, enter correct password
2. Wait for main menu to display
3. Take snapshot and screenshot
4. Validate successful authentication

**Expected Results**:
- Password is accepted
- User is authenticated
- Main menu displays
- Personalized greeting appears (with user handle)
- Frame formatting is maintained

**MCP Commands**:
```javascript
// Enter password
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: testUser.password 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for main menu
await mcp_chrome_devtools_wait_for({ 
  text: 'Menu', 
  timeout: 5000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_login_main_menu.png' 
});
```

**Validation**:
```typescript
// Validate main menu appears
console.assert(snapshot.content.toLowerCase().includes('menu'), 
  'Main menu should appear');

// Validate user handle appears in greeting
console.assert(snapshot.content.includes(testUser.handle), 
  'User handle should appear in greeting');

// Validate menu options are present
const expectedOptions = ['Messages', 'Doors', 'Goodbye'];
expectedOptions.forEach(option => {
  console.assert(snapshot.content.toLowerCase().includes(option.toLowerCase()), 
    `Menu should include ${option} option`);
});
```

### Test 3: Main Menu Display

**Objective**: Verify main menu displays all expected options

**Steps**:
1. From logged-in state, view main menu
2. Take snapshot and screenshot
3. Validate all menu options are present

**Expected Results**:
- Main menu displays with proper formatting
- All expected options are visible:
  - Messages / Message Bases
  - Doors / Door Games
  - Goodbye / Logoff
- Frame formatting is maintained
- Width constraints are respected

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 'All lines should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 'Frame borders should be aligned');

// Validate menu options
const menuOptions = [
  { name: 'Messages', aliases: ['message', 'msg', 'mail'] },
  { name: 'Doors', aliases: ['door', 'game'] },
  { name: 'Goodbye', aliases: ['goodbye', 'logoff', 'quit', 'exit'] },
];

menuOptions.forEach(option => {
  const hasOption = option.aliases.some(alias => 
    snapshot.content.toLowerCase().includes(alias)
  );
  console.assert(hasOption, `Menu should include ${option.name} option`);
});
```

### Test 4: Navigate to Messages

**Objective**: Verify navigation from main menu to Messages section

**Steps**:
1. From main menu, select Messages option
2. Wait for message base list to display
3. Take snapshot and screenshot
4. Validate message base list appears

**Expected Results**:
- Messages option is accepted
- Message base list displays
- Frame formatting is maintained
- Return to main menu option is available

**MCP Commands**:
```javascript
// Enter Messages command (try common variations)
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
  filePath: 'screenshots/journey_navigate_messages.png' 
});
```

**Validation**:
```typescript
// Validate message base list appears
console.assert(
  snapshot.content.toLowerCase().includes('message base') ||
  snapshot.content.toLowerCase().includes('message board'),
  'Message base list should appear'
);

// Validate return option is available
const hasReturnOption = 
  snapshot.content.toLowerCase().includes('main menu') ||
  snapshot.content.toLowerCase().includes('back') ||
  snapshot.content.toLowerCase().includes('return');
console.assert(hasReturnOption, 'Return to main menu option should be available');
```

### Test 5: Navigate to Doors

**Objective**: Verify navigation from main menu to Doors section

**Steps**:
1. Return to main menu (if not already there)
2. Select Doors option
3. Wait for door games list to display
4. Take snapshot and screenshot
5. Validate door games list appears

**Expected Results**:
- Doors option is accepted
- Door games list displays
- Frame formatting is maintained
- Return to main menu option is available

**MCP Commands**:
```javascript
// If not at main menu, return first
// (This step may vary based on current state)

// Enter Doors command
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'D' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for door games list
await mcp_chrome_devtools_wait_for({ 
  text: 'door', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_navigate_doors.png' 
});
```

**Validation**:
```typescript
// Validate door games list appears
console.assert(
  snapshot.content.toLowerCase().includes('door') ||
  snapshot.content.toLowerCase().includes('game'),
  'Door games list should appear'
);

// Validate return option is available
const hasReturnOption = 
  snapshot.content.toLowerCase().includes('main menu') ||
  snapshot.content.toLowerCase().includes('back') ||
  snapshot.content.toLowerCase().includes('return');
console.assert(hasReturnOption, 'Return to main menu option should be available');
```

### Test 6: Return to Main Menu

**Objective**: Verify user can return to main menu from submenus

**Steps**:
1. From a submenu (Messages or Doors), select return option
2. Wait for main menu to display
3. Take snapshot and screenshot
4. Validate main menu appears

**Expected Results**:
- Return command is accepted
- Main menu displays
- All menu options are visible again
- Frame formatting is maintained

**MCP Commands**:
```javascript
// Enter return command (try common variations)
// This may be 'Q', 'X', 'M', or other depending on the menu
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'Q' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for main menu
await mcp_chrome_devtools_wait_for({ 
  text: 'Main Menu', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_return_main_menu.png' 
});
```

**Validation**:
```typescript
// Validate main menu appears
console.assert(
  snapshot.content.toLowerCase().includes('main menu') ||
  snapshot.content.toLowerCase().includes('menu'),
  'Main menu should appear'
);

// Validate menu options are present
const expectedOptions = ['Messages', 'Doors', 'Goodbye'];
expectedOptions.forEach(option => {
  console.assert(snapshot.content.toLowerCase().includes(option.toLowerCase()), 
    `Menu should include ${option} option`);
});
```

## Test Execution Checklist

- [ ] Test 1: Login Flow - Handle Entry
  - [ ] Navigate to terminal
  - [ ] Enter existing handle
  - [ ] Wait for password prompt
  - [ ] Take snapshot and screenshot
  - [ ] Validate password prompt

- [ ] Test 2: Login Flow - Authentication
  - [ ] Enter correct password
  - [ ] Wait for main menu
  - [ ] Take snapshot and screenshot
  - [ ] Validate authentication success
  - [ ] Validate personalized greeting

- [ ] Test 3: Main Menu Display
  - [ ] View main menu
  - [ ] Take snapshot and screenshot
  - [ ] Validate all menu options present
  - [ ] Validate frame formatting

- [ ] Test 4: Navigate to Messages
  - [ ] Select Messages option
  - [ ] Wait for message base list
  - [ ] Take snapshot and screenshot
  - [ ] Validate navigation success

- [ ] Test 5: Navigate to Doors
  - [ ] Select Doors option
  - [ ] Wait for door games list
  - [ ] Take snapshot and screenshot
  - [ ] Validate navigation success

- [ ] Test 6: Return to Main Menu
  - [ ] Select return option
  - [ ] Wait for main menu
  - [ ] Take snapshot and screenshot
  - [ ] Validate return success

## Success Criteria

All tests must pass with:
- ✓ Login flow completes successfully
- ✓ User is authenticated
- ✓ Main menu displays with all options
- ✓ Navigation to Messages works
- ✓ Navigation to Doors works
- ✓ Return to main menu works
- ✓ All frames within 80 characters
- ✓ All borders properly aligned

## Troubleshooting

**Issue**: Password prompt doesn't appear
- Check handle is correct
- Check user exists in database
- Check server logs for errors

**Issue**: Main menu doesn't display after login
- Check authentication is successful
- Check session is created
- Check server logs for errors

**Issue**: Navigation commands not recognized
- Document the exact command used
- Check menu for valid command options
- Try alternative commands (M, MSG, MESSAGES, etc.)

**Issue**: Cannot return to main menu
- Document the return command used
- Check submenu for return option
- Try alternative commands (Q, X, M, etc.)

## Notes

- Screenshots are saved to `screenshots/` directory
- All validation functions are in `user-journey-mcp-helpers.ts`
- Test user must exist before running these tests
- Each test should be independent where possible
- Some tests depend on previous state (logged-in session)
