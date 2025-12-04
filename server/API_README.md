# BaudAgain BBS API Documentation

Welcome to the BaudAgain BBS API! This directory contains comprehensive documentation and tools for working with the REST API.

## 📚 Documentation Files

- **[openapi.yaml](./openapi.yaml)** - Complete OpenAPI 3.0 specification
- **[API_CURL_EXAMPLES.md](./API_CURL_EXAMPLES.md)** - Comprehensive curl examples for all endpoints
- **[API_CODE_EXAMPLES.md](./API_CODE_EXAMPLES.md)** - Code examples in JavaScript, Python, and React
- **[MOBILE_APP_GUIDE.md](./MOBILE_APP_GUIDE.md)** - Complete guide for building mobile apps
- **[BaudAgain-API.postman_collection.json](./BaudAgain-API.postman_collection.json)** - Postman collection for testing

## 🚀 Quick Start

### 1. Start the Server

```bash
cd server
npm install
npm run dev
```

The API will be available at: `http://localhost:8080/api/v1`

### 2. Register a User

```bash
curl -X POST "http://localhost:8080/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "testuser",
    "password": "password123"
  }'
```

### 3. Save Your Token

```bash
export TOKEN="your_jwt_token_from_response"
```

### 4. Make Authenticated Requests

```bash
curl -X GET "http://localhost:8080/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

## 📖 Using the Documentation

### OpenAPI Specification

The `openapi.yaml` file provides a complete, machine-readable API specification. You can:

1. **View in Swagger UI**: Import into [Swagger Editor](https://editor.swagger.io/)
2. **Generate Client Libraries**: Use [OpenAPI Generator](https://openapi-generator.tech/)
3. **Validate Requests**: Use tools like [Spectral](https://stoplight.io/open-source/spectral)

### curl Examples

The `API_CURL_EXAMPLES.md` file contains:
- Complete examples for every endpoint
- Expected request/response formats
- Error handling examples
- Complete workflow examples
- Testing tips and tricks

### Code Examples

The `API_CODE_EXAMPLES.md` file provides:
- JavaScript/Node.js client implementation
- Python client implementation
- React hooks for integration
- WebSocket client examples
- Common workflow implementations
- Comprehensive troubleshooting guide

### Mobile App Guide

The `MOBILE_APP_GUIDE.md` provides:
- Complete React Native setup
- Mobile app architecture patterns
- API integration examples
- WebSocket notification handling
- Best practices for mobile development
- Performance optimization tips
- Security considerations

### Postman Collection

The `BaudAgain-API.postman_collection.json` provides:
- Pre-configured requests for all endpoints
- Automatic token management
- Environment variables
- Test scripts that auto-save IDs

#### Importing into Postman

1. Open Postman
2. Click "Import" button
3. Select `BaudAgain-API.postman_collection.json`
4. Start testing!

#### Using the Collection

1. **Register or Login** - Run the "Register New User" or "Login" request
2. **Token Auto-Saved** - The JWT token is automatically saved to collection variables
3. **Test Other Endpoints** - All authenticated requests will use the saved token
4. **IDs Auto-Saved** - User IDs, message base IDs, etc. are automatically extracted and saved

## 🔑 Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

### Getting a Token

```bash
# Register
curl -X POST "http://localhost:8080/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"handle": "user", "password": "pass123"}'

# Or Login
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"handle": "user", "password": "pass123"}'
```

### Using the Token

Include the token in the `Authorization` header:

```bash
curl -X GET "http://localhost:8080/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 API Endpoints Overview

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

### Users
- `GET /users` - List users (admin)
- `GET /users/:id` - Get user profile
- `PATCH /users/:id` - Update user profile

### Message Bases
- `GET /message-bases` - List message bases
- `GET /message-bases/:id` - Get message base
- `POST /message-bases` - Create message base (admin)
- `PATCH /message-bases/:id` - Update message base (admin)
- `DELETE /message-bases/:id` - Delete message base (admin)

### Messages
- `GET /message-bases/:baseId/messages` - List messages
- `GET /messages/:id` - Get message
- `POST /message-bases/:baseId/messages` - Post message
- `POST /messages/:id/replies` - Post reply

### Door Games
- `GET /doors` - List doors
- `POST /doors/:id/enter` - Enter door
- `POST /doors/:id/input` - Send input
- `POST /doors/:id/exit` - Exit door
- `GET /doors/:id/session` - Get session info
- `POST /doors/:id/resume` - Resume session
- `GET /doors/my-sessions` - Get my sessions
- `GET /doors/sessions` - Get all sessions (admin)
- `GET /doors/:id/stats` - Get door stats

