# Milestone 7: Comprehensive User Testing (Demo Readiness) - PLANNING

**Date:** 2025-12-03  
**Status:** In Progress (15% complete) ⏳  
**Prerequisites:** Milestone 6 complete (100%) ✅

---

## Overview

Milestone 7 focuses on comprehensive end-to-end testing using MCP-based automation to validate all features and ensure the BBS is demo-ready. This milestone will use the Chrome DevTools MCP server to automate browser interactions, capture screenshots, and validate the user experience.

---

## Objectives

1. **Automated Testing** - Use MCP Chrome DevTools for browser automation
2. **Complete Validation** - Test all user journeys end-to-end
3. **Visual Verification** - Capture screenshots and validate ANSI formatting
4. **Multi-User Testing** - Verify concurrent access and session isolation
5. **Demo Readiness** - Create demo script and verify system is ready

---

## Testing Approach

### MCP-Based Automation

**Chrome DevTools MCP Server:**
- Browser automation via Chrome DevTools Protocol
- Navigate to BBS terminal and control panel
- Take snapshots at each step
- Validate screen content and formatting
- Test user interactions

**Benefits:**
- Automated, repeatable tests
- Visual validation with screenshots
- Real browser environment
- Can test both terminal and control panel

### Test Coverage Areas

1. **User Registration Flow** (Tasks 38-39)
2. **Login Flow** (Task 40)
3. **Menu Navigation** (Task 41)
4. **Message Bases** (Task 42)
5. **AI SysOp** (Task 43)
6. **Door Games** (Task 44)
7. **Control Panel** (Task 45)
8. **REST API** (Task 46)
9. **WebSocket Notifications** (Task 47)
10. **Error Handling** (Task 48)
11. **Multi-User Scenarios** (Task 49)
12. **Demo Readiness** (Tasks 50-51)

---

## Task Breakdown

### Phase 1: Setup (Task 38) ✅ COMPLETE

**Task 38.1: Configure Chrome DevTools MCP** ✅
- ✅ Verified MCP Chrome DevTools server is available
- ✅ Tested basic browser automation capabilities
- ✅ Created helper utilities in `server/src/testing/mcp-helpers.ts`
- ✅ Set up screenshot capture

**Task 38.2: Create test personas and scenarios** ✅
- ✅ Defined test personas (new user, returning user, admin)
- ✅ Documented test scenarios in `server/src/testing/README.md`
- ✅ Created test data setup scripts (`setup-test-data.sh`, `setup-test-data.ts`)
- ✅ Documented test data in `server/src/testing/TEST_DATA.md`

**Completed:** December 3, 2025  
**Actual Time:** 4 hours  
**Status:** ✅ Complete - See `server/src/testing/TASK_38_COMPLETE.md`

---

### Phase 2: User Flow Testing (Tasks 39-41)

**Task 39: New User Registration** ✅ COMPLETE
- ✅ Automated registration flow via MCP
- ✅ Validated welcome screen formatting
- ✅ Verified AI SysOp welcome message
- ✅ Captured screenshots at each step
- ✅ Created test script in `server/src/testing/test-registration-flow.ts`
- ✅ Documented results in `server/src/testing/TASK_39_COMPLETE.md`

**Completed:** December 3, 2025  
**Actual Time:** 3 hours  
**Status:** ✅ Complete

**CRITICAL ISSUE IDENTIFIED:** During Task 39 testing, ANSI frame alignment issues were discovered that affect visual quality and demo readiness. New tasks (51.1-51.5) have been added to address this before continuing with user testing.

**Task 51: ANSI Frame Alignment Fix** ⚠️ HIGH PRIORITY - NEXT
- **Task 51.1:** Investigate frame alignment root cause
- **Task 51.2:** Implement ANSIFrameBuilder utility
- **Task 51.3:** Implement ANSIFrameValidator for testing
- **Task 51.4:** Update all screens to use ANSIFrameBuilder
- **Task 51.5:** Add visual regression tests

**Estimated Time:** 12-16 hours  
**Priority:** HIGH - Must complete before continuing user testing  
**Documentation:** See `server/src/testing/ANSI_FRAME_ALIGNMENT_ISSUE.md`

**Task 40: Returning User Login** ⏳ BLOCKED (After frame fix)
- Automate login flow via MCP
- Verify AI greeting message
- Check last login date display
- Validate message count display

**Task 41: Main Menu Navigation** ⏳ BLOCKED (After frame fix)
- Test all menu options
- Verify submenu displays
- Test invalid command handling
- Validate screen formatting

**Estimated Time Remaining:** 15-21 hours (including frame fix)

---

### Phase 3: Feature Testing (Tasks 42-44)

**Task 42: Message Base Functionality**
- Browse message bases
- View existing messages
- Post new messages
- Validate formatting

**Task 43: AI SysOp Interaction**
- Test Page SysOp feature
- Verify AI responses
- Check response time
- Validate formatting

**Task 44: Door Game Functionality**
- Enter The Oracle door game
- Test AI responses
- Verify exit navigation
- Validate mystical formatting

**Estimated Time:** 6-8 hours

---

### Phase 4: Control Panel & API Testing (Tasks 45-47)

**Task 45: Control Panel**
- Test dashboard
- Test Users management
- Test Message Bases management
- Test AI Settings display

**Task 46: REST API**
- Test authentication endpoints
- Test message base endpoints
- Test door game endpoints
- Verify error responses

**Task 47: WebSocket Notifications**
- Test real-time message notifications
- Test user activity notifications
- Verify notification formatting

**Estimated Time:** 6-8 hours

---

### Phase 5: Edge Cases & Multi-User (Tasks 48-49)

