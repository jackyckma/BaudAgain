# Implementation Plan

## Current Status Summary

**Last Updated:** December 2, 2025

### Completed Milestones ✅
- ✅ **Milestone 1:** Hello BBS (Basic WebSocket server, terminal client, ANSI welcome screen)
- ✅ **Milestone 2:** User System (SQLite database, authentication, session management)
- ✅ **Milestone 3:** AI Integration (AI SysOp, control panel foundation, AI Configuration Assistant) - **COMPLETE**
- ✅ **Milestone 3.5:** Security & Refactoring (JWT auth, rate limiting, service layer - mostly complete)
- ✅ **Milestone 4:** Door Game (The Oracle AI door game)
- ✅ **Milestone 5:** Polish & Message Bases (Message system, control panel features, graceful shutdown)
- ✅ **Milestone 6:** Hybrid Architecture (REST API, WebSocket notifications - core complete)

### Current Focus 🎯
**Milestone 7: Comprehensive User Testing** (50% complete)

**Status:** Core testing complete, ready for new features! ✅

**Recently Completed:**
- ✅ Task 47: Control panel testing complete
- ✅ Task 53: ANSI frame alignment fixed
- ✅ MCP-based testing framework operational
- ✅ User flows validated (registration, login, navigation, messages, AI SysOp)

**Next: Milestone 7.5 - AI Innovation Features** 🚀
- Feature 1: AI-Generated ANSI Art (Tasks 55-57)
- Feature 2: AI Message Summarization (Tasks 58-60)
- Feature 3: AI Conversation Starters (Tasks 61-63)
- **Timeline:** 1-2 days (8-10 hours)
- **Strategy:** Implement features first, then complete M7 testing for everything together

### Remaining Work 📋

**Critical Path (MVP):**
1. **Task 17:** Checkpoint for Milestone 3 - **NEXT**
2. **Task 33:** Refactor terminal client to hybrid architecture (4 subtasks) - **REQUIRED**
3. **Task 34.2:** Create Postman collection and curl examples - **RECOMMENDED**
4. **Task 36:** Code quality improvements (4 subtasks) - **RECOMMENDED**
5. **Task 37:** Final verification checkpoint - **REQUIRED**

**Nice-to-Have:**
- **Task 34.4:** Performance testing - **OPTIONAL**
- **Task 35.2-35.4:** Additional documentation - **OPTIONAL**

### Implementation Notes
- **Optional tasks** (marked with `*`) are test-related and can be skipped for MVP
- **Property-based tests** use fast-check library (already installed)
- **REST API** is fully implemented and tested
- **WebSocket notifications** are fully implemented with property tests
- **JWT authentication** is complete and working
- **Rate limiting** is implemented for both API and BBS operations
- **AI Configuration Assistant** is fully implemented with natural language configuration interface

### Recommended Path Forward 🚀

**Phase 1: AI Configuration Assistant (Priority: HIGH - ✅ COMPLETE)**
1. ✅ Task 16.1: Create AIConfigAssistant class with function calling
2. ✅ Task 16.2: Add chat interface to control panel
3. ✅ Task 16.3: Implement configuration persistence

**Phase 2: Complete Hybrid Architecture (Priority: HIGH - CURRENT)**
1. Task 33.1: Update terminal client to use REST API for actions
2. Task 33.2: Keep WebSocket for real-time notifications
3. Task 33.3: Maintain existing BBS user experience
4. Task 33.4: Add graceful fallback to WebSocket-only mode

**Phase 3: Code Quality (Priority: MEDIUM)**
1. Task 36.1: Fix type assertion in JWT configuration
2. Task 36.2: Add public getter for DoorHandler doors
3. Task 36.3: Create error handling utilities
4. Task 36.4: Refactor terminal renderers to use BaseTerminalRenderer

**Phase 4: Documentation & Polish (Priority: LOW)**
1. Task 34.2: Create Postman collection and curl examples
2. Task 35.2: Add example API usage
3. Task 35.4: Update architecture documentation
4. Task 37: Final verification checkpoint

**Phase 5: Optional Enhancements (Priority: OPTIONAL)**
1. Task 34.4: Performance testing
2. Task 35.3: Mobile app development guide
3. All property-based test tasks (marked with `*`)

---

## Milestone 1: Hello BBS (Runnable Foundation)

- [x] 1. Set up project structure and dependencies
  - Create monorepo structure with server, terminal client, and control panel
  - Initialize package.json files with TypeScript, Fastify, and WebSocket dependencies
  - Set up build configuration with Vite
  - Create basic folder structure following the design document
  - _Requirements: All_

- [x] 2. Implement basic WebSocket server
- [x] 2.1 Create WebSocket connection handler
  - Implement WebSocket server using Fastify WebSocket plugin
  - Create connection acceptance and basic echo functionality
  - Add connection logging
  - _Requirements: 1.1, 1.3_

- [x] 2.2 Implement connection abstraction layer
  - Create IConnection interface
  - Implement WebSocketConnection class
  - Create ConnectionManager to track active connections
  - _Requirements: 12.1, 12.2_

- [x] 2.3 Write property test for connection abstraction
  - **Property 46: Connection abstraction usage**
  - **Validates: Requirements 12.1**

- [x] 3. Create web-based terminal client
- [x] 3.1 Set up xterm.js terminal
  - Create HTML page with xterm.js integration
  - Implement WebSocket client connection
  - Handle bidirectional communication (send input, receive output)
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 3.2 Implement ANSI rendering
  - Configure xterm.js for ANSI escape code support
  - Add CP437 box-drawing character support
  - Test color rendering (standard and bright variants)
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 3.3 Create terminal abstraction layer
  - Define structured content types (welcome screen, menu, message, etc.)
  - Create TerminalRenderer interface
  - Implement ANSITerminalRenderer for raw ANSI output
  - Implement WebTerminalRenderer for xterm.js compatible output
  - Update server to use structured content and renderers
  - _Requirements: 13.1, 13.2, 13.3, 12.3, 12.4_

- [x] 3.4 Write property test for ANSI rendering
  - **Property 50: ANSI escape code interpretation**
  - **Validates: Requirements 13.1**

- [x] 4. Create static ANSI welcome screen
- [x] 4.1 Implement ANSI template system
  - Create ANSIRenderer class with template loading
  - Implement variable substitution ({{variable}} pattern)
  - Create welcome.ans template file
  - _Requirements: 1.2, 13.4_

- [x] 4.2 Send welcome screen on connection
  - Integrate ANSIRenderer with connection handler
  - Send welcome screen immediately after connection
  - Add basic variables (bbs_name, node, date)
  - _Requirements: 1.2_

- [x] 4.3 Write property test for welcome screen delivery
  - **Property 1: Welcome screen delivery on connection**
  - **Validates: Requirements 1.2**

- [x] 5. Implement basic menu system
- [x] 5.1 Create menu handler with simple navigation
  - Implement Menu and MenuOption interfaces
  - Create main menu with static options
  - Handle single-character command input
  - Display menu after welcome screen
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5.2 Add error handling for invalid commands
  - Detect invalid menu commands
  - Display error message and re-display menu
  - _Requirements: 3.4_

- [ ]* 5.3 Write property test for menu navigation
  - **Property 10: Valid menu command navigation**
  - **Validates: Requirements 3.3**

- [ ]* 5.4 Write property test for invalid command handling
  - **Property 11: Invalid command error handling**
  - **Validates: Requirements 3.4**

- [x] 6. Checkpoint - Verify Milestone 1
  - Ensure all tests pass, ask the user if questions arise.

## Milestone 2: User System (Persistence & Authentication)

