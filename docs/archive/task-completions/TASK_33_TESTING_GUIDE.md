# Task 33: Manual Testing Guide

**Purpose:** Verify the hybrid terminal client works correctly  
**Date:** December 2, 2025  
**Estimated Time:** 30-45 minutes

---

## 🚀 Setup

### Prerequisites:
1. Server running: `cd server && npm run dev`
2. Terminal client built: `cd client/terminal && npm run build`
3. Browser open to: `http://localhost:8080`

### Before Testing:
- ✅ Backup created: `client/terminal/src/main.ts.backup`
- ✅ Build successful
- ✅ No TypeScript errors

---

## 📋 Test Checklist

### Test 1: Initial Connection ✅
**Steps:**
1. Open browser to `http://localhost:8080`
2. Observe terminal display

**Expected:**
- Welcome screen displays with ANSI art
- "Connecting to BaudAgain BBS..." message
- Prompt: "Enter your handle (or NEW to register):"

**Pass Criteria:**
- [ ] Welcome screen displays correctly
- [ ] ANSI colors render properly
- [ ] Prompt appears

---

### Test 2: User Registration ✅
**Steps:**
1. Type: `NEW`
2. Press Enter
3. Type a handle (e.g., `testuser`)
4. Press Enter
5. Type a password (e.g., `password123`)
6. Press Enter

**Expected:**
- Prompt changes to "Choose a handle:"
- Password input is masked (no echo)
- Success message: "Account created! Welcome, testuser!"
- Main menu displays

**Pass Criteria:**
- [ ] Registration flow works
- [ ] Password is masked
- [ ] Success message displays
- [ ] Main menu appears
- [ ] JWT token stored (check browser console)

---

### Test 3: User Login ✅
**Steps:**
1. Refresh page
2. Type existing handle
3. Press Enter
4. Type password
5. Press Enter

**Expected:**
- Prompt changes to "Password:"
- Password input is masked
- Success message: "Welcome back, [handle]!"
- Main menu displays

**Pass Criteria:**
- [ ] Login flow works
- [ ] Password is masked
- [ ] Success message displays
- [ ] Main menu appears

---

### Test 4: Main Menu Navigation ✅
**Steps:**
1. After login, observe main menu
2. Try each command: M, D, G

**Expected:**
- Main menu displays with options:
  - [M] Messages
  - [D] Doors
  - [G] Goodbye
- Commands are case-insensitive

**Pass Criteria:**
- [ ] Main menu displays correctly
- [ ] ANSI box drawing works
- [ ] All options visible

---

### Test 5: Message Bases ✅
**Steps:**
1. Type: `M`
2. Press Enter
3. Observe message bases list

**Expected:**
- Message bases menu displays
- Shows list of available bases
- Each base shows post count
- [Q] option to return

**Pass Criteria:**
- [ ] Message bases list displays
- [ ] Post counts shown
- [ ] Return option available

---

### Test 6: View Messages ✅
**Steps:**
1. In message bases menu, type: `1`
2. Press Enter
3. Observe messages

**Expected:**
- Messages list displays
- Shows subject, author, date
- [P] option to post
- [Q] option to return

**Pass Criteria:**
- [ ] Messages display correctly
- [ ] Author and date shown
- [ ] Post option available

---

### Test 7: Post Message ✅
**Steps:**
1. In messages list, type: `P`
2. Press Enter
3. Type subject: `Test Message`
4. Press Enter
5. Type body: `This is a test message`
6. Press Enter

**Expected:**
- Prompt for subject
- Prompt for body
- Success message: "Message posted!"
- Returns to message list
- New message appears

**Pass Criteria:**
- [ ] Post flow works
- [ ] Success message displays
- [ ] Message appears in list
- [ ] Can see own message

---

### Test 8: Door Games ✅
**Steps:**
1. From main menu, type: `D`
2. Press Enter
3. Observe doors list

**Expected:**
- Doors menu displays
- Shows available doors
- Each door has description
- [Q] option to return

