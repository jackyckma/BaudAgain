# MCP-Based Testing Guide for BaudAgain BBS

## Quick Start

This guide provides step-by-step instructions for using the Chrome DevTools MCP to test BaudAgain BBS.

## Prerequisites Checklist

- [x] Chrome DevTools MCP server is available (verified)
- [x] BBS server is running on port 3001
- [x] Terminal client is accessible at http://localhost:8080
- [x] Control panel is accessible at http://localhost:3000
- [x] Testing utilities are available in `server/src/testing/mcp-helpers.ts`

## MCP Tools Available

### Navigation
- `mcp_chrome_devtools_navigate_page` - Navigate to URLs
- `mcp_chrome_devtools_list_pages` - List open browser tabs
- `mcp_chrome_devtools_select_page` - Switch between tabs

### Interaction
- `mcp_chrome_devtools_fill` - Fill form fields
- `mcp_chrome_devtools_click` - Click elements
- `mcp_chrome_devtools_press_key` - Press keyboard keys
- `mcp_chrome_devtools_hover` - Hover over elements

### Observation
- `mcp_chrome_devtools_take_snapshot` - Get text content of page
- `mcp_chrome_devtools_take_screenshot` - Capture visual screenshot
- `mcp_chrome_devtools_wait_for` - Wait for text to appear

### Advanced
- `mcp_chrome_devtools_evaluate_script` - Execute JavaScript
- `mcp_chrome_devtools_list_console_messages` - Get console logs
- `mcp_chrome_devtools_list_network_requests` - Monitor network traffic

## Test Execution Workflow

### Phase 1: Setup (Task 38.1 - COMPLETE)

✅ **Verified**: Chrome DevTools MCP is configured and working
✅ **Verified**: Basic browser automation works (navigation, snapshots, screenshots)
✅ **Created**: Testing helper utilities in `server/src/testing/mcp-helpers.ts`
✅ **Created**: Comprehensive documentation in `server/src/testing/README.md`
✅ **Created**: Example test in `server/src/testing/example-test.md`

### Phase 2: Test Data Setup (Task 38.2)

**Test Personas** (defined in `mcp-helpers.ts`):
- NEW_USER: TestNewbie / TestPass123!
- RETURNING_USER: TestVeteran / VetPass456!
- ADMIN_USER: TestAdmin / AdminPass789!

**Test Scenarios** (defined in `mcp-helpers.ts`):
1. New User Registration
2. Returning User Login
3. Message Base Interaction
4. Door Game Play
5. Control Panel Administration

**Setup Steps**:
1. Create test users via REST API or terminal
2. Create test message bases
3. Create test messages
4. Verify test data exists

### Phase 3: Terminal Testing (Tasks 39-44)

#### Task 39: New User Registration Flow
```
1. Navigate to http://localhost:8080
2. Wait for welcome screen
3. Verify ANSI formatting (box-drawing, colors)
4. Take screenshot
5. Enter "NEW" command
6. Fill registration form (handle, password, profile)
7. Verify AI SysOp welcome message
8. Verify main menu displays
9. Take screenshots at each step
```

#### Task 40: Returning User Login Flow
```
1. Navigate to http://localhost:8080
2. Enter existing handle
3. Enter password
4. Verify AI SysOp greeting
5. Verify last login date
6. Verify new message count
7. Take screenshots
```

#### Task 41: Main Menu Navigation
```
1. Login as returning user
2. Verify main menu displays
3. Test each menu option:
   - Message Bases
   - Door Games
   - User List
   - Page SysOp
   - Profile
4. Test return to main menu from submenus
5. Test invalid command handling
6. Take screenshots
```

#### Task 42: Message Base Functionality
```
1. Navigate to Message Bases
2. Verify message base list
3. Enter a message base
4. Read existing messages
5. Verify message formatting (subject, author, timestamp)
6. Post a new message
7. Verify message appears
8. Take screenshots
```

#### Task 43: AI SysOp Interaction
```
1. Navigate to Page SysOp
2. Enter a question
3. Measure response time (should be < 5 seconds)
4. Verify AI response formatting
5. Verify ANSI color codes
6. Verify response length (< 500 chars)
7. Take screenshots
```

#### Task 44: Door Game Functionality
```
1. Navigate to Door Games
2. Verify door games list
3. Enter The Oracle
4. Verify introduction screen
5. Ask a question
6. Verify AI response (mystical tone, < 150 chars)
7. Verify mystical symbols present
8. Exit door game
9. Verify return to menu
10. Take screenshots
```

### Phase 4: Control Panel Testing (Task 45)

#### Task 45.1: Control Panel Login
```
1. Navigate to http://localhost:3000
2. Enter SysOp credentials
3. Verify dashboard displays
4. Take screenshot
```

#### Task 45.2: Dashboard Information
```
1. Verify current callers display
2. Verify active sessions
3. Verify recent activity log
4. Verify system status (uptime, nodes)
5. Take screenshots
```

#### Task 45.3: Users Management
```
1. Navigate to Users page
2. Verify user list displays
3. Verify user information (handle, access level, date)
4. Test editing user access level
5. Take screenshots
```