- [x] 7. Set up SQLite database
- [x] 7.1 Create database schema
  - Implement schema.sql with users, message_bases, messages, door_sessions, activity_log tables
  - Create Database class for connection management
  - Implement database initialization on server start
  - _Requirements: 9.1_

- [x] 7.2 Create user repository
  - Implement UserRepository with CRUD operations
  - Add methods for user creation, retrieval by handle, and authentication
  - _Requirements: 9.2_

- [ ]* 7.3 Write property test for database initialization
  - **Property 32: Database initialization**
  - **Validates: Requirements 9.1**

- [x] 8. Implement session management
- [x] 8.1 Create Session and SessionManager
  - Implement Session interface with state tracking
  - Create SessionManager to manage session lifecycle
  - Link sessions to connections
  - Track session state (connected, authenticating, authenticated, etc.)
  - _Requirements: 10.1, 10.5_

- [x] 8.2 Add session timeout handling
  - Implement periodic cleanup of inactive sessions
  - Disconnect callers after 60 minutes of inactivity
  - _Requirements: 10.3_

- [x] 8.3 Implement session cleanup on disconnect
  - Clean up session data when connection closes
  - Free allocated node
  - _Requirements: 10.4_

- [ ]* 8.4 Write property test for session creation
  - **Property 37: Session creation with unique ID**
  - **Validates: Requirements 10.1**

- [ ]* 8.5 Write property test for session isolation
  - **Property 38: Session isolation**
  - **Validates: Requirements 10.2**

- [ ]* 8.6 Write property test for session timeout
  - **Property 39: Session timeout**
  - **Validates: Requirements 10.3**

- [ ] 9. Implement user registration
- [x] 9.1 Create authentication handler
  - Implement AuthHandler class
  - Add registration flow (handle, password, optional profile)
  - Implement handle validation (3-20 chars, unique)
  - Hash passwords with bcrypt (cost factor 10)
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 9.2 Integrate registration with menu system
  - Detect "NEW" command on initial prompt
  - Guide user through registration steps
  - Store user in database
  - _Requirements: 2.1, 2.2_

- [ ]* 9.3 Write property test for handle validation
  - **Property 5: Handle validation**
  - **Validates: Requirements 2.3**

- [ ]* 9.4 Write property test for password hashing
  - **Property 6: Password hashing round-trip**
  - **Validates: Requirements 2.4**

- [ ]* 9.5 Write property test for password security
  - **Property 59: Password hashing security**
  - **Validates: Requirements 15.5**

- [ ] 10. Implement user login
- [x] 10.1 Add login flow to authentication handler
  - Prompt for handle and password
  - Verify credentials against database
  - Display last login date and new message count
  - Update session with user information
  - _Requirements: 2.5_

- [x] 10.2 Add login attempt rate limiting
  - Track failed login attempts per session
  - Limit to 5 attempts per session
  - Disconnect after exceeding limit
  - _Requirements: 2.6, 15.1_

- [ ]* 10.3 Write property test for valid authentication
  - **Property 7: Valid credential authentication**
  - **Validates: Requirements 2.5**

- [ ]* 10.4 Write property test for invalid credential handling
  - **Property 8: Invalid credential rejection with retry**
  - **Validates: Requirements 2.6**

- [ ]* 10.5 Write property test for login rate limiting
  - **Property 55: Login attempt rate limiting**
  - **Validates: Requirements 15.1**

- [ ] 11. Update menu system for authenticated users
- [x] 11.1 Show main menu after successful login
  - Display personalized main menu with user info
  - Show available options based on access level
  - _Requirements: 3.1_

- [x] 11.2 Add submenu navigation
  - Implement return to main menu from submenus
  - Track current menu location in session
  - _Requirements: 3.5_

- [ ]* 11.3 Write property test for main menu display
  - **Property 9: Main menu display after login**
  - **Validates: Requirements 3.1**

- [ ]* 11.4 Write property test for submenu navigation
  - **Property 12: Submenu return navigation**
  - **Validates: Requirements 3.5**

- [x] 12. Checkpoint - Verify Milestone 2
  - Ensure all tests pass, ask the user if questions arise.

## Milestone 3: AI Integration

- [ ] 13. Implement AI provider abstraction
- [x] 13.1 Create AI provider interface and factory
  - Define AIProvider interface
  - Implement AnthropicProvider using @anthropic-ai/sdk
  - Create AIProviderFactory to instantiate providers based on config
  - _Requirements: 11.1, 11.2_

- [x] 13.2 Add configuration loading for AI
  - Load AI settings from config.yaml
  - Read API key from environment variable
  - Support model selection (Haiku 3.5 for development, Sonnet for production)
  - _Requirements: 11.1_

- [x] 13.3 Implement error handling and fallbacks
  - Handle AI API failures gracefully
  - Provide fallback responses when AI is unavailable
  - Log errors for debugging
  - _Requirements: 11.4_

- [ ]* 13.4 Write property test for AI provider initialization
  - **Property 42: AI provider initialization**
  - **Validates: Requirements 11.1**

- [ ]* 13.5 Write property test for AI interface consistency
  - **Property 43: AI interface consistency**
  - **Validates: Requirements 11.2**

- [ ]* 13.6 Write property test for AI error handling
  - **Property 44: AI error handling**
  - **Validates: Requirements 11.4**

- [ ] 14. Implement AI SysOp agent
- [x] 14.1 Create AISysOp class
  - Implement welcome message generation for new users
  - Implement greeting generation for returning users
  - Add personality configuration from config.yaml
  - Include ANSI color codes in responses
  - Enforce 500 character limit
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 14.2 Integrate AI SysOp with authentication
  - Call AI SysOp after successful registration
  - Call AI SysOp after successful login
  - Display AI-generated messages to user
  - _Requirements: 5.1, 5.2_

- [x] 14.3 Implement "Page SysOp" functionality
  - Add "Page SysOp" option to main menu
  - Prompt user for optional question
  - Generate AI response within 5 seconds
  - Display response to user
  - _Requirements: 5.3_

- [ ]* 14.4 Write property test for AI welcome generation
  - **Property 17: AI welcome generation for new users**
  - **Validates: Requirements 5.1**

- [ ]* 14.5 Write property test for AI greeting generation
  - **Property 18: AI greeting for returning users**
  - **Validates: Requirements 5.2**

- [ ]* 14.6 Write property test for AI response time
  - **Property 19: AI SysOp response time**
  - **Validates: Requirements 5.3**

- [ ]* 14.7 Write property test for AI ANSI formatting
  - **Property 20: AI message ANSI formatting**
  - **Validates: Requirements 5.4**

- [ ]* 14.8 Write property test for AI response length
  - **Property 21: AI response length constraint**
  - **Validates: Requirements 5.5**

- [ ] 15. Create basic control panel
- [x] 15.1 Set up React control panel application
  - Initialize React app with Vite
  - Set up Tailwind CSS for styling
  - Create basic layout with navigation
  - _Requirements: 8.1_

- [x] 15.2 Implement REST API for control panel
  - Create API endpoints for dashboard, users, message bases
  - Implement authentication for SysOp access
  - Add CORS configuration for local development
  - _Requirements: 8.1_

- [x] 15.3 Create dashboard page
  - Display current callers and active sessions
  - Show recent activity log
  - Display system status (uptime, node usage)
  - _Requirements: 8.1, 8.2_

- [ ]* 15.4 Write property test for dashboard information
  - **Property 29: Dashboard real-time information**
  - **Validates: Requirements 8.2**

