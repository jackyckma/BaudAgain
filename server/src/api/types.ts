/**
 * API Type Definitions
 * 
 * Type-safe interfaces for REST API requests and responses.
 */

import type { FastifyRequest } from 'fastify';

/**
 * Authenticated request with user information
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

/**
 * Authentication middleware options
 */
export interface AuthMiddlewareOptions {
  requireSysOp?: boolean;
}

/**
 * Error response structure
 */
export interface APIError {
  error: {
    code: string;
    message: string;
    timestamp?: string;
    details?: any;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Pagination response
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
