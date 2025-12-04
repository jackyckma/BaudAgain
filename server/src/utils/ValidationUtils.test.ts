/**
 * Validation Utils Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateHandle,
  validatePassword,
  sanitizeInput,
  validateEmail,
  validateAccessLevel,
  validateLength,
} from './ValidationUtils.js';

describe('ValidationUtils', () => {
  describe('validateHandle', () => {
    it('should accept valid handles', () => {
      const validHandles = [
        'abc',
        'user123',
        'test_user',
        'ABC_123',
        'a'.repeat(20), // max length
      ];

      validHandles.forEach(handle => {
        const result = validateHandle(handle);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject handles that are too short', () => {
      const result = validateHandle('ab');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject handles that are too long', () => {
      const result = validateHandle('a'.repeat(21));
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 20 characters');
    });

    it('should reject handles with invalid characters', () => {
      const invalidHandles = [
        'user@name',
        'user name',
        'user-name',
        'user.name',
        'user!',
        'user#123',
      ];

      invalidHandles.forEach(handle => {
        const result = validateHandle(handle);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('letters, numbers, and underscores');
      });
    });

    it('should accept handles with underscores', () => {
      const result = validateHandle('user_name_123');
      
      expect(result.valid).toBe(true);
    });

    it('should accept handles with mixed case', () => {
      const result = validateHandle('UserName123');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'password',
        '123456',
        'a'.repeat(100),
        'P@ssw0rd!',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('12345');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });

    it('should accept password with exactly 6 characters', () => {
      const result = validatePassword('123456');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('\thello\t')).toBe('hello');
      expect(sanitizeInput('\nhello\n')).toBe('hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeInput('hello\0world')).toBe('helloworld');
      expect(sanitizeInput('\0hello')).toBe('hello');
      expect(sanitizeInput('hello\0')).toBe('hello');
    });

    it('should remove ANSI escape sequences', () => {
      expect(sanitizeInput('hello\x1b[31mworld')).toBe('hello[31mworld');
      expect(sanitizeInput('\x1b[0mhello')).toBe('[0mhello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle normal text without changes', () => {
      expect(sanitizeInput('hello world')).toBe('hello world');
      expect(sanitizeInput('user@example.com')).toBe('user@example.com');
    });

    it('should handle multiple sanitization issues at once', () => {
      const input = '  \x1bhello\0world  ';
      expect(sanitizeInput(input)).toBe('helloworld');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid email format');
      });
    });
  });

  describe('validateAccessLevel', () => {
    it('should accept valid access levels', () => {
      const validLevels = [0, 1, 10, 100, 255];

      validLevels.forEach(level => {
        const result = validateAccessLevel(level);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject negative access levels', () => {
      const result = validateAccessLevel(-1);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 0 and 255');
    });

    it('should reject access levels above 255', () => {
      const result = validateAccessLevel(256);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 0 and 255');
    });

    it('should accept boundary values', () => {
      expect(validateAccessLevel(0).valid).toBe(true);
      expect(validateAccessLevel(255).valid).toBe(true);
    });
  });

  describe('validateLength', () => {
    it('should accept strings within valid length range', () => {
      const result = validateLength('hello', 3, 10, 'Username');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject strings that are too short', () => {
      const result = validateLength('ab', 3, 10, 'Username');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Username');
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject strings that are too long', () => {
      const result = validateLength('a'.repeat(11), 3, 10, 'Username');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Username');
      expect(result.error).toContain('no more than 10 characters');
    });

    it('should accept strings at boundary values', () => {
      expect(validateLength('abc', 3, 10, 'Test').valid).toBe(true);
      expect(validateLength('a'.repeat(10), 3, 10, 'Test').valid).toBe(true);
    });

    it('should use default field name when not provided', () => {
      const result = validateLength('ab', 3, 10);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field');
    });

    it('should handle custom field names in error messages', () => {
      const result = validateLength('ab', 3, 10, 'Bio');
      
      expect(result.error).toContain('Bio');
    });
  });
});