- [x] 16. Implement AI Configuration Assistant
- [x] 16.1 Create AIConfigAssistant class
  - Implement configuration tools (update BBS settings, AI SysOp, message bases)
  - Use AI with function calling to interpret natural language requests
  - Generate previews of proposed changes
  - _Requirements: 6.2, 6.3_

- [x] 16.2 Add chat interface to control panel
  - Create AIChat component in React
  - Connect to AI Configuration Assistant via API
  - Display conversation history
  - Show previews of proposed changes
  - Allow confirmation/rejection of changes
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 16.3 Implement configuration persistence
  - Update config.yaml when changes are confirmed
  - Apply changes without restart where possible
  - Provide confirmation feedback
  - _Requirements: 6.4, 6.5_

- [ ]* 16.4 Write property test for AI configuration interpretation
  - **Property 22: AI configuration interpretation**
  - **Validates: Requirements 6.2**

- [ ]* 16.5 Write property test for configuration preview
  - **Property 23: Configuration change preview**
  - **Validates: Requirements 6.3**

- [ ]* 16.6 Write property test for configuration persistence
  - **Property 24: Configuration persistence**
  - **Validates: Requirements 6.4**

- [x] 17. Checkpoint - Verify Milestone 3
  - Ensure all tests pass, ask the user if questions arise.
  - **Note:** Task 16 (AI Config Assistant) is deferred - manual config editing works fine for MVP

## Milestone 3.5: Security & Refactoring

- [x] 17.5. Implement JWT-based API authentication (P0 - Critical)
- [x] 17.5.1 Add JWT library and configuration
  - Install jsonwebtoken library
  - Add JWT secret to environment variables
  - Configure token signing and verification settings
  - _Requirements: 15.6 (Security)_
  - _Architecture Review: P0 - JWT tokens are currently just random strings_

- [x] 17.5.2 Implement JWT token generation
  - Replace random token generation with JWT signing
  - Include user ID, handle, and access level in token payload
  - Add token expiration (24 hours default)
  - Update login endpoint to return JWT tokens
  - _Requirements: 15.6 (Security)_
  - _Architecture Review: P0 - Security vulnerability_

- [x] 17.5.3 Implement JWT token verification middleware
  - Create middleware to verify JWT tokens on protected routes
  - Extract and validate token from Authorization header
  - Attach decoded user information to request context
  - Handle expired and invalid tokens with appropriate errors
  - _Requirements: 15.6 (Security)_
  - _Architecture Review: P0 - Security vulnerability_

- [x] 17.5.4 Add token expiration and refresh mechanism
  - Implement token expiration checking
  - Add refresh token endpoint (optional)
  - Update control panel to handle token expiration
  - Redirect to login on expired tokens
  - _Requirements: 15.6 (Security)_
  - _Architecture Review: P0 - Tokens never expire currently_

- [x] 17.5.5 Write unit tests for JWT authentication
  - Test token generation with valid user data
  - Test token verification with valid/invalid/expired tokens
  - Test middleware behavior on protected routes
  - Test token expiration handling
  - _Requirements: 15.6 (Security)_

- [x] 17.6. Implement API rate limiting (P0 - Critical)
- [x] 17.6.1 Add rate limiting middleware
  - Install rate limiting library (e.g., @fastify/rate-limit)
  - Configure rate limits for API endpoints
  - Set limits: 100 requests per 15 minutes per IP
  - Add rate limit headers to responses
  - _Requirements: 15.1, 15.2, 15.3_
  - _Architecture Review: P0 - API has no rate limiting_

- [x] 17.6.2 Implement per-endpoint rate limiting
  - Add stricter limits for authentication endpoints (10/min)
  - Add limits for data modification endpoints (30/min)
  - Configure different limits for authenticated vs unauthenticated requests
  - _Requirements: 15.1, 15.2, 15.3_
  - _Architecture Review: P0 - Prevent API abuse_

- [x] 17.6.3 Write unit tests for rate limiting
  - Test rate limit enforcement
  - Test rate limit headers
  - Test different limits for different endpoints
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 17.7. Extract service layer (P1 - High Priority)
- [x] 17.7.1 Create UserService class
  - Extract user-related business logic from AuthHandler
  - Move user creation, validation, and authentication logic
  - Create methods: createUser, validateHandle, authenticateUser
  - Update AuthHandler to use UserService
  - _Architecture Review: P1 - Handlers contain too much business logic_

- [x] 17.7.2 Create SessionService class
  - Extract session management logic from SessionManager
  - Move session creation, validation, and cleanup logic
  - Create methods: createSession, validateSession, cleanupSession
  - Update SessionManager to use SessionService
  - _Architecture Review: P1 - Better separation of concerns_

- [x] 17.7.3 Create AIService class
  - Extract AI interaction logic from AISysOp
  - Move prompt construction and response formatting
  - Create methods: generateWelcome, generateGreeting, generateResponse
  - Update AISysOp to use AIService
  - _Architecture Review: P1 - Centralize AI logic_

- [x] 17.7.4 Write unit tests for service layer
  - Test UserService methods
  - Test SessionService methods
  - Test AIService methods
  - _Architecture Review: P1 - Ensure services work correctly_

- [x] 17.8. Deduplicate code (P1 - High Priority)
- [x] 17.8.1 Create shared validation utilities
  - Extract common validation logic (handle, password, input sanitization)
  - Create ValidationUtils class with reusable methods
  - Update all handlers to use shared validation
  - _Architecture Review: P1 - Validation logic duplicated across handlers_

- [x] 17.8.2 Create shared error handling utilities
  - Extract common error handling patterns
  - Create ErrorHandler class with standard error responses
  - Update all routes and handlers to use shared error handling
  - _Architecture Review: P1 - Error handling duplicated_

- [x] 17.8.3 Consolidate terminal rendering logic
  - Review ANSITerminalRenderer and WebTerminalRenderer for duplication
  - Extract common rendering utilities
  - Create shared base class or utility functions
  - _Architecture Review: P1 - Some duplication in renderers_
  - _Status: BaseTerminalRenderer created but not yet used by WebTerminalRenderer and ANSITerminalRenderer_

- [x] 17.8.4 Write unit tests for shared utilities
  - Test validation utilities
  - Test error handling utilities
  - Test rendering utilities
  - _Architecture Review: P1 - Ensure utilities work correctly_

- [x] 17.9. Checkpoint - Verify Milestone 3.5
  - Ensure all tests pass, ask the user if questions arise.
  - Verify JWT authentication works in control panel
  - Verify rate limiting is enforced
  - Verify service layer improves code organization

## Milestone 4: Door Game (The Oracle)

- [x] 18. Implement door game framework
- [x] 18.1 Create Door interface and DoorHandler
  - Define Door interface with enter, processInput, exit methods
  - Implement DoorHandler to manage door game lifecycle
  - Add door game menu to main menu
  - Track door session state
  - _Requirements: 7.1_

- [x] 18.2 Create door session management
  - Store door game state in session
  - Persist door sessions to database for resumption
  - Handle door exit and return to menu
  - _Requirements: 7.5_

- [ ]* 18.3 Write property test for door exit navigation
  - **Property 28: Door exit navigation**
  - **Validates: Requirements 7.5**

- [x] 19. Implement The Oracle door game
- [x] 19.1 Create OracleDoor class
  - Implement Door interface for The Oracle
  - Create atmospheric introduction screen
  - Handle question input from user
  - _Requirements: 7.2_

- [x] 19.2 Integrate AI for Oracle responses
  - Create Oracle system prompt with mystical personality
  - Generate responses using AI provider
  - Format responses with mystical symbols and dramatic pauses
  - Enforce 150 character limit
  - _Requirements: 7.3, 7.4_

