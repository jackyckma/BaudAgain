# Task 33: Terminal Client Hybrid Architecture - Implementation Plan

**Date:** December 2, 2025  
**Status:** In Progress  
**Estimated Duration:** 4-6 hours

---

## 🎯 Objective

Refactor the terminal client from WebSocket-only to hybrid REST + WebSocket architecture:
- **REST API** for actions (login, messages, doors)
- **WebSocket** for real-time notifications
- **Graceful fallback** to WebSocket-only mode
- **Zero visible changes** to user experience

---

## 📋 Pre-Implementation Checklist

### ✅ Backup Strategy
1. **Git commit** current working state before starting
2. **Copy original file** to `client/terminal/src/main.ts.backup`
3. **Document rollback** procedure below

### ✅ Prerequisites Verified
- ✅ REST API fully implemented (19 endpoints)
- ✅ WebSocket notification system complete
- ✅ JWT authentication working
- ✅ All API tests passing

---

## 🔄 Rollback Procedure

If implementation fails or causes issues:

### Quick Rollback (5 minutes):
```bash
# Restore backup file
cp client/terminal/src/main.ts.backup client/terminal/src/main.ts

# Rebuild terminal client
cd client/terminal
npm run build

# Restart server
cd ../../server
npm run dev
```

### Git Rollback:
```bash
# Revert to last commit
git checkout client/terminal/src/main.ts

# Or reset to specific commit
git reset --hard <commit-hash>
```

---

## 📐 Architecture Design

### Current Architecture (WebSocket-Only):
```
Terminal Client
    ↓ WebSocket
    ↓ (commands + responses)
    ↓
BBS Server
```

### Target Architecture (Hybrid):
```
Terminal Client
    ↓ REST API (actions)
    ↓ WebSocket (notifications)
    ↓
BBS Server
```

### Communication Flow:

**Actions (REST API):**
- User types command → Parse command → REST API call → Display response
- Examples: login, register, post message, enter door

**Notifications (WebSocket):**
- Server event → WebSocket message → Update terminal display
- Examples: new message, user joined, door update

---

## 🏗️ Implementation Steps

### Phase 1: Setup & Infrastructure (30 min)

**Step 1.1: Create backup**
- ✅ Copy `main.ts` to `main.ts.backup`
- ✅ Commit current state to git

**Step 1.2: Create API client module**
- Create `client/terminal/src/api-client.ts`
- Implement REST API wrapper functions
- Handle JWT token storage
- Implement error handling

**Step 1.3: Create notification handler**
- Create `client/terminal/src/notification-handler.ts`
- Subscribe to notification events
- Update terminal based on notifications

**Step 1.4: Create state manager**
- Create `client/terminal/src/state.ts`
- Track authentication state
- Track current menu/context
- Store JWT token

---

### Phase 2: Core Refactoring (2 hours)

**Step 2.1: Refactor authentication flow**
- Replace WebSocket login with REST API `/api/v1/auth/login`
- Replace WebSocket register with REST API `/api/v1/auth/register`
- Store JWT token in state
- Keep WebSocket for notifications

**Step 2.2: Refactor message operations**
- Replace WebSocket message list with REST API `/api/v1/message-bases/:id/messages`
- Replace WebSocket post message with REST API `/api/v1/message-bases/:id/messages`
- Subscribe to MESSAGE_NEW notifications

**Step 2.3: Refactor door operations**
- Replace WebSocket door enter with REST API `/api/v1/doors/:id/enter`
- Replace WebSocket door input with REST API `/api/v1/doors/:id/input`
- Replace WebSocket door exit with REST API `/api/v1/doors/:id/exit`
- Subscribe to DOOR_* notifications

**Step 2.4: Update command parser**
- Parse user input to determine action type
- Route to appropriate API call
- Handle responses and display

---

### Phase 3: Notification Integration (1 hour)

**Step 3.1: WebSocket notification setup**
- Connect WebSocket for notifications only
- Subscribe to relevant events
- Handle notification messages

**Step 3.2: Update terminal on notifications**
- Display new message notifications
- Display user activity notifications
- Display system announcements

**Step 3.3: Handle reconnection**
- Detect WebSocket disconnection
- Attempt reconnection
- Restore subscriptions

---

### Phase 4: Fallback Mode (1 hour)

**Step 4.1: Detect API unavailability**
- Try REST API call
- Catch connection errors
- Set fallback flag

**Step 4.2: Implement WebSocket fallback**
- If API unavailable, use WebSocket commands
- Log fallback events
- Display warning to user

