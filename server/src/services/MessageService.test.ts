/**
 * MessageService Tests
 * 
 * Tests for message service including notification broadcasting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from './MessageService.js';
import { MessageBaseRepository } from '../db/repositories/MessageBaseRepository.js';
import { MessageRepository } from '../db/repositories/MessageRepository.js';
import { UserRepository } from '../db/repositories/UserRepository.js';
import { NotificationService } from '../notifications/NotificationService.js';
import { NotificationEventType } from '../notifications/types.js';

describe('MessageService - Notification Broadcasting', () => {
  let messageService: MessageService;
  let mockMessageBaseRepo: any;
  let mockMessageRepo: any;
  let mockUserRepo: any;
  let mockNotificationService: any;

  beforeEach(() => {
    // Create mock repositories
    mockMessageBaseRepo = {
      getMessageBase: vi.fn(),
      incrementPostCount: vi.fn(),
      getAccessibleMessageBases: vi.fn(),
    };

    mockMessageRepo = {
      createMessage: vi.fn(),
      getMessages: vi.fn(),
      getMessage: vi.fn(),
      getMessageCount: vi.fn(),
    };

    mockUserRepo = {
      findById: vi.fn(),
    };

    // Create mock notification service
    mockNotificationService = {
      broadcast: vi.fn().mockResolvedValue(undefined),
    };

    // Create message service with mocked dependencies
    messageService = new MessageService(
      mockMessageBaseRepo as any,
      mockMessageRepo as any,
      mockUserRepo as any,
      mockNotificationService as any
    );
  });

  it('should broadcast new message event when message is posted', async () => {
    // Arrange
    const messageData = {
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
    };

    const createdMessage = {
      id: 'msg-789',
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
      authorHandle: 'testuser',
      createdAt: new Date('2025-12-01T12:00:00Z'),
      isDeleted: false,
    };

    const messageBase = {
      id: 'base-123',
      name: 'General Discussion',
      description: 'General chat',
      accessLevelRead: 0,
      accessLevelWrite: 10,
      postCount: 5,
      sortOrder: 0,
    };

    mockMessageRepo.createMessage.mockReturnValue(createdMessage);
    mockMessageBaseRepo.getMessageBase.mockReturnValue(messageBase);

    // Act
    const result = messageService.postMessage(messageData);

    // Assert
    expect(result).toEqual(createdMessage);
    expect(mockNotificationService.broadcast).toHaveBeenCalledTimes(1);
    
    const broadcastCall = mockNotificationService.broadcast.mock.calls[0][0];
    expect(broadcastCall.type).toBe(NotificationEventType.MESSAGE_NEW);
    expect(broadcastCall.data).toEqual({
      messageId: 'msg-789',
      messageBaseId: 'base-123',
      messageBaseName: 'General Discussion',
      subject: 'Test Subject',
      authorHandle: 'testuser',
      createdAt: '2025-12-01T12:00:00.000Z',
    });
  });

  it('should not fail message posting if notification broadcast fails', async () => {
    // Arrange
    const messageData = {
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
    };

    const createdMessage = {
      id: 'msg-789',
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
      authorHandle: 'testuser',
      createdAt: new Date('2025-12-01T12:00:00Z'),
      isDeleted: false,
    };

    const messageBase = {
      id: 'base-123',
      name: 'General Discussion',
      description: 'General chat',
      accessLevelRead: 0,
      accessLevelWrite: 10,
      postCount: 5,
      sortOrder: 0,
    };

    mockMessageRepo.createMessage.mockReturnValue(createdMessage);
    mockMessageBaseRepo.getMessageBase.mockReturnValue(messageBase);
    mockNotificationService.broadcast.mockRejectedValue(new Error('Broadcast failed'));

    // Spy on console.error to verify error is logged
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const result = messageService.postMessage(messageData);

    // Assert - message should still be posted successfully
    expect(result).toEqual(createdMessage);
    expect(mockMessageRepo.createMessage).toHaveBeenCalled();
    expect(mockMessageBaseRepo.incrementPostCount).toHaveBeenCalledWith('base-123');

    // Wait for async broadcast to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify error was logged but didn't throw
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('should not broadcast if notification service is not provided', () => {
    // Arrange
    const messageServiceWithoutNotifications = new MessageService(
      mockMessageBaseRepo as any,
      mockMessageRepo as any,
      mockUserRepo as any,
      undefined // No notification service
    );

    const messageData = {
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
    };

    const createdMessage = {
      id: 'msg-789',
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
      authorHandle: 'testuser',
      createdAt: new Date(),
      isDeleted: false,
    };

    mockMessageRepo.createMessage.mockReturnValue(createdMessage);

    // Act
    const result = messageServiceWithoutNotifications.postMessage(messageData);

    // Assert
    expect(result).toEqual(createdMessage);
    expect(mockNotificationService.broadcast).not.toHaveBeenCalled();
  });

  it('should handle missing message base gracefully', () => {
    // Arrange
    const messageData = {
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
    };

    const createdMessage = {
      id: 'msg-789',
      baseId: 'base-123',
      userId: 'user-456',
      subject: 'Test Subject',
      body: 'Test message body',
      authorHandle: 'testuser',
      createdAt: new Date(),
      isDeleted: false,
    };

    mockMessageRepo.createMessage.mockReturnValue(createdMessage);
    mockMessageBaseRepo.getMessageBase.mockReturnValue(null); // Message base not found

    // Act
    const result = messageService.postMessage(messageData);

    // Assert
    expect(result).toEqual(createdMessage);
    expect(mockNotificationService.broadcast).not.toHaveBeenCalled();
  });
});
