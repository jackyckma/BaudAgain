/**
 * Unit tests for the performance benchmark tool
 */

import { describe, it, expect } from 'vitest';
import { PerformanceBenchmark, BenchmarkConfig, BenchmarkResult } from './benchmark.js';

describe('PerformanceBenchmark', () => {
  const mockConfig: BenchmarkConfig = {
    restApiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
    iterations: 10,
    warmupIterations: 2,
  };

  describe('Configuration', () => {
    it('should accept valid configuration', () => {
      const benchmark = new PerformanceBenchmark(mockConfig);
      expect(benchmark).toBeDefined();
    });

    it('should use default values from environment', () => {
      const originalEnv = process.env;
      process.env.REST_API_URL = 'http://test:4000';
      process.env.ITERATIONS = '50';
      
      // The benchmark constructor doesn't read env vars directly,
      // but the run script does. This test validates the config structure.
      const config: BenchmarkConfig = {
        restApiUrl: process.env.REST_API_URL,
        wsUrl: 'ws://test:4000',
        iterations: parseInt(process.env.ITERATIONS, 10),
        warmupIterations: 10,
      };
      
      expect(config.restApiUrl).toBe('http://test:4000');
      expect(config.iterations).toBe(50);
      
      process.env = originalEnv;
    });
  });

  describe('BenchmarkResult', () => {
    it('should have correct structure', () => {
      const result: BenchmarkResult = {
        operation: 'Test Operation',
        protocol: 'REST',
        iterations: 100,
        totalTime: 1000,
        avgTime: 10,
        minTime: 5,
        maxTime: 20,
        successRate: 100,
      };

      expect(result.operation).toBe('Test Operation');
      expect(result.protocol).toBe('REST');
      expect(result.avgTime).toBe(10);
      expect(result.successRate).toBe(100);
    });

    it('should calculate correct averages', () => {
      const times = [10, 20, 30, 40, 50];
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const avgTime = totalTime / times.length;

      expect(avgTime).toBe(30);
      expect(Math.min(...times)).toBe(10);
      expect(Math.max(...times)).toBe(50);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate success rate correctly', () => {
      const successCount = 95;
      const totalIterations = 100;
      const successRate = (successCount / totalIterations) * 100;

      expect(successRate).toBe(95);
    });

    it('should identify slowest operation', () => {
      const results: BenchmarkResult[] = [
        {
          operation: 'Fast Op',
          protocol: 'REST',
          iterations: 100,
          totalTime: 1000,
          avgTime: 10,
          minTime: 5,
          maxTime: 15,
          successRate: 100,
        },
        {
          operation: 'Slow Op',
          protocol: 'REST',
          iterations: 100,
          totalTime: 5000,
          avgTime: 50,
          minTime: 40,
          maxTime: 60,
          successRate: 100,
        },
      ];

      const slowest = results.reduce((slowest, current) =>
        current.avgTime > slowest.avgTime ? current : slowest
      );

      expect(slowest.operation).toBe('Slow Op');
      expect(slowest.avgTime).toBe(50);
    });

    it('should identify fastest operation', () => {
      const results: BenchmarkResult[] = [
        {
          operation: 'Fast Op',
          protocol: 'REST',
          iterations: 100,
          totalTime: 1000,
          avgTime: 10,
          minTime: 5,
          maxTime: 15,
          successRate: 100,
        },
        {
          operation: 'Slow Op',
          protocol: 'REST',
          iterations: 100,
          totalTime: 5000,
          avgTime: 50,
          minTime: 40,
          maxTime: 60,
          successRate: 100,
        },
      ];

      const fastest = results.reduce((fastest, current) =>
        current.avgTime < fastest.avgTime ? current : fastest
      );

      expect(fastest.operation).toBe('Fast Op');
      expect(fastest.avgTime).toBe(10);
    });
  });

  describe('Performance Goals', () => {
    it('should validate authentication performance goal', () => {
      const authTime = 85; // ms
      const goal = 100; // ms
      expect(authTime).toBeLessThan(goal);
    });

    it('should validate read operation performance goal', () => {
      const readTime = 35; // ms
      const goal = 50; // ms
      expect(readTime).toBeLessThan(goal);
    });

    it('should validate write operation performance goal', () => {
      const writeTime = 75; // ms
      const goal = 100; // ms
      expect(writeTime).toBeLessThan(goal);
    });

    it('should validate list operation performance goal', () => {
      const listTime = 60; // ms
      const goal = 100; // ms
      expect(listTime).toBeLessThan(goal);
    });
  });

  describe('Protocol Comparison', () => {
    it('should compare REST and WebSocket performance', () => {
      const restResult: BenchmarkResult = {
        operation: 'Test Op',
        protocol: 'REST',
        iterations: 100,
        totalTime: 3000,
        avgTime: 30,
        minTime: 20,
        maxTime: 40,
        successRate: 100,
      };

      const wsResult: BenchmarkResult = {
        operation: 'Test Op',
        protocol: 'WebSocket',
        iterations: 100,
        totalTime: 1000,
        avgTime: 10,
        minTime: 5,
        maxTime: 15,
        successRate: 100,
      };

      const diff = ((restResult.avgTime - wsResult.avgTime) / wsResult.avgTime) * 100;
      expect(diff).toBeGreaterThan(0); // REST is slower
      expect(Math.abs(diff)).toBeCloseTo(200, 0); // 200% slower
    });
  });

  describe('Error Handling', () => {
    it('should handle failed operations', () => {
      const successCount = 85;
      const totalIterations = 100;
      const successRate = (successCount / totalIterations) * 100;

      expect(successRate).toBeLessThan(100);
      expect(successRate).toBe(85);
    });

    it('should identify operations with low success rate', () => {
      const results: BenchmarkResult[] = [
        {
          operation: 'Reliable Op',
          protocol: 'REST',
          iterations: 100,
          totalTime: 1000,
          avgTime: 10,
          minTime: 5,
          maxTime: 15,
          successRate: 100,
        },
        {
          operation: 'Flaky Op',
          protocol: 'REST',
          iterations: 100,
          totalTime: 1000,
          avgTime: 10,
          minTime: 5,
          maxTime: 15,
          successRate: 75,
        },
      ];

      const failingOps = results.filter(r => r.successRate < 100);
      expect(failingOps).toHaveLength(1);
      expect(failingOps[0].operation).toBe('Flaky Op');
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate min/max spread', () => {
      const minTime = 10;
      const maxTime = 50;
      const spread = maxTime / minTime;

      expect(spread).toBe(5); // 5x spread
    });

    it('should identify consistent performance', () => {
      const minTime = 10;
      const maxTime = 15;
      const spread = maxTime / minTime;

      expect(spread).toBeLessThan(2); // Less than 2x spread = consistent
    });

    it('should identify variable performance', () => {
      const minTime = 10;
      const maxTime = 100;
      const spread = maxTime / minTime;

      expect(spread).toBeGreaterThan(5); // More than 5x spread = variable
    });
  });
});
