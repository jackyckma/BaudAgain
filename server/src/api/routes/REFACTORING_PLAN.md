# Routes Refactoring Plan - Task 39.1

**Status:** In Progress  
**Created:** December 3, 2025  
**Estimated Time:** 4-6 hours

---

## Overview

Split the monolithic `routes.ts` file (2,119 lines) into 6 manageable route modules.

---

## File Structure

```
server/src/api/routes/
├── auth.routes.ts          ✅ CREATED (Authentication - 5 endpoints)
├── user.routes.ts          ⏳ TODO (User management - 3 endpoints)
├── message.routes.ts       ⏳ TODO (Messages & bases - 7 endpoints)
├── door.routes.ts          ⏳ TODO (Door games - 8 endpoints)
├── system.routes.ts        ⏳ TODO (System admin - 2 endpoints)
└── config.routes.ts        ⏳ TODO (AI configuration - 4 endpoints)
```

---

## Completed

### ✅ auth.routes.ts (Created)

**Endpoints:**
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login with credentials
- POST `/api/v1/auth/refresh` - Refresh JWT token
- GET `/api/v1/auth/me` - Get current user
- POST `/api/login` - Legacy control panel login

**Lines:** ~250 lines  
**Dependencies:** UserRepository, JWTUtil, bcrypt, ErrorHandler

---

## Remaining Tasks

### ⏳ user.routes.ts

**Endpoints:**
- GET `/api/v1/users` - List all users
- GET `/api/v1/users/:id` - Get user profile
- PATCH `/api/v1/users/:id` - Update user profile
- PATCH `/api/users/:id` - Legacy update user access level
- GET `/api/users` - Legacy list users

**Estimated Lines:** ~300 lines  
**Dependencies:** UserRepository, JWTUtil

### ⏳ message.routes.ts

**Endpoints:**
- GET `/api/v1/message-bases` - List message bases
- GET `/api/v1/message-bases/:id` - Get message base details
- POST `/api/v1/message-bases` - Create message base (admin)
- GET `/api/v1/message-bases/:id/messages` - List messages
- POST `/api/v1/message-bases/:id/messages` - Post message
- GET `/api/v1/messages/:id` - Get message details
- POST `/api/v1/messages/:id/replies` - Post reply
- GET `/api/message-bases` - Legacy list message bases
- POST `/api/message-bases` - Legacy create message base
- PATCH `/api/message-bases/:id` - Legacy update message base
- DELETE `/api/message-bases/:id` - Legacy delete message base

**Estimated Lines:** ~600 lines  
**Dependencies:** MessageBaseRepository, MessageService, UserRepository

### ⏳ door.routes.ts

**Endpoints:**
- GET `/api/v1/doors` - List available doors
- POST `/api/v1/doors/:id/enter` - Enter door game
- POST `/api/v1/doors/:id/input` - Send input to door
- POST `/api/v1/doors/:id/exit` - Exit door game
- GET `/api/v1/doors/:id/session` - Get door session info
- POST `/api/v1/doors/:id/resume` - Resume saved session
- GET `/api/v1/doors/my-sessions` - Get user's saved sessions
- GET `/api/v1/doors/sessions` - Get all sessions (admin)
- GET `/api/v1/doors/:id/stats` - Get door statistics

**Estimated Lines:** ~500 lines  
**Dependencies:** DoorService, SessionManager

### ⏳ system.routes.ts

**Endpoints:**
- POST `/api/v1/system/announcement` - Send system announcement (admin)
- POST `/api/v1/ai/page-sysop` - Page the AI SysOp
- GET `/api/dashboard` - Legacy dashboard endpoint

**Estimated Lines:** ~250 lines  
**Dependencies:** NotificationService, AISysOp, SessionManager, UserRepository

### ⏳ config.routes.ts

**Endpoints:**
- GET `/api/ai-settings` - Legacy get AI settings
- POST `/api/v1/config/chat` - Chat with AI Config Assistant (admin)
- POST `/api/v1/config/apply` - Apply configuration changes (admin)
- GET `/api/v1/config/history` - Get conversation history (admin)
- POST `/api/v1/config/reset` - Reset conversation (admin)

**Estimated Lines:** ~300 lines  
**Dependencies:** AIConfigAssistant, BBSConfig

---

## Main routes.ts Refactor

After creating all route modules, update `routes.ts` to:

```typescript
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerUserRoutes } from './routes/user.routes.js';
import { registerMessageRoutes } from './routes/message.routes.js';
import { registerDoorRoutes } from './routes/door.routes.js';
import { registerSystemRoutes } from './routes/system.routes.js';
import { registerConfigRoutes } from './routes/config.routes.js';

export async function registerAPIRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  sessionManager: SessionManager,
  jwtUtil: JWTUtil,
  config: BBSConfig,
  messageBaseRepository?: MessageBaseRepository,
  messageService?: MessageService,
  doorService?: DoorService,
  notificationService?: NotificationService,
  aiConfigAssistant?: AIConfigAssistant,
  aiSysOp?: AISysOp
) {
  server.log.info('🔧 Registering REST API routes...');
  
  // Register all route modules
  await registerAuthRoutes(server, userRepository, jwtUtil);
  await registerUserRoutes(server, userRepository, jwtUtil, sessionManager);
  await registerMessageRoutes(server, messageBaseRepository, messageService, jwtUtil);
  await registerDoorRoutes(server, doorService, sessionManager, jwtUtil);
  await registerSystemRoutes(server, notificationService, aiSysOp, sessionManager, userRepository, jwtUtil);
  await registerConfigRoutes(server, aiConfigAssistant, config, jwtUtil);
  
  server.log.info('✅ REST API routes registered successfully');
}
```

**Target Lines:** ~100 lines (down from 2,119)

---

## Testing Strategy

After each route module is created:
1. Run unit tests: `npm test -- routes.test.ts --run`
2. Verify all 385 tests pass
3. Manual smoke test of key endpoints

---

## Next Steps

Due to the size of this refactoring (4-6 hours), I recommend:

**Option 1: Complete Refactoring (Recommended)**
- Continue creating all 6 route files
- Update main routes.ts
- Run full test suite
- Time: 4-6 hours

**Option 2: Incremental Approach**
- Create route files one at a time
- Test after each file
- Gradually migrate routes.ts
- Time: 6-8 hours (safer but slower)

**Option 3: Defer to Later**
- Document the plan (this file)
- Mark task as "planned"
- Continue with other Milestone 6.5 tasks
- Return to this when time permits

---

## Recommendation

Given that:
1. The architecture review identified this as P0 (Critical)
2. The current routes.ts is unmaintainable
3. This will significantly improve code quality

I recommend **Option 1** - complete the refactoring now before continuing with Milestone 7.

However, if time is constrained, we can:
- Complete Task 39.2 (APIResponseHelper) first - this is quicker (2-3 hours) and provides immediate value
- Then return to Task 39.1 with the helper utilities in place

---

**Status:** Awaiting decision on approach
