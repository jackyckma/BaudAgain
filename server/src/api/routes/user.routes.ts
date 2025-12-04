import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../../db/repositories/UserRepository.js';
import type { JWTUtil } from '../../auth/jwt.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import { createUserAuthMiddleware, createSysOpAuthMiddleware } from '../middleware/auth.middleware.js';
import { listUsersSchema, getUserSchema, updateUserSchema, updateAccessLevelSchema } from '../schemas/user.schema.js';

/**
 * Register user management routes
 */
export async function registerUserRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  jwtUtil: JWTUtil
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);
  const authenticate = createSysOpAuthMiddleware(jwtUtil);

  // GET /api/users - List all users (admin only)
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

  // PATCH /api/users/:id - Update user access level (admin only)
  server.patch('/api/users/:id', {
    schema: updateAccessLevelSchema,
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

    try {
      const user = ErrorHandler.checkResourceExists(reply, userRepository.findById(id), 'User');
      if (!user) return;

      userRepository.updateAccessLevel(id, accessLevel);
      
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
      ErrorHandler.handleError(reply, error);
    }
  });

  // GET /api/v1/users - List all users with pagination
  server.get('/api/v1/users', { 
    schema: listUsersSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    const { page = 1, limit = 50, sort = 'createdAt', order = 'desc' } = request.query as {
      page?: number;
      limit?: number;
      sort?: string;
      order?: string;
    };
    
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    
    const allUsers = userRepository.findAll();
    
    const sortedUsers = allUsers.sort((a, b) => {
      let comparison = 0;
      if (sort === 'handle') {
        comparison = a.handle.localeCompare(b.handle);
      } else if (sort === 'lastLogin') {
        const aTime = a.lastLogin?.getTime() || 0;
        const bTime = b.lastLogin?.getTime() || 0;
        comparison = aTime - bTime;
      } else {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }
      return order === 'asc' ? comparison : -comparison;
    });
    
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
  server.get('/api/v1/users/:id', { 
    schema: getUserSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = ErrorHandler.checkResourceExists(reply, userRepository.findById(id), 'User');
    
    if (!user) return;
    
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
    schema: updateUserSchema,
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
    
    const user = ErrorHandler.checkResourceExists(reply, userRepository.findById(id), 'User');
    if (!user) return;
    
    if (!ErrorHandler.checkPermission(reply, currentUser.id === id || currentUser.accessLevel >= 255, 'Not authorized to update this user')) {
      return;
    }
    
    if (updates.accessLevel !== undefined && !ErrorHandler.checkPermission(reply, currentUser.accessLevel >= 255, 'Only admins can change access levels')) {
      return;
    }
    
    try {
      if (updates.accessLevel !== undefined) {
        userRepository.updateAccessLevel(id, updates.accessLevel);
      }
      
      if (updates.preferences) {
        userRepository.updatePreferences(id, updates.preferences);
      }
      
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
      reply.status(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: error instanceof Error ? error.message : 'Failed to update user'
        }
      });
    }
  });
}
