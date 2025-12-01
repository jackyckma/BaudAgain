import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { SessionManager } from '../session/SessionManager.js';
import type { JWTUtil } from '../auth/jwt.js';
import bcrypt from 'bcrypt';
import {
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendInternalError,
} from '../utils/ErrorHandler.js';

/**
 * Register REST API routes for the control panel
 */
import type { MessageBaseRepository } from '../db/repositories/MessageBaseRepository.js';
import type { MessageService } from '../services/MessageService.js';
import type { BBSConfig } from '../config/ConfigLoader.js';

export async function registerAPIRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  sessionManager: SessionManager,
  jwtUtil: JWTUtil,
  config: BBSConfig,
  messageBaseRepository?: MessageBaseRepository,
  messageService?: MessageService
) {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(reply, 'Missing or invalid authorization header');
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const payload = jwtUtil.verifyToken(token);
      
      // Check if user is SysOp (access level >= 255)
      if (payload.accessLevel < 255) {
        sendForbidden(reply, 'SysOp access required');
        return;
      }

      // Attach user info to request
      request.user = {
        id: payload.userId,
        handle: payload.handle,
        accessLevel: payload.accessLevel,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Token expired') {
          sendUnauthorized(reply, 'Token expired');
        } else if (error.message === 'Invalid token') {
          sendUnauthorized(reply, 'Invalid token');
        } else {
          sendUnauthorized(reply, 'Authentication failed');
        }
      } else {
        sendUnauthorized(reply, 'Authentication failed');
      }
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
  // Rate limit for data modification: 30 requests per minute
  server.patch('/api/users/:id', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { accessLevel } = request.body as { accessLevel: number };
    
    if (typeof accessLevel !== 'number' || accessLevel < 0 || accessLevel > 255) {
      reply.code(400).send({ error: 'Invalid access level' });
      return;
    }

    try {
      // Check if user exists
      const user = userRepository.findById(id);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }

      // Update access level
      userRepository.updateAccessLevel(id, accessLevel);
      
      // Return updated user
      const updatedUser = userRepository.findById(id);
      return {
        id: updatedUser!.id,
        handle: updatedUser!.handle,
        accessLevel: updatedUser!.accessLevel,
        createdAt: updatedUser!.createdAt,
        lastLogin: updatedUser!.lastLogin,
        totalCalls: updatedUser!.totalCalls,
        totalPosts: updatedUser!.totalPosts,
      };
    } catch (error) {
      reply.code(400).send({ 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      });
    }
  });

  // Message bases endpoints
  server.get('/api/message-bases', { preHandler: authenticate }, async (request, reply) => {
    if (!messageBaseRepository) {
      return [];
    }
    
    const bases = messageBaseRepository.getAllMessageBases();
    return bases.map(base => ({
      id: base.id,
      name: base.name,
      description: base.description,
      accessLevelRead: base.accessLevelRead,
      accessLevelWrite: base.accessLevelWrite,
      postCount: base.postCount,
      lastPostAt: base.lastPostAt,
      sortOrder: base.sortOrder,
    }));
  });

  // Create message base
  server.post('/api/message-bases', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageService) {
      reply.code(501).send({ error: 'Message service not available' });
      return;
    }
    
    const { name, description, accessLevelRead, accessLevelWrite, sortOrder } = request.body as {
      name: string;
      description?: string;
      accessLevelRead?: number;
      accessLevelWrite?: number;
      sortOrder?: number;
    };
    
    if (!name || name.trim().length === 0) {
      reply.code(400).send({ error: 'Name is required' });
      return;
    }
    
    try {
      const base = messageService.createMessageBase({
        name: name.trim(),
        description: description?.trim(),
        accessLevelRead: accessLevelRead ?? 0,
        accessLevelWrite: accessLevelWrite ?? 10,
        sortOrder: sortOrder ?? 0,
      });
      
      return base;
    } catch (error) {
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to create message base' });
    }
  });

  // Update message base
  server.patch('/api/message-bases/:id', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageService) {
      reply.code(501).send({ error: 'Message service not available' });
      return;
    }
    
    const { id } = request.params as { id: string };
    const updates = request.body as {
      name?: string;
      description?: string;
      accessLevelRead?: number;
      accessLevelWrite?: number;
      sortOrder?: number;
    };
    
    try {
      messageService.updateMessageBase(id, updates);
      const base = messageService.getMessageBase(id);
      return base;
    } catch (error) {
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to update message base' });
    }
  });

  // Delete message base
  server.delete('/api/message-bases/:id', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageService) {
      reply.code(501).send({ error: 'Message service not available' });
      return;
    }
    
    const { id } = request.params as { id: string };
    
    try {
      messageService.deleteMessageBase(id);
      return { success: true };
    } catch (error) {
      reply.code(400).send({ error: error instanceof Error ? error.message : 'Failed to delete message base' });
    }
  });

  // AI settings endpoint
  server.get('/api/ai-settings', { preHandler: authenticate }, async (request, reply) => {
    return {
      provider: config.ai.provider,
      model: config.ai.model,
      sysop: {
        enabled: config.ai.sysop.enabled,
        welcomeNewUsers: config.ai.sysop.welcomeNewUsers,
        participateInChat: config.ai.sysop.participateInChat,
        chatFrequency: config.ai.sysop.chatFrequency,
        personality: config.ai.sysop.personality,
      },
      doors: {
        enabled: config.ai.doors.enabled,
        maxTokensPerTurn: config.ai.doors.maxTokensPerTurn,
      },
    };
  });

  // Login endpoint (for control panel authentication)
  // Stricter rate limit: 10 requests per minute
  server.post('/api/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
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

    // Generate JWT token
    const token = jwtUtil.generateToken({
      userId: user.id,
      handle: user.handle,
      accessLevel: user.accessLevel,
    });
    
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
