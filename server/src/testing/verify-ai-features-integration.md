# AI Features Integration Verification

This document provides manual verification steps for the three AI innovation features working together.

## Prerequisites

1. Server must be running: `npm run dev`
2. You must have a valid auth token (login via API or control panel)
3. Claude API key must be configured in `.env`

## Feature 1: AI-Generated ANSI Art

### Test 1.1: Generate Art via REST API

```bash
curl -X POST http://localhost:8080/api/v1/art/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "a retro computer terminal",
    "style": "retro",
    "width": 40,
    "height": 10,
    "applyColors": true,
    "colorTheme": "16-color"
  }'
```

**Expected**: Returns art object with `content`, `coloredContent`, `style`, `description`

### Test 1.2: List Saved Art

```bash
curl http://localhost:8080/api/v1/art \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Returns array of saved art pieces

### Test 1.3: Verify ANSI Rendering

Check that the returned `coloredContent` contains ANSI escape codes (`\x1b[` or `\u001b[`)

## Feature 2: AI Message Summarization

### Test 2.1: Generate Summary via REST API

```bash
curl -X POST http://localhost:8080/api/v1/message-bases/MESSAGE_BASE_ID/summarize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxMessages": 10
  }'
```

**Expected**: Returns summary object with:
- `messageBaseId`
- `messageBaseName`
- `messageCount`
- `summary` (text)
- `keyPoints` (array)
- `activeTopics` (array)
- `generatedAt` (timestamp)

### Test 2.2: Verify Summary Caching

Run the same request twice. The `generatedAt` timestamp should be identical on the second request (cached).

### Test 2.3: Verify ANSI Formatting

Check that `formatted.colored` contains ANSI codes and `formatted.framed` contains box-drawing characters (╔╗╚╝).

## Feature 3: AI Conversation Starters

### Test 3.1: Generate Question via REST API

```bash
curl -X POST http://localhost:8080/api/v1/conversation-starters/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageBaseId": "MESSAGE_BASE_ID",
    "style": "open-ended"
  }'
```

**Expected**: Returns question object with:
- `id`
- `messageBaseId`
- `messageBaseName`
- `question` (text)
- `context`
- `style`
- `generatedAt`

### Test 3.2: List Generated Questions

```bash
curl http://localhost:8080/api/v1/conversation-starters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Returns array of generated questions

### Test 3.3: Test Different Styles

Test all available styles: `open-ended`, `opinion`, `creative`, `technical`, `fun`

## Cross-Feature Integration Tests

### Test 4.1: Sequential Feature Usage

Execute all three features in sequence:

1. Generate art
2. Generate summary
3. Generate conversation starter

**Expected**: All three should succeed without errors

### Test 4.2: Concurrent Feature Usage

Make all three API calls simultaneously (use `&` in bash or Promise.all in JavaScript)

**Expected**: All three should complete successfully

### Test 4.3: ANSI Rendering Consistency

Verify that all three features produce consistent ANSI formatting:
- All colored outputs contain ANSI escape codes
- All framed outputs use the same box-drawing characters
- Colors are rendered correctly in terminal

### Test 4.4: Rate Limiting

Make rapid requests to all three endpoints (15+ requests in quick succession)

**Expected**: 
- If rate limiting is enabled: Some requests return 429 (Too Many Requests)
- If rate limiting is disabled: All requests succeed

## Error Handling Tests

### Test 5.1: Invalid Parameters

Test each feature with invalid parameters:

**Art Generation:**
```bash
curl -X POST http://localhost:8080/api/v1/art/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "", "width": 5}'
```
**Expected**: 400 Bad Request

**Summarization:**
```bash
curl -X POST http://localhost:8080/api/v1/message-bases/invalid-id/summarize \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: 404 Not Found

**Conversation Starter:**
```bash
curl -X POST http://localhost:8080/api/v1/conversation-starters/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messageBaseId": "base_1", "style": "invalid-style"}'
```
**Expected**: 400 Bad Request

### Test 5.2: Authentication Required

Test all endpoints without authorization header

**Expected**: All return 401 Unauthorized

## Performance Tests

### Test 6.1: Response Times

Measure response time for each feature:

```bash
time curl -X POST http://localhost:8080/api/v1/art/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "a simple shape"}'
```

**Expected**: All features complete within 30 seconds

### Test 6.2: Summary Caching Performance

First request (generates summary): Should take several seconds
Second request (uses cache): Should be nearly instant (<100ms)

## Verification Checklist

- [ ] All three features work independently
- [ ] Features work together without interference
- [ ] AI API rate limiting works (if enabled)
- [ ] ANSI rendering is consistent across all features
- [ ] REST API endpoints return correct status codes
- [ ] Error handling works for invalid inputs
- [ ] Authentication is required for all endpoints
- [ ] Performance is acceptable (<30s per request)
- [ ] Caching works for summarization
- [ ] All formatted outputs contain proper ANSI codes and frames

## Notes

- Replace `YOUR_TOKEN` with actual JWT token from login
- Replace `MESSAGE_BASE_ID` with actual message base ID from your database
- Some tests require existing data (messages, message bases)
- AI responses may vary due to the non-deterministic nature of LLMs
- Rate limiting behavior depends on server configuration

## Automated Test Script

For automated verification, run:

```bash
npm run test -- test-ai-features-integration --run
```

Note: This requires the server to NOT be running (tests start their own instance)
