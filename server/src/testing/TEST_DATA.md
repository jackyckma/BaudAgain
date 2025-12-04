# Test Data for MCP-Based Testing

## Test Users

The following test users are available for automated testing:

### 1. TestNewbie (NEW_USER Persona)
- **Handle**: `TestNewbie`
- **Password**: `TestPass123!`
- **Real Name**: Test Newbie
- **Location**: Test City
- **Bio**: A new user for testing
- **Access Level**: 10 (Default)
- **Purpose**: Testing new user registration flow and basic functionality

### 2. TestVeteran (RETURNING_USER Persona)
- **Handle**: `TestVeteran`
- **Password**: `VetPass456!`
- **Real Name**: Test Veteran
- **Location**: Test Town
- **Bio**: A returning user for testing
- **Access Level**: 10 (Default)
- **Purpose**: Testing returning user login, message posting, door games

### 3. TestAdmin (ADMIN_USER Persona)
- **Handle**: `TestAdmin`
- **Password**: `AdminPass789!`
- **Real Name**: Test Administrator
- **Location**: Admin HQ
- **Bio**: An admin user for testing
- **Access Level**: 255 (Admin)
- **Purpose**: Testing control panel administration and admin functions

## Test Message Bases

The system includes the following message bases (from database seed):

### 1. General Discussion
- **Access Level Read**: 0 (Public)
- **Access Level Write**: 10 (Default users)
- **Purpose**: General discussion and testing

### 2. System Announcements
- **Access Level Read**: 0 (Public)
- **Access Level Write**: 255 (Admin only)
- **Purpose**: System announcements

### 3. SysOp Chat
- **Access Level Read**: 10 (Default users)
- **Access Level Write**: 10 (Default users)
- **Purpose**: Chat with the SysOp

## Test Messages

Test messages have been created in the General Discussion message base:

### 1. Welcome to the Test BBS!
- **Subject**: Welcome to the Test BBS!
- **Author**: TestVeteran
- **Body**: This is a test message to verify message display functionality. It includes proper formatting and should display with subject, author, and timestamp.
- **Purpose**: Test basic message display

### 2. Testing ANSI Formatting
- **Subject**: Testing ANSI Formatting
- **Author**: TestVeteran
- **Body**: This message tests ANSI color codes and formatting. Green text and Bold red text should display correctly.
- **Purpose**: Test ANSI formatting in messages

### 3. Long Message Test
- **Subject**: Long Message Test
- **Author**: TestVeteran
- **Body**: This is a longer test message to verify that the message display can handle multiple lines of text. (repeated 5 times)
- **Purpose**: Test long message display and wrapping

## Setup Instructions

### Option 1: Using TypeScript Script (Recommended)

```bash
cd server
npx tsx scripts/setup-test-data.ts
```

**Note**: This script may have issues with the database.all method. If it fails, use Option 2.

### Option 2: Using Shell Script

```bash
cd server
./scripts/setup-test-data.sh
```

**Note**: This script uses the REST API to create test data. The server must be running.

### Option 3: Manual Setup via Terminal

1. Start the BBS server: `npm run dev` (in server directory)
2. Navigate to http://localhost:8080
3. Register each test user manually:
   - Type `NEW`
   - Enter handle, password, and profile information
4. Login as TestVeteran
5. Navigate to Message Bases
6. Post test messages

### Option 4: Manual Setup via REST API

```bash
# Create TestNewbie
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "TestNewbie",
    "password": "TestPass123!",
    "realName": "Test Newbie",
    "location": "Test City"
  }'

# Create TestVeteran
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "TestVeteran",
    "password": "VetPass456!",
    "realName": "Test Veteran",
    "location": "Test Town"
  }'

# Create TestAdmin
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "TestAdmin",
    "password": "AdminPass789!",
    "realName": "Test Administrator",
    "location": "Admin HQ"
  }'

# Login as TestVeteran to get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "TestVeteran",
    "password": "VetPass456!"
  }' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get message base ID
BASE_ID=$(curl -s -X GET http://localhost:3001/api/message-bases \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Create test messages
curl -X POST "http://localhost:3001/api/message-bases/$BASE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subject": "Welcome to the Test BBS!",
    "body": "This is a test message to verify message display functionality."
  }'
```

## Verification

After setup, verify test data exists:

### Verify Users

```bash
# Login as each user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle": "TestNewbie", "password": "TestPass123!"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle": "TestVeteran", "password": "VetPass456!"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle": "TestAdmin", "password": "AdminPass789!"}'
```

### Verify Message Bases

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle": "TestVeteran", "password": "VetPass456!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# List message bases
curl -X GET http://localhost:3001/api/message-bases \
  -H "Authorization: Bearer $TOKEN"
```

### Verify Messages

```bash
# Get message base ID
BASE_ID=$(curl -s -X GET http://localhost:3001/api/message-bases \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# List messages
curl -X GET "http://localhost:3001/api/message-bases/$BASE_ID/messages" \
  -H "Authorization: Bearer $TOKEN"
```

## Test Data Status

✅ **Test Users Created**: TestNewbie, TestVeteran, TestAdmin  
✅ **Message Bases Available**: General Discussion, System Announcements, SysOp Chat  
✅ **Test Messages Created**: 3 messages in General Discussion  

## Notes

- **Admin Access Level**: TestAdmin is created with access level 10 by default. To make it a true admin (level 255), you need to manually update the database:
  ```sql
  UPDATE users SET access_level = 255 WHERE handle = 'TestAdmin';
  ```

- **Message Base Creation**: Creating new message bases via API requires admin access. The existing message bases from the database seed are sufficient for testing.

- **Test Data Cleanup**: To reset test data, delete the test users from the database:
  ```sql
  DELETE FROM users WHERE handle IN ('TestNewbie', 'TestVeteran', 'TestAdmin');
  DELETE FROM messages WHERE user_id IN (SELECT id FROM users WHERE handle IN ('TestNewbie', 'TestVeteran', 'TestAdmin'));
  ```

## Using Test Data in MCP Tests

### Example: Login as TestVeteran

```typescript
// Navigate to terminal
mcp_chrome_devtools_navigate_page({ type: 'url', url: 'http://localhost:8080' });

// Wait for welcome screen
mcp_chrome_devtools_wait_for({ text: 'Enter your handle', timeout: 5000 });

// Enter handle
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: 'TestVeteran' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for password prompt
mcp_chrome_devtools_wait_for({ text: 'Password', timeout: 3000 });

// Enter password
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: 'VetPass456!' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Wait for main menu
mcp_chrome_devtools_wait_for({ text: 'Main Menu', timeout: 5000 });
```

### Example: Post a Message

```typescript
// Assuming already logged in as TestVeteran

// Navigate to Message Bases
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: 'M' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Select first message base
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: '1' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Post new message
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: 'P' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Enter subject
mcp_chrome_devtools_wait_for({ text: 'Subject', timeout: 3000 });
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: 'Test Subject' });
mcp_chrome_devtools_press_key({ key: 'Enter' });

// Enter body
mcp_chrome_devtools_wait_for({ text: 'Body', timeout: 3000 });
mcp_chrome_devtools_fill({ uid: 'terminal_input', value: 'Test message body' });
mcp_chrome_devtools_press_key({ key: 'Enter' });
```

## References

- [MCP Testing Helpers](./mcp-helpers.ts)
- [MCP Testing Guide](./mcp-test-guide.md)
- [Testing README](./README.md)
