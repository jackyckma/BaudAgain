# BaudAgain BBS - Refactoring Action Plan
## Post-Milestone 6 Code Quality Improvements

**Date:** December 3, 2025  
**Status:** Ready for Implementation  
**Priority:** Complete P0 items before Milestone 7

---

## Quick Summary

After completing Milestone 6, the codebase has accumulated some technical debt that should be addressed before proceeding with Milestone 7 (comprehensive testing). This document outlines specific, actionable refactorings to improve code quality and maintainability.

**Architecture Score:** 8.7/10 (good, but can be improved to 9.2/10 with P0 refactorings)

---

## 🔴 P0 - Critical Priority (Must Do Before Milestone 7)

### 1. Split routes.ts into Separate Route Files

**Problem:** `server/src/api/routes.ts` is 2031 lines long, making it difficult to maintain and extend.

**Solution:** Split into 6 separate route files:

```
server/src/api/routes/
├── auth.routes.ts       (~250 lines) - Authentication endpoints
├── user.routes.ts       (~300 lines) - User management
├── message.routes.ts    (~400 lines) - Message bases & messages
├── door.routes.ts       (~500 lines) - Door game operations
├── system.routes.ts     (~150 lines) - System announcements
└── config.routes.ts     (~200 lines) - AI config assistant
```

**Estimated Effort:** 4-6 hours  
**Impact:** High - significantly improves maintainability  
**Risk:** Low - straightforward refactoring with existing tests

**Implementation Steps:**
1. Create `server/src/api/routes/` directory
2. Create each route file with appropriate exports
3. Update `server/src/api/routes.ts` to import and register routes
4. Run tests to verify no regressions
5. Update documentation if needed

---

### 2. Create APIResponseHelper Utility

**Problem:** Error response patterns are duplicated 30+ times across endpoints.

**Solution:** Create `server/src/api/utils/response-helpers.ts`:

