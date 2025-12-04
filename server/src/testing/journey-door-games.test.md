# User Journey Test: Door Games

This test validates door game listing, launching, and ANSI rendering using MCP Chrome DevTools.

**Requirements validated**: 7.1, 7.2, 7.3, 7.4, 7.5

## Test Setup

1. Ensure BBS server is running on port 8080
2. Ensure test user is logged in
3. Chrome DevTools MCP should be configured
4. Door games should be available (Art Studio, Oracle, etc.)

## Test Steps

### Test 1: Door Game Listing

**Objective**: Verify door games list displays correctly

**Steps**:
1. From main menu, navigate to Doors
2. Wait for door games list to display
3. Take snapshot and screenshot
4. Validate door games list content

**Expected Results**:
- Door games list displays
- Each door shows name and description
- Frame formatting is maintained
- Width constraints are respected (80 chars max)
- Selection options are clear

**MCP Commands**:
```javascript
// Navigate to Doors from main menu
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
  filePath: 'screenshots/journey_door_list.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width (CRITICAL for door games)
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'All lines should be within 80 characters');

if (!widthValidation.allLinesValid) {
  console.error('Width violations found:', widthValidation.violations);
}

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 'Frame borders should be aligned');

// Validate door games list appears
console.assert(
  snapshot.content.toLowerCase().includes('door') ||
  snapshot.content.toLowerCase().includes('game'),
  'Door games list should appear'
);

// Validate at least one door game is shown
const hasDoorGame = 
  snapshot.content.toLowerCase().includes('oracle') ||
  snapshot.content.toLowerCase().includes('art studio') ||
  snapshot.content.toLowerCase().includes('studio');
console.assert(hasDoorGame, 'At least one door game should be listed');
```

### Test 2: Door Game Launching

**Objective**: Verify door game can be launched

**Steps**:
1. From door games list, select a door game (e.g., Art Studio)
2. Wait for door game to launch
3. Take snapshot and screenshot
4. Validate door game launched successfully

**Expected Results**:
- Door game launches
- Introduction/welcome screen displays
- ANSI art renders correctly
- Width constraints are respected (80 chars max)
- Frame borders are aligned

**MCP Commands**:
```javascript
// Select first door game (usually option 1)
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: '1' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for door game to launch
await mcp_chrome_devtools_wait_for({ 
  text: 'Welcome', 
  timeout: 5000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_door_launched.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width (CRITICAL for door games)
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'All lines in door game should be within 80 characters');

if (!widthValidation.allLinesValid) {
  console.error('Width violations in door game:', widthValidation.violations);
  // This is a CRITICAL bug - door games MUST respect 80-char limit
}

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 
  'Door game frame borders should be aligned');

// Validate door game launched
console.assert(
  snapshot.content.toLowerCase().includes('welcome') ||
  snapshot.content.toLowerCase().includes('art studio') ||
  snapshot.content.toLowerCase().includes('oracle'),
  'Door game should launch successfully'
);
```

### Test 3: ANSI Rendering in Door Games

**Objective**: Verify ANSI art renders within 80 characters

**Steps**:
1. While in door game, observe ANSI art rendering
2. Take multiple snapshots at different points
3. Take screenshots for visual verification
4. Validate all ANSI content respects width limits

**Expected Results**:
- All ANSI art lines are within 80 characters
- ANSI color codes render correctly
- Box-drawing characters display properly
- No line wrapping or overflow
- Frame borders are aligned

**MCP Commands**:
```javascript
// Take snapshot of current door game state
const snapshot1 = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_door_ansi_1.png' 
});

// Interact with door game (if applicable)
// For Art Studio, might create art
// For Oracle, might ask a question

// Take another snapshot after interaction
const snapshot2 = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_door_ansi_2.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width for all snapshots
[snapshot1, snapshot2].forEach((snapshot, index) => {
  const widthValidation = validateLineWidth(snapshot.content, 80);
  console.assert(widthValidation.allLinesValid, 
    `Snapshot ${index + 1}: All lines should be within 80 characters`);
  
  if (!widthValidation.allLinesValid) {
    console.error(`Snapshot ${index + 1} width violations:`, widthValidation.violations);
  }
  
  // Validate frame borders
  const frameValidation = validateFrameBorders(snapshot.content);
  console.assert(frameValidation.bordersAligned, 
    `Snapshot ${index + 1}: Frame borders should be aligned`);
});

// Check for ANSI color codes
const hasColorCodes = /\x1b\[[0-9;]*m/.test(snapshot1.content);
console.assert(hasColorCodes, 'ANSI color codes should be present');

// Check for box-drawing characters
const hasBoxDrawing = /[─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬]/.test(snapshot1.content);
console.assert(hasBoxDrawing, 'Box-drawing characters should be present');
```

### Test 4: Frame Alignment in Doors

**Objective**: Verify frame borders are properly aligned in door games

**Steps**:
1. While in door game, examine frame structure
2. Take snapshot
3. Validate frame alignment

**Expected Results**:
- Top border is present and aligned
- Bottom border is present and aligned
- Left border is present and aligned
- Right border is present and aligned
- All frame lines have consistent width
- No misaligned borders

**Validation**:
```typescript
import { validateFrameBorders } from './user-journey-mcp-helpers';

const snapshot = await mcp_chrome_devtools_take_snapshot();

const frameValidation = validateFrameBorders(snapshot.content);

console.assert(frameValidation.hasTopBorder, 'Door game should have top border');
console.assert(frameValidation.hasBottomBorder, 'Door game should have bottom border');
console.assert(frameValidation.hasLeftBorder, 'Door game should have left border');
console.assert(frameValidation.hasRightBorder, 'Door game should have right border');
console.assert(frameValidation.bordersAligned, 'Door game borders should be aligned');

if (frameValidation.issues.length > 0) {
  console.error('Frame alignment issues:', frameValidation.issues);
}
```

