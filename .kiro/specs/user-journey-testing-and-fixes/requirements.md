# Requirements Document

## Introduction

This specification addresses critical bugs and missing features discovered during manual testing of the BaudAgain BBS system. The system currently has several broken user journeys including registration, login, message viewing, and ANSI art rendering. Additionally, newly developed AI features (conversation starters, catch-me-up summaries, daily digests) are not integrated into the user experience.

## Glossary

- **BBS System**: The BaudAgain Bulletin Board System, a web-based terminal emulator
- **ANSI Art**: ASCII art with color codes and formatting used for terminal graphics
- **Frame**: A bordered container for displaying content in the terminal
- **Message Base**: A forum or board where users can post and read messages
- **Door Game**: An interactive game or application accessible from the BBS menu
- **AI Features**: Conversation starters, message summaries, and daily digest functionality
- **Terminal Client**: The web-based interface that users interact with
- **Handle**: A user's username or display name in the BBS

## Requirements

### Requirement 1

**User Story:** As a new user, I want to see a properly formatted welcome screen when I visit the BBS, so that I can understand how to register or login.

#### Acceptance Criteria

1. WHEN a user visits the BBS URL THEN the Terminal Client SHALL display a single welcome frame with proper borders
2. WHEN the welcome screen is rendered THEN the Terminal Client SHALL display exactly one "Enter your handle" prompt
3. WHEN ANSI art is displayed in the welcome frame THEN the Terminal Client SHALL enforce maximum line width of 80 characters
4. WHEN the welcome frame is rendered THEN the Terminal Client SHALL properly align all frame borders
5. WHEN the welcome screen loads THEN the Terminal Client SHALL display the node information footer correctly

### Requirement 2

**User Story:** As a new user, I want to register an account with a handle and password, so that I can access the BBS features.

#### Acceptance Criteria

1. WHEN a user types "NEW" at the welcome prompt THEN the Terminal Client SHALL initiate the registration flow
2. WHEN the registration flow starts THEN the Terminal Client SHALL prompt for a handle with proper formatting
3. WHEN a user enters a valid handle THEN the Terminal Client SHALL prompt for a password
4. WHEN a user enters a valid password THEN the Terminal Client SHALL create the account and log the user in
5. WHEN registration completes THEN the Terminal Client SHALL display the main menu

### Requirement 3

**User Story:** As a registered user, I want to login with my handle and password, so that I can access my account and BBS features.

#### Acceptance Criteria

1. WHEN a user enters their handle at the welcome prompt THEN the Terminal Client SHALL prompt for their password
2. WHEN a user enters the correct password THEN the Terminal Client SHALL authenticate the user
3. WHEN authentication succeeds THEN the Terminal Client SHALL display the main menu
4. WHEN authentication fails THEN the Terminal Client SHALL display an error message and re-prompt
5. WHEN a user logs in THEN the Terminal Client SHALL display a personalized greeting with their handle

### Requirement 4

**User Story:** As a logged-in user, I want to navigate to the Messages section and see available message bases, so that I can read and post messages.

#### Acceptance Criteria

1. WHEN a user selects Messages from the main menu THEN the Terminal Client SHALL display a list of available message bases
2. WHEN message bases are displayed THEN the Terminal Client SHALL show the name and description of each base
3. WHEN a user selects a message base THEN the Terminal Client SHALL display a list of messages in that base
4. WHEN messages are listed THEN the Terminal Client SHALL display message subject, author handle, and date
5. WHEN a message list is displayed THEN the Terminal Client SHALL show the correct author handle for each message

### Requirement 5

**User Story:** As a logged-in user, I want to read the full content of a message, so that I can see what other users have posted.

#### Acceptance Criteria

1. WHEN a user selects a message from the list THEN the Terminal Client SHALL display the full message body
2. WHEN a message is displayed THEN the Terminal Client SHALL show the subject, author handle, date, and body text
3. WHEN the message body is rendered THEN the Terminal Client SHALL properly format the text within frame boundaries
4. WHEN a message is displayed THEN the Terminal Client SHALL show navigation options to return or read other messages
5. WHEN the author handle is displayed THEN the Terminal Client SHALL show the actual username instead of "undefined"

### Requirement 6

**User Story:** As a logged-in user, I want to post a new message to a message base, so that I can participate in discussions.

#### Acceptance Criteria

