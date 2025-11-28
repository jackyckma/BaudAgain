# Implementation Plan

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

- [ ] 9.3 Write property test for handle validation
  - **Property 5: Handle validation**
  - **Validates: Requirements 2.3**

- [ ] 9.4 Write property test for password hashing
  - **Property 6: Password hashing round-trip**
  - **Validates: Requirements 2.4**

- [ ] 9.5 Write property test for password security
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

- [ ] 10.3 Write property test for valid authentication
  - **Property 7: Valid credential authentication**
  - **Validates: Requirements 2.5**

- [ ] 10.4 Write property test for invalid credential handling
  - **Property 8: Invalid credential rejection with retry**
  - **Validates: Requirements 2.6**

- [ ] 10.5 Write property test for login rate limiting
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

- [ ] 11.3 Write property test for main menu display
  - **Property 9: Main menu display after login**
  - **Validates: Requirements 3.1**

- [ ] 11.4 Write property test for submenu navigation
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

- [ ] 13.4 Write property test for AI provider initialization
  - **Property 42: AI provider initialization**
  - **Validates: Requirements 11.1**

- [ ] 13.5 Write property test for AI interface consistency
  - **Property 43: AI interface consistency**
  - **Validates: Requirements 11.2**

- [ ] 13.6 Write property test for AI error handling
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

- [ ] 14.4 Write property test for AI welcome generation
  - **Property 17: AI welcome generation for new users**
  - **Validates: Requirements 5.1**

- [ ] 14.5 Write property test for AI greeting generation
  - **Property 18: AI greeting for returning users**
  - **Validates: Requirements 5.2**

- [ ] 14.6 Write property test for AI response time
  - **Property 19: AI SysOp response time**
  - **Validates: Requirements 5.3**

- [ ] 14.7 Write property test for AI ANSI formatting
  - **Property 20: AI message ANSI formatting**
  - **Validates: Requirements 5.4**

- [ ] 14.8 Write property test for AI response length
  - **Property 21: AI response length constraint**
  - **Validates: Requirements 5.5**

- [ ] 15. Create basic control panel
- [x] 15.1 Set up React control panel application
  - Initialize React app with Vite
  - Set up Tailwind CSS for styling
  - Create basic layout with navigation
  - _Requirements: 8.1_

- [ ] 15.2 Implement REST API for control panel
  - Create API endpoints for dashboard, users, message bases
  - Implement authentication for SysOp access
  - Add CORS configuration for local development
  - _Requirements: 8.1_

- [ ] 15.3 Create dashboard page
  - Display current callers and active sessions
  - Show recent activity log
  - Display system status (uptime, node usage)
  - _Requirements: 8.1, 8.2_

- [ ] 15.4 Write property test for dashboard information
  - **Property 29: Dashboard real-time information**
  - **Validates: Requirements 8.2**

- [ ] 16. Implement AI Configuration Assistant
- [ ] 16.1 Create AIConfigAssistant class
  - Implement configuration tools (update BBS settings, AI SysOp, message bases)
  - Use AI with function calling to interpret natural language requests
  - Generate previews of proposed changes
  - _Requirements: 6.2, 6.3_

- [ ] 16.2 Add chat interface to control panel
  - Create AIChat component in React
  - Connect to AI Configuration Assistant via API
  - Display conversation history
  - Show previews of proposed changes
  - Allow confirmation/rejection of changes
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 16.3 Implement configuration persistence
  - Update config.yaml when changes are confirmed
  - Apply changes without restart where possible
  - Provide confirmation feedback
  - _Requirements: 6.4, 6.5_

- [ ] 16.4 Write property test for AI configuration interpretation
  - **Property 22: AI configuration interpretation**
  - **Validates: Requirements 6.2**

- [ ] 16.5 Write property test for configuration preview
  - **Property 23: Configuration change preview**
  - **Validates: Requirements 6.3**

- [ ] 16.6 Write property test for configuration persistence
  - **Property 24: Configuration persistence**
  - **Validates: Requirements 6.4**

- [ ] 17. Checkpoint - Verify Milestone 3
  - Ensure all tests pass, ask the user if questions arise.

## Milestone 4: Door Game (The Oracle)

- [ ] 18. Implement door game framework
- [ ] 18.1 Create Door interface and DoorHandler
  - Define Door interface with enter, processInput, exit methods
  - Implement DoorHandler to manage door game lifecycle
  - Add door game menu to main menu
  - Track door session state
  - _Requirements: 7.1_

- [ ] 18.2 Create door session management
  - Store door game state in session
  - Persist door sessions to database for resumption
  - Handle door exit and return to menu
  - _Requirements: 7.5_

- [ ] 18.3 Write property test for door exit navigation
  - **Property 28: Door exit navigation**
  - **Validates: Requirements 7.5**

- [ ] 19. Implement The Oracle door game
- [ ] 19.1 Create OracleDoor class
  - Implement Door interface for The Oracle
  - Create atmospheric introduction screen
  - Handle question input from user
  - _Requirements: 7.2_

- [ ] 19.2 Integrate AI for Oracle responses
  - Create Oracle system prompt with mystical personality
  - Generate responses using AI provider
  - Format responses with mystical symbols and dramatic pauses
  - Enforce 150 character limit
  - _Requirements: 7.3, 7.4_

- [ ] 19.3 Add Oracle to door games menu
  - Register Oracle door with DoorHandler
  - Display in door games list
  - Handle entry and exit
  - _Requirements: 7.1, 7.5_

- [ ] 19.4 Write property test for Oracle response style
  - **Property 26: Oracle response style**
  - **Validates: Requirements 7.3**

