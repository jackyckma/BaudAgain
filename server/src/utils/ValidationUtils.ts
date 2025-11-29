/**
 * Validation Utilities
 * 
 * Shared validation functions used across the application.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate handle format
 * - Must be 3-20 characters
 * - Only alphanumeric and underscore allowed
 */
export function validateHandle(handle: string): ValidationResult {
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 20;

  if (handle.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Handle must be at least ${MIN_LENGTH} characters.`,
    };
  }

  if (handle.length > MAX_LENGTH) {
    return {
      valid: false,
      error: `Handle must be no more than ${MAX_LENGTH} characters.`,
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
 * - Must be at least 6 characters
 */
export function validatePassword(password: string): ValidationResult {
  const MIN_LENGTH = 6;

  if (password.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_LENGTH} characters.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent injection attacks
 * - Removes or escapes potentially dangerous characters
 * - Trims whitespace
 */
export function sanitizeInput(input: string): string {
  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Escape ANSI escape sequences in user input
  // This prevents users from injecting ANSI codes
  sanitized = sanitized.replace(/\x1b/g, '');

  return sanitized;
}

/**
 * Validate email format (basic validation)
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format.',
    };
  }

  return { valid: true };
}

/**
 * Validate access level
 * - Must be between 0 and 255
 */
export function validateAccessLevel(level: number): ValidationResult {
  if (level < 0 || level > 255) {
    return {
      valid: false,
      error: 'Access level must be between 0 and 255.',
    };
  }

  return { valid: true };
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationResult {
  if (value.length < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters.`,
    };
  }

  if (value.length > max) {
    return {
      valid: false,
      error: `${fieldName} must be no more than ${max} characters.`,
    };
  }

  return { valid: true };
}
