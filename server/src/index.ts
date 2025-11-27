import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { WebSocketConnection } from './connection/WebSocketConnection.js';
import { ConnectionManager } from './connection/ConnectionManager.js';
import { ANSIRenderer } from './ansi/ANSIRenderer.js';
import { BBSDatabase } from './db/Database.js';
import { UserRepository } from './db/repositories/UserRepository.js';
import { SessionManager } from './session/SessionManager.js';

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

// Initialize database
const database = new BBSDatabase('data/bbs.db', server.log);
const userRepository = new UserRepository(database);

// Initialize managers and renderers
const connectionManager = new ConnectionManager(server.log);
const sessionManager = new SessionManager(server.log);
const ansiRenderer = new ANSIRenderer();

// Register plugins
await server.register(cors, {
  origin: true, // Allow all origins in development
});

await server.register(websocket);

// WebSocket route for BBS terminal connections
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, async (socket, req) => {
    // Wrap WebSocket in our connection abstraction
    const connection = new WebSocketConnection(socket);
    connectionManager.addConnection(connection);

    // Create session for this connection
    const session = sessionManager.createSession(connection.id);

    fastify.log.info(
      { connectionId: connection.id, sessionId: session.id },
      'New connection established'
    );

    // Send ANSI welcome screen
    try {
      const welcomeScreen = ansiRenderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: connectionManager.getConnectionCount().toString(),
      });
      await connection.send(welcomeScreen);
      await connection.send('\r\nEnter your handle, or type NEW to register: ');
    } catch (err) {
      fastify.log.error({ err }, 'Error sending welcome screen');
      await connection.send('Welcome to BaudAgain BBS!\r\n');
      await connection.send('Enter your handle, or type NEW to register: ');
    }

    // Handle incoming data
    connection.onData((input) => {
      const trimmedInput = input.trim();
      
      // Update session activity
      sessionManager.touchSession(session.id);
      
      fastify.log.info(
        { connectionId: connection.id, sessionId: session.id, input: trimmedInput },
        'Received input'
      );
      
      // Echo back for now
      connection.send(`You typed: ${trimmedInput}\r\n`).catch(err => 
        fastify.log.error({ err }, 'Error sending response')
      );
      connection.send('Type something: ').catch(err => 
        fastify.log.error({ err }, 'Error sending prompt')
      );
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
