# User Journey Test Suite

Comprehensive MCP-based browser testing for BaudAgain BBS user journey validation.

## Overview

This test suite validates the complete user journey through the BaudAgain BBS system using Chrome DevTools MCP (Model Context Protocol). It covers all critical user flows from welcome screen to AI features.

**Requirements validated**: 1.1, 1.2, 1.4, 1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5, 8.1-8.5, 9.1-9.5, 10.1-10.5, 11.1-11.5

## Test Suite Structure

### 1. Infrastructure (`user-journey-mcp-helpers.ts`)
Core helper functions and utilities for MCP-based testing:
- Test personas and test data generators
- Validation functions (width, frames, authors, prompts)
- API helpers for test data setup
- Screenshot and logging utilities

### 2. Test Data Setup (`setup-journey-test-data.ts`)
Script to create test users, message bases, and messages:
- Creates existing user for login tests
- Creates message bases with test messages
- Verifies test data integrity
- Checks for author handle issues

### 3. Test Suites

#### Welcome Screen and Registration (`journey-welcome-registration.test.md`)
Tests welcome screen display and new user registration:
- Welcome screen displays correctly
- Single frame with proper borders
- Single prompt (no duplicates)
- Registration flow completes
- All content within 80 characters

#### Login and Navigation (`journey-login-navigation.test.md`)
Tests login flow and main menu navigation:
- Login flow authenticates user
- Main menu displays with all options
- Navigation to Messages works
- Navigation to Doors works
- Return to main menu works

#### Message Functionality (`journey-message-functionality.test.md`)
Tests message base and message operations:
- Message base listing displays
- Message list shows author handles (NOT "undefined")
- Message reading displays full content
- Message posting saves with correct author
- Author handles are validated

#### Door Games (`journey-door-games.test.md`)
Tests door game functionality and ANSI rendering:
- Door games list displays
- Door games launch successfully
- ANSI rendering within 80 characters
- Frame borders properly aligned
- Door game interaction works

#### AI Features (`journey-ai-features.test.md`)
Tests AI conversation starters, summaries, and digest:
- Conversation starters display in message bases
- Conversation starter selection works
- Catch me up summary generation
- Daily digest on login
- AI features handle errors gracefully

## Quick Start

### Prerequisites

1. **BBS Server Running**
   ```bash
   cd server
   npm run dev
   ```
   Server should be running on port 8080

2. **Chrome DevTools MCP Configured**
   - MCP server should be configured in `.kiro/settings/mcp.json`
   - Chrome browser should be accessible

3. **AI Service Configured** (for AI feature tests)
   - OpenAI API key set in `.env`
   - AI service enabled

### Setup Test Data

```bash
cd server
npx tsx src/testing/setup-journey-test-data.ts
```

This creates:
- Test user: `JourneyVet` / `VetPass456!`
- Test message bases
- Test messages with proper author handles

### Running Tests

Tests are designed to be run manually using MCP Chrome DevTools. Follow the test documents in order:

1. **Welcome Screen and Registration**
   - Open: `journey-welcome-registration.test.md`
   - Follow test steps using MCP tools
   - Validate results

2. **Login and Navigation**
   - Open: `journey-login-navigation.test.md`
   - Follow test steps using MCP tools
   - Validate results

3. **Message Functionality**
   - Open: `journey-message-functionality.test.md`
   - Follow test steps using MCP tools
   - Validate results

4. **Door Games**
   - Open: `journey-door-games.test.md`
   - Follow test steps using MCP tools
   - Validate results

5. **AI Features**
   - Open: `journey-ai-features.test.md`
   - Follow test steps using MCP tools
   - Validate results

## Test Execution Pattern

Each test follows this pattern:

1. **Navigate** to the appropriate screen
2. **Wait** for content to load
3. **Take snapshot** of page content
4. **Take screenshot** for visual verification
5. **Validate** content using helper functions
6. **Document** results

### Example Test Execution

