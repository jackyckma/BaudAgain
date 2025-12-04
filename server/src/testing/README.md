# MCP-Based User Testing Framework

This directory contains utilities and helpers for automated user testing of BaudAgain BBS using the Chrome DevTools Model Context Protocol (MCP).

## Overview

The MCP-based testing framework enables comprehensive end-to-end testing of:
- Terminal client interface and ANSI rendering
- User registration and login flows
- Message base functionality
- Door game interactions
- Control panel administration
- REST API endpoints
- WebSocket notifications

## Prerequisites

1. **Chrome DevTools MCP Server**: The Chrome DevTools MCP server must be configured and running
2. **BBS Server**: The BaudAgain server must be running (`npm run dev` in the server directory)
3. **Test Data**: Test users and message bases should be set up (see Test Data section)

## Test Personas

The framework provides three predefined test personas:

### NEW_USER
- **Handle**: TestNewbie
- **Purpose**: Testing new user registration flow
- **Access Level**: Default (10)

### RETURNING_USER
- **Handle**: TestVeteran
- **Purpose**: Testing returning user login and general functionality
- **Access Level**: Default (10)

### ADMIN_USER
- **Handle**: TestAdmin
- **Purpose**: Testing administrative functions
- **Access Level**: Admin (255)

## Test Scenarios

### 1. New User Registration
Tests the complete registration flow including:
- Welcome screen display
- NEW command handling
- Handle and password entry
- AI SysOp welcome message
- Main menu display

**Requirements Validated**: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 5.1

### 2. Returning User Login
Tests the login flow for existing users:
- Welcome screen display
- Credential entry
- AI SysOp greeting
- Last login date display
- New message count

**Requirements Validated**: 2.5, 5.2

### 3. Message Base Interaction
Tests message base functionality:
- Message base list display
- Message reading with proper formatting
- Message posting
- Message persistence

**Requirements Validated**: 4.1, 4.2, 4.3, 4.4, 4.5

### 4. Door Game Play
Tests The Oracle door game:
- Door games menu
- Oracle introduction screen
- Question/answer interaction
- Response formatting and length
- Exit navigation

**Requirements Validated**: 7.1, 7.2, 7.3, 7.4, 7.5

### 5. Control Panel Administration
Tests control panel functionality:
- Dashboard display
- User management
- Message base management
- AI settings

**Requirements Validated**: 8.1, 8.2, 8.3, 8.4, 8.5

## Using the MCP Testing Tools

### Basic Browser Automation

The Chrome DevTools MCP provides these key tools:

```typescript
// Navigate to a URL
mcp_chrome_devtools_navigate_page({ type: 'url', url: 'http://localhost:8080' })

// Take a snapshot of the page
mcp_chrome_devtools_take_snapshot()

// Take a screenshot
mcp_chrome_devtools_take_screenshot({ filePath: 'screenshots/welcome.png' })

// Fill in a form field
mcp_chrome_devtools_fill({ uid: 'element_uid', value: 'text' })

// Click an element
mcp_chrome_devtools_click({ uid: 'element_uid' })

// Wait for text to appear
mcp_chrome_devtools_wait_for({ text: 'Welcome', timeout: 5000 })

// Evaluate JavaScript
mcp_chrome_devtools_evaluate_script({ 
  function: '() => { return document.title }' 
})
```

### Validation Helpers

The framework provides validation helpers for common checks:

```typescript
import { VALIDATORS } from './mcp-helpers';

// Validate welcome screen
const result = VALIDATORS.validateWelcomeScreen(content);
if (!result.valid) {
  console.log('Issues:', result.issues);
}

// Validate AI SysOp message
const aiResult = VALIDATORS.validateAISysOpMessage(content, 500);

// Validate Oracle response
const oracleResult = VALIDATORS.validateOracleResponse(content);

// Validate menu display
const menuResult = VALIDATORS.validateMenuDisplay(content, [
  'Message Bases',
  'Door Games',
  'Page SysOp'
]);

// Validate message display
const msgResult = VALIDATORS.validateMessageDisplay(content);
```

### ANSI Formatting Validation

```typescript
import { validateANSIFormatting } from './mcp-helpers';

const validation = validateANSIFormatting(terminalContent);
console.log('Has color codes:', validation.hasColorCodes);
console.log('Has box drawing:', validation.hasBoxDrawing);
console.log('Color codes found:', validation.colorCodesFound);
console.log('Issues:', validation.issues);
```

### Response Time Validation

```typescript
import { validateResponseTime } from './mcp-helpers';

const startTime = Date.now();
// ... perform action ...
const endTime = Date.now();

const validation = validateResponseTime(startTime, endTime, 5000);
console.log('Response time:', validation.responseTimeMs, 'ms');
console.log('Within limit:', validation.withinLimit);
```

### Length Validation

```typescript
import { validateLength } from './mcp-helpers';

const validation = validateLength(aiResponse, 500);
console.log('Length:', validation.length, 'characters');
console.log('Within limit:', validation.withinLimit);
```

## Test Data Setup

Before running tests, ensure test data is set up:

### 1. Create Test Users

Use the REST API or terminal to create test users:

```bash
# Create returning user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "TestVeteran",
    "password": "VetPass456!",
    "realName": "Test Veteran",
    "location": "Test Town"
  }'

# Create admin user (requires manual database update for access level)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "TestAdmin",
    "password": "AdminPass789!",
    "realName": "Test Administrator"
  }'
```

### 2. Create Test Message Bases

Use the control panel or API to create test message bases:

```bash
curl -X POST http://localhost:3001/api/message-bases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "name": "Test General",
    "description": "General discussion for testing",
    "accessLevelRead": 0,
    "accessLevelWrite": 10
  }'
```

### 3. Create Test Messages

```bash
curl -X POST http://localhost:3001/api/message-bases/<base_id>/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{
    "subject": "Test Message",
    "body": "This is a test message for automated testing."
  }'
```

## Screenshot Organization

Screenshots are saved to the `screenshots/` directory with descriptive filenames:

```
screenshots/
├── New_User_Registration_welcome_screen_2025-12-03T10-30-00.png
├── New_User_Registration_registration_prompt_2025-12-03T10-30-05.png
├── Returning_User_Login_login_prompt_2025-12-03T10-31-00.png
└── ...
```

Use the `generateScreenshotFilename()` helper to create consistent filenames:

```typescript
import { generateScreenshotFilename } from './mcp-helpers';

const filename = generateScreenshotFilename('New User Registration', 'Welcome Screen');
// Result: screenshots/New_User_Registration_Welcome_Screen_2025-12-03T10-30-00.png
```

## Running Tests

### Manual Testing with MCP

1. Start the BBS server: `npm run dev` (in server directory)
2. Open Kiro with MCP Chrome DevTools configured
3. Use MCP tools to navigate and interact with the BBS
4. Use validation helpers to verify output
5. Take screenshots at each step
6. Document results

### Example Test Flow

```typescript
// 1. Navigate to terminal
await mcp_chrome_devtools_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:8080' 
});

// 2. Wait for welcome screen
await mcp_chrome_devtools_wait_for({ 
  text: 'Welcome', 
  timeout: 5000 
});

// 3. Take screenshot
await mcp_chrome_devtools_take_screenshot({ 
  filePath: generateScreenshotFilename('Registration', 'Welcome') 
});

// 4. Get page content
const snapshot = await mcp_chrome_devtools_take_snapshot();

// 5. Validate welcome screen
const validation = VALIDATORS.validateWelcomeScreen(snapshot.content);
console.log('Welcome screen valid:', validation.valid);

// 6. Enter NEW command
await mcp_chrome_devtools_fill({ 
  uid: 'terminal_input_uid', 
  value: 'NEW' 
});

// ... continue test flow
```

## Requirements Coverage

This testing framework validates all requirements from the specification:

- **Requirement 1**: Basic BBS Connectivity (1.1-1.5)
- **Requirement 2**: User Registration and Authentication (2.1-2.6)
- **Requirement 3**: Main Menu Navigation (3.1-3.5)
- **Requirement 4**: Message Base System (4.1-4.5)
- **Requirement 5**: AI SysOp Welcome and Assistance (5.1-5.5)
- **Requirement 7**: The Oracle Door Game (7.1-7.5)
- **Requirement 8**: SysOp Control Panel (8.1-8.5)
- **Requirement 13**: ANSI Rendering (13.1-13.5)
- **Requirement 15**: Rate Limiting and Security (15.1-15.5)
- **Requirement 16**: REST API Foundation (16.1-16.4)
- **Requirement 17**: WebSocket Notification System (17.1-17.4)
- **Requirement 18**: Hybrid Client Support (18.1-18.3)

## Troubleshooting

### MCP Connection Issues

If MCP tools are not working:
1. Verify Chrome DevTools MCP server is configured in `.kiro/settings/mcp.json`
2. Check that Chrome is running and accessible
3. Restart Kiro if needed

### BBS Server Not Responding

If the BBS server is not responding:
1. Check that the server is running: `npm run dev`
2. Verify the server is listening on the correct port (default: 3001)
3. Check server logs for errors

### Terminal Not Loading

If the terminal client doesn't load:
1. Verify the terminal client is built: `npm run build` in client/terminal
2. Check that the server is serving static files correctly
3. Open browser console for JavaScript errors

### Screenshots Not Saving

If screenshots are not saving:
1. Ensure the `screenshots/` directory exists
2. Check file permissions
3. Verify the file path is correct

## Next Steps

After setting up the testing framework:

1. **Task 38.2**: Create test user personas and scenarios (documented above)
2. **Task 39**: Test new user registration flow
3. **Task 40**: Test returning user login flow
4. **Task 41**: Test main menu navigation
5. **Task 42**: Test message base functionality
6. **Task 43**: Test AI SysOp interaction
7. **Task 44**: Test door game functionality
8. **Task 45**: Test control panel functionality
9. **Task 46**: Test REST API via MCP
10. **Task 47**: Test WebSocket notifications via MCP
11. **Task 48**: Test error handling and edge cases
12. **Task 49**: Multi-user scenario testing
13. **Task 50**: Create demo-readiness report

## References

- [Chrome DevTools MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools)
- [BaudAgain Requirements](../../.kiro/specs/baudagain/requirements.md)
- [BaudAgain Design](../../.kiro/specs/baudagain/design.md)
- [BaudAgain Tasks](../../.kiro/specs/baudagain/tasks.md)
