# Requirements Document

## Introduction

BaudAgain is an AI-enhanced Bulletin Board System (BBS) that resurrects the intimate, decentralized communities of the dial-up era with modern AI capabilities. The system enables anyone to host their own BBS as a simple web service on their desktop, featuring AI-powered system operators, dynamic door games, and classic message bases. The project emphasizes incremental deliverability, ensuring the system is runnable and demoable at each development milestone.

## Glossary

- **BBS**: Bulletin Board System - A single bulletin board instance hosted by one person
- **SysOp**: System Operator - The person who runs and manages the BBS
- **AI SysOp**: An AI agent that assists or automates BBS management tasks
- **Caller**: A user connecting to a BBS (nostalgic terminology from dial-up era)
- **Handle**: Username or pseudonym used by a caller
- **Door Game**: An external program or game launched from within the BBS
- **Message Base**: A forum or discussion area within the BBS
- **Node**: A connection slot for a user session
- **ANSI**: Text-based graphics using escape codes for color and positioning
- **WebSocket**: A protocol providing full-duplex communication channels over TCP
- **Session**: An active connection between a caller and the BBS
- **Terminal Client**: The web-based interface that callers use to connect to the BBS
- **Control Panel**: The web-based administrative interface for the SysOp

## Requirements

### Requirement 1: Basic BBS Connectivity

**User Story:** As a caller, I want to connect to a BBS through my web browser, so that I can access the system without installing special software.

#### Acceptance Criteria

1. WHEN a caller navigates to the BBS URL in a web browser THEN the System SHALL establish a WebSocket connection to the BBS server
2. WHEN the WebSocket connection is established THEN the System SHALL display an ANSI-formatted welcome screen to the caller
3. WHEN the caller types input in the terminal THEN the System SHALL transmit the input to the server via WebSocket
4. WHEN the server sends output THEN the System SHALL render the ANSI-formatted text in the terminal display
5. WHEN the connection is lost THEN the System SHALL display a disconnection message and provide a reconnection option

### Requirement 2: User Registration and Authentication

**User Story:** As a caller, I want to create an account and log in to the BBS, so that I can have a persistent identity and access personalized features.

#### Acceptance Criteria

1. WHEN a new caller connects THEN the System SHALL prompt for a handle or offer a NEW registration option
2. WHEN a caller types NEW THEN the System SHALL initiate the registration flow requesting handle, password, and optional profile information
3. WHEN a caller submits a handle during registration THEN the System SHALL verify the handle is unique and between 3-20 characters
4. WHEN a caller submits a password during registration THEN the System SHALL hash the password using bcrypt and store it securely
5. WHEN a registered caller enters valid credentials THEN the System SHALL authenticate the caller and display their last login date and new message count
6. WHEN a caller enters invalid credentials THEN the System SHALL reject the login and allow retry up to 5 attempts per session

### Requirement 3: Main Menu Navigation

**User Story:** As a caller, I want to navigate through a main menu system, so that I can access different areas of the BBS.

#### Acceptance Criteria

1. WHEN a caller successfully logs in THEN the System SHALL display the main menu with available options
2. WHEN the main menu is displayed THEN the System SHALL show options for Message Bases, Door Games, User List, Page SysOp, Profile, and Goodbye
3. WHEN a caller enters a valid menu command THEN the System SHALL navigate to the corresponding section
4. WHEN a caller enters an invalid command THEN the System SHALL display an error message and re-display the menu
5. WHEN a caller is in any submenu THEN the System SHALL provide a way to return to the main menu

### Requirement 4: Message Base System

**User Story:** As a caller, I want to read and post messages in discussion forums, so that I can participate in community conversations.

#### Acceptance Criteria

1. WHEN a caller selects the Message Bases option THEN the System SHALL display a list of available message bases with descriptions
2. WHEN a caller enters a message base THEN the System SHALL display options to read messages, post new messages, or scan for new content
3. WHEN a caller chooses to read messages THEN the System SHALL display messages in chronological order with subject, author, and timestamp
4. WHEN a caller chooses to post a message THEN the System SHALL prompt for subject and body, then store the message with the caller's handle and timestamp
5. WHEN a message is posted THEN the System SHALL persist the message to the database and make it visible to all callers with appropriate access

