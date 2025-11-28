# Design Document

## Overview

BaudAgain is an AI-enhanced Bulletin Board System that combines nostalgic BBS aesthetics with modern AI capabilities. The system consists of three main components: a Node.js/TypeScript backend server, a web-based terminal client for callers, and a web-based control panel for SysOps. The architecture emphasizes incremental deliverability, with each milestone producing a runnable system.

The design prioritizes simplicity for the MVP while maintaining extensibility through abstraction layers for AI providers and connection protocols. All components run as a single web service on localhost, making development and debugging straightforward.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CALLER BROWSERS                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Terminal Client │         │  Terminal Client │         │
│  │   (WebSocket)    │         │   (WebSocket)    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BBS SERVER (Node.js)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Connection Manager                        │  │
│  │  • WebSocket handler                                   │  │
│  │  • Session management                                  │  │
│  │  • Protocol abstraction                                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              BBS Core Engine                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │  │
│  │  │  Auth   │  │  Menu   │  │ Message │  │  Door   │  │  │
│  │  │ Handler │  │ Handler │  │ Handler │  │ Handler │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              AI Layer                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  AI SysOp    │  │ AI Config    │  │  AI Door   │  │  │
│  │  │   Agent      │  │  Assistant   │  │   Engine   │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │         AI Provider Abstraction                   │ │  │
│  │  │  (Anthropic SDK / Future: OpenAI, Ollama)        │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Data Layer                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   SQLite     │  │  File System │  │   Config   │  │  │
│  │  │   Database   │  │  (ANSI art)  │  │   (YAML)   │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              REST API (for Control Panel)              │  │
│  │  • Dashboard endpoints                                 │  │
│  │  • User management                                     │  │
│  │  • Configuration endpoints                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SYSOP BROWSER                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Control Panel (React)                     │  │
│  │  • Dashboard                                           │  │
│  │  • User management                                     │  │
│  │  • AI Configuration Assistant                          │  │
│  │  • Message base management                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Incremental Architecture Evolution

**Milestone 1: Hello BBS**
- WebSocket server with basic echo
- Static ANSI welcome screen
- Simple terminal client
- No database, no AI

**Milestone 2: User System**
- Add SQLite database
- User registration/login
- Session management
- Menu navigation

**Milestone 3: AI Integration**
- AI provider abstraction
- AI SysOp for welcomes
- AI Configuration Assistant
- Control panel foundation

**Milestone 4: Door Game**
- Door game framework
- The Oracle implementation
- Game state management

**Milestone 5: Polish**
- Message base system
- Full control panel
- UI refinements

## Components and Interfaces

### Connection Manager

**Responsibility**: Handle incoming connections, manage sessions, provide protocol abstraction.

```typescript
interface IConnection {
  id: string;
  send(data: string): Promise<void>;
  close(): Promise<void>;
  onData(callback: (data: string) => void): void;
  onClose(callback: () => void): void;
}

class WebSocketConnection implements IConnection {
  constructor(private ws: WebSocket) {}
  // Implementation for WebSocket
}

class ConnectionManager {
  private connections: Map<string, IConnection>;
  private sessions: Map<string, Session>;
  
  handleConnection(connection: IConnection): void;
  getSession(connectionId: string): Session | undefined;
  closeSession(sessionId: string): void;
}
```

### Session Manager

**Responsibility**: Track user sessions, maintain state, handle timeouts.

```typescript
interface Session {
  id: string;
  connectionId: string;
  userId?: string;
  handle?: string;
  state: SessionState;
  currentMenu: string;
  lastActivity: Date;
  data: Record<string, any>; // For door games, etc.
}

enum SessionState {
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  IN_MENU = 'in_menu',
  IN_DOOR = 'in_door',
  DISCONNECTED = 'disconnected'
}

class SessionManager {
  createSession(connectionId: string): Session;
  getSession(sessionId: string): Session | undefined;
  updateSession(sessionId: string, updates: Partial<Session>): void;
  cleanupInactiveSessions(): void;
}
```

### BBS Core Engine

**Responsibility**: Route commands to appropriate handlers, manage menu flow.

