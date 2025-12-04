# Design Document

## Overview

This design document outlines the approach for containerizing BaudAgain BBS using Docker and deploying it to a DigitalOcean server for hackathon demonstration. The design prioritizes simplicity and speed of deployment while maintaining data persistence and proper configuration management.

The deployment uses a single Docker container that includes the Node.js server, pre-built static assets for the terminal client and control panel, and serves everything through the Fastify server. This all-in-one approach minimizes complexity and deployment time.

## Architecture

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Node.js Process (Fastify)                │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  WebSocket Server (port 8080)                │   │  │
│  │  │  - BBS terminal connections                  │   │  │
│  │  │  - Real-time notifications                   │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  REST API (port 8080)                        │   │  │
│  │  │  - Authentication                            │   │  │
│  │  │  - User management                           │   │  │
│  │  │  - Message operations                        │   │  │
│  │  │  - Door games                                │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Static File Server                          │   │  │
│  │  │  - Terminal client (/)                       │   │  │
│  │  │  - Control panel (/control-panel)           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              File System                              │  │
│  │  /app/                  - Application code            │  │
│  │  /app/data/             - SQLite database (volume)    │  │
│  │  /app/data/ansi/        - ANSI art files (volume)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Port 8080
                              ▼
                    ┌──────────────────┐
                    │  Host Network    │
                    │  (do-dev server) │
                    └──────────────────┘
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean Droplet (do-dev)            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Docker Engine                            │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  BaudAgain Container                         │   │  │
│  │  │  - Listens on port 8080                      │   │  │
│  │  │  - Mounts volumes for data persistence       │   │  │
│  │  │  - Reads environment variables                │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Docker Volumes                              │   │  │
│  │  │  - baudagain_data (SQLite + ANSI files)     │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Other Containers (existing services)        │   │  │
│  │  │  - Isolated in separate networks             │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Port 8080 exposed to host                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
                    ┌──────────────────┐
                    │  Internet        │
                    │  (Demo Users)    │
                    └──────────────────┘
```

## Components and Interfaces

### 1. Dockerfile

**Purpose**: Define the container image build process

**Build Strategy**: Multi-stage build for optimization
- Stage 1: Build dependencies and compile TypeScript
- Stage 2: Build client applications (terminal and control panel)
- Stage 3: Production image with only runtime dependencies

**Key Features**:
- Uses Node.js 20 Alpine base image (small footprint)
- Installs dependencies with `npm ci` for reproducible builds
- Compiles TypeScript server code
- Builds static client assets
- Copies only necessary files to final image
- Runs as non-root user for security
- Sets proper working directory and entry point

**Interface**:
```dockerfile
# Build args for configuration
ARG NODE_VERSION=20
ARG PORT=8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=${PORT}

# Exposed ports
EXPOSE ${PORT}

# Entry point
CMD ["node", "dist/index.js"]
```

### 2. Docker Compose Configuration

**Purpose**: Orchestrate container deployment with volumes and environment

**Configuration File**: `docker-compose.yml`

**Services**:
- `baudagain`: Main application container

**Volumes**:
- `baudagain_data`: Persistent storage for database and ANSI files

**Networks**:
- `baudagain_network`: Isolated network for the container

**Environment Variables**:
- Loaded from `.env` file
- Includes API keys, JWT secret, port configuration

**Interface**:
```yaml
version: '3.8'

services:
  baudagain:
    build: .
    ports:
      - "${PORT:-8080}:8080"
    volumes:
      - baudagain_data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-8080}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - baudagain_network

volumes:
  baudagain_data:

networks:
  baudagain_network:
```

### 3. Environment Configuration

**Purpose**: Manage sensitive configuration outside of code

**Configuration File**: `.env` (not committed to repository)

**Required Variables**:
- `ANTHROPIC_API_KEY`: API key for Claude AI
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (production for demo)

**Template File**: `.env.example` (committed to repository)

**Interface**:
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=<random-secret-here>

# Optional
PORT=8080
NODE_ENV=production
```