### Requirement 5: AI SysOp Welcome and Assistance

**User Story:** As a caller, I want to be welcomed by an AI SysOp and receive help when needed, so that I feel guided and supported while using the BBS.

#### Acceptance Criteria

1. WHEN a new caller completes registration THEN the AI SysOp SHALL generate a personalized welcome message reflecting the BBS theme and personality
2. WHEN a returning caller logs in THEN the AI SysOp SHALL generate a greeting acknowledging their return
3. WHEN a caller pages the SysOp THEN the AI SysOp SHALL respond within 5 seconds with contextually appropriate assistance
4. WHEN the AI SysOp generates a message THEN the System SHALL include ANSI color codes for visual emphasis
5. WHEN the AI SysOp responds THEN the System SHALL keep responses under 500 characters for readability

### Requirement 6: AI Configuration Assistant

**User Story:** As a SysOp, I want to configure my BBS by conversing with an AI assistant, so that I can customize the system without editing configuration files manually.

#### Acceptance Criteria

1. WHEN a SysOp accesses the control panel THEN the System SHALL provide a chat interface for AI-assisted configuration
2. WHEN a SysOp describes desired changes in natural language THEN the AI Assistant SHALL interpret the request and propose specific configuration changes
3. WHEN the AI Assistant proposes changes THEN the System SHALL display a preview of the changes before applying them
4. WHEN a SysOp confirms proposed changes THEN the System SHALL update the configuration file and apply changes without requiring a restart where possible
5. WHEN configuration changes are applied THEN the System SHALL provide confirmation and show the updated settings

### Requirement 7: The Oracle Door Game

**User Story:** As a caller, I want to play The Oracle door game, so that I can interact with an AI fortune teller for entertainment and advice.

#### Acceptance Criteria

1. WHEN a caller selects Door Games from the main menu THEN the System SHALL display a list of available door games including The Oracle
2. WHEN a caller enters The Oracle door game THEN the System SHALL display an atmospheric introduction and prompt for a question
3. WHEN a caller asks The Oracle a question THEN the AI SHALL respond in a cryptic, mystical tone with mystical symbols and dramatic pauses
4. WHEN The Oracle generates a response THEN the System SHALL keep responses under 150 characters
5. WHEN a caller exits The Oracle THEN the System SHALL return the caller to the door games menu

### Requirement 8: SysOp Control Panel

**User Story:** As a SysOp, I want to access a web-based control panel, so that I can monitor activity and manage my BBS.

#### Acceptance Criteria

1. WHEN a SysOp navigates to the control panel URL THEN the System SHALL display a dashboard with current callers, recent activity, and system status
2. WHEN the dashboard is displayed THEN the System SHALL show real-time information about active sessions and node usage
3. WHEN a SysOp accesses the Users section THEN the System SHALL display a list of registered users with handles, access levels, and registration dates
4. WHEN a SysOp accesses the Message Bases section THEN the System SHALL allow creation, editing, and deletion of message bases
5. WHEN a SysOp accesses the AI Settings section THEN the System SHALL display current AI configuration and provide access to the AI Configuration Assistant

### Requirement 9: Data Persistence

**User Story:** As a SysOp, I want all user data, messages, and configuration to be persisted, so that the BBS maintains state across restarts.

#### Acceptance Criteria

1. WHEN the BBS server starts THEN the System SHALL initialize or connect to a SQLite database
2. WHEN a user registers THEN the System SHALL persist user data to the users table with hashed password
3. WHEN a message is posted THEN the System SHALL persist the message to the messages table with references to the user and message base
4. WHEN configuration changes are made THEN the System SHALL persist changes to the config.yaml file
5. WHEN the server restarts THEN the System SHALL restore all user accounts, messages, and configuration from persistent storage

### Requirement 10: Session Management

**User Story:** As a caller, I want my session to be managed properly, so that I have a consistent experience and the system handles multiple users correctly.

#### Acceptance Criteria

1. WHEN a caller connects THEN the System SHALL allocate a node and create a session with a unique identifier
2. WHEN multiple callers connect simultaneously THEN the System SHALL manage separate sessions for each caller without interference
3. WHEN a caller is inactive for 60 minutes THEN the System SHALL terminate the session and disconnect the caller
4. WHEN a caller disconnects THEN the System SHALL clean up the session and free the allocated node
5. WHEN a session is active THEN the System SHALL track the caller's current location within the BBS menu structure

### Requirement 11: AI Provider Abstraction

**User Story:** As a developer, I want the AI integration to use an abstraction layer, so that different AI providers can be supported in the future.

#### Acceptance Criteria

1. WHEN the System initializes AI capabilities THEN the System SHALL load the AI provider based on configuration settings
2. WHEN AI functionality is invoked THEN the System SHALL use a common interface regardless of the underlying provider
3. WHEN the AI provider is Claude/Anthropic THEN the System SHALL use the Anthropic SDK for API calls
4. WHEN an AI request fails THEN the System SHALL handle errors gracefully and provide fallback responses
5. WHEN the configuration specifies a different provider THEN the System SHALL support switching providers without code changes to core BBS logic

### Requirement 12: Connection Protocol Abstraction

**User Story:** As a developer, I want the connection handling to be abstracted, so that additional protocols like Telnet or SSH can be added in the future.

#### Acceptance Criteria

1. WHEN the System handles incoming connections THEN the System SHALL use a connection abstraction layer
2. WHEN a WebSocket connection is established THEN the System SHALL wrap it in the common connection interface
3. WHEN the connection interface receives input THEN the System SHALL normalize the input format for the BBS core logic
4. WHEN the BBS core sends output THEN the System SHALL format the output appropriately for the connection type
5. WHEN a new protocol is added THEN the System SHALL implement the connection interface without modifying BBS core logic

### Requirement 13: ANSI Rendering

**User Story:** As a caller, I want to see properly formatted ANSI art and colored text, so that I can experience the authentic BBS aesthetic.

#### Acceptance Criteria

1. WHEN the System sends ANSI-formatted text THEN the Terminal Client SHALL interpret ANSI escape codes for colors and formatting
2. WHEN ANSI art is displayed THEN the Terminal Client SHALL render box-drawing characters correctly using CP437 encoding
3. WHEN color codes are used THEN the Terminal Client SHALL support both standard and bright color variants
4. WHEN the welcome screen is displayed THEN the System SHALL use template-based ANSI art with variable substitution
5. WHEN ANSI content exceeds terminal dimensions THEN the Terminal Client SHALL handle scrolling appropriately

### Requirement 14: Graceful Offline Handling

**User Story:** As a caller, I want to see a clear message when the BBS is offline, so that I understand the system is temporarily unavailable.

#### Acceptance Criteria

1. WHEN the BBS server is not running THEN the System SHALL display an "offline" message to callers attempting to connect
2. WHEN the server becomes unavailable during a session THEN the System SHALL detect the disconnection and inform the caller
3. WHEN the server comes back online THEN the System SHALL allow callers to reconnect without data loss
4. WHEN the offline message is displayed THEN the System SHALL include information about when the BBS might return
5. WHEN the SysOp stops the server THEN the System SHALL gracefully disconnect all active sessions with a goodbye message

### Requirement 15: Rate Limiting and Security

**User Story:** As a SysOp, I want basic security measures in place, so that the BBS is protected from abuse and malicious activity.

#### Acceptance Criteria

1. WHEN a caller attempts to log in THEN the System SHALL limit login attempts to 5 per session
2. WHEN a caller posts messages THEN the System SHALL limit message posting to 30 messages per hour per user
3. WHEN a caller makes AI requests THEN the System SHALL limit AI door game requests to 10 per minute per user
4. WHEN user input is received THEN the System SHALL sanitize input to prevent injection attacks
5. WHEN passwords are stored THEN the System SHALL use bcrypt with a cost factor of 10 for hashing
