# 🖥️ BaudAgain: AI-Enhanced Bulletin Board System

> *"Bringing back the intimate, decentralized communities of the dial-up era — with an AI soul."*

**Hackathon:** Kiroween (kiroween.devpost.com)  
**Category:** Resurrection — Bring your favorite dead technology back to life

## 🌐 Live Demo

**Try it now:** [http://baudagain-demo.ai-transformation.org:8080](http://baudagain-demo.ai-transformation.org:8080)

- **Terminal Client:** Experience the retro BBS interface
- **Control Panel:** [http://baudagain-demo.ai-transformation.org:8080/control-panel](http://baudagain-demo.ai-transformation.org:8080/control-panel)

**Demo Credentials:**
- Sysop: `sysop` / `demo123`
- Sample users: `retrogeek`, `nightcrawler`, `pixelartist` (all use `demo123`)

> Note: The demo may be reset periodically. Your data may not persist.

## Overview

BaudAgain resurrects the Bulletin Board System (BBS) experience from the dial-up era, enhanced with modern AI capabilities. Host your own BBS as a simple web service, featuring:

- 🤖 **AI-Powered SysOp** - An AI agent that welcomes users, answers questions, and helps manage your community
- 🎮 **AI Door Games** - Dynamic text adventures powered by AI (starting with "The Oracle" fortune teller)
- 💬 **Message Bases** - Classic threaded discussion forums
- 🎨 **ANSI Art** - Authentic retro terminal aesthetics
- ⚙️ **AI Configuration** - Configure your BBS by talking to the AI assistant

## Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jackyckma/BaudAgain.git
cd BaudAgain
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser:
- Terminal Client: http://localhost:5173
- Control Panel: http://localhost:5174
- BBS Server: ws://localhost:8080

## Project Structure

```
baudagain/
├── server/              # BBS Server (Node.js/TypeScript)
│   ├── src/
│   │   ├── connection/  # WebSocket connection handling
│   │   ├── session/     # Session management
│   │   ├── core/        # BBS core engine & handlers
│   │   ├── ai/          # AI provider & agents
│   │   ├── db/          # Database & repositories
│   │   └── ansi/        # ANSI rendering
│   └── package.json
├── client/
│   ├── terminal/        # Web-based terminal client (xterm.js)
│   └── control-panel/   # SysOp control panel (React)
├── packages/
│   └── shared/          # Shared types & constants
├── data/
│   ├── ansi/            # ANSI art templates
│   └── bbs.db           # SQLite database (created on first run)
├── config.yaml          # BBS configuration
└── .env                 # Environment variables
```

## Development

### Available Scripts

```bash
# Development (all services)
npm run dev

# Development (individual services)
npm run dev:server      # BBS server only
npm run dev:terminal    # Terminal client only
npm run dev:panel       # Control panel only

# Build
npm run build

# Test
npm run test

# Clean
npm run clean           # Remove all node_modules
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch -w server
```

## Configuration

Edit `config.yaml` to customize your BBS:

- **BBS name and theme** - Personalize your board
- **AI personality** - Customize the AI SysOp's character
- **Message bases** - Add/remove discussion forums
- **Door games** - Enable/disable games
- **Security settings** - Rate limits, timeouts, etc.

Or use the **AI Configuration Assistant** in the control panel to configure via natural language!

## Features

### Milestone 1: Hello BBS ✅ COMPLETE
- [x] WebSocket server with Fastify
- [x] Web terminal client with xterm.js and ANSI rendering
- [x] ANSI template system with variable substitution
- [x] Welcome screen with retro BBS aesthetics
- [x] Connection abstraction layer (IConnection, WebSocketConnection, ConnectionManager)
- [x] Property-based tests with fast-check

### Milestone 2: User System ✅ COMPLETE
- [x] SQLite database setup
- [x] User registration & login
- [x] Session management with timeouts
- [x] Password hashing with bcrypt
- [x] Rate limiting for login attempts

### Milestone 3: AI Integration ✅ COMPLETE
- [x] AI provider abstraction (Anthropic Claude)
- [x] AI SysOp agent (welcomes users, answers questions)
- [x] AI Configuration Assistant (natural language configuration) ✅ **COMPLETE**
- [x] Control panel with dashboard, users, message bases, and AI settings

### Milestone 3.5: Security & Refactoring ✅ COMPLETE
- [x] JWT-based API authentication
- [x] Comprehensive rate limiting (global + per-endpoint)
- [x] Service layer extraction (UserService, AIService)
- [x] Code deduplication (ValidationUtils)
- [x] Security hardening

### Milestone 4: Door Game ✅ COMPLETE
- [x] Door game framework
- [x] The Oracle (AI fortune teller)
- [x] Door session persistence

### Milestone 5: Polish & Message Bases ✅ COMPLETE
- [x] Message base system (forums)
- [x] Message posting and threading
- [x] Control panel management pages
- [x] Input sanitization
- [x] Graceful shutdown
- [x] UI polish and refinements

### Milestone 6: Hybrid Architecture ✅ COMPLETE
- [x] REST API design (19 endpoints)
- [x] OpenAPI 3.0 specification
- [x] WebSocket notification system design
- [x] Core REST API implementation (18 endpoints)
  - [x] Authentication endpoints (4)
  - [x] User management endpoints (3)
  - [x] Message base endpoints (3)
  - [x] Message endpoints (4)
  - [x] Door game endpoints (4)
- [x] Door session management via API
- [x] Door state persistence
- [x] Notification event type system (15 event types)
- [x] WebSocket notification broadcasting (NotificationService)
- [x] Real-time message updates
- [x] Real-time user activity updates
- [x] Property tests for notifications
- [x] Terminal client refactoring ✅ **COMPLETE (Dec 3, 2025)**
  - [x] REST API for all actions
  - [x] WebSocket for real-time notifications
  - [x] Graceful fallback to WebSocket-only mode
  - [x] Preserved BBS user experience
  - See `TASK_33_TERMINAL_CLIENT_COMPLETE.md` for details
- [x] API testing and documentation ✅ **COMPLETE (Dec 3, 2025)**
  - [x] Comprehensive REST API test suite
  - [x] Postman collection with all endpoints
  - [x] curl examples in OpenAPI spec
  - [x] API README with usage guide
  - [x] Code examples (JavaScript, Python, React)
  - [x] Performance testing and benchmarking
  - [x] Mobile app development guide
- [x] Code quality improvements ✅ **COMPLETE (Dec 3, 2025)**
  - [x] JWT configuration type safety
  - [x] DoorHandler encapsulation
  - [x] Error handling utilities
  - [x] Terminal renderer refactoring
- [x] Repository cleanup and organization ✅ **COMPLETE (Dec 3, 2025)**
  - [x] Documentation audit and inventory
  - [x] Archive structure creation
  - [x] Historical documentation archived
  - [x] Repository cleanliness verified

### Milestone 7: Comprehensive User Testing (Demo Readiness) ⏳ IN PROGRESS (50%)
- [x] MCP-based testing framework setup ✅
- [x] Automated user registration flow testing ✅
- [x] Automated returning user login flow testing ✅
- [x] Main menu navigation testing ✅
- [x] Message base functionality testing ✅
- [x] AI SysOp interaction testing ✅
- [x] Control panel testing ✅
- [x] **Fix ANSI frame alignment issues** ✅
- [x] **ANSI Rendering Refactor - Core Utilities** ✅
- [-] Door game functionality testing ⚠️ (75% passing - edge cases need fixes)
- [ ] REST API endpoint validation (deferred to after M7.5)
- [ ] WebSocket notification testing (deferred to after M7.5)
- [ ] Error handling and edge case testing (deferred to after M7.5)
- [ ] Multi-user scenario testing (deferred to after M7.5)
- [ ] Demo script creation (deferred to after M7.5)
- [ ] Demo-readiness verification (deferred to after M7.5)

### Milestone 7.5: AI Innovation Features (Hackathon Demo) ✅ COMPLETE
- [x] **AI-Generated ANSI Art** (4-6 hours) ✅
  - [x] ANSIArtGenerator service with Claude integration
  - [x] "Art Studio" door game for interactive art creation
  - [x] Art gallery with persistence and viewing
  - [x] REST API endpoints for art generation
- [x] **AI Message Summarization** (3-5 hours) ✅
  - [x] MessageSummarizer service with caching
  - [x] "Summarize Thread" option in message bases
  - [x] "Catch Me Up" daily digest for returning users
  - [x] REST API endpoints for summaries
- [x] **AI Conversation Starters** (3-4 hours) ✅
  - [x] ConversationStarter service with activity analysis
  - [x] "Question of the Day" automated posting
  - [x] Control panel management for conversation starters
  - [x] REST API endpoints for starter management
- [x] **Integration Checkpoint** ✅
  - [x] All three features verified working together
  - [x] AI API rate limiting tested with multiple features
  - [x] Features don't interfere with existing functionality
  - [x] ANSI rendering verified for all new screens
  - [x] REST API endpoints tested for all features
  - [x] OpenAPI documentation updated

## Documentation

### API Documentation

- **[API README](server/API_README.md)** - Complete API documentation overview
- **[OpenAPI Specification](server/openapi.yaml)** - Machine-readable API spec
- **[curl Examples](server/API_CURL_EXAMPLES.md)** - Comprehensive curl examples for all endpoints
- **[Code Examples](server/API_CODE_EXAMPLES.md)** - JavaScript, Python, and React integration examples
- **[Postman Collection](server/BaudAgain-API.postman_collection.json)** - Import into Postman for testing

### Mobile Development

- **[Mobile App Guide](server/MOBILE_APP_GUIDE.md)** - Complete guide for building React Native mobile apps

### Architecture

- **[Architecture Guide](ARCHITECTURE.md)** - System architecture and design patterns
- **[WebSocket Notifications](WEBSOCKET_NOTIFICATION_DESIGN.md)** - Real-time notification system

### Testing

- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing documentation
- **[Performance Testing](server/PERFORMANCE_TESTING.md)** - Performance benchmarking guide

## Technology Stack

- **Backend:** Node.js, TypeScript, Fastify, WebSocket
- **Frontend:** React, Vite, Tailwind CSS, xterm.js
- **Database:** SQLite (better-sqlite3)
- **AI:** Anthropic Claude API
- **Testing:** Vitest, fast-check (property-based testing)
- **Deployment:** Docker, Docker Compose

## 🐳 Docker Deployment

The easiest way to deploy BaudAgain is with Docker.

### Prerequisites

- Docker and Docker Compose installed
- Anthropic API key

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/jackyckma/BaudAgain.git
cd BaudAgain
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env and set:
# - ANTHROPIC_API_KEY=your_api_key_here
# - JWT_SECRET=$(openssl rand -base64 32)
```

3. Build and start:
```bash
docker-compose up -d
```

4. Access the BBS:
- Terminal Client: http://localhost:8080
- Control Panel: http://localhost:8080/control-panel

### Docker Commands

```bash
# Build the image
docker-compose build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes (removes all data!)
docker-compose down -v
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic Claude API key |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `PORT` | No | 8080 | Server port |
| `NODE_ENV` | No | production | Environment |

## Contributing

This is a hackathon project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by classic BBS systems like Mystic BBS, Synchronet, and the legendary door games (LORD, TradeWars 2002)
- Built for the Kiroween Hackathon "Resurrection" category
- Special thanks to the BBS community for keeping the spirit alive

## Contact

For questions or feedback, please open an issue on GitHub.

---

*May your connection be stable and your packets uncorrupted.* 👻
