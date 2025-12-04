import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './UserService.js';
import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { User } from '@baudagain/shared';
import bcrypt from 'bcrypt';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = {
      getUserByHandle: vi.fn(),
      createUser: vi.fn(),
      updateLastLogin: vi.fn(),
    } as any;

    userService = new UserService(mockUserRepository);
  });

  describe('createUser', () => {
    it('should create a new user with valid input', async () => {
      const input = {
        handle: 'testuser',
        password: 'SecurePass123!',
        realName: 'Test User',
        location: 'Test City',
        bio: 'Test bio',
      };

      const mockUser: User = {
        id: 'user-123',
        handle: 'testuser',
        passwordHash: 'hashed_password',
        realName: 'Test User',
        location: 'Test City',
        bio: 'Test bio',
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 1,
        totalPosts: 0,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);
      vi.mocked(mockUserRepository.createUser).mockResolvedValue(mockUser);

      const result = await userService.createUser(input);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.getUserByHandle).toHaveBeenCalledWith('testuser');
      expect(mockUserRepository.createUser).toHaveBeenCalled();
    });

    it('should reject handle that is too short', async () => {
      const input = {
        handle: 'ab',
        password: 'SecurePass123!',
      };

      await expect(userService.createUser(input)).rejects.toThrow('Handle must be at least 3 characters');
    });

    it('should reject handle that is too long', async () => {
      const input = {
        handle: 'a'.repeat(21),
        password: 'SecurePass123!',
      };

      await expect(userService.createUser(input)).rejects.toThrow('Handle must be no more than 20 characters');
    });

    it('should reject handle with invalid characters', async () => {
      const input = {
        handle: 'test@user',
        password: 'SecurePass123!',
      };

      await expect(userService.createUser(input)).rejects.toThrow('Handle can only contain letters, numbers, and underscores');
    });

    it('should reject duplicate handle', async () => {
      const input = {
        handle: 'existinguser',
        password: 'SecurePass123!',
      };

      const existingUser: User = {
        id: 'user-456',
        handle: 'existinguser',
        passwordHash: 'hashed',
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 5,
        totalPosts: 2,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(existingUser);

      await expect(userService.createUser(input)).rejects.toThrow('Handle already taken');
    });

    it('should reject password that is too short', async () => {
      const input = {
        handle: 'testuser',
        password: 'short',
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);

      await expect(userService.createUser(input)).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should hash password with bcrypt', async () => {
      const input = {
        handle: 'testuser',
        password: 'SecurePass123!',
      };

      const mockUser: User = {
        id: 'user-123',
        handle: 'testuser',
        passwordHash: 'hashed_password',
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 1,
        totalPosts: 0,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);
      vi.mocked(mockUserRepository.createUser).mockResolvedValue(mockUser);

      await userService.createUser(input);

      // Verify createUser was called with a hashed password
      const createUserCall = vi.mocked(mockUserRepository.createUser).mock.calls[0][0];
      expect(createUserCall.passwordHash).toBeDefined();
      expect(createUserCall.passwordHash).not.toBe(input.password);
      
      // Verify the hash can be verified with bcrypt
      const isValid = await bcrypt.compare(input.password, createUserCall.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should sanitize optional fields', async () => {
      const input = {
        handle: 'testuser',
        password: 'SecurePass123!',
        realName: '\x1b[31mRed Name\x1b[0m',
        location: '\x1b[32mGreen City\x1b[0m',
        bio: 'Bio with \x1b[33mANSI codes\x1b[0m',
      };

      const mockUser: User = {
        id: 'user-123',
        handle: 'testuser',
        passwordHash: 'hashed_password',
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 1,
        totalPosts: 0,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);
      vi.mocked(mockUserRepository.createUser).mockResolvedValue(mockUser);

      await userService.createUser(input);

      const createUserCall = vi.mocked(mockUserRepository.createUser).mock.calls[0][0];
      
      // Verify ANSI escape sequences are removed
      expect(createUserCall.realName).not.toContain('\x1b');
      expect(createUserCall.location).not.toContain('\x1b');
      expect(createUserCall.bio).not.toContain('\x1b');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const handle = 'testuser';
      const password = 'SecurePass123!';
      const passwordHash = await bcrypt.hash(password, 10);

      const mockUser: User = {
        id: 'user-123',
        handle: 'testuser',
        passwordHash,
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 5,
        totalPosts: 2,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.updateLastLogin).mockResolvedValue(undefined);

      const result = await userService.authenticateUser(handle, password);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);

      const result = await userService.authenticateUser('nonexistent', 'password');

      expect(result).toBeNull();
      expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should return null for invalid password', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);

      const mockUser: User = {
        id: 'user-123',
        handle: 'testuser',
        passwordHash,
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 5,
        totalPosts: 2,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(mockUser);

      const result = await userService.authenticateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
      expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    });
  });

  describe('validateHandle', () => {
    it('should validate correct handle', () => {
      const result = userService.validateHandle('validhandle');
      expect(result.valid).toBe(true);
    });

    it('should reject handle that is too short', () => {
      const result = userService.validateHandle('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject handle that is too long', () => {
      const result = userService.validateHandle('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 20 characters');
    });

    it('should reject handle with invalid characters', () => {
      const result = userService.validateHandle('test@user');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letters, numbers, and underscores');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', () => {
      const result = userService.validatePassword('SecurePass123!');
      expect(result.valid).toBe(true);
    });

    it('should reject password that is too short', () => {
      const result = userService.validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });
  });

  describe('isHandleAvailable', () => {
    it('should return true for available handle', async () => {
      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);

      const result = await userService.isHandleAvailable('newhandle');

      expect(result).toBe(true);
    });

    it('should return false for taken handle', async () => {
      const mockUser: User = {
        id: 'user-123',
        handle: 'takenhandle',
        passwordHash: 'hashed',
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 5,
        totalPosts: 2,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(mockUser);

      const result = await userService.isHandleAvailable('takenhandle');

      expect(result).toBe(false);
    });
  });

  describe('getUserByHandle', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: 'user-123',
        handle: 'testuser',
        passwordHash: 'hashed',
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 5,
        totalPosts: 2,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      };

      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(mockUser);

      const result = await userService.getUserByHandle('testuser');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      vi.mocked(mockUserRepository.getUserByHandle).mockResolvedValue(undefined);

      const result = await userService.getUserByHandle('nonexistent');

      expect(result).toBeNull();
    });
  });
});