### 4. Deployment Scripts

**Purpose**: Automate deployment tasks

**Scripts**:

#### `deploy.sh` - Initial deployment
```bash
#!/bin/bash
# Build and start the container
# Initialize database with sample data
# Display access information
```

#### `update.sh` - Update existing deployment
```bash
#!/bin/bash
# Pull latest code
# Rebuild container
# Restart with zero downtime
# Preserve data volumes
```

#### `backup.sh` - Backup data
```bash
#!/bin/bash
# Export Docker volume
# Create timestamped backup
# Store in backups directory
```

#### `restore.sh` - Restore from backup
```bash
#!/bin/bash
# Stop container
# Restore volume from backup
# Restart container
```

**Interface**: All scripts accept standard flags
- `-h, --help`: Show usage information
- `-v, --verbose`: Verbose output
- `-y, --yes`: Skip confirmation prompts

### 5. Server Configuration Updates

**Purpose**: Ensure server can run in containerized environment

**Changes Required**:
- Read port from environment variable
- Bind to 0.0.0.0 instead of localhost (for container networking)
- Ensure database path is configurable
- Ensure ANSI files path is configurable

**Configuration Loading**:
```typescript
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0'; // Listen on all interfaces
const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'bbs.db');
const ANSI_DIR = path.join(DATA_DIR, 'ansi');
```

### 6. Static File Serving

**Purpose**: Serve terminal client and control panel from the server

**Implementation**: Fastify static plugin

**Routes**:
- `/` → Terminal client (index.html)
- `/control-panel` → Control panel (index.html)
- `/assets/*` → Static assets (JS, CSS, images)

**Configuration**:
```typescript
// Serve terminal client
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../client/terminal/dist'),
  prefix: '/'
});

// Serve control panel
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../client/control-panel/dist'),
  prefix: '/control-panel',
  decorateReply: false
});
```

### 7. Database Initialization

**Purpose**: Set up database and sample data on first run

**Implementation**: Initialization script that runs on container start

**Sample Data**:
- Sysop account (handle: "sysop", password: "demo123")
- Sample users (3-5 test accounts)
- Message bases (General, Tech Talk, Random)
- Sample messages (5-10 messages per base)

**Script**: `server/scripts/init-demo-data.ts`

**Interface**:
```typescript
async function initializeDemoData() {
  // Check if already initialized
  if (await isInitialized()) {
    console.log('Demo data already exists');
    return;
  }
  
  // Create sysop account
  await createSysopAccount();
  
  // Create sample users
  await createSampleUsers();
  
  // Create message bases
  await createMessageBases();
  
  // Create sample messages
  await createSampleMessages();
  
  console.log('Demo data initialized successfully');
}
```

## Data Models

### Docker Volume Structure

```
baudagain_data/
├── bbs.db              # SQLite database
├── bbs.db-shm          # SQLite shared memory
├── bbs.db-wal          # SQLite write-ahead log
└── ansi/               # ANSI art files
    ├── welcome.ans
    ├── goodbye.ans
    └── menu.ans
```

### Environment Configuration Model

```typescript
interface EnvironmentConfig {
  // Required
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  
  // Optional with defaults
  PORT: number;              // default: 8080
  NODE_ENV: string;          // default: 'production'
  DATA_DIR: string;          // default: './data'
}
```

### Deployment State Model

