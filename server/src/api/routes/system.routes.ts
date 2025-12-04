import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../../db/repositories/UserRepository.js';
import type { SessionManager } from '../../session/SessionManager.js';
import type { JWTUtil } from '../../auth/jwt.js';
import type { NotificationService } from '../../notifications/NotificationService.js';
import type { AISysOp } from '../../ai/AISysOp.js';
import type { BBSConfig } from '../../config/ConfigLoader.js';
import { NotificationEventType, createNotificationEvent, SystemAnnouncementPayload, AnnouncementPriority } from '../../notifications/types.js';
import { createUserAuthMiddleware, createSysOpAuthMiddleware } from '../middleware/auth.middleware.js';
import { dashboardSchema, aiSettingsSchema, systemAnnouncementSchema, pageSysOpSchema } from '../schemas/system.schema.js';

/**
 * Register system administration routes
 */
export async function registerSystemRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  sessionManager: SessionManager,
  jwtUtil: JWTUtil,
  config: BBSConfig,
  notificationService?: NotificationService,
  aiSysOp?: AISysOp
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);
  const authenticate = createSysOpAuthMiddleware(jwtUtil);

  // GET /api/dashboard - Dashboard endpoint (admin only)
  server.get('/api/dashboard', { 
    schema: dashboardSchema,
    preHandler: authenticate 
  }, async (request, reply) => {
    const sessions = sessionManager.getAllSessions();
    const activeSessions = sessions.filter(s => s.state === 'authenticated');
    
    const totalUsers = userRepository.findAll();
    
    return {
      currentCallers: activeSessions.length,
      totalUsers: totalUsers.length,
      messagesToday: 0,
      recentActivity: [],
      uptime: process.uptime(),
      nodeUsage: {
        active: activeSessions.length,
        total: 4,
      },
    };
  });

  // GET /api/ai-settings - AI settings endpoint (admin only)
  server.get('/api/ai-settings', { 
    schema: aiSettingsSchema,
    preHandler: authenticate 
  }, async (request, reply) => {
    return {
      provider: config.ai.provider,
      model: config.ai.model,
      sysop: {
        enabled: config.ai.sysop.enabled,
        welcomeNewUsers: config.ai.sysop.welcomeNewUsers,
        participateInChat: config.ai.sysop.participateInChat,
        chatFrequency: config.ai.sysop.chatFrequency,
        personality: config.ai.sysop.personality,
      },
      doors: {
        enabled: config.ai.doors.enabled,
        maxTokensPerTurn: config.ai.doors.maxTokensPerTurn,
      },
    };
  });

  // POST /api/v1/system/announcement - Send system-wide announcement (admin only)
  server.post('/api/v1/system/announcement', {
    schema: systemAnnouncementSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!notificationService) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Notification service not available'
        }
      });
      return;
    }

    const requestUser = (request as any).user;
    if (requestUser.accessLevel < 255) {
      reply.status(403).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can send system announcements'
        }
      });
      return;
    }

    const { message, priority = 'normal', expiresAt } = request.body as {
      message: string;
      priority?: string;
      expiresAt?: string;
    };

    if (expiresAt) {
      const expiresDate = new Date(expiresAt);
      if (expiresDate <= new Date()) {
        reply.status(400).send({ 
          error: {
            code: 'BAD_REQUEST',
            message: 'expiresAt must be in the future'
          }
        });
        return;
      }
    }

    try {
      const announcementPayload: SystemAnnouncementPayload = {
        message: message.trim(),
        priority: priority as AnnouncementPriority,
        expiresAt,
      };

      const announcementEvent = createNotificationEvent(
        NotificationEventType.SYSTEM_ANNOUNCEMENT,
        announcementPayload
      );

      await notificationService.broadcastToAuthenticated(announcementEvent);

      server.log.info(
        { 
          adminHandle: requestUser.handle, 
          priority, 
          messageLength: message.length 
        },
        'System announcement broadcast'
      );

      reply.status(200).send({
        success: true,
        message: 'Announcement sent successfully',
        announcement: {
          message: message.trim(),
          priority,
          expiresAt,
          timestamp: announcementEvent.timestamp,
        },
      });
    } catch (error) {
      server.log.error({ error }, 'Error broadcasting system announcement');
      reply.status(500).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to broadcast announcement'
        }
      });
    }
  });

  // POST /api/v1/ai/page-sysop - Page the AI SysOp for help
  server.post('/api/v1/ai/page-sysop', {
    schema: pageSysOpSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!aiSysOp) {
      reply.status(501).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'AI SysOp not available'
        }
      });
      return;
    }

    const requestUser = (request as any).user;
    const { question } = request.body as { question?: string };

    try {
      const startTime = Date.now();
      
      const response = await Promise.race([
        aiSysOp.respondToPage(requestUser.handle, question),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('AI SysOp response timeout')), 5000)
        )
      ]);

      const responseTime = Date.now() - startTime;

      server.log.info(
        { 
          handle: requestUser.handle, 
          hasQuestion: !!question,
          responseTime 
        },
        'AI SysOp page request processed'
      );

      reply.status(200).send({
        response,
        responseTime,
      });
    } catch (error) {
      server.log.error({ error, handle: requestUser.handle }, 'Error processing AI SysOp page');
      
      if (error instanceof Error && error.message.includes('timeout')) {
        reply.status(504).send({ 
          error: {
            code: 'TIMEOUT',
            message: 'AI SysOp response timeout (exceeded 5 seconds)'
          }
        });
      } else {
        reply.status(500).send({ 
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get AI SysOp response'
          }
        });
      }
    }
  });
}
