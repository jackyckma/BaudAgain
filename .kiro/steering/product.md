# BaudAgain BBS - Product Overview

BaudAgain is an AI-enhanced Bulletin Board System (BBS) that resurrects the dial-up era experience with modern AI capabilities. It's a web-based service that recreates the authentic retro terminal aesthetics and community feel of classic BBS systems.

## Core Features

- **AI-Powered SysOp**: An AI agent (Claude) that welcomes users, answers questions, and helps manage the community
- **AI Door Games**: Dynamic text adventures powered by AI, including "The Oracle" fortune teller and "Art Studio" for ANSI art creation
- **AI Innovation Features**: Message summarization, daily digests, conversation starters, and AI-generated ANSI art
- **Message Bases**: Classic threaded discussion forums with real-time notifications
- **ANSI Art**: Authentic retro terminal aesthetics with proper rendering across contexts
- **Control Panel**: Web-based administration interface for SysOps
- **Hybrid Architecture**: REST API for actions + WebSocket for real-time notifications

## Target Experience

The project aims to recreate the intimate, decentralized communities of the dial-up era while adding modern AI capabilities. Users connect via a web-based terminal emulator (xterm.js) that provides an authentic BBS experience with ANSI art, menu navigation, and door games.

## Technical Approach

- **Backend**: Node.js/TypeScript server with Fastify and WebSocket
- **Frontend**: React control panel + xterm.js terminal client
- **Database**: SQLite for persistence
- **AI**: Anthropic Claude API for all AI features
- **Deployment**: Docker-ready with Docker Compose support

## Project Status

Currently at Milestone 7.5 (AI Innovation Features Complete). The system is demo-ready with comprehensive testing framework and full feature set implemented.
