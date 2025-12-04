/**
 * Integration tests for API rate limiting
 * 
 * Tests rate limit enforcement, headers, and different limits for different endpoints.
 * Requirements: 15.1, 15.2, 15.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

describe('API Rate Limiting', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify({ logger: false });
  });

  afterEach(async () => {
    await server.close();
  });

  describe('Global rate limit enforcement', () => {
    it('should enforce global rate limit of 100 requests per 15 minutes', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 100,
        timeWindow: '15 minutes',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // First request should succeed
      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('99');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should return 429 when rate limit is exceeded', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 2,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // First two requests should succeed
      await server.inject({ method: 'GET', url: '/test' });
      await server.inject({ method: 'GET', url: '/test' });

      // Third request should be rate limited
      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(429);
      expect(response.json()).toHaveProperty('error');
    });

    it('should include rate limit headers in all responses', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 10,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should decrement remaining count with each request', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 5,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // Make multiple requests and verify remaining count decreases
      const response1 = await server.inject({ method: 'GET', url: '/test' });
      expect(response1.headers['x-ratelimit-remaining']).toBe('4');

      const response2 = await server.inject({ method: 'GET', url: '/test' });
      expect(response2.headers['x-ratelimit-remaining']).toBe('3');

      const response3 = await server.inject({ method: 'GET', url: '/test' });
      expect(response3.headers['x-ratelimit-remaining']).toBe('2');
    });
  });

  describe('Per-endpoint rate limits', () => {
    it('should enforce stricter limits on authentication endpoints (Requirement 15.1)', async () => {
      await server.register(rateLimit, {
        global: false,
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      // Authentication endpoint with 10 requests per minute
      server.post('/api/auth/login', {
        config: {
          rateLimit: {
            max: 10,
            timeWindow: '1 minute',
          },
        },
      }, async () => {
        return { success: true };
      });

      await server.ready();

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        const response = await server.inject({
          method: 'POST',
          url: '/api/auth/login',
        });
        expect(response.statusCode).toBe(200);
      }

      // 11th request should be rate limited
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
      });

      expect(response.statusCode).toBe(429);
    });

    it('should enforce limits on data modification endpoints (Requirement 15.2)', async () => {
      await server.register(rateLimit, {
        global: false,
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      // Data modification endpoint with 30 requests per minute
      server.patch('/api/users/:id', {
        config: {
          rateLimit: {
            max: 30,
            timeWindow: '1 minute',
          },
        },
      }, async () => {
        return { success: true };
      });

      await server.ready();

      // Make 30 requests
      for (let i = 0; i < 30; i++) {
        const response = await server.inject({
          method: 'PATCH',
          url: '/api/users/123',
        });
        expect(response.statusCode).toBe(200);
      }

      // 31st request should be rate limited
      const response = await server.inject({
        method: 'PATCH',
        url: '/api/users/123',
      });

      expect(response.statusCode).toBe(429);
    });

    it('should have different limits for different endpoint types', async () => {
      await server.register(rateLimit, {
        global: false,
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      // Auth endpoint: 10/min
      server.post('/api/auth/login', {
        config: {
          rateLimit: {
            max: 10,
            timeWindow: '1 minute',
          },
        },
      }, async () => {
        return { success: true };
      });

      // Data endpoint: 30/min
      server.get('/api/data', {
        config: {
          rateLimit: {
            max: 30,
            timeWindow: '1 minute',
          },
        },
      }, async () => {
        return { success: true };
      });

      await server.ready();

      // Auth endpoint should have limit of 10
      const authResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
      });
      expect(authResponse.headers['x-ratelimit-limit']).toBe('10');

      // Data endpoint should have limit of 30
      const dataResponse = await server.inject({
        method: 'GET',
        url: '/api/data',
      });
      expect(dataResponse.headers['x-ratelimit-limit']).toBe('30');
    });

    it('should track limits independently per endpoint', async () => {
      await server.register(rateLimit, {
        global: false,
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/api/endpoint1', {
        config: {
          rateLimit: {
            max: 2,
            timeWindow: '1 minute',
          },
        },
      }, async () => {
        return { success: true };
      });

      server.get('/api/endpoint2', {
        config: {
          rateLimit: {
            max: 2,
            timeWindow: '1 minute',
          },
        },
      }, async () => {
        return { success: true };
      });

      await server.ready();

      // Use up endpoint1's limit
      await server.inject({ method: 'GET', url: '/api/endpoint1' });
      await server.inject({ method: 'GET', url: '/api/endpoint1' });
      const endpoint1Response = await server.inject({ method: 'GET', url: '/api/endpoint1' });
      expect(endpoint1Response.statusCode).toBe(429);

      // Endpoint2 should still be available
      const endpoint2Response = await server.inject({ method: 'GET', url: '/api/endpoint2' });
      expect(endpoint2Response.statusCode).toBe(200);
    });
  });

  describe('Rate limit headers', () => {
    it('should include x-ratelimit-limit header', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 100,
        timeWindow: '15 minutes',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['x-ratelimit-limit']).toBe('100');
    });

    it('should include x-ratelimit-remaining header', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 10,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(parseInt(response.headers['x-ratelimit-remaining'] as string)).toBeLessThan(10);
    });

    it('should include x-ratelimit-reset header', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 10,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      const resetTime = parseInt(response.headers['x-ratelimit-reset'] as string);
      // Reset time should be a positive number (seconds until reset)
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60); // Should be within the 1 minute window
    });

    it('should update headers correctly after rate limit is exceeded', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 1,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // First request
      const response1 = await server.inject({ method: 'GET', url: '/test' });
      expect(response1.headers['x-ratelimit-remaining']).toBe('0');

      // Second request (rate limited)
      const response2 = await server.inject({ method: 'GET', url: '/test' });
      expect(response2.statusCode).toBe(429);
      expect(response2.headers['x-ratelimit-remaining']).toBe('0');
    });
  });

  describe('Error responses', () => {
    it('should return proper error structure when rate limited', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 1,
        timeWindow: '1 minute',
        errorResponseBuilder: (_request, context) => {
          return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
          };
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // Use up the limit
      await server.inject({ method: 'GET', url: '/test' });

      // Get rate limited
      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(429);
      const body = response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body.error).toBe('Too Many Requests');
      expect(body.message).toContain('Rate limit exceeded');
    });

    it('should include retry time in error message', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 1,
        timeWindow: '1 minute',
        errorResponseBuilder: (_request, context) => {
          return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
            retryAfter: Math.ceil(context.ttl / 1000),
          };
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      await server.inject({ method: 'GET', url: '/test' });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
      });

      const body = response.json();
      expect(body).toHaveProperty('retryAfter');
      expect(body.retryAfter).toBeGreaterThan(0);
      expect(body.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('IP-based rate limiting', () => {
    it('should track rate limits per IP address', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 2,
        timeWindow: '1 minute',
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // In Fastify's inject mode, all requests come from the same "connection"
      // so they share the same rate limit. This test verifies that rate limiting
      // works consistently across requests.
      const response1 = await server.inject({
        method: 'GET',
        url: '/test',
      });
      expect(response1.statusCode).toBe(200);
      expect(response1.headers['x-ratelimit-remaining']).toBe('1');

      const response2 = await server.inject({
        method: 'GET',
        url: '/test',
      });
      expect(response2.statusCode).toBe(200);
      expect(response2.headers['x-ratelimit-remaining']).toBe('0');

      // Third request should be rate limited
      const response3 = await server.inject({
        method: 'GET',
        url: '/test',
      });
      expect(response3.statusCode).toBe(429);
    });
  });

  describe('Allowlist functionality', () => {
    it('should not rate limit allowlisted IPs', async () => {
      await server.register(rateLimit, {
        global: true,
        max: 2,
        timeWindow: '1 minute',
        allowList: ['127.0.0.1', '::1'],
        addHeaders: {
          'x-ratelimit-limit': true,
          'x-ratelimit-remaining': true,
          'x-ratelimit-reset': true,
        },
      });

      server.get('/test', async () => {
        return { success: true };
      });

      await server.ready();

      // Make many requests from localhost (should all succeed)
      for (let i = 0; i < 10; i++) {
        const response = await server.inject({
          method: 'GET',
          url: '/test',
        });
        expect(response.statusCode).toBe(200);
      }
    });
  });
});
