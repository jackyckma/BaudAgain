# Task 32.4 Complete: Real-Time User Activity Updates

## Summary

Successfully implemented real-time user activity notifications for the BaudAgain BBS, including user join/leave events, system announcements, and door game activity broadcasting.

## Implementation Details

### 1. User Join/Leave Events

**Location**: `server/src/index.ts`

- **User Joined**: Broadcasts when a user successfully authenticates
  - Triggered after `notificationService.authenticateClient()` is called
  - Includes user ID, handle, and node number
  - Sent to all authenticated clients via `broadcastToAuthenticated()`

- **User Left**: Broadcasts when a user disconnects
  - Triggered in the connection `onClose()` handler
  - Captures session info before removal
  - Includes user ID, handle, and node number
  - Sent to all authenticated clients

**Event Payloads**:
```typescript
interface UserJoinedPayload {
  userId: string;
  handle: string;
  node: number;
}

interface UserLeftPayload {
  userId: string;
  handle: string;
  node: number;
}
```

### 2. System Announcements

**Location**: `server/src/api/routes.ts`

Added new REST API endpoint: `POST /api/v1/system/announcement`

**Features**:
- Admin-only access (access level >= 255)
- Message validation (1-500 characters)
- Priority levels: low, normal, high, critical
- Optional expiration timestamp
- Rate limited: 10 requests per minute
- Broadcasts to all authenticated clients

**Request Body**:
```json
{
  "message": "Server maintenance in 10 minutes",
  "priority": "high",
  "expiresAt": "2025-12-02T10:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Announcement sent successfully",
  "announcement": {
    "message": "Server maintenance in 10 minutes",
    "priority": "high",
    "expiresAt": "2025-12-02T10:00:00Z",
    "timestamp": "2025-12-01T21:30:00Z"
  }
}
```

### 3. Door Game Activity

**Location**: `server/src/handlers/DoorHandler.ts`

- **Door Entered**: Broadcasts when a user enters a door game
  - Triggered in `enterDoor()` method
  - Includes door ID, door name, user ID, and handle
  - Sent to all authenticated clients

- **Door Exited**: Broadcasts when a user exits a door game
  - Triggered in `exitDoor()` method
  - Includes door ID, user ID, and handle
  - Sent to all authenticated clients

**Event Payloads**:
```typescript
interface DoorEnteredPayload {
  doorId: string;
  doorName: string;
  userId: string;
  handle: string;
}

interface DoorExitedPayload {
  doorId: string;
  userId: string;
  handle: string;
}
```

## Architecture Changes

### 1. Handler Dependencies Update

**File**: `server/src/handlers/HandlerDependencies.ts`

Added `notificationService` to the handler dependencies interface:
```typescript
export interface HandlerDependencies {
  renderer: TerminalRenderer;
  sessionManager: SessionManager;
  aiSysOp?: AISysOp;
  notificationService?: NotificationService;  // NEW
}
```

### 2. API Routes Update

**File**: `server/src/api/routes.ts`

- Added `notificationService` parameter to `registerAPIRoutes()`
- Imported notification types and utilities
- Added system announcement endpoint with full validation

### 3. Server Integration

**File**: `server/src/index.ts`

- Imported notification types
- Added notification service to handler dependencies
- Passed notification service to API routes
- Implemented user join broadcasting on authentication
- Implemented user left broadcasting on disconnect

## Testing

### Test File: `server/src/notifications/user-activity.test.ts`

Created comprehensive test suite with 8 test cases:

1. **User Joined Events**
   - ✅ Broadcasts to authenticated clients
   - ✅ Does not broadcast to unauthenticated clients

2. **User Left Events**
   - ✅ Broadcasts to authenticated clients

3. **System Announcements**
   - ✅ Broadcasts to authenticated clients
   - ✅ Includes expiration time when provided

4. **Door Game Events**
   - ✅ Broadcasts door entered events
   - ✅ Broadcasts door exited events

5. **Event Timestamps**
   - ✅ All events include ISO 8601 timestamps

### Test Results