```javascript
// 1. Navigate
await mcp_chrome_devtools_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:8080' 
});

// 2. Wait
await mcp_chrome_devtools_wait_for({ 
  text: 'Welcome', 
  timeout: 5000 
});

// 3. Take snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// 4. Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: 'screenshots/test_step.png' 
});

// 5. Validate
import { validateLineWidth, validateFrameBorders } from './user-journey-mcp-helpers';

const widthValidation = validateLineWidth(snapshot.content, 80);
console.assert(widthValidation.allLinesValid, 'Width should be within 80 chars');

const frameValidation = validateFrameBorders(snapshot.content);
console.assert(frameValidation.bordersAligned, 'Frames should be aligned');
```

## Validation Functions

### Width Validation
```typescript
import { validateLineWidth } from './user-journey-mcp-helpers';

const validation = validateLineWidth(content, 80);
// Returns: { maxWidth, allLinesValid, violations[] }
```

### Frame Border Validation
```typescript
import { validateFrameBorders } from './user-journey-mcp-helpers';

const validation = validateFrameBorders(content);
// Returns: { hasTopBorder, hasBottomBorder, hasLeftBorder, hasRightBorder, bordersAligned, issues[] }
```

### Author Handle Validation
```typescript
import { validateAuthorDisplay } from './user-journey-mcp-helpers';

const validation = validateAuthorDisplay(content);
// Returns: { hasAuthor, authorNotUndefined, authorNotNull, authorNotEmpty, issues[] }
```

### Prompt Counting
```typescript
import { countPrompts } from './user-journey-mcp-helpers';

const validation = countPrompts(content);
// Returns: { promptCount, singlePrompt, promptText[] }
```

## Critical Requirements

### 80-Character Width Enforcement
**Requirements**: 1.3, 7.3, 12.1

Every line of content MUST be within 80 characters. This is CRITICAL for:
- Welcome screen
- All menus
- Message displays
- Door games
- AI feature displays

Any violation is a bug that must be fixed.

### Frame Border Alignment
**Requirements**: 1.4, 7.5, 12.3

All frame borders must be properly aligned:
- Top border present
- Bottom border present
- Left border present
- Right border present
- Consistent width

Any misalignment is a bug that must be fixed.

### Author Handle Display
**Requirements**: 4.5, 5.5, 6.4

Author handles must NEVER be:
- "undefined"
- "null"
- Empty string

Any occurrence is a bug that must be fixed.

### Single Prompt
**Requirements**: 1.2

Welcome screen must have exactly ONE prompt. Multiple prompts indicate a bug.

## Test Results

### Screenshots
All screenshots are saved to `screenshots/` directory with descriptive names:
```
screenshots/
├── journey_welcome_screen.png
├── journey_registration_prompt.png
├── journey_login_main_menu.png
├── journey_message_list.png
├── journey_door_launched.png
└── ...
```

### Validation Results
Validation results are logged to console with:
- ✓ PASS - Test passed
- ✗ FAIL - Test failed
- ℹ INFO - Informational message

### Bug Documentation
When bugs are found:
1. Take screenshot showing the issue
2. Document the specific requirement violated
3. Note line numbers for width violations
4. Describe the expected vs actual behavior
5. Log validation results showing the failure

## Common Issues and Solutions

### Issue: Welcome screen doesn't load
**Solution**: 
- Check BBS server is running
- Check WebSocket connection
- Check browser console for errors

### Issue: Multiple prompts appear
**Bug**: Requirements 1.2 violation
**Action**: Document with screenshots, report to development team

### Issue: Lines exceed 80 characters
**Bug**: Requirements 1.3, 7.3, 12.1 violation
**Action**: Document line numbers and widths, report to development team

### Issue: Author shows as "undefined"
**Bug**: Requirements 4.5, 5.5 violation
**Action**: Document with screenshots, check MessageRepository and MessageHandler

### Issue: Frame borders misaligned
**Bug**: Requirements 1.4, 7.5, 12.3 violation
**Action**: Document with screenshots, check ANSIFrameBuilder

### Issue: AI features don't work
**Solution**:
- Check OpenAI API key is configured
- Check AI service is running
- Check rate limits
- AI responses may take 5-30 seconds

## Test Coverage

### Requirements Coverage Matrix

| Requirement | Test Suite | Status |
|-------------|-----------|--------|
| 1.1 - Welcome screen display | Welcome & Registration | ✓ |
| 1.2 - Single prompt | Welcome & Registration | ✓ |
| 1.3 - 80-char width | All suites | ✓ |
| 1.4 - Frame alignment | All suites | ✓ |
| 1.5 - Node info footer | Welcome & Registration | ✓ |
| 2.1 - NEW command | Welcome & Registration | ✓ |
| 2.2 - Registration flow | Welcome & Registration | ✓ |
| 2.3 - Handle validation | Welcome & Registration | ✓ |
| 2.4 - Password entry | Welcome & Registration | ✓ |
| 2.5 - Account creation | Welcome & Registration | ✓ |
| 3.1 - Login flow | Login & Navigation | ✓ |
| 3.2 - Main menu | Login & Navigation | ✓ |
| 3.3 - Menu navigation | Login & Navigation | ✓ |
| 3.5 - Personalized greeting | Login & Navigation | ✓ |
| 4.1 - Message base list | Message Functionality | ✓ |
| 4.2 - Message base menu | Message Functionality | ✓ |
| 4.3 - Message display | Message Functionality | ✓ |
| 4.4 - Message subject/author | Message Functionality | ✓ |
| 4.5 - Author handle correct | Message Functionality | ✓ |
| 5.1 - Message reading | Message Functionality | ✓ |
| 5.2 - Full content display | Message Functionality | ✓ |
| 5.3 - Frame formatting | Message Functionality | ✓ |
| 5.4 - Navigation options | Message Functionality | ✓ |
| 5.5 - Author not undefined | Message Functionality | ✓ |
| 6.1 - Post option | Message Functionality | ✓ |
| 6.2 - Subject prompt | Message Functionality | ✓ |
| 6.3 - Body prompt | Message Functionality | ✓ |
| 6.4 - Correct author save | Message Functionality | ✓ |
| 6.5 - Post confirmation | Message Functionality | ✓ |
| 7.1 - Door games list | Door Games | ✓ |
| 7.2 - Door launch | Door Games | ✓ |
| 7.3 - 80-char in doors | Door Games | ✓ |
| 7.4 - ANSI colors | Door Games | ✓ |
| 7.5 - Frame alignment | Door Games | ✓ |
| 8.1 - Starters display | AI Features | ✓ |
| 8.3 - Starter selection | AI Features | ✓ |
| 8.4 - No starters message | AI Features | ✓ |
| 8.5 - Starter caching | AI Features | ✓ |
| 9.1 - Catch me up option | AI Features | ✓ |
| 9.2 - Summary generation | AI Features | ✓ |
| 9.4 - Summary formatting | AI Features | ✓ |
| 9.5 - No messages case | AI Features | ✓ |
| 10.1 - Digest on login | AI Features | ✓ |
| 10.2 - Digest notification | AI Features | ✓ |
| 10.3 - Digest display | AI Features | ✓ |
| 10.5 - Digest formatting | AI Features | ✓ |
| 11.1 - Test infrastructure | All suites | ✓ |

## Next Steps

After completing the test suite:

1. **Document Results**
   - Compile all screenshots
   - Document all bugs found
   - Create summary report

2. **Fix Bugs**
   - Prioritize critical bugs (width, author handles)
   - Fix frame alignment issues
   - Fix duplicate prompt issues

3. **Retest**
   - Run tests again after fixes
   - Verify all bugs are resolved
   - Document improvements

4. **Continuous Testing**
   - Run tests before releases
   - Run tests after major changes
   - Keep test data up to date

## Resources

- **Helper Functions**: `user-journey-mcp-helpers.ts`
- **Test Data Setup**: `setup-journey-test-data.ts`
- **Test Suites**: `journey-*.test.md` files
- **Requirements**: `.kiro/specs/user-journey-testing-and-fixes/requirements.md`
- **Design**: `.kiro/specs/user-journey-testing-and-fixes/design.md`
- **Tasks**: `.kiro/specs/user-journey-testing-and-fixes/tasks.md`

## Support

For questions or issues with the test suite:
1. Check the troubleshooting sections in each test document
2. Review the helper functions documentation
3. Check server logs for errors
4. Verify test data is set up correctly
