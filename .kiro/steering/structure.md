# Project Structure & Architecture Patterns

## Directory Organization

```
baudagain/
├── server/                 # BBS Server (Node.js/TypeScript)
│   ├── src/
│   │   ├── ai/            # AI provider abstraction & services
│   │   ├── ansi/          # ANSI rendering system (centralized)
│   │   ├── api/           # REST API routes & middleware
│   │   ├── auth/          # JWT authentication utilities
│   │   ├── config/        # Configuration loader
│   │   ├── connection/    # Protocol abstraction (WebSocket, future: Telnet)
│   │   ├── core/          # BBSCore command router
│   │   ├── db/            # Database & repositories
│   │   ├── doors/         # Door game implementations
│   │   ├── handlers/      # Business logic handlers
│   │   ├── notifications/ # WebSocket notification system
│   │   ├── performance/   # Benchmarking utilities
│   │   ├── services/      # Service layer (User, Message, Door, AI)
│   │   ├── session/       # Session management
│   │   ├── terminal/      # Terminal rendering layer
│   │   ├── testing/       # MCP-based testing framework
│   │   └── utils/         # Shared utilities
│   ├── scripts/           # Utility scripts (setup, init, debug)
│   └── data/              # Runtime database & ANSI art files
├── client/
│   ├── terminal/          # Web terminal client (xterm.js)
│   └── control-panel/     # SysOp admin panel (React)
├── packages/
│   └── shared/            # Shared types & constants
├── data/                  # ANSI art templates
├── docs/                  # Documentation & architecture reviews
├── deployment/            # Deployment scripts & configs
└── .kiro/                 # Kiro configuration & specs
    ├── specs/             # Feature specifications
    └── steering/          # AI assistant guidance (this file)
```

## Architecture Patterns

### Layered Architecture

The system follows a strict layered approach:

1. **Connection Layer** (`connection/`) - Protocol abstraction (WebSocket, future: Telnet, SSH)
2. **Session Layer** (`session/`) - User state management across connection lifecycle
3. **Core Layer** (`core/`) - Command routing via Chain of Responsibility pattern
4. **Handler Layer** (`handlers/`) - Business logic for specific features
5. **Service Layer** (`services/`) - Reusable business logic
6. **Data Layer** (`db/repositories/`) - Database access via Repository pattern
7. **Rendering Layer** (`terminal/`, `ansi/`) - Content presentation

### Key Design Patterns

**Chain of Responsibility** (BBSCore + Handlers)
- Handlers registered in priority order
- Each handler checks `canHandle()` before processing
- First match wins, short-circuit evaluation

**Repository Pattern** (Data Layer)
- All database access through repositories
- Isolates SQL from business logic
- Single source of truth: `server/src/db/Database.ts`

**Strategy Pattern** (Terminal Renderers)
- Different rendering strategies for different contexts (terminal, telnet, web)
- Handlers create structured content, renderers handle formatting

**Dependency Injection**
- Handlers receive dependencies via constructor
- Services injected into handlers
- Enables testing with mocks

**Interface Segregation**
- Small, focused interfaces (IConnection, CommandHandler)
- Easy to implement new types

## Critical File Locations

### Database (SINGLE SOURCE OF TRUTH)
- **Database Class**: `server/src/db/Database.ts` (ONLY location)
- **Schema Definition**: `server/src/db/schema.sql`
- **Runtime Database**: `data/bbs.db` (created on first run)
- **⚠️ NEVER** create duplicate Database.ts files in other locations

### ANSI Rendering (Centralized System)
- **Main Service**: `server/src/ansi/ANSIRenderingService.ts`
- **Core Utilities**: `server/src/ansi/` (ANSIWidthCalculator, ANSIColorizer, ANSIValidator, ANSIFrameBuilder)
- **Templates**: `data/ansi/*.ans`
- **⚠️ ALWAYS** use ANSIRenderingService for all ANSI output

### Configuration
- **Config File**: `config.yaml` (BBS configuration)
- **Environment**: `.env` (secrets and environment variables)
- **Loader**: `server/src/config/ConfigLoader.ts`

### API Documentation
- **OpenAPI Spec**: `server/openapi.yaml` (main API)
- **AI Features Spec**: `server/openapi-ai-features.yaml`
- **API Guide**: `server/API_README.md`
- **Examples**: `server/API_CODE_EXAMPLES.md`, `server/API_CURL_EXAMPLES.md`

## Handler Registration Order

Handlers are registered in priority order (first match wins):

1. **AuthHandler** - Login/registration (CONNECTED, AUTHENTICATING states)
2. **DoorHandler** - Door games (IN_DOOR state)
3. **MessageHandler** - Message operations (message commands)
4. **ArtGalleryHandler** - Art gallery (art commands)
5. **UserProfileHandler** - User profiles (profile commands)
6. **MenuHandler** - Main menu (authenticated users, fallback)

## Import Conventions

### ES Modules
Always use `.js` extension in imports:
```typescript
// ✅ Correct
import { BBSDatabase } from '../Database.js';
import { UserRepository } from './repositories/UserRepository.js';

// ❌ Wrong
import { BBSDatabase } from '../Database';
```

### Relative Imports
Use relative paths within the same workspace:
```typescript
// Within server/src/
import { BBSCore } from './core/BBSCore.js';
import { UserService } from './services/UserService.js';
```

