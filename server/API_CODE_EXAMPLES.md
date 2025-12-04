# BaudAgain BBS API - Code Examples

This document provides code examples for integrating with the BaudAgain BBS API in various programming languages.

## Table of Contents

- [JavaScript/Node.js Examples](#javascriptnodejs-examples)
- [Python Examples](#python-examples)
- [Common Workflows](#common-workflows)
- [Troubleshooting Guide](#troubleshooting-guide)

## JavaScript/Node.js Examples

### Setup

Install dependencies:

```bash
npm install axios
```

### Basic API Client

```javascript
// api-client.js
const axios = require('axios');

class BaudAgainClient {
  constructor(baseURL = 'http://localhost:8080/api/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to requests automatically
    this.client.interceptors.request.use(config => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle errors consistently
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          const { code, message } = error.response.data.error || {};
          throw new Error(`API Error (${code}): ${message}`);
        }
        throw error;
      }
    );
  }

  setToken(token) {
    this.token = token;
  }

  // Authentication
  async register(handle, password, profile = {}) {
    const response = await this.client.post('/auth/register', {
      handle,
      password,
      ...profile
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async login(handle, password) {
    const response = await this.client.post('/auth/login', {
      handle,
      password
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Message Bases
  async getMessageBases() {
    const response = await this.client.get('/message-bases');
    return response.data.bases;
  }

  async getMessages(baseId, page = 1, limit = 50) {
    const response = await this.client.get(
      `/message-bases/${baseId}/messages`,
      { params: { page, limit } }
    );
    return response.data;
  }

  async postMessage(baseId, subject, body) {
    const response = await this.client.post(
      `/message-bases/${baseId}/messages`,
      { subject, body }
    );
    return response.data;
  }

  // Door Games
  async listDoors() {
    const response = await this.client.get('/doors');
    return response.data.doors;
  }

  async enterDoor(doorId) {
    const response = await this.client.post(`/doors/${doorId}/enter`);
    return response.data;
  }

  async sendDoorInput(doorId, input) {
    const response = await this.client.post(`/doors/${doorId}/input`, {
      input
    });
    return response.data;
  }

  async exitDoor(doorId) {
    const response = await this.client.post(`/doors/${doorId}/exit`);
    return response.data;
  }
}

module.exports = BaudAgainClient;
```

### Usage Example

```javascript
// example.js
const BaudAgainClient = require('./api-client');

async function main() {
  const client = new BaudAgainClient();

  try {
    // Register or login
    const { user, token } = await client.register('testuser', 'password123', {
      realName: 'Test User',
      location: 'Cyberspace'
    });
    console.log('Registered:', user.handle);

    // Get message bases
    const bases = await client.getMessageBases();
    console.log('Message bases:', bases.map(b => b.name));

    // Post a message
    if (bases.length > 0) {
      const message = await client.postMessage(
        bases[0].id,
        'Hello from Node.js!',
        'This message was posted using the JavaScript API client.'
      );
      console.log('Posted message:', message.id);
    }

    // Play The Oracle
    const doorEntry = await client.enterDoor('the_oracle');
    console.log(doorEntry.output);

    const response = await client.sendDoorInput(
      'the_oracle',
      'What is the future of BBSes?'
    );
    console.log(response.output);

    await client.exitDoor('the_oracle');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### WebSocket Integration

```javascript
// websocket-client.js
const WebSocket = require('ws');

class BaudAgainWebSocket {
  constructor(url = 'ws://localhost:8080', token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.handlers = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('WebSocket connected');
        
        // Authenticate if token provided
        if (this.token) {
          this.send({ type: 'auth', token: this.token });
        }
        
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
      });
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(events) {
    this.send({ type: 'subscribe', events });
  }

  on(eventType, handler) {
    this.handlers.set(eventType, handler);
  }

  handleMessage(message) {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
async function main() {
  const ws = new BaudAgainWebSocket('ws://localhost:8080', 'YOUR_TOKEN');

  // Set up event handlers
  ws.on('MESSAGE_NEW', (notification) => {
    console.log('New message:', notification.data);
  });

  ws.on('USER_JOINED', (notification) => {
    console.log('User joined:', notification.data.handle);
  });

  ws.on('USER_LEFT', (notification) => {
    console.log('User left:', notification.data.handle);
  });

  // Connect and subscribe
  await ws.connect();
  ws.subscribe(['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT']);

  // Keep connection alive
  process.on('SIGINT', () => {
    ws.close();
    process.exit();
  });
}

module.exports = BaudAgainWebSocket;
```

### React Integration

```javascript
// hooks/useBaudAgain.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export function useBaudAgain() {
  const [token, setToken] = useState(localStorage.getItem('bbs_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add token to requests
  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle errors
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // Token expired
        setToken(null);
        localStorage.removeItem('bbs_token');
      }
      throw error;
    }
  );

  const login = useCallback(async (handle, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { handle, password });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('bbs_token', newToken);
      return userData;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (handle, password, profile = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        handle,
        password,
        ...profile
      });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('bbs_token', newToken);
      return userData;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bbs_token');
  }, []);

  const getMessageBases = useCallback(async () => {
    const response = await api.get('/message-bases');
    return response.data.bases;
  }, [token]);

  const getMessages = useCallback(async (baseId, page = 1) => {
    const response = await api.get(`/message-bases/${baseId}/messages`, {
      params: { page, limit: 50 }
    });
    return response.data;
  }, [token]);

  const postMessage = useCallback(async (baseId, subject, body) => {
    const response = await api.post(`/message-bases/${baseId}/messages`, {
      subject,
      body
    });
    return response.data;
  }, [token]);

  // Load user on mount if token exists
  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then(response => setUser(response.data))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('bbs_token');
        });
    }
  }, [token]);

  return {
    token,
    user,
    loading,
    error,
    login,
    register,
    logout,
    getMessageBases,
    getMessages,
    postMessage,
    api
  };
}
```

## Python Examples

### Setup

Install dependencies:

```bash
pip install requests websocket-client
```

### Basic API Client

```python
# bbs_client.py
import requests
from typing import Optional, Dict, List, Any

