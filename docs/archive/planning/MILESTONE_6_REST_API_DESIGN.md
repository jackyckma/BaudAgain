# Milestone 6: REST API Design

**Date**: 2025-12-01  
**Status**: Design Phase  
**Version**: 1.0

## Overview

This document defines the complete REST API for BaudAgain BBS, enabling:
- Mobile app development
- Third-party integrations
- Better testability
- Industry-standard architecture

## Design Principles

1. **RESTful**: Follow REST conventions (GET, POST, PATCH, DELETE)
2. **Stateless**: Each request contains all necessary information
3. **Consistent**: Uniform response formats and error handling
4. **Versioned**: API version in URL path (`/api/v1/...`)
5. **Secure**: JWT authentication, rate limiting, input validation

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

### JWT Token Structure
```json
{
  "userId": "uuid",
  "handle": "string",
  "accessLevel": 0-255,
  "iat": timestamp,
  "exp": timestamp
}
```

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user account.

**Request**:
```json
{
  "handle": "string (3-20 chars)",
  "password": "string (min 6 chars)",
  "realName": "string (optional)",
  "location": "string (optional)",
  "bio": "string (optional)"
}
```

**Response** (201 Created):
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "handle": "string",
    "accessLevel": 10,
    "createdAt": "ISO8601"
  }
}
```

**Errors**:
- 400: Invalid input (handle too short, password weak, etc.)
- 409: Handle already exists

---

#### POST /api/v1/auth/login
Login with existing credentials.

**Request**:
```json
{
  "handle": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "handle": "string",
    "accessLevel": number,
    "lastLogin": "ISO8601",
    "totalCalls": number
  }
}
```

**Errors**:
- 400: Missing credentials
- 401: Invalid credentials
- 429: Too many login attempts

---

#### POST /api/v1/auth/refresh
Refresh JWT token.

**Request**:
```json
{
  "token": "current_jwt_token"
}
```

**Response** (200 OK):
```json
{
  "token": "new_jwt_token"
}
```

**Errors**:
- 401: Invalid or expired token

---

#### GET /api/v1/auth/me
Get current user information.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "handle": "string",
  "realName": "string",
  "location": "string",
  "bio": "string",
  "accessLevel": number,
  "createdAt": "ISO8601",
  "lastLogin": "ISO8601",
  "totalCalls": number,
  "totalPosts": number,
  "preferences": {
    "terminalType": "ansi",
    "screenWidth": 80,
    "screenHeight": 24
  }
}
```

**Errors**:
- 401: Not authenticated

---

### 2. User Management Endpoints

#### GET /api/v1/users
List all users (admin only).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 100)
- `sort`: "handle" | "createdAt" | "lastLogin" (default: "createdAt")
- `order`: "asc" | "desc" (default: "desc")

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "uuid",
      "handle": "string",
      "accessLevel": number,
      "createdAt": "ISO8601",
      "lastLogin": "ISO8601",
      "totalCalls": number,
      "totalPosts": number
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

**Errors**:
- 401: Not authenticated
- 403: Not authorized (requires admin)

---

#### GET /api/v1/users/:id
Get user profile.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "handle": "string",
  "realName": "string",
  "location": "string",
  "bio": "string",
  "accessLevel": number,
  "createdAt": "ISO8601",
  "lastLogin": "ISO8601",
  "totalCalls": number,
  "totalPosts": number
}
```

**Errors**:
- 401: Not authenticated
- 404: User not found

---

#### PATCH /api/v1/users/:id
Update user profile.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "realName": "string (optional)",
  "location": "string (optional)",
  "bio": "string (optional)",
  "accessLevel": number (admin only),
  "preferences": {
    "terminalType": "ansi",
    "screenWidth": 80,
    "screenHeight": 24
  }
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "handle": "string",
  "realName": "string",
  "location": "string",
  "bio": "string",
  "accessLevel": number,
  "preferences": {}
}
```

**Errors**:
- 401: Not authenticated
- 403: Not authorized (can only update own profile unless admin)
- 404: User not found

---

### 3. Message Base Endpoints

#### GET /api/v1/message-bases
List all message bases.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "bases": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "accessLevelRead": number,
      "accessLevelWrite": number,
      "postCount": number,
      "lastPostAt": "ISO8601",
      "sortOrder": number
    }
  ]
}
```

**Errors**:
- 401: Not authenticated

---

#### GET /api/v1/message-bases/:id
Get message base details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "accessLevelRead": number,
  "accessLevelWrite": number,
  "postCount": number,
  "lastPostAt": "ISO8601",
  "sortOrder": number,
  "canRead": boolean,
  "canWrite": boolean
}
```

**Errors**:
- 401: Not authenticated
- 403: No read access
- 404: Message base not found

---

#### POST /api/v1/message-bases
Create new message base (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "name": "string",
  "description": "string (optional)",
  "accessLevelRead": number (default: 0),
  "accessLevelWrite": number (default: 10),
  "sortOrder": number (default: 0)
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "accessLevelRead": number,
  "accessLevelWrite": number,
  "postCount": 0,
  "sortOrder": number
}
```

**Errors**:
- 401: Not authenticated
- 403: Not authorized (requires admin)
- 400: Invalid input

---

#### PATCH /api/v1/message-bases/:id
Update message base (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "accessLevelRead": number (optional),
  "accessLevelWrite": number (optional)",
  "sortOrder": number (optional)
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "accessLevelRead": number,
  "accessLevelWrite": number,
  "postCount": number,
  "sortOrder": number
}
```