```typescript
interface DeploymentState {
  containerId: string;
  imageId: string;
  status: 'running' | 'stopped' | 'error';
  port: number;
  volumes: {
    name: string;
    mountPoint: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Container build reproducibility
*For any* source code state, building the Docker image twice should produce functionally equivalent containers that behave identically
**Validates: Requirements 1.2**

### Property 2: Data persistence across restarts
*For any* container restart, all data in mounted volumes should remain intact and accessible
**Validates: Requirements 2.1, 2.2**

### Property 3: Environment variable configuration
*For any* valid environment variable set, the container should start successfully and use the provided configuration
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Port binding
*For any* configured port, the container should successfully bind to that port and accept connections
**Validates: Requirements 5.2**

### Property 5: Volume mount integrity
*For any* file written to a mounted volume, the file should be accessible from both inside and outside the container
**Validates: Requirements 2.1, 2.2**

### Property 6: Secret exclusion
*For any* built Docker image, inspecting the image layers should not reveal any secrets or API keys
**Validates: Requirements 3.4**

### Property 7: Demo data initialization
*For any* fresh deployment, running the initialization script should create all required sample data exactly once
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Service availability
*For any* running container, the health check endpoint should return success within 5 seconds
**Validates: Requirements 5.1**

### Property 9: Static file serving
*For any* request to the terminal client or control panel routes, the server should return the correct HTML file
**Validates: Requirements 1.1**

### Property 10: Deployment script idempotency
*For any* deployment script, running it multiple times should produce the same end state without errors
**Validates: Requirements 5.4**

## Error Handling

### Build Errors

**Scenario**: Docker build fails due to missing dependencies or compilation errors

**Handling**:
- Display clear error message with failing step
- Provide troubleshooting guidance
- Exit with non-zero status code
- Log full error details for debugging

**Recovery**: Fix source code or dependencies, rebuild

### Runtime Errors

**Scenario**: Container fails to start due to configuration issues

**Handling**:
- Validate environment variables on startup
- Display missing or invalid configuration
- Provide example values
- Exit gracefully with error message

**Recovery**: Fix environment configuration, restart container

### Volume Mount Errors

**Scenario**: Volume mount fails or becomes corrupted

**Handling**:
- Check volume existence before starting
- Validate volume permissions
- Create volume if missing
- Log volume status

**Recovery**: Recreate volume or restore from backup

### Port Binding Errors

**Scenario**: Configured port is already in use

**Handling**:
- Detect port conflict on startup
- Display which process is using the port
- Suggest alternative ports
- Exit with clear error message

**Recovery**: Stop conflicting service or use different port

### Database Initialization Errors

**Scenario**: Demo data initialization fails

**Handling**:
- Wrap initialization in transaction
- Rollback on any error
- Log specific failure point
- Allow manual retry

**Recovery**: Fix data or schema, run initialization again

### Network Errors

**Scenario**: Container cannot reach external services (Anthropic API)

**Handling**:
- Implement retry logic with exponential backoff
- Provide fallback responses when AI unavailable
- Log network errors
- Continue operating in degraded mode

**Recovery**: Automatic retry when network restored

## Testing Strategy

### Build Testing

**Unit Tests**: Not applicable for Docker builds

**Integration Tests**:
- Build Docker image successfully
- Verify image size is reasonable (< 500MB)
- Verify all required files are present in image
- Verify no secrets in image layers

**Manual Testing**:
- Build image on clean system
- Inspect image contents
- Verify build logs for warnings

### Deployment Testing

**Unit Tests**: Not applicable for deployment

**Integration Tests**:
- Deploy container successfully
- Verify container starts and stays running
- Verify port is accessible
- Verify volumes are mounted correctly
- Verify environment variables are loaded

**Manual Testing**:
- Deploy to do-dev server
- Access terminal client via browser
- Access control panel via browser
- Test WebSocket connection
- Test REST API endpoints
- Verify data persists after restart

### Data Persistence Testing

**Property-Based Tests**:
- Write random data to database
- Restart container
- Verify data is still present and correct

**Integration Tests**:
- Create user account
- Post message
- Restart container
- Verify user can login
- Verify message is visible

### Configuration Testing

**Unit Tests**:
- Test environment variable parsing
- Test default value fallbacks
- Test validation logic

**Integration Tests**:
- Start container with various configurations
- Verify correct behavior for each configuration
- Test invalid configurations fail gracefully

### Demo Data Testing

**Unit Tests**:
- Test sample data generation functions
- Verify data structure correctness

**Integration Tests**:
- Run initialization on fresh database
- Verify all sample data created
- Verify sysop can login
- Verify sample messages visible
- Run initialization again, verify idempotency

## Deployment Process

### Initial Deployment Steps

1. **Prepare Server**
   - SSH into do-dev server
   - Verify Docker is installed
   - Create deployment directory

2. **Clone Repository**
   - Clone from GitHub
   - Checkout appropriate branch/tag

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Set `ANTHROPIC_API_KEY`
   - Generate and set `JWT_SECRET`
   - Set `PORT` if needed

4. **Build Container**
   - Run `docker build -t baudagain:latest .`
   - Verify build succeeds
   - Check image size

5. **Start Container**
   - Run `docker-compose up -d`
   - Verify container starts
   - Check logs for errors

6. **Initialize Demo Data**
   - Container automatically runs initialization
   - Verify sample data created
   - Test sysop login

7. **Verify Deployment**
   - Access terminal client: `http://<server-ip>:8080`
   - Access control panel: `http://<server-ip>:8080/control-panel`
   - Test user registration
   - Test message posting
   - Test door game