#### Task 45.4: Message Bases Management
```
1. Navigate to Message Bases page
2. Verify message base list
3. Test creating new message base
4. Test editing message base
5. Test deleting message base
6. Take screenshots
```

#### Task 45.5: AI Settings
```
1. Navigate to AI Settings page
2. Verify AI configuration displays
3. Verify provider and model info
4. Take screenshot
```

### Phase 5: API Testing (Task 46)

#### Task 46.1: Authentication Endpoints
```
1. Test POST /api/auth/login
2. Test POST /api/auth/register
3. Test GET /api/auth/me
4. Verify JWT token generation
5. Verify error responses
```

#### Task 46.2: Message Base Endpoints
```
1. Test GET /api/message-bases
2. Test GET /api/message-bases/:id/messages
3. Test POST /api/message-bases/:id/messages
4. Verify response formats
5. Check error handling
```

#### Task 46.3: Door Game Endpoints
```
1. Test GET /api/doors
2. Test POST /api/doors/:id/enter
3. Test POST /api/doors/:id/input
4. Test POST /api/doors/:id/exit
5. Verify door state management
```

### Phase 6: WebSocket Testing (Task 47)

#### Task 47.1: Message Notifications
```
1. Open two terminal clients
2. Post message from one client
3. Verify notification in other client
4. Check notification formatting
```

#### Task 47.2: User Activity Notifications
```
1. Monitor user join/leave events
2. Verify notifications display
3. Check system announcements
```

### Phase 7: Error Handling (Task 48)

#### Task 48.1: Rate Limiting
```
1. Test rapid login attempts
2. Test message posting rate limits
3. Test AI request rate limits
4. Verify error messages
```

#### Task 48.2: Input Validation
```
1. Test invalid handle formats
2. Test password requirements
3. Test message length limits
4. Test special character sanitization
```

#### Task 48.3: Connection Handling
```
1. Test disconnect/reconnect
2. Test session recovery
3. Test graceful shutdown
4. Test offline message
```

### Phase 8: Multi-User Testing (Task 49)

#### Task 49.1: Concurrent Access
```
1. Open multiple terminal clients
2. Verify session isolation
3. Test concurrent message posting
4. Verify message visibility
5. Check for race conditions
```

#### Task 49.2: Multi-User Door Games
```
1. Multiple users enter door games
2. Verify session isolation
3. Check door state management
```

### Phase 9: Demo Readiness (Task 50)

#### Task 50.1: Document Results
```
1. Compile all screenshots
2. Document formatting issues
3. List bugs/inconsistencies
4. Create before/after comparisons
```

#### Task 50.2: Create Demo Script
```
1. Write step-by-step walkthrough
2. Identify best features to showcase
3. Create talking points
4. Document known limitations
```

#### Task 50.3: Verify Demo Readiness
```
✓ All screens render correctly
✓ All ANSI formatting displays properly
✓ All user flows work end-to-end
✓ No critical bugs or errors
✓ Performance is acceptable
✓ System is stable under normal load
```

## Validation Helpers Reference

### Welcome Screen Validation
```typescript
import { VALIDATORS } from './mcp-helpers';

const result = VALIDATORS.validateWelcomeScreen(content);
// Checks: ANSI codes, BBS name, formatting
```

### AI SysOp Message Validation
```typescript
const result = VALIDATORS.validateAISysOpMessage(content, 500);
// Checks: ANSI codes, length limit, formatting
```

### Oracle Response Validation
```typescript
const result = VALIDATORS.validateOracleResponse(content);
// Checks: length (150 chars), mystical symbols
```

### Menu Display Validation
```typescript
const result = VALIDATORS.validateMenuDisplay(content, [
  'Message Bases',
  'Door Games',
  'Page SysOp'
]);
// Checks: expected options, ANSI formatting
```

### Message Display Validation
```typescript
const result = VALIDATORS.validateMessageDisplay(content);
// Checks: subject, author, timestamp
```

## Screenshot Naming Convention

Use the helper function for consistent naming:

```typescript
import { generateScreenshotFilename } from './mcp-helpers';

const filename = generateScreenshotFilename(
  'New User Registration',
  'Welcome Screen'
);
// Result: screenshots/New_User_Registration_Welcome_Screen_2025-12-03T...png
```

## Common MCP Patterns

### Pattern 1: Navigate and Verify
```typescript
// Navigate to page
mcp_chrome_devtools_navigate_page({ type: 'url', url: 'http://localhost:8080' });

// Wait for content
mcp_chrome_devtools_wait_for({ text: 'Welcome', timeout: 5000 });

// Take snapshot
const snapshot = mcp_chrome_devtools_take_snapshot();

// Validate
const validation = VALIDATORS.validateWelcomeScreen(snapshot.content);
```

### Pattern 2: Fill Form and Submit
```typescript
// Fill field
mcp_chrome_devtools_fill({ uid: 'input_uid', value: 'TestUser' });

// Press Enter
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for response
mcp_chrome_devtools_wait_for({ text: 'Success', timeout: 3000 });
```