**Errors**:
- 401: Not authenticated
- 403: Not authorized
- 404: Message base not found

---

#### DELETE /api/v1/message-bases/:id
Delete message base (admin only).

**Headers**: `Authorization: Bearer <token>`

**Response** (204 No Content)

**Errors**:
- 401: Not authenticated
- 403: Not authorized
- 404: Message base not found

---

### 4. Message Endpoints

#### GET /api/v1/message-bases/:baseId/messages
List messages in a message base.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 100)
- `sort`: "createdAt" | "subject" (default: "createdAt")
- `order`: "asc" | "desc" (default: "asc")

**Response** (200 OK):
```json
{
  "messages": [
    {
      "id": "uuid",
      "subject": "string",
      "authorHandle": "string",
      "createdAt": "ISO8601",
      "replyCount": number
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

**Errors**:
- 401: Not authenticated
- 403: No read access to message base
- 404: Message base not found

---

#### GET /api/v1/messages/:id
Get message details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "messageBaseId": "uuid",
  "messageBaseName": "string",
  "subject": "string",
  "body": "string",
  "authorId": "uuid",
  "authorHandle": "string",
  "createdAt": "ISO8601",
  "parentId": "uuid (optional)",
  "replies": [
    {
      "id": "uuid",
      "subject": "string",
      "authorHandle": "string",
      "createdAt": "ISO8601"
    }
  ]
}
```

**Errors**:
- 401: Not authenticated
- 403: No read access
- 404: Message not found

---

#### POST /api/v1/message-bases/:baseId/messages
Post new message.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "subject": "string (max 100 chars)",
  "body": "string (max 5000 chars)",
  "parentId": "uuid (optional, for replies)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "messageBaseId": "uuid",
  "subject": "string",
  "body": "string",
  "authorId": "uuid",
  "authorHandle": "string",
  "createdAt": "ISO8601",
  "parentId": "uuid (optional)"
}
```

**Errors**:
- 401: Not authenticated
- 403: No write access to message base
- 404: Message base not found
- 400: Invalid input (subject/body too long, etc.)
- 429: Rate limit exceeded (30 messages per hour)

---

### 5. Door Game Endpoints

#### GET /api/v1/doors
List available door games.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "doors": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "accessLevel": number,
      "canAccess": boolean
    }
  ]
}
```

**Errors**:
- 401: Not authenticated

---

#### POST /api/v1/doors/:id/enter
Enter a door game.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "sessionId": "uuid",
  "doorId": "string",
  "output": "string (ANSI formatted)",
  "state": {}
}
```

**Errors**:
- 401: Not authenticated
- 403: No access to door
- 404: Door not found

---

#### POST /api/v1/doors/:id/input
Send input to door game.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "sessionId": "uuid",
  "input": "string"
}
```

**Response** (200 OK):
```json
{
  "sessionId": "uuid",
  "output": "string (ANSI formatted)",
  "state": {},
  "isComplete": boolean
}
```

**Errors**:
- 401: Not authenticated
- 404: Door session not found
- 429: Rate limit exceeded (10 requests per minute)

---

#### POST /api/v1/doors/:id/exit
Exit door game.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "sessionId": "uuid"
}
```

**Response** (204 No Content)

**Errors**:
- 401: Not authenticated
- 404: Door session not found

---

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional information
  }
}
```

### Error Codes

- `INVALID_INPUT`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Read operations | 100 requests | 15 minutes |
| Write operations | 30 requests | 1 minute |
| Message posting | 30 messages | 1 hour |
| Door game input | 10 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response**:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## WebSocket Notification Events

### Event Types

1. **message.new**: New message posted
2. **user.joined**: User connected
3. **user.left**: User disconnected
4. **system.announcement**: System message
5. **door.update**: Door game state change

### Event Format

```json
{
  "type": "message.new",
  "timestamp": "ISO8601",
  "data": {
    // Event-specific data
  }
}
```

### Subscription

Clients subscribe to events via WebSocket:

```json
{
  "action": "subscribe",
  "events": ["message.new", "user.joined"]
}
```

## Implementation Notes

### Backward Compatibility

- Existing WebSocket commands remain functional
- Terminal client can use either REST or WebSocket
- Graceful fallback if REST API unavailable

### Security

- All endpoints require JWT authentication (except register/login)
- Input sanitization on all user-provided data
- Rate limiting per user and per IP
- CORS configured for control panel origin

### Performance

- Database queries optimized with indexes
- Response caching where appropriate
- Pagination to limit response sizes
- Connection pooling for database

## Next Steps

1. Create OpenAPI 3.0 specification
2. Implement authentication endpoints
3. Implement user management endpoints
4. Implement message endpoints
5. Implement door game endpoints
6. Add WebSocket notification system
7. Update terminal client to use REST API
8. Create test suite
9. Generate API documentation
