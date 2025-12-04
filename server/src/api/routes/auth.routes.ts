import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../../db/repositories/UserRepository.js';
import type { JWTUtil } from '../../auth/jwt.js';
import bcrypt from 'bcrypt';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import { createUserAuthMiddleware } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, getMeSchema } from '../schemas/auth.schema.js';

/**
 * Register authentication routes
 */
export async function registerAuthRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  jwtUtil: JWTUtil
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);

  // POST /api/v1/auth/register - Register new user
  server.post('/api/v1/auth/register', {
    schema: registerSchema,
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
    
    if (userRepository.handleExists(handle)) {
      ErrorHandler.sendConflictError(reply, 'Handle already exists');
      return;
    }
    
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = userRepository.create(handle, passwordHash, {
        realName,
        location,
        bio,
        accessLevel: 10,
      });
      
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
      ErrorHandler.sendInternalError(reply, 'Failed to create user');
    }
  });

  // POST /api/v1/auth/login - Login with credentials
  server.post('/api/v1/auth/login', {
    schema: loginSchema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { handle, password } = request.body as { handle: string; password: string };

    const user = await userRepository.getUserByHandle(handle);
    
    if (!user) {
      ErrorHandler.sendUnauthorizedError(reply, 'Invalid credentials');
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      ErrorHandler.sendUnauthorizedError(reply, 'Invalid credentials');
      return;
    }

    userRepository.updateLastLogin(user.id);

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
    schema: refreshTokenSchema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { token: oldToken } = request.body as { token: string };
    
    try {
      const payload = jwtUtil.verifyToken(oldToken);
      
      const newToken = jwtUtil.generateToken({
        userId: payload.userId,
        handle: payload.handle,
        accessLevel: payload.accessLevel,
      });
      
      return { token: newToken };
    } catch (error) {
      ErrorHandler.sendUnauthorizedError(reply, error instanceof Error ? error.message : 'Invalid token');
    }
  });

  // GET /api/v1/auth/me - Get current user
  server.get('/api/v1/auth/me', { 
    schema: getMeSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    const userId = (request as any).user.id;
    const user = ErrorHandler.checkResourceExists(reply, userRepository.findById(userId), 'User');
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
      preferences: user.preferences,
    };
  });

  // Legacy login endpoint (for control panel authentication)
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
      reply.status(400).send({ error: 'Handle and password required' });
      return;
    }

    const user = await userRepository.getUserByHandle(handle);
    
    if (!user) {
      reply.status(401).send({ error: 'Invalid credentials' });
      return;
    }

    if (user.accessLevel < 255) {
      reply.status(403).send({ error: 'SysOp access required' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      reply.status(401).send({ error: 'Invalid credentials' });
      return;
    }

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