### Shared Package Imports
Use package name for shared code:
```typescript
import { ContentType, type WelcomeScreenContent } from '@baudagain/shared';
```

## Code Organization Principles

### Single Responsibility
- Each handler manages one feature area
- Each service encapsulates one business domain
- Each repository manages one entity type

### Separation of Concerns
- Handlers don't know about ANSI codes (use renderers)
- Services don't know about HTTP/WebSocket (use handlers)
- Repositories don't know about business logic (use services)

### Dependency Direction
- Outer layers depend on inner layers
- Core/domain logic has no dependencies on infrastructure
- Infrastructure (API, WebSocket) depends on core

## Testing Organization

### Test Location
Tests live alongside source files:
```
server/src/ansi/
├── ANSIFrameBuilder.ts
├── ANSIFrameBuilder.test.ts
└── ANSIFrameBuilder.property.test.ts
```

### Test Types by Directory
- `src/**/*.test.ts` - Unit tests
- `src/**/*.property.test.ts` - Property-based tests
- `src/**/*.integration.test.ts` - Integration tests
- `src/testing/journey-*.test.md` - MCP user journey tests

### Test Data
- Setup scripts: `server/scripts/setup-test-data.ts`
- Test helpers: `server/src/testing/mcp-helpers.ts`
- Journey helpers: `server/src/testing/user-journey-mcp-helpers.ts`

## Documentation Organization

### Active Documentation (Root)
- `README.md` - Project overview & quick start
- `ARCHITECTURE.md` - System architecture
- `PROJECT_ROADMAP.md` - Milestone tracking

### Detailed Documentation (docs/)
- `docs/MILESTONE_STATUS.md` - Current milestone progress
- `docs/ARCHITECTURE_REVIEW_LATEST.md` - Latest architecture review
- `docs/REFACTORING_PRIORITY_LIST_*.md` - Technical debt tracking

### Historical Documentation (docs/archive/)
- Old architecture reviews
- Completed milestone summaries
- Historical planning documents

### API Documentation (server/)
- `server/API_README.md` - API overview
- `server/openapi.yaml` - OpenAPI specification
- `server/API_CURL_EXAMPLES.md` - curl examples
- `server/API_CODE_EXAMPLES.md` - Integration examples

## Common Pitfalls to Avoid

### ⚠️ Database File Duplication
NEVER create multiple Database.ts files. Import from `server/src/db/Database.ts` only.

### ⚠️ Direct ANSI Code Usage
NEVER construct ANSI strings manually. Always use ANSIRenderingService or ANSIColorizer.

### ⚠️ Circular Dependencies
- Handlers should not import other handlers
- Use BBSCore for handler communication
- Repositories should not import handlers

### ⚠️ Session State Mutation
- Always update session through SessionManager
- Don't modify session objects directly

### ⚠️ Missing .js Extensions
ES modules require `.js` extension in imports, even for TypeScript files.

## File Naming Conventions

### TypeScript Files
- PascalCase for classes: `ANSIFrameBuilder.ts`
- camelCase for utilities: `jwt.ts`
- kebab-case for multi-word utilities: `rate-limit.ts`

### Test Files
- Same name as source + suffix: `ANSIFrameBuilder.test.ts`
- Property tests: `ANSIFrameBuilder.property.test.ts`
- Integration tests: `MessageHandler.integration.test.ts`

### Documentation
- SCREAMING_SNAKE_CASE for status docs: `MILESTONE_STATUS.md`
- kebab-case for guides: `api-testing-guide.md`
- Date suffix for historical: `ARCHITECTURE_REVIEW_2025-12-04.md`

## Hybrid Architecture Flow

### User Actions (REST API)
```
Client → REST API → Handler → Service → Repository → Database
                                      ↓
                              NotificationService → WebSocket → Clients
```

### Real-time Updates (WebSocket)
```
Server Event → NotificationService → WebSocket → Subscribed Clients
```

### Terminal Client Pattern
1. Use REST API for all user actions (login, post message, enter door)
2. Use WebSocket for real-time notifications (new messages, user activity)
3. Graceful fallback to WebSocket commands if REST unavailable

## Service Layer Responsibilities

- **UserService**: User CRUD, authentication
- **MessageService**: Message operations, notifications
- **DoorService**: Door game lifecycle, session management
- **SessionService**: Session tracking, cleanup
- **AIService**: AI provider abstraction
- **NotificationService**: WebSocket event broadcasting
- **ScheduledTaskService**: Cron-like task scheduling

## When to Create New Files

### New Handler
Create when adding a new feature area (e.g., file transfer, chat rooms):
- `server/src/handlers/NewFeatureHandler.ts`
- Register in `server/src/index.ts` in priority order

### New Service
Create when extracting reusable business logic:
- `server/src/services/NewService.ts`
- Inject into handlers that need it

### New Repository
Create when adding a new database entity:
- `server/src/db/repositories/NewEntityRepository.ts`
- Import Database from `../Database.js`

### New API Route
Add to existing route files or create new:
- `server/src/api/routes/new-feature.routes.ts`
- Register in `server/src/api/routes.ts`

### New Door Game
Create in doors directory:
- `server/src/doors/NewDoor.ts`
- Implement Door interface
- Register with DoorHandler