- [x] 19.3 Add Oracle to door games menu
  - Register Oracle door with DoorHandler
  - Display in door games list
  - Handle entry and exit
  - _Requirements: 7.1, 7.5_

- [ ]* 19.4 Write property test for Oracle response style
  - **Property 26: Oracle response style**
  - **Validates: Requirements 7.3**

- [ ]* 19.5 Write property test for Oracle response length
  - **Property 27: Oracle response length**
  - **Validates: Requirements 7.4**

- [ ] 20. Add AI request rate limiting
- [x] 20.1 Implement rate limiter for door games
  - Track AI requests per user per minute
  - Limit to 10 requests per minute
  - Display rate limit message when exceeded
  - _Requirements: 15.3_

- [ ]* 20.2 Write property test for AI request rate limiting
  - **Property 57: AI request rate limiting**
  - **Validates: Requirements 15.3**

- [x] 21. Checkpoint - Verify Milestone 4
  - Ensure all tests pass, ask the user if questions arise.

## Milestone 5: Polish & Message Bases

- [ ] 22. Implement message base system
- [x] 22.1 Create message repositories
  - Implement MessageBaseRepository for message base CRUD
  - Implement MessageRepository for message CRUD
  - Add methods for listing, reading, and posting messages
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 22.2 Create MessageHandler
  - Implement message base listing
  - Implement message reading with chronological ordering
  - Implement message posting with subject and body
  - Display messages with subject, author, timestamp
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 22.3 Add message persistence and visibility
  - Store messages in database with user and message base references
  - Make messages visible to all users with appropriate access
  - _Requirements: 4.5_

- [ ]* 22.4 Write property test for message base list display
  - **Property 13: Message base list display**
  - **Validates: Requirements 4.1**

- [ ]* 22.5 Write property test for message chronological ordering
  - **Property 15: Message chronological ordering**
  - **Validates: Requirements 4.3**

- [ ]* 22.6 Write property test for message posting persistence
  - **Property 16: Message posting persistence**
  - **Validates: Requirements 4.4, 4.5**

- [ ] 23. Add message posting rate limiting
- [x] 23.1 Implement rate limiter for messages
  - Track messages posted per user per hour
  - Limit to 30 messages per hour
  - Display rate limit message when exceeded
  - _Requirements: 15.2_

- [ ]* 23.2 Write property test for message rate limiting
  - **Property 56: Message posting rate limiting**
  - **Validates: Requirements 15.2**

- [ ] 24. Complete control panel features
- [x] 24.1 Implement Users management page
  - Display list of registered users
  - Show handle, access level, registration date
  - Add ability to edit access levels
  - _Requirements: 8.3_

- [x] 24.2 Implement Message Bases management page
  - Display list of message bases
  - Add creation, editing, and deletion functionality
  - Configure access levels for read/write
  - _Requirements: 8.4_

- [x] 24.3 Implement AI Settings page
  - Display current AI configuration
  - Provide access to AI Configuration Assistant
  - Show AI provider and model information
  - _Requirements: 8.5_

- [ ]* 24.4 Write property test for user list display
  - **Property 30: User list display**
  - **Validates: Requirements 8.3**

- [ ]* 24.5 Write property test for message base CRUD
  - **Property 31: Message base CRUD operations**
  - **Validates: Requirements 8.4**

- [ ] 25. Add input sanitization and security
- [x] 25.1 Implement input sanitization
  - Sanitize all user input to prevent injection attacks
  - Escape ANSI sequences in user-generated content
  - Validate input lengths and formats
  - _Requirements: 15.4_

- [ ]* 25.2 Write property test for input sanitization
  - **Property 58: Input sanitization**
  - **Validates: Requirements 15.4**

- [ ] 26. Implement graceful shutdown and offline handling
- [x] 26.1 Add graceful shutdown
  - Disconnect all active sessions with goodbye message
  - Close database connections
  - Log shutdown event
  - _Requirements: 14.5_

- [x] 26.2 Add offline message for connection attempts
  - Display offline message when server is not running
  - Include information about when BBS might return
  - _Requirements: 14.1, 14.4_

- [x] 26.3 Add reconnection support
  - Allow callers to reconnect after server restart
  - Restore session state where possible
  - _Requirements: 14.3_

- [ ]* 26.4 Write property test for graceful shutdown
  - **Property 54: Graceful shutdown**
  - **Validates: Requirements 14.5**

- [-] 27. UI polish and refinements
- [x] 27.1 Refine ANSI templates
  - Create additional ANSI templates (goodbye, menus)
  - Ensure consistent visual style
  - Test rendering in terminal client
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 27.2 Add loading states and feedback
  - Show loading indicators for AI requests
  - Provide feedback for long-running operations
  - Improve error messages
  - _Requirements: All_

- [ ]* 27.3 Test multi-user scenarios
  - Verify concurrent user access
  - Test session isolation
  - Verify message visibility across users
  - _Requirements: 10.2, 4.5_

- [ ] 28. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all MVP requirements are met
  - Test complete user flows end-to-end
  - Prepare demo scenarios

## Milestone 6: Hybrid Architecture (REST + WebSocket)

- [x] 29. Design REST API
- [x] 29.1 Design REST API endpoints for all BBS operations
  - Define endpoint structure (auth, users, messages, doors)
  - Plan request/response formats
  - Document error handling patterns
  - _Requirements: 16.2_

- [x] 29.2 Define API authentication strategy
  - Design JWT token structure
  - Plan token refresh mechanism
  - Maintain backward compatibility with WebSocket auth
  - _Requirements: 16.1_

- [x] 29.3 Create OpenAPI/Swagger documentation
  - Write OpenAPI 3.0 specification
  - Document all endpoints with examples
  - Include authentication requirements
  - _Requirements: 19.1_

- [x] 29.4 Plan WebSocket notification events
  - Define notification event types
  - Design event payload structures
  - Plan subscription mechanism
  - _Requirements: 17.1_

- [x] 30. Implement Core REST API
- [x] 30.1 Add authentication endpoints
  - POST /api/auth/login (login with credentials)
  - POST /api/auth/register (create new account)
  - POST /api/auth/refresh (refresh JWT token)
  - GET /api/auth/me (get current user)
  - _Requirements: 16.1_

- [x] 30.2 Add user management endpoints
  - GET /api/users (list users - admin only)
  - GET /api/users/:id (get user profile)
  - PATCH /api/users/:id (update user profile)
  - _Requirements: 16.2_

- [x] 30.3 Add message base endpoints
  - GET /api/message-bases (list all bases)
  - GET /api/message-bases/:id (get base details)
  - POST /api/message-bases (create base - admin only)
  - _Requirements: 16.2_

- [x] 30.4 Add message endpoints
  - GET /api/message-bases/:id/messages (list messages)
  - GET /api/messages/:id (get message details)
  - POST /api/message-bases/:id/messages (post new message)
  - POST /api/messages/:id/replies (post reply)
  - _Requirements: 16.2_

- [ ]* 30.5 Write property tests for REST API
  - **Property 59: REST API authentication**
  - **Property 60: REST API CRUD operations**
  - **Validates: Requirements 16.1, 16.2**

- [x] 31. Implement Door Game REST API
- [x] 31.1 Add door game endpoints
  - GET /api/doors (list available doors)
  - POST /api/doors/:id/enter (enter door game)
  - POST /api/doors/:id/input (send input to door)
  - POST /api/doors/:id/exit (exit door game)
  - _Requirements: 16.2_

- [x] 31.2 Add door session management via API
  - Maintain door state in session
  - Handle door timeouts
  - Support concurrent door sessions
  - _Requirements: 16.2_