```typescript
interface CommandHandler {
  canHandle(command: string, session: Session): boolean;
  handle(command: string, session: Session): Promise<string>;
}

class BBSCore {
  private handlers: CommandHandler[];
  
  constructor(
    private sessionManager: SessionManager,
    private authHandler: AuthHandler,
    private menuHandler: MenuHandler,
    private messageHandler: MessageHandler,
    private doorHandler: DoorHandler
  ) {}
  
  async processInput(sessionId: string, input: string): Promise<string>;
}
```

### Authentication Handler

**Responsibility**: Handle user registration and login.

```typescript
class AuthHandler implements CommandHandler {
  constructor(
    private userRepository: UserRepository,
    private aiSysOp: AISysOp
  ) {}
  
  async handleRegistration(handle: string, password: string, session: Session): Promise<string>;
  async handleLogin(handle: string, password: string, session: Session): Promise<string>;
  async validateHandle(handle: string): Promise<boolean>;
}
```

### Menu Handler

**Responsibility**: Display menus and route menu selections.

```typescript
class MenuHandler implements CommandHandler {
  private menus: Map<string, Menu>;
  
  async displayMainMenu(session: Session): Promise<string>;
  async handleMenuCommand(command: string, session: Session): Promise<string>;
}

interface Menu {
  id: string;
  title: string;
  options: MenuOption[];
  render(session: Session): string;
}

interface MenuOption {
  key: string;
  label: string;
  description: string;
  handler: string; // Which handler to invoke
  accessLevel?: number;
}
```

### Message Handler

**Responsibility**: Manage message bases and message operations.

```typescript
class MessageHandler implements CommandHandler {
  constructor(
    private messageRepository: MessageRepository,
    private messageBaseRepository: MessageBaseRepository
  ) {}
  
  async listMessageBases(session: Session): Promise<string>;
  async readMessages(baseId: string, session: Session): Promise<string>;
  async postMessage(baseId: string, subject: string, body: string, session: Session): Promise<string>;
  async scanForNew(session: Session): Promise<string>;
}
```

### Door Handler

**Responsibility**: Launch and manage door games.

```typescript
class DoorHandler implements CommandHandler {
  private doors: Map<string, Door>;
  
  async listDoors(session: Session): Promise<string>;
  async enterDoor(doorId: string, session: Session): Promise<string>;
  async handleDoorInput(doorId: string, input: string, session: Session): Promise<string>;
  async exitDoor(session: Session): Promise<string>;
}

interface Door {
  id: string;
  name: string;
  description: string;
  minAccessLevel: number;
  
  enter(session: Session): Promise<string>;
  processInput(input: string, session: Session): Promise<DoorOutput>;
  exit(session: Session): Promise<void>;
}

interface DoorOutput {
  display: string;
  shouldExit: boolean;
  stateUpdate?: any;
}
```

### AI Provider Abstraction

**Responsibility**: Provide unified interface for different AI providers.

```typescript
interface AIProvider {
  generateCompletion(prompt: string, options?: AIOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: any, options?: AIOptions): Promise<T>;
}

interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

class AnthropicProvider implements AIProvider {
  constructor(private apiKey: string, private model: string) {}
  
  async generateCompletion(prompt: string, options?: AIOptions): Promise<string> {
    // Use @anthropic-ai/sdk
  }
}

class AIProviderFactory {
  static create(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.model);
      // Future: case 'openai', case 'ollama'
      default:
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }
  }
}
```

### AI SysOp Agent

**Responsibility**: Generate personalized messages and respond to pages.

```typescript
class AISysOp {
  constructor(
    private aiProvider: AIProvider,
    private config: AISysOpConfig
  ) {}
  
  async generateWelcome(handle: string, isNew: boolean): Promise<string> {
    const prompt = isNew 
      ? `Generate a welcome message for new user ${handle}`
      : `Generate a returning user greeting for ${handle}`;
    
    return this.aiProvider.generateCompletion(prompt, {
      systemPrompt: this.config.personality,
      maxTokens: 500,
      temperature: 0.8
    });
  }
  
  async respondToPage(handle: string, question?: string): Promise<string> {
    const prompt = question
      ? `User ${handle} asks: ${question}`
      : `User ${handle} paged you for help`;
    
    return this.aiProvider.generateCompletion(prompt, {
      systemPrompt: this.config.personality,
      maxTokens: 500,
      temperature: 0.7
    });
  }
}
```