### System
- `POST /system/announcement` - Send announcement (admin)

## 🎯 Common Workflows

### Complete User Journey

```bash
# 1. Register
RESPONSE=$(curl -s -X POST "http://localhost:8080/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"handle": "newuser", "password": "pass123"}')

# 2. Extract token
TOKEN=$(echo $RESPONSE | jq -r '.token')

# 3. List message bases
curl -X GET "http://localhost:8080/api/v1/message-bases" \
  -H "Authorization: Bearer $TOKEN"

# 4. Post a message
curl -X POST "http://localhost:8080/api/v1/message-bases/BASE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject": "Hello!", "body": "My first message"}'

# 5. Play The Oracle
curl -X POST "http://localhost:8080/api/v1/doors/the_oracle/enter" \
  -H "Authorization: Bearer $TOKEN"
```

### Testing with Multiple Users

```bash
# Create test users
for i in {1..5}; do
  curl -X POST "http://localhost:8080/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"handle\": \"testuser$i\", \"password\": \"pass123\"}"
done
```

## ⚡ Rate Limits

The API enforces the following rate limits:

| Endpoint Type | Limit |
|--------------|-------|
| Authentication | 10 requests/minute |
| Read Operations | 100 requests/15 minutes |
| Write Operations | 30 requests/minute |
| Message Posting | 30 messages/hour |

When rate limited, you'll receive a `429` response with a `retryAfter` value.

## 🔍 Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Error Codes

- `INVALID_INPUT` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Not authorized
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMIT_EXCEEDED` (429) - Rate limit exceeded
- `INTERNAL_ERROR` (500) - Server error

## 🧪 Testing

### Manual Testing with curl

See [API_CURL_EXAMPLES.md](./API_CURL_EXAMPLES.md) for comprehensive examples.

### Automated Testing with Postman

1. Import the collection
2. Set up an environment with `baseUrl` variable
3. Run the entire collection with the Collection Runner
4. View test results and assertions

### Integration Tests

The API has comprehensive integration tests:

```bash
cd server
npm test -- routes.test.ts
```

## 🌐 WebSocket Notifications

In addition to the REST API, BaudAgain supports WebSocket notifications for real-time updates.

### Connecting

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_JWT_TOKEN'
  }));
  
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: ['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT']
  }));
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Notification:', notification);
};
```

### Event Types

- `MESSAGE_NEW` - New message posted
- `USER_JOINED` - User logged in
- `USER_LEFT` - User logged out
- `SYSTEM_ANNOUNCEMENT` - System announcement
- `DOOR_UPDATE` - Door game update

## 📱 Building Applications

### Mobile Apps

The REST API is designed for mobile app development:

- Efficient JSON responses
- Pagination support
- Token-based authentication
- Offline-friendly design

### Web Applications

Example React integration:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (handle, password) => {
  const response = await api.post('/auth/login', { handle, password });
  localStorage.setItem('token', response.data.token);
  return response.data.user;
};

// Get messages
const getMessages = async (baseId) => {
  const response = await api.get(`/message-bases/${baseId}/messages`);
  return response.data.messages;
};
```

## 🛠️ Development Tools

### Viewing OpenAPI Spec

```bash
# Install Swagger UI
npm install -g swagger-ui-watcher

# View the spec
swagger-ui-watcher server/openapi.yaml
```

### Generating Client Libraries

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i server/openapi.yaml \
  -g typescript-axios \
  -o ./generated-client
```

### API Validation

```bash
# Install Spectral
npm install -g @stoplight/spectral-cli

# Validate the spec
spectral lint server/openapi.yaml
```

## 📞 Support

- **Issues**: Report bugs on GitHub
- **Documentation**: See the main README.md
- **Examples**: Check API_CURL_EXAMPLES.md

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview
- [Architecture Guide](../ARCHITECTURE.md) - System architecture (includes hybrid architecture details)
- [WebSocket Notification Design](../WEBSOCKET_NOTIFICATION_DESIGN.md) - Real-time notifications
- [API Code Examples](./API_CODE_EXAMPLES.md) - JavaScript and Python examples
- [Mobile App Guide](./MOBILE_APP_GUIDE.md) - Building mobile applications

## 📝 License

MIT License - See LICENSE file for details
