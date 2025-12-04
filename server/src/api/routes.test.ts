/**
 * API Routes Integration Tests
 * 
 * Tests for REST API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { registerAPIRoutes } from './routes.js';
import { UserRepository } from '../db/repositories/UserRepository.js';
import { MessageBaseRepository } from '../db/repositories/MessageBaseRepository.js';
import { MessageRepository } from '../db/repositories/MessageRepository.js';
import { MessageService } from '../services/MessageService.js';
import { SessionManager } from '../session/SessionManager.js';
import { JWTUtil } from '../auth/jwt.js';
import { BBSDatabase } from '../db/Database.js';
import type { BBSConfig } from '../config/ConfigLoader.js';
import bcrypt from 'bcrypt';
import pino from 'pino';
import { afterEach } from 'node:test';

describe('Message Base API Endpoints', () => {
  let server: any;
  let db: BBSDatabase;
  let userRepo: UserRepository;
  let messageBaseRepo: MessageBaseRepository;
  let messageRepo: MessageRepository;
  let messageService: MessageService;
  let sessionManager: SessionManager;
  let jwtUtil: JWTUtil;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Create logger for testing
    const logger = pino({ level: 'silent' });
    
    // Create in-memory database for testing
    db = new BBSDatabase(':memory:', logger as any);
    await db.ready();
    
    // Initialize repositories
    userRepo = new UserRepository(db);
    messageBaseRepo = new MessageBaseRepository(db);
    messageRepo = new MessageRepository(db);
    messageService = new MessageService(messageBaseRepo, messageRepo, userRepo, undefined);
    sessionManager = new SessionManager(logger as any);
    jwtUtil = new JWTUtil({ secret: 'test-secret-key-for-testing-only', expiresIn: '1h' });

    // Create test config
    const config: BBSConfig = {
      bbs: {
        name: 'Test BBS',
        tagline: 'Test',
        sysopName: 'TestSysOp',
        maxNodes: 4,
        defaultAccessLevel: 10,
        theme: 'classic',
      },
      network: {
        websocketPort: 8080,
      },
      ai: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        sysop: {
          enabled: false,
          personality: 'test',
          welcomeNewUsers: false,
          participateInChat: false,
          chatFrequency: 'only_when_paged',
        },
        doors: {
          enabled: false,
          maxTokensPerTurn: 150,
        },
      },
      security: {
        passwordMinLength: 6,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        rateLimit: {
          messagesPerHour: 30,
          doorRequestsPerMinute: 10,
        },
      },
      appearance: {
        welcomeScreen: 'welcome.ans',
        goodbyeScreen: 'goodbye.ans',
        menuTemplate: 'menu.ans',
      },
      messageBases: [],
      doors: [],
    } as any;

    // Create Fastify server
    server = Fastify();
    await registerAPIRoutes(
      server,
      userRepo,
      sessionManager,
      jwtUtil,
      config,
      messageBaseRepo,
      messageService
    );

    // Create test users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminUser = userRepo.create('admin', adminPasswordHash, {
      accessLevel: 255,
    });
    adminUserId = adminUser.id;
    adminToken = jwtUtil.generateToken({
      userId: adminUser.id,
      handle: adminUser.handle,
      accessLevel: adminUser.accessLevel,
    });

    const userPasswordHash = await bcrypt.hash('user123', 10);
    const regularUser = userRepo.create('testuser', userPasswordHash, {
      accessLevel: 10,
    });
    regularUserId = regularUser.id;
    userToken = jwtUtil.generateToken({
      userId: regularUser.id,
      handle: regularUser.handle,
      accessLevel: regularUser.accessLevel,
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    db.close();
  });

  describe('GET /api/v1/message-bases', () => {
    it('should list message bases for authenticated user', async () => {
      // Create a test message base
      messageService.createMessageBase({
        name: 'General Discussion',
        description: 'General chat',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        sortOrder: 0,
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/message-bases',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.messageBases).toBeDefined();
      expect(Array.isArray(data.messageBases)).toBe(true);
      expect(data.messageBases.length).toBeGreaterThan(0);
      expect(data.messageBases[0]).toHaveProperty('id');
      expect(data.messageBases[0]).toHaveProperty('name');
      expect(data.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/message-bases',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/message-bases?page=1&limit=10',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/v1/message-bases/:id', () => {
    it('should get message base details', async () => {
      const base = messageService.createMessageBase({
        name: 'Test Base',
        description: 'Test description',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        sortOrder: 0,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/message-bases/${base.id}`,
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.id).toBe(base.id);
      expect(data.name).toBe('Test Base');
      expect(data.description).toBe('Test description');
      expect(data.permissions).toBeDefined();
      expect(data.permissions.canRead).toBe(true);
    });

    it('should return 404 for non-existent base', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/message-bases/non-existent-id',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/message-bases/some-id',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/message-bases', () => {
    it('should create message base as admin', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/message-bases',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'New Base',
          description: 'A new message base',
          accessLevelRead: 0,
          accessLevelWrite: 10,
          sortOrder: 1,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('New Base');
      expect(data.description).toBe('A new message base');
    });

    it('should reject creation by non-admin', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/message-bases',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          name: 'Unauthorized Base',
          description: 'Should not be created',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should validate required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/message-bases',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          description: 'Missing name',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/message-bases',
        payload: {
          name: 'Test',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Message Endpoints', () => {
    let testBaseId: string;

    beforeAll(() => {
      // Create a test message base for message tests
      const base = messageService.createMessageBase({
        name: 'Test Messages Base',
        description: 'For testing messages',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        sortOrder: 0,
      });
      testBaseId = base.id;
    });

    describe('POST /api/v1/message-bases/:id/messages', () => {
      it('should post a new message', async () => {
        const response = await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Test Message',
            body: 'This is a test message body',
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.id).toBeDefined();
        expect(data.subject).toBe('Test Message');
        expect(data.body).toBe('This is a test message body');
        expect(data.baseId).toBe(testBaseId);
        expect(data.userId).toBe(regularUserId);
        expect(data.authorHandle).toBe('testuser');
      });

      it('should require authentication', async () => {
        const response = await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          payload: {
            subject: 'Test',
            body: 'Test',
          },
        });

        expect(response.statusCode).toBe(401);
      });

      it('should validate required fields', async () => {
        const response = await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Test',
            // Missing body
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 404 for non-existent base', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/message-bases/non-existent/messages',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Test',
            body: 'Test',
          },
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('GET /api/v1/message-bases/:id/messages', () => {
      it('should list messages in a base', async () => {
        // Post a message first
        await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'List Test Message',
            body: 'This message should appear in the list',
          },
        });

        const response = await server.inject({
          method: 'GET',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.messages).toBeDefined();
        expect(Array.isArray(data.messages)).toBe(true);
        expect(data.messages.length).toBeGreaterThan(0);
        expect(data.pagination).toBeDefined();
      });

      it('should support pagination', async () => {
        const response = await server.inject({
          method: 'GET',
          url: `/api/v1/message-bases/${testBaseId}/messages?page=1&limit=10`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(10);
      });

      it('should require authentication', async () => {
        const response = await server.inject({
          method: 'GET',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
        });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('GET /api/v1/messages/:id', () => {
      it('should get message details', async () => {
        // Post a message first
        const postResponse = await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Detail Test Message',
            body: 'This message will be retrieved by ID',
          },
        });

        const postedMessage = JSON.parse(postResponse.body);

        const response = await server.inject({
          method: 'GET',
          url: `/api/v1/messages/${postedMessage.id}`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.id).toBe(postedMessage.id);
        expect(data.subject).toBe('Detail Test Message');
        expect(data.body).toBe('This message will be retrieved by ID');
      });

      it('should return 404 for non-existent message', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/api/v1/messages/non-existent-id',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
      });

      it('should require authentication', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/api/v1/messages/some-id',
        });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('POST /api/v1/messages/:id/replies', () => {
      it('should post a reply to a message', async () => {
        // Post a parent message first
        const parentResponse = await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Parent Message',
            body: 'This is the parent message',
          },
        });

        const parentMessage = JSON.parse(parentResponse.body);

        // Post a reply
        const response = await server.inject({
          method: 'POST',
          url: `/api/v1/messages/${parentMessage.id}/replies`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Re: Parent Message',
            body: 'This is a reply to the parent message',
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.id).toBeDefined();
        expect(data.subject).toBe('Re: Parent Message');
        expect(data.body).toBe('This is a reply to the parent message');
        expect(data.parentId).toBe(parentMessage.id);
        expect(data.baseId).toBe(testBaseId);
      });

      it('should return 404 for non-existent parent message', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/messages/non-existent/replies',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Reply',
            body: 'Reply body',
          },
        });

        expect(response.statusCode).toBe(404);
      });

      it('should validate required fields', async () => {
        // Post a parent message first
        const parentResponse = await server.inject({
          method: 'POST',
          url: `/api/v1/message-bases/${testBaseId}/messages`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Parent for Validation Test',
            body: 'Parent body',
          },
        });

        const parentMessage = JSON.parse(parentResponse.body);

        const response = await server.inject({
          method: 'POST',
          url: `/api/v1/messages/${parentMessage.id}/replies`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            subject: 'Reply',
            // Missing body
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should require authentication', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/messages/some-id/replies',
          payload: {
            subject: 'Reply',
            body: 'Reply body',
          },
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });
});

describe('Door Game API Endpoints', () => {
  let server: any;
  let db: BBSDatabase;
  let userRepo: UserRepository;
  let sessionManager: SessionManager;
  let jwtUtil: JWTUtil;
  let userToken: string;
  let adminToken: string;
  let regularUserId: string;
  let adminUserId: string;
  let doorHandler: any;
  let doorSessionRepo: any;

  beforeAll(async () => {
    // Create logger for testing
    const logger = pino({ level: 'silent' });
    
    // Create in-memory database for testing
    db = new BBSDatabase(':memory:', logger as any);
    await db.ready();
    
    // Initialize repositories
    userRepo = new UserRepository(db);
    sessionManager = new SessionManager(logger as any);
    jwtUtil = new JWTUtil({ secret: 'test-secret-key-for-testing-only', expiresIn: '1h' });

    // Create test config
    const config: BBSConfig = {
      bbs: {
        name: 'Test BBS',
        tagline: 'Test',
        sysopName: 'TestSysOp',
        maxNodes: 4,
        defaultAccessLevel: 10,
        theme: 'classic',
      },
      network: {
        websocketPort: 8080,
      },
      ai: {
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022',
        sysop: {
          enabled: false,
          personality: 'test',
          welcomeNewUsers: false,
          participateInChat: false,
          chatFrequency: 'only_when_paged',
        },
        doors: {
          enabled: false,
          maxTokensPerTurn: 150,
        },
      },
      security: {
        passwordMinLength: 6,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        rateLimit: {
          messagesPerHour: 30,
          doorRequestsPerMinute: 10,
        },
      },
      appearance: {
        welcomeScreen: 'welcome.ans',
        goodbyeScreen: 'goodbye.ans',
        menuTemplate: 'menu.ans',
      },
      messageBases: [],
      doors: [],
    } as any;

    // Create door handler with test door
    const { DoorHandler } = await import('../handlers/DoorHandler.js');
    const { DoorSessionRepository } = await import('../db/repositories/DoorSessionRepository.js');
    const { DoorService } = await import('../services/DoorService.js');
    doorSessionRepo = new DoorSessionRepository(db);
    
    doorHandler = new DoorHandler({
      renderer: null as any,
      sessionManager,
      doorSessionRepository: doorSessionRepo,
    });

    // Register a test door
    const testDoor = {
      id: 'test-door',
      name: 'Test Door',
      description: 'A test door game',
      enter: async (_session: any) => 'Welcome to test door!',
      processInput: async (input: string, _session: any) => `You said: ${input}`,
      exit: async (_session: any) => 'Goodbye from test door!',
    };
    doorHandler.registerDoor(testDoor);

    // Create door service
    const doors = new Map();
    doors.set(testDoor.id, testDoor);
    const doorService = new DoorService(doors, sessionManager, doorSessionRepo);

    // Create Fastify server
    server = Fastify();
    await registerAPIRoutes(
      server,
      userRepo,
      sessionManager,
      jwtUtil,
      config,
      undefined,
      undefined,
      doorService
    );

    // Create test users
    const userPasswordHash = await bcrypt.hash('user123', 10);
    const regularUser = userRepo.create('testuser', userPasswordHash, {
      accessLevel: 10,
    });
    regularUserId = regularUser.id;
    userToken = jwtUtil.generateToken({
      userId: regularUser.id,
      handle: regularUser.handle,
      accessLevel: regularUser.accessLevel,
    });

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminUser = userRepo.create('testadmin', adminPasswordHash, {
      accessLevel: 255,
    });
    adminUserId = adminUser.id;
    adminToken = jwtUtil.generateToken({
      userId: adminUser.id,
      handle: adminUser.handle,
      accessLevel: adminUser.accessLevel,
    });

    await server.ready();
  });

  afterEach(async () => {
    // Exit any active doors first
    const restConnectionId = `rest-${regularUserId}`;
    const session = sessionManager.getSessionByConnection(restConnectionId);
    if (session && session.state === 'in_door' && session.data.door?.doorId) {
      // Exit the door properly
      try {
        await server.inject({
          method: 'POST',
          url: `/api/v1/doors/${session.data.door.doorId}/exit`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            sessionId: session.id,
          },
        });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    const adminRestConnectionId = `rest-${adminUserId}`;
    const adminSession = sessionManager.getSessionByConnection(adminRestConnectionId);
    if (adminSession && adminSession.state === 'in_door' && adminSession.data.door?.doorId) {
      // Exit the door properly
      try {
        await server.inject({
          method: 'POST',
          url: `/api/v1/doors/${adminSession.data.door.doorId}/exit`,
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            sessionId: adminSession.id,
          },
        });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    // Clean up any remaining sessions
    if (session) {
      sessionManager.removeSession(session.id);
    }
    if (adminSession) {
      sessionManager.removeSession(adminSession.id);
    }
    
    // Clean up door sessions from database (in case exit didn't work)
    if (doorSessionRepo) {
      doorSessionRepo.deleteUserDoorSessions(regularUserId);
      doorSessionRepo.deleteUserDoorSessions(adminUserId);
    }
  });

  afterAll(async () => {
    await server.close();
    db.close();
  });

  describe('GET /api/v1/doors', () => {
    it('should list available doors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.doors).toBeDefined();
      expect(Array.isArray(data.doors)).toBe(true);
      expect(data.doors.length).toBeGreaterThan(0);
      expect(data.doors[0]).toHaveProperty('id');
      expect(data.doors[0]).toHaveProperty('name');
      expect(data.doors[0]).toHaveProperty('description');
      expect(data.doors[0].id).toBe('test-door');
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/doors/:id/enter', () => {
    it('should enter a door game', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/enter',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.sessionId).toBeDefined();
      expect(data.doorId).toBe('test-door');
      expect(data.doorName).toBe('Test Door');
      expect(data.output).toContain('Welcome to test door!');
    });

    it('should return 404 for non-existent door', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/non-existent-door/enter',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/enter',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/doors/:id/input', () => {
    it('should send input to door game', async () => {
      // First enter the door
      const enterResponse = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/enter',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const enterData = JSON.parse(enterResponse.body);
      const sessionId = enterData.sessionId;

      // Send input
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/input',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          sessionId,
          input: 'hello',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.sessionId).toBe(sessionId);
      expect(data.output).toContain('You said: hello');
      expect(data.exited).toBeDefined();
    });

    it('should require input field', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/input',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          sessionId: 'some-session-id',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent door', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/non-existent-door/input',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          input: 'test',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for non-existent session', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/input',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          sessionId: 'non-existent-session',
          input: 'test',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/input',
        payload: {
          input: 'test',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/doors/:id/exit', () => {
    it('should exit a door game', async () => {
      // First enter the door
      const enterResponse = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/enter',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const enterData = JSON.parse(enterResponse.body);
      const sessionId = enterData.sessionId;

      // Exit the door
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/exit',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          sessionId,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.output).toContain('Goodbye from test door!');
      expect(data.exited).toBe(true);
    });

    it('should return 404 for non-existent door', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/non-existent-door/exit',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/exit',
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/doors/:id/session', () => {
    it('should return session info when user is in door', async () => {
      // First enter the door
      const enterResponse = await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/enter',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(enterResponse.statusCode).toBe(200);

      // Get session info
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/test-door/session',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.inDoor).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.doorId).toBe('test-door');
      expect(data.doorName).toBe('Test Door');
      expect(data.lastActivity).toBeDefined();
      expect(data.gameState).toBeDefined();
    });

    it('should return not in door when user is not in door', async () => {
      // Ensure user is not in any door by removing the session entirely
      const restConnectionId = `rest-${regularUserId}`;
      const session = sessionManager.getSessionByConnection(restConnectionId);
      if (session) {
        if (session.state === 'in_door' && session.data.door?.doorId) {
          await server.inject({
            method: 'POST',
            url: `/api/v1/doors/${session.data.door.doorId}/exit`,
            headers: {
              authorization: `Bearer ${userToken}`,
            },
          });
        }
        // Remove the session to ensure clean state
        sessionManager.removeSession(session.id);
      }
      
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/test-door/session',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.inDoor).toBe(false);
      expect(data.sessionId).toBeNull();
      expect(data.doorId).toBe('test-door');
    });

    it('should return 404 for non-existent door', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/non-existent-door/session',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/test-door/session',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/doors/sessions', () => {
    it('should list all active door sessions for admin', async () => {
      // First enter the door
      await server.inject({
        method: 'POST',
        url: '/api/v1/doors/test-door/enter',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      // Get all sessions (as admin)
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/sessions',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.sessions).toBeDefined();
      expect(Array.isArray(data.sessions)).toBe(true);
      expect(data.totalCount).toBeGreaterThan(0);
      
      if (data.sessions.length > 0) {
        expect(data.sessions[0]).toHaveProperty('sessionId');
        expect(data.sessions[0]).toHaveProperty('userId');
        expect(data.sessions[0]).toHaveProperty('handle');
        expect(data.sessions[0]).toHaveProperty('doorId');
        expect(data.sessions[0]).toHaveProperty('doorName');
        expect(data.sessions[0]).toHaveProperty('lastActivity');
        expect(data.sessions[0]).toHaveProperty('inactiveTime');
      }
    });

    it('should return 403 for non-admin users', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/sessions',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/sessions',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/doors/:id/stats', () => {
    it('should return door statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/test-door/stats',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.doorId).toBe('test-door');
      expect(data.doorName).toBe('Test Door');
      expect(data.activeSessions).toBeDefined();
      expect(typeof data.activeSessions).toBe('number');
      expect(data.timeout).toBeDefined();
      expect(typeof data.timeout).toBe('number');
    });

    it('should return 404 for non-existent door', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/non-existent-door/stats',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/doors/test-door/stats',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Door Session Persistence', () => {
    describe('GET /api/v1/doors/:id/session', () => {
      it('should return session info when user is in door', async () => {
        // Enter the door
        await server.inject({
          method: 'POST',
          url: '/api/v1/doors/test-door/enter',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        // Get session info
        const response = await server.inject({
          method: 'GET',
          url: '/api/v1/doors/test-door/session',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.inDoor).toBe(true);
        expect(data.sessionId).toBeDefined();
        expect(data.doorId).toBe('test-door');
        expect(data.doorName).toBe('Test Door');
        expect(data.lastActivity).toBeDefined();
        expect(data.gameState).toBeDefined();
      });

      it('should return no session when user is not in door', async () => {
        // Ensure user is not in any door by removing the session entirely
        const restConnectionId = `rest-${regularUserId}`;
        const session = sessionManager.getSessionByConnection(restConnectionId);
        if (session) {
          if (session.state === 'in_door' && session.data.door?.doorId) {
            await server.inject({
              method: 'POST',
              url: `/api/v1/doors/${session.data.door.doorId}/exit`,
              headers: {
                authorization: `Bearer ${userToken}`,
              },
            });
          }
          // Remove the session to ensure clean state
          sessionManager.removeSession(session.id);
        }
        
        const response = await server.inject({
          method: 'GET',
          url: '/api/v1/doors/test-door/session',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.inDoor).toBe(false);
        expect(data.sessionId).toBeNull();
        expect(data.doorId).toBe('test-door');
      });
    });

    describe('GET /api/v1/doors/my-sessions', () => {
      it('should return list of saved sessions', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/api/v1/doors/my-sessions',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data.sessions).toBeDefined();
        expect(Array.isArray(data.sessions)).toBe(true);
        expect(data.totalCount).toBeGreaterThanOrEqual(0);
      });

      it('should require authentication', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/api/v1/doors/my-sessions',
        });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('POST /api/v1/doors/:id/resume', () => {
      it('should resume or enter door', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/doors/test-door/resume',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        // Should either resume (200) or not find a saved session (404)
        expect([200, 404]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);
          expect(data.sessionId).toBeDefined();
          expect(data.doorId).toBe('test-door');
          expect(data.resumed).toBe(true);
        }
      });

      it('should require authentication', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/doors/test-door/resume',
        });

        expect(response.statusCode).toBe(401);
      });
    });

    describe('Door state persistence across API calls', () => {
      it('should persist door state after input', async () => {
        // Enter the door
        const enterResponse = await server.inject({
          method: 'POST',
          url: '/api/v1/doors/test-door/enter',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(enterResponse.statusCode).toBe(200);
        const enterData = JSON.parse(enterResponse.body);
        const sessionId = enterData.sessionId;

        // Send input
        const inputResponse = await server.inject({
          method: 'POST',
          url: '/api/v1/doors/test-door/input',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            sessionId,
            input: 'test input',
          },
        });

        expect(inputResponse.statusCode).toBe(200);

        // Get session info to verify state persisted
        const sessionResponse = await server.inject({
          method: 'GET',
          url: '/api/v1/doors/test-door/session',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(sessionResponse.statusCode).toBe(200);
        const sessionData = JSON.parse(sessionResponse.body);
        expect(sessionData.inDoor).toBe(true);
        expect(sessionData.sessionId).toBe(sessionId);
      });

      it('should maintain session across multiple input calls', async () => {
        // Enter the door
        const enterResponse = await server.inject({
          method: 'POST',
          url: '/api/v1/doors/test-door/enter',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        const enterData = JSON.parse(enterResponse.body);
        const sessionId = enterData.sessionId;

        // Send multiple inputs
        for (let i = 0; i < 3; i++) {
          const inputResponse = await server.inject({
            method: 'POST',
            url: '/api/v1/doors/test-door/input',
            headers: {
              authorization: `Bearer ${userToken}`,
            },
            payload: {
              sessionId,
              input: `test input ${i}`,
            },
          });

          expect(inputResponse.statusCode).toBe(200);
          const inputData = JSON.parse(inputResponse.body);
          expect(inputData.sessionId).toBe(sessionId);
        }

        // Verify session still exists
        const sessionResponse = await server.inject({
          method: 'GET',
          url: '/api/v1/doors/test-door/session',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        });

        expect(sessionResponse.statusCode).toBe(200);
        const sessionData = JSON.parse(sessionResponse.body);
        expect(sessionData.inDoor).toBe(true);
      });
    });
  });
});
