import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
const projectRoot = process.cwd().endsWith('/server') 
  ? path.resolve(process.cwd(), '..')
  : process.cwd();
dotenv.config({ path: path.join(projectRoot, '.env') });
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { WebSocketConnection } from './connection/WebSocketConnection.js';
import { ConnectionManager } from './connection/ConnectionManager.js';

import { BBSDatabase } from './db/Database.js';
import { UserRepository } from './db/repositories/UserRepository.js';
import { SessionManager } from './session/SessionManager.js';
import { WebTerminalRenderer } from './terminal/WebTerminalRenderer.js';
import { BBSCore } from './core/BBSCore.js';
import { AuthHandler } from './handlers/AuthHandler.js';
import { MenuHandler } from './handlers/MenuHandler.js';
import { AIProviderFactory, AIService, AISysOp } from './ai/index.js';
import { getConfigLoader } from './config/index.js';
import type { WelcomeScreenContent, PromptContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';
import { registerAPIRoutes } from './api/routes.js';
import { JWTUtil } from './auth/jwt.js';

const server = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Load configuration
const configLoader = getConfigLoader();
const config = configLoader.getConfig();

// Initialize JWT utility
const jwtConfig = configLoader.getJWTConfig();
const jwtUtil = new JWTUtil(jwtConfig as any); // Type assertion needed due to StringValue type complexity
server.log.info('JWT authentication initialized');

// Initialize database
const database = new BBSDatabase('data/bbs.db', server.log);
const userRepository = new UserRepository(database);
const { DoorSessionRepository } = await import('./db/repositories/DoorSessionRepository.js');
const doorSessionRepository = new DoorSessionRepository(database);
const { MessageBaseRepository } = await import('./db/repositories/MessageBaseRepository.js');
const messageBaseRepository = new MessageBaseRepository(database);
const { MessageRepository } = await import('./db/repositories/MessageRepository.js');
const messageRepository = new MessageRepository(database);

// Initialize managers and renderers
const connectionManager = new ConnectionManager(server.log);
const sessionManager = new SessionManager(server.log);
const terminalRenderer = new WebTerminalRenderer();

// Initialize AI (if enabled)
let aiSysOp: AISysOp | undefined;
let aiService: AIService | undefined;
try {
  if (config.ai.sysop.enabled) {
    const apiKey = configLoader.getAIApiKey();
    const aiProvider = AIProviderFactory.create({
      provider: config.ai.provider,
      model: config.ai.model,
      apiKey,
    });
    aiService = new AIService(aiProvider, server.log);
    aiSysOp = new AISysOp(aiService, config, server.log);
    server.log.info('AI SysOp initialized successfully');
  } else {
    server.log.info('AI SysOp disabled in configuration');
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  server.log.error({ error: errorMessage }, 'Failed to initialize AI SysOp - continuing without AI features');
}

// Initialize services
const { UserService } = await import('./services/UserService.js');
const userService = new UserService(userRepository);
const { MessageService } = await import('./services/MessageService.js');
const messageService = new MessageService(messageBaseRepository, messageRepository, userRepository);

// Initialize BBS Core and register handlers
const bbsCore = new BBSCore(sessionManager, server.log);

// Create handler dependencies
const handlerDeps = {
  renderer: terminalRenderer,
  sessionManager,
  aiSysOp,
};

// Register AuthHandler first (takes precedence for CONNECTED/AUTHENTICATING states)
bbsCore.registerHandler(new AuthHandler(userService, handlerDeps));
// Register DoorHandler before MenuHandler (takes precedence for door game commands)
const { DoorHandler } = await import('./handlers/DoorHandler.js');
const doorHandlerDeps = {
  ...handlerDeps,
  doorSessionRepository
};
const doorHandler = new DoorHandler(doorHandlerDeps);
// Register The Oracle door game
const { OracleDoor } = await import('./doors/OracleDoor.js');
const oracleDoor = new OracleDoor(aiService);
doorHandler.registerDoor(oracleDoor);
bbsCore.registerHandler(doorHandler);
// Register MessageHandler before MenuHandler (takes precedence for message commands)
const { MessageHandler } = await import('./handlers/MessageHandler.js');
const messageHandlerDeps = {
  ...handlerDeps,
  messageService
};
const messageHandler = new MessageHandler(messageHandlerDeps);
bbsCore.registerHandler(messageHandler);
// Register MenuHandler for authenticated users
bbsCore.registerHandler(new MenuHandler(handlerDeps));

// Register plugins
await server.register(cors, {
  origin: true, // Allow all origins in development
});

// Register rate limiting
await server.register(rateLimit, {
  global: true,
  max: 100, // 100 requests
  timeWindow: '15 minutes', // per 15 minutes
  cache: 10000, // Cache size
  allowList: ['127.0.0.1', '::1'], // Whitelist localhost (IPv4 and IPv6) for development
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  errorResponseBuilder: (_request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    };
  },
});
server.log.info('Rate limiting enabled: 100 requests per 15 minutes (localhost excluded)');

await server.register(websocket);

// WebSocket route for BBS terminal connections
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, async (socket, _req) => {
    // Wrap WebSocket in our connection abstraction
    const connection = new WebSocketConnection(socket);
    connectionManager.addConnection(connection);

    // Create session for this connection
    const session = sessionManager.createSession(connection.id);

    fastify.log.info(
      { connectionId: connection.id, sessionId: session.id },
      'New connection established'
    );

    // Send welcome screen using structured content
    try {
      const welcomeContent: WelcomeScreenContent = {
        type: ContentType.WELCOME_SCREEN,
        title: 'BAUDAGAIN BBS',
        subtitle: 'The Haunted Terminal',
        tagline: 'Where digital spirits dwell',
        node: '1',
        maxNodes: '4',
        callerCount: connectionManager.getConnectionCount().toString(),
      };
      
      const welcomeScreen = terminalRenderer.render(welcomeContent);
      await connection.send(welcomeScreen);
      
      // Send login prompt
      const promptContent: PromptContent = {
        type: ContentType.PROMPT,
        text: '\r\nEnter your handle, or type NEW to register: ',
      };
      await connection.send(terminalRenderer.render(promptContent));
    } catch (err) {
      fastify.log.error({ err }, 'Error sending welcome screen');
      await connection.send('Welcome to BaudAgain BBS!\r\n');
      await connection.send('Enter your handle, or type NEW to register: ');
    }

    // Handle incoming data - route through BBSCore
    connection.onData(async (input) => {
      try {
        const response = await bbsCore.processInput(session.id, input);
        await connection.send(response);
      } catch (err) {
        fastify.log.error({ err, sessionId: session.id }, 'Error processing input');
        await connection.send('An error occurred. Please try again.\r\n');
      }
    });

    // Handle connection close
    connection.onClose(() => {
      sessionManager.removeSession(session.id);
    });

    // Handle errors
    connection.onError((error) => {
      fastify.log.error({ connectionId: connection.id, error }, 'Connection error');
    });
  });
});

// Register REST API routes for control panel
await registerAPIRoutes(server, userRepository, sessionManager, jwtUtil, config, messageBaseRepository, messageService);

// Health check endpoint
server.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: connectionManager.getConnectionCount(),
    sessions: sessionManager.getSessionCount()
  };
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = '0.0.0.0';

// Graceful shutdown
const shutdown = async () => {
  server.log.info('Shutting down gracefully...');
  sessionManager.destroy();
  await connectionManager.closeAll();
  database.close();
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

try {
  await server.listen({ port: PORT, host: HOST });
  console.log(`\n🖥️  BaudAgain BBS Server running on ws://localhost:${PORT}/ws`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