1. WHEN a user is viewing a message base THEN the Terminal Client SHALL provide an option to post a new message
2. WHEN a user selects to post a message THEN the Terminal Client SHALL prompt for a subject
3. WHEN a user enters a subject THEN the Terminal Client SHALL prompt for the message body
4. WHEN a user completes the message THEN the Terminal Client SHALL save the message with the correct author handle
5. WHEN a message is posted THEN the Terminal Client SHALL display a confirmation and return to the message list

### Requirement 7

**User Story:** As a logged-in user, I want to access door games with properly rendered ANSI graphics, so that I can enjoy the visual experience.

#### Acceptance Criteria

1. WHEN a user selects Doors from the main menu THEN the Terminal Client SHALL display a list of available door games
2. WHEN a user selects a door game THEN the Terminal Client SHALL launch the game with proper ANSI rendering
3. WHEN ANSI art is displayed in a door game THEN the Terminal Client SHALL enforce maximum line width of 80 characters
4. WHEN ANSI art contains color codes THEN the Terminal Client SHALL render colors correctly
5. WHEN ANSI frames are displayed THEN the Terminal Client SHALL properly align all borders and content

### Requirement 8

**User Story:** As a logged-in user, I want to see AI-generated conversation starters when viewing message bases, so that I can discover interesting discussion topics.

#### Acceptance Criteria

1. WHEN a user views a message base THEN the Terminal Client SHALL display AI-generated conversation starters
2. WHEN conversation starters are displayed THEN the Terminal Client SHALL show relevant topics based on recent messages
3. WHEN a user selects a conversation starter THEN the Terminal Client SHALL initiate a new message with that topic
4. WHEN no conversation starters are available THEN the Terminal Client SHALL display a helpful message
5. WHEN conversation starters are generated THEN the Terminal Client SHALL cache them for performance

### Requirement 9

**User Story:** As a logged-in user, I want to request a "catch me up" summary of messages I haven't read, so that I can quickly understand what I've missed.

#### Acceptance Criteria

1. WHEN a user views a message base THEN the Terminal Client SHALL provide a "catch me up" option
2. WHEN a user selects "catch me up" THEN the Terminal Client SHALL generate a summary of unread messages
3. WHEN the summary is generated THEN the Terminal Client SHALL display key topics and highlights
4. WHEN the summary is displayed THEN the Terminal Client SHALL properly format the text within frame boundaries
5. WHEN no unread messages exist THEN the Terminal Client SHALL display an appropriate message

### Requirement 10

**User Story:** As a logged-in user, I want to receive a daily digest of BBS activity, so that I can stay informed about discussions and events.

#### Acceptance Criteria

1. WHEN a user logs in THEN the Terminal Client SHALL check for available daily digests
2. WHEN a daily digest is available THEN the Terminal Client SHALL display a notification
3. WHEN a user requests the daily digest THEN the Terminal Client SHALL display the digest content
4. WHEN the digest is displayed THEN the Terminal Client SHALL show summaries of active discussions and new content
5. WHEN the digest is rendered THEN the Terminal Client SHALL properly format the text within frame boundaries

### Requirement 11

**User Story:** As a system developer, I want comprehensive MCP-based browser tests for the complete user journey, so that I can verify all functionality works correctly.

#### Acceptance Criteria

1. WHEN the test suite runs THEN the BBS System SHALL execute tests for registration, login, and navigation
2. WHEN browser tests execute THEN the BBS System SHALL verify ANSI rendering correctness
3. WHEN message functionality is tested THEN the BBS System SHALL verify message creation, listing, and reading
4. WHEN door games are tested THEN the BBS System SHALL verify proper ANSI art rendering
5. WHEN AI features are tested THEN the BBS System SHALL verify conversation starters, summaries, and digests are accessible

### Requirement 12

**User Story:** As a system developer, I want all ANSI rendering to respect the 80-character line width limit, so that content displays correctly in the terminal.

#### Acceptance Criteria

1. WHEN any ANSI content is rendered THEN the Terminal Client SHALL enforce a maximum line width of 80 characters
2. WHEN content exceeds 80 characters THEN the Terminal Client SHALL truncate or wrap the content appropriately
3. WHEN frames are rendered THEN the Terminal Client SHALL ensure borders fit within the 80-character limit
4. WHEN ANSI art is displayed THEN the Terminal Client SHALL preserve the visual appearance while respecting width limits
5. WHEN width enforcement is applied THEN the Terminal Client SHALL maintain proper alignment and formatting
