# Milestone 6.5: Code Quality Refactoring - Checklist

**Status:** Ready to Start  
**Timeline:** 3-4 days  
**Priority:** Complete before Milestone 7

---

## 🔴 P0 - Critical (Must Complete)

### Task 39.1: Split routes.ts into Separate Files
**Estimated Time:** 4-6 hours

- [ ] Create `server/src/api/routes/` directory
- [ ] Create `auth.routes.ts` (~250 lines)
  - [ ] Move authentication endpoints (register, login, refresh, me)
  - [ ] Export `registerAuthRoutes` function
  - [ ] Add tests
- [ ] Create `user.routes.ts` (~300 lines)
  - [ ] Move user management endpoints (list, get, update)
  - [ ] Export `registerUserRoutes` function
  - [ ] Add tests
- [ ] Create `message.routes.ts` (~400 lines)
  - [ ] Move message base endpoints
  - [ ] Move message endpoints
  - [ ] Export `registerMessageRoutes` function
  - [ ] Add tests
- [ ] Create `door.routes.ts` (~500 lines)
  - [ ] Move door game endpoints (list, enter, input, exit, session, resume, stats)
  - [ ] Export `registerDoorRoutes` function
  - [ ] Add tests
- [ ] Create `system.routes.ts` (~150 lines)
  - [ ] Move system announcement endpoint
  - [ ] Export `registerSystemRoutes` function
  - [ ] Add tests
- [ ] Create `config.routes.ts` (~200 lines)
  - [ ] Move AI config assistant endpoints (chat, apply, history, reset)
  - [ ] Export `registerConfigRoutes` function
  - [ ] Add tests
- [ ] Update `server/src/api/routes.ts`
  - [ ] Import all route modules
  - [ ] Register routes in correct order
  - [ ] Keep legacy control panel endpoints
  - [ ] Reduce to ~100 lines
- [ ] Run full test suite (385 tests)
- [ ] Manual testing of all endpoints
- [ ] Update API documentation if needed

**Success Criteria:**
- ✅ routes.ts reduced from 2031 to ~100 lines
- ✅ 6 new route files created, each < 500 lines
- ✅ All tests passing
- ✅ No functional regressions

---

### Task 39.2: Create APIResponseHelper Utility
**Estimated Time:** 2-3 hours

- [ ] Create `server/src/api/utils/response-helpers.ts`
- [ ] Implement helper methods:
  - [ ] `serviceUnavailable(reply, serviceName)`
  - [ ] `invalidInput(reply, message)`
  - [ ] `notFound(reply, resource)`
  - [ ] `forbidden(reply, message)`
  - [ ] `unauthorized(reply, message)`
  - [ ] `rateLimitExceeded(reply, message)`
  - [ ] `internalError(reply, message)`
  - [ ] `handleServiceError(reply, error)`
- [ ] Add TypeScript types and JSDoc comments
- [ ] Update route files to use helpers:
  - [ ] auth.routes.ts
  - [ ] user.routes.ts
  - [ ] message.routes.ts
  - [ ] door.routes.ts
  - [ ] system.routes.ts
  - [ ] config.routes.ts
- [ ] Remove old error handling code
- [ ] Run full test suite
- [ ] Verify error responses are consistent

**Success Criteria:**
- ✅ APIResponseHelper utility created
- ✅ All routes using helpers
- ✅ Code reduced by ~40% in handlers
- ✅ All tests passing
- ✅ Consistent error format

---

## 🟡 P1 - High Priority (Complete Soon)

### Task 39.3: Add JSON Schema Validation
**Estimated Time:** 3-4 hours

- [ ] Create `server/src/api/schemas/` directory
- [ ] Create schema files:
  - [ ] `auth.schemas.ts` (register, login)
  - [ ] `user.schemas.ts` (update user)
  - [ ] `message.schemas.ts` (post message, post reply, create base)
  - [ ] `door.schemas.ts` (door input)
  - [ ] `system.schemas.ts` (announcement)
  - [ ] `config.schemas.ts` (chat, apply)
- [ ] Update routes to use schemas
- [ ] Remove manual validation code
- [ ] Run full test suite
- [ ] Verify validation error messages

**Success Criteria:**
- ✅ Schema files created
- ✅ All endpoints using JSON Schema validation
- ✅ Manual validation code removed
- ✅ All tests passing
- ✅ Better error messages

---

### Task 39.4: Optimize Door Timeout Checking
**Estimated Time:** 2-3 hours

- [ ] Remove `setInterval` timeout checking from DoorHandler
- [ ] Implement lazy timeout check method
- [ ] Add timeout check to `handleDoorInput`
- [ ] Update timeout error message
- [ ] Update tests to verify timeout behavior
- [ ] Test with multiple concurrent door sessions
- [ ] Verify no performance regression

**Success Criteria:**
- ✅ Polling removed
- ✅ Lazy evaluation implemented
- ✅ All tests passing
- ✅ Timeout behavior verified

---

### Task 39.5: Configure CORS for Production
**Estimated Time:** 30 minutes

- [ ] Update CORS configuration in `server/src/index.ts`
- [ ] Add environment-based origin whitelist
- [ ] Add `ALLOWED_ORIGINS` to `.env.example`
- [ ] Document CORS configuration in README
- [ ] Test with production-like setup
- [ ] Verify credentials handling

**Success Criteria:**
- ✅ CORS configured for production
- ✅ Environment variable added
- ✅ Documentation updated
- ✅ Tested with production setup

---

## Testing Checklist

### Unit Tests
- [ ] All 385 existing tests passing
- [ ] New tests for route modules
- [ ] Tests for APIResponseHelper
- [ ] Tests for schema validation

### Integration Tests
- [ ] All API endpoints working
- [ ] Error responses consistent
- [ ] Validation working correctly
- [ ] Door timeout behavior correct

### Manual Testing
- [ ] Terminal client works
- [ ] Control panel works
- [ ] All REST API endpoints accessible
- [ ] WebSocket notifications working
- [ ] Door games functional

---

## Documentation Updates

- [ ] Update `ARCHITECTURE.md` with new structure
- [ ] Update `server/API_README.md` if needed
- [ ] Update `PROJECT_ROADMAP.md` progress
- [ ] Create completion report for Milestone 6.5

---

## Completion Criteria

### Code Quality
- ✅ routes.ts < 200 lines
- ✅ All route files < 500 lines
- ✅ Code duplication reduced by 40%
- ✅ No manual validation in handlers
- ✅ Consistent error handling

### Testing
- ✅ All 385 tests passing
- ✅ No functional regressions
- ✅ Manual testing complete
- ✅ Performance verified

### Documentation
- ✅ Architecture documentation updated
- ✅ API documentation current
- ✅ Completion report written

### Architecture
- ✅ Architecture score ≥ 9.0/10
- ✅ Technical debt reduced
- ✅ Codebase ready for Milestone 7

---

## Progress Tracking

**Started:** [Date]  
**P0 Completed:** [Date]  
**P1 Completed:** [Date]  
**Finished:** [Date]

**Total Time:** [Hours]

---

## Notes

- Keep each refactoring in separate git commits for easy rollback
- Run tests after each major change
- Update documentation as you go
- Communicate progress daily

---

**Document Version:** 1.0  
**Last Updated:** December 3, 2025

