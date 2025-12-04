# Control Panel MCP Test Execution Guide

## Quick Start

This guide provides instructions for executing the control panel MCP tests.

## Prerequisites

### 1. Start BBS Server
```bash
cd server
npm run dev
```
Server should be running on port 8080 (API accessible at http://localhost:8080/api)

### 2. Start Control Panel
```bash
cd client/control-panel
npm run dev
```
Control panel should be running on port 3000 (http://localhost:3000)

### 3. Verify Test User
Ensure TestAdmin user exists with access level 255:

**Option A: Via SQL**
```bash
cd server
sqlite3 data/bbs.db "UPDATE users SET access_level = 255 WHERE handle = 'TestAdmin';"
```

**Option B: Via REST API**
```bash
# First, get TestAdmin's user ID
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"handle": "TestAdmin", "password": "AdminPass789!"}' \
  | jq -r '.token'

# Use the token to update access level
TOKEN="<token_from_above>"
USER_ID="<user_id_from_login_response>"

curl -X PATCH "http://localhost:8080/api/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"accessLevel": 255}'
```

### 4. Create Screenshots Directory
```bash
mkdir -p screenshots
```

## Execution Methods

### Method 1: View Test Instructions (Recommended for First Time)

Run the test script to see detailed step-by-step instructions:

```bash
npx tsx -e "import('./server/src/testing/test-control-panel.ts').then(m => m.runAllControlPanelTests())"
```

This will output:
- Detailed instructions for each test step
- MCP tool names and parameters
- Expected outcomes
- Validation checklists

### Method 2: Follow Manual Guide

Open the comprehensive test guide:
```bash
cat server/src/testing/test-control-panel-mcp.md
```

Or open in your editor and follow step-by-step.

### Method 3: Execute via MCP Chrome DevTools

Use the Chrome DevTools MCP server to execute each test step:

1. **Open Chrome DevTools MCP**
2. **Navigate to control panel**: 
   ```
   mcp_chrome_devtools_navigate_page({ type: 'url', url: 'http://localhost:3000' })
   ```
3. **Follow the test steps** from either:
   - The TypeScript script output
   - The markdown guide

## Test Execution Order

Execute tests in this order:

1. **Task 47.1**: Control Panel Login
2. **Task 47.2**: Dashboard Information
3. **Task 47.3**: Users Management
4. **Task 47.4**: Message Bases Management
5. **Task 47.5**: AI Settings

## Individual Test Execution

### Task 47.1: Control Panel Login

```bash
npx tsx -e "import('./server/src/testing/test-control-panel.ts').then(m => m.testControlPanelLogin())"
```

### Task 47.2: Dashboard Information

```bash
npx tsx -e "import('./server/src/testing/test-control-panel.ts').then(m => m.testDashboardInformation())"
```

### Task 47.3: Users Management

```bash
npx tsx -e "import('./server/src/testing/test-control-panel.ts').then(m => m.testUsersManagement())"
```

### Task 47.4: Message Bases Management

```bash
npx tsx -e "import('./server/src/testing/test-control-panel.ts').then(m => m.testMessageBasesManagement())"
```

### Task 47.5: AI Settings

```bash
npx tsx -e "import('./server/src/testing/test-control-panel.ts').then(m => m.testAISettings())"
```

## Expected Outputs

### Console Output
Each test will output:
- Step number and description
- MCP tool to use
- Parameters for the tool
- Expected outcomes
- Validation checklist

### Screenshots
Screenshots will be saved to `screenshots/` directory:
- `control_panel_login.png`
- `control_panel_dashboard.png`
- `dashboard_stats_cards.png`
- `dashboard_system_status.png`
- `dashboard_recent_activity.png`
- `users_page.png`
- `users_edit_dialog.png`
- `message_bases_page.png`
- `message_bases_create_dialog.png`
- `message_bases_after_create.png`
- `message_bases_edit_dialog.png`
- `message_bases_after_edit.png`
- `message_bases_after_delete.png`
- `ai_settings_page.png`
- `ai_settings_sysop.png`
- `ai_settings_doors.png`
- `ai_settings_full.png`

## Validation

After executing tests, complete the validation checklists in:
- `server/src/testing/test-control-panel-mcp.md`
- `server/src/testing/TASK_47_COMPLETE.md`

## Troubleshooting

### Login Fails
- Verify TestAdmin user exists: `sqlite3 server/data/bbs.db "SELECT * FROM users WHERE handle = 'TestAdmin';"`
- Check access level is 255: `sqlite3 server/data/bbs.db "SELECT access_level FROM users WHERE handle = 'TestAdmin';"`
- Verify password is correct: Try logging in manually at http://localhost:3000

### Dashboard Not Loading
- Check API server is running: `curl http://localhost:8080/api/dashboard`
- Verify authentication token is valid
- Check browser console for errors

### CRUD Operations Fail
- Verify admin permissions (access level 255)
- Check API endpoints are responding
- Verify database is writable

### Screenshots Not Saving
- Verify `screenshots/` directory exists: `mkdir -p screenshots`
- Check file permissions
- Ensure sufficient disk space

## Next Steps

After completing tests:

1. **Review Screenshots**: Check all screenshots in `screenshots/` directory
2. **Complete Checklists**: Mark off validation checklist items
3. **Document Issues**: Note any bugs or problems found
4. **Update Status**: Update task status in `.kiro/specs/baudagain/tasks.md`

## References

- **Test Guide**: `server/src/testing/test-control-panel-mcp.md`
- **Test Script**: `server/src/testing/test-control-panel.ts`
- **Completion Report**: `server/src/testing/TASK_47_COMPLETE.md`
- **MCP Helpers**: `server/src/testing/mcp-helpers.ts`
- **MCP Test Guide**: `server/src/testing/mcp-test-guide.md`

