# Control Panel MCP Testing Guide

## Task 47: Test Control Panel Functionality via MCP

This document provides step-by-step instructions for testing the BaudAgain BBS Control Panel using Chrome DevTools MCP.

## Prerequisites

- ✅ BBS server running on port 8080 (API on port 8080)
- ✅ Control panel running on port 3000
- ✅ Test user TestAdmin created with access level 255
- ✅ Chrome DevTools MCP server available

## Test User Credentials

**Admin User (TestAdmin)**:
- Handle: `TestAdmin`
- Password: `AdminPass789!`
- Access Level: 255 (Admin)

## Task 47.1: Automate Control Panel Login via MCP

### Objective
Navigate to the control panel, login with SysOp credentials, and verify the dashboard displays correctly.

### Steps

1. **Navigate to Control Panel**
   ```
   Tool: mcp_chrome_devtools_navigate_page
   Parameters: { type: 'url', url: 'http://localhost:3000' }
   ```

2. **Wait for Login Page to Load**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'SysOp Control Panel', timeout: 5000 }
   ```

3. **Take Snapshot of Login Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Verify login page structure
   ```

4. **Take Screenshot of Login Page**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/control_panel_login.png' }
   ```

5. **Fill in Handle Field**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Get the UID of the handle input field
   
   Then:
   Tool: mcp_chrome_devtools_fill
   Parameters: { uid: '[handle_input_uid]', value: 'TestAdmin' }
   ```

6. **Fill in Password Field**
   ```
   Tool: mcp_chrome_devtools_fill
   Parameters: { uid: '[password_input_uid]', value: 'AdminPass789!' }
   ```

7. **Click Login Button**
   ```
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[login_button_uid]' }
   ```

8. **Wait for Dashboard to Load**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'Dashboard', timeout: 5000 }
   ```

9. **Take Snapshot of Dashboard**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Verify dashboard loaded successfully
   ```

10. **Take Screenshot of Dashboard**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { filePath: 'screenshots/control_panel_dashboard.png' }
    ```

### Expected Outcomes

- ✅ Login page displays with "BaudAgain BBS" title
- ✅ Login page shows "SysOp Control Panel" subtitle
- ✅ Handle and password fields are present
- ✅ Login button is clickable
- ✅ After login, dashboard displays
- ✅ Dashboard shows navigation sidebar
- ✅ Dashboard shows stats cards (Current Callers, Total Users, Messages Today)

### Validation Checklist

- [ ] Login page renders correctly
- [ ] Form fields accept input
- [ ] Login button is functional
- [ ] Authentication succeeds with valid credentials
- [ ] Dashboard loads after successful login
- [ ] No console errors during login process

---

## Task 47.2: Test Dashboard Information via MCP

### Objective
Verify that the dashboard displays current callers, active sessions, recent activity, and system status.

### Steps

1. **Verify Dashboard is Loaded**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Get current page content
   Expected: Should contain "Dashboard" heading
   ```

2. **Verify Current Callers Card**
   ```
   Check snapshot for:
   - "Current Callers" text
   - Numeric value for current callers
   - Node usage information (e.g., "0/10 nodes in use")
   ```

3. **Verify Total Users Card**
   ```
   Check snapshot for:
   - "Total Users" text
   - Numeric value for total users
   ```

4. **Verify Messages Today Card**
   ```
   Check snapshot for:
   - "Messages Today" text
   - Numeric value for messages posted today
   ```

5. **Take Screenshot of Stats Cards**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/dashboard_stats_cards.png' }
   ```

6. **Verify System Status Section**
   ```
   Check snapshot for:
   - "System Status" heading
   - "Uptime" information
   - "Status" indicator (should show "● Online")
   ```

7. **Take Screenshot of System Status**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/dashboard_system_status.png' }
   ```

8. **Verify Recent Activity Section**
   ```
   Check snapshot for:
   - "Recent Activity" heading
   - Activity log entries (or "No recent activity" message)
   ```