- [ ] 19.5 Write property test for Oracle response length
  - **Property 27: Oracle response length**
  - **Validates: Requirements 7.4**

- [ ] 20. Add AI request rate limiting
- [ ] 20.1 Implement rate limiter for door games
  - Track AI requests per user per minute
  - Limit to 10 requests per minute
  - Display rate limit message when exceeded
  - _Requirements: 15.3_

- [ ] 20.2 Write property test for AI request rate limiting
  - **Property 57: AI request rate limiting**
  - **Validates: Requirements 15.3**

- [ ] 21. Checkpoint - Verify Milestone 4
  - Ensure all tests pass, ask the user if questions arise.

## Milestone 5: Polish & Message Bases

- [ ] 22. Implement message base system
- [ ] 22.1 Create message repositories
  - Implement MessageBaseRepository for message base CRUD
  - Implement MessageRepository for message CRUD
  - Add methods for listing, reading, and posting messages
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 22.2 Create MessageHandler
  - Implement message base listing
  - Implement message reading with chronological ordering
  - Implement message posting with subject and body
  - Display messages with subject, author, timestamp
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 22.3 Add message persistence and visibility
  - Store messages in database with user and message base references
  - Make messages visible to all users with appropriate access
  - _Requirements: 4.5_

- [ ] 22.4 Write property test for message base list display
  - **Property 13: Message base list display**
  - **Validates: Requirements 4.1**

- [ ] 22.5 Write property test for message chronological ordering
  - **Property 15: Message chronological ordering**
  - **Validates: Requirements 4.3**

- [ ] 22.6 Write property test for message posting persistence
  - **Property 16: Message posting persistence**
  - **Validates: Requirements 4.4, 4.5**

- [ ] 23. Add message posting rate limiting
- [ ] 23.1 Implement rate limiter for messages
  - Track messages posted per user per hour
  - Limit to 30 messages per hour
  - Display rate limit message when exceeded
  - _Requirements: 15.2_

- [ ] 23.2 Write property test for message rate limiting
  - **Property 56: Message posting rate limiting**
  - **Validates: Requirements 15.2**

- [ ] 24. Complete control panel features
- [ ] 24.1 Implement Users management page
  - Display list of registered users
  - Show handle, access level, registration date
  - Add ability to edit access levels
  - _Requirements: 8.3_

- [ ] 24.2 Implement Message Bases management page
  - Display list of message bases
  - Add creation, editing, and deletion functionality
  - Configure access levels for read/write
  - _Requirements: 8.4_

- [ ] 24.3 Implement AI Settings page
  - Display current AI configuration
  - Provide access to AI Configuration Assistant
  - Show AI provider and model information
  - _Requirements: 8.5_

- [ ] 24.4 Write property test for user list display
  - **Property 30: User list display**
  - **Validates: Requirements 8.3**

- [ ] 24.5 Write property test for message base CRUD
  - **Property 31: Message base CRUD operations**
  - **Validates: Requirements 8.4**

- [ ] 25. Add input sanitization and security
- [ ] 25.1 Implement input sanitization
  - Sanitize all user input to prevent injection attacks
  - Escape ANSI sequences in user-generated content
  - Validate input lengths and formats
  - _Requirements: 15.4_

- [ ] 25.2 Write property test for input sanitization
  - **Property 58: Input sanitization**
  - **Validates: Requirements 15.4**

- [ ] 26. Implement graceful shutdown and offline handling
- [ ] 26.1 Add graceful shutdown
  - Disconnect all active sessions with goodbye message
  - Close database connections
  - Log shutdown event
  - _Requirements: 14.5_

- [ ] 26.2 Add offline message for connection attempts
  - Display offline message when server is not running
  - Include information about when BBS might return
  - _Requirements: 14.1, 14.4_

- [ ] 26.3 Add reconnection support
  - Allow callers to reconnect after server restart
  - Restore session state where possible
  - _Requirements: 14.3_

- [ ] 26.4 Write property test for graceful shutdown
  - **Property 54: Graceful shutdown**
  - **Validates: Requirements 14.5**

- [ ] 27. UI polish and refinements
- [ ] 27.1 Refine ANSI templates
  - Create additional ANSI templates (goodbye, menus)
  - Ensure consistent visual style
  - Test rendering in terminal client
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 27.2 Add loading states and feedback
  - Show loading indicators for AI requests
  - Provide feedback for long-running operations
  - Improve error messages
  - _Requirements: All_

- [ ] 27.3 Test multi-user scenarios
  - Verify concurrent user access
  - Test session isolation
  - Verify message visibility across users
  - _Requirements: 10.2, 4.5_

- [ ] 28. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all MVP requirements are met
  - Test complete user flows end-to-end
  - Prepare demo scenarios

## Post-MVP Enhancements (P1 - Nice to Have)

- [ ] 29. Add Phantom Quest text adventure door game
  - Implement more complex AI door game with state tracking
  - Add inventory, health, and location management
  - Create multi-room adventure with puzzles
  - _Requirements: Future enhancement_

- [ ] 30. Implement Telnet server
  - Add Telnet protocol support using connection abstraction
  - Test with classic BBS terminal clients
  - _Requirements: Future enhancement_

- [ ] 31. Add sound effects to web terminal
  - Implement modem connection sound
  - Add notification sounds for messages
  - Add door entry sound effects
  - _Requirements: Future enhancement_

- [ ] 32. Implement AI moderation for message bases
  - Add AI-based content moderation
  - Flag inappropriate content
  - Provide moderation dashboard for SysOp
  - _Requirements: Future enhancement_
