#!/usr/bin/env tsx
/**
 * Script to run performance benchmarks
 * 
 * Usage:
 *   npm run benchmark
 *   npm run benchmark -- --iterations 200
 *   npm run benchmark -- --url http://localhost:3000
 */

import { PerformanceBenchmark, BenchmarkConfig } from '../src/performance/benchmark.js';

// Parse command line arguments
const args = process.argv.slice(2);
const config: BenchmarkConfig = {
  restApiUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3000',
  iterations: 100,
  warmupIterations: 10,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--url' && i + 1 < args.length) {
    config.restApiUrl = args[i + 1];
    // Derive WebSocket URL from REST API URL
    config.wsUrl = config.restApiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    i++;
  } else if (arg === '--iterations' && i + 1 < args.length) {
    config.iterations = parseInt(args[i + 1], 10);
    i++;
  } else if (arg === '--warmup' && i + 1 < args.length) {
    config.warmupIterations = parseInt(args[i + 1], 10);
    i++;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Performance Benchmark Tool

Usage:
  npm run benchmark [options]

Options:
  --url <url>          Base URL for the API (default: http://localhost:3000)
  --iterations <n>     Number of iterations per test (default: 100)
  --warmup <n>         Number of warmup iterations (default: 10)
  --help, -h           Show this help message

Examples:
  npm run benchmark
  npm run benchmark -- --iterations 200
  npm run benchmark -- --url http://localhost:3000 --iterations 50
`);
    process.exit(0);
  }
}

// Run the benchmark
const benchmark = new PerformanceBenchmark(config);

benchmark.runAll()
  .then(() => {
    console.log('✅ Benchmark completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });
