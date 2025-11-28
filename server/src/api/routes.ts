import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { SessionManager } from '../session/SessionManager.js';
import bcrypt from 'bcrypt';

/**
 * Register REST API routes for the control panel
 */
export async function registerAPIRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  sessionManager: SessionManager
) {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Simple token validation (in production, use JWT or similar)
    // For now, we'll use a simple format: base64(handle:password)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [handle, password] = decoded.split(':');
      
      const user = await userRepository.getUserByHandle(handle);
      
      if (!user) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }

      // Check if user is SysOp (access level >= 255)
      if (user.accessLevel < 255) {
        reply.code(403).send({ error: 'Forbidden - SysOp access required' });
        return;
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      
      if (!passwordMatch) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }

      // Attach user to request
      request.user = user;
    } catch (error) {
      reply.code(401).send({ error: 'Invalid token' });
      return;
    }
  };

  // Dashboard endpoint
  server.get('/api/dashboard', { preHandler: authenticate }, async (request, reply) => {
    const sessions = sessionManager.getAllSessions();
    const activeSessions = sessions.filter(s => s.state === 'authenticated');
    
    const totalUsers = userRepository.findAll();
    
    return {
      currentCallers: activeSessions.length,
      totalUsers: totalUsers.length,
      messagesToday: 0, // TODO: Implement when message system is ready
      recentActivity: [], // TODO: Implement activity log
      uptime: process.uptime(),
      nodeUsage: {
        active: activeSessions.length,
        total: 4, // From config
      },
    };
  });

  // Users endpoint
  server.get('/api/users', { preHandler: authenticate }, async (request, reply) => {
    const users = userRepository.findAll();
    
    return users.map(user => ({
      id: user.id,
      handle: user.handle,
      accessLevel: user.accessLevel,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      totalCalls: user.totalCalls,
      totalPosts: user.totalPosts,
    }));
  });

  // Update user access level
  server.patch('/api/users/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { accessLevel } = request.body as { accessLevel: number };
    
    if (typeof accessLevel !== 'number' || accessLevel < 0 || accessLevel > 255) {
      reply.code(400).send({ error: 'Invalid access level' });
      return;
    }

    // TODO: Implement updateUserAccessLevel in UserRepository
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  // Message bases endpoint (placeholder)
  server.get('/api/message-bases', { preHandler: authenticate }, async (request, reply) => {
    // TODO: Implement when message base system is ready
    return [];
  });

  // AI settings endpoint
  server.get('/api/ai-settings', { preHandler: authenticate }, async (request, reply) => {
    // TODO: Read from config
    return {
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      enabled: true,
      welcomeNewUsers: true,
    };
  });

  // Login endpoint (for control panel authentication)
  server.post('/api/login', async (request, reply) => {
    const { handle, password } = request.body as { handle: string; password: string };
    
    if (!handle || !password) {
      reply.code(400).send({ error: 'Handle and password required' });
      return;
    }

    const user = await userRepository.getUserByHandle(handle);
    
    if (!user) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    // Check if user is SysOp
    if (user.accessLevel < 255) {
      reply.code(403).send({ error: 'SysOp access required' });
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    // Generate token (simple base64 encoding for now)
    const token = Buffer.from(`${handle}:${password}`).toString('base64');
    
    return {
      token,
      user: {
        id: user.id,
        handle: user.handle,
        accessLevel: user.accessLevel,
      },
    };
  });
}
