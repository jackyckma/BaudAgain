# BaudAgain BBS API - curl Examples

This document provides comprehensive curl examples for all BaudAgain BBS API endpoints.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Users](#users)
- [Message Bases](#message-bases)
- [Messages](#messages)
- [Door Games](#door-games)
- [System](#system)

## Getting Started

### Base URL

```bash
export BASE_URL="http://localhost:8080/api/v1"
```

### Setting Your Token

After logging in or registering, save your JWT token:

```bash
export TOKEN="your_jwt_token_here"
```

## Authentication

### Register New User

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "testuser",
    "password": "password123",
    "realName": "Test User",
    "location": "Cyberspace",
    "bio": "Just testing the BBS API"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "handle": "testuser",
    "realName": "Test User",
    "location": "Cyberspace",
    "bio": "Just testing the BBS API",
    "accessLevel": 10,
    "createdAt": "2025-12-03T10:00:00.000Z",
    "totalCalls": 0,
    "totalPosts": 0
  }
}
```

**Save the token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Login

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "testuser",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "handle": "testuser",
    "lastLogin": "2025-12-03T09:00:00.000Z",
    "totalCalls": 5,
    "totalPosts": 12
  }
}
```

### Get Current User

```bash
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "handle": "testuser",
  "realName": "Test User",
  "location": "Cyberspace",
  "bio": "Just testing the BBS API",
  "accessLevel": 10,
  "createdAt": "2025-12-03T10:00:00.000Z",
  "lastLogin": "2025-12-03T10:30:00.000Z",
  "totalCalls": 6,
  "totalPosts": 12
}
```

### Refresh Token

```bash
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\"
  }"
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Users

### List Users (Admin Only)

```bash
curl -X GET "$BASE_URL/users?page=1&limit=50&sort=createdAt&order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "handle": "testuser",
      "realName": "Test User",
      "accessLevel": 10,
      "createdAt": "2025-12-03T10:00:00.000Z",
      "lastLogin": "2025-12-03T10:30:00.000Z",
      "totalCalls": 6,
      "totalPosts": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get User Profile

```bash
# Get your own profile
curl -X GET "$BASE_URL/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN"

# Or get another user's profile
curl -X GET "$BASE_URL/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "handle": "testuser",
  "realName": "Test User",
  "location": "Cyberspace",
  "bio": "Just testing the BBS API",
  "accessLevel": 10,
  "createdAt": "2025-12-03T10:00:00.000Z",
  "lastLogin": "2025-12-03T10:30:00.000Z",
  "totalCalls": 6,
  "totalPosts": 12
}
```

### Update User Profile

```bash
curl -X PATCH "$BASE_URL/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realName": "Updated Name",
    "location": "New Location",
    "bio": "Updated bio"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "handle": "testuser",
  "realName": "Updated Name",
  "location": "New Location",
  "bio": "Updated bio",
  "accessLevel": 10,
  "createdAt": "2025-12-03T10:00:00.000Z",
  "lastLogin": "2025-12-03T10:30:00.000Z",
  "totalCalls": 6,
  "totalPosts": 12
}
```

## Message Bases

### List Message Bases

```bash
curl -X GET "$BASE_URL/message-bases" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "bases": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "General Discussion",
      "description": "General chat and discussion",
      "accessLevelRead": 0,
      "accessLevelWrite": 10,
      "postCount": 42,
      "lastPostAt": "2025-12-03T09:45:00.000Z",
      "sortOrder": 0
    }
  ]
}
```

**Save a message base ID:**
```bash
export MESSAGE_BASE_ID="660e8400-e29b-41d4-a716-446655440000"
```

### Get Message Base

```bash
curl -X GET "$BASE_URL/message-bases/$MESSAGE_BASE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "General Discussion",
  "description": "General chat and discussion",
  "accessLevelRead": 0,
  "accessLevelWrite": 10,
  "postCount": 42,
  "lastPostAt": "2025-12-03T09:45:00.000Z",
  "sortOrder": 0
}
```

### Create Message Base (Admin Only)

```bash
curl -X POST "$BASE_URL/message-bases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Forum",
    "description": "A test message base",
    "accessLevelRead": 0,
    "accessLevelWrite": 10,
    "sortOrder": 0
  }'
```

**Response:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Test Forum",
  "description": "A test message base",
  "accessLevelRead": 0,
  "accessLevelWrite": 10,
  "postCount": 0,
  "lastPostAt": null,
  "sortOrder": 0
}
```

### Update Message Base (Admin Only)

```bash
curl -X PATCH "$BASE_URL/message-bases/$MESSAGE_BASE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Forum Name",
    "description": "Updated description"
  }'
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Forum Name",
  "description": "Updated description",
  "accessLevelRead": 0,
  "accessLevelWrite": 10,
  "postCount": 42,
  "lastPostAt": "2025-12-03T09:45:00.000Z",
  "sortOrder": 0
}
```

### Delete Message Base (Admin Only)

```bash
curl -X DELETE "$BASE_URL/message-bases/$MESSAGE_BASE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** 204 No Content