9. **Take Screenshot of Recent Activity**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/dashboard_recent_activity.png' }
   ```

### Expected Outcomes

- ✅ Current Callers displays with numeric value
- ✅ Node usage shows active/total nodes
- ✅ Total Users displays with numeric value
- ✅ Messages Today displays with numeric value
- ✅ System Status shows uptime in hours and minutes
- ✅ System Status shows "Online" indicator
- ✅ Recent Activity section displays (with or without entries)

### Validation Checklist

- [ ] All stat cards are visible and formatted correctly
- [ ] Numeric values are displayed (not errors or "undefined")
- [ ] System status shows uptime in readable format (e.g., "2h 15m")
- [ ] Online status indicator is green
- [ ] Recent activity section is present
- [ ] Dashboard auto-refreshes (check after 5 seconds)

---

## Task 47.3: Test Users Management Page via MCP

### Objective
Navigate to the Users page, verify user list displays, and test editing user access levels.

### Steps

1. **Navigate to Users Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Get navigation button UID
   
   Then:
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[users_nav_button_uid]' }
   ```

2. **Wait for Users Page to Load**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'Users', timeout: 3000 }
   ```

3. **Take Snapshot of Users Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Verify user list structure
   ```

4. **Take Screenshot of Users Page**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/users_page.png' }
   ```

5. **Verify User List Content**
   ```
   Check snapshot for:
   - User handles (TestAdmin, TestVeteran, TestNewbie)
   - Access levels for each user
   - Registration dates
   - Total calls count
   - Total posts count
   ```

6. **Test Editing User Access Level**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Find edit button for a user
   
   Then:
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[edit_button_uid]' }
   ```

7. **Verify Edit Dialog Opens**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'Edit Access Level', timeout: 3000 }
   ```

8. **Take Screenshot of Edit Dialog**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/users_edit_dialog.png' }
   ```

9. **Cancel Edit (Don't Actually Change)**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Find cancel button
   
   Then:
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[cancel_button_uid]' }
   ```

### Expected Outcomes

- ✅ Users page displays with "Users" heading
- ✅ User list shows all registered users
- ✅ Each user entry shows: handle, access level, registration date, total calls, total posts
- ✅ Edit buttons are present for each user
- ✅ Clicking edit opens a dialog/form
- ✅ Edit dialog allows changing access level
- ✅ Cancel button closes dialog without changes

### Validation Checklist

- [ ] Users page navigation works
- [ ] User list displays all test users
- [ ] User information is complete and formatted correctly
- [ ] Registration dates are in readable format
- [ ] Edit functionality is accessible
- [ ] Edit dialog displays correctly
- [ ] Cancel button works

---

## Task 47.4: Test Message Bases Management via MCP

### Objective
Navigate to Message Bases page, verify list displays, and test CRUD operations.

### Steps

1. **Navigate to Message Bases Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Get navigation button UID
   
   Then:
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[message_bases_nav_button_uid]' }
   ```

2. **Wait for Message Bases Page to Load**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'Message Bases', timeout: 3000 }
   ```

3. **Take Snapshot of Message Bases Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Verify message base list structure
   ```

4. **Take Screenshot of Message Bases Page**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/message_bases_page.png' }
   ```

5. **Verify Message Base List Content**
   ```
   Check snapshot for:
   - Message base names (General Discussion, System Announcements, SysOp Chat)
   - Descriptions
   - Access levels (read/write)
   - Post counts
   - Last post dates
   ```

6. **Test Creating New Message Base**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Find "Create Message Base" button
   
   Then:
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[create_button_uid]' }
   ```

7. **Verify Create Dialog Opens**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'Create Message Base', timeout: 3000 }
   ```

8. **Take Screenshot of Create Dialog**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/message_bases_create_dialog.png' }
   ```

9. **Fill in Message Base Details**
   ```
   Tool: mcp_chrome_devtools_fill
   Parameters: { uid: '[name_input_uid]', value: 'Test MCP Base' }
   
   Tool: mcp_chrome_devtools_fill
   Parameters: { uid: '[description_input_uid]', value: 'Created via MCP testing' }
   ```

10. **Submit Create Form**
    ```
    Tool: mcp_chrome_devtools_click
    Parameters: { uid: '[submit_button_uid]' }
    ```

11. **Wait for Success Message**
    ```
    Tool: mcp_chrome_devtools_wait_for
    Parameters: { text: 'Test MCP Base', timeout: 3000 }
    ```

