import type { FastifyInstance } from 'fastify';
import type { MessageBaseRepository } from '../../db/repositories/MessageBaseRepository.js';
import type { MessageService } from '../../services/MessageService.js';
import type { JWTUtil } from '../../auth/jwt.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import { createUserAuthMiddleware, createSysOpAuthMiddleware } from '../middleware/auth.middleware.js';
import { 
  listMessageBasesSchema, 
  getMessageBaseSchema, 
  createMessageBaseSchema, 
  updateMessageBaseSchema, 
  deleteMessageBaseSchema,
  listMessagesSchema,
  getMessageSchema,
  postMessageSchema,
  postReplySchema
} from '../schemas/message.schema.js';

/**
 * Register message and message base routes
 */
export async function registerMessageRoutes(
  server: FastifyInstance,
  jwtUtil: JWTUtil,
  messageBaseRepository?: MessageBaseRepository,
  messageService?: MessageService,
  messageSummarizer?: any
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);
  const authenticate = createSysOpAuthMiddleware(jwtUtil);

  // GET /api/message-bases - List message bases (admin only)
  server.get('/api/message-bases', { preHandler: authenticate }, async (request, reply) => {
    if (!messageBaseRepository) {
      return [];
    }
    
    const bases = messageBaseRepository.getAllMessageBases();
    return bases.map(base => ({
      id: base.id,
      name: base.name,
      description: base.description,
      accessLevelRead: base.accessLevelRead,
      accessLevelWrite: base.accessLevelWrite,
      postCount: base.postCount,
      lastPostAt: base.lastPostAt,
      sortOrder: base.sortOrder,
    }));
  });

  // POST /api/message-bases - Create message base (admin only)
  server.post('/api/message-bases', {
    schema: createMessageBaseSchema,
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!ErrorHandler.checkServiceAvailable(reply, messageService, 'Message service')) return;
    
    const { name, description, accessLevelRead, accessLevelWrite, sortOrder } = request.body as {
      name: string;
      description?: string;
      accessLevelRead?: number;
      accessLevelWrite?: number;
      sortOrder?: number;
    };
    
    try {
      const base = messageService!.createMessageBase({
        name: name.trim(),
        description: description?.trim(),
        accessLevelRead: accessLevelRead ?? 0,
        accessLevelWrite: accessLevelWrite ?? 10,
        sortOrder: sortOrder ?? 0,
      });
      
      return base;
    } catch (error) {
      ErrorHandler.handleError(reply, error);
    }
  });

  // PATCH /api/message-bases/:id - Update message base (admin only)
  server.patch('/api/message-bases/:id', {
    schema: updateMessageBaseSchema,
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!ErrorHandler.checkServiceAvailable(reply, messageService, 'Message service')) return;
    
    const { id } = request.params as { id: string };
    const updates = request.body as {
      name?: string;
      description?: string;
      accessLevelRead?: number;
      accessLevelWrite?: number;
      sortOrder?: number;
    };
    
    try {
      messageService!.updateMessageBase(id, updates);
      const base = messageService!.getMessageBase(id);
      return base;
    } catch (error) {
      ErrorHandler.handleError(reply, error);
    }
  });

  // DELETE /api/message-bases/:id - Delete message base (admin only)
  server.delete('/api/message-bases/:id', {
    schema: deleteMessageBaseSchema,
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!ErrorHandler.checkServiceAvailable(reply, messageService, 'Message service')) return;
    
    const { id } = request.params as { id: string };
    
    try {
      messageService!.deleteMessageBase(id);
      return { success: true };
    } catch (error) {
      ErrorHandler.handleError(reply, error);
    }
  });

  // GET /api/v1/message-bases - List all message bases
  server.get('/api/v1/message-bases', { 
    schema: listMessageBasesSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    if (!ErrorHandler.checkServiceAvailable(reply, messageBaseRepository, 'Message base service')) return;
    if (!messageBaseRepository) return;
    
    const currentUser = (request as any).user;
    const { page = 1, limit = 50, sort = 'sortOrder', order = 'asc' } = request.query as {
      page?: number;
      limit?: number;
      sort?: string;
      order?: string;
    };
    
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    
    const allBases = messageBaseRepository.getAccessibleMessageBases(currentUser.accessLevel);
    
    const sortedBases = allBases.sort((a, b) => {
      let comparison = 0;
      if (sort === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sort === 'postCount') {
        comparison = a.postCount - b.postCount;
      } else if (sort === 'lastPostAt') {
        const aTime = a.lastPostAt?.getTime() || 0;
        const bTime = b.lastPostAt?.getTime() || 0;
        comparison = aTime - bTime;
      } else {
        comparison = a.sortOrder - b.sortOrder;
      }
      return order === 'asc' ? comparison : -comparison;
    });
    
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedBases = sortedBases.slice(start, end);
    
    return {
      messageBases: paginatedBases.map(base => ({
        id: base.id,
        name: base.name,
        description: base.description,
        accessLevelRead: base.accessLevelRead,
        accessLevelWrite: base.accessLevelWrite,
        postCount: base.postCount,
        lastPostAt: base.lastPostAt,
        sortOrder: base.sortOrder,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allBases.length,
        pages: Math.ceil(allBases.length / limitNum),
        hasNext: end < allBases.length,
        hasPrev: pageNum > 1,
      },
    };
  });

  // GET /api/v1/message-bases/:id - Get message base details
  server.get('/api/v1/message-bases/:id', { 
    schema: getMessageBaseSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    if (!messageBaseRepository || !messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message base service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    
    const base = messageBaseRepository.getMessageBase(id);
    
    if (!base) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Message base not found'
        }
      });
      return;
    }
    
    const canRead = await messageService.canUserReadBase(currentUser.id, id);
    if (!canRead) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to read this message base'
        }
      });
      return;
    }
    
    const canWrite = await messageService.canUserWriteBase(currentUser.id, id);
    
    return {
      id: base.id,
      name: base.name,
      description: base.description,
      accessLevelRead: base.accessLevelRead,
      accessLevelWrite: base.accessLevelWrite,
      postCount: base.postCount,
      lastPostAt: base.lastPostAt,
      sortOrder: base.sortOrder,
      permissions: {
        canRead: true,
        canWrite,
      },
    };
  });

  // POST /api/v1/message-bases - Create message base (admin only)
  server.post('/api/v1/message-bases', {
    schema: createMessageBaseSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const currentUser = (request as any).user;
    
    if (currentUser.accessLevel < 255) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required to create message bases'
        }
      });
      return;
    }
    
    const { name, description, accessLevelRead, accessLevelWrite, sortOrder } = request.body as {
      name: string;
      description?: string;
      accessLevelRead?: number;
      accessLevelWrite?: number;
      sortOrder?: number;
    };
    
    try {
      const base = messageService.createMessageBase({
        name: name.trim(),
        description: description?.trim(),
        accessLevelRead: accessLevelRead ?? 0,
        accessLevelWrite: accessLevelWrite ?? 10,
        sortOrder: sortOrder ?? 0,
      });
      
      return {
        id: base.id,
        name: base.name,
        description: base.description,
        accessLevelRead: base.accessLevelRead,
        accessLevelWrite: base.accessLevelWrite,
        postCount: base.postCount,
        lastPostAt: base.lastPostAt,
        sortOrder: base.sortOrder,
      };
    } catch (error) {
      reply.status(400).send({ 
        error: {
          code: 'INVALID_INPUT',
          message: error instanceof Error ? error.message : 'Failed to create message base'
        }
      });
    }
  });

  // GET /api/v1/message-bases/:id/messages - List messages in a message base
  server.get('/api/v1/message-bases/:id/messages', { 
    schema: listMessagesSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const { page = 1, limit = 50, sort = 'createdAt', order = 'desc' } = request.query as {
      page?: number;
      limit?: number;
      sort?: string;
      order?: string;
    };
    
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    
    const base = messageService.getMessageBase(id);
    if (!base) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Message base not found'
        }
      });
      return;
    }
    
    const canRead = await messageService.canUserReadBase(currentUser.id, id);
    if (!canRead) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to read this message base'
        }
      });
      return;
    }
    
    const offset = (pageNum - 1) * limitNum;
    const messages = messageService.getMessages(id, limitNum, offset);
    const totalMessages = messageService.getMessageCount(id);
    
    return {
      messages: messages.map(msg => ({
        id: msg.id,
        baseId: msg.baseId,
        parentId: msg.parentId,
        userId: msg.userId,
        authorHandle: msg.authorHandle,
        subject: msg.subject,
        body: msg.body,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limitNum),
        hasNext: offset + limitNum < totalMessages,
        hasPrev: pageNum > 1,
      },
    };
  });

  // GET /api/v1/messages/:id - Get message details
  server.get('/api/v1/messages/:id', { 
    schema: getMessageSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    
    const message = messageService.getMessage(id);
    if (!message) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found'
        }
      });
      return;
    }
    
    const canRead = await messageService.canUserReadBase(currentUser.id, message.baseId);
    if (!canRead) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to read this message'
        }
      });
      return;
    }
    
    return {
      id: message.id,
      baseId: message.baseId,
      parentId: message.parentId,
      userId: message.userId,
      authorHandle: message.authorHandle,
      subject: message.subject,
      body: message.body,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    };
  });

  // POST /api/v1/message-bases/:id/messages - Post new message
  server.post('/api/v1/message-bases/:id/messages', {
    schema: postMessageSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const { subject, body } = request.body as {
      subject: string;
      body: string;
    };
    
    const base = messageService.getMessageBase(id);
    if (!base) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Message base not found'
        }
      });
      return;
    }
    
    const canWrite = await messageService.canUserWriteBase(currentUser.id, id);
    if (!canWrite) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to post to this message base'
        }
      });
      return;
    }
    
    try {
      const message = messageService.postMessage({
        baseId: id,
        userId: currentUser.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      
      return {
        id: message.id,
        baseId: message.baseId,
        parentId: message.parentId,
        userId: message.userId,
        authorHandle: message.authorHandle,
        subject: message.subject,
        body: message.body,
        createdAt: message.createdAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        reply.status(429).send({ 
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message
          }
        });
      } else {
        reply.status(400).send({ 
          error: {
            code: 'INVALID_INPUT',
            message: error instanceof Error ? error.message : 'Failed to post message'
          }
        });
      }
    }
  });

  // POST /api/v1/messages/:id/replies - Post reply to a message
  server.post('/api/v1/messages/:id/replies', {
    schema: postReplySchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const { subject, body } = request.body as {
      subject: string;
      body: string;
    };
    
    const parentMessage = messageService.getMessage(id);
    if (!parentMessage) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Parent message not found'
        }
      });
      return;
    }
    
    const canWrite = await messageService.canUserWriteBase(currentUser.id, parentMessage.baseId);
    if (!canWrite) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to post to this message base'
        }
      });
      return;
    }
    
    try {
      const message = messageService.postMessage({
        baseId: parentMessage.baseId,
        userId: currentUser.id,
        subject: subject.trim(),
        body: body.trim(),
        parentId: id,
      });
      
      return {
        id: message.id,
        baseId: message.baseId,
        parentId: message.parentId,
        userId: message.userId,
        authorHandle: message.authorHandle,
        subject: message.subject,
        body: message.body,
        createdAt: message.createdAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        reply.status(429).send({ 
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message
          }
        });
      } else {
        reply.status(400).send({ 
          error: {
            code: 'INVALID_INPUT',
            message: error instanceof Error ? error.message : 'Failed to post reply'
          }
        });
      }
    }
  });

  // POST /api/v1/message-bases/:id/summarize - Generate summary
  server.post('/api/v1/message-bases/:id/summarize', {
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!messageSummarizer) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message summarization service not available'
        }
      });
      return;
    }
    
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const { maxMessages = 50 } = request.body as { maxMessages?: number };
    
    const base = messageService.getMessageBase(id);
    if (!base) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Message base not found'
        }
      });
      return;
    }
    
    const canRead = await messageService.canUserReadBase(currentUser.id, id);
    if (!canRead) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to read this message base'
        }
      });
      return;
    }
    
    try {
      const messages = messageService.getMessages(id, Math.min(maxMessages, 100));
      
      const summary = await messageSummarizer.summarizeMessages(messages, {
        messageBaseId: id,
        messageBaseName: base.name,
        maxMessages: Math.min(maxMessages, 100),
      });
      
      return {
        messageBaseId: summary.messageBaseId,
        messageBaseName: summary.messageBaseName,
        messageCount: summary.messageCount,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        activeTopics: summary.activeTopics,
        generatedAt: summary.generatedAt,
      };
    } catch (error) {
      reply.status(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate summary'
        }
      });
    }
  });

  // GET /api/v1/message-bases/:id/summary - Get cached summary
  server.get('/api/v1/message-bases/:id/summary', {
    preHandler: authenticateUser,
  }, async (request, reply) => {
    if (!messageSummarizer) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message summarization service not available'
        }
      });
      return;
    }
    
    if (!messageService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Message service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    
    const base = messageService.getMessageBase(id);
    if (!base) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'Message base not found'
        }
      });
      return;
    }
    
    const canRead = await messageService.canUserReadBase(currentUser.id, id);
    if (!canRead) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access level to read this message base'
        }
      });
      return;
    }
    
    const messages = messageService.getMessages(id, 50);
    const cacheKey = `${id}:${messages.length}`;
    const cached = messageSummarizer.getCachedSummary(cacheKey);
    
    if (!cached) {
      reply.status(404).send({ 
        error: {
          code: 'NOT_FOUND',
          message: 'No cached summary available. Use POST /api/v1/message-bases/:id/summarize to generate one.'
        }
      });
      return;
    }
    
    return {
      messageBaseId: cached.messageBaseId,
      messageBaseName: cached.messageBaseName,
      messageCount: cached.messageCount,
      summary: cached.summary,
      keyPoints: cached.keyPoints,
      activeTopics: cached.activeTopics,
      generatedAt: cached.generatedAt,
    };
  });
}
