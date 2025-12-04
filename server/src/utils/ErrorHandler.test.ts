/**
 * Error Handler Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ErrorHandler, AppError, ErrorCode, createError } from './ErrorHandler.js';
import type { FastifyReply } from 'fastify';

// Mock FastifyReply
function createMockReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
}

describe('ErrorHandler', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 'Resource not found');
      
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should include details in API error response', () => {
      const error = new AppError(ErrorCode.INVALID_INPUT, 'Validation failed', {
        fields: ['email', 'password'],
      });
      
      const apiError = error.toAPIError();
      
      expect(apiError.error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(apiError.error.message).toBe('Validation failed');
      expect(apiError.error.details).toEqual({ fields: ['email', 'password'] });
      expect(apiError.error.timestamp).toBeDefined();
    });
  });

  describe('sendError', () => {
    it('should send error with correct status code and format', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendError(reply, ErrorCode.BAD_REQUEST, 'Invalid request');
      
      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.BAD_REQUEST,
            message: 'Invalid request',
            timestamp: expect.any(String),
          }),
        })
      );
    });

    it('should include details when provided', () => {
      const reply = createMockReply();
      const details = { field: 'email', reason: 'invalid format' };
      
      ErrorHandler.sendError(reply, ErrorCode.INVALID_INPUT, 'Validation error', details);
      
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details,
          }),
        })
      );
    });
  });

  describe('convenience methods', () => {
    it('should send bad request error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendBadRequestError(reply, 'Bad request');
      
      expect(reply.status).toHaveBeenCalledWith(400);
    });

    it('should send unauthorized error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendUnauthorizedError(reply, 'Unauthorized');
      
      expect(reply.status).toHaveBeenCalledWith(401);
    });

    it('should send forbidden error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendForbiddenError(reply, 'Forbidden');
      
      expect(reply.status).toHaveBeenCalledWith(403);
    });

    it('should send not found error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendNotFoundError(reply, 'Not found');
      
      expect(reply.status).toHaveBeenCalledWith(404);
    });

    it('should send conflict error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendConflictError(reply, 'Conflict');
      
      expect(reply.status).toHaveBeenCalledWith(409);
    });

    it('should send rate limit error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendRateLimitError(reply, 'Rate limit exceeded');
      
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should send internal error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendInternalError(reply, 'Internal error');
      
      expect(reply.status).toHaveBeenCalledWith(500);
    });

    it('should send not implemented error', () => {
      const reply = createMockReply();
      
      ErrorHandler.sendNotImplementedError(reply, 'Not implemented');
      
      expect(reply.status).toHaveBeenCalledWith(501);
    });
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const reply = createMockReply();
      const error = new AppError(ErrorCode.NOT_FOUND, 'Resource not found');
      
      ErrorHandler.handleError(reply, error);
      
      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith(error.toAPIError());
    });

    it('should detect rate limit errors from message', () => {
      const reply = createMockReply();
      const error = new Error('Rate limit exceeded. Try again later.');
      
      ErrorHandler.handleError(reply, error);
      
      expect(reply.status).toHaveBeenCalledWith(429);
    });

    it('should detect not found errors from message', () => {
      const reply = createMockReply();
      const error = new Error('User not found');
      
      ErrorHandler.handleError(reply, error);
      
      expect(reply.status).toHaveBeenCalledWith(404);
    });

    it('should detect conflict errors from message', () => {
      const reply = createMockReply();
      const error = new Error('Handle already taken');
      
      ErrorHandler.handleError(reply, error);
      
      expect(reply.status).toHaveBeenCalledWith(409);
    });

    it('should default to bad request for generic errors', () => {
      const reply = createMockReply();
      const error = new Error('Something went wrong');
      
      ErrorHandler.handleError(reply, error);
      
      expect(reply.status).toHaveBeenCalledWith(400);
    });

    it('should handle unknown error types', () => {
      const reply = createMockReply();
      const error = 'string error';
      
      ErrorHandler.handleError(reply, error);
      
      expect(reply.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateRequired', () => {
    it('should return true when all required fields are present', () => {
      const reply = createMockReply();
      const fields = { name: 'John', email: 'john@example.com' };
      
      const result = ErrorHandler.validateRequired(reply, fields, ['name', 'email']);
      
      expect(result).toBe(true);
      expect(reply.status).not.toHaveBeenCalled();
    });

    it('should send error and return false when fields are missing', () => {
      const reply = createMockReply();
      const fields = { name: 'John' };
      
      const result = ErrorHandler.validateRequired(reply, fields, ['name', 'email']);
      
      expect(result).toBe(false);
      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.stringContaining('email'),
            details: { missingFields: ['email'] },
          }),
        })
      );
    });

    it('should treat empty strings as missing', () => {
      const reply = createMockReply();
      const fields = { name: 'John', email: '  ' };
      
      const result = ErrorHandler.validateRequired(reply, fields, ['name', 'email']);
      
      expect(result).toBe(false);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: { missingFields: ['email'] },
          }),
        })
      );
    });
  });

  describe('checkServiceAvailable', () => {
    it('should return true when service is available', () => {
      const reply = createMockReply();
      const service = { someMethod: () => {} };
      
      const result = ErrorHandler.checkServiceAvailable(reply, service, 'Test Service');
      
      expect(result).toBe(true);
      expect(reply.status).not.toHaveBeenCalled();
    });

    it('should send error and return false when service is unavailable', () => {
      const reply = createMockReply();
      
      const result = ErrorHandler.checkServiceAvailable(reply, null, 'Test Service');
      
      expect(result).toBe(false);
      expect(reply.status).toHaveBeenCalledWith(501);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test Service not available',
          }),
        })
      );
    });
  });

  describe('checkPermission', () => {
    it('should return true when permission is granted', () => {
      const reply = createMockReply();
      
      const result = ErrorHandler.checkPermission(reply, true);
      
      expect(result).toBe(true);
      expect(reply.status).not.toHaveBeenCalled();
    });

    it('should send error and return false when permission is denied', () => {
      const reply = createMockReply();
      
      const result = ErrorHandler.checkPermission(reply, false, 'Admin access required');
      
      expect(result).toBe(false);
      expect(reply.status).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Admin access required',
          }),
        })
      );
    });
  });

  describe('checkResourceExists', () => {
    it('should return resource when it exists', () => {
      const reply = createMockReply();
      const resource = { id: '123', name: 'Test' };
      
      const result = ErrorHandler.checkResourceExists(reply, resource, 'Test Resource');
      
      expect(result).toBe(resource);
      expect(reply.status).not.toHaveBeenCalled();
    });

    it('should send error and return null when resource is null', () => {
      const reply = createMockReply();
      
      const result = ErrorHandler.checkResourceExists(reply, null, 'Test Resource');
      
      expect(result).toBeNull();
      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test Resource not found',
          }),
        })
      );
    });

    it('should send error and return null when resource is undefined', () => {
      const reply = createMockReply();
      
      const result = ErrorHandler.checkResourceExists(reply, undefined, 'Test Resource');
      
      expect(result).toBeNull();
      expect(reply.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createError helpers', () => {
    it('should create bad request error', () => {
      const error = createError.badRequest('Invalid input');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
      expect(error.statusCode).toBe(400);
    });

    it('should create unauthorized error', () => {
      const error = createError.unauthorized();
      
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it('should create not found error', () => {
      const error = createError.notFound('Resource not found');
      
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should create conflict error', () => {
      const error = createError.conflict('Already exists');
      
      expect(error.code).toBe(ErrorCode.CONFLICT);
      expect(error.statusCode).toBe(409);
    });
  });
});
