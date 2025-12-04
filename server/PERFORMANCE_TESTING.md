# Performance Testing Guide

This document describes the performance testing framework for BaudAgain BBS, comparing REST API and WebSocket performance.

## Overview

The performance testing framework benchmarks various BBS operations to:
- Measure REST API response times
- Compare REST API with WebSocket performance where applicable
- Identify performance bottlenecks
- Validate that the hybrid architecture meets performance requirements

## Requirements

**Validates: Requirements 19.2** - Test all operations via REST API

## Running Benchmarks

### Prerequisites

1. Ensure the BBS server is running:
   ```bash
   npm run dev
   ```

2. The server should be accessible at `http://localhost:3000` (default)

### Basic Usage

Run the benchmark with default settings (100 iterations):
```bash
npm run benchmark
```

### Advanced Usage

Customize the benchmark parameters:

```bash
# Run with 200 iterations
npm run benchmark -- --iterations 200

# Run with custom URL
npm run benchmark -- --url http://localhost:3000

# Run with custom warmup iterations
npm run benchmark -- --warmup 20

# Combine options
npm run benchmark -- --url http://localhost:3000 --iterations 200 --warmup 20
```

### Environment Variables

You can also configure the benchmark using environment variables:

```bash
REST_API_URL=http://localhost:3000 \
WS_URL=ws://localhost:3000 \
ITERATIONS=100 \
WARMUP_ITERATIONS=10 \
npm run benchmark
```

## Benchmark Operations

The benchmark tests the following operations:

### Authentication Operations
- **Login** - POST /api/v1/auth/login
- **Token Refresh** - POST /api/v1/auth/refresh
- **Get Current User** - GET /api/v1/auth/me

### User Operations
- **List Users** - GET /api/v1/users

### Message Base Operations
- **List Message Bases** - GET /api/v1/message-bases

### Message Operations
- **List Messages** - GET /api/v1/message-bases/:id/messages
- **Post Message** - POST /api/v1/message-bases/:id/messages

## Metrics Collected

For each operation, the benchmark collects:

- **Average Time** - Mean response time across all iterations
- **Minimum Time** - Fastest response time
- **Maximum Time** - Slowest response time
- **Success Rate** - Percentage of successful requests
- **Total Time** - Cumulative time for all iterations

## Understanding Results

### Sample Output

```
📊 BENCHMARK RESULTS
================================================================================

Operation                     Protocol       Avg Time       Min/Max             Success Rate
-----------------------------------------------------------------------------------------------
Login                         REST           45.23ms        32.10/89.45ms       100.0%
Token Refresh                 REST           12.34ms        8.90/25.67ms        100.0%
Get Current User              REST           15.67ms        11.23/34.56ms       100.0%

List Users                    REST           23.45ms        18.90/45.67ms       100.0%

List Message Bases            REST           19.87ms        15.34/38.90ms       100.0%

List Messages                 REST           28.90ms        22.34/56.78ms       100.0%
Post Message                  REST           34.56ms        28.90/67.89ms       100.0%

================================================================================

📈 REST API Average: 25.72ms

🔍 Performance Analysis:
  Slowest Operation: Login (REST) - 45.23ms
  Fastest Operation: Token Refresh (REST) - 12.34ms
```

### Interpreting Results

1. **Average Response Times**
   - < 50ms: Excellent
   - 50-100ms: Good
   - 100-200ms: Acceptable
   - > 200ms: Needs optimization

2. **Success Rate**
   - 100%: All requests succeeded
   - < 100%: Some requests failed (investigate errors)

3. **Min/Max Spread**
   - Small spread (< 2x): Consistent performance
   - Large spread (> 5x): Variable performance, possible bottlenecks

## Performance Bottlenecks

Common bottlenecks and solutions:

### 1. Database Operations
**Symptom**: High response times for operations involving database queries

**Solutions**:
- Add database indexes
- Optimize queries
- Implement caching
- Use connection pooling

### 2. Authentication
**Symptom**: High response times for login/token operations

