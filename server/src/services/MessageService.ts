/**
 * Message Service
 * 
 * Business logic for message base and message operations.
 */

import type { MessageBaseRepository, MessageBase, CreateMessageBaseData } from '../db/repositories/MessageBaseRepository.js';
import type { MessageRepository, Message, CreateMessageData } from '../db/repositories/MessageRepository.js';
import type { UserRepository } from '../db/repositories/UserRepository.js';
import { validateLength, sanitizeInput } from '../utils/ValidationUtils.js';

export class MessageService {
  constructor(
    private messageBaseRepo: MessageBaseRepository,
    private messageRepo: MessageRepository,
    private userRepo: UserRepository
  ) {}
  
  /**
   * Get all message bases accessible by user
   */
  getAccessibleMessageBases(userAccessLevel: number): MessageBase[] {
    return this.messageBaseRepo.getAccessibleMessageBases(userAccessLevel);
  }
  
  /**
   * Get message base by ID
   */
  getMessageBase(id: string): MessageBase | null {
    return this.messageBaseRepo.getMessageBase(id);
  }
  
  /**
   * Create a new message base (admin only)
   */
  createMessageBase(data: CreateMessageBaseData): MessageBase {
    // Validate name
    const nameValidation = validateLength(data.name, 1, 100);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error || 'Invalid message base name');
    }
    
    return this.messageBaseRepo.createMessageBase(data);
  }
  
  /**
   * Update message base (admin only)
   */
  updateMessageBase(id: string, data: Partial<CreateMessageBaseData>): void {
    if (data.name) {
      const nameValidation = validateLength(data.name, 1, 100);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error || 'Invalid message base name');
      }
    }
    
    this.messageBaseRepo.updateMessageBase(id, data);
  }
  
  /**
   * Delete message base (admin only)
   */
  deleteMessageBase(id: string): void {
    this.messageBaseRepo.deleteMessageBase(id);
  }
  
  /**
   * Get messages in a message base
   */
  getMessages(baseId: string, limit: number = 50, offset: number = 0): Message[] {
    return this.messageRepo.getMessages(baseId, limit, offset);
  }
  
  /**
   * Get a single message
   */
  getMessage(id: string): Message | null {
    return this.messageRepo.getMessage(id);
  }
  
  /**
   * Post a new message
   */
  postMessage(data: CreateMessageData): Message {
    // Validate subject
    const subjectValidation = validateLength(data.subject, 1, 200, 'Subject');
    if (!subjectValidation.valid) {
      throw new Error(subjectValidation.error || 'Invalid subject');
    }
    
    // Validate body
    const bodyValidation = validateLength(data.body, 1, 10000, 'Body');
    if (!bodyValidation.valid) {
      throw new Error(bodyValidation.error || 'Invalid message body');
    }
    
    // Sanitize input
    const sanitizedData: CreateMessageData = {
      ...data,
      subject: sanitizeInput(data.subject),
      body: sanitizeInput(data.body)
    };
    
    // Create message
    const message = this.messageRepo.createMessage(sanitizedData);
    
    // Increment post count
    this.messageBaseRepo.incrementPostCount(data.baseId);
    
    return message;
  }
  
  /**
   * Get message count for a base
   */
  getMessageCount(baseId: string): number {
    return this.messageRepo.getMessageCount(baseId);
  }
  
  /**
   * Get message bases accessible by user
   */
  async getAccessibleMessageBasesForUser(userId: string | undefined): Promise<MessageBase[]> {
    const accessLevel = await this.getUserAccessLevel(userId);
    return this.messageBaseRepo.getAccessibleMessageBases(accessLevel);
  }
  
  /**
   * Get user access level
   */
  private async getUserAccessLevel(userId: string | undefined): Promise<number> {
    if (!userId) {
      return 0; // Anonymous users
    }
    
    // Get user from repository
    const user = this.userRepo.findById(userId);
    return user?.accessLevel ?? 10; // Default user level
  }
  
  /**
   * Check if user can read from message base
   */
  async canUserReadBase(userId: string | undefined, baseId: string): Promise<boolean> {
    const base = this.getMessageBase(baseId);
    if (!base) return false;
    
    const accessLevel = await this.getUserAccessLevel(userId);
    return accessLevel >= base.accessLevelRead;
  }
  
  /**
   * Check if user can write to message base
   */
  async canUserWriteBase(userId: string | undefined, baseId: string): Promise<boolean> {
    const base = this.getMessageBase(baseId);
    if (!base) return false;
    
    const accessLevel = await this.getUserAccessLevel(userId);
    return accessLevel >= base.accessLevelWrite;
  }
}
