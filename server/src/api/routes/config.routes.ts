import type { FastifyInstance } from 'fastify';
import type { AIConfigAssistant } from '../../ai/AIConfigAssistant.js';
import type { JWTUtil } from '../../auth/jwt.js';
import { createUserAuthMiddleware } from '../middleware/auth.middleware.js';

/**
 * Register AI configuration assistant routes
 */
export async function registerConfigRoutes(
  server: FastifyInstance,
  jwtUtil: JWTUtil,
  aiConfigAssistant?: AIConfigAssistant
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);

  // POST /api/v1/config/chat - Chat with AI Configuration Assistant (admin only)
  server.post('/api/v1/config/chat', {
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!aiConfigAssistant) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'AI Configuration Assistant not available'
        }
      });
      return;
    }

    const requestUser = (request as any).user;
    if (requestUser.accessLevel < 255) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can use the AI Configuration Assistant'
        }
      });
      return;
    }

    const { message } = request.body as { message: string };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      reply.status(400).send({ 
        error: {
          code: 'BAD_REQUEST',
          message: 'Message is required and must be a non-empty string'
        }
      });
      return;
    }

    if (message.length > 1000) {
      reply.status(400).send({ 
        error: {
          code: 'BAD_REQUEST',
          message: 'Message must be 1000 characters or less'
        }
      });
      return;
    }

    try {
      const result = await aiConfigAssistant.processRequest(message.trim());

      server.log.info(
        { 
          adminHandle: requestUser.handle, 
          hasChange: !!result.change 
        },
        'AI Configuration Assistant request processed'
      );

      reply.status(200).send({
        response: result.response,
        change: result.change ? {
          description: result.change.description,
          preview: result.change.preview,
        } : undefined,
      });
    } catch (error) {
      server.log.error({ error }, 'Error processing AI Configuration Assistant request');
      reply.status(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process configuration request'
        }
      });
    }
  });

  // POST /api/v1/config/apply - Apply configuration changes (admin only)
  server.post('/api/v1/config/apply', {
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!aiConfigAssistant) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'AI Configuration Assistant not available'
        }
      });
      return;
    }

    const requestUser = (request as any).user;
    if (requestUser.accessLevel < 255) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can apply configuration changes'
        }
      });
      return;
    }

    const { change } = request.body as { change: any };

    if (!change || typeof change !== 'object') {
      reply.status(400).send({ 
        error: {
          code: 'BAD_REQUEST',
          message: 'Change object is required'
        }
      });
      return;
    }

    if (!change.description || !change.preview || !change.changes) {
      reply.status(400).send({ 
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid change object format'
        }
      });
      return;
    }

    try {
      const result = await aiConfigAssistant.applyChanges(change);

      server.log.info(
        { 
          adminHandle: requestUser.handle, 
          changeDescription: change.description,
          requiresRestart: result.requiresRestart
        },
        'Configuration changes applied'
      );

      reply.status(200).send({
        success: true,
        message: result.message,
        description: change.description,
        requiresRestart: result.requiresRestart,
      });
    } catch (error) {
      server.log.error({ error }, 'Error applying configuration changes');
      reply.status(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to apply configuration changes'
        }
      });
    }
  });

  // GET /api/v1/config/history - Get conversation history (admin only)
  server.get('/api/v1/config/history', {
    preHandler: authenticateUser,
  }, async (request, reply) => {
    if (!aiConfigAssistant) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'AI Configuration Assistant not available'
        }
      });
      return;
    }

    const requestUser = (request as any).user;
    if (requestUser.accessLevel < 255) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can access conversation history'
        }
      });
      return;
    }

    try {
      const history = aiConfigAssistant.getConversationHistory();

      reply.status(200).send({
        history,
      });
    } catch (error) {
      server.log.error({ error }, 'Error retrieving conversation history');
      reply.status(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve conversation history'
        }
      });
    }
  });

  // POST /api/v1/config/reset - Reset conversation (admin only)
  server.post('/api/v1/config/reset', {
    preHandler: authenticateUser,
  }, async (request, reply) => {
    if (!aiConfigAssistant) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'AI Configuration Assistant not available'
        }
      });
      return;
    }

    const requestUser = (request as any).user;
    if (requestUser.accessLevel < 255) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can reset conversation'
        }
      });
      return;
    }

    try {
      aiConfigAssistant.resetConversation();

      server.log.info(
        { adminHandle: requestUser.handle },
        'AI Configuration Assistant conversation reset'
      );

      reply.status(200).send({
        success: true,
        message: 'Conversation reset successfully',
      });
    } catch (error) {
      server.log.error({ error }, 'Error resetting conversation');
      reply.status(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset conversation'
        }
      });
    }
  });
}
