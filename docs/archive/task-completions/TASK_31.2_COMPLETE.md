# Task 31.2 Complete: Door Session Management via API

## Summary

Successfully implemented comprehensive door session management via the REST API, including:

1. **Door State Persistence**: Door state is maintained in session data and persisted to database
2. **Door Timeout Handling**: Automatic cleanup of inactive door sessions after 30 minutes
3. **Concurrent Door Sessions**: Full support for multiple users in different doors simultaneously

## Implementation Details

### 1. Session Manager Enhancements

Added methods to `SessionManager` to support door session queries:

- `getSessionsInDoor(doorId: string)`: Get all sessions currently in a specific door
- `getDoorSessionCount(doorId: string)`: Get count of active sessions in a door

### 2. Door Handler Timeout Management

Enhanced `DoorHandler` with automatic timeout handling:

- **Timeout Checking**: Periodic checks every 5 minutes for inactive door sessions
- **Configurable Timeout**: Default 30 minutes, configurable via `setDoorTimeout()`
- **Graceful Exit**: Automatically exits doors on timeout while preserving state
- **State Persistence**: Saves door state to database before timeout exit

Key methods added:
- `startTimeoutChecking()`: Starts periodic timeout checks
- `stopTimeoutChecking()`: Stops timeout checking
- `checkDoorTimeouts()`: Checks all door sessions for timeouts
- `exitDoorDueToTimeout()`: Handles graceful exit on timeout
- `setDoorTimeout(timeoutMs)`: Configure timeout duration
- `getDoorTimeout()`: Get current timeout setting

### 3. New REST API Endpoints

#### GET /api/v1/doors/:id/session
Get information about the current user's session in a specific door.

**Response:**
```json
{
  "inDoor": true,
  "sessionId": "uuid",
  "doorId": "oracle",
  "doorName": "The Oracle",
  "lastActivity": "2025-12-01T17:00:00Z",
  "gameState": {}
}
```

#### GET /api/v1/doors/sessions (Admin Only)
List all active door sessions across all doors.

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "uuid",
      "userId": "uuid",
      "handle": "testuser",
      "doorId": "oracle",
      "doorName": "The Oracle",
      "lastActivity": "2025-12-01T17:00:00Z",
      "inactiveTime": 120000
    }
  ],
  "totalCount": 1
}
```

#### GET /api/v1/doors/:id/stats
Get statistics about a specific door game.

**Response:**
```json
{
  "doorId": "oracle",
  "doorName": "The Oracle",
  "activeSessions": 3,
  "timeout": 1800000
}
```

### 4. OpenAPI Documentation

Updated `server/openapi.yaml` with complete documentation for all new endpoints including:
- Request/response schemas
- Authentication requirements
- Error responses
- Example payloads

### 5. Comprehensive Testing

Added test coverage for all new endpoints:
- Session info retrieval (in door and not in door)
- Admin session listing with permission checks
- Door statistics retrieval
- Error handling for non-existent doors
- Authentication requirements

All 47 tests passing, including:
- 4 tests for GET /api/v1/doors/:id/session
- 3 tests for GET /api/v1/doors/sessions
- 3 tests for GET /api/v1/doors/:id/stats

## Concurrent Session Support

The implementation fully supports concurrent door sessions:

1. **Session Isolation**: Each user has their own session with independent door state
2. **Multiple Doors**: Different users can be in different doors simultaneously
3. **Same Door**: Multiple users can be in the same door at the same time
4. **State Management**: Each session maintains its own game state and history
5. **Database Persistence**: Door sessions are persisted per user per door

## Timeout Behavior

Door sessions automatically timeout after 30 minutes of inactivity:

1. **Periodic Checks**: System checks every 5 minutes for inactive sessions
2. **Graceful Exit**: Calls door's exit method before cleanup
3. **State Preservation**: Saves current state to database before exit
4. **Session Cleanup**: Returns session to menu state
5. **Configurable**: Timeout duration can be adjusted via `setDoorTimeout()`

## Requirements Validation

✅ **Maintain door state in session**: Door state is stored in `session.data.door` with gameState and history

✅ **Handle door timeouts**: Automatic timeout checking with configurable duration (default 30 minutes)

✅ **Support concurrent door sessions**: Full support for multiple users in multiple doors with proper isolation

## Files Modified

1. `server/src/session/SessionManager.ts` - Added door session query methods
2. `server/src/handlers/DoorHandler.ts` - Added timeout handling and management
3. `server/src/api/routes.ts` - Added three new REST endpoints
4. `server/openapi.yaml` - Added API documentation for new endpoints
5. `server/src/api/routes.test.ts` - Added comprehensive test coverage

## Testing

All tests passing:
```
✓ src/api/routes.test.ts (47 tests) 218ms
  ✓ GET /api/v1/doors/:id/session (4 tests)
  ✓ GET /api/v1/doors/sessions (3 tests)
  ✓ GET /api/v1/doors/:id/stats (3 tests)
```

## Next Steps

Task 31.2 is complete. The door session management system is fully functional with:
- State persistence
- Timeout handling
- Concurrent session support
- Comprehensive API endpoints
- Full test coverage

Ready to proceed with task 31.3 or other Milestone 6 tasks.
