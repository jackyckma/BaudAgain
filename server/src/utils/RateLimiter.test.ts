/**
 * Unit tests for RateLimiter utility
 * 
 * Tests rate limit enforcement, remaining requests, and reset times.
 * Requirements: 15.1, 15.2, 15.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter } from './RateLimiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rate limit enforcement', () => {
    it('should allow requests under the limit', () => {
      const limiter = new RateLimiter(5, 60000); // 5 requests per minute
      const userId = 'user1';

      // First 5 requests should be allowed
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
    });

    it('should block requests over the limit', () => {
      const limiter = new RateLimiter(3, 60000); // 3 requests per minute
      const userId = 'user1';

      // First 3 requests allowed
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);

      // 4th request should be blocked
      expect(limiter.isAllowed(userId)).toBe(false);
      expect(limiter.isAllowed(userId)).toBe(false);
    });

    it('should reset after time window expires', () => {
      const limiter = new RateLimiter(2, 60000); // 2 requests per minute
      const userId = 'user1';

      // Use up the limit
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(60001);

      // Should be allowed again
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
    });

    it('should track limits independently per user', () => {
      const limiter = new RateLimiter(2, 60000);
      const user1 = 'user1';
      const user2 = 'user2';

      // User 1 uses their limit
      expect(limiter.isAllowed(user1)).toBe(true);
      expect(limiter.isAllowed(user1)).toBe(true);
      expect(limiter.isAllowed(user1)).toBe(false);

      // User 2 should still have their full limit
      expect(limiter.isAllowed(user2)).toBe(true);
      expect(limiter.isAllowed(user2)).toBe(true);
      expect(limiter.isAllowed(user2)).toBe(false);
    });

    it('should handle login attempt rate limiting (Requirement 15.1)', () => {
      const limiter = new RateLimiter(5, 60000); // 5 attempts per session
      const sessionId = 'session123';

      // Allow 5 login attempts
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed(sessionId)).toBe(true);
      }

      // 6th attempt should be blocked
      expect(limiter.isAllowed(sessionId)).toBe(false);
    });

    it('should handle message posting rate limiting (Requirement 15.2)', () => {
      const limiter = new RateLimiter(30, 3600000); // 30 messages per hour
      const userId = 'user1';

      // Allow 30 messages
      for (let i = 0; i < 30; i++) {
        expect(limiter.isAllowed(userId)).toBe(true);
      }

      // 31st message should be blocked
      expect(limiter.isAllowed(userId)).toBe(false);
    });

    it('should handle AI door game rate limiting (Requirement 15.3)', () => {
      const limiter = new RateLimiter(10, 60000); // 10 requests per minute
      const userId = 'user1';

      // Allow 10 AI requests
      for (let i = 0; i < 10; i++) {
        expect(limiter.isAllowed(userId)).toBe(true);
      }

      // 11th request should be blocked
      expect(limiter.isAllowed(userId)).toBe(false);
    });
  });

  describe('Remaining requests tracking', () => {
    it('should return correct remaining count', () => {
      const limiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      expect(limiter.getRemaining(userId)).toBe(5);

      limiter.isAllowed(userId);
      expect(limiter.getRemaining(userId)).toBe(4);

      limiter.isAllowed(userId);
      expect(limiter.getRemaining(userId)).toBe(3);

      limiter.isAllowed(userId);
      expect(limiter.getRemaining(userId)).toBe(2);
    });

    it('should return 0 when limit is exhausted', () => {
      const limiter = new RateLimiter(2, 60000);
      const userId = 'user1';

      limiter.isAllowed(userId);
      limiter.isAllowed(userId);

      expect(limiter.getRemaining(userId)).toBe(0);
    });

    it('should return max requests for new users', () => {
      const limiter = new RateLimiter(10, 60000);
      const userId = 'newUser';

      expect(limiter.getRemaining(userId)).toBe(10);
    });

    it('should reset remaining count after window expires', () => {
      const limiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      limiter.isAllowed(userId);
      limiter.isAllowed(userId);
      expect(limiter.getRemaining(userId)).toBe(3);

      vi.advanceTimersByTime(60001);

      expect(limiter.getRemaining(userId)).toBe(5);
    });
  });

  describe('Reset time tracking', () => {
    it('should return correct reset time in seconds', () => {
      const limiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      limiter.isAllowed(userId);

      // Should be approximately 60 seconds
      const resetTime = limiter.getResetTime(userId);
      expect(resetTime).toBeGreaterThanOrEqual(59);
      expect(resetTime).toBeLessThanOrEqual(60);
    });

    it('should decrease reset time as time passes', () => {
      const limiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      limiter.isAllowed(userId);

      const initialReset = limiter.getResetTime(userId);
      
      vi.advanceTimersByTime(30000); // 30 seconds

      const laterReset = limiter.getResetTime(userId);
      expect(laterReset).toBeLessThan(initialReset);
      expect(laterReset).toBeGreaterThanOrEqual(29);
      expect(laterReset).toBeLessThanOrEqual(30);
    });

    it('should return 0 for new users', () => {
      const limiter = new RateLimiter(5, 60000);
      const userId = 'newUser';

      expect(limiter.getResetTime(userId)).toBe(0);
    });

    it('should return 0 after window expires', () => {
      const limiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      limiter.isAllowed(userId);
      expect(limiter.getResetTime(userId)).toBeGreaterThan(0);

      vi.advanceTimersByTime(60001);

      expect(limiter.getResetTime(userId)).toBe(0);
    });
  });

  describe('Manual reset', () => {
    it('should allow manual reset of user limit', () => {
      const limiter = new RateLimiter(2, 60000);
      const userId = 'user1';

      // Use up the limit
      limiter.isAllowed(userId);
      limiter.isAllowed(userId);
      expect(limiter.isAllowed(userId)).toBe(false);

      // Manual reset
      limiter.reset(userId);

      // Should be allowed again
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.getRemaining(userId)).toBe(1);
    });

    it('should not affect other users when resetting', () => {
      const limiter = new RateLimiter(2, 60000);
      const user1 = 'user1';
      const user2 = 'user2';

      // Both users use their limits
      limiter.isAllowed(user1);
      limiter.isAllowed(user1);
      limiter.isAllowed(user2);
      limiter.isAllowed(user2);

      // Reset user1
      limiter.reset(user1);

      // User1 should be reset, user2 should not
      expect(limiter.isAllowed(user1)).toBe(true);
      expect(limiter.isAllowed(user2)).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired entries', () => {
      const limiter = new RateLimiter(5, 60000);
      const user1 = 'user1';
      const user2 = 'user2';

      // Create entries for both users
      limiter.isAllowed(user1);
      limiter.isAllowed(user2);

      // Advance time to expire user1's entry
      vi.advanceTimersByTime(60001);

      // Trigger cleanup (runs every minute)
      vi.advanceTimersByTime(60000);

      // Both should have fresh limits now
      expect(limiter.getRemaining(user1)).toBe(5);
      expect(limiter.getRemaining(user2)).toBe(5);
    });
  });

  describe('Different rate limit configurations', () => {
    it('should handle short time windows', () => {
      const limiter = new RateLimiter(3, 1000); // 3 requests per second
      const userId = 'user1';

      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(limiter.isAllowed(userId)).toBe(true);
    });

    it('should handle long time windows', () => {
      const limiter = new RateLimiter(100, 3600000); // 100 requests per hour
      const userId = 'user1';

      // Use 50 requests
      for (let i = 0; i < 50; i++) {
        expect(limiter.isAllowed(userId)).toBe(true);
      }

      expect(limiter.getRemaining(userId)).toBe(50);

      // Advance 30 minutes (not enough to reset)
      vi.advanceTimersByTime(1800000);

      expect(limiter.getRemaining(userId)).toBe(50);

      // Advance another 31 minutes (total > 1 hour)
      vi.advanceTimersByTime(1860000);

      expect(limiter.getRemaining(userId)).toBe(100);
    });

    it('should handle very restrictive limits', () => {
      const limiter = new RateLimiter(1, 60000); // 1 request per minute
      const userId = 'user1';

      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(false);
      expect(limiter.isAllowed(userId)).toBe(false);

      vi.advanceTimersByTime(60001);

      expect(limiter.isAllowed(userId)).toBe(true);
      expect(limiter.isAllowed(userId)).toBe(false);
    });
  });
});