## Messages

### List Messages

```bash
curl -X GET "$BASE_URL/message-bases/$MESSAGE_BASE_ID/messages?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "messages": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "messageBaseId": "660e8400-e29b-41d4-a716-446655440000",
      "subject": "Welcome to the BBS!",
      "body": "This is the first message in the forum.",
      "authorId": "550e8400-e29b-41d4-a716-446655440000",
      "authorHandle": "sysop",
      "createdAt": "2025-12-03T08:00:00.000Z",
      "parentId": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Save a message ID:**
```bash
export MESSAGE_ID="880e8400-e29b-41d4-a716-446655440000"
```

### Get Message

```bash
curl -X GET "$BASE_URL/messages/$MESSAGE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "messageBaseId": "660e8400-e29b-41d4-a716-446655440000",
  "subject": "Welcome to the BBS!",
  "body": "This is the first message in the forum.",
  "authorId": "550e8400-e29b-41d4-a716-446655440000",
  "authorHandle": "sysop",
  "createdAt": "2025-12-03T08:00:00.000Z",
  "parentId": null
}
```

### Post Message

```bash
curl -X POST "$BASE_URL/message-bases/$MESSAGE_BASE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Message",
    "body": "This is a test message posted via the API."
  }'
```

**Response:**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "messageBaseId": "660e8400-e29b-41d4-a716-446655440000",
  "subject": "Test Message",
  "body": "This is a test message posted via the API.",
  "authorId": "550e8400-e29b-41d4-a716-446655440000",
  "authorHandle": "testuser",
  "createdAt": "2025-12-03T10:35:00.000Z",
  "parentId": null
}
```

### Post Reply

```bash
curl -X POST "$BASE_URL/messages/$MESSAGE_ID/replies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Re: Test Message",
    "body": "This is a reply to the test message."
  }'
```