### Update Deployment Steps

1. **Pull Latest Code**
   - `git pull origin main`

2. **Rebuild Container**
   - `docker-compose build`

3. **Restart with New Image**
   - `docker-compose up -d`
   - Docker automatically handles graceful restart

4. **Verify Update**
   - Check container logs
   - Test functionality
   - Verify data persisted

### Rollback Steps

1. **Stop Current Container**
   - `docker-compose down`

2. **Checkout Previous Version**
   - `git checkout <previous-tag>`

3. **Rebuild and Start**
   - `docker-compose build`
   - `docker-compose up -d`

4. **Verify Rollback**
   - Test functionality
   - Check logs

## GitHub Repository Preparation

### Repository Structure

```
baudagain/
├── .github/
│   └── workflows/          # CI/CD workflows (future)
├── .kiro/                  # Kiro specs (keep for development)
├── client/                 # Client applications
├── server/                 # Server application
├── packages/               # Shared packages
├── docs/                   # Documentation
├── data/                   # Data directory (gitignored)
├── .gitignore             # Git ignore rules
├── .dockerignore          # Docker ignore rules
├── Dockerfile             # Container definition
├── docker-compose.yml     # Compose configuration
├── .env.example           # Environment template
├── LICENSE                # MIT License
├── README.md              # Project documentation
├── CONTRIBUTING.md        # Contribution guidelines
├── package.json           # Root package file
└── deploy/                # Deployment scripts
    ├── deploy.sh
    ├── update.sh
    ├── backup.sh
    └── restore.sh
```

### README.md Structure

1. **Project Title and Description**
   - Eye-catching title
   - Brief description
   - Key features list
   - Demo link (when available)

2. **Screenshots/Demo**
   - Terminal client screenshot
   - Control panel screenshot
   - GIF of interaction (optional)

3. **Quick Start**
   - Prerequisites
   - Installation steps
   - Running locally

4. **Docker Deployment**
   - Building the image
   - Running with Docker Compose
   - Environment configuration

5. **Features**
   - Detailed feature list
   - Technology stack
   - Architecture overview

6. **Development**
   - Development setup
   - Running tests
   - Project structure

7. **API Documentation**
   - Link to OpenAPI spec
   - Link to API examples

8. **Contributing**
   - Link to CONTRIBUTING.md
   - Code of conduct

9. **License**
   - MIT License

10. **Acknowledgments**
    - Credits
    - Inspiration

### CONTRIBUTING.md Structure

1. **Welcome**
   - Thank contributors
   - Project goals

2. **Development Setup**
   - Prerequisites
   - Installation
   - Running locally

3. **Development Workflow**
   - Branch naming
   - Commit messages
   - Pull request process

