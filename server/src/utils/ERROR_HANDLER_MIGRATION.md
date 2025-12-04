# Error Handler Migration Guide

## Overview

The `ErrorHandler` utility class provides centralized, consistent error handling across the application. This document tracks the migration from inline error handling to using the ErrorHandler utility.

## Benefits

1. **Consistency**: All error responses follow the same format
2. **Maintainability**: Error handling logic is centralized
3. **Type Safety**: Strongly typed error codes and responses
4. **Convenience**: Helper methods for common error scenarios
5. **Automatic Detection**: Smart error detection from error messages

## Usage Examples

### Basic Error Sending

```typescript
// Old way
reply.code(404).send({
  error: {
    code: 'NOT_FOUND',
    message: 'User not found',
    timestamp: new Date().toISOString(),
  },
});

// New way
ErrorHandler.sendNotFoundError(reply, 'User not found');
```

### Validation

```typescript
// Old way
if (!handle || !password) {
  reply.code(400).send({
    error: {
      code: 'INVALID_INPUT',
      message: 'Handle and password are required',
    },
  });
  return;
}

// New way
if (!ErrorHandler.validateRequired(reply, { handle, password }, ['handle', 'password'])) return;
```

### Service Availability Check

```typescript
// Old way
if (!messageService) {
  reply.code(501).send({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Message service not available',
    },
  });
  return;
}

// New way
if (!ErrorHandler.checkServiceAvailable(reply, messageService, 'Message service')) return;
```

### Resource Existence Check

```typescript
// Old way
const user = userRepository.findById(id);
if (!user) {
  reply.code(404).send({
    error: {
      code: 'NOT_FOUND',
      message: 'User not found',
    },
  });
  return;
}

// New way
const user = ErrorHandler.checkResourceExists(reply, userRepository.findById(id), 'User');
if (!user) return;
```

### Permission Check

```typescript
// Old way
if (currentUser.accessLevel < 255) {
  reply.code(403).send({
    error: {
      code: 'FORBIDDEN',
      message: 'Admin access required',
    },
  });
  return;
}

// New way
if (!ErrorHandler.checkPermission(reply, currentUser.accessLevel >= 255, 'Admin access required')) return;
```

### Error Handling in Try-Catch

```typescript
// Old way
try {
  // ... operation
} catch (error) {
  if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
    reply.code(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
      },
    });
  } else {
    reply.code(400).send({
      error: {
        code: 'INVALID_INPUT',
        message: error instanceof Error ? error.message : 'Operation failed',
      },
    });
  }
}

// New way
try {
  // ... operation
} catch (error) {
  ErrorHandler.handleError(reply, error);
}
```

## Migration Status

### ✅ Completed

- `server/src/utils/ErrorHandler.ts` - Created with comprehensive error handling utilities
- `server/src/utils/ErrorHandler.test.ts` - Full test coverage (32 tests passing)
- `server/src/api/middleware/auth.middleware.ts` - Updated to use ErrorHandler
- `server/src/api/types.ts` - Updated APIError interface to include details field
- `server/src/api/routes.ts` - Partially migrated:
  - Import statement updated
  - User access level update endpoint
  - Message base CRUD endpoints (create, update, delete)
  - Registration endpoint (POST /api/v1/auth/register)
  - Login endpoint (POST /api/v1/auth/login)

### 🔄 In Progress

- `server/src/api/routes.ts` - Remaining endpoints to migrate:
  - Token refresh endpoint
  - User profile endpoints (GET /api/v1/users/me, GET /api/v1/users/:id, PATCH /api/v1/users/:id)
  - Message base endpoints (GET /api/v1/message-bases, GET /api/v1/message-bases/:id, POST /api/v1/message-bases)
  - Message endpoints (GET /api/v1/message-bases/:id/messages, GET /api/v1/messages/:id, POST /api/v1/message-bases/:id/messages, POST /api/v1/messages/:id/replies)
  - Door endpoints (GET /api/v1/doors, POST /api/v1/doors/:id/enter, POST /api/v1/doors/:id/input, POST /api/v1/doors/:id/exit)
  - AI chat endpoint (POST /api/ai-chat)
  - Notification endpoints (POST /api/v1/notifications/broadcast)

### 📋 TODO

- Update remaining route handlers to use ErrorHandler
- Update any other files that have inline error handling
- Consider updating service layer to throw AppError instances
- Update documentation to reference ErrorHandler patterns

## Error Codes

The following error codes are available:

- `BAD_REQUEST` (400) - General bad request
- `UNAUTHORIZED` (401) - Authentication required or failed
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource already exists
- `RATE_LIMIT_EXCEEDED` (429) - Rate limit exceeded
- `INVALID_INPUT` (400) - Invalid input validation
- `INTERNAL_ERROR` (500) - Internal server error
- `NOT_IMPLEMENTED` (501) - Feature not implemented
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

## Smart Error Detection

The `ErrorHandler.handleError()` method automatically detects error types from error messages:

- Messages containing "Rate limit exceeded" → 429 Rate Limit Error
- Messages containing "not found" or "Not found" → 404 Not Found Error
- Messages containing "already exists" or "already taken" → 409 Conflict Error
- Other Error instances → 400 Bad Request
- Unknown error types → 500 Internal Error

## Next Steps

1. Continue migrating remaining route handlers
2. Update service layer to use AppError for better error context
3. Consider adding more specific error codes as needed
4. Update API documentation to reflect standardized error responses
