import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { User } from '@baudagain/shared';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 10;
const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 6;

export interface CreateUserInput {
  handle: string;
  password: string;
  realName?: string;
  location?: string;
  bio?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
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

    // Create user
    const user = await this.userRepository.createUser({
      id: uuidv4(),
      handle: input.handle,
      passwordHash,
      realName: input.realName,
      location: input.location,
      bio: input.bio,
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
   * Validate handle format
   */
  validateHandle(handle: string): ValidationResult {
    if (handle.length < MIN_HANDLE_LENGTH) {
      return {
        valid: false,
        error: `Handle must be at least ${MIN_HANDLE_LENGTH} characters.`,
      };
    }

    if (handle.length > MAX_HANDLE_LENGTH) {
      return {
        valid: false,
        error: `Handle must be no more than ${MAX_HANDLE_LENGTH} characters.`,
      };
    }

    // Only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      return {
        valid: false,
        error: 'Handle can only contain letters, numbers, and underscores.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate password format
   */
  validatePassword(password: string): ValidationResult {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if a handle is available
   */
  async isHandleAvailable(handle: string): Promise<boolean> {
    const user = await this.userRepository.getUserByHandle(handle);
    return user === null;
  }

  /**
   * Get user by handle
   */
  async getUserByHandle(handle: string): Promise<User | null> {
    const user = await this.userRepository.getUserByHandle(handle);
    return user || null;
  }
}
