# BaudAgain BBS - Testing Guide

**Date:** 2025-11-30  
**Server Status:** ✅ Running on http://localhost:8080

---

## 🚀 Server is Running!

The BBS server is currently running and ready for testing.

**Endpoints:**
- WebSocket: `ws://localhost:8080/ws`
- Health Check: `http://localhost:8080/health`
- Control Panel API: `http://localhost:8080/api/*`

---

## 📋 Test Plan

### Test 1: Terminal Client Connection
**What to test:** Basic connectivity and welcome screen

**Steps:**
1. Open terminal client: `http://localhost:5173` (if running)
2. Or start it: `cd client/terminal && npm run dev`
3. Verify welcome screen displays
4. Check ANSI colors render correctly

**Expected:**
- Welcome screen with "BAUDAGAIN BBS" title
- Prompt: "Enter your handle, or type NEW to register:"

---

### Test 2: User Registration
**What to test:** New user creation

**Steps:**
1. Type: `NEW`
2. Enter handle: `testuser`
3. Enter password: `test123`
4. Verify AI welcome message appears

**Expected:**
- Registration succeeds
- AI SysOp generates welcome message
- Main menu displays

---

### Test 3: User Login
**What to test:** Existing user authentication

**Steps:**
1. Disconnect and reconnect
2. Enter handle: `testuser`
3. Enter password: `test123`
4. Verify AI greeting message

**Expected:**
- Login succeeds
- AI SysOp generates greeting
- Last login date shown
- Main menu displays

---

### Test 4: Message Bases
**What to test:** Message system functionality

**Steps:**
1. From main menu, type: `M`
2. Verify 3 default bases appear:
   - General Discussion
   - BBS Talk
   - AI & Technology
3. Select a base (type `1`)
4. Type `P` to post a message
5. Enter subject: `Test Message`
6. Enter body: `This is a test message`
7. Verify message appears in list
8. Select message number to read it

**Expected:**
- Message bases list correctly
- Can post messages
- Messages display with subject, author, timestamp
- Can read full message content

---

### Test 5: Door Games (The Oracle)
**What to test:** AI-powered door game

**Steps:**
1. From main menu, type: `G`
2. Select The Oracle (type `1`)
3. Ask a question: `What is the meaning of life?`
4. Verify AI response appears
5. Ask another question
6. Type `Q` to exit

**Expected:**
- Oracle intro screen displays
- AI generates mystical responses
- Responses under 150 characters
- Can exit back to menu

---

### Test 6: Page SysOp
**What to test:** AI SysOp chat

**Steps:**
1. From main menu, type: `P`
2. Enter a question or leave blank
3. Verify AI response

**Expected:**
- AI SysOp responds within 5 seconds
- Response includes ANSI colors
- Response under 500 characters

---

### Test 7: Control Panel - Login
**What to test:** Admin authentication

**Steps:**
1. Open control panel: `http://localhost:5174` (if running)
2. Or start it: `cd client/control-panel && npm run dev`
3. Login with SysOp credentials
   - Note: You need a user with accessLevel >= 255
   - Create one manually or update existing user in database

**Expected:**
- Login form displays
- JWT token generated on successful login
- Dashboard displays

---

### Test 8: Control Panel - Users Page
**What to test:** User management interface

**Steps:**
1. Navigate to Users page
2. Verify user list displays
3. Check columns: handle, access level, registration date, last login, calls, posts

**Expected:**
- All registered users display
- Data is accurate
- SysOp badge shows for admin users

---

### Test 9: Control Panel - Message Bases Page
**What to test:** Message base management

**Steps:**
1. Navigate to Message Bases page
2. Click "Create New Base"
3. Fill form:
   - Name: `Test Base`
   - Description: `Testing message base creation`
   - Read Access: `0`
   - Write Access: `10`
4. Click Create
5. Verify new base appears in list
6. Click Edit on a base
7. Change description
8. Click Update
9. Verify changes saved