12. **Take Screenshot of New Message Base**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { filePath: 'screenshots/message_bases_after_create.png' }
    ```

13. **Test Editing Message Base**
    ```
    Tool: mcp_chrome_devtools_take_snapshot
    Purpose: Find edit button for the new message base
    
    Then:
    Tool: mcp_chrome_devtools_click
    Parameters: { uid: '[edit_button_uid]' }
    ```

14. **Verify Edit Dialog Opens**
    ```
    Tool: mcp_chrome_devtools_wait_for
    Parameters: { text: 'Edit Message Base', timeout: 3000 }
    ```

15. **Take Screenshot of Edit Dialog**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { filePath: 'screenshots/message_bases_edit_dialog.png' }
    ```

16. **Update Description**
    ```
    Tool: mcp_chrome_devtools_fill
    Parameters: { uid: '[description_input_uid]', value: 'Updated via MCP testing' }
    ```

17. **Submit Edit Form**
    ```
    Tool: mcp_chrome_devtools_click
    Parameters: { uid: '[submit_button_uid]' }
    ```

18. **Wait for Update to Complete**
    ```
    Tool: mcp_chrome_devtools_wait_for
    Parameters: { text: 'Updated via MCP testing', timeout: 3000 }
    ```

19. **Take Screenshot After Edit**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { filePath: 'screenshots/message_bases_after_edit.png' }
    ```

20. **Test Deleting Message Base**
    ```
    Tool: mcp_chrome_devtools_take_snapshot
    Purpose: Find delete button for the test message base
    
    Then:
    Tool: mcp_chrome_devtools_click
    Parameters: { uid: '[delete_button_uid]' }
    ```

21. **Confirm Deletion**
    ```
    Tool: mcp_chrome_devtools_wait_for
    Parameters: { text: 'confirm', timeout: 3000 }
    
    Then:
    Tool: mcp_chrome_devtools_click
    Parameters: { uid: '[confirm_button_uid]' }
    ```

22. **Verify Message Base Deleted**
    ```
    Tool: mcp_chrome_devtools_take_snapshot
    Purpose: Verify "Test MCP Base" is no longer in the list
    ```

23. **Take Final Screenshot**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { filePath: 'screenshots/message_bases_after_delete.png' }
    ```

### Expected Outcomes

- ✅ Message Bases page displays with list of bases
- ✅ Each message base shows: name, description, access levels, post count
- ✅ "Create Message Base" button is present
- ✅ Create dialog opens and accepts input
- ✅ New message base appears in list after creation
- ✅ Edit dialog opens with current values
- ✅ Changes are saved and reflected in list
- ✅ Delete confirmation appears
- ✅ Message base is removed from list after deletion

### Validation Checklist

- [ ] Message Bases page navigation works
- [ ] Message base list displays correctly
- [ ] All message base information is visible
- [ ] Create functionality works end-to-end
- [ ] Edit functionality works end-to-end
- [ ] Delete functionality works end-to-end
- [ ] No errors during CRUD operations

---

## Task 47.5: Test AI Settings Page via MCP

### Objective
Navigate to AI Settings page and verify current AI configuration displays correctly.

### Steps

1. **Navigate to AI Settings Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Get navigation button UID
   
   Then:
   Tool: mcp_chrome_devtools_click
   Parameters: { uid: '[ai_settings_nav_button_uid]' }
   ```

2. **Wait for AI Settings Page to Load**
   ```
   Tool: mcp_chrome_devtools_wait_for
   Parameters: { text: 'AI Settings', timeout: 3000 }
   ```

3. **Take Snapshot of AI Settings Page**
   ```
   Tool: mcp_chrome_devtools_take_snapshot
   Purpose: Verify AI configuration structure
   ```

4. **Take Screenshot of AI Settings Page**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/ai_settings_page.png' }
   ```

5. **Verify AI Provider Information**
   ```
   Check snapshot for:
   - AI Provider name (e.g., "anthropic")
   - Model name (e.g., "claude-3-5-haiku-20241022")
   ```

