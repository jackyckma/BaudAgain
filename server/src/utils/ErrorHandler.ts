import type { FastifyReply } from 'fastify';

/**
 * Error Handler Utilities
 * 
 * Standardized error responses for the API.
 */

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Send a standardized error response
 */
export function sendError(
  reply: FastifyReply,
  statusCode: number,
  error: string,
  message?: string,
  details?: any
): void {
  const response: ErrorResponse = { error };
  
  if (message) {
    response.message = message;
  }
  
  if (details) {
    response.details = details;
  }

  reply.code(statusCode).send(response);
}

/**
 * Send 400 Bad Request
 */
export function sendBadRequest(
  reply: FastifyReply,
  message: string = 'Bad Request'
): void {
  sendError(reply, 400, 'Bad Request', message);
}

/**
 * Send 401 Unauthorized
 */
export function sendUnauthorized(
  reply: FastifyReply,
  message: string = 'Unauthorized'
): void {
  sendError(reply, 401, 'Unauthorized', message);
}

/**
 * Send 403 Forbidden
 */
export function sendForbidden(
  reply: FastifyReply,
  message: string = 'Forbidden'
): void {
  sendError(reply, 403, 'Forbidden', message);
}

/**
 * Send 404 Not Found
 */
export function sendNotFound(
  reply: FastifyReply,
  message: string = 'Not Found'
): void {
  sendError(reply, 404, 'Not Found', message);
}

/**
 * Send 429 Too Many Requests
 */
export function sendTooManyRequests(
  reply: FastifyReply,
  retryAfter?: number
): void {
  const message = retryAfter
    ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    : 'Rate limit exceeded.';
  
  sendError(reply, 429, 'Too Many Requests', message);
}

/**
 * Send 500 Internal Server Error
 */
export function sendInternalError(
  reply: FastifyReply,
  message: string = 'Internal Server Error'
): void {
  sendError(reply, 500, 'Internal Server Error', message);
}

/**
 * Handle and log errors
 */
export function handleError(
  error: unknown,
  reply: FastifyReply,
  logger?: any
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (logger) {
    logger.error({ error: errorMessage }, 'Request error');
  }

  sendInternalError(reply, 'An unexpected error occurred');
}