- [x] 31.3 Maintain door state persistence
  - Ensure door state persists across API calls
  - Support session recovery
  - _Requirements: 16.2_

- [x] 32. Add WebSocket Notification System
- [x] 32.1 Design notification event types
  - Define event schema (type, timestamp, data)
  - Create event type constants
  - Document event payloads
  - _Requirements: 17.1_

- [x] 32.2 Implement server-side notification broadcasting
  - Create NotificationService
  - Add event subscription mechanism
  - Implement broadcast to subscribed clients
  - _Requirements: 17.1, 17.2_

- [x] 32.3 Add real-time updates for new messages
  - Broadcast new message events
  - Include message base and message data
  - Filter by user subscriptions
  - _Requirements: 17.1_

- [x] 32.4 Add real-time updates for user activity
  - Broadcast user join/leave events
  - Send system announcements
  - Handle door game updates
  - _Requirements: 17.1_

- [x] 32.5 Write property tests for notifications
  - **Property 61: Notification delivery**
  - **Validates: Requirements 17.1, 17.2**

- [x] 33. Refactor Terminal Client
- [x] 33.1 Update terminal to use REST API for actions
  - Replace WebSocket commands with REST API calls for authentication
  - Replace WebSocket commands with REST API calls for message operations
  - Replace WebSocket commands with REST API calls for door game operations
  - Maintain same user experience
  - Handle API errors gracefully
  - _Requirements: 18.1_
  - _Status: Complete - Terminal client refactored to hybrid architecture_

- [x] 33.2 Keep WebSocket for real-time notifications
  - Subscribe to relevant notification events (MESSAGE_NEW, USER_JOINED, USER_LEFT)
  - Update UI based on notifications
  - Handle reconnection
  - _Requirements: 18.1_
  - _Status: Complete - WebSocket notifications integrated_

- [x] 33.3 Maintain existing BBS user experience
  - Ensure no visible changes to users
  - Keep same response times
  - Preserve ANSI rendering
  - _Requirements: 18.1_
  - _Status: Complete - User experience preserved_

- [x] 33.4 Add graceful fallback to WebSocket-only mode
  - Detect REST API unavailability
  - Fall back to WebSocket commands
  - Log fallback events
  - _Requirements: 18.1_
  - _Status: Complete - Fallback mechanism implemented_

- [-] 34. Testing and Validation
- [x] 34.1 Create REST API test suite
  - Write integration tests for all endpoints
  - Test authentication flows
  - Test error handling
  - _Requirements: 19.2_
  - _Status: Comprehensive tests in server/src/api/routes.test.ts_

- [x] 34.2 Test all operations via curl/Postman
  - Create Postman collection
  - Document curl examples in OpenAPI spec
  - Verify all endpoints work
  - _Requirements: 19.2_

- [x] 34.3 Validate WebSocket notifications work
  - Test notification delivery
  - Verify subscription mechanism
  - Test concurrent clients
  - _Requirements: 17.2_
  - _Status: Property tests and unit tests complete_

- [x] 34.4 Performance testing (REST vs WebSocket)
  - Benchmark API response times
  - Compare with WebSocket performance
  - Identify bottlenecks
  - _Requirements: 19.2_

- [x] 35. Documentation and Examples
- [x] 35.1 Create API documentation
  - Complete OpenAPI specification
  - Generate API reference docs
  - Add authentication guide
  - _Requirements: 19.1_
  - _Status: OpenAPI spec complete in server/openapi.yaml_

- [x] 35.2 Add example API usage
  - Create code examples (curl, JavaScript, Python)
  - Document common workflows
  - Add troubleshooting guide
  - _Requirements: 19.1_

- [x] 35.3 Create mobile app development guide
  - Document mobile app architecture
  - Provide React Native example
  - Include best practices
  - _Requirements: 20.1_

- [x] 35.4 Update architecture documentation
  - Update ARCHITECTURE.md with hybrid design
  - Document API patterns
  - Explain notification system
  - _Requirements: 18.2_

- [x] 36. Code Quality and Refactoring
- [x] 36.1 Fix type assertion in JWT configuration
  - Remove `as any` type assertion in index.ts
  - Properly type JWT config extraction
  - _Architecture Review: P1 - Type safety issue_

- [x] 36.2 Add public getter for DoorHandler doors
  - Add getDoors() method to DoorHandler
  - Update DoorService initialization to use getter
  - Remove direct access to private property
  - _Architecture Review: P1 - Encapsulation violation_

- [x] 36.3 Create error handling utilities
  - Extract common error handling patterns from routes.ts
  - Create ErrorHandler utility class
  - Update all API routes to use shared error handling
  - _Architecture Review: P1 - Code duplication_

- [x] 36.4 Refactor terminal renderers to use BaseTerminalRenderer
  - Update ANSITerminalRenderer to extend BaseTerminalRenderer
  - Update WebTerminalRenderer to extend BaseTerminalRenderer
  - Remove duplicated code
  - _Architecture Review: P1 - Code duplication_
  - _Status: Complete - Same as task 17.8.3_

- [x] 36.5 Repository cleanup and organization
- [x] 36.5.1 Audit root directory documentation files
  - List all markdown files in root directory
  - Categorize by type (architecture reviews, task completion, milestone summaries, etc.)
  - Identify files that are outdated or superseded
  - Identify files that should be archived vs deleted
  - Create inventory document
  - _Requirements: Project organization_

- [x] 36.5.2 Create docs archive structure
  - Create `docs/archive/` directory structure
  - Create subdirectories: `architecture-reviews/`, `milestone-summaries/`, `task-completions/`, `planning/`
  - Move historical documentation to appropriate archive folders
  - Keep only current/relevant docs in root (README.md, ARCHITECTURE.md, etc.)
  - _Requirements: Project organization_

- [x] 36.5.3 Consolidate architecture documentation
  - Review all ARCHITECTURE_REVIEW_*.md files
  - Identify the most recent comprehensive review
  - Archive older reviews to `docs/archive/architecture-reviews/`
  - Keep only current ARCHITECTURE.md and latest comprehensive review in root
  - Update ARCHITECTURE.md if needed with latest information
  - _Requirements: Project organization_

- [x] 36.5.4 Consolidate milestone and task documentation
  - Move all MILESTONE_*_COMPLETE.md files to `docs/archive/milestone-summaries/`
  - Move all TASK_*_COMPLETE.md files to `docs/archive/task-completions/`
  - Move all planning documents to `docs/archive/planning/`
  - Keep only active/current status documents in root
  - _Requirements: Project organization_

- [x] 36.5.5 Clean up temporary and test files
  - Identify any temporary test scripts in root or server directories
  - Remove or move test scripts to appropriate test directories
  - Check for any .log, .tmp, or other temporary files
  - Verify .gitignore covers temporary file patterns
  - _Requirements: Project organization_

- [x] 36.5.6 Update documentation index
  - Create or update DOCUMENTATION.md in root
  - List all current documentation with descriptions
  - Document archive structure and what's in each folder
  - Add guidelines for where new documentation should go
  - _Requirements: Project organization_

- [x] 36.5.7 Verify repository cleanliness
  - Run git status to check for untracked files
  - Verify no sensitive data in repository
  - Check that data/ directory is properly gitignored
  - Ensure node_modules are not tracked
  - Review .gitignore completeness
  - _Requirements: Project organization_

- [x] 37. Final checkpoint - Hybrid architecture verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify hybrid architecture works correctly
  - Validate all features work via both REST and WebSocket
  - Performance and security validation
  - Complete system documentation

## Milestone 6.5: Code Quality Refactoring

