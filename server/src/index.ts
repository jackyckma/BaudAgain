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
import fastifyStatic from '@fastify/static';
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
import { NotificationEventType, createNotificationEvent, UserJoinedPayload, UserLeftPayload } from './notifications/types.js';

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
const jwtUtil = new JWTUtil(jwtConfig);
server.log.info('JWT authentication initialized');

// Initialize database
const database = new BBSDatabase('data/bbs.db', server.log);
await database.ready(); // Wait for initialization to complete
const userRepository = new UserRepository(database);
const { DoorSessionRepository } = await import('./db/repositories/DoorSessionRepository.js');
const doorSessionRepository = new DoorSessionRepository(database);
const { MessageBaseRepository } = await import('./db/repositories/MessageBaseRepository.js');
const messageBaseRepository = new MessageBaseRepository(database);
const { MessageRepository } = await import('./db/repositories/MessageRepository.js');
const messageRepository = new MessageRepository(database);
const { ArtGalleryRepository } = await import('./db/repositories/ArtGalleryRepository.js');
const artGalleryRepository = new ArtGalleryRepository(database);

// Initialize managers and renderers
const connectionManager = new ConnectionManager(server.log);
const sessionManager = new SessionManager(server.log);
const terminalRenderer = new WebTerminalRenderer();

// Initialize notification service
const { NotificationService } = await import('./notifications/NotificationService.js');
const notificationService = new NotificationService(server.log);
server.log.info('Notification service initialized');

// Initialize AI (if enabled)
let aiSysOp: AISysOp | undefined;
let aiService: AIService | undefined;
let aiConfigAssistant: any | undefined;
let artGenerator: any | undefined;
let messageSummarizer: any | undefined;
let dailyDigestService: any | undefined;
let conversationStarter: any | undefined;
let dailyQuestionService: any | undefined;
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
    
    // Initialize AI Configuration Assistant
    const { AIConfigAssistant } = await import('./ai/AIConfigAssistant.js');
    aiConfigAssistant = new AIConfigAssistant(aiProvider, configLoader, server.log);
    
    // Initialize ANSI Art Generator
    const { ANSIArtGenerator } = await import('./services/ANSIArtGenerator.js');
    artGenerator = new ANSIArtGenerator(aiProvider, server.log);
    
    // Initialize Message Summarizer
    const { MessageSummarizer } = await import('./services/MessageSummarizer.js');
    messageSummarizer = new MessageSummarizer(aiProvider, server.log);
    
    // Initialize Daily Digest Service
    const { DailyDigestService } = await import('./services/DailyDigestService.js');
    dailyDigestService = new DailyDigestService(aiProvider, server.log);
    
    // Initialize Conversation Starter
    const { ConversationStarter } = await import('./services/ConversationStarter.js');
    conversationStarter = new ConversationStarter(aiProvider, server.log);
    
    // Initialize Daily Question Service
    const { DailyQuestionService } = await import('./services/DailyQuestionService.js');
    dailyQuestionService = new DailyQuestionService(
      conversationStarter,
      messageRepository,
      messageBaseRepository,
      userRepository,
      server.log
    );
    
    server.log.info('AI SysOp, Configuration Assistant, Art Generator, Message Summarizer, Daily Digest, and Conversation Starter initialized successfully');
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
const messageService = new MessageService(messageBaseRepository, messageRepository, userRepository, notificationService);
const { DoorService } = await import('./services/DoorService.js');
// DoorService will be initialized after doors are registered

// Initialize Scheduled Task Service
const { ScheduledTaskService } = await import('./services/ScheduledTaskService.js');
const scheduledTaskService = new ScheduledTaskService(server.log);

// Register daily question task if enabled
if (config.aiFeatures?.dailyQuestion?.enabled && dailyQuestionService) {
  const dailyQuestionConfig = config.aiFeatures.dailyQuestion;
  scheduledTaskService.registerTask({
    id: 'daily-question',
    name: 'Daily Question of the Day',
    schedule: dailyQuestionConfig.schedule,
    enabled: dailyQuestionConfig.enabled,
    handler: async () => {
      try {
        await dailyQuestionService.generateAndPostDailyQuestion(dailyQuestionConfig);
        server.log.info('Daily question posted successfully');
      } catch (error) {
        server.log.error({ error }, 'Failed to post daily question');
      }
    },
  });
  server.log.info(
    { schedule: dailyQuestionConfig.schedule },
    'Daily question task registered'
  );
}

// Initialize BBS Core and register handlers
const bbsCore = new BBSCore(sessionManager, server.log);