**Expected:**
- Can create new message bases
- Can edit existing bases
- Changes persist
- List updates in real-time

---

### Test 10: Control Panel - AI Settings Page
**What to test:** AI configuration display

**Steps:**
1. Navigate to AI Settings page
2. Verify provider shows: Anthropic Claude
3. Verify model shows: claude-3-5-haiku-20241022
4. Check SysOp settings status
5. Check Door games settings

**Expected:**
- All settings display correctly
- Status indicators show enabled/disabled
- Configuration instructions clear

---

### Test 11: Rate Limiting
**What to test:** Message posting rate limit

**Steps:**
1. Post 30 messages quickly in a message base
2. Try to post 31st message
3. Verify rate limit error

**Expected:**
- First 30 messages succeed
- 31st message blocked
- Error message shows time remaining

---

### Test 12: Input Sanitization
**What to test:** Security against injection

**Steps:**
1. Try to post message with ANSI codes: `\x1b[31mRed Text\x1b[0m`
2. Verify ANSI codes are escaped/removed
3. Try special characters in message subject

**Expected:**
- ANSI codes don't render in messages
- Special characters handled safely
- No injection attacks possible

---

### Test 13: Graceful Shutdown
**What to test:** Server shutdown handling

**Steps:**
1. While connected to terminal, press Ctrl+C in server terminal
2. Verify goodbye message appears
3. Verify connection closes gracefully

**Expected:**
- Goodbye ANSI art displays
- Message: "The system is shutting down for maintenance..."
- Connection closes cleanly
- No errors in logs

---

### Test 14: Multi-User Testing
**What to test:** Concurrent users

**Steps:**
1. Open 2 browser windows
2. Connect both to BBS
3. Register/login as different users
4. Post message from user 1
5. Verify user 2 can see the message
6. Test session isolation

**Expected:**
- Both users can connect simultaneously
- Messages visible across users
- Sessions don't interfere
- Each user has independent state

---

## 🐛 Known Issues to Watch For

1. **Database Locking** - SQLite may lock with concurrent writes
2. **WebSocket Reconnection** - May need manual refresh
3. **AI Rate Limits** - Anthropic API has rate limits
4. **Session Timeout** - 60 minutes of inactivity

---

## ✅ Success Criteria

**Core Functionality:**
- ✅ Users can register and login
- ✅ Message bases work (list, read, post)
- ✅ Door games work (The Oracle)
- ✅ Control panel accessible
- ✅ All 3 control panel pages functional
- ✅ Graceful shutdown works

**Security:**
- ✅ Rate limiting enforced
- ✅ Input sanitization working
- ✅ Password hashing secure
- ✅ JWT authentication working

**User Experience:**
- ✅ ANSI rendering correct
- ✅ Navigation intuitive
- ✅ Error messages helpful
- ✅ AI responses appropriate

---

## 📊 Test Results Template

```
Test #: [Number]
Test Name: [Name]
Status: [PASS/FAIL/SKIP]
Notes: [Any observations]
Issues Found: [List any bugs]
```

---

## 🔧 Troubleshooting

**Server won't start:**
- Check if port 8080 is in use: `lsof -i:8080`
- Kill process: `kill -9 [PID]`
- Check .env file has ANTHROPIC_API_KEY

**Terminal client won't connect:**
- Verify server is running
- Check WebSocket URL: ws://localhost:8080/ws
- Check browser console for errors

**Control panel won't login:**
- Verify user has accessLevel >= 255
- Check JWT secret in .env
- Check browser console for errors

**AI not responding:**
- Check ANTHROPIC_API_KEY in .env
- Verify API key is valid
- Check server logs for AI errors

---

## 📝 Next Steps After Testing

1. **Document any bugs found**
2. **Create list of improvements**
3. **Decide: Fix bugs or proceed to Milestone 6**
4. **Prepare demo scenarios**

---

**Happy Testing! 🚀**
