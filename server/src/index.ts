import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';

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

// Register plugins
await server.register(cors, {
  origin: true, // Allow all origins in development
});

await server.register(websocket);

// WebSocket route for BBS terminal connections
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    fastify.log.info('New WebSocket connection established');

    // Send welcome message
    socket.send('Welcome to BaudAgain BBS!\r\n');
    socket.send('Type something: ');

    // Handle incoming messages
    socket.on('message', (message: Buffer) => {
      const input = message.toString().trim();
      fastify.log.info({ input }, 'Received input from client');
      
      // Echo back for now
      socket.send(`You typed: ${input}\r\n`);
      socket.send('Type something: ');
    });

    // Handle disconnection
    socket.on('close', () => {
      fastify.log.info('WebSocket connection closed');
    });

    // Handle errors
    socket.on('error', (error) => {
      fastify.log.error({ error }, 'WebSocket error');
    });
  });
});

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = '0.0.0.0';

try {
  await server.listen({ port: PORT, host: HOST });
  console.log(`\n🖥️  BaudAgain BBS Server running on ws://localhost:${PORT}/ws`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