**Pass Criteria:**
- [ ] Doors list displays
- [ ] Descriptions shown
- [ ] Return option available

---

### Test 9: Enter Door (The Oracle) ✅
**Steps:**
1. In doors menu, type: `1`
2. Press Enter
3. Observe door entrance

**Expected:**
- Door introduction displays
- ANSI art for door
- Prompt for input

**Pass Criteria:**
- [ ] Door enters successfully
- [ ] Introduction displays
- [ ] Ready for input

---

### Test 10: Door Interaction ✅
**Steps:**
1. In door, type a question: `What is the meaning of life?`
2. Press Enter
3. Observe response

**Expected:**
- Oracle responds with mystical answer
- Response includes symbols (✧ ☽ ⚝)
- Prompt for next question

**Pass Criteria:**
- [ ] Oracle responds
- [ ] Response is mystical/cryptic
- [ ] Can ask another question

---

### Test 11: Exit Door ✅
**Steps:**
1. In door, type: `quit` or `q`
2. Press Enter

**Expected:**
- Door exits
- Returns to main menu

**Pass Criteria:**
- [ ] Door exits cleanly
- [ ] Returns to main menu
- [ ] No errors

---

### Test 12: Logout ✅
**Steps:**
1. From main menu, type: `G`
2. Press Enter

**Expected:**
- "Goodbye!" message
- Connection closes
- Token cleared

**Pass Criteria:**
- [ ] Goodbye message displays
- [ ] Can reconnect
- [ ] Must login again

---

### Test 13: Error Handling ✅
**Steps:**
1. Try invalid commands in each menu
2. Try invalid selections (e.g., message base 99)

**Expected:**
- Error messages display in red
- Returns to appropriate menu
- No crashes

**Pass Criteria:**
- [ ] Invalid commands handled
- [ ] Error messages clear
- [ ] No crashes

---

### Test 14: WebSocket Notifications ⚠️
**Steps:**
1. Open two browser windows
2. Login as different users
3. Post a message in one window
4. Observe other window

**Expected:**
- Notification appears in other window
- Shows new message alert
- Includes message base and subject

**Pass Criteria:**
- [ ] Notification received
- [ ] Message details shown
- [ ] Doesn't interrupt current action

---

### Test 15: API Error Handling ⚠️
**Steps:**
1. Stop the server
2. Try to login
3. Observe error handling

**Expected:**
- Network error detected
- Error message displays
- Fallback mode message
- No crash

**Pass Criteria:**
- [ ] Error detected
- [ ] Fallback message shown
- [ ] Terminal still responsive

---

## 🐛 Bug Report Template

If you find issues, document them:

```markdown
### Bug: [Short Description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Logs:**


**Severity:** Critical / High / Medium / Low

**Workaround:**

```

---

## ✅ Test Results Summary

### Overall Status:
- [ ] All tests passing
- [ ] Some tests failing (document below)
- [ ] Major issues found (stop and rollback)

### Failed Tests:
1. 
2. 
3. 

### Notes:


---

## 🔄 Rollback Decision

### Rollback if:
- Critical functionality broken
- User experience significantly degraded
- Multiple test failures
- Data loss or corruption

### Proceed if:
- Minor UI issues
- Edge case bugs
- Performance acceptable
- Core functionality works

---

## 📊 Performance Checklist

### Response Times:
- [ ] Login < 500ms
- [ ] Message list < 500ms
- [ ] Post message < 500ms
- [ ] Door enter < 500ms
- [ ] Notifications < 100ms

### User Experience:
- [ ] No visible lag
- [ ] Smooth transitions
- [ ] ANSI renders correctly
- [ ] Colors display properly

---

## 🎯 Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Result:** Pass / Fail / Conditional Pass  

**Recommendation:**
- [ ] Approve for production
- [ ] Approve with minor fixes
- [ ] Requires rework
- [ ] Rollback recommended

**Notes:**


---

**Next Steps After Testing:**
1. Document any bugs found
2. Fix critical issues
3. Update task status
4. Mark Task 33 complete
5. Proceed to Task 34

