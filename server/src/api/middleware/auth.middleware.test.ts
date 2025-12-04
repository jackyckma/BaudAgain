/**
 * Authentication Middleware Unit Tests
 * 
 * Tests for JWT authentication middleware behavior on protected routes.
 * Requirements: 15.6 (Security)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { JWTUtil } from '../../auth/jwt.js';
import { 
  createAuthMiddleware, 
  createUserAuthMiddleware, 
  createSysOpAuthMiddleware 
} from './auth.middleware.js';

describe('Authentication Middleware', () => {
  let server: FastifyInstance;
  let jwtUtil: JWTUtil;
  const testSecret = 'test-secret-for-middleware-testing';

  beforeEach(async () => {
    server = Fastify();
    jwtUtil = new JWTUtil({ 
      secret: testSecret,
      expiresIn: '1h'
    });
  });

  afterEach(async () => {
    await server.close();
  });

  describe('User Authentication Middleware', () => {
    beforeEach(async () => {
      const userAuthMiddleware = createUserAuthMiddleware(jwtUtil);

      server.get('/protected', {
        preHandler: userAuthMiddleware
      }, async (request) => {
        return { 
          message: 'Access granted',
          user: (request as any).user
        };
      });

      await server.ready();
    });

    it('should allow access with valid token', async () => {
      const token = jwtUtil.generateToken({
        userId: 'user-123',
        handle: 'testuser',
        accessLevel: 10,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.message).toBe('Access granted');
      expect(data.user.id).toBe('user-123');
      expect(data.user.handle).toBe('testuser');
      expect(data.user.accessLevel).toBe(10);
    });

    it('should allow access for regular user', async () => {
      const token = jwtUtil.generateToken({
        userId: 'regular-user',
        handle: 'regularuser',
        accessLevel: 10,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow access for admin user', async () => {
      const token = jwtUtil.generateToken({
        userId: 'admin-user',
        handle: 'admin',
        accessLevel: 255,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should reject request without authorization header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Missing or invalid authorization header');
    });

    it('should reject request with Bearer but no token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer ',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Invalid token');
    });

    it('should reject request with expired token', async () => {
      const expiredUtil = new JWTUtil({ 
        secret: testSecret,
        expiresIn: '1ms'
      });

      const token = expiredUtil.generateToken({
        userId: 'user-expired',
        handle: 'expireduser',
        accessLevel: 10,
      });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Token expired');
    });

    it('should reject token signed with different secret', async () => {
      const differentUtil = new JWTUtil({ 
        secret: 'different-secret-key',
        expiresIn: '1h'
      });

      const token = differentUtil.generateToken({
        userId: 'user-diff',
        handle: 'diffuser',
        accessLevel: 10,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Invalid token');
    });

    it('should include timestamp in error response', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.timestamp).toBeDefined();
      
      // Verify timestamp is valid ISO string
      const timestamp = new Date(data.error.timestamp);
      expect(timestamp.toISOString()).toBe(data.error.timestamp);
    });

    it('should attach user info to request object', async () => {
      const token = jwtUtil.generateToken({
        userId: 'user-attach',
        handle: 'attachuser',
        accessLevel: 50,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('user-attach');
      expect(data.user.handle).toBe('attachuser');
      expect(data.user.accessLevel).toBe(50);
    });
  });

  describe('SysOp Authentication Middleware', () => {
    beforeEach(async () => {
      const sysopAuthMiddleware = createSysOpAuthMiddleware(jwtUtil);

      server.get('/admin', {
        preHandler: sysopAuthMiddleware
      }, async (request) => {
        return { 
          message: 'Admin access granted',
          user: (request as any).user
        };
      });

      await server.ready();
    });

    it('should allow access for SysOp (access level 255)', async () => {
      const token = jwtUtil.generateToken({
        userId: 'admin-user',
        handle: 'admin',
        accessLevel: 255,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/admin',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.message).toBe('Admin access granted');
      expect(data.user.accessLevel).toBe(255);
    });

    it('should reject regular user (access level < 255)', async () => {
      const token = jwtUtil.generateToken({
        userId: 'regular-user',
        handle: 'regularuser',
        accessLevel: 10,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/admin',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toBe('SysOp access required');
    });

    it('should reject user with high but not max access level', async () => {
      const token = jwtUtil.generateToken({
        userId: 'high-user',
        handle: 'highuser',
        accessLevel: 254,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/admin',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toBe('SysOp access required');
    });

    it('should reject request without authorization header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/admin',
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/admin',
        headers: {
          authorization: 'Bearer invalid.token',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with expired token even for admin', async () => {
      const expiredUtil = new JWTUtil({ 
        secret: testSecret,
        expiresIn: '1ms'
      });

      const token = expiredUtil.generateToken({
        userId: 'admin-expired',
        handle: 'adminexpired',
        accessLevel: 255,
      });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await server.inject({
        method: 'GET',
        url: '/admin',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Token expired');
    });
  });

  describe('Custom Auth Middleware Options', () => {
    it('should support custom requireSysOp option', async () => {
      const customMiddleware = createAuthMiddleware(jwtUtil, { 
        requireSysOp: true 
      });

      server.get('/custom', {
        preHandler: customMiddleware
      }, async () => {
        return { message: 'Custom protected' };
      });

      await server.ready();

      // Regular user should be rejected
      const regularToken = jwtUtil.generateToken({
        userId: 'regular',
        handle: 'regular',
        accessLevel: 10,
      });

      const regularResponse = await server.inject({
        method: 'GET',
        url: '/custom',
        headers: {
          authorization: `Bearer ${regularToken}`,
        },
      });

      expect(regularResponse.statusCode).toBe(403);

      // Admin should be allowed
      const adminToken = jwtUtil.generateToken({
        userId: 'admin',
        handle: 'admin',
        accessLevel: 255,
      });

      const adminResponse = await server.inject({
        method: 'GET',
        url: '/custom',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(adminResponse.statusCode).toBe(200);
    });

    it('should allow any authenticated user when requireSysOp is false', async () => {
      const customMiddleware = createAuthMiddleware(jwtUtil, { 
        requireSysOp: false 
      });

      server.get('/any-user', {
        preHandler: customMiddleware
      }, async () => {
        return { message: 'Any user allowed' };
      });

      await server.ready();

      const token = jwtUtil.generateToken({
        userId: 'any-user',
        handle: 'anyuser',
        accessLevel: 1,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/any-user',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Multiple Protected Routes', () => {
    beforeEach(async () => {
      const userAuth = createUserAuthMiddleware(jwtUtil);
      const sysopAuth = createSysOpAuthMiddleware(jwtUtil);

      server.get('/user-route', {
        preHandler: userAuth
      }, async () => {
        return { route: 'user' };
      });

      server.get('/admin-route', {
        preHandler: sysopAuth
      }, async () => {
        return { route: 'admin' };
      });

      await server.ready();
    });

    it('should handle different middleware on different routes', async () => {
      const userToken = jwtUtil.generateToken({
        userId: 'user',
        handle: 'user',
        accessLevel: 10,
      });

      const adminToken = jwtUtil.generateToken({
        userId: 'admin',
        handle: 'admin',
        accessLevel: 255,
      });

      // User can access user route
      const userResponse = await server.inject({
        method: 'GET',
        url: '/user-route',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });
      expect(userResponse.statusCode).toBe(200);

      // User cannot access admin route
      const userAdminResponse = await server.inject({
        method: 'GET',
        url: '/admin-route',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });
      expect(userAdminResponse.statusCode).toBe(403);

      // Admin can access both routes
      const adminUserResponse = await server.inject({
        method: 'GET',
        url: '/user-route',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(adminUserResponse.statusCode).toBe(200);

      const adminAdminResponse = await server.inject({
        method: 'GET',
        url: '/admin-route',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(adminAdminResponse.statusCode).toBe(200);
    });
  });
});