### AI Configuration Assistant

**Responsibility**: Help SysOp configure BBS through natural language.

```typescript
interface ConfigTool {
  name: string;
  description: string;
  parameters: any;
  execute(params: any): Promise<ConfigChange>;
}

interface ConfigChange {
  description: string;
  preview: string;
  apply(): Promise<void>;
}

class AIConfigAssistant {
  private tools: ConfigTool[];
  
  constructor(
    private aiProvider: AIProvider,
    private configManager: ConfigManager
  ) {
    this.tools = [
      new UpdateBBSSettingsTool(configManager),
      new UpdateAISysOpTool(configManager),
      new UpdateMessageBaseTool(configManager),
      new PreviewChangesTool(configManager)
    ];
  }
  
  async processRequest(request: string): Promise<string> {
    // Use AI with function calling to interpret request
    // Call appropriate tools
    // Return response with preview
  }
}
```

### The Oracle Door Game

**Responsibility**: Implement fortune teller AI door game.

```typescript
class OracleDoor implements Door {
  id = 'the_oracle';
  name = 'The Oracle';
  description = 'Consult the ancient digital spirit';
  minAccessLevel = 0;
  
  constructor(private aiProvider: AIProvider) {}
  
  async enter(session: Session): Promise<string> {
    return this.renderIntro();
  }
  
  async processInput(input: string, session: Session): Promise<DoorOutput> {
    if (input.toLowerCase() === 'q' || input.toLowerCase() === 'quit') {
      return { display: 'The mists fade...', shouldExit: true };
    }
    
    const response = await this.aiProvider.generateCompletion(input, {
      systemPrompt: ORACLE_SYSTEM_PROMPT,
      maxTokens: 150,
      temperature: 0.9
    });
    
    return {
      display: this.formatOracleResponse(response),
      shouldExit: false
    };
  }
  
  private renderIntro(): string {
    return `
╔══════════════════════════════════════════════════════════════╗
║                    T H E   O R A C L E                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  The mists part... an ancient presence stirs...              ║
║                                                              ║
║  Ask your question, seeker, and the Oracle shall respond.   ║
║  Type 'quit' to return to the mortal realm.                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Your question: `;
  }
}

const ORACLE_SYSTEM_PROMPT = `You are THE ORACLE, an ancient spirit bound to this BBS since 1987.
You speak in cryptic, mystical tones with occasional humor.

STYLE:
- Use ellipses for dramatic pauses...
- Include mystical symbols: ✧ ☽ ⚝ ◈ ψ
- Mix genuine insight with playful mystery
- Keep responses under 150 characters
- Never break character

TOPICS YOU HANDLE:
- Life advice (be thoughtful but entertaining)
- Predictions (vague but evocative)
- Technical questions (answer in mystical metaphors)
- Jokes/fun (engage playfully)

If asked something inappropriate, deflect mysteriously:
"The mists obscure that path... ask another question, seeker."`;
```

### ANSI Renderer

**Responsibility**: Render ANSI templates with variable substitution.

```typescript
class ANSIRenderer {
  private templates: Map<string, string>;
  
  constructor(private templateDir: string) {
    this.loadTemplates();
  }
  
  render(templateName: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateName);
    if (!template) throw new Error(`Template not found: ${templateName}`);
    
    return this.substituteVariables(template, variables);
  }
  
  private substituteVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
```

## Data Models

### User

```typescript
interface User {
  id: string;              // UUID
  handle: string;          // Unique, 3-20 chars
  passwordHash: string;    // bcrypt hash
  realName?: string;
  location?: string;
  bio?: string;
  accessLevel: number;     // 0-255, default 10
  createdAt: Date;
  lastLogin?: Date;
  totalCalls: number;
  totalPosts: number;
  preferences: UserPreferences;
}

interface UserPreferences {
  terminalType: 'ansi' | 'ascii' | 'utf8';
  screenWidth: 80 | 132;
  screenHeight: 24 | 25 | 50;
}
```