**Solutions**:
- Optimize bcrypt rounds (currently 10)
- Cache JWT verification results
- Use faster hashing for non-password data

### 3. Network Latency
**Symptom**: Consistent overhead across all operations

**Solutions**:
- Enable HTTP/2
- Implement response compression
- Use keep-alive connections

### 4. JSON Serialization
**Symptom**: High response times for operations returning large datasets

**Solutions**:
- Implement pagination
- Reduce payload size
- Use streaming responses

## REST API vs WebSocket Comparison

### When to Use REST API
- ✅ CRUD operations
- ✅ Stateless requests
- ✅ Caching opportunities
- ✅ Standard HTTP tooling
- ✅ Easy testing and debugging

### When to Use WebSocket
- ✅ Real-time notifications
- ✅ Bidirectional communication
- ✅ Low latency requirements
- ✅ Persistent connections
- ✅ Server push events

### Hybrid Architecture Benefits
The BaudAgain hybrid architecture combines both:
- REST API for all user actions (testable, cacheable)
- WebSocket for real-time notifications (low latency)
- Best of both worlds!

## Performance Goals

Based on Requirements 19.2, the system should achieve:

1. **Response Time Goals**
   - Authentication: < 100ms
   - Read operations: < 50ms
   - Write operations: < 100ms
   - List operations: < 100ms

2. **Throughput Goals**
   - Support 100+ concurrent users
   - Handle 1000+ requests per minute
   - Maintain < 1% error rate

3. **Scalability Goals**
   - Linear scaling with CPU cores
   - Efficient memory usage
   - Graceful degradation under load

## Continuous Performance Testing

### Integration with CI/CD

Add performance testing to your CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dev &
      - run: sleep 5  # Wait for server to start
      - run: npm run benchmark
```

### Performance Regression Detection

Track performance over time:

1. Run benchmarks on each commit
2. Store results in a database or file
3. Compare with baseline
4. Alert on regressions > 20%

## Troubleshooting

### Server Not Running
```
❌ Setup failed: Error: fetch failed
```
**Solution**: Start the server with `npm run dev`

### Connection Refused
```
❌ Benchmark failed: Error: connect ECONNREFUSED
```
**Solution**: Check that the server is running on the correct port

### Low Success Rate
```
⚠️  Operations with failures:
  - Login (REST): 85.0% success rate
```
**Solution**: Check server logs for errors, verify database is accessible

### High Response Times
```
Slowest Operation: Post Message (REST) - 450.23ms
```
**Solution**: Profile the operation, check database queries, review code

## Advanced Topics

### Custom Benchmarks

Create custom benchmarks by extending the `PerformanceBenchmark` class:

```typescript
import { PerformanceBenchmark } from './src/performance/benchmark';

class CustomBenchmark extends PerformanceBenchmark {
  async benchmarkCustomOperation() {
    await this.benchmarkRestOperation(
      'Custom Operation',
      async () => {
        // Your custom operation here
        return true;
      }
    );
  }
}
```

### Load Testing

For load testing with multiple concurrent users, use tools like:
- Apache Bench (ab)
- wrk
- Artillery
- k6

Example with Apache Bench:
```bash
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:3000/api/v1/users
```

### Profiling

For detailed profiling, use Node.js built-in profiler:

```bash
node --prof dist/index.js
```

Then analyze with:
```bash
node --prof-process isolate-*.log > profile.txt
```

## References

- [Requirements Document](.kiro/specs/baudagain/requirements.md) - Requirement 19.2
- [Design Document](.kiro/specs/baudagain/design.md) - Testing Strategy
- [API Documentation](./API_README.md) - REST API reference
- [OpenAPI Specification](./openapi.yaml) - API schema

## Contributing

When adding new API endpoints:

1. Add benchmark tests to `src/performance/benchmark.ts`
2. Run benchmarks to establish baseline
3. Document expected performance characteristics
4. Add to this guide if needed

## License

Part of the BaudAgain BBS project.
