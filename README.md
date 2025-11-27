# 🖥️ BaudAgain: AI-Enhanced Bulletin Board System

> *"Bringing back the intimate, decentralized communities of the dial-up era — with an AI soul."*

**Hackathon:** Kiroween (kiroween.devpost.com)  
**Category:** Resurrection — Bring your favorite dead technology back to life

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
git clone <repository-url>
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

### Milestone 2: User System (Next)
- [ ] SQLite database setup
- [ ] User registration & login
- [ ] Session management with timeouts
- [ ] Password hashing with bcrypt
- [ ] Rate limiting for login attempts

### Milestone 3: AI Integration (Planned)
- [ ] AI SysOp agent
- [ ] AI Configuration Assistant
- [ ] Control panel

### Milestone 4: Door Game (Planned)
- [ ] Door game framework
- [ ] The Oracle (AI fortune teller)

### Milestone 5: Polish (Planned)
- [ ] Message base system
- [ ] Rate limiting
- [ ] Security hardening

## Technology Stack

- **Backend:** Node.js, TypeScript, Fastify, WebSocket
- **Frontend:** React, Vite, Tailwind CSS, xterm.js
- **Database:** SQLite (better-sqlite3)
- **AI:** Anthropic Claude API
- **Testing:** Vitest, fast-check (property-based testing)

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
