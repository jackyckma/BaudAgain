/**
 * Authentication Middleware
 * 
 * Consolidated authentication middleware for REST API.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTUtil } from '../../auth/jwt.js';
import type { AuthMiddlewareOptions } from '../types.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(jwtUtil: JWTUtil, options: AuthMiddlewareOptions = {}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ErrorHandler.sendUnauthorizedError(reply, 'Missing or invalid authorization header');
      return;
    }

    const token = authHeader.substring(7);

    try {
      // Verify JWT token
      const payload = jwtUtil.verifyToken(token);

      // Check SysOp requirement if specified
      if (options.requireSysOp && payload.accessLevel < 255) {
        ErrorHandler.sendForbiddenError(reply, 'SysOp access required');
        return;
      }

      // Attach user info to request
      (request as any).user = {
        id: payload.userId,
        handle: payload.handle,
        accessLevel: payload.accessLevel,
      };
    } catch (error) {
      let message = 'Authentication failed';

      if (error instanceof Error) {
        if (error.message === 'Token expired') {
          message = 'Token expired';
        } else if (error.message === 'Invalid token') {
          message = 'Invalid token';
        }
      }

      ErrorHandler.sendUnauthorizedError(reply, message);
      return;
    }
  };
}

/**
 * Create user authentication middleware (any authenticated user)
 */
export function createUserAuthMiddleware(jwtUtil: JWTUtil) {
  return createAuthMiddleware(jwtUtil, { requireSysOp: false });
}

/**
 * Create SysOp authentication middleware (admin only)
 */
export function createSysOpAuthMiddleware(jwtUtil: JWTUtil) {
  return createAuthMiddleware(jwtUtil, { requireSysOp: true });
}