**Step 4.3: Recovery from fallback**
- Periodically check API availability
- Switch back to REST when available
- Clear fallback flag

---

### Phase 5: Testing & Validation (1 hour)

**Step 5.1: Manual testing**
- Test login flow
- Test registration flow
- Test message operations
- Test door operations
- Test notifications
- Test fallback mode

**Step 5.2: Error handling**
- Test network errors
- Test authentication errors
- Test rate limiting
- Test invalid input

**Step 5.3: User experience**
- Verify no visible changes
- Check response times
- Verify ANSI rendering
- Test on different browsers

---

## 🚨 Known Challenges & Solutions

### Challenge 1: Asynchronous API Calls
**Problem:** REST API calls are async, WebSocket was synchronous  
**Solution:** Use async/await, show loading indicators, queue commands

### Challenge 2: State Management
**Problem:** Need to track auth state, current context, JWT token  
**Solution:** Create simple state manager with getters/setters

### Challenge 3: Command Parsing
**Problem:** Need to parse user input to determine API endpoint  
**Solution:** Create command parser that maps input to API calls

### Challenge 4: Notification Timing
**Problem:** Notifications may arrive while user is typing  
**Solution:** Buffer notifications, display at appropriate times

### Challenge 5: Error Handling
**Problem:** API errors need to be displayed gracefully  
**Solution:** Catch all errors, display user-friendly messages

### Challenge 6: Token Management
**Problem:** JWT token needs to be stored and sent with requests  
**Solution:** Store in memory, include in Authorization header

---

## 📊 Success Criteria

### Must Have:
- ✅ Login works via REST API
- ✅ Registration works via REST API
- ✅ Message operations work via REST API
- ✅ Door operations work via REST API
- ✅ Notifications work via WebSocket
- ✅ No visible changes to user experience
- ✅ Graceful error handling

### Nice to Have:
- ✅ Fallback to WebSocket-only mode
- ✅ Loading indicators for API calls
- ✅ Retry logic for failed requests
- ✅ Performance metrics logging

---

## 🔍 Testing Checklist

### Functional Tests:
- [ ] User can connect to BBS
- [ ] User can register new account
- [ ] User can login with credentials
- [ ] User can view message bases
- [ ] User can read messages
- [ ] User can post messages
- [ ] User can enter door games
- [ ] User can play door games
- [ ] User can exit door games
- [ ] User receives new message notifications
- [ ] User receives user activity notifications

### Error Tests:
- [ ] Invalid credentials handled gracefully
- [ ] Network errors handled gracefully
- [ ] Rate limiting handled gracefully
- [ ] API unavailable triggers fallback
- [ ] WebSocket disconnection handled

### Performance Tests:
- [ ] Login response < 500ms
- [ ] Message list response < 500ms
- [ ] Door operations response < 500ms
- [ ] Notifications delivered < 100ms

---

## 📝 Implementation Notes

### API Endpoints to Use:

**Authentication:**
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login user
- GET `/api/v1/auth/me` - Get current user

**Messages:**
- GET `/api/v1/message-bases` - List message bases
- GET `/api/v1/message-bases/:id/messages` - List messages
- POST `/api/v1/message-bases/:id/messages` - Post message

**Doors:**
- GET `/api/v1/doors` - List doors
- POST `/api/v1/doors/:id/enter` - Enter door
- POST `/api/v1/doors/:id/input` - Send input
- POST `/api/v1/doors/:id/exit` - Exit door

**Notifications (WebSocket):**
- MESSAGE_NEW - New message posted
- USER_JOINED - User joined BBS
- USER_LEFT - User left BBS
- DOOR_ENTERED - User entered door
- DOOR_EXITED - User exited door

---

## 🎯 Current Status

**Phase:** Pre-Implementation  
**Progress:** 0%  
**Blockers:** None  
**Next Step:** Create backup and start Phase 1

---

## 📅 Timeline

**Start:** December 2, 2025 - 15:30  
**Estimated Completion:** December 2, 2025 - 21:30  
**Actual Completion:** TBD

---

## ✅ Completion Checklist

- [ ] All implementation phases complete
- [ ] All tests passing
- [ ] No regressions in user experience
- [ ] Documentation updated
- [ ] Backup files can be deleted
- [ ] Task 33 marked complete in tasks.md

---

**Status:** Ready to begin implementation  
**Confidence Level:** High  
**Risk Level:** Medium (significant refactoring, but well-planned)