**Context:** Architecture review after Task 44 identified critical technical debt that must be addressed before continuing Milestone 7. The routes.ts file has grown to 2,119 lines with 40% code duplication. Refactoring now will improve maintainability and reduce bug risk.

**Goal:** Improve architecture score from 8.7/10 to 9.2/10 by addressing P0 and P1 technical debt.

- [x] 39. Execute critical refactoring tasks (P0)

- [x] 39.1 Split routes.ts into separate route files
  - Create `server/src/api/routes/auth.routes.ts` (authentication endpoints)
  - Create `server/src/api/routes/user.routes.ts` (user management endpoints)
  - Create `server/src/api/routes/message.routes.ts` (message & base endpoints)
  - Create `server/src/api/routes/door.routes.ts` (door game endpoints)
  - Create `server/src/api/routes/system.routes.ts` (system admin endpoints)
  - Create `server/src/api/routes/config.routes.ts` (AI configuration endpoints)
  - Update main routes.ts to import and register all route modules
  - Verify all 385 tests still pass
  - **Impact:** Reduces routes.ts from 2,119 lines to ~100 lines
  - **Effort:** 4-6 hours
  - _Architecture: Code organization, maintainability_

- [x] 39.2 Response helper utilities (already complete via ErrorHandler)
  - ErrorHandler utility class provides all required methods
  - All route modules use ErrorHandler consistently
  - ~40% code duplication reduction achieved
  - **Status:** Complete (implemented in task 36.3)
  - _Architecture: DRY principle, consistency_

- [x] 39.3 Add JSON Schema validation (P1) - DEFERRED
  - Create schema directory `server/src/api/schemas/`
  - Create schema files:
    - `auth.schema.ts` - authentication request schemas
    - `user.schema.ts` - user management schemas
    - `message.schema.ts` - message operation schemas
    - `door.schema.ts` - door game schemas
    - `system.schema.ts` - system operation schemas
  - Update all routes to use Fastify schema validation
  - Remove manual validation code from route handlers
  - Verify all tests still pass
  - **Impact:** Eliminates 50+ instances of manual validation
  - **Effort:** 3-4 hours
  - _Architecture: Validation consistency, security_

- [x] 39.4 Door timeout checking (already optimized)
  - DoorHandler already uses lazy timeout evaluation
  - Timeout checked on each interaction, not via polling
  - No polling overhead
  - **Status:** Already optimized
  - _Architecture: Performance, scalability_

- [x] 39.5 CORS configuration (already configured)
  - CORS properly configured in server/src/index.ts
  - CORS_ORIGIN environment variable supported
  - Documented in .env.example and README.md
  - **Status:** Already configured
  - _Architecture: Security, deployment_

- [x] 39.6 Verify refactoring success
  - Run full test suite (385 tests)
  - Verify all tests pass
  - Manual testing of key user flows
  - Measure code metrics:
    - routes.ts line count (target: ~100 lines)
    - Code duplication percentage (target: <10%)
    - Architecture score (target: 9.2/10)
  - Update architecture documentation
  - Create refactoring completion report
  - **Effort:** 1-2 hours
  - _Architecture: Quality assurance, documentation_

**Success Criteria:**
- ✅ routes.ts reduced from 2,119 to ~100 lines (-95%)
- ✅ Code duplication reduced from 40% to <10% (-30%)
- ✅ All 385 tests passing
- ✅ No functional regressions
- ✅ Architecture score improved from 8.7 to 9.2 (+0.5)
- ✅ Cleaner codebase for remaining Milestone 7 tasks

**Estimated Time:** 12-16 hours (2 working days)

## Milestone 7: Comprehensive User Testing (Demo Readiness)

- [x] 40. Set up MCP-based user testing framework
- [x] 40.1 Configure Chrome DevTools MCP for automated testing
  - Verify MCP Chrome DevTools server is available
  - Test basic browser automation capabilities
  - Create helper utilities for BBS testing
  - _Requirements: All (validation)_

- [x] 40.2 Create test user personas and scenarios
  - Define test personas (new user, returning user, admin)
  - Document test scenarios for each user journey
  - Create test data (users, messages, message bases)
  - _Requirements: All (validation)_

- [x] 41. Test new user registration flow
- [x] 41.1 Automate new user registration via MCP
  - Navigate to BBS terminal URL
  - Take snapshot of welcome screen
  - Verify welcome screen formatting and content
  - Enter "NEW" command
  - Complete registration flow (handle, password, profile)
  - Verify AI SysOp welcome message
  - Take snapshots at each step
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 5.1_

- [x] 41.2 Validate registration screen output
  - Check ANSI formatting is correct
  - Verify prompts are clear and properly formatted
  - Confirm AI welcome message appears
  - Verify message contains ANSI color codes
  - Check character limits and formatting
  - _Requirements: 1.2, 1.4, 5.1, 5.4, 5.5, 13.1, 13.2_

- [x] 42. Test returning user login flow
- [x] 42.1 Automate returning user login via MCP
  - Navigate to BBS terminal URL
  - Enter existing user handle
  - Enter password
  - Verify AI SysOp greeting message
  - Verify last login date display
  - Verify new message count display
  - Take snapshots at each step
  - _Requirements: 2.5, 5.2_

- [x] 42.2 Validate login screen output
  - Check prompt formatting
  - Verify AI greeting appears correctly
  - Confirm last login information is displayed
  - Check message count formatting
  - _Requirements: 2.5, 5.2, 5.4_

- [x] 43. Test main menu navigation
- [x] 43.1 Automate main menu interaction via MCP
  - Verify main menu displays after login
  - Take snapshot of main menu
  - Test each menu option (Message Bases, Door Games, User List, Page SysOp, Profile)
  - Verify submenu displays
  - Test return to main menu from each submenu
  - Take snapshots of each screen
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 43.2 Validate menu screen formatting
  - Check menu layout and alignment
  - Verify all options are visible and properly formatted
  - Confirm ANSI colors render correctly
  - Check submenu formatting
  - Verify navigation prompts are clear
  - _Requirements: 3.1, 3.2, 13.1, 13.2_

- [x] 43.3 Test invalid command handling
  - Enter invalid commands at main menu
  - Verify error messages display correctly
  - Confirm menu re-displays after error
  - Check error message formatting
  - _Requirements: 3.4_

- [x] 44. Test message base functionality
- [x] 44.1 Automate message base browsing via MCP
  - Navigate to Message Bases from main menu
  - Take snapshot of message base list
  - Enter a message base
  - View existing messages
  - Verify message formatting (subject, author, timestamp)
  - Take snapshots at each step
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 44.2 Automate message posting via MCP
  - Navigate to message base
  - Select post message option
  - Enter subject and body
  - Verify message posts successfully
  - Verify message appears in message list
  - Check message formatting
  - _Requirements: 4.4, 4.5_

- [x] 44.3 Validate message base screen output
  - Check message base list formatting
  - Verify message display formatting
  - Confirm timestamps are readable
  - Check subject/author alignment
  - Verify ANSI formatting in messages
  - _Requirements: 4.1, 4.3, 13.1, 13.2_

- [x] 45. Test AI SysOp interaction
- [x] 45.1 Automate Page SysOp via MCP
  - Navigate to Page SysOp option
  - Enter a question for the AI SysOp
  - Verify AI response appears within 5 seconds
  - Take snapshot of AI response
  - Test multiple questions
  - _Requirements: 5.3_

