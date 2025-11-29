/**
 * Rate Limiter Utility
 * 
 * Simple in-memory rate limiter for tracking requests per user.
 * Used for AI requests in door games.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  /**
   * Check if a request is allowed
   * @param key - Unique identifier (e.g., userId)
   * @returns true if allowed, false if rate limit exceeded
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // No entry or expired - allow and create new entry
    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    // Check if under limit
    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }
    
    // Rate limit exceeded
    return false;
  }
  
  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now >= entry.resetTime) {
      return this.maxRequests;
    }
    
    return Math.max(0, this.maxRequests - entry.count);
  }
  
  /**
   * Get time until reset in seconds
   */
  getResetTime(key: string): number {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now >= entry.resetTime) {
      return 0;
    }
    
    return Math.ceil((entry.resetTime - now) / 1000);
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
  
  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
}