class BaudAgainClient:
    def __init__(self, base_url: str = 'http://localhost:8080/api/v1'):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def _get_headers(self) -> Dict[str, str]:
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers
    
    def _handle_response(self, response: requests.Response) -> Any:
        if response.status_code >= 400:
            error_data = response.json().get('error', {})
            raise Exception(f"API Error ({error_data.get('code')}): {error_data.get('message')}")
        return response.json()
    
    # Authentication
    def register(self, handle: str, password: str, **profile) -> Dict:
        response = self.session.post(
            f'{self.base_url}/auth/register',
            json={'handle': handle, 'password': password, **profile}
        )
        data = self._handle_response(response)
        self.token = data['token']
        return data
    
    def login(self, handle: str, password: str) -> Dict:
        response = self.session.post(
            f'{self.base_url}/auth/login',
            json={'handle': handle, 'password': password}
        )
        data = self._handle_response(response)
        self.token = data['token']
        return data
    
    def get_current_user(self) -> Dict:
        response = self.session.get(
            f'{self.base_url}/auth/me',
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    # Message Bases
    def get_message_bases(self) -> List[Dict]:
        response = self.session.get(
            f'{self.base_url}/message-bases',
            headers=self._get_headers()
        )
        data = self._handle_response(response)
        return data['bases']
    
    def get_messages(self, base_id: str, page: int = 1, limit: int = 50) -> Dict:
        response = self.session.get(
            f'{self.base_url}/message-bases/{base_id}/messages',
            params={'page': page, 'limit': limit},
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def post_message(self, base_id: str, subject: str, body: str) -> Dict:
        response = self.session.post(
            f'{self.base_url}/message-bases/{base_id}/messages',
            json={'subject': subject, 'body': body},
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    # Door Games
    def list_doors(self) -> List[Dict]:
        response = self.session.get(
            f'{self.base_url}/doors',
            headers=self._get_headers()
        )
        data = self._handle_response(response)
        return data['doors']
    
    def enter_door(self, door_id: str) -> Dict:
        response = self.session.post(
            f'{self.base_url}/doors/{door_id}/enter',
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def send_door_input(self, door_id: str, input_text: str) -> Dict:
        response = self.session.post(
            f'{self.base_url}/doors/{door_id}/input',
            json={'input': input_text},
            headers=self._get_headers()
        )
        return self._handle_response(response)
    
    def exit_door(self, door_id: str) -> Dict:
        response = self.session.post(
            f'{self.base_url}/doors/{door_id}/exit',
            headers=self._get_headers()
        )
        return self._handle_response(response)
```

### Usage Example

```python
# example.py
from bbs_client import BaudAgainClient

def main():
    client = BaudAgainClient()
    
    try:
        # Register or login
        result = client.register('testuser', 'password123', 
                                real_name='Test User',
                                location='Cyberspace')
        print(f"Registered: {result['user']['handle']}")
        
        # Get message bases
        bases = client.get_message_bases()
        print(f"Message bases: {[b['name'] for b in bases]}")
        
        # Post a message
        if bases:
            message = client.post_message(
                bases[0]['id'],
                'Hello from Python!',
                'This message was posted using the Python API client.'
            )
            print(f"Posted message: {message['id']}")
        
        # Play The Oracle
        door_entry = client.enter_door('the_oracle')
        print(door_entry['output'])
        
        response = client.send_door_input(
            'the_oracle',
            'What is the future of BBSes?'
        )
        print(response['output'])
        
        client.exit_door('the_oracle')
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
```

### WebSocket Integration

```python
# websocket_client.py
import json
import websocket
from typing import Callable, Dict, List

class BaudAgainWebSocket:
    def __init__(self, url: str = 'ws://localhost:8080', token: str = None):
        self.url = url
        self.token = token
        self.ws = None
        self.handlers: Dict[str, Callable] = {}
    
    def connect(self):
        self.ws = websocket.WebSocketApp(
            self.url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )
        self.ws.run_forever()
    
    def _on_open(self, ws):
        print('WebSocket connected')
        
        # Authenticate if token provided
        if self.token:
            self.send({'type': 'auth', 'token': self.token})
    
    def _on_message(self, ws, message):
        try:
            data = json.loads(message)
            self._handle_message(data)
        except json.JSONDecodeError as e:
            print(f'Failed to parse message: {e}')
    
    def _on_error(self, ws, error):
        print(f'WebSocket error: {error}')
    
    def _on_close(self, ws, close_status_code, close_msg):
        print('WebSocket disconnected')
    
    def send(self, data: Dict):
        if self.ws:
            self.ws.send(json.dumps(data))
    
    def subscribe(self, events: List[str]):
        self.send({'type': 'subscribe', 'events': events})
    
    def on(self, event_type: str, handler: Callable):
        self.handlers[event_type] = handler
    
    def _handle_message(self, message: Dict):
        event_type = message.get('type')
        handler = self.handlers.get(event_type)
        if handler:
            handler(message)
    
    def close(self):
        if self.ws:
            self.ws.close()

# Usage
def main():
    ws = BaudAgainWebSocket('ws://localhost:8080', 'YOUR_TOKEN')
    
    # Set up event handlers
    ws.on('MESSAGE_NEW', lambda msg: print(f"New message: {msg['data']}"))
    ws.on('USER_JOINED', lambda msg: print(f"User joined: {msg['data']['handle']}"))
    ws.on('USER_LEFT', lambda msg: print(f"User left: {msg['data']['handle']}"))
    
    # Connect and subscribe
    ws.connect()
    ws.subscribe(['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT'])

if __name__ == '__main__':
    main()
```


## Common Workflows

### 1. User Registration and First Message

**JavaScript:**
```javascript
async function newUserWorkflow() {
  const client = new BaudAgainClient();
  
  // Register
  const { user } = await client.register('newbie', 'secure123', {
    realName: 'New User',
    location: 'Internet'
  });
  console.log(`Welcome, ${user.handle}!`);
  
  // Get message bases
  const bases = await client.getMessageBases();
  const generalBase = bases.find(b => b.name.includes('General'));
  
  // Post first message
  await client.postMessage(
    generalBase.id,
    'Hello everyone!',
    'Just joined this BBS. Looking forward to chatting with you all!'
  );
  
  console.log('First message posted!');
}
```

**Python:**
```python
def new_user_workflow():
    client = BaudAgainClient()
    
    # Register
    result = client.register('newbie', 'secure123',
                            real_name='New User',
                            location='Internet')
    print(f"Welcome, {result['user']['handle']}!")
    
    # Get message bases
    bases = client.get_message_bases()
    general_base = next(b for b in bases if 'General' in b['name'])
    
    # Post first message
    client.post_message(
        general_base['id'],
        'Hello everyone!',
        'Just joined this BBS. Looking forward to chatting with you all!'
    )
    
    print('First message posted!')
```

### 2. Reading and Replying to Messages

**JavaScript:**
```javascript
async function readAndReply() {
  const client = new BaudAgainClient();
  await client.login('myhandle', 'mypassword');
  
  // Get message bases
  const bases = await client.getMessageBases();
  
  // Get messages from first base
  const { messages } = await client.getMessages(bases[0].id);
  
  // Find unread messages (you'd track this in your app)
  const latestMessage = messages[0];
  console.log(`Subject: ${latestMessage.subject}`);
  console.log(`From: ${latestMessage.authorHandle}`);
  console.log(`Body: ${latestMessage.body}`);
  
  // Reply to the message
  await client.postMessage(
    bases[0].id,
    `Re: ${latestMessage.subject}`,
    'Thanks for your message! Here is my reply...'
  );
}
```

**Python:**
```python
def read_and_reply():
    client = BaudAgainClient()
    client.login('myhandle', 'mypassword')
    
    # Get message bases
    bases = client.get_message_bases()
    
    # Get messages from first base
    result = client.get_messages(bases[0]['id'])
    messages = result['messages']
    
    # Find latest message
    latest = messages[0]
    print(f"Subject: {latest['subject']}")
    print(f"From: {latest['authorHandle']}")
    print(f"Body: {latest['body']}")
    
    # Reply
    client.post_message(
        bases[0]['id'],
        f"Re: {latest['subject']}",
        'Thanks for your message! Here is my reply...'
    )
```

### 3. Playing a Door Game Session

**JavaScript:**
```javascript
async function playOracleSession() {
  const client = new BaudAgainClient();
  await client.login('myhandle', 'mypassword');
  
  // Enter The Oracle
  const entry = await client.enterDoor('the_oracle');
  console.log(entry.output);
  
  // Ask multiple questions
  const questions = [
    'What is my destiny?',
    'Will I find success?',
    'What should I focus on?'
  ];
  
  for (const question of questions) {
    const response = await client.sendDoorInput('the_oracle', question);
    console.log(`\nQ: ${question}`);
    console.log(`A: ${response.output}`);
    
    // Wait a bit between questions
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Exit
  const exit = await client.exitDoor('the_oracle');
  console.log(exit.output);
}
```

**Python:**
```python
import time

def play_oracle_session():
    client = BaudAgainClient()
    client.login('myhandle', 'mypassword')
    
    # Enter The Oracle
    entry = client.enter_door('the_oracle')
    print(entry['output'])
    
    # Ask multiple questions
    questions = [
        'What is my destiny?',
        'Will I find success?',
        'What should I focus on?'
    ]
    
    for question in questions:
        response = client.send_door_input('the_oracle', question)
        print(f"\nQ: {question}")
        print(f"A: {response['output']}")
        
        # Wait a bit between questions
        time.sleep(2)
    
    # Exit
    exit_response = client.exit_door('the_oracle')
    print(exit_response['output'])
```

### 4. Real-time Notification Monitoring

**JavaScript:**
```javascript
async function monitorNotifications() {
  const apiClient = new BaudAgainClient();
  const { token } = await apiClient.login('myhandle', 'mypassword');
  
  const ws = new BaudAgainWebSocket('ws://localhost:8080', token);
  
  // Track new messages
  const newMessages = [];
  ws.on('MESSAGE_NEW', (notification) => {
    newMessages.push(notification.data);
    console.log(`New message in ${notification.data.messageBaseName}:`);
    console.log(`  Subject: ${notification.data.subject}`);
    console.log(`  From: ${notification.data.authorHandle}`);
  });
  
  // Track user activity
  ws.on('USER_JOINED', (notification) => {
    console.log(`${notification.data.handle} joined the BBS`);
  });
  
  ws.on('USER_LEFT', (notification) => {
    console.log(`${notification.data.handle} left the BBS`);
  });
  
  // System announcements
  ws.on('SYSTEM_ANNOUNCEMENT', (notification) => {
    console.log(`ANNOUNCEMENT: ${notification.data.message}`);
  });
  
  await ws.connect();
  ws.subscribe(['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT', 'SYSTEM_ANNOUNCEMENT']);
  
  console.log('Monitoring notifications... Press Ctrl+C to exit');
}
```

**Python:**
```python
def monitor_notifications():
    api_client = BaudAgainClient()
    result = api_client.login('myhandle', 'mypassword')
    token = result['token']
    
    ws = BaudAgainWebSocket('ws://localhost:8080', token)
    
    # Track new messages
    new_messages = []
    
    def on_message_new(notification):
        data = notification['data']
        new_messages.append(data)
        print(f"New message in {data['messageBaseName']}:")
        print(f"  Subject: {data['subject']}")
        print(f"  From: {data['authorHandle']}")
    
    def on_user_joined(notification):
        print(f"{notification['data']['handle']} joined the BBS")
    
    def on_user_left(notification):
        print(f"{notification['data']['handle']} left the BBS")
    
    def on_announcement(notification):
        print(f"ANNOUNCEMENT: {notification['data']['message']}")
    
    ws.on('MESSAGE_NEW', on_message_new)
    ws.on('USER_JOINED', on_user_joined)
    ws.on('USER_LEFT', on_user_left)
    ws.on('SYSTEM_ANNOUNCEMENT', on_announcement)
    
    ws.connect()
    ws.subscribe(['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT', 'SYSTEM_ANNOUNCEMENT'])
    
    print('Monitoring notifications... Press Ctrl+C to exit')
```

### 5. Admin Operations

**JavaScript:**
```javascript
async function adminOperations() {
  const client = new BaudAgainClient();
  await client.login('sysop', 'adminpass');
  
  // Create a new message base
  const newBase = await client.api.post('/message-bases', {
    name: 'Tech Talk',
    description: 'Discuss technology and programming',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    sortOrder: 5
  });
  console.log(`Created message base: ${newBase.data.name}`);
  
  // List all users
  const usersResponse = await client.api.get('/users');
  console.log(`Total users: ${usersResponse.data.pagination.total}`);
  
  // Send system announcement
  await client.api.post('/system/announcement', {
    message: 'Server maintenance tonight at 10 PM',
    priority: 'high'
  });
  console.log('Announcement sent');
}
```

**Python:**
```python
def admin_operations():
    client = BaudAgainClient()
    client.login('sysop', 'adminpass')
    
    # Create a new message base
    response = client.session.post(
        f'{client.base_url}/message-bases',
        json={
            'name': 'Tech Talk',
            'description': 'Discuss technology and programming',
            'accessLevelRead': 0,
            'accessLevelWrite': 10,
            'sortOrder': 5
        },
        headers=client._get_headers()
    )
    new_base = client._handle_response(response)
    print(f"Created message base: {new_base['name']}")
    
    # List all users
    response = client.session.get(
        f'{client.base_url}/users',
        headers=client._get_headers()
    )
    users_data = client._handle_response(response)
    print(f"Total users: {users_data['pagination']['total']}")
    
    # Send system announcement
    response = client.session.post(
        f'{client.base_url}/system/announcement',
        json={
            'message': 'Server maintenance tonight at 10 PM',
            'priority': 'high'
        },
        headers=client._get_headers()
    )
    client._handle_response(response)
    print('Announcement sent')
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Authentication Errors

**Problem:** Getting 401 Unauthorized errors

**Solutions:**
- Check that you're including the `Authorization: Bearer <token>` header
- Verify the token hasn't expired (tokens expire after 24 hours)
- Try logging in again to get a fresh token
- Make sure you're using the correct token format

```javascript
// Correct
headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }

// Incorrect
headers: { 'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
```

#### 2. Rate Limiting

**Problem:** Getting 429 Rate Limit Exceeded errors

**Solutions:**
- Implement exponential backoff in your client
- Check the `retryAfter` value in the error response
- Reduce request frequency
- Cache responses when possible

```javascript
async function requestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.error.details.retryAfter || 60;
        console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### 3. WebSocket Connection Issues

**Problem:** WebSocket disconnects frequently

**Solutions:**
- Implement reconnection logic with exponential backoff
- Send periodic ping messages to keep connection alive
- Handle connection errors gracefully

```javascript
class ReconnectingWebSocket {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.connect();
  }

  connect() {
    this.ws = new BaudAgainWebSocket(this.url, this.token);
    
    this.ws.ws.on('close', () => {
      console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
      setTimeout(() => {
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2,
          this.maxReconnectDelay
        );
        this.connect();
      }, this.reconnectDelay);
    });

    this.ws.ws.on('open', () => {
      this.reconnectDelay = 1000; // Reset delay on successful connection
    });
  }
}
```

#### 4. CORS Errors (Browser)

**Problem:** CORS errors when making requests from browser

**Solutions:**
- Ensure the server has CORS enabled for your origin
- For development, the server allows `http://localhost:*`
- For production, configure the server's CORS settings
- Use a proxy in development if needed

```javascript
// Vite proxy configuration (vite.config.js)
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
}
```

#### 5. Invalid Input Errors

**Problem:** Getting 400 Invalid Input errors

**Solutions:**
- Check request body format matches API expectations
- Ensure required fields are present
- Validate data types (strings, numbers, etc.)
- Check field length constraints

```javascript
// Handle validation errors
try {
  await client.register('ab', 'short'); // Handle too short
} catch (error) {
  if (error.message.includes('INVALID_INPUT')) {
    console.error('Validation failed:', error.message);
    // Show user-friendly error message
  }
}
```

#### 6. Door Game Session Issues

**Problem:** Door game state not persisting

**Solutions:**
- Always use the same session (don't create multiple sessions)
- Check if you're properly exiting doors before entering again
- Use the resume endpoint to continue saved sessions
- Verify session hasn't timed out (10 minute timeout)

```javascript
async function resumeOrEnterDoor(client, doorId) {
  try {
    // Try to resume existing session
    const session = await client.api.get(`/doors/${doorId}/session`);
    if (session.data.hasSavedSession) {
      return await client.api.post(`/doors/${doorId}/resume`);
    }
  } catch (error) {
    // No saved session, enter normally
  }
  return await client.enterDoor(doorId);
}
```

#### 7. Token Expiration Handling

**Problem:** Tokens expire after 24 hours

**Solutions:**
- Implement automatic token refresh
- Store token expiration time
- Refresh token before it expires
- Handle 401 errors by refreshing token

```javascript
class TokenManager {
  constructor(client) {
    this.client = client;
    this.token = null;
    this.expiresAt = null;
  }

  async ensureValidToken() {
    if (!this.token || Date.now() >= this.expiresAt) {
      await this.refreshToken();
    }
    return this.token;
  }

  async refreshToken() {
    const response = await this.client.api.post('/auth/refresh', {
      token: this.token
    });
    this.token = response.data.token;
    // JWT tokens typically expire in 24 hours
    this.expiresAt = Date.now() + (23 * 60 * 60 * 1000);
  }
}
```

#### 8. Debugging API Requests

**Problem:** Need to see what's being sent/received

**Solutions:**
- Enable verbose logging in your HTTP client
- Use browser DevTools Network tab
- Add request/response interceptors
- Use tools like Postman or curl for testing

```javascript
// Add logging interceptor
api.interceptors.request.use(config => {
  console.log('Request:', {
    method: config.method,
    url: config.url,
    data: config.data,
    headers: config.headers
  });
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Error:', {
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
);
```

### Performance Tips

1. **Batch Operations**: When possible, batch multiple operations together
2. **Caching**: Cache message bases and user lists that don't change often
3. **Pagination**: Use pagination for large result sets
4. **WebSocket for Real-time**: Use WebSocket notifications instead of polling
5. **Connection Pooling**: Reuse HTTP connections with keep-alive

### Security Best Practices

1. **Never Log Tokens**: Don't log JWT tokens in production
2. **HTTPS in Production**: Always use HTTPS in production
3. **Secure Token Storage**: Store tokens securely (not in localStorage for sensitive apps)
4. **Validate Input**: Always validate user input before sending to API
5. **Handle Errors Gracefully**: Don't expose error details to end users

### Getting Help

- **API Documentation**: See `openapi.yaml` for complete API reference
- **curl Examples**: See `API_CURL_EXAMPLES.md` for working examples
- **Postman Collection**: Import `BaudAgain-API.postman_collection.json` for testing
- **GitHub Issues**: Report bugs and request features on GitHub
- **Server Logs**: Check server logs for detailed error information

