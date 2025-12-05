# Technology Stack & Build System

## Core Technologies

### Backend
- **Runtime**: Node.js 20+ with TypeScript 5.7+
- **Framework**: Fastify 5.x with WebSocket support
- **Database**: SQLite (better-sqlite3)
- **AI Provider**: Anthropic Claude API (@anthropic-ai/sdk)
- **Authentication**: JWT (jsonwebtoken) with bcrypt for password hashing
- **Module System**: ES Modules (type: "module")

### Frontend
- **Terminal Client**: Vite + xterm.js for terminal emulation
- **Control Panel**: React 18 + Vite + Tailwind CSS
- **Build Tool**: Vite for both clients

### Testing
- **Test Framework**: Vitest with globals enabled
- **Property-Based Testing**: fast-check for randomized testing
- **Coverage**: v8 provider with text/json/html reporters
- **MCP Testing**: Chrome DevTools MCP for end-to-end user journey tests

### Development Tools
- **Dev Server**: tsx watch for hot reload
- **TypeScript Config**: ES2022 target, strict mode, node module resolution
- **Logging**: pino-pretty for development

## Common Commands

### Development
```bash
# Start all services (server + both clients)
npm run dev

# Start individual services
npm run dev:server      # BBS server only
npm run dev:terminal    # Terminal client only
npm run dev:panel       # Control panel only
```

### Building
```bash
# Build all workspaces
npm run build

# Build server (includes schema.sql copy)
npm run build -w server

# Build clients
npm run build -w client/terminal
npm run build -w client/control-panel
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch -w server

# Run specific test file
npm test -- ANSIFrameBuilder.test.ts

# Run property-based tests
npm test -- --run ANSIFrameBuilder.property.test.ts
```

### Database & Scripts
```bash
# Initialize demo data
npm run init-demo -w server

# Create sysop user
npx tsx server/scripts/create-sysop.ts

# Setup test data
npx tsx server/scripts/setup-test-data.ts

# Run benchmark
npm run benchmark -w server
```

### Cleanup
```bash
# Remove all node_modules
npm run clean
```

## TypeScript Configuration

### Compiler Options
- **Target**: ES2022
- **Module**: ES2022 with node resolution
- **Strict Mode**: Enabled (all strict checks on)
- **Source Maps**: Enabled for debugging
- **Declaration Files**: Generated with declaration maps

### Import Conventions
- Always use `.js` extension in imports (ES modules requirement)
- Example: `import { Database } from '../Database.js'`

## Testing Conventions

### Test File Naming
- Unit tests: `*.test.ts`
- Property-based tests: `*.property.test.ts`
- Integration tests: `*.integration.test.ts`
- MCP journey tests: `journey-*.test.md`

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createInput();
      
      // Act
      const result = doSomething(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Property-Based Testing
Use fast-check for testing with random inputs:
```typescript
import fc from 'fast-check';

it('should maintain invariant', () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const result = process(input);
      return result.length >= 0; // invariant
    })
  );
});
```

## Environment Variables

Required variables in `.env`:
- `ANTHROPIC_API_KEY`: Claude API key (required for AI features)
- `JWT_SECRET`: Secret for JWT signing (generate with `openssl rand -base64 32`)
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)

## Workspace Structure

The project uses npm workspaces:
- `server`: BBS server
- `client/terminal`: Terminal client
- `client/control-panel`: Control panel
- `packages/shared`: Shared types and constants

## Key Dependencies

### Server
- `@fastify/cors`, `@fastify/rate-limit`, `@fastify/static`, `@fastify/websocket`
- `better-sqlite3`, `bcrypt`, `jsonwebtoken`, `uuid`
- `js-yaml` for config, `dotenv` for env vars

### Clients
- Terminal: `xterm`, `xterm-addon-fit`, `xterm-addon-web-links`
- Control Panel: `react`, `react-router-dom`, `tailwindcss`

## Build Artifacts

- Server: `server/dist/` (compiled JS + schema.sql)
- Terminal: `client/terminal/dist/` (static files)
- Control Panel: `client/control-panel/dist/` (static files)
- Database: `data/bbs.db` (created at runtime)

## Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v
```

## Performance Considerations

- ANSI rendering optimized for correctness over speed (< 2ms typical)
- SQLite with WAL mode for better concurrency
- Rate limiting: 100 requests/15 minutes global, per-endpoint limits vary
- Session cleanup runs every minute (60 min timeout)