**Response:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "messageBaseId": "660e8400-e29b-41d4-a716-446655440000",
  "subject": "Re: Test Message",
  "body": "This is a reply to the test message.",
  "authorId": "550e8400-e29b-41d4-a716-446655440000",
  "authorHandle": "testuser",
  "createdAt": "2025-12-03T10:36:00.000Z",
  "parentId": "990e8400-e29b-41d4-a716-446655440000"
}
```

## Door Games

### List Doors

```bash
curl -X GET "$BASE_URL/doors" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "doors": [
    {
      "id": "the_oracle",
      "name": "The Oracle",
      "description": "Consult the ancient digital spirit",
      "category": "AI Games",
      "accessLevel": 0,
      "canAccess": true
    }
  ]
}
```

### Enter Door

```bash
curl -X POST "$BASE_URL/doors/the_oracle/enter" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "sessionId": "bb0e8400-e29b-41d4-a716-446655440000",
  "doorId": "the_oracle",
  "doorName": "The Oracle",
  "output": "\u001b[1;36m╔══════════════════════════════════════════════════════════════╗\u001b[0m\n\u001b[1;36m║\u001b[0m                    \u001b[1;35mT H E   O R A C L E\u001b[0m                       \u001b[1;36m║\u001b[0m\n\u001b[1;36m╠══════════════════════════════════════════════════════════════╣\u001b[0m\n\u001b[1;36m║\u001b[0m                                                              \u001b[1;36m║\u001b[0m\n\u001b[1;36m║\u001b[0m  The mists part... an ancient presence stirs...              \u001b[1;36m║\u001b[0m\n\u001b[1;36m║\u001b[0m                                                              \u001b[1;36m║\u001b[0m\n\u001b[1;36m║\u001b[0m  Ask your question, seeker, and the Oracle shall respond.   \u001b[1;36m║\u001b[0m\n\u001b[1;36m║\u001b[0m  Type 'quit' to return to the mortal realm.                 \u001b[1;36m║\u001b[0m\n\u001b[1;36m║\u001b[0m                                                              \u001b[1;36m║\u001b[0m\n\u001b[1;36m╚══════════════════════════════════════════════════════════════╝\u001b[0m\n\nYour question: ",
  "resumed": false
}
```

**Save the session ID:**
```bash
export DOOR_SESSION_ID="bb0e8400-e29b-41d4-a716-446655440000"
```

### Send Door Input

```bash
curl -X POST "$BASE_URL/doors/the_oracle/input" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is the meaning of life?"
  }'
```

**Response:**
```json
{
  "sessionId": "bb0e8400-e29b-41d4-a716-446655440000",
  "output": "\n\u001b[1;35m✧\u001b[0m The Oracle speaks... \u001b[1;35m✧\u001b[0m\n\n\u001b[1;33mThe answer lies not in the destination... but in the journey itself.\u001b[0m\n\u001b[1;33mSeek balance between the digital and the real... ☽\u001b[0m\n\nYour question: ",
  "exited": false
}
```

### Exit Door

```bash
curl -X POST "$BASE_URL/doors/the_oracle/exit" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "output": "\n\u001b[1;35mThe mists fade... until we meet again, seeker.\u001b[0m\n",
  "exited": true
}
```

### Get Door Session Info

```bash
curl -X GET "$BASE_URL/doors/the_oracle/session" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "inDoor": false,
  "hasSavedSession": true,
  "sessionId": null,
  "doorId": "the_oracle",
  "doorName": "The Oracle",
  "lastActivity": "2025-12-03T10:40:00.000Z",
  "savedState": {
    "conversationCount": 3
  },
  "savedHistory": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    },
    {
      "role": "assistant",
      "content": "The answer lies not in the destination... but in the journey itself."
    }
  ]
}
```

### Resume Door Session

```bash
curl -X POST "$BASE_URL/doors/the_oracle/resume" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "sessionId": "cc0e8400-e29b-41d4-a716-446655440000",
  "doorId": "the_oracle",
  "doorName": "The Oracle",
  "output": "\u001b[1;35m✧ Welcome back, seeker... The Oracle remembers you. ✧\u001b[0m\n\nYour question: ",
  "resumed": true
}
```

### Get My Saved Sessions

```bash
curl -X GET "$BASE_URL/doors/my-sessions" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "sessions": [
    {
      "doorId": "the_oracle",
      "doorName": "The Oracle",
      "lastActivity": "2025-12-03T10:40:00.000Z",
      "createdAt": "2025-12-03T10:35:00.000Z",
      "canResume": true
    }
  ],
  "totalCount": 1
}
```

### Get All Door Sessions (Admin Only)

```bash
curl -X GET "$BASE_URL/doors/sessions" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "bb0e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "handle": "testuser",
      "doorId": "the_oracle",
      "doorName": "The Oracle",
      "lastActivity": "2025-12-03T10:40:00.000Z",
      "inactiveTime": 120000
    }
  ],
  "totalCount": 1
}
```

### Get Door Stats

```bash
curl -X GET "$BASE_URL/doors/the_oracle/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "doorId": "the_oracle",
  "doorName": "The Oracle",
  "activeSessions": 2,
  "timeout": 600000
}
```

## System

### Send System Announcement (Admin Only)

```bash
curl -X POST "$BASE_URL/system/announcement" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Server maintenance scheduled for tonight at 10 PM",
    "priority": "high"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement sent successfully",
  "announcement": {
    "message": "Server maintenance scheduled for tonight at 10 PM",
    "priority": "high",
    "expiresAt": null,
    "timestamp": "2025-12-03T10:45:00.000Z"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `INVALID_INPUT` - Invalid request data (400)
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - Not authorized (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (409)
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded (429)
- `INTERNAL_ERROR` - Server error (500)

### Example Error Response

```bash
curl -X GET "$BASE_URL/auth/me"
# Missing Authorization header
```

**Response (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authorization token provided",
    "details": {}
  }
}
```

## Rate Limits

The API enforces the following rate limits:

- **Authentication endpoints**: 10 requests per minute
- **Read operations**: 100 requests per 15 minutes
- **Write operations**: 30 requests per minute
- **Message posting**: 30 messages per hour

When rate limited, you'll receive a 429 response:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

## Complete Workflow Example

Here's a complete workflow from registration to posting a message:

```bash
# 1. Register
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "newuser",
    "password": "securepass123"
  }')