// Create handler dependencies
const handlerDeps = {
  renderer: terminalRenderer,
  sessionManager,
  aiSysOp,
  notificationService,
  dailyDigestService,
  messageRepository,
  messageBaseRepository,
  userService,
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

// Register Art Studio door game
const { ArtStudioDoor } = await import('./doors/ArtStudioDoor.js');
const artStudioDoor = new ArtStudioDoor(artGenerator, artGalleryRepository);
doorHandler.registerDoor(artStudioDoor);

bbsCore.registerHandler(doorHandler);

// Initialize DoorService with registered doors
const doorService = new DoorService(
  doorHandler.getDoors(),
  sessionManager,
  doorSessionRepository
);
// Register MessageHandler before MenuHandler (takes precedence for message commands)
const { MessageHandler } = await import('./handlers/MessageHandler.js');
const messageHandlerDeps = {
  ...handlerDeps,
  messageService,
  messageSummarizer,
  conversationStarter
};
const messageHandler = new MessageHandler(messageHandlerDeps);
bbsCore.registerHandler(messageHandler);
// Register ArtGalleryHandler before MenuHandler (takes precedence for art gallery commands)
const { ArtGalleryHandler } = await import('./handlers/ArtGalleryHandler.js');
const artGalleryHandlerDeps = {
  ...handlerDeps,
  artGalleryRepository
};
const artGalleryHandler = new ArtGalleryHandler(artGalleryHandlerDeps);
bbsCore.registerHandler(artGalleryHandler);
// Register MenuHandler for authenticated users
bbsCore.registerHandler(new MenuHandler(handlerDeps));

// Register plugins
await server.register(cors, {
  origin: true, // Allow all origins in development
});

// Serve terminal client static files
const terminalClientPath = path.join(projectRoot, 'client/terminal/dist');
await server.register(fastifyStatic, {
  root: terminalClientPath,
  prefix: '/',
});
server.log.info(`Serving terminal client from ${terminalClientPath}`);

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
    
    // Register connection with notification service
    notificationService.registerClient(connection, session.userId);

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
        
        // Update notification service if user authenticated
        const updatedSession = sessionManager.getSession(session.id);
        if (updatedSession?.userId && !notificationService.getClient(connection.id)?.authenticated) {
          notificationService.authenticateClient(connection.id, updatedSession.userId);
          
          // Broadcast user joined event
          const userJoinedPayload: UserJoinedPayload = {
            userId: updatedSession.userId,
            handle: updatedSession.handle || 'Unknown',
            node: 1, // TODO: Implement proper node tracking
          };
          const userJoinedEvent = createNotificationEvent(
            NotificationEventType.USER_JOINED,
            userJoinedPayload
          );
          await notificationService.broadcastToAuthenticated(userJoinedEvent);
          
          fastify.log.info(
            { userId: updatedSession.userId, handle: updatedSession.handle },
            'User joined - notification broadcast'
          );
        }
      } catch (err) {
        fastify.log.error({ err, sessionId: session.id }, 'Error processing input');
        await connection.send('An error occurred. Please try again.\r\n');
      }
    });

    // Handle connection close
    connection.onClose(async () => {
      // Get session info before removing it
      const closingSession = sessionManager.getSession(session.id);
      
      // Broadcast user left event if user was authenticated
      if (closingSession?.userId && closingSession.handle) {
        const userLeftPayload: UserLeftPayload = {
          userId: closingSession.userId,
          handle: closingSession.handle,
          node: 1, // TODO: Implement proper node tracking
        };
        const userLeftEvent = createNotificationEvent(
          NotificationEventType.USER_LEFT,
          userLeftPayload
        );
        
        try {
          await notificationService.broadcastToAuthenticated(userLeftEvent);
          fastify.log.info(
            { userId: closingSession.userId, handle: closingSession.handle },
            'User left - notification broadcast'
          );
        } catch (err) {
          fastify.log.error({ err }, 'Error broadcasting user left event');
        }
      }
      
      sessionManager.removeSession(session.id);
    });

    // Handle errors
    connection.onError((error) => {
      fastify.log.error({ connectionId: connection.id, error }, 'Connection error');
    });
  });
});

// Register REST API routes for control panel
await registerAPIRoutes(server, userRepository, sessionManager, jwtUtil, config, messageBaseRepository, messageService, doorService, notificationService, aiConfigAssistant, aiSysOp, artGalleryRepository, artGenerator, messageSummarizer, dailyQuestionService, scheduledTaskService);

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
  server.log.info('🛑 Initiating graceful shutdown...');
  
  try {
    // Stop scheduled tasks
    server.log.info('Stopping scheduled tasks...');
    scheduledTaskService.shutdown();
    
    // Send goodbye message to all connected users
    const connections = connectionManager.getAllConnections();
    const goodbyeMessage = '\r\n' +
      '╔═══════════════════════════════════════════════════════════╗\r\n' +
      '║                                                           ║\r\n' +
      '║              🌙 BAUDAGAIN BBS - GOODBYE 🌙                ║\r\n' +
      '║                                                           ║\r\n' +
      '╠═══════════════════════════════════════════════════════════╣\r\n' +
      '║                                                           ║\r\n' +
      '║   The system is shutting down for maintenance...         ║\r\n' +
      '║                                                           ║\r\n' +
      '║   Thank you for calling BaudAgain BBS!                   ║\r\n' +
      '║   We hope to see you again soon.                         ║\r\n' +
      '║                                                           ║\r\n' +
      '║   Stay retro. Stay connected.                            ║\r\n' +
      '║                                                           ║\r\n' +
      '╚═══════════════════════════════════════════════════════════╝\r\n\r\n';
    
    server.log.info(`Sending goodbye message to ${connections.length} connected user(s)`);
    
    // Send goodbye to all connections
    for (const conn of connections) {
      try {
        await conn.send(goodbyeMessage);
      } catch (err) {
        server.log.error({ err, connectionId: conn.id }, 'Error sending goodbye message');
      }
    }
    
    // Give connections time to receive the message
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up sessions
    server.log.info('Cleaning up sessions...');
    sessionManager.destroy();
    
    // Close all connections
    server.log.info('Closing all connections...');
    await connectionManager.closeAll();
    
    // Close database
    server.log.info('Closing database...');
    database.close();
    
    // Close server
    server.log.info('Closing server...');
    await server.close();
    
    server.log.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    server.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  server.log.error({ error }, 'Uncaught exception');
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  server.log.error({ reason, promise }, 'Unhandled rejection');
  shutdown();
});

try {
  await server.listen({ port: PORT, host: HOST });
  console.log(`\n🖥️  BaudAgain BBS Server running on ws://localhost:${PORT}/ws`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