```
✓ src/notifications/user-activity.test.ts (8)
  ✓ User Activity Notifications (8)
    ✓ User Joined Events (2)
    ✓ User Left Events (1)
    ✓ System Announcements (2)
    ✓ Door Game Events (2)
    ✓ Event Timestamp (1)

Test Files  1 passed (1)
     Tests  8 passed (8)
```

**Full Test Suite**: All 126 tests pass ✅

## API Documentation

### OpenAPI Specification Update

**File**: `server/openapi.yaml`

- Added "System" tag for system administration endpoints
- Documented `/system/announcement` endpoint with:
  - Request/response schemas
  - Authentication requirements
  - Rate limiting information
  - Error responses
  - Example payloads

## Event Flow Diagram

```
User Authentication
    ↓
notificationService.authenticateClient()
    ↓
Broadcast USER_JOINED event
    ↓
All authenticated clients receive notification


User Disconnection
    ↓
connection.onClose()
    ↓
Broadcast USER_LEFT event
    ↓
All authenticated clients receive notification


Admin sends announcement
    ↓
POST /api/v1/system/announcement
    ↓
Validate admin access & message
    ↓
Broadcast SYSTEM_ANNOUNCEMENT event
    ↓
All authenticated clients receive notification


User enters door game
    ↓
DoorHandler.enterDoor()
    ↓
Broadcast DOOR_ENTERED event
    ↓
All authenticated clients receive notification


User exits door game
    ↓
DoorHandler.exitDoor()
    ↓
Broadcast DOOR_EXITED event
    ↓
All authenticated clients receive notification
```

## Requirements Validation

✅ **Requirement 17.1**: WebSocket Notification System
- User join/leave events broadcast to all authenticated clients
- System announcements broadcast to all authenticated clients
- Door game updates broadcast to all authenticated clients

✅ **Task 32.4 Acceptance Criteria**:
- ✅ Broadcast user join/leave events
- ✅ Send system announcements
- ✅ Handle door game updates

## Usage Examples

### Receiving User Activity Notifications (Client-side)

```javascript
// WebSocket client receives notifications
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  
  switch (notification.type) {
    case 'user.joined':
      console.log(`${notification.data.handle} joined (Node ${notification.data.node})`);
      break;
      
    case 'user.left':
      console.log(`${notification.data.handle} left (Node ${notification.data.node})`);
      break;
      
    case 'system.announcement':
      console.log(`[${notification.data.priority}] ${notification.data.message}`);
      break;
      
    case 'door.entered':
      console.log(`${notification.data.handle} entered ${notification.data.doorName}`);
      break;
      
    case 'door.exited':
      console.log(`${notification.data.handle} exited a door game`);
      break;
  }
};
```

### Sending System Announcement (Admin)

```bash
curl -X POST http://localhost:8080/api/v1/system/announcement \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Server maintenance in 10 minutes",
    "priority": "high"
  }'
```

## Files Modified

1. `server/src/index.ts` - User join/leave broadcasting
2. `server/src/api/routes.ts` - System announcement endpoint
3. `server/src/handlers/DoorHandler.ts` - Door game event broadcasting
4. `server/src/handlers/HandlerDependencies.ts` - Added notification service
5. `server/openapi.yaml` - API documentation

## Files Created

1. `server/src/notifications/user-activity.test.ts` - Comprehensive test suite
2. `TASK_32.4_COMPLETE.md` - This summary document

## Next Steps

Task 32.4 is now complete. The next task in Milestone 6 is:

**Task 33: Refactor Terminal Client**
- Update terminal to use REST API for actions
- Keep WebSocket for real-time notifications
- Maintain existing BBS user experience
- Add graceful fallback to WebSocket-only mode

## Notes

- Node tracking is currently hardcoded to 1 (TODO: Implement proper node allocation)
- All events include ISO 8601 timestamps for consistency
- System announcements are admin-only (access level >= 255)
- All broadcasts use `broadcastToAuthenticated()` to ensure only logged-in users receive notifications
- Door game updates are broadcast for visibility but don't require subscription
- Error handling is comprehensive with proper logging
