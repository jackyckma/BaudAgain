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
  // Authentication middleware (requires any authenticated user)
  const authenticateUser = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header'
        }
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const payload = jwtUtil.verifyToken(token);
      
      // Attach user info to request
      request.user = {
        id: payload.userId,
        handle: payload.handle,
        accessLevel: payload.accessLevel,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Token expired') {
          reply.code(401).send({ 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Token expired'
            }
          });
        } else if (error.message === 'Invalid token') {
          reply.code(401).send({ 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid token'
            }
          });
        } else {
          reply.code(401).send({ 
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication failed'
            }
          });
        }
      } else {
        reply.code(401).send({ 
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication failed'
          }
        });
      }
      return;
    }
  };

  // Authentication middleware (requires SysOp - for control panel)
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

  // ============================================================================
  // V1 API Endpoints (REST API for BBS operations)
  // ============================================================================

  // POST /api/v1/auth/register - Register new user
  server.post('/api/v1/auth/register', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { handle, password, realName, location, bio } = request.body as {
      handle: string;
      password: string;
      realName?: string;
      location?: string;
      bio?: string;
    };
    
    // Validate input
    if (!handle || !password) {
      reply.code(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: 'Handle and password are required'
        }
      });
      return;
    }
    
    if (handle.length < 3 || handle.length > 20) {
      reply.code(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: 'Handle must be between 3 and 20 characters'
        }
      });
      return;
    }
    
    if (password.length < 6) {
      reply.code(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: 'Password must be at least 6 characters'
        }
      });
      return;
    }
    
    // Check if handle already exists
    if (userRepository.handleExists(handle)) {
      reply.code(409).send({ 
        error: {
          code: 'CONFLICT',
          message: 'Handle already exists'
        }
      });
      return;
    }
    
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const user = userRepository.create(handle, passwordHash, {
        realName,
        location,
        bio,
        accessLevel: 10, // Default user access level
      });
      
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
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      reply.code(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      });
    }
  });

  // POST /api/v1/auth/login - Login with credentials
  server.post('/api/v1/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { handle, password } = request.body as { handle: string; password: string };
    
    if (!handle || !password) {
      reply.code(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: 'Handle and password are required'
        }
      });
      return;
    }

    const user = await userRepository.getUserByHandle(handle);
    
    if (!user) {
      reply.code(401).send({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      reply.code(401).send({ 
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Update last login
    userRepository.updateLastLogin(user.id);

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
        lastLogin: user.lastLogin,
        totalCalls: user.totalCalls,
      },
    };
  });

  // POST /api/v1/auth/refresh - Refresh JWT token
  server.post('/api/v1/auth/refresh', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { token: oldToken } = request.body as { token: string };
    
    if (!oldToken) {
      reply.code(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: 'Token is required'
        }
      });
      return;
    }
    
    try {
      // Verify old token
      const payload = jwtUtil.verifyToken(oldToken);
      
      // Generate new token
      const newToken = jwtUtil.generateToken({
        userId: payload.userId,
        handle: payload.handle,
        accessLevel: payload.accessLevel,
      });
      
      return { token: newToken };
    } catch (error) {
      reply.code(401).send({ 
        error: {
          code: 'UNAUTHORIZED',
          message: error instanceof Error ? error.message : 'Invalid token'
        }
      });
    }
  });

  // GET /api/v1/auth/me - Get current user
  server.get('/api/v1/auth/me', { preHandler: authenticateUser }, async (request, reply) => {
    const userId = (request as any).user.id;
    const user = userRepository.findById(userId);
    
    if (!user) {
      reply.code(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    return {
      id: user.id,
      handle: user.handle,
      realName: user.realName,
      location: user.location,
      bio: user.bio,
      accessLevel: user.accessLevel,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      totalCalls: user.totalCalls,
      totalPosts: user.totalPosts,
      preferences: user.preferences,
    };
  });

  // ============================================================================
  // V1 User Management Endpoints
  // ============================================================================

  // GET /api/v1/users - List all users
  server.get('/api/v1/users', { preHandler: authenticateUser }, async (request, reply) => {
    const { page = 1, limit = 50, sort = 'createdAt', order = 'desc' } = request.query as {
      page?: number;
      limit?: number;
      sort?: string;
      order?: string;
    };
    
    // Validate pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    
    // Get all users (we'll implement pagination later if needed)
    const allUsers = userRepository.findAll();
    
    // Sort users
    const sortedUsers = allUsers.sort((a, b) => {
      let comparison = 0;
      if (sort === 'handle') {
        comparison = a.handle.localeCompare(b.handle);
      } else if (sort === 'lastLogin') {
        const aTime = a.lastLogin?.getTime() || 0;
        const bTime = b.lastLogin?.getTime() || 0;
        comparison = aTime - bTime;
      } else { // createdAt
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }
      return order === 'asc' ? comparison : -comparison;
    });
    
    // Paginate
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedUsers = sortedUsers.slice(start, end);
    
    return {
      users: paginatedUsers.map(user => ({
        id: user.id,
        handle: user.handle,
        accessLevel: user.accessLevel,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        totalCalls: user.totalCalls,
        totalPosts: user.totalPosts,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allUsers.length,
        pages: Math.ceil(allUsers.length / limitNum),
        hasNext: end < allUsers.length,
        hasPrev: pageNum > 1,
      },
    };
  });

  // GET /api/v1/users/:id - Get user profile
  server.get('/api/v1/users/:id', { preHandler: authenticateUser }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = userRepository.findById(id);
    
    if (!user) {
      reply.code(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    return {
      id: user.id,
      handle: user.handle,
      realName: user.realName,
      location: user.location,
      bio: user.bio,
      accessLevel: user.accessLevel,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      totalCalls: user.totalCalls,
      totalPosts: user.totalPosts,
    };
  });

  // PATCH /api/v1/users/:id - Update user profile
  server.patch('/api/v1/users/:id', {
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const updates = request.body as {
      realName?: string;
      location?: string;
      bio?: string;
      accessLevel?: number;
      preferences?: any;
    };
    
    // Check if user exists
    const user = userRepository.findById(id);
    if (!user) {
      reply.code(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    
    // Check authorization
    // Users can only update their own profile unless they're admin
    if (currentUser.id !== id && currentUser.accessLevel < 255) {
      reply.code(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this user'
        }
      });
      return;
    }
    
    // Only admins can change access level
    if (updates.accessLevel !== undefined && currentUser.accessLevel < 255) {
      reply.code(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can change access levels'
        }
      });
      return;
    }
    
    try {
      // Update access level if provided and user is admin
      if (updates.accessLevel !== undefined) {
        userRepository.updateAccessLevel(id, updates.accessLevel);
      }
      
      // Update preferences if provided
      if (updates.preferences) {
        userRepository.updatePreferences(id, updates.preferences);
      }
      
      // For other fields, we'd need to add update methods to the repository
      // For now, return the updated user
      const updatedUser = userRepository.findById(id);
      
      return {
        id: updatedUser!.id,
        handle: updatedUser!.handle,
        realName: updatedUser!.realName,
        location: updatedUser!.location,
        bio: updatedUser!.bio,
        accessLevel: updatedUser!.accessLevel,
        preferences: updatedUser!.preferences,
      };
    } catch (error) {
      reply.code(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: error instanceof Error ? error.message : 'Failed to update user'
        }
      });
    }
  });

  // ============================================================================
  // Legacy Control Panel Endpoints (backward compatibility)
  // ============================================================================

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