# 2. Extract token
TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 3. Get current user info
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# 4. List message bases
BASES=$(curl -s -X GET "$BASE_URL/message-bases" \
  -H "Authorization: Bearer $TOKEN")

# 5. Extract first message base ID
MESSAGE_BASE_ID=$(echo $BASES | jq -r '.bases[0].id')
echo "Message Base ID: $MESSAGE_BASE_ID"

# 6. Post a message
curl -X POST "$BASE_URL/message-bases/$MESSAGE_BASE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Hello BBS!",
    "body": "My first message via the API!"
  }'

# 7. List messages
curl -X GET "$BASE_URL/message-bases/$MESSAGE_BASE_ID/messages" \
  -H "Authorization: Bearer $TOKEN"

# 8. Enter The Oracle door game
DOOR_RESPONSE=$(curl -s -X POST "$BASE_URL/doors/the_oracle/enter" \
  -H "Authorization: Bearer $TOKEN")

echo $DOOR_RESPONSE | jq -r '.output'

# 9. Ask The Oracle a question
curl -X POST "$BASE_URL/doors/the_oracle/input" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Will I succeed in my endeavors?"
  }' | jq -r '.output'

# 10. Exit the door
curl -X POST "$BASE_URL/doors/the_oracle/exit" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.output'
```

## Testing Tips

### Using jq for JSON parsing

Install jq for better JSON handling:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Pretty print responses

```bash
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Save response to file

```bash
curl -X GET "$BASE_URL/message-bases" \
  -H "Authorization: Bearer $TOKEN" \
  -o message-bases.json
```

### Verbose output for debugging

```bash
curl -v -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "testuser",
    "password": "password123"
  }'
```

### Test with different users

```bash
# Create multiple test users
for i in {1..5}; do
  curl -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"handle\": \"testuser$i\",
      \"password\": \"password123\"
    }"
done
```

## WebSocket Notifications

While this document focuses on REST API endpoints, the BBS also supports WebSocket notifications for real-time updates. Connect to:

```
ws://localhost:8080
```

After connecting, authenticate with your JWT token and subscribe to events:

```json
{
  "type": "subscribe",
  "events": ["MESSAGE_NEW", "USER_JOINED", "USER_LEFT", "SYSTEM_ANNOUNCEMENT"]
}
```

