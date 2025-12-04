# BaudAgain BBS - Mobile App Development Guide

This guide provides everything you need to build native mobile applications for the BaudAgain BBS using React Native.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [React Native Example](#react-native-example)
- [Best Practices](#best-practices)
- [API Integration](#api-integration)
- [WebSocket Integration](#websocket-integration)
- [UI/UX Considerations](#uiux-considerations)
- [Performance Optimization](#performance-optimization)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

BaudAgain BBS provides a comprehensive REST API and WebSocket notification system designed specifically for mobile app development. The hybrid architecture ensures:

- **Efficient data transfer** with JSON responses
- **Real-time updates** via WebSocket notifications
- **Offline-friendly design** with proper error handling
- **Token-based authentication** for secure access
- **Pagination support** for large datasets

## Architecture

### Mobile App Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              UI Layer (React Native)              │  │
│  │  • Screens (Login, Messages, Doors, Profile)     │  │
│  │  • Components (MessageList, DoorGame, etc.)      │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              State Management (Redux/Context)     │  │
│  │  • Auth State                                     │  │
│  │  • Message State                                  │  │
│  │  • Notification State                             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              API Layer                            │  │
│  │  • REST API Client (axios)                       │  │
│  │  • WebSocket Client                               │  │
│  │  • Token Management                               │  │
│  │  • Error Handling                                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Storage Layer                        │  │
│  │  • AsyncStorage (tokens, preferences)            │  │
│  │  • Cache (messages, user data)                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  BaudAgain BBS Server                   │
│  • REST API (http://your-server:8080/api/v1)          │
│  • WebSocket (ws://your-server:8080)                   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Actions** → REST API calls (login, post message, etc.)
2. **Server Events** → WebSocket notifications (new messages, user activity)
3. **Local State** → Updated via Redux/Context
4. **UI Updates** → React Native re-renders

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

### Create New React Native Project

```bash
npx react-native init BaudAgainMobile
cd BaudAgainMobile
```

### Install Dependencies

```bash
npm install axios
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
```

For WebSocket support:
```bash
npm install react-native-websocket
```

For state management (optional):
```bash
npm install @reduxjs/toolkit react-redux
```

## React Native Example

### API Client Setup

```javascript
// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://your-server:8080/api/v1';
const TOKEN_KEY = '@bbs_token';

class BBSClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          // Navigate to login screen
        }
        throw error;
      }
    );
  }

  async register(handle, password, profile = {}) {
    const response = await this.client.post('/auth/register', {
      handle,
      password,
      ...profile
    });
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async login(handle, password) {
    const response = await this.client.post('/auth/login', {
      handle,
      password
    });
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async getMessageBases() {
    const response = await this.client.get('/message-bases');
    return response.data.bases;
  }

  async getMessages(baseId, page = 1) {
    const response = await this.client.get(
      `/message-bases/${baseId}/messages`,
      { params: { page, limit: 50 } }
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

export default new BBSClient();
```

### WebSocket Client

```javascript
// src/api/websocket.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = 'ws://your-server:8080';
const TOKEN_KEY = '@bbs_token';

class BBSWebSocket {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
  }

  async connect() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectDelay = 1000;
      
      // Authenticate
      if (token) {
        this.send({ type: 'auth', token });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };
  }

  reconnect() {
    setTimeout(() => {
      console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
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

export default new BBSWebSocket();
```

### Login Screen

```javascript
// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import BBSClient from '../api/client';

export default function LoginScreen({ navigation }) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!handle || !password) {
      Alert.alert('Error', 'Please enter handle and password');
      return;
    }

    setLoading(true);
    try {
      const { user } = await BBSClient.login(handle, password);
      navigation.replace('Main', { user });
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BaudAgain BBS</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Handle"
        value={handle}
        onChangeText={setHandle}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.linkText}>New user? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f0',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Courier'
  },
  input: {
    backgroundColor: '#111',
    color: '#0f0',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0f0',
    fontFamily: 'Courier'
  },
  button: {
    backgroundColor: '#0f0',
    padding: 15,
    borderRadius: 5,
    marginTop: 10
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Courier'
  },
  linkText: {
    color: '#0f0',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Courier'
  }
});
```


### Message List Screen

```javascript
// src/screens/MessageListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';
import BBSClient from '../api/client';

export default function MessageListScreen({ route, navigation }) {
  const { messageBase } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await BBSClient.getMessages(messageBase.id);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate('MessageDetail', { message: item })}
    >
      <Text style={styles.messageSubject}>{item.subject}</Text>
      <Text style={styles.messageInfo}>
        From: {item.authorHandle} • {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No messages yet</Text>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PostMessage', { messageBase })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  messageItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#0f0'
  },
  messageSubject: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier'
  },
  messageInfo: {
    color: '#0a0',
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'Courier'
  },
  emptyText: {
    color: '#0f0',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'Courier'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fabText: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold'
  }
});
```

### Door Game Screen

```javascript
// src/screens/DoorGameScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import BBSClient from '../api/client';

export default function DoorGameScreen({ route, navigation }) {
  const { door } = route.params;
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    enterDoor();
  }, []);

  const enterDoor = async () => {
    try {
      const response = await BBSClient.enterDoor(door.id);
      setOutput(response.output);
    } catch (error) {
      console.error('Failed to enter door:', error);
    }
  };

  const sendInput = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await BBSClient.sendDoorInput(door.id, input);
      setOutput(prev => prev + '\n' + input + '\n' + response.output);
      setInput('');
      
      if (response.exited) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to send input:', error);
    } finally {
      setLoading(false);
    }
  };

  const exitDoor = async () => {
    try {
      await BBSClient.exitDoor(door.id);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to exit door:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.output}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd()}
      >
        <Text style={styles.outputText}>{output}</Text>
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendInput}
          placeholder="Type your input..."
          placeholderTextColor="#0a0"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendInput}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.exitButton} onPress={exitDoor}>
        <Text style={styles.exitButtonText}>Exit Door</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  output: {
    flex: 1,
    padding: 10
  },
  outputText: {
    color: '#0f0',
    fontFamily: 'Courier',
    fontSize: 14
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f0'
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: '#0f0',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0f0',
    fontFamily: 'Courier'
  },
  sendButton: {
    backgroundColor: '#0f0',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center'
  },
  sendButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Courier'
  },
  exitButton: {
    backgroundColor: '#f00',
    padding: 15,
    margin: 10,
    borderRadius: 5
  },
  exitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'Courier'
  }
});
```

## Best Practices

### 1. Token Management

```javascript
// src/utils/tokenManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@bbs_token';
const TOKEN_EXPIRY_KEY = '@bbs_token_expiry';

export const saveToken = async (token) => {
  const expiryTime = Date.now() + (23 * 60 * 60 * 1000); // 23 hours
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [TOKEN_EXPIRY_KEY, expiryTime.toString()]
  ]);
};

export const getToken = async () => {
  const [[, token], [, expiry]] = await AsyncStorage.multiGet([
    TOKEN_KEY,
    TOKEN_EXPIRY_KEY
  ]);
  
  if (!token || !expiry) return null;
  
  if (Date.now() >= parseInt(expiry)) {
    await clearToken();
    return null;
  }
  
  return token;
};

export const clearToken = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, TOKEN_EXPIRY_KEY]);
};
```

### 2. Error Handling

```javascript
// src/utils/errorHandler.js
import { Alert } from 'react-native';

export const handleAPIError = (error, customMessage) => {
  let message = customMessage || 'An error occurred';
  
  if (error.response) {
    const errorData = error.response.data?.error;
    if (errorData) {
      message = errorData.message;
      
      // Handle specific error codes
      switch (errorData.code) {
        case 'RATE_LIMIT_EXCEEDED':
          message = `Rate limit exceeded. Please try again in ${errorData.details.retryAfter} seconds.`;
          break;
        case 'UNAUTHORIZED':
          message = 'Your session has expired. Please log in again.';
          break;
        case 'FORBIDDEN':
          message = 'You do not have permission to perform this action.';
          break;
      }
    }
  } else if (error.request) {
    message = 'Network error. Please check your connection.';
  }
  
  Alert.alert('Error', message);
};
```

### 3. Offline Support

```javascript
// src/utils/offlineManager.js
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.queue = [];
    
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline) {
        this.processQueue();
      }
    });
  }

  async addToQueue(request) {
    this.queue.push(request);
    await AsyncStorage.setItem('@offline_queue', JSON.stringify(this.queue));
  }

  async processQueue() {
    const queue = JSON.parse(await AsyncStorage.getItem('@offline_queue') || '[]');
    
    for (const request of queue) {
      try {
        await request();
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
    
    this.queue = [];
    await AsyncStorage.removeItem('@offline_queue');
  }
}

export default new OfflineManager();
```

### 4. Caching Strategy

```javascript
// src/utils/cache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const cacheData = async (key, data) => {
  const cacheEntry = {
    data,
    timestamp: Date.now()
  };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
};

export const getCachedData = async (key) => {
  const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  
  if (Date.now() - timestamp > CACHE_EXPIRY) {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
  
  return data;
};

export const clearCache = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(cacheKeys);
};
```

### 5. Real-time Notifications

```javascript
// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';
import BBSWebSocket from '../api/websocket';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    BBSWebSocket.connect();

    BBSWebSocket.on('MESSAGE_NEW', (notification) => {
      setNotifications(prev => [...prev, notification]);
      // Show local notification
      showLocalNotification(
        'New Message',
        `${notification.data.authorHandle}: ${notification.data.subject}`
      );
    });

    BBSWebSocket.on('USER_JOINED', (notification) => {
      console.log(`${notification.data.handle} joined`);
    });

    BBSWebSocket.subscribe(['MESSAGE_NEW', 'USER_JOINED', 'USER_LEFT']);

    return () => {
      BBSWebSocket.close();
    };
  }, []);

  return notifications;
};

const showLocalNotification = (title, body) => {
  // Use react-native-push-notification or similar
  // PushNotification.localNotification({ title, message: body });
};
```

## API Integration

### Pagination Handling

```javascript
// src/hooks/usePaginatedMessages.js
import { useState, useEffect } from 'react';
import BBSClient from '../api/client';

export const usePaginatedMessages = (baseId) => {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const data = await BBSClient.getMessages(baseId, page);
      setMessages(prev => [...prev, ...data.messages]);
      setHasMore(data.pagination.hasNext);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { messages, loadMore, hasMore, loading };
};
```

### Request Retry Logic

```javascript
// src/utils/retry.js
export const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Usage
const messages = await retryRequest(() => BBSClient.getMessages(baseId));
```

## WebSocket Integration

### Connection Management

```javascript
// src/services/websocketService.js
import BBSWebSocket from '../api/websocket';

class WebSocketService {
  constructor() {
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      await BBSWebSocket.connect();
      this.connected = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  disconnect() {
    BBSWebSocket.close();
    this.connected = false;
  }
}

export default new WebSocketService();
```

## UI/UX Considerations

### 1. Retro BBS Aesthetic

- Use monospace fonts (Courier, Courier New)
- Green-on-black color scheme (#0f0 on #000)
- ASCII art and box-drawing characters
- Terminal-style animations

### 2. ANSI Rendering

```javascript
// src/components/ANSIText.js
import React from 'react';
import { Text } from 'react-native';

// Simple ANSI color code parser
const parseANSI = (text) => {
  // Strip ANSI codes for mobile (or implement full parser)
  return text.replace(/\x1b\[[0-9;]*m/g, '');
};

export const ANSIText = ({ children, style }) => {
  const cleanText = parseANSI(children);
  return <Text style={style}>{cleanText}</Text>;
};
```

### 3. Responsive Design

```javascript
// src/utils/responsive.js
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isSmallDevice = width < 375;
export const isTablet = width >= 768;

export const scale = (size) => {
  const baseWidth = 375;
  return (width / baseWidth) * size;
};
```

## Performance Optimization

### 1. List Optimization

```javascript
// Use FlatList with proper optimization
<FlatList
  data={messages}
  renderItem={renderMessage}
  keyExtractor={item => item.id}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>
```

### 2. Image Caching

```javascript
// Use react-native-fast-image for better performance
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: avatarUrl }}
  style={styles.avatar}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 3. Memoization

```javascript
import React, { memo } from 'react';

const MessageItem = memo(({ message, onPress }) => (
  <TouchableOpacity onPress={() => onPress(message)}>
    <Text>{message.subject}</Text>
  </TouchableOpacity>
), (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id;
});
```

## Security

### 1. Secure Storage

```javascript
// Use react-native-keychain for sensitive data
import * as Keychain from 'react-native-keychain';

export const saveCredentials = async (username, password) => {
  await Keychain.setGenericPassword(username, password);
};

export const getCredentials = async () => {
  const credentials = await Keychain.getGenericPassword();
  return credentials ? { username: credentials.username, password: credentials.password } : null;
};
```

### 2. SSL Pinning

```javascript
// Configure SSL pinning in native code
// iOS: Info.plist
// Android: network_security_config.xml
```

### 3. Input Validation

```javascript
export const validateHandle = (handle) => {
  if (handle.length < 3 || handle.length > 20) {
    return 'Handle must be 3-20 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    return 'Handle can only contain letters, numbers, and underscores';
  }
  return null;
};
```

## Testing

### Unit Tests

```javascript
// __tests__/api/client.test.js
import BBSClient from '../../src/api/client';

describe('BBSClient', () => {
  it('should login successfully', async () => {
    const result = await BBSClient.login('testuser', 'password123');
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });

  it('should handle login failure', async () => {
    await expect(
      BBSClient.login('invalid', 'wrong')
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```javascript
// Use Detox for E2E testing
describe('Login Flow', () => {
  it('should login successfully', async () => {
    await element(by.id('handleInput')).typeText('testuser');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('loginButton')).tap();
    await expect(element(by.id('mainScreen'))).toBeVisible();
  });
});
```

## Deployment

### iOS

1. Configure App Store Connect
2. Set up provisioning profiles
3. Build release version:
```bash
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

### Android

1. Generate signing key
2. Configure gradle
3. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

### Environment Configuration

```javascript
// config.js
const ENV = {
  dev: {
    apiUrl: 'http://localhost:8080/api/v1',
    wsUrl: 'ws://localhost:8080'
  },
  prod: {
    apiUrl: 'https://your-bbs.com/api/v1',
    wsUrl: 'wss://your-bbs.com'
  }
};

export default ENV[__DEV__ ? 'dev' : 'prod'];
```

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [BaudAgain API Reference](./openapi.yaml)
- [WebSocket Notification Design](../WEBSOCKET_NOTIFICATION_DESIGN.md)
- [API Code Examples](./API_CODE_EXAMPLES.md)

## Support

For questions or issues:
- Check the API documentation
- Review code examples
- Open an issue on GitHub
- Contact the development team

