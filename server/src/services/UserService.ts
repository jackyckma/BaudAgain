import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { User } from '@baudagain/shared';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { validateHandle, validatePassword, sanitizeInput, type ValidationResult } from '../utils/ValidationUtils.js';

const BCRYPT_ROUNDS = 10;

export interface CreateUserInput {
  handle: string;
  password: string;
  realName?: string;
  location?: string;
  bio?: string;
}

/**
 * User Service
 * 
 * Handles user-related business logic including:
 * - User creation and validation
 * - Password hashing and verification
 * - Handle validation
 */
export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Create a new user with hashed password
   */
  async createUser(input: CreateUserInput): Promise<User> {
    // Validate handle
    const handleValidation = this.validateHandle(input.handle);
    if (!handleValidation.valid) {
      throw new Error(handleValidation.error);
    }

    // Check if handle already exists
    const existingUser = await this.userRepository.getUserByHandle(input.handle);
    if (existingUser) {
      throw new Error('Handle already taken');
    }

    // Validate password
    const passwordValidation = this.validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Sanitize optional fields
    const sanitizedRealName = input.realName ? sanitizeInput(input.realName) : undefined;
    const sanitizedLocation = input.location ? sanitizeInput(input.location) : undefined;
    const sanitizedBio = input.bio ? sanitizeInput(input.bio) : undefined;
    
    // Create user
    const user = await this.userRepository.createUser({
      id: uuidv4(),
      handle: input.handle,
      passwordHash,
      realName: sanitizedRealName,
      location: sanitizedLocation,
      bio: sanitizedBio,
      accessLevel: 10, // Default access level
      createdAt: new Date(),
      totalCalls: 1,
      totalPosts: 0,
      preferences: {
        terminalType: 'ansi',
        screenWidth: 80,
        screenHeight: 24,
      },
    });

    return user;
  }

  /**
   * Authenticate a user with handle and password
   */
  async authenticateUser(handle: string, password: string): Promise<User | null> {
    const user = await this.userRepository.getUserByHandle(handle);
    
    if (!user) {
      return null;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return null;
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return user;
  }

  /**
   * Validate handle format (delegates to shared utility)
   */
  validateHandle(handle: string): ValidationResult {
    return validateHandle(handle);
  }

  /**
   * Validate password format (delegates to shared utility)
   */
  validatePassword(password: string): ValidationResult {
    return validatePassword(password);
  }

  /**
   * Check if a handle is available
   */
  async isHandleAvailable(handle: string): Promise<boolean> {
    const user = await this.userRepository.getUserByHandle(handle);
    return !user; // Returns true if user is null or undefined
  }

  /**
   * Get user by handle
   */
  async getUserByHandle(handle: string): Promise<User | null> {
    const user = await this.userRepository.getUserByHandle(handle);
    return user || null;
  }
  
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    return user || null;
  }
}
