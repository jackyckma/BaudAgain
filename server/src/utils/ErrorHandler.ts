/**
 * Error Handler Utilities
 * 
 * Centralized error handling for consistent error responses across the application.
 */

import type { FastifyReply } from 'fastify';
import type { APIError } from '../api/types.js';

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * HTTP status codes mapped to error codes
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.NOT_IMPLEMENTED]: 501,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * Application error class with structured information
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * Get HTTP status code for this error
   */
  get statusCode(): number {
    return ERROR_STATUS_MAP[this.code] || 500;
  }

  /**
   * Convert to API error response format
   */
  toAPIError(): APIError {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: new Date().toISOString(),
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Error Handler class with static methods for common error scenarios
 */
export class ErrorHandler {
  /**
   * Send a standardized error response
   */
  static sendError(
    reply: FastifyReply,
    code: ErrorCode,
    message: string,
    details?: any
  ): void {
    const error = new AppError(code, message, details);
    reply.status(error.statusCode).send(error.toAPIError());
  }

  /**
   * Handle and send error response from caught exception
   */
  static handleError(reply: FastifyReply, error: unknown): void {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send(error.toAPIError());
      return;
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('Rate limit exceeded')) {
        this.sendRateLimitError(reply, error.message);
        return;
      }

      if (error.message.includes('not found') || error.message.includes('Not found')) {
        this.sendNotFoundError(reply, error.message);
        return;
      }

      if (error.message.includes('already exists') || error.message.includes('already taken')) {
        this.sendConflictError(reply, error.message);
        return;
      }

      // Default to bad request for known errors
      this.sendBadRequestError(reply, error.message);
      return;
    }

    // Unknown error type
    this.sendInternalError(reply);
  }

  // Convenience methods for common error types

  static sendBadRequestError(reply: FastifyReply, message: string = 'Bad request'): void {
    this.sendError(reply, ErrorCode.BAD_REQUEST, message);
  }

  static sendUnauthorizedError(reply: FastifyReply, message: string = 'Unauthorized'): void {
    this.sendError(reply, ErrorCode.UNAUTHORIZED, message);
  }

  static sendForbiddenError(reply: FastifyReply, message: string = 'Forbidden'): void {
    this.sendError(reply, ErrorCode.FORBIDDEN, message);
  }

  static sendNotFoundError(reply: FastifyReply, message: string = 'Resource not found'): void {
    this.sendError(reply, ErrorCode.NOT_FOUND, message);
  }

  static sendConflictError(reply: FastifyReply, message: string = 'Resource already exists'): void {
    this.sendError(reply, ErrorCode.CONFLICT, message);
  }

  static sendRateLimitError(reply: FastifyReply, message: string = 'Rate limit exceeded'): void {
    this.sendError(reply, ErrorCode.RATE_LIMIT_EXCEEDED, message);
  }

  static sendInvalidInputError(reply: FastifyReply, message: string, details?: any): void {
    this.sendError(reply, ErrorCode.INVALID_INPUT, message, details);
  }

  static sendInternalError(reply: FastifyReply, message: string = 'Internal server error'): void {
    this.sendError(reply, ErrorCode.INTERNAL_ERROR, message);
  }

  static sendNotImplementedError(reply: FastifyReply, message: string = 'Not implemented'): void {
    this.sendError(reply, ErrorCode.NOT_IMPLEMENTED, message);
  }

  static sendServiceUnavailableError(reply: FastifyReply, message: string = 'Service unavailable'): void {
    this.sendError(reply, ErrorCode.SERVICE_UNAVAILABLE, message);
  }

  /**
   * Validate required fields and send error if missing
   * Returns true if validation passed, false if error was sent
   */
  static validateRequired(
    reply: FastifyReply,
    fields: Record<string, any>,
    fieldNames: string[]
  ): boolean {
    const missing = fieldNames.filter(name => !fields[name] || (typeof fields[name] === 'string' && fields[name].trim().length === 0));
    
    if (missing.length > 0) {
      this.sendInvalidInputError(
        reply,
        `Missing required fields: ${missing.join(', ')}`,
        { missingFields: missing }
      );
      return false;
    }

    return true;
  }

  /**
   * Check if service is available and send error if not
   * Returns true if service is available, false if error was sent
   */
  static checkServiceAvailable(
    reply: FastifyReply,
    service: any,
    serviceName: string = 'Service'
  ): boolean {
    if (!service) {
      this.sendNotImplementedError(reply, `${serviceName} not available`);
      return false;
    }
    return true;
  }

  /**
   * Check user permission and send error if insufficient
   * Returns true if permission granted, false if error was sent
   */
  static checkPermission(
    reply: FastifyReply,
    hasPermission: boolean,
    message: string = 'Insufficient permissions'
  ): boolean {
    if (!hasPermission) {
      this.sendForbiddenError(reply, message);
      return false;
    }
    return true;
  }

  /**
   * Check if resource exists and send error if not
   * Returns the resource if it exists, null if error was sent
   */
  static checkResourceExists<T>(
    reply: FastifyReply,
    resource: T | null | undefined,
    resourceName: string = 'Resource'
  ): T | null {
    if (!resource) {
      this.sendNotFoundError(reply, `${resourceName} not found`);
      return null;
    }
    return resource;
  }
}

/**
 * Create AppError instances for common scenarios
 */
export const createError = {
  badRequest: (message: string, details?: any) => 
    new AppError(ErrorCode.BAD_REQUEST, message, details),
  
  unauthorized: (message: string = 'Unauthorized') => 
    new AppError(ErrorCode.UNAUTHORIZED, message),
  
  forbidden: (message: string = 'Forbidden') => 
    new AppError(ErrorCode.FORBIDDEN, message),
  
  notFound: (message: string = 'Resource not found') => 
    new AppError(ErrorCode.NOT_FOUND, message),
  
  conflict: (message: string = 'Resource already exists') => 
    new AppError(ErrorCode.CONFLICT, message),
  
  rateLimit: (message: string = 'Rate limit exceeded') => 
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message),
  
  invalidInput: (message: string, details?: any) => 
    new AppError(ErrorCode.INVALID_INPUT, message, details),
  
  internal: (message: string = 'Internal server error') => 
    new AppError(ErrorCode.INTERNAL_ERROR, message),
  
  notImplemented: (message: string = 'Not implemented') => 
    new AppError(ErrorCode.NOT_IMPLEMENTED, message),
  
  serviceUnavailable: (message: string = 'Service unavailable') => 
    new AppError(ErrorCode.SERVICE_UNAVAILABLE, message),
};