- [x] 45.2 Validate AI SysOp output quality
  - Check AI response formatting
  - Verify ANSI color codes are present
  - Confirm response length is under 500 characters
  - Check response relevance and helpfulness
  - Verify response time is acceptable
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 46. Test door game functionality via MCP
- [x] 46.1 Automate The Oracle door game via MCP
  - Navigate to Door Games menu
  - Take snapshot of door games list
  - Enter The Oracle door game
  - Verify atmospheric introduction screen
  - Ask The Oracle a question
  - Verify AI response appears
  - Exit door game and return to menu
  - Take snapshots at each step
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 46.2 Validate Oracle door game output
  - Check introduction screen formatting
  - Verify mystical atmosphere in responses
  - Confirm response length under 150 characters
  - Check ANSI formatting and symbols
  - Verify exit navigation works correctly
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 47. Test control panel functionality via MCP
- [x] 47.1 Automate control panel login via MCP
  - Navigate to control panel URL
  - Enter SysOp credentials
  - Verify dashboard displays
  - Take snapshot of dashboard
  - _Requirements: 8.1_

- [x] 47.2 Test dashboard information via MCP
  - Verify current callers display
  - Check active sessions information
  - Verify recent activity log
  - Check system status (uptime, node usage)
  - Take snapshots of dashboard sections
  - _Requirements: 8.1, 8.2_

- [x] 47.3 Test Users management page via MCP
  - Navigate to Users page
  - Verify user list displays
  - Check user information (handle, access level, registration date)
  - Test editing user access level
  - Take snapshots
  - _Requirements: 8.3_

- [x] 47.4 Test Message Bases management via MCP
  - Navigate to Message Bases page
  - Verify message base list displays
  - Test creating a new message base
  - Test editing message base settings
  - Test deleting a message base
  - Take snapshots at each step
  - _Requirements: 8.4_

- [x] 47.5 Test AI Settings page via MCP
  - Navigate to AI Settings page
  - Verify current AI configuration displays
  - Check AI provider and model information
  - Take snapshot
  - _Requirements: 8.5_

- [ ] 48. Test REST API via MCP
- [ ] 48.1 Test authentication endpoints via MCP
  - Test POST /api/auth/login
  - Test POST /api/auth/register
  - Test GET /api/auth/me
  - Verify JWT token generation
  - Verify error responses
  - _Requirements: 16.1_

- [ ] 48.2 Test message base endpoints via MCP
  - Test GET /api/message-bases
  - Test GET /api/message-bases/:id/messages
  - Test POST /api/message-bases/:id/messages
  - Verify response formats
  - Check error handling
  - _Requirements: 16.2_

- [ ] 48.3 Test door game endpoints via MCP
  - Test GET /api/doors
  - Test POST /api/doors/:id/enter
  - Test POST /api/doors/:id/input
  - Test POST /api/doors/:id/exit
  - Verify door state management
  - _Requirements: 16.2_

- [ ] 49. Test WebSocket notifications via MCP
- [ ] 49.1 Test real-time message notifications
  - Open two terminal clients
  - Post message from one client
  - Verify notification appears in other client
  - Check notification formatting
  - _Requirements: 17.1, 17.2_

- [ ] 49.2 Test user activity notifications
  - Monitor user join/leave events
  - Verify notifications display correctly
  - Check system announcements
  - _Requirements: 17.1_

- [ ] 50. Test error handling and edge cases via MCP
- [ ] 50.1 Test rate limiting via MCP
  - Attempt rapid login attempts
  - Verify rate limiting kicks in
  - Test message posting rate limits
  - Test AI request rate limits
  - Verify error messages display correctly
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 50.2 Test input validation via MCP
  - Test invalid handle formats
  - Test password requirements
  - Test message length limits
  - Verify sanitization of special characters
  - Check error message formatting
  - _Requirements: 2.3, 15.4_

- [ ] 50.3 Test connection handling via MCP
  - Test disconnect/reconnect scenarios
  - Verify session recovery
  - Test graceful shutdown
  - Check offline message display
  - _Requirements: 14.1, 14.3, 14.5_

- [ ] 51. Multi-user scenario testing via MCP
- [ ] 51.1 Test concurrent user access via MCP
  - Open multiple terminal clients simultaneously
  - Verify each user has isolated session
  - Test concurrent message posting
  - Verify message visibility across users
  - Check for race conditions
  - _Requirements: 10.2, 4.5_

- [ ] 51.2 Test multi-user door game access
  - Have multiple users enter door games
  - Verify session isolation
  - Check door state management
  - _Requirements: 7.5, 10.2_

- [ ] 52. Create demo-readiness report
- [ ] 52.1 Document all test results
  - Compile screenshots from all test scenarios
  - Document any formatting issues found
  - List any bugs or inconsistencies
  - Create before/after comparisons if fixes needed
  - _Requirements: All (validation)_

- [ ] 52.2 Create demo script
  - Write step-by-step demo walkthrough
  - Identify best features to showcase
  - Create talking points for each feature
  - Document any known limitations
  - _Requirements: All (validation)_

- [ ] 52.3 Verify demo-readiness checklist
  - All screens render correctly
  - All ANSI formatting displays properly
  - All user flows work end-to-end
  - No critical bugs or errors
  - Performance is acceptable
  - System is stable under normal load
  - _Requirements: All (validation)_

- [x] 53. Fix ANSI frame alignment issues
- [x] 53.1 Investigate frame alignment root cause
  - Review ANSIRenderer template system
  - Examine variable substitution logic
  - Check padding calculations
  - Test with different content lengths
  - Verify terminal width detection
  - Document findings
  - _Requirements: 13.1, 13.2_
  - _Issue: ANSI frames not properly aligned, right borders misaligned_

- [x] 53.2 Implement ANSIFrameBuilder utility
  - Create utility class for guaranteed frame alignment
  - Implement width calculation that accounts for ANSI codes
  - Add padding normalization
  - Support centering and left-alignment
  - Handle variable content lengths
  - Test with different frame widths
  - _Requirements: 13.1, 13.2_

- [x] 53.3 Implement ANSIFrameValidator for testing
  - Create validation utility to check frame alignment
  - Verify all corners are present and aligned
  - Check consistent width across all lines
  - Validate vertical borders are aligned
  - Add to test suite
  - _Requirements: 13.1, 13.2_

- [x] 53.4 Update all screens to use ANSIFrameBuilder
  - Update welcome screen
  - Update goodbye screen
  - Update menu screens
  - Update error message frames
  - Update door game frames
  - Verify alignment across all screens
  - _Requirements: 13.1, 13.2_

- [x] 53.5 Add visual regression tests
  - Capture baseline screenshots of all framed screens
  - Add automated frame validation to test suite
  - Test with different terminal widths (80, 132 columns)
  - Verify no regressions in alignment
  - _Requirements: 13.1, 13.2_

- [ ] 54. Final checkpoint - Demo readiness verification
  - Ensure all user testing is complete
  - Verify all screens are properly formatted
  - Verify ANSI frames are properly aligned
  - Confirm system is demo-ready
  - Address any critical issues found during testing
  - Get user sign-off for demo readiness

---

## Milestone 7.5: AI Innovation Features (Hackathon Demo)

**Status:** Planned 📋  
**Timeline:** 1-2 days (8-10 hours)  
**Goal:** Add compelling AI-powered features that showcase "resurrection with innovation"

### Feature 1: AI-Generated ANSI Art

- [x] 55. Create ANSIArtGenerator service
- [x] 55.1 Implement AI art generation
  - Create ANSIArtGenerator class in services/
  - Design Claude prompt for ASCII/ANSI art generation
  - Add support for different art styles (retro, cyberpunk, fantasy)
  - Implement art validation (width, height, character set)
  - _Requirements: AI Innovation_

- [x] 55.2 Add color code injection
  - Use ANSIColorizer to add color codes to generated art
  - Support color themes (monochrome, 16-color, bright)
  - Ensure colors work in terminal display
  - _Requirements: 13.1, 13.2_