6. **Verify AI SysOp Configuration**
   ```
   Check snapshot for:
   - "AI SysOp" section
   - Enabled status
   - Welcome new users setting
   - Participate in chat setting
   - Chat frequency setting
   - Personality description
   ```

7. **Verify Door Games Configuration**
   ```
   Check snapshot for:
   - "Door Games" section
   - Enabled status
   - Max tokens per turn setting
   ```

8. **Take Screenshot of AI SysOp Section**
   ```
   Tool: mcp_chrome_devtools_take_screenshot
   Parameters: { filePath: 'screenshots/ai_settings_sysop.png' }
   ```

9. **Scroll Down (if needed)**
   ```
   Tool: mcp_chrome_devtools_press_key
   Parameters: { key: 'PageDown' }
   ```

10. **Take Screenshot of Door Games Section**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { filePath: 'screenshots/ai_settings_doors.png' }
    ```

11. **Verify AI Configuration Assistant (if present)**
    ```
    Check snapshot for:
    - AI Chat interface
    - Chat history
    - Input field for configuration requests
    ```

12. **Take Screenshot of Full Page**
    ```
    Tool: mcp_chrome_devtools_take_screenshot
    Parameters: { fullPage: true, filePath: 'screenshots/ai_settings_full.png' }
    ```

### Expected Outcomes

- ✅ AI Settings page displays with "AI Settings" heading
- ✅ AI Provider information is visible (provider name and model)
- ✅ AI SysOp configuration section displays
- ✅ AI SysOp settings show enabled status, welcome users, chat settings
- ✅ Personality description is visible
- ✅ Door Games configuration section displays
- ✅ Door Games settings show enabled status and token limits
- ✅ All configuration values are readable and properly formatted

### Validation Checklist

- [ ] AI Settings page navigation works
- [ ] AI provider and model information displays
- [ ] AI SysOp configuration is complete
- [ ] Door Games configuration is complete
- [ ] All settings are readable and properly formatted
- [ ] No errors or missing data
- [ ] Page layout is clean and organized

---

## Summary of Requirements Coverage

### Task 47.1 - Control Panel Login
- **Requirements**: 8.1 (Control panel access)
- **Validates**: Login functionality, authentication, dashboard display

### Task 47.2 - Dashboard Information
- **Requirements**: 8.1 (Dashboard), 8.2 (Real-time information)
- **Validates**: Current callers, active sessions, activity log, system status

### Task 47.3 - Users Management
- **Requirements**: 8.3 (User management)
- **Validates**: User list display, user information, access level editing

### Task 47.4 - Message Bases Management
- **Requirements**: 8.4 (Message base management)
- **Validates**: Message base list, create, edit, delete operations

### Task 47.5 - AI Settings
- **Requirements**: 8.5 (AI settings display)
- **Validates**: AI configuration display, provider info, SysOp settings, door settings

---

## Test Execution Checklist

- [ ] Task 47.1: Control panel login completed
- [ ] Task 47.2: Dashboard information verified
- [ ] Task 47.3: Users management tested
- [ ] Task 47.4: Message bases management tested
- [ ] Task 47.5: AI settings verified
- [ ] All screenshots captured
- [ ] All validation checklists completed
- [ ] No critical errors encountered
- [ ] Control panel fully functional

---

## Notes

- **Test User**: Ensure TestAdmin has access level 255 before testing
- **Server Status**: Both BBS server (port 8080) and control panel (port 3000) must be running
- **Screenshots**: All screenshots are saved to `screenshots/` directory
- **Cleanup**: The test message base created in Task 47.4 is deleted at the end
- **Browser State**: Tests assume a fresh browser session (no existing login)

---

## Troubleshooting

### Login Fails
- Verify TestAdmin user exists with correct password
- Check TestAdmin has access level 255
- Verify API server is running on port 8080
- Check browser console for errors

### Dashboard Not Loading
- Verify authentication token is set
- Check API endpoints are responding
- Verify database has data to display

### CRUD Operations Fail
- Verify admin permissions (access level 255)
- Check API endpoints are working
- Verify database is writable

### Screenshots Not Saving
- Verify `screenshots/` directory exists
- Check file permissions
- Ensure sufficient disk space

