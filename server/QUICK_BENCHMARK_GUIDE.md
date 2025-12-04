# Quick Benchmark Guide

## TL;DR

```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Run the benchmark
npm run benchmark
```

## What It Does

The benchmark tool measures the performance of all REST API endpoints:
- Authentication (login, token refresh, get user)
- User operations (list, get, update)
- Message base operations (list, get, create)
- Message operations (list, get, post)

## Output

You'll see:
- Average response time for each operation
- Min/Max response times
- Success rate
- Performance analysis
- Bottleneck identification

## Example Output

```
📊 BENCHMARK RESULTS
================================================================================

Operation                     Protocol       Avg Time       Min/Max             Success Rate
-----------------------------------------------------------------------------------------------
Login                         REST           45.23ms        32.10/89.45ms       100.0%
Token Refresh                 REST           12.34ms        8.90/25.67ms        100.0%
Get Current User              REST           15.67ms        11.23/34.56ms       100.0%

📈 REST API Average: 25.72ms

🔍 Performance Analysis:
  Slowest Operation: Login (REST) - 45.23ms
  Fastest Operation: Token Refresh (REST) - 12.34ms
```

## Custom Options

```bash
# More iterations (more accurate)
npm run benchmark -- --iterations 200

# Fewer iterations (faster)
npm run benchmark -- --iterations 50

# Custom server URL
npm run benchmark -- --url http://localhost:3000

# Adjust warmup iterations
npm run benchmark -- --warmup 20
```

## Troubleshooting

### "Setup failed: Error: Failed to setup test user"
**Solution**: Make sure the server is running (`npm run dev`)

### "Connection refused"
**Solution**: Check that the server is on port 3000

### High response times
**Solution**: Check server logs, database performance, system load

## Performance Goals

✅ Authentication: < 100ms  
✅ Read operations: < 50ms  
✅ Write operations: < 100ms  
✅ List operations: < 100ms

## More Information

See [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md) for complete documentation.
