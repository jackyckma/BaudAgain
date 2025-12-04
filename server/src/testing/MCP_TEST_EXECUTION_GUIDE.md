# MCP Test Execution Guide

## Overview

This guide provides step-by-step instructions for executing the BaudAgain BBS user journey tests using Chrome DevTools MCP (Model Context Protocol). It covers setup, execution, validation, and troubleshooting.

**Target Audience**: Developers, QA engineers, and anyone testing the BBS system
**Prerequisites**: Basic understanding of terminal interfaces and browser testing
**Time Required**: 30-60 minutes for complete test suite

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Test Data Setup](#test-data-setup)
4. [Running Tests](#running-tests)
5. [Validation and Results](#validation-and-results)
6. [Troubleshooting](#troubleshooting)
7. [Common Issues](#common-issues)

## Prerequisites

### Required Software

- **Node.js**: v18 or higher
- **Chrome Browser**: Latest version
- **Kiro IDE**: With MCP Chrome DevTools configured
- **BaudAgain BBS**: Server code checked out

### Required Configuration

1. **MCP Chrome DevTools Server**
   - Location: `.kiro/settings/mcp.json`
   - Should contain Chrome DevTools MCP server configuration
   - Verify with: Check Kiro MCP panel shows Chrome DevTools available

2. **Environment Variables**
   - `.env` file in server directory
   - `OPENAI_API_KEY` set (for AI feature tests)
   - `JWT_SECRET` set
   - `PORT=3001` (or your preferred port)

3. **Database**
   - SQLite database initialized
   - Located at `server/data/bbs.db`
   - Schema up to date

### Verify Prerequisites

Run these commands to verify your setup:

```bash
# Check Node.js version
node --version  # Should be v18+

# Check server dependencies
cd server
npm install

# Check database exists
ls -la data/bbs.db

# Check environment variables
cat .env | grep -E "OPENAI_API_KEY|JWT_SECRET|PORT"
```


## Environment Setup

### Step 1: Start the BBS Server

```bash
cd server
npm run dev
```

**Expected Output**:
```
🚀 BaudAgain BBS Server starting...
📊 Database initialized
🌐 HTTP server listening on port 3001
🔌 WebSocket server ready
✅ Server ready at http://localhost:3001
```

**Verify Server is Running**:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok"}
```

### Step 2: Verify Terminal Client

Open browser to: `http://localhost:8080`

**Expected Behavior**:
- Terminal interface loads
- Welcome screen displays
- Prompt appears: "Enter your handle:"

**If Terminal Doesn't Load**:
- Check server logs for errors
- Verify port 8080 is not in use
- Check browser console for JavaScript errors

### Step 3: Configure MCP Chrome DevTools

1. Open Kiro IDE
2. Open MCP panel (View → MCP Servers)
3. Verify "Chrome DevTools" server is listed and connected
4. If not connected, restart Kiro

**Test MCP Connection**:
```typescript
// In Kiro, ask to run this MCP command:
mcp_chrome_devtools_list_pages()
// Should return list of open browser tabs
```


## Test Data Setup

### Automated Setup (Recommended)

Run the test data setup script:

```bash
cd server
npx tsx src/testing/setup-journey-test-data.ts
```

**What This Creates**:
- Test user: `JourneyVet` with password `VetPass456!`
- Test message base: "General Discussion"
- Test messages with proper author handles
- Verifies data integrity

**Expected Output**:
```
🔧 Setting up test data for user journey tests...
✅ Test user created: JourneyVet
✅ Message base created: General Discussion
✅ Test message 1 created
✅ Test message 2 created
✅ Test message 3 created
✅ Author handles verified - all correct
✅ Test data setup complete!
```

### Manual Setup (Alternative)

If automated setup fails, create test data manually:

#### 1. Create Test User via API

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "JourneyVet",
    "password": "VetPass456!",
    "realName": "Journey Veteran",
    "location": "Test City"
  }'
```

#### 2. Login to Get Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "JourneyVet",
    "password": "VetPass456!"
  }'
```

Save the returned token for next steps.

#### 3. Create Message Base

```bash
curl -X POST http://localhost:3001/api/message-bases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "General Discussion",
    "description": "General discussion for testing",
    "accessLevelRead": 0,
    "accessLevelWrite": 10
  }'
```

#### 4. Create Test Messages

```bash
# Get message base ID from previous response, then:
curl -X POST http://localhost:3001/api/message-bases/BASE_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "subject": "Test Message 1",
    "body": "This is a test message for journey testing."
  }'
```

Repeat for 2-3 test messages.

### Verify Test Data

```bash
# Check user exists
curl http://localhost:3001/api/users | grep JourneyVet

# Check message bases exist
curl http://localhost:3001/api/message-bases

# Check messages exist
curl http://localhost:3001/api/message-bases/BASE_ID/messages
```


## Running Tests

### Test Execution Order

Execute tests in this order for best results:

1. **Welcome Screen & Registration** (15 min)
2. **Login & Navigation** (10 min)
3. **Message Functionality** (15 min)
4. **Door Games** (10 min)
5. **AI Features** (15 min)

**Total Time**: ~60 minutes

### Test Suite 1: Welcome Screen & Registration

**File**: `journey-welcome-registration.test.md`
**Time**: ~15 minutes
**Requirements**: 1.1, 1.2, 1.4, 1.5, 2.1-2.5

#### Steps:

1. **Open Test Document**
   ```bash
   # In Kiro, open:
   server/src/testing/journey-welcome-registration.test.md
   ```

2. **Navigate to Terminal**
   - Ask Kiro to navigate to `http://localhost:8080`
   - Wait for welcome screen to load

3. **Take Initial Snapshot**
   - Ask Kiro to take a snapshot
   - Ask Kiro to take a screenshot

4. **Validate Welcome Screen**
   - Check for single frame
   - Check for single prompt
   - Validate 80-character width
   - Validate frame borders

5. **Test Registration Flow**
   - Enter "NEW" command
   - Follow registration prompts
   - Enter handle: `TestNewUser`
   - Enter password: `NewPass123!`
   - Complete profile information

6. **Validate Registration**
   - Check account created
   - Check main menu displays
   - Take screenshots at each step

#### Expected Results:

✅ Welcome screen displays with proper ANSI formatting
✅ Exactly ONE prompt appears (no duplicates)
✅ All lines within 80 characters
✅ Frame borders properly aligned
✅ Registration completes successfully
✅ Main menu displays after registration

#### Common Issues:

- **Multiple prompts**: Bug in welcome screen rendering
- **Lines exceed 80 chars**: Width enforcement not working
- **Misaligned borders**: Frame builder issue
- **Registration fails**: Check database and validation


### Test Suite 2: Login & Navigation

**File**: `journey-login-navigation.test.md`
**Time**: ~10 minutes
**Requirements**: 3.1-3.5

#### Steps:

1. **Navigate to Terminal** (if not already there)
   - Refresh page or navigate to `http://localhost:8080`

2. **Login with Test User**
   - Enter handle: `JourneyVet`
   - Enter password: `VetPass456!`

3. **Validate Main Menu**
   - Check personalized greeting appears
   - Check all menu options present
   - Validate formatting

4. **Test Navigation**
   - Navigate to Messages (M)
   - Return to main menu (Q)
   - Navigate to Doors (D)
   - Return to main menu (Q)

5. **Take Screenshots**
   - Main menu
   - Each submenu
   - Return to main menu

#### Expected Results:

✅ Login succeeds with correct credentials
✅ Personalized greeting displays
✅ Main menu shows all options
✅ Navigation to Messages works
✅ Navigation to Doors works
✅ Return to main menu works

### Test Suite 3: Message Functionality

**File**: `journey-message-functionality.test.md`
**Time**: ~15 minutes
**Requirements**: 4.1-4.5, 5.1-5.5, 6.1-6.5

#### Steps:

1. **Navigate to Messages**
   - From main menu, enter "M"

2. **Validate Message Base List**
   - Check "General Discussion" appears
   - Check formatting

3. **Enter Message Base**
   - Select message base (usually "1")

4. **Validate Message List**
   - **CRITICAL**: Check author handles are NOT "undefined"
   - Check message subjects display
   - Check dates display
   - Validate formatting

5. **Read a Message**
   - Select a message number
   - Validate full content displays
   - **CRITICAL**: Check author handle is correct
   - Check formatting within 80 characters

6. **Post a New Message**
   - Enter "P" to post
   - Enter subject: "Test Post from Journey"
   - Enter body: "This is a test message."
   - Confirm post

7. **Verify Posted Message**
   - Return to message list
   - Find your posted message
   - **CRITICAL**: Verify author is "JourneyVet" (NOT "undefined")

8. **API Verification**
   - Use API to check message author is correct
   ```bash
   curl http://localhost:3001/api/message-bases/BASE_ID/messages
   ```

#### Expected Results:

✅ Message base list displays
✅ Message list shows correct author handles
✅ NO "undefined" authors appear
✅ Message reading displays full content
✅ Message posting works
✅ Posted message has correct author
✅ API confirms author correctness

#### Critical Checks:

🔴 **Author Handle Validation**
- If ANY message shows "by undefined", this is a BUG
- Take screenshot immediately
- Document which messages show undefined
- Check MessageRepository and MessageHandler


### Test Suite 4: Door Games

**File**: `journey-door-games.test.md`
**Time**: ~10 minutes
**Requirements**: 7.1-7.5

#### Steps:

1. **Navigate to Door Games**
   - From main menu, enter "D"

2. **Validate Door Games List**
   - Check door games display
   - Check formatting

3. **Launch a Door Game**
   - Select a door (e.g., "1" for Art Studio)

4. **Validate ANSI Rendering**
   - **CRITICAL**: Check all lines within 80 characters
   - **CRITICAL**: Check frame borders aligned
   - Check ANSI colors display
   - Check box-drawing characters render

5. **Interact with Door**
   - Follow door game prompts
   - Test basic functionality

6. **Exit Door Game**
   - Exit door (usually "Q" or "X")
   - Verify return to main menu

#### Expected Results:

✅ Door games list displays
✅ Door game launches successfully
✅ All lines within 80 characters
✅ Frame borders properly aligned
✅ ANSI colors render correctly
✅ Box-drawing characters display
✅ Exit returns to main menu

#### Critical Checks:

🔴 **Width Enforcement**
- If ANY line exceeds 80 characters, this is a BUG
- Take screenshot showing the violation
- Document line numbers and widths
- Check DoorHandler and ANSIRenderingService

🔴 **Frame Alignment**
- If borders are misaligned, this is a BUG
- Take screenshot showing misalignment
- Check ANSIFrameBuilder

### Test Suite 5: AI Features

**File**: `journey-ai-features.test.md`
**Time**: ~15 minutes
**Requirements**: 8.1-8.5, 9.1-9.5, 10.1-10.5

#### Steps:

1. **Test Conversation Starters**
   - Navigate to Messages → Message Base
   - Check if conversation starters display
   - Try selecting a starter (if available)

2. **Test Catch Me Up**
   - In message base, enter "C" or "CATCHUP"
   - Wait for summary generation (may take 5-30 seconds)
   - Validate summary displays
   - Check formatting

3. **Test Daily Digest**
   - Logout and login again
   - Check if daily digest notification appears
   - View digest if available
   - Validate formatting

4. **Test Error Handling**
   - Try AI features when service unavailable
   - Check error messages are helpful

#### Expected Results:

✅ Conversation starters display (if AI configured)
✅ Conversation starter selection works
✅ Catch me up command available
✅ Summary generates successfully
✅ Daily digest shows on login
✅ Error messages are helpful

#### Notes:

- AI features require OpenAI API key
- Responses may take 5-30 seconds
- Rate limits may apply
- Features may be disabled if AI not configured


## Validation and Results

### Using Validation Functions

The test suite includes helper functions for automated validation:

```typescript
import {
  validateLineWidth,
  validateFrameBorders,
  validateAuthorDisplay,
  countPrompts
} from './user-journey-mcp-helpers';
```

#### Width Validation

```typescript
// Get page content
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Validate width
const validation = validateLineWidth(snapshot.content, 80);

console.log('Max width:', validation.maxWidth);
console.log('All lines valid:', validation.allLinesValid);

if (!validation.allLinesValid) {
  console.log('Violations:', validation.violations);
  // violations contains: { lineNumber, width, content }
}
```

#### Frame Border Validation

```typescript
const validation = validateFrameBorders(snapshot.content);

console.log('Has top border:', validation.hasTopBorder);
console.log('Has bottom border:', validation.hasBottomBorder);
console.log('Borders aligned:', validation.bordersAligned);

if (!validation.bordersAligned) {
  console.log('Issues:', validation.issues);
}
```

#### Author Handle Validation

```typescript
const validation = validateAuthorDisplay(snapshot.content);

console.log('Has author:', validation.hasAuthor);
console.log('Author not undefined:', validation.authorNotUndefined);
console.log('Author not null:', validation.authorNotNull);

if (!validation.authorNotUndefined) {
  console.log('⚠️ BUG: Author shows as undefined!');
  console.log('Issues:', validation.issues);
}
```

#### Prompt Counting

```typescript
const validation = countPrompts(snapshot.content);

console.log('Prompt count:', validation.promptCount);
console.log('Single prompt:', validation.singlePrompt);

if (!validation.singlePrompt) {
  console.log('⚠️ BUG: Multiple prompts detected!');
  console.log('Prompts found:', validation.promptText);
}
```

### Screenshot Management

Screenshots are automatically saved with descriptive names:

```typescript
import { generateScreenshotPath } from './user-journey-mcp-helpers';

const path = generateScreenshotPath('welcome_screen');
// Result: screenshots/journey_welcome_screen_2025-12-04T10-30-00.png

await mcp_chrome_devtools_take_screenshot({ filePath: path });
```

### Test Result Logging

Use the test result logger for consistent reporting:

```typescript
import { logTestResult } from './user-journey-mcp-helpers';

logTestResult({
  testName: 'Welcome Screen Display',
  passed: validation.allLinesValid,
  details: {
    maxWidth: validation.maxWidth,
    violations: validation.violations
  },
  timestamp: new Date()
});
```

**Output Format**:
```
✅ PASS: Welcome Screen Display
   Max width: 78
   Violations: []
   Time: 2025-12-04T10:30:00.000Z

❌ FAIL: Author Handle Display
   Author not undefined: false
   Issues: ["Author shows as 'undefined' in message list"]
   Time: 2025-12-04T10:35:00.000Z
```


## Troubleshooting

### MCP Connection Issues

**Problem**: MCP tools not responding or Chrome DevTools not available

**Solutions**:
1. Check MCP configuration in `.kiro/settings/mcp.json`
2. Restart Kiro IDE
3. Verify Chrome browser is running
4. Check MCP panel shows Chrome DevTools connected
5. Try closing and reopening Chrome

**Verify MCP**:
```typescript
// Ask Kiro to run:
mcp_chrome_devtools_list_pages()
// Should return list of open tabs
```

### Server Not Responding

**Problem**: BBS server not accessible or not responding

**Solutions**:
1. Check server is running: `ps aux | grep node`
2. Check server logs for errors
3. Restart server: `npm run dev`
4. Check port 3001 is not in use: `lsof -i :3001`
5. Verify database exists: `ls -la server/data/bbs.db`

**Test Server**:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok"}
```

### Terminal Client Not Loading

**Problem**: Terminal interface doesn't load or shows blank screen

**Solutions**:
1. Check browser console for JavaScript errors (F12)
2. Verify server is serving static files
3. Check WebSocket connection in Network tab
4. Clear browser cache and reload
5. Try different browser

**Check WebSocket**:
- Open browser DevTools (F12)
- Go to Network tab
- Filter by "WS" (WebSocket)
- Should see connection to `ws://localhost:3001/ws`
- Status should be "101 Switching Protocols"

### Test Data Issues

**Problem**: Test user doesn't exist or messages missing

**Solutions**:
1. Re-run test data setup: `npx tsx src/testing/setup-journey-test-data.ts`
2. Check database: `sqlite3 server/data/bbs.db "SELECT * FROM users WHERE handle='JourneyVet'"`
3. Manually create test data using API (see Test Data Setup section)
4. Check for database errors in server logs

### AI Features Not Working

**Problem**: Conversation starters, summaries, or digest not appearing

**Solutions**:
1. Check OpenAI API key is set in `.env`
2. Verify API key is valid
3. Check rate limits haven't been exceeded
4. Check server logs for AI service errors
5. AI responses may take 5-30 seconds - be patient

**Test AI Service**:
```bash
# Check environment variable
cat .env | grep OPENAI_API_KEY

# Test AI endpoint (requires auth token)
curl -X POST http://localhost:3001/api/ai/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Screenshot Issues

**Problem**: Screenshots not saving or path errors

**Solutions**:
1. Create screenshots directory: `mkdir -p screenshots`
2. Check file permissions
3. Use absolute paths if relative paths fail
4. Check disk space

### Width Validation Failures

**Problem**: Lines exceed 80 characters

**This is a BUG** - Document and report:
1. Take screenshot showing the violation
2. Note which screen/component
3. Document line numbers and actual widths
4. Check ANSIRenderingService and width enforcement
5. Report to development team

### Author "undefined" Issues

**Problem**: Messages show "by undefined" instead of author handle

**This is a BUG** - Document and report:
1. Take screenshot showing "undefined"
2. Check which messages are affected
3. Verify test data has proper authors
4. Check MessageRepository query
5. Check MessageHandler display logic
6. Report to development team

### Frame Alignment Issues

**Problem**: Frame borders misaligned or broken

**This is a BUG** - Document and report:
1. Take screenshot showing misalignment
2. Note which screen/component
3. Check ANSIFrameBuilder
4. Check frame width calculations
5. Report to development team


## Common Issues

### Issue: Multiple Prompts on Welcome Screen

**Symptom**: Welcome screen shows more than one "Enter your handle:" prompt

**Requirement Violated**: 1.2

**Cause**: Welcome screen or prompt sent multiple times

**Investigation**:
1. Check `server/src/index.ts` WebSocket connection handler
2. Check `AuthHandler` for duplicate sends
3. Look for multiple calls to `sendWelcomeScreen()`

**Fix**: Ensure welcome screen sent only once per connection

### Issue: Lines Exceed 80 Characters

**Symptom**: Content lines are wider than 80 characters

**Requirements Violated**: 1.3, 7.3, 12.1

**Cause**: Width enforcement not applied or not working

**Investigation**:
1. Check `ANSIRenderingService` width enforcement
2. Check `ANSIFrameBuilder` max width parameter
3. Check `BaseTerminalRenderer` width limits
4. Check `DoorHandler` width enforcement

**Fix**: Apply width enforcement to all rendering paths

### Issue: Author Shows as "undefined"

**Symptom**: Messages display "by undefined" instead of author handle

**Requirements Violated**: 4.5, 5.5

**Cause**: Author handle not populated in query or display

**Investigation**:
1. Check `MessageRepository.getMessages()` query
2. Verify user join and authorHandle population
3. Check `MessageHandler` display logic
4. Test with various message scenarios

**Fix**: Ensure authorHandle populated correctly in query and displayed properly

### Issue: Frame Borders Misaligned

**Symptom**: Frame borders don't line up or are broken

**Requirements Violated**: 1.4, 7.5, 12.3

**Cause**: Frame width calculations incorrect

**Investigation**:
1. Check `ANSIFrameBuilder` border logic
2. Check frame width calculations
3. Check content padding
4. Test with various content lengths

**Fix**: Ensure consistent frame width and proper border alignment

### Issue: AI Features Timeout

**Symptom**: AI features take too long or timeout

**Cause**: AI service slow or rate limited

**Solutions**:
1. Increase timeout values (currently 10-30 seconds)
2. Check OpenAI API status
3. Check rate limits
4. Add loading indicators
5. Implement caching

### Issue: WebSocket Disconnects

**Symptom**: Connection drops during testing

**Cause**: Network issues or server problems

**Solutions**:
1. Check server logs for errors
2. Implement reconnection logic
3. Check for memory leaks
4. Monitor server resources

### Issue: Test Data Corruption

**Symptom**: Test data missing or incorrect

**Cause**: Database issues or concurrent access

**Solutions**:
1. Re-run test data setup
2. Check database integrity
3. Use transactions for test data creation
4. Isolate test data from production data


## Best Practices

### Before Testing

1. **Clean Environment**
   - Fresh database or known test data
   - Server restarted
   - Browser cache cleared
   - No other users connected

2. **Documentation Ready**
   - Test documents open
   - Screenshot directory created
   - Notepad for observations
   - Bug tracking system ready

3. **Time Allocation**
   - Allow 60-90 minutes for full suite
   - Don't rush through tests
   - Take breaks between suites
   - Document as you go

### During Testing

1. **Take Screenshots**
   - Every major screen
   - Every bug or issue
   - Before and after actions
   - Use descriptive filenames

2. **Document Everything**
   - What you did
   - What you expected
   - What actually happened
   - Any error messages

3. **Use Validation Functions**
   - Don't rely on visual inspection alone
   - Run automated validations
   - Log results
   - Save validation output

4. **Be Systematic**
   - Follow test documents in order
   - Complete each step before moving on
   - Don't skip steps
   - Retest if unsure

### After Testing

1. **Compile Results**
   - Organize screenshots
   - Summarize findings
   - List all bugs found
   - Prioritize issues

2. **Report Bugs**
   - Clear description
   - Steps to reproduce
   - Screenshots attached
   - Requirement violated noted

3. **Update Documentation**
   - Note any test issues
   - Update troubleshooting section
   - Document workarounds
   - Suggest improvements

## Quick Reference

### Essential MCP Commands

```typescript
// Navigate
mcp_chrome_devtools_navigate_page({ type: 'url', url: 'http://localhost:8080' })

// Wait for content
mcp_chrome_devtools_wait_for({ text: 'Welcome', timeout: 5000 })

// Take snapshot
mcp_chrome_devtools_take_snapshot()

// Take screenshot
mcp_chrome_devtools_take_screenshot({ filePath: 'screenshots/test.png' })

// Fill input
mcp_chrome_devtools_fill({ uid: 'element_uid', value: 'text' })

// Press key
mcp_chrome_devtools_press_key({ key: 'Enter' })
```

### Essential Validation Functions

```typescript
import {
  validateLineWidth,      // Check 80-char width
  validateFrameBorders,   // Check frame alignment
  validateAuthorDisplay,  // Check for "undefined"
  countPrompts           // Check single prompt
} from './user-journey-mcp-helpers';
```

### Test Data

- **Test User**: `JourneyVet` / `VetPass456!`
- **Server URL**: `http://localhost:8080`
- **API URL**: `http://localhost:3001`
- **Screenshots**: `screenshots/` directory

### Critical Requirements

- ✅ All lines ≤ 80 characters (1.3, 7.3, 12.1)
- ✅ Frame borders aligned (1.4, 7.5, 12.3)
- ✅ No "undefined" authors (4.5, 5.5, 6.4)
- ✅ Single prompt on welcome (1.2)

## Resources

- **Test Documents**: `server/src/testing/journey-*.test.md`
- **Helper Functions**: `server/src/testing/user-journey-mcp-helpers.ts`
- **Test Data Setup**: `server/src/testing/setup-journey-test-data.ts`
- **Test Suite Overview**: `server/src/testing/USER_JOURNEY_TEST_SUITE.md`
- **Requirements**: `.kiro/specs/user-journey-testing-and-fixes/requirements.md`
- **Design**: `.kiro/specs/user-journey-testing-and-fixes/design.md`

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review test suite documentation
3. Check server logs for errors
4. Verify test data is set up correctly
5. Consult development team

## Conclusion

This guide provides everything needed to execute the BaudAgain BBS user journey tests using MCP Chrome DevTools. Follow the steps systematically, use the validation functions, document your findings, and report any bugs discovered.

**Remember**: The goal is to verify the system works correctly and catch bugs before they reach users. Take your time, be thorough, and document everything.

Good luck with your testing! 🚀