- [x] 55.3 Add art formatting and framing
  - Use ANSIFrameBuilder to frame generated art
  - Add title and attribution
  - Ensure proper alignment and padding
  - _Requirements: 13.1, 13.2_

- [x] 56. Create "Art Studio" door game
- [x] 56.1 Implement Art Studio door
  - Create ArtStudioDoor class implementing Door interface
  - Add atmospheric introduction screen
  - Prompt user for art description
  - Show loading animation while generating
  - _Requirements: 7.1, AI Innovation_

- [x] 56.2 Add art preview and save
  - Display generated art in terminal
  - Offer options: save, regenerate, or exit
  - Handle user input for art management
  - _Requirements: 7.1, AI Innovation_

- [x] 56.3 Register Art Studio with DoorHandler
  - Add Art Studio to door games list
  - Configure door in config.yaml
  - Test door entry and exit
  - _Requirements: 7.1_

- [x] 57. Add art gallery and persistence
- [x] 57.1 Create ArtGalleryRepository
  - Design database schema for art storage
  - Implement CRUD operations for art pieces
  - Store art content, title, author, timestamp
  - _Requirements: 9.3, AI Innovation_

- [x] 57.2 Add gallery view to menu
  - Create gallery menu option
  - Display list of saved art pieces
  - Allow viewing individual pieces
  - Show art metadata (author, date, description)
  - _Requirements: 3.1, AI Innovation_

- [x] 57.3 Add REST API endpoints for art
  - POST /api/v1/art/generate - Generate new art
  - GET /api/v1/art - List saved art
  - GET /api/v1/art/:id - Get specific art piece
  - DELETE /api/v1/art/:id - Delete art (owner only)
  - _Requirements: 16.2, AI Innovation_

### Feature 2: AI Message Summarization

- [x] 58. Create MessageSummarizer service
- [x] 58.1 Implement thread summarization
  - Create MessageSummarizer class in services/
  - Fetch messages from thread
  - Send to Claude with summarization prompt
  - Format summary with key points and highlights
  - _Requirements: AI Innovation_

- [x] 58.2 Add summary caching
  - Cache summaries in database to avoid repeated API calls
  - Invalidate cache when new messages are posted
  - Add cache expiration (e.g., 1 hour)
  - _Requirements: AI Innovation_

- [x] 58.3 Format summaries with ANSI
  - Use ANSIColorizer for highlighting key points
  - Use ANSIFrameBuilder for summary display
  - Add visual separators between summary sections
  - _Requirements: 13.1, 13.2_

- [x] 59. Add summarization to message base UI
- [x] 59.1 Add "Summarize Thread" menu option
  - Add option to message base menu
  - Prompt user to confirm (API cost warning)
  - Display loading message while generating
  - Show formatted summary
  - _Requirements: 4.1, AI Innovation_

- [x] 59.2 Add REST API endpoint for summaries
  - POST /api/v1/message-bases/:id/summarize - Generate summary
  - GET /api/v1/message-bases/:id/summary - Get cached summary
  - Include summary metadata (generated time, message count)
  - _Requirements: 16.2, AI Innovation_

- [x] 60. Add "Catch Me Up" feature
- [x] 60.1 Implement daily digest generation
  - Detect when user has been away (last login > 24h)
  - Generate summary of activity since last login
  - Highlight new messages in subscribed bases
  - _Requirements: AI Innovation_

- [x] 60.2 Display digest on login
  - Show digest after login if user was away
  - Format as "What You Missed" screen
  - Provide option to skip or read details
  - _Requirements: 2.5, AI Innovation_

### Feature 3: AI Conversation Starters

- [x] 61. Create ConversationStarter service
- [x] 61.1 Implement activity analysis
  - Create ConversationStarter class in services/
  - Analyze recent message base activity
  - Identify trending topics and engagement patterns
  - Detect conversation lulls
  - _Requirements: AI Innovation_

- [x] 61.2 Generate contextual prompts
  - Send activity analysis to Claude
  - Generate engaging discussion questions
  - Ensure questions are relevant to community interests
  - Format questions with ANSI styling
  - _Requirements: AI Innovation_

- [x] 61.3 Post as AI SysOp
  - Post generated questions to message base
  - Use special formatting to identify AI-generated content
  - Add attribution: "Question from AI SysOp"
  - Track which questions were AI-generated
  - _Requirements: 4.4, AI Innovation_

- [x] 62. Add "Question of the Day" feature
- [x] 62.1 Add scheduled trigger
  - Create scheduled task for daily question generation
  - Configure schedule in config.yaml
  - Support manual trigger from control panel
  - _Requirements: AI Innovation_

- [x] 62.2 Add control panel management
  - Create "Conversation Starters" page in control panel
  - Show history of generated questions
  - Display engagement metrics (replies, views)
  - Add manual trigger button
  - _Requirements: 8.1, AI Innovation_

- [x] 62.3 Add configuration options
  - Configure target message base for questions
  - Set generation frequency
  - Enable/disable feature
  - Customize AI personality for questions
  - _Requirements: 6.4, AI Innovation_

- [x] 63. Add REST API endpoints for conversation starters
  - POST /api/v1/conversation-starters/generate - Generate new question
  - GET /api/v1/conversation-starters - List generated questions
  - GET /api/v1/conversation-starters/:id - Get specific question with metrics
  - _Requirements: 16.2, AI Innovation_

### Integration and Testing

- [x] 64. Integration checkpoint
  - Verify all three features work together
  - Test AI API rate limiting with multiple features
  - Ensure features don't interfere with existing functionality
  - Verify ANSI rendering for all new screens
  - Test REST API endpoints for all features
  - Update OpenAPI documentation

- [ ] 65. Demo preparation
  - Create demo script showcasing all three features
  - Prepare sample prompts for art generation
  - Pre-generate some impressive art pieces
  - Create sample message threads for summarization
  - Test conversation starter generation
  - Verify all features are visually impressive

---

## Post-MVP Enhancements (Future)

### Phase 1: Enhanced Door Games
- [ ] 55. Add Phantom Quest text adventure door game
  - Implement more complex AI door game with state tracking
  - Add inventory, health, and location management
  - Create multi-room adventure with puzzles
  - _Requirements: Future enhancement_

### Phase 2: Classic BBS Protocols
- [ ] 56. Implement Telnet server
  - Add Telnet protocol support using connection abstraction
  - Test with classic BBS terminal clients (SyncTERM, NetRunner)
  - Support ANSI-BBS terminal emulation
  - _Requirements: Future enhancement_

- [ ] 57. Implement SSH server
  - Add SSH protocol support using connection abstraction
  - Provide secure terminal access
  - Support key-based authentication
  - _Requirements: Future enhancement_

### Phase 3: Enhanced User Experience
- [ ] 58. Add sound effects to web terminal
  - Implement modem connection sound
  - Add notification sounds for messages
  - Add door entry sound effects
  - _Requirements: Future enhancement_

- [ ] 59. Implement file transfer protocols
  - Add ZMODEM support for file uploads/downloads
  - Create file library system
  - Add file descriptions and categories
  - _Requirements: Future enhancement_

### Phase 4: AI Moderation
- [ ] 60. Implement AI moderation for message bases
  - Add AI-based content moderation
  - Flag inappropriate content
  - Provide moderation dashboard for SysOp
  - _Requirements: Future enhancement_

### Phase 5: Federation
- [ ] 61. Implement BBS-to-BBS networking
  - Add FidoNet-style message exchange
  - Support inter-BBS mail
  - Create BBS directory/registry
  - _Requirements: Future enhancement_
