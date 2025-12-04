/**
 * Performance Benchmark: REST API vs WebSocket
 * 
 * This script benchmarks the performance of REST API endpoints
 * and compares them with WebSocket operations where applicable.
 * 
 * Requirements: 19.2 - Test all operations via REST API
 */

import { performance } from 'perf_hooks';
import WebSocket from 'ws';

interface BenchmarkResult {
  operation: string;
  protocol: 'REST' | 'WebSocket';
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
}

interface BenchmarkConfig {
  restApiUrl: string;
  wsUrl: string;
  iterations: number;
  warmupIterations: number;
}

class PerformanceBenchmark {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];
  private authToken?: string;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<void> {
    console.log('🚀 Starting Performance Benchmark: REST API vs WebSocket\n');
    console.log(`Configuration:`);
    console.log(`  REST API URL: ${this.config.restApiUrl}`);
    console.log(`  WebSocket URL: ${this.config.wsUrl}`);
    console.log(`  Iterations: ${this.config.iterations}`);
    console.log(`  Warmup: ${this.config.warmupIterations}\n`);

    // Setup: Create test user and authenticate
    await this.setup();

    // Benchmark authentication
    await this.benchmarkAuthentication();

    // Benchmark user operations
    await this.benchmarkUserOperations();

    // Benchmark message base operations
    await this.benchmarkMessageBaseOperations();

    // Benchmark message operations
    await this.benchmarkMessageOperations();

    // Print results
    this.printResults();

    // Cleanup
    await this.cleanup();
  }

  /**
   * Setup test environment
   */
  private async setup(): Promise<void> {
    console.log('📋 Setting up test environment...');
    
    // Register a test user
    const testHandle = `perftest_${Date.now()}`;
    const testPassword = 'testpass123';
    
    try {
      const response = await fetch(`${this.config.restApiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: testHandle,
          password: testPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { token: string };
        this.authToken = data.token;
        console.log(`✅ Test user created: ${testHandle}\n`);
      } else {
        // User might already exist, try to login
        const loginResponse = await fetch(`${this.config.restApiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle: testHandle,
            password: testPassword,
          }),
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json() as { token: string };
          this.authToken = data.token;
          console.log(`✅ Logged in as existing user: ${testHandle}\n`);
        } else {
          throw new Error('Failed to setup test user');
        }
      }
    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup test environment
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    // In a real scenario, we might want to delete test data
    console.log('✅ Cleanup complete');
  }

  /**
   * Benchmark authentication operations
   */
  private async benchmarkAuthentication(): Promise<void> {
    console.log('🔐 Benchmarking Authentication...');

    // REST API Login
    await this.benchmarkRestOperation(
      'Login',
      async () => {
        const response = await fetch(`${this.config.restApiUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle: `perftest_${Date.now()}`,
            password: 'testpass123',
          }),
        });
        return response.ok;
      }
    );

    // REST API Token Refresh
    await this.benchmarkRestOperation(
      'Token Refresh',
      async () => {
        const response = await fetch(`${this.config.restApiUrl}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: this.authToken,
          }),
        });
        return response.ok;
      }
    );

    // REST API Get Current User
    await this.benchmarkRestOperation(
      'Get Current User',
      async () => {
        const response = await fetch(`${this.config.restApiUrl}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });
        return response.ok;
      }
    );

    console.log('');
  }

  /**
   * Benchmark user operations
   */
  private async benchmarkUserOperations(): Promise<void> {
    console.log('👥 Benchmarking User Operations...');

    // REST API List Users
    await this.benchmarkRestOperation(
      'List Users',
      async () => {
        const response = await fetch(`${this.config.restApiUrl}/api/v1/users?page=1&limit=50`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });
        return response.ok;
      }
    );

    console.log('');
  }

  /**
   * Benchmark message base operations
   */
  private async benchmarkMessageBaseOperations(): Promise<void> {
    console.log('📁 Benchmarking Message Base Operations...');

    // REST API List Message Bases
    await this.benchmarkRestOperation(
      'List Message Bases',
      async () => {
        const response = await fetch(`${this.config.restApiUrl}/api/v1/message-bases?page=1&limit=50`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });
        return response.ok;
      }
    );

    console.log('');
  }

  /**
   * Benchmark message operations
   */
  private async benchmarkMessageOperations(): Promise<void> {
    console.log('💬 Benchmarking Message Operations...');

    // First, get a message base ID
    const basesResponse = await fetch(`${this.config.restApiUrl}/api/v1/message-bases?page=1&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!basesResponse.ok) {
      console.log('⚠️  No message bases available, skipping message operations');
      return;
    }

    const basesData = await basesResponse.json() as { messageBases: Array<{ id: string }> };
    if (!basesData.messageBases || basesData.messageBases.length === 0) {
      console.log('⚠️  No message bases available, skipping message operations');
      return;
    }

    const baseId = basesData.messageBases[0].id;

    // REST API List Messages
    await this.benchmarkRestOperation(
      'List Messages',
      async () => {
        const response = await fetch(
          `${this.config.restApiUrl}/api/v1/message-bases/${baseId}/messages?page=1&limit=50`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
          }
        );
        return response.ok;
      }
    );

    // REST API Post Message
    await this.benchmarkRestOperation(
      'Post Message',
      async () => {
        const response = await fetch(
          `${this.config.restApiUrl}/api/v1/message-bases/${baseId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subject: `Benchmark Test ${Date.now()}`,
              body: 'This is a performance test message',
            }),
          }
        );
        return response.ok;
      }
    );

    console.log('');
  }

  /**
   * Benchmark a REST API operation
   */
  private async benchmarkRestOperation(
    operationName: string,
    operation: () => Promise<boolean>
  ): Promise<void> {
    const times: number[] = [];
    let successCount = 0;

    // Warmup
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await operation();
    }

    // Actual benchmark
    for (let i = 0; i < this.config.iterations; i++) {
      const start = performance.now();
      const success = await operation();
      const end = performance.now();
      
      times.push(end - start);
      if (success) successCount++;
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successCount / this.config.iterations) * 100;

    const result: BenchmarkResult = {
      operation: operationName,
      protocol: 'REST',
      iterations: this.config.iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      successRate,
    };

    this.results.push(result);

    console.log(`  ${operationName}:`);
    console.log(`    Avg: ${avgTime.toFixed(2)}ms | Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms | Success: ${successRate.toFixed(1)}%`);
  }

  /**
   * Benchmark a WebSocket operation
   */
  private async benchmarkWebSocketOperation(
    operationName: string,
    operation: (ws: WebSocket) => Promise<boolean>
  ): Promise<void> {
    const times: number[] = [];
    let successCount = 0;

    // Create WebSocket connection
    const ws = new WebSocket(this.config.wsUrl);
    
    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve());
      ws.on('error', (error) => reject(error));
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });

    // Warmup
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await operation(ws);
    }

    // Actual benchmark
    for (let i = 0; i < this.config.iterations; i++) {
      const start = performance.now();
      const success = await operation(ws);
      const end = performance.now();
      
      times.push(end - start);
      if (success) successCount++;
    }

    ws.close();

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successCount / this.config.iterations) * 100;

    const result: BenchmarkResult = {
      operation: operationName,
      protocol: 'WebSocket',
      iterations: this.config.iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      successRate,
    };

    this.results.push(result);

    console.log(`  ${operationName} (WebSocket):`);
    console.log(`    Avg: ${avgTime.toFixed(2)}ms | Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms | Success: ${successRate.toFixed(1)}%`);
  }

  /**
   * Print benchmark results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BENCHMARK RESULTS');
    console.log('='.repeat(80) + '\n');

    // Group results by operation
    const operationGroups = new Map<string, BenchmarkResult[]>();
    for (const result of this.results) {
      if (!operationGroups.has(result.operation)) {
        operationGroups.set(result.operation, []);
      }
      operationGroups.get(result.operation)!.push(result);
    }

    // Print comparison table
    console.log('Operation'.padEnd(30) + 'Protocol'.padEnd(15) + 'Avg Time'.padEnd(15) + 'Min/Max'.padEnd(20) + 'Success Rate');
    console.log('-'.repeat(95));

    for (const [operation, results] of operationGroups) {
      for (const result of results) {
        const operationStr = operation.padEnd(30);
        const protocolStr = result.protocol.padEnd(15);
        const avgStr = `${result.avgTime.toFixed(2)}ms`.padEnd(15);
        const minMaxStr = `${result.minTime.toFixed(2)}/${result.maxTime.toFixed(2)}ms`.padEnd(20);
        const successStr = `${result.successRate.toFixed(1)}%`;
        
        console.log(`${operationStr}${protocolStr}${avgStr}${minMaxStr}${successStr}`);
      }
      
      // If we have both REST and WebSocket results, show comparison
      if (results.length === 2) {
        const restResult = results.find(r => r.protocol === 'REST');
        const wsResult = results.find(r => r.protocol === 'WebSocket');
        
        if (restResult && wsResult) {
          const diff = ((restResult.avgTime - wsResult.avgTime) / wsResult.avgTime) * 100;
          const faster = diff > 0 ? 'WebSocket' : 'REST';
          const percentage = Math.abs(diff).toFixed(1);
          console.log(`  → ${faster} is ${percentage}% faster\n`);
        }
      } else {
        console.log('');
      }
    }

    console.log('='.repeat(80));

    // Summary statistics
    const restResults = this.results.filter(r => r.protocol === 'REST');
    const wsResults = this.results.filter(r => r.protocol === 'WebSocket');

    if (restResults.length > 0) {
      const restAvg = restResults.reduce((sum, r) => sum + r.avgTime, 0) / restResults.length;
      console.log(`\n📈 REST API Average: ${restAvg.toFixed(2)}ms`);
    }

    if (wsResults.length > 0) {
      const wsAvg = wsResults.reduce((sum, r) => sum + r.avgTime, 0) / wsResults.length;
      console.log(`📈 WebSocket Average: ${wsAvg.toFixed(2)}ms`);
    }

    // Identify bottlenecks
    console.log('\n🔍 Performance Analysis:');
    
    const slowestOperation = this.results.reduce((slowest, current) => 
      current.avgTime > slowest.avgTime ? current : slowest
    );
    
    console.log(`  Slowest Operation: ${slowestOperation.operation} (${slowestOperation.protocol}) - ${slowestOperation.avgTime.toFixed(2)}ms`);
    
    const fastestOperation = this.results.reduce((fastest, current) => 
      current.avgTime < fastest.avgTime ? current : fastest
    );
    
    console.log(`  Fastest Operation: ${fastestOperation.operation} (${fastestOperation.protocol}) - ${fastestOperation.avgTime.toFixed(2)}ms`);

    // Check for operations with low success rates
    const failingOperations = this.results.filter(r => r.successRate < 100);
    if (failingOperations.length > 0) {
      console.log('\n⚠️  Operations with failures:');
      for (const op of failingOperations) {
        console.log(`  - ${op.operation} (${op.protocol}): ${op.successRate.toFixed(1)}% success rate`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}

export { PerformanceBenchmark, BenchmarkConfig, BenchmarkResult };