### Test 5: Door Game Interaction

**Objective**: Verify door game interaction works correctly

**Steps**:
1. Interact with door game (create art, ask question, etc.)
2. Wait for response
3. Take snapshot and screenshot
4. Validate response and formatting

**Expected Results**:
- Door game accepts input
- Response is generated
- Response is formatted correctly
- Width constraints are respected
- Frame borders are aligned

**MCP Commands (Art Studio Example)**:
```javascript
// In Art Studio, create some art
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'Create a sunset scene' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for art to be generated
await mcp_chrome_devtools_wait_for({ 
  text: 'art', 
  timeout: 10000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_door_interaction.png' 
});
```

**MCP Commands (Oracle Example)**:
```javascript
// In Oracle, ask a question
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'What does the future hold?' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for oracle response
await mcp_chrome_devtools_wait_for({ 
  text: 'oracle', 
  timeout: 10000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_oracle_response.png' 
});
```

**Validation**:
```typescript
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

// Validate width
const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 
  'Door game response should be within 80 characters');

// Validate frame borders
const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 
  'Door game response frame should be aligned');

// Validate response was generated
console.assert(snapshot.content.length > 200, 
  'Door game should generate a response');
```

### Test 6: Exit Door Game

**Objective**: Verify user can exit door game and return to menu

**Steps**:
1. From door game, select exit option
2. Wait for door games list or main menu
3. Take snapshot and screenshot
4. Validate successful exit

**Expected Results**:
- Exit option is available
- Exit returns to door games list or main menu
- Frame formatting is maintained
- No errors occur

**MCP Commands**:
```javascript
// Exit door game (usually 'Q' or 'X')
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input', 
  value: 'Q' 
});

await mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for door list or main menu
await mcp_chrome_devtools_wait_for({ 
  text: 'menu', 
  timeout: 3000 
});

// Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/journey_door_exit.png' 
});
```

**Validation**:
```typescript
// Validate exit successful
console.assert(
  snapshot.content.toLowerCase().includes('menu') ||
  snapshot.content.toLowerCase().includes('door'),
  'Should return to menu after exiting door game'
);
```

## Test Execution Checklist

- [ ] Test 1: Door Game Listing
  - [ ] Navigate to Doors
  - [ ] Wait for door games list
  - [ ] Take snapshot and screenshot
  - [ ] Validate list content and width

- [ ] Test 2: Door Game Launching
  - [ ] Select door game
  - [ ] Wait for door to launch
  - [ ] Take snapshot and screenshot
  - [ ] Validate launch success and width

- [ ] Test 3: ANSI Rendering in Door Games
  - [ ] Observe ANSI art
  - [ ] Take multiple snapshots
  - [ ] Take screenshots
  - [ ] Validate width constraints (80 chars)

- [ ] Test 4: Frame Alignment in Doors
  - [ ] Examine frame structure
  - [ ] Take snapshot
  - [ ] Validate all borders aligned

- [ ] Test 5: Door Game Interaction
  - [ ] Interact with door game
  - [ ] Wait for response
  - [ ] Take snapshot and screenshot
  - [ ] Validate response and formatting

- [ ] Test 6: Exit Door Game
  - [ ] Select exit option
  - [ ] Wait for menu
  - [ ] Take snapshot and screenshot
  - [ ] Validate successful exit

## Success Criteria

All tests must pass with:
- ✓ Door games list displays correctly
- ✓ Door games launch successfully
- ✓ ALL ANSI content within 80 characters
- ✓ ALL frame borders properly aligned
- ✓ ANSI colors render correctly
- ✓ Box-drawing characters display properly
- ✓ Door game interaction works
- ✓ Exit returns to menu

## Critical Requirements

**80-Character Width Enforcement** (Requirements 7.3, 12.1):
- This is CRITICAL for door games
- Every line of ANSI art MUST be within 80 characters
- Any violation is a bug that must be fixed
- Document all violations with line numbers and widths

**Frame Border Alignment** (Requirements 7.5, 12.3):
- All frame borders must be properly aligned
- Top, bottom, left, and right borders must be present
- Frame width must be consistent
- Any misalignment is a bug that must be fixed

## Troubleshooting

**Issue**: Door games list doesn't display
- Check door games are configured
- Check user has access
- Check server logs for errors

**Issue**: Door game doesn't launch
- Check door game is available
- Check door game code has no errors
- Check server logs for errors

**Issue**: ANSI art exceeds 80 characters
- This is a CRITICAL BUG (Requirements 7.3, 12.1 violation)
- Document with screenshots and line numbers
- Check DoorHandler width enforcement
- Check ANSIRenderingService configuration

**Issue**: Frame borders misaligned
- This is a BUG (Requirements 7.5, 12.3 violation)
- Document with screenshots
- Check ANSIFrameBuilder configuration
- Check door game rendering code

**Issue**: Cannot exit door game
- Document the exit command used
- Check door game for exit option
- Try alternative commands (Q, X, EXIT, etc.)

## Notes

- Screenshots are saved to `screenshots/` directory
- All validation functions are in `user-journey-mcp-helpers.ts`
- Test user must be logged in before running these tests
- Door games must be available and configured
- Width validation is CRITICAL for door games
- Any width violation is a bug that must be fixed
- Frame alignment is CRITICAL for visual quality