4. **Code Style**
   - TypeScript guidelines
   - Linting rules
   - Testing requirements

5. **Testing**
   - Running tests
   - Writing tests
   - Test coverage

6. **Documentation**
   - Code comments
   - API documentation
   - Architecture docs

7. **Getting Help**
   - Where to ask questions
   - Issue templates

### .gitignore Additions

```gitignore
# Environment
.env
.env.local
.env.production

# Database
data/bbs.db
data/bbs.db-shm
data/bbs.db-wal

# Docker
.dockerignore

# Deployment
deploy/*.log
backups/
```

### LICENSE File

MIT License with appropriate copyright year and holder

## Security Considerations

### Secret Management

**Approach**: Environment variables only, never in code or images

**Implementation**:
- `.env` file for local/server deployment
- Docker secrets for production (future)
- Never commit `.env` to repository
- Provide `.env.example` template

### Container Security

**Measures**:
- Run as non-root user inside container
- Use official Node.js Alpine base image
- Minimize installed packages
- No unnecessary capabilities
- Read-only root filesystem where possible

### Network Security

**Measures**:
- Isolated Docker network
- Only expose necessary port (8080)
- Rate limiting active in application
- JWT authentication for API

### Data Security

**Measures**:
- Volume permissions set correctly
- Database file not world-readable
- Backup encryption (future enhancement)

## Performance Considerations

### Image Size

**Target**: < 500MB final image

**Optimization**:
- Multi-stage build
- Alpine base image
- Remove dev dependencies
- Minimize layers

### Build Time

**Target**: < 5 minutes on typical hardware

**Optimization**:
- Layer caching
- Parallel builds where possible
- Minimize file copying

### Startup Time

**Target**: < 10 seconds from container start to ready

**Optimization**:
- Lazy loading where possible
- Database connection pooling
- Pre-compiled assets

### Resource Usage

**Targets**:
- Memory: < 512MB under normal load
- CPU: < 50% of one core under normal load
- Disk: < 100MB for data (excluding database growth)

**Monitoring**: Docker stats command for resource tracking

## Monitoring and Maintenance

### Health Checks

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "database": "connected",
  "ai": "available"
}
```

**Docker Health Check**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### Logging

**Approach**: All logs to stdout/stderr for Docker to capture

**Log Levels**:
- INFO: Normal operations
- WARN: Unusual but handled
- ERROR: Failures requiring attention

**Log Format**: JSON for structured logging

**Viewing Logs**:
```bash
# View logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View logs for specific time
docker-compose logs --since 1h
```

### Backup Strategy

**Frequency**: Manual backups before updates

**What to Backup**:
- Docker volume (database + ANSI files)
- Environment configuration

**Backup Script**: `deploy/backup.sh`

**Backup Location**: `./backups/` directory with timestamps

**Retention**: Keep last 5 backups

### Update Strategy

**Approach**: Rolling update with data persistence

**Steps**:
1. Backup current data
2. Pull latest code
3. Rebuild image
4. Stop old container
5. Start new container
6. Verify health
7. Rollback if issues

**Downtime**: < 30 seconds

## Future Enhancements

### Production Readiness

- HTTPS with Let's Encrypt
- Reverse proxy (nginx/Traefik)
- Domain name configuration
- CDN for static assets
- Database backups to S3
- Log aggregation (ELK stack)
- Monitoring (Prometheus/Grafana)
- Alerting (PagerDuty)

### Scalability

- Horizontal scaling with load balancer
- Redis for session storage
- PostgreSQL instead of SQLite
- Separate containers for services
- Kubernetes deployment

### CI/CD

- GitHub Actions for automated builds
- Automated testing on PR
- Automated deployment to staging
- Automated deployment to production
- Container registry (Docker Hub/GHCR)

### Development Experience

- Development Docker Compose with hot reload
- VS Code devcontainer configuration
- Automated database migrations
- Seed data management