### Pattern 3: Measure Response Time
```typescript
const startTime = Date.now();

// Perform action
mcp_chrome_devtools_fill({ uid: 'input_uid', value: 'question' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for response
mcp_chrome_devtools_wait_for({ text: 'response', timeout: 5000 });

const endTime = Date.now();

// Validate timing
const validation = validateResponseTime(startTime, endTime, 5000);
console.log('Response time:', validation.responseTimeMs, 'ms');
console.log('Within limit:', validation.withinLimit);
```

## Requirements Coverage Matrix

| Requirement | Test Task | Status |
|-------------|-----------|--------|
| 1.1 - WebSocket connection | 39.1 | Pending |
| 1.2 - Welcome screen | 39.1 | Pending |
| 1.3 - Input transmission | 39.1 | Pending |
| 1.4 - ANSI rendering | 39.2 | Pending |
| 2.1 - Registration prompt | 39.1 | Pending |
| 2.2 - Registration flow | 39.1 | Pending |
| 2.3 - Handle validation | 39.1, 48.2 | Pending |
| 2.4 - Password hashing | 39.1 | Pending |
| 2.5 - Login flow | 40.1 | Pending |
| 2.6 - Login retry | 48.1 | Pending |
| 3.1 - Main menu | 41.1 | Pending |
| 3.2 - Menu options | 41.1 | Pending |
| 3.3 - Menu navigation | 41.1 | Pending |
| 3.4 - Invalid commands | 41.3 | Pending |
| 3.5 - Submenu return | 41.1 | Pending |
| 4.1 - Message base list | 42.1 | Pending |
| 4.2 - Message base menu | 42.1 | Pending |
| 4.3 - Message display | 42.1 | Pending |
| 4.4 - Message posting | 42.2 | Pending |
| 4.5 - Message persistence | 42.2 | Pending |
| 5.1 - AI welcome | 39.1 | Pending |
| 5.2 - AI greeting | 40.1 | Pending |
| 5.3 - Page SysOp | 43.1 | Pending |
| 5.4 - AI ANSI formatting | 43.2 | Pending |
| 5.5 - AI response length | 43.2 | Pending |
| 7.1 - Door games list | 44.1 | Pending |
| 7.2 - Oracle intro | 44.1 | Pending |
| 7.3 - Oracle style | 44.2 | Pending |
| 7.4 - Oracle length | 44.2 | Pending |
| 7.5 - Door exit | 44.1 | Pending |
| 8.1 - Control panel | 45.1 | Pending |
| 8.2 - Dashboard info | 45.2 | Pending |
| 8.3 - User management | 45.3 | Pending |
| 8.4 - Message base mgmt | 45.4 | Pending |
| 8.5 - AI settings | 45.5 | Pending |
| 13.1 - ANSI codes | 39.2, 41.2 | Pending |
| 13.2 - Box drawing | 39.2, 41.2 | Pending |
| 13.3 - Color variants | 39.2 | Pending |
| 15.1 - Login rate limit | 48.1 | Pending |
| 15.2 - Message rate limit | 48.1 | Pending |
| 15.3 - AI rate limit | 48.1 | Pending |
| 15.4 - Input sanitization | 48.2 | Pending |
| 16.1 - REST auth | 46.1 | Pending |
| 16.2 - REST operations | 46.2, 46.3 | Pending |
| 17.1 - WebSocket events | 47.1, 47.2 | Pending |
| 17.2 - Notification format | 47.1 | Pending |

## Success Metrics

### Functional Completeness
- [ ] All user flows work end-to-end
- [ ] All menu options are accessible
- [ ] All features respond correctly
- [ ] No critical bugs or crashes

### Visual Quality
- [ ] ANSI formatting displays correctly
- [ ] Box-drawing characters render properly
- [ ] Colors are vibrant and readable
- [ ] Layout is consistent across screens

### Performance
- [ ] Page loads within 3 seconds
- [ ] AI responses within 5 seconds
- [ ] No noticeable lag in terminal
- [ ] Smooth navigation between screens

### User Experience
- [ ] Prompts are clear and helpful
- [ ] Error messages are informative
- [ ] Navigation is intuitive
- [ ] System feels responsive

## Next Steps

1. ✅ **Task 38.1**: Configure Chrome DevTools MCP - **COMPLETE**
2. ⏭️ **Task 38.2**: Create test user personas and scenarios - **READY**
3. ⏭️ **Task 39**: Test new user registration flow
4. ⏭️ **Task 40**: Test returning user login flow
5. ⏭️ Continue through remaining test tasks...

## Resources

- **Helper Utilities**: `server/src/testing/mcp-helpers.ts`
- **Documentation**: `server/src/testing/README.md`
- **Example Test**: `server/src/testing/example-test.md`
- **Requirements**: `.kiro/specs/baudagain/requirements.md`
- **Design**: `.kiro/specs/baudagain/design.md`
- **Tasks**: `.kiro/specs/baudagain/tasks.md`