You'll receive real-time notifications when:
- New messages are posted
- Users join or leave
- System announcements are broadcast
- Door game updates occur

See the WebSocket documentation for more details on the notification system.


## Conversation Starters

### Generate New Question

Generate and post a new "Question of the Day":

```bash
curl -X POST "$BASE_URL/conversation-starters/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "q_1733356800000_abc123",
    "messageBaseId": "uuid-here",
    "messageBaseName": "General Discussion",
    "question": "What's your favorite memory from the early days of the internet?",
    "style": "open-ended",
    "generatedAt": "2025-12-04T10:00:00Z",
    "postedAt": "2025-12-04T10:00:01Z",
    "messageId": "message-uuid-here"
  }
}
```

### Get Question History

Get history of generated questions:

```bash
curl -X GET "$BASE_URL/conversation-starters?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q_1733356800000_abc123",
      "messageBaseId": "uuid-here",
      "messageBaseName": "General Discussion",
      "question": "What's your favorite memory from the early days of the internet?",
      "style": "open-ended",
      "generatedAt": "2025-12-04T10:00:00Z",
      "postedAt": "2025-12-04T10:00:01Z",
      "messageId": "message-uuid-here",
      "engagementMetrics": {
        "views": 0,
        "replies": 5,
        "uniqueRepliers": 3
      }
    }
  ],
  "total": 1
}
```

### Get Specific Question

Get details for a specific question with updated metrics:

```bash
curl -X GET "$BASE_URL/conversation-starters/q_1733356800000_abc123" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "q_1733356800000_abc123",
    "messageBaseId": "uuid-here",
    "messageBaseName": "General Discussion",
    "question": "What's your favorite memory from the early days of the internet?",
    "style": "open-ended",
    "generatedAt": "2025-12-04T10:00:00Z",
    "postedAt": "2025-12-04T10:00:01Z",
    "messageId": "message-uuid-here",
    "engagementMetrics": {
      "views": 0,
      "replies": 5,
      "uniqueRepliers": 3
    }
  }
}
```

### Get Engagement Statistics

Get overall engagement statistics:

```bash
curl -X GET "$BASE_URL/conversation-starters/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalQuestions": 15,
    "totalReplies": 87,
    "averageRepliesPerQuestion": 5.8,
    "mostEngagingStyle": "creative"
  }
}
```

### Get Configuration

Get current conversation starter configuration:

```bash
curl -X GET "$BASE_URL/conversation-starters/config" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "config": {
    "enabled": true,
    "schedule": "09:00",
    "targetMessageBaseId": "uuid-here",
    "questionStyle": "auto",
    "aiPersonality": null
  }
}
```

### Update Configuration

Update conversation starter configuration:

```bash
curl -X PUT "$BASE_URL/conversation-starters/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "schedule": "10:00",
    "targetMessageBaseId": "uuid-here",
    "questionStyle": "creative"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated (in-memory only)",
  "config": {
    "enabled": true,
    "schedule": "10:00",
    "targetMessageBaseId": "uuid-here",
    "questionStyle": "creative",
    "aiPersonality": null
  }
}
```

### Get Task Status

Get scheduled task status:

```bash
curl -X GET "$BASE_URL/conversation-starters/task/status" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "enabled": true,
  "schedule": "09:00",
  "lastRun": "2025-12-04T09:00:00Z",
  "nextRun": "2025-12-05T09:00:00Z"
}
```

### Trigger Task Manually

Manually trigger the daily question task:

```bash
curl -X POST "$BASE_URL/conversation-starters/task/trigger" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Daily question task triggered successfully"
}
```

### Enable Task

Enable the scheduled task:

```bash
curl -X PUT "$BASE_URL/conversation-starters/task/enable" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Daily question task enabled"
}
```

### Disable Task

Disable the scheduled task:

```bash
curl -X PUT "$BASE_URL/conversation-starters/task/disable" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Daily question task disabled"
}
```