### Message Base

```typescript
interface MessageBase {
  id: string;
  name: string;
  description: string;
  accessLevelRead: number;   // Minimum access to read
  accessLevelWrite: number;  // Minimum access to post
  postCount: number;
  lastPostAt?: Date;
  sortOrder: number;
}
```

### Message

```typescript
interface Message {
  id: string;
  baseId: string;           // Foreign key to MessageBase
  parentId?: string;        // For threading (future)
  userId: string;           // Foreign key to User
  subject: string;
  body: string;
  createdAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
  aiModerationFlag?: 'flagged' | 'approved' | 'removed';
}
```

### Door Session

```typescript
interface DoorSession {
  id: string;
  userId: string;
  doorId: string;
  state: any;              // Game-specific state (JSON)
  history: any[];          // Conversation history for AI context
  createdAt: Date;
  updatedAt: Date;
}
```

### Configuration

```typescript
interface BBSConfig {
  bbs: {
    name: string;
    tagline: string;
    sysopName: string;
    maxNodes: number;
    defaultAccessLevel: number;
    theme: string;
  };
  network: {
    websocketPort: number;
  };
  ai: {
    provider: 'anthropic' | 'openai' | 'ollama';
    model: string;
    apiKeyEnv: string;
    sysop: AISysOpConfig;
    doors: {
      enabled: boolean;
      maxTokensPerTurn: number;
    };
  };
  security: {
    passwordMinLength: number;
    maxLoginAttempts: number;
    sessionTimeoutMinutes: number;
    rateLimit: {
      messagesPerHour: number;
      doorRequestsPerMinute: number;
    };
  };
  appearance: {
    welcomeScreen: string;
    goodbyeScreen: string;
    menuTemplate: string;
  };
  messageBases: MessageBaseConfig[];
  doors: DoorConfig[];
}

interface AISysOpConfig {
  enabled: boolean;
  personality: string;
  welcomeNewUsers: boolean;
  participateInChat: boolean;
  chatFrequency: 'always' | 'occasional' | 'only_when_paged';
}
```

## Data Storage

### SQLite Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT,
    location TEXT,
    bio TEXT,
    access_level INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    total_calls INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    preferences TEXT DEFAULT '{}'  -- JSON
);

CREATE INDEX idx_users_handle ON users(handle);