```typescript
export class APIResponseHelper {
  static serviceUnavailable(reply: FastifyReply, serviceName: string) {
    return reply.code(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${serviceName} not available`
      }
    });
  }

  static invalidInput(reply: FastifyReply, message: string) {
    return reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message
      }
    });
  }

  static notFound(reply: FastifyReply, resource: string) {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`
      }
    });
  }

  static forbidden(reply: FastifyReply, message: string) {
    return reply.code(403).send({
      error: {
        code: 'FORBIDDEN',
        message
      }
    });
  }

  static unauthorized(reply: FastifyReply, message: string = 'Unauthorized') {
    return reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message
      }
    });
  }

  static rateLimitExceeded(reply: FastifyReply, message: string) {
    return reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    });
  }

  static internalError(reply: FastifyReply, message: string = 'Internal server error') {
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message
      }
    });
  }

  static handleServiceError(reply: FastifyReply, error: Error) {
    if (error.message.includes('Rate limit exceeded')) {
      return this.rateLimitExceeded(reply, error.message);
    }
    
    if (error.message.includes('not found')) {
      return this.notFound(reply, 'Resource');
    }
    
    return this.invalidInput(reply, error.message);
  }
}
```

**Usage Example:**
```typescript
// Before (verbose)
if (!messageService) {
  reply.code(501).send({ 
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Message service not available'
    }
  });
  return;
}

// After (concise)
if (!messageService) {
  return APIResponseHelper.serviceUnavailable(reply, 'Message service');
}
```

**Estimated Effort:** 2-3 hours  
**Impact:** High - reduces code by ~40% in route handlers  
**Risk:** Low - simple utility class

**Implementation Steps:**
1. Create `server/src/api/utils/response-helpers.ts`
2. Implement all helper methods
3. Update route files to use helpers (can be done incrementally)
4. Run tests to verify no regressions
5. Remove old error handling code

---

## 🟡 P1 - High Priority (Do Soon)

### 3. Add JSON Schema Validation to Endpoints

**Problem:** Request validation is done manually in each endpoint, leading to code duplication.

**Solution:** Use Fastify's built-in JSON Schema validation:

```typescript
// server/src/api/schemas/message.schemas.ts
export const postMessageSchema = {
  body: {
    type: 'object',
    required: ['subject', 'body'],
    properties: {
      subject: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 200 
      },
      body: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 10000 
      }
    }
  }
};

// Usage in route
server.post('/api/v1/message-bases/:id/messages', {
  preHandler: authenticateUser,
  schema: postMessageSchema,  // Automatic validation
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } }
}, async (request, reply) => {
  // Body is already validated - no manual checks needed
  const { subject, body } = request.body;
  // ... rest of handler
});
```

**Estimated Effort:** 3-4 hours  
**Impact:** Medium - improves code quality and validation  
**Risk:** Low - Fastify built-in feature

**Implementation Steps:**
1. Create `server/src/api/schemas/` directory
2. Create schema files for each route group
3. Update routes to use schemas
4. Remove manual validation code
5. Run tests to verify validation still works

---

### 4. Optimize Door Timeout Checking

**Problem:** Door timeout checking polls all sessions every 5 minutes, which is inefficient.

**Solution:** Use lazy evaluation (check on each input):

```typescript
private checkSessionTimeout(session: Session): boolean {
  if (session.state === SessionState.IN_DOOR) {
    const inactiveTime = Date.now() - session.lastActivity.getTime();
    if (inactiveTime > this.doorTimeoutMs) {
      this.exitDoorDueToTimeout(session);
      return true;
    }
  }
  return false;
}

async handleDoorInput(command: string, session: Session): Promise<string> {
  // Check timeout on each input (lazy evaluation)
  if (this.checkSessionTimeout(session)) {
    return '\r\n\x1b[33mYour door session has timed out due to inactivity.\x1b[0m\r\n' +
           'Returning to main menu...\r\n\r\n';
  }
  
  // ... rest of handler
}
```

**Estimated Effort:** 2-3 hours  
**Impact:** Medium - improves performance  
**Risk:** Low - well-tested functionality

**Implementation Steps:**
1. Remove `setInterval` timeout checking
2. Add lazy timeout check to `handleDoorInput`
3. Update tests to verify timeout behavior
4. Test with multiple concurrent door sessions

---

### 5. Configure CORS for Production

**Problem:** CORS is currently set to allow all origins (development mode).

**Solution:** Configure CORS based on environment:

```typescript
await server.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : true,
  credentials: true,
});
```

**Estimated Effort:** 30 minutes  
**Impact:** High - security concern  
**Risk:** Low - configuration change

**Implementation Steps:**
1. Update `server/src/index.ts` CORS configuration
2. Add `ALLOWED_ORIGINS` to `.env.example`
3. Document CORS configuration in README
4. Test with production-like setup

---

## 🟢 P2 - Nice to Have (Future Improvements)

### 6. Add Error Strategy Pattern

**Problem:** Error handling logic is scattered across endpoints.

**Solution:** Create error strategy for consistent error mapping:

```typescript
class ErrorStrategy {
  static handle(error: Error, reply: FastifyReply): void {
    const strategies = [
      { pattern: /not found/i, code: 404, errorCode: 'NOT_FOUND' },
      { pattern: /does not belong/i, code: 403, errorCode: 'FORBIDDEN' },
      { pattern: /rate limit/i, code: 429, errorCode: 'RATE_LIMIT_EXCEEDED' },
    ];
    
    for (const strategy of strategies) {
      if (strategy.pattern.test(error.message)) {
        return reply.code(strategy.code).send({
          error: { code: strategy.errorCode, message: error.message }
        });
      }
    }
    
    // Default
    return reply.code(500).send({
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
}
```

**Estimated Effort:** 2-3 hours  
**Impact:** Low - code organization  
**Risk:** Low

---

### 7. Add Caching Layer

**Problem:** Frequently accessed data (message bases, user info) is fetched from database on every request.

**Solution:** Add simple in-memory cache with TTL:

```typescript
class CacheService {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
}
```

**Estimated Effort:** 4-6 hours  
**Impact:** Medium - performance improvement  
**Risk:** Medium - cache invalidation complexity

---

### 8. Add Database Query Performance Monitoring

**Problem:** No visibility into database query performance.

**Solution:** Add query timing and logging:

```typescript
class BBSDatabase {
  run(sql: string, params?: any[]): any {
    const start = Date.now();
    const result = this.db.prepare(sql).run(params);
    const duration = Date.now() - start;
    
    if (duration > 100) {
      this.logger.warn({ sql, duration }, 'Slow query detected');
    }
    
    return result;
  }
}
```

**Estimated Effort:** 3-4 hours  
**Impact:** Medium - observability  
**Risk:** Low

---

## Implementation Timeline

### Week 1 (Before Milestone 7)
- **Day 1-2:** Complete P0 items (routes refactoring + response helpers)
- **Day 3:** Complete P1 items (JSON schema + door timeout + CORS)
- **Day 4:** Testing and verification
- **Day 5:** Documentation updates

### Week 2 (During Milestone 7)
- Focus on comprehensive testing
- P2 items can be done in parallel if time permits

---

## Success Criteria

### P0 Completion
- ✅ routes.ts split into 6 files, each < 500 lines
- ✅ APIResponseHelper utility created and used in all routes
- ✅ All tests passing (385 tests)
- ✅ No regressions in functionality

### P1 Completion
- ✅ JSON Schema validation added to all endpoints
- ✅ Door timeout checking optimized
- ✅ CORS configured for production
- ✅ All tests passing

### Overall Goals
- 📈 Architecture score improves from 8.7/10 to 9.2/10
- 📉 Code duplication reduced by 40%
- 📉 Average route file size reduced from 2031 to ~300 lines
- ✅ Codebase ready for Milestone 7 testing

---

## Risk Mitigation

### Testing Strategy
1. Run full test suite after each refactoring
2. Manual testing of affected endpoints
3. Integration testing with terminal client
4. Performance testing for door timeout changes

### Rollback Plan
1. Each refactoring in separate git commit
2. Can revert individual changes if issues found
3. Keep old code commented out temporarily

### Communication
1. Update team on progress daily
2. Document any issues encountered
3. Update architecture documentation after completion

---

## References

- Full Architecture Review: `docs/ARCHITECTURE_REVIEW_2025-12-03_COMPREHENSIVE_POST_MILESTONE_6.md`
- Current Roadmap: `PROJECT_ROADMAP.md`
- API Documentation: `server/API_README.md`

---

**Document Version:** 1.0  
**Last Updated:** December 3, 2025  
**Next Review:** After P0 completion

