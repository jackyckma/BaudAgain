/**
 * JWT Authentication Unit Tests
 * 
 * Tests for JWT token generation, verification, and middleware behavior.
 * Requirements: 15.6 (Security)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JWTUtil } from './jwt.js';
import jwt from 'jsonwebtoken';

describe('JWT Authentication', () => {
  let jwtUtil: JWTUtil;
  const testSecret = 'test-secret-key-for-jwt-testing-only';

  beforeEach(() => {
    jwtUtil = new JWTUtil({ 
      secret: testSecret,
      expiresIn: '1h'
    });
  });

  describe('JWTUtil Constructor', () => {
    it('should throw error if secret is not provided', () => {
      expect(() => {
        new JWTUtil({ secret: '' });
      }).toThrow('JWT_SECRET must be set in environment variables');
    });

    it('should throw error if secret is default placeholder', () => {
      expect(() => {
        new JWTUtil({ secret: 'your_jwt_secret_here_change_in_production' });
      }).toThrow('JWT_SECRET must be set in environment variables');
    });

    it('should accept valid secret', () => {
      expect(() => {
        new JWTUtil({ secret: 'valid-secret-key' });
      }).not.toThrow();
    });

    it('should use default expiration if not provided', () => {
      const util = new JWTUtil({ secret: 'test-secret' });
      const token = util.generateToken({
        userId: 'test-user',
        handle: 'testuser',
        accessLevel: 10,
      });
      
      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token with user data', () => {
      const payload = {
        userId: 'user-123',
        handle: 'testuser',
        accessLevel: 10,
      };

      const token = jwtUtil.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user payload in token', () => {
      const payload = {
        userId: 'user-456',
        handle: 'anotheruser',
        accessLevel: 255,
      };

      const token = jwtUtil.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe('user-456');
      expect(decoded.handle).toBe('anotheruser');
      expect(decoded.accessLevel).toBe(255);
    });

    it('should include issuer and audience claims', () => {
      const payload = {
        userId: 'user-789',
        handle: 'testuser',
        accessLevel: 10,
      };

      const token = jwtUtil.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.iss).toBe('baudagain-bbs');
      expect(decoded.aud).toBe('baudagain-api');
    });

    it('should include expiration time', () => {
      const payload = {
        userId: 'user-exp',
        handle: 'expuser',
        accessLevel: 10,
      };

      const token = jwtUtil.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should generate different tokens for same payload at different times', async () => {
      const payload = {
        userId: 'user-same',
        handle: 'sameuser',
        accessLevel: 10,
      };

      const token1 = jwtUtil.generateToken(payload);
      
      // Wait to ensure different iat (issued at) timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const token2 = jwtUtil.generateToken(payload);

      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Verification - Valid Tokens', () => {
    it('should verify valid token and return payload', () => {
      const payload = {
        userId: 'user-verify',
        handle: 'verifyuser',
        accessLevel: 50,
      };

      const token = jwtUtil.generateToken(payload);
      const verified = jwtUtil.verifyToken(token);

      expect(verified.userId).toBe('user-verify');
      expect(verified.handle).toBe('verifyuser');
      expect(verified.accessLevel).toBe(50);
    });

    it('should verify token with different access levels', () => {
      const adminPayload = {
        userId: 'admin-user',
        handle: 'admin',
        accessLevel: 255,
      };

      const token = jwtUtil.generateToken(adminPayload);
      const verified = jwtUtil.verifyToken(token);

      expect(verified.accessLevel).toBe(255);
    });

    it('should verify token with special characters in handle', () => {
      const payload = {
        userId: 'user-special',
        handle: 'test_user-123',
        accessLevel: 10,
      };

      const token = jwtUtil.generateToken(payload);
      const verified = jwtUtil.verifyToken(token);

      expect(verified.handle).toBe('test_user-123');
    });
  });

  describe('Token Verification - Invalid Tokens', () => {
    it('should reject token with invalid signature', () => {
      const payload = {
        userId: 'user-invalid',
        handle: 'invaliduser',
        accessLevel: 10,
      };

      const token = jwtUtil.generateToken(payload);
      
      // Tamper with the token by changing the last character
      const tamperedToken = token.slice(0, -1) + 'X';

      expect(() => {
        jwtUtil.verifyToken(tamperedToken);
      }).toThrow('Invalid token');
    });

    it('should reject malformed token', () => {
      expect(() => {
        jwtUtil.verifyToken('not.a.valid.jwt.token');
      }).toThrow('Invalid token');
    });

    it('should reject empty token', () => {
      expect(() => {
        jwtUtil.verifyToken('');
      }).toThrow('Invalid token');
    });

    it('should reject token signed with different secret', () => {
      const differentUtil = new JWTUtil({ 
        secret: 'different-secret-key',
        expiresIn: '1h'
      });

      const payload = {
        userId: 'user-diff',
        handle: 'diffuser',
        accessLevel: 10,
      };

      const token = differentUtil.generateToken(payload);

      expect(() => {
        jwtUtil.verifyToken(token);
      }).toThrow('Invalid token');
    });

    it('should reject token with wrong issuer', () => {
      const token = jwt.sign(
        { userId: 'user-123', handle: 'test', accessLevel: 10 },
        testSecret,
        { issuer: 'wrong-issuer', audience: 'baudagain-api' }
      );

      expect(() => {
        jwtUtil.verifyToken(token);
      }).toThrow('Invalid token');
    });

    it('should reject token with wrong audience', () => {
      const token = jwt.sign(
        { userId: 'user-123', handle: 'test', accessLevel: 10 },
        testSecret,
        { issuer: 'baudagain-bbs', audience: 'wrong-audience' }
      );

      expect(() => {
        jwtUtil.verifyToken(token);
      }).toThrow('Invalid token');
    });
  });

  describe('Token Verification - Expired Tokens', () => {
    it('should reject expired token', () => {
      const shortLivedUtil = new JWTUtil({ 
        secret: testSecret,
        expiresIn: '1ms' // Very short expiration
      });

      const payload = {
        userId: 'user-expired',
        handle: 'expireduser',
        accessLevel: 10,
      };

      const token = shortLivedUtil.generateToken(payload);

      // Wait for token to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(() => {
            jwtUtil.verifyToken(token);
          }).toThrow('Token expired');
          resolve();
        }, 10);
      });
    });

    it('should reject manually expired token', () => {
      // Create a token that's already expired
      const expiredToken = jwt.sign(
        { 
          userId: 'user-manual-exp',
          handle: 'manualexp',
          accessLevel: 10
        },
        testSecret,
        { 
          expiresIn: -1, // Already expired
          issuer: 'baudagain-bbs',
          audience: 'baudagain-api'
        }
      );

      expect(() => {
        jwtUtil.verifyToken(expiredToken);
      }).toThrow('Token expired');
    });
  });

  describe('Token Decoding', () => {
    it('should decode valid token without verification', () => {
      const payload = {
        userId: 'user-decode',
        handle: 'decodeuser',
        accessLevel: 75,
      };

      const token = jwtUtil.generateToken(payload);
      const decoded = jwtUtil.decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-decode');
      expect(decoded?.handle).toBe('decodeuser');
      expect(decoded?.accessLevel).toBe(75);
    });

    it('should decode token even if signature is invalid', () => {
      const payload = {
        userId: 'user-tampered',
        handle: 'tampereduser',
        accessLevel: 10,
      };

      const token = jwtUtil.generateToken(payload);
      const tamperedToken = token.slice(0, -1) + 'X';
      
      const decoded = jwtUtil.decodeToken(tamperedToken);

      // Decode should still work (it doesn't verify)
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-tampered');
    });

    it('should return null for malformed token', () => {
      const decoded = jwtUtil.decodeToken('not-a-valid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = jwtUtil.decodeToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('Token Expiration Handling', () => {
    it('should respect custom expiration time', () => {
      const customUtil = new JWTUtil({ 
        secret: testSecret,
        expiresIn: '2h'
      });

      const payload = {
        userId: 'user-custom',
        handle: 'customuser',
        accessLevel: 10,
      };

      const token = customUtil.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const twoHours = 2 * 60 * 60;
      
      // Token should expire approximately 2 hours from now
      expect(decoded.exp).toBeGreaterThan(now + twoHours - 10);
      expect(decoded.exp).toBeLessThan(now + twoHours + 10);
    });

    it('should accept numeric expiration in seconds', () => {
      const numericUtil = new JWTUtil({ 
        secret: testSecret,
        expiresIn: 3600 // 1 hour in seconds
      });

      const payload = {
        userId: 'user-numeric',
        handle: 'numericuser',
        accessLevel: 10,
      };

      const token = numericUtil.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      
      expect(decoded.exp).toBeGreaterThan(now + 3590);
      expect(decoded.exp).toBeLessThan(now + 3610);
    });
  });
});