-- Message bases
CREATE TABLE message_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    access_level_read INTEGER DEFAULT 0,
    access_level_write INTEGER DEFAULT 10,
    post_count INTEGER DEFAULT 0,
    last_post_at DATETIME,
    sort_order INTEGER DEFAULT 0
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    base_id TEXT NOT NULL,
    parent_id TEXT,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    is_deleted BOOLEAN DEFAULT 0,
    ai_moderation_flag TEXT,
    FOREIGN KEY (base_id) REFERENCES message_bases(id),
    FOREIGN KEY (parent_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_messages_base ON messages(base_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);

-- Door sessions
CREATE TABLE door_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    door_id TEXT NOT NULL,
    state TEXT NOT NULL,  -- JSON
    history TEXT DEFAULT '[]',  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_door_sessions_user ON door_sessions(user_id, door_id);

-- Activity log
CREATE TABLE activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_time ON activity_log(created_at DESC);
```

### File System Structure

```
baudagain/
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/
│   │   │   └── loader.ts
│   │   ├── connection/
│   │   │   ├── IConnection.ts
│   │   │   ├── WebSocketConnection.ts
│   │   │   └── ConnectionManager.ts
│   │   ├── session/
│   │   │   └── SessionManager.ts
│   │   ├── core/
│   │   │   ├── BBSCore.ts
│   │   │   └── CommandHandler.ts
│   │   ├── handlers/
│   │   │   ├── AuthHandler.ts
│   │   │   ├── MenuHandler.ts
│   │   │   ├── MessageHandler.ts
│   │   │   └── DoorHandler.ts
│   │   ├── terminal/
│   │   │   ├── WebTerminalRenderer.ts
│   │   │   └── ANSITerminalRenderer.ts
│   │   ├── ai/
│   │   │   ├── AIProvider.ts
│   │   │   ├── AnthropicProvider.ts
│   │   │   ├── AISysOp.ts
│   │   │   ├── AIConfigAssistant.ts
│   │   │   └── doors/
│   │   │       └── OracleDoor.ts
│   │   ├── db/
│   │   │   ├── Database.ts
│   │   │   ├── repositories/
│   │   │   │   ├── UserRepository.ts
│   │   │   │   ├── MessageRepository.ts
│   │   │   │   └── MessageBaseRepository.ts
│   │   │   └── schema.sql
│   │   ├── ansi/
│   │   │   └── ANSIRenderer.ts
│   │   └── api/
│   │       └── routes.ts
│   └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types.ts
│       │   ├── terminal.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       └── package.json
├── client/
│   ├── terminal/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── Terminal.ts
│   │   │   └── WebSocketClient.ts
│   │   └── public/
│   │       └── index.html
│   └── control-panel/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Users.tsx
│       │   │   ├── MessageBases.tsx
│       │   │   └── AISettings.tsx
│       │   └── components/
│       │       ├── AIChat.tsx
│       │       └── TerminalPreview.tsx
│       └── package.json
├── data/
│   ├── ansi/
│   │   ├── welcome.ans
│   │   ├── goodbye.ans
│   │   └── menu.ans
│   └── bbs.db
├── config.yaml
└── package.json
```

## Error Handling

### Connection Errors

- WebSocket disconnections: Clean up session, log activity
- Invalid input: Send error message, re-prompt
- Timeout: Disconnect gracefully with message

### Authentication Errors

- Invalid credentials: Increment attempt counter, allow retry
- Max attempts exceeded: Disconnect session
- Duplicate handle: Reject registration, prompt for different handle

### AI Errors

- API failure: Return fallback message, log error
- Rate limit exceeded: Queue request or return "busy" message
- Invalid response: Retry once, then fallback

### Database Errors

- Connection failure: Return error to user, attempt reconnection
- Constraint violation: Return user-friendly error
- Query timeout: Retry once, then fail gracefully

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components:

- **Repository tests**: Verify CRUD operations work correctly
- **Handler tests**: Test command routing and response generation
- **AI Provider tests**: Mock AI responses and verify formatting
- **ANSI Renderer tests**: Verify template substitution
- **Session Manager tests**: Test session lifecycle and cleanup

Testing framework: **Vitest**

### Property-Based Testing

Property-based tests will verify universal behaviors across many inputs:

- **Handle validation**: For any string, validation should correctly identify valid handles (3-20 chars, alphanumeric + underscore)
- **Password hashing**: For any password, hashing should be deterministic and verification should work
- **Session timeout**: For any session, if inactive for 60 minutes, it should be cleaned up
- **Rate limiting**: For any user, posting more than 30 messages per hour should be rejected
- **ANSI template substitution**: For any template and variables, all {{variable}} patterns should be replaced

Testing framework: **fast-check** (property-based testing library for TypeScript)

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the correctness property from this design document
- Use the format: `// Property X: [property description]`

### Integration Testing

- End-to-end flow: Connect → Register → Login → Navigate → Post Message
- AI integration: Verify AI responses are generated and formatted correctly
- WebSocket communication: Test bidirectional messaging

### Manual Testing Checklist

- Terminal rendering in different browsers
- ANSI art display correctness
- Multi-user concurrent access
- Control panel functionality
- AI Configuration Assistant conversation flow

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Welcome screen delivery on connection
*For any* successful WebSocket connection, the system should send an ANSI-formatted welcome screen to the client.
**Validates: Requirements 1.2**

### Property 2: Input transmission
*For any* input string typed by a caller, the terminal client should transmit that input to the server via WebSocket.
**Validates: Requirements 1.3**

### Property 3: ANSI output rendering
*For any* ANSI-formatted text sent by the server, the terminal client should render it in the display.
**Validates: Requirements 1.4**

### Property 4: New connection prompt
*For any* new connection without authentication, the system should prompt for a handle or offer the NEW registration option.
**Validates: Requirements 2.1**

### Property 5: Handle validation
*For any* handle string submitted during registration, the system should correctly validate that it is unique and between 3-20 characters, accepting valid handles and rejecting invalid ones.
**Validates: Requirements 2.3**

### Property 6: Password hashing round-trip
*For any* password submitted during registration, after hashing with bcrypt and storing, the system should be able to verify that same password on subsequent login attempts.
**Validates: Requirements 2.4**

### Property 7: Valid credential authentication
*For any* registered user with valid credentials, the authentication should succeed and display last login information.
**Validates: Requirements 2.5**

### Property 8: Invalid credential rejection with retry
*For any* invalid credentials entered, the system should reject the login and track attempts, allowing up to 5 retries per session.
**Validates: Requirements 2.6**

### Property 9: Main menu display after login
*For any* successful login, the system should display the main menu with available options.
**Validates: Requirements 3.1**

### Property 10: Valid menu command navigation
*For any* valid menu command entered, the system should navigate to the corresponding section.
**Validates: Requirements 3.3**

### Property 11: Invalid command error handling
*For any* invalid command entered in a menu, the system should display an error message and re-display the menu.
**Validates: Requirements 3.4**

### Property 12: Submenu return navigation
*For any* submenu state, the system should provide a way to return to the main menu.
**Validates: Requirements 3.5**

### Property 13: Message base list display
*For any* caller selecting the Message Bases option, the system should display a list of available message bases with descriptions.
**Validates: Requirements 4.1**

### Property 14: Message base menu options
*For any* message base entered, the system should display options to read, post, or scan for messages.
**Validates: Requirements 4.2**

### Property 15: Message chronological ordering
*For any* set of messages in a message base, when displayed, they should be ordered chronologically and include subject, author, and timestamp.
**Validates: Requirements 4.3**

### Property 16: Message posting persistence
*For any* valid message posted, the system should store it with the caller's handle and timestamp, and make it retrievable.
**Validates: Requirements 4.4, 4.5**

### Property 17: AI welcome generation for new users
*For any* new caller completing registration, the AI SysOp should generate a personalized welcome message.
**Validates: Requirements 5.1**

### Property 18: AI greeting for returning users
*For any* returning caller logging in, the AI SysOp should generate a greeting acknowledging their return.
**Validates: Requirements 5.2**

### Property 19: AI SysOp response time
*For any* page SysOp request, the AI SysOp should respond within 5 seconds.
**Validates: Requirements 5.3**

### Property 20: AI message ANSI formatting
*For any* AI SysOp generated message, the output should include ANSI color codes for visual emphasis.
**Validates: Requirements 5.4**

### Property 21: AI response length constraint
*For any* AI SysOp response, the length should be under 500 characters.
**Validates: Requirements 5.5**

### Property 22: AI configuration interpretation
*For any* natural language configuration request from a SysOp, the AI Assistant should interpret it and propose specific configuration changes.
**Validates: Requirements 6.2**

### Property 23: Configuration change preview
*For any* proposed configuration change, the system should display a preview before applying.
**Validates: Requirements 6.3**

### Property 24: Configuration persistence
*For any* confirmed configuration change, the system should update the config.yaml file and apply the changes.
**Validates: Requirements 6.4**

### Property 25: Configuration change confirmation
*For any* applied configuration change, the system should provide confirmation and show updated settings.
**Validates: Requirements 6.5**

### Property 26: Oracle response style
*For any* question asked to The Oracle, the AI should respond in a cryptic, mystical tone with appropriate symbols and formatting.
**Validates: Requirements 7.3**

### Property 27: Oracle response length
*For any* Oracle response, the length should be under 150 characters.
**Validates: Requirements 7.4**

### Property 28: Door exit navigation
*For any* door game exit, the system should return the caller to the door games menu.
**Validates: Requirements 7.5**

### Property 29: Dashboard real-time information
*For any* dashboard display, the system should show current information about active sessions and node usage.
**Validates: Requirements 8.2**

### Property 30: User list display
*For any* SysOp accessing the Users section, the system should display registered users with handles, access levels, and registration dates.
**Validates: Requirements 8.3**

### Property 31: Message base CRUD operations
*For any* SysOp in the Message Bases section, the system should allow creation, editing, and deletion of message bases.
**Validates: Requirements 8.4**

### Property 32: Database initialization
*For any* server start, the system should initialize or connect to the SQLite database.
**Validates: Requirements 9.1**

### Property 33: User registration persistence
*For any* user registration, the system should persist user data to the database with hashed password.
**Validates: Requirements 9.2**

### Property 34: Message persistence
*For any* posted message, the system should persist it to the database with proper references to user and message base.
**Validates: Requirements 9.3**

### Property 35: Configuration file persistence
*For any* configuration change, the system should persist the change to config.yaml.
**Validates: Requirements 9.4**

### Property 36: Data restoration round-trip
*For any* server restart, the system should restore all user accounts, messages, and configuration from persistent storage, maintaining data integrity.
**Validates: Requirements 9.5**

### Property 37: Session creation with unique ID
*For any* caller connection, the system should allocate a node and create a session with a unique identifier.
**Validates: Requirements 10.1**

### Property 38: Session isolation
*For any* set of concurrent connections, the system should manage separate sessions without interference between them.
**Validates: Requirements 10.2**

### Property 39: Session timeout
*For any* session inactive for 60 minutes, the system should terminate the session and disconnect the caller.
**Validates: Requirements 10.3**

### Property 40: Session cleanup
*For any* caller disconnection, the system should clean up the session and free the allocated node.
**Validates: Requirements 10.4**

### Property 41: Session location tracking
*For any* active session, the system should track the caller's current location within the BBS menu structure.
**Validates: Requirements 10.5**

### Property 42: AI provider initialization
*For any* AI capability initialization, the system should load the AI provider based on configuration settings.
**Validates: Requirements 11.1**

### Property 43: AI interface consistency
*For any* AI functionality invocation, the system should use a common interface regardless of the underlying provider.
**Validates: Requirements 11.2**

### Property 44: AI error handling
*For any* AI request failure, the system should handle errors gracefully and provide fallback responses.
**Validates: Requirements 11.4**

### Property 45: AI provider switching
*For any* configuration change to a different AI provider, the system should support the switch without requiring code changes to core BBS logic.
**Validates: Requirements 11.5**

### Property 46: Connection abstraction usage
*For any* incoming connection, the system should use the connection abstraction layer.
**Validates: Requirements 12.1**

### Property 47: Input normalization
*For any* input received through the connection interface, the system should normalize the input format for BBS core logic.
**Validates: Requirements 12.3**

### Property 48: Output formatting
*For any* output sent by BBS core, the system should format it appropriately for the connection type.
**Validates: Requirements 12.4**

### Property 49: Protocol extensibility
*For any* new protocol added, the system should implement the connection interface without modifying BBS core logic.
**Validates: Requirements 12.5**

### Property 50: ANSI escape code interpretation
*For any* ANSI-formatted text sent to the terminal client, the client should interpret ANSI escape codes for colors and formatting.
**Validates: Requirements 13.1**

### Property 51: Box-drawing character rendering
*For any* ANSI art containing box-drawing characters, the terminal client should render them correctly using CP437 encoding.
**Validates: Requirements 13.2**

### Property 52: Color variant support
*For any* color code used (standard or bright), the terminal client should support and render both variants.
**Validates: Requirements 13.3**

### Property 53: Server reconnection
*For any* server restart, the system should allow callers to reconnect without data loss.
**Validates: Requirements 14.3**

### Property 54: Graceful shutdown
*For any* server shutdown initiated by SysOp, the system should gracefully disconnect all active sessions with a goodbye message.
**Validates: Requirements 14.5**

### Property 55: Login attempt rate limiting
*For any* session, the system should limit login attempts to 5 per session.
**Validates: Requirements 15.1**

### Property 56: Message posting rate limiting
*For any* user, the system should limit message posting to 30 messages per hour.
**Validates: Requirements 15.2**

### Property 57: AI request rate limiting
*For any* user, the system should limit AI door game requests to 10 per minute.
**Validates: Requirements 15.3**

### Property 58: Input sanitization
*For any* user input received, the system should sanitize it to prevent injection attacks.
**Validates: Requirements 15.4**

### Property 59: Password hashing security
*For any* password stored, the system should use bcrypt with a cost factor of 10 for hashing.
**Validates: Requirements 15.5**