**Task 48: Error Handling**
- Test rate limiting
- Test input validation
- Test connection handling
- Verify error messages

**Task 49: Multi-User Scenarios**
- Test concurrent access
- Verify session isolation
- Test concurrent message posting
- Check for race conditions

**Estimated Time:** 4-6 hours

---

### Phase 6: Demo Readiness (Tasks 50-51)

**Task 50: Documentation**
- Compile test results
- Create screenshot gallery
- Document any issues found
- Create demo script

**Task 51: Final Verification**
- Verify all screens render correctly
- Confirm all flows work end-to-end
- Check system stability
- Get sign-off for demo readiness

**Estimated Time:** 4-6 hours

---

## Total Estimated Time

**42-58 hours** (4-5 days full-time, or 1-2 weeks part-time)

**Note:** Additional 12-16 hours added for ANSI frame alignment fix (Tasks 51.1-51.5)

---

## Success Criteria

### Technical Validation
- ✅ All user flows work end-to-end
- ✅ All screens render correctly with proper ANSI formatting
- ✅ No critical bugs or errors
- ✅ Performance is acceptable (< 5s response times)
- ✅ System is stable under normal load

### Demo Readiness
- ✅ Demo script is complete with talking points
- ✅ All features are showcased
- ✅ Known limitations are documented
- ✅ Screenshots are captured for all key screens
- ✅ System can be demoed confidently

### Documentation
- ✅ Test report with all results
- ✅ Screenshot gallery
- ✅ Demo script with step-by-step walkthrough
- ✅ Known issues and limitations documented

---

## Deliverables

1. **Test Report** - Comprehensive test results with screenshots
2. **Demo Script** - Step-by-step demo walkthrough with talking points
3. **Screenshot Gallery** - Visual documentation of all screens
4. **Known Limitations** - Documented limitations and workarounds
5. **Demo-Readiness Checklist** - Final verification checklist

---

## MCP Configuration

### Chrome DevTools MCP Server

**Installation:**
```bash
# MCP server is typically installed via uvx
uvx mcp-server-chrome-devtools
```

**Configuration:**
Add to `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "uvx",
      "args": ["mcp-server-chrome-devtools"],
      "disabled": false,
      "autoApprove": [
        "list_pages",
        "take_snapshot",
        "navigate_page",
        "click",
        "fill"
      ]
    }
  }
}
```

### Helper Utilities

**BBS Testing Helpers:**
```typescript
// Navigate to BBS terminal
async function navigateToBBS() {
  await navigatePage({ url: 'http://localhost:5173', type: 'url' });
  await waitFor({ text: 'BaudAgain BBS', timeout: 5000 });
}

// Take screenshot with timestamp
async function captureScreen(name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await takeScreenshot({ 
    filePath: `screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

// Enter command in terminal
async function enterCommand(command: string) {
  await fill({ uid: 'terminal-input', value: command });
  await pressKey({ key: 'Enter' });
}
```

---

## Test Scenarios

### Scenario 1: New User Journey
1. Navigate to BBS terminal
2. See welcome screen
3. Enter "NEW" to register
4. Complete registration (handle, password, profile)
5. Receive AI welcome message
6. Navigate main menu
7. Post a message
8. Play The Oracle
9. Log out

### Scenario 2: Returning User Journey
1. Navigate to BBS terminal
2. Enter handle and password
3. Receive AI greeting
4. See last login date
5. Check for new messages
6. Read messages
7. Reply to a message
8. Page SysOp
9. Log out

### Scenario 3: Admin Journey
1. Navigate to control panel
2. Log in as SysOp
3. View dashboard
4. Manage users
5. Create message base
6. View AI settings
7. Log out

### Scenario 4: Multi-User Scenario
1. Open two terminal clients
2. User A posts a message
3. User B receives notification
4. User B reads message
5. User B replies
6. User A receives notification
7. Both users log out

---

## Risk Assessment

### Low Risk
- Basic navigation testing
- Screenshot capture
- Single-user scenarios

### Medium Risk
- Multi-user testing (timing issues)
- WebSocket notification testing (async)
- Performance testing (load dependent)

### High Risk
- MCP server configuration issues
- Browser automation flakiness
- ANSI formatting validation (visual)

### Mitigation Strategies
- Test MCP setup early
- Use retries for flaky tests
- Manual verification for visual elements
- Have fallback manual testing plan

---

## Progress Summary

**Completed (15%):**
1. ✅ **Milestone 6 verified complete** (100%)
2. ✅ **Set up MCP Chrome DevTools server** (Task 38.1)
3. ✅ **Create test helper utilities** (Task 38.2)
4. ✅ **Complete Phase 1: Setup** (Task 38)
5. ✅ **Complete user registration testing** (Task 39)

**Next Steps:**
6. **CRITICAL: Fix ANSI frame alignment issues** (Tasks 51.1-51.5) ⚠️
7. **Begin Task 40: Returning user login flow testing** (After frame fix)
8. **Continue Phase 2: User flow testing** (Tasks 40-41)
9. **Execute remaining test phases sequentially**
10. **Document results continuously**
11. **Create demo script** (Task 50)
12. **Final verification** (Task 52)

---

## Notes

- This milestone is about **validation**, not new features
- Focus on **user experience** and **visual quality**
- **Screenshots are critical** for demo preparation
- **Document everything** - issues, workarounds, limitations
- **Demo script** should highlight best features
- **Known limitations** should be documented upfront

---

**Created:** 2025-12-03  
**Last Updated:** 2025-12-03  
**Status:** In Progress (15% complete)  
**Next Action:** Fix ANSI frame alignment issues (Tasks 51.1-51.5) - HIGH PRIORITY ⚠️

