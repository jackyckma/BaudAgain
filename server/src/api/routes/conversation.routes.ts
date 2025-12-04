/**
 * Conversation Starter API Routes
 * 
 * Endpoints for managing AI-generated conversation starters and daily questions
 */

import type { FastifyInstance } from 'fastify';
import type { DailyQuestionService } from '../../services/DailyQuestionService.js';
import type { ScheduledTaskService } from '../../services/ScheduledTaskService.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export async function registerConversationRoutes(
  server: FastifyInstance,
  dailyQuestionService: DailyQuestionService | undefined,
  scheduledTaskService: ScheduledTaskService,
  config: any
) {
  // Check if daily question service is available
  const checkService = (reply: any) => {
    return ErrorHandler.checkServiceAvailable(reply, dailyQuestionService, 'Daily question service');
  };

  /**
   * POST /api/v1/conversation-starters/generate
   * Manually trigger question generation
   */
  server.post('/api/v1/conversation-starters/generate', async (request, reply) => {
    try {
      if (!checkService(reply)) return;

      const dailyQuestionConfig = config.aiFeatures?.dailyQuestion || {
        enabled: false,
        schedule: '09:00',
        targetMessageBaseId: null,
        questionStyle: 'auto',
        aiPersonality: null,
      };

      const question = await dailyQuestionService!.generateAndPostDailyQuestion(
        dailyQuestionConfig
      );

      return {
        success: true,
        question: {
          id: question.id,
          messageBaseId: question.messageBaseId,
          messageBaseName: question.messageBaseName,
          question: question.question,
          style: question.style,
          generatedAt: question.generatedAt,
          postedAt: question.postedAt,
          messageId: question.messageId,
        },
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to generate conversation starter');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * GET /api/v1/conversation-starters
   * Get history of generated questions
   */
  server.get('/api/v1/conversation-starters', async (request, reply) => {
    try {
      if (!checkService(reply)) return;

      const { limit } = request.query as { limit?: string };
      const limitNum = limit ? parseInt(limit) : undefined;

      const history = dailyQuestionService!.getQuestionHistory(limitNum);

      return {
        success: true,
        questions: history,
        total: history.length,
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to get conversation starter history');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * GET /api/v1/conversation-starters/:id
   * Get specific question with metrics
   */
  server.get<{ Params: { id: string } }>(
    '/api/v1/conversation-starters/:id',
    async (request, reply) => {
      try {
        if (!checkService(reply)) return;

        const { id } = request.params;

        // Update engagement metrics before returning
        await dailyQuestionService!.updateEngagementMetrics(id);

        const question = dailyQuestionService!.getQuestion(id);

        if (!question) {
          ErrorHandler.sendNotFoundError(reply, 'Question not found');
          return;
        }

        return {
          success: true,
          question,
        };
      } catch (error) {
        server.log.error({ error }, 'Failed to get conversation starter');
        ErrorHandler.handleError(reply, error);
      }
    }
  );

  /**
   * GET /api/v1/conversation-starters/stats
   * Get engagement statistics
   */
  server.get('/api/v1/conversation-starters/stats', async (request, reply) => {
    try {
      if (!checkService(reply)) return;

      const stats = dailyQuestionService!.getEngagementStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to get engagement stats');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * GET /api/v1/conversation-starters/task/status
   * Get scheduled task status
   */
  server.get('/api/v1/conversation-starters/task/status', async (request, reply) => {
    try {
      const task = scheduledTaskService.getTask('daily-question');

      if (!task) {
        return {
          success: true,
          configured: false,
          enabled: false,
        };
      }

      return {
        success: true,
        configured: true,
        enabled: task.enabled,
        schedule: task.schedule,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to get task status');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * POST /api/v1/conversation-starters/task/trigger
   * Manually trigger the scheduled task
   */
  server.post('/api/v1/conversation-starters/task/trigger', async (request, reply) => {
    try {
      const task = scheduledTaskService.getTask('daily-question');

      if (!task) {
        ErrorHandler.sendNotFoundError(reply, 'Daily question task not configured');
        return;
      }

      await scheduledTaskService.triggerTask('daily-question');

      return {
        success: true,
        message: 'Daily question task triggered successfully',
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to trigger task');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * PUT /api/v1/conversation-starters/task/enable
   * Enable the scheduled task
   */
  server.put('/api/v1/conversation-starters/task/enable', async (request, reply) => {
    try {
      const task = scheduledTaskService.getTask('daily-question');

      if (!task) {
        ErrorHandler.sendNotFoundError(reply, 'Daily question task not configured');
        return;
      }

      scheduledTaskService.enableTask('daily-question');

      return {
        success: true,
        message: 'Daily question task enabled',
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to enable task');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * PUT /api/v1/conversation-starters/task/disable
   * Disable the scheduled task
   */
  server.put('/api/v1/conversation-starters/task/disable', async (request, reply) => {
    try {
      const task = scheduledTaskService.getTask('daily-question');

      if (!task) {
        ErrorHandler.sendNotFoundError(reply, 'Daily question task not configured');
        return;
      }

      scheduledTaskService.disableTask('daily-question');

      return {
        success: true,
        message: 'Daily question task disabled',
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to disable task');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * GET /api/v1/conversation-starters/config
   * Get current configuration
   */
  server.get('/api/v1/conversation-starters/config', async (request, reply) => {
    try {
      const dailyQuestionConfig = config.aiFeatures?.dailyQuestion || {
        enabled: false,
        schedule: '09:00',
        targetMessageBaseId: null,
        questionStyle: 'auto',
        aiPersonality: null,
      };

      return {
        success: true,
        config: dailyQuestionConfig,
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to get configuration');
      ErrorHandler.handleError(reply, error);
    }
  });

  /**
   * PUT /api/v1/conversation-starters/config
   * Update configuration
   */
  server.put('/api/v1/conversation-starters/config', async (request, reply) => {
    try {
      const body = request.body as any;

      // Validate configuration
      if (body.schedule && !/^\d{2}:\d{2}$/.test(body.schedule)) {
        ErrorHandler.sendBadRequestError(reply, 'Invalid schedule format. Use HH:MM');
        return;
      }

      if (body.questionStyle && !['auto', 'open-ended', 'opinion', 'creative', 'technical', 'fun'].includes(body.questionStyle)) {
        ErrorHandler.sendBadRequestError(reply, 'Invalid question style');
        return;
      }

      // Update configuration
      if (!config.aiFeatures) {
        config.aiFeatures = {};
      }
      if (!config.aiFeatures.dailyQuestion) {
        config.aiFeatures.dailyQuestion = {
          enabled: false,
          schedule: '09:00',
          targetMessageBaseId: null,
          questionStyle: 'auto',
          aiPersonality: null,
        };
      }

      // Apply updates
      if (body.enabled !== undefined) {
        config.aiFeatures.dailyQuestion.enabled = body.enabled;
      }
      if (body.schedule !== undefined) {
        config.aiFeatures.dailyQuestion.schedule = body.schedule;
      }
      if (body.targetMessageBaseId !== undefined) {
        config.aiFeatures.dailyQuestion.targetMessageBaseId = body.targetMessageBaseId;
      }
      if (body.questionStyle !== undefined) {
        config.aiFeatures.dailyQuestion.questionStyle = body.questionStyle;
      }
      if (body.aiPersonality !== undefined) {
        config.aiFeatures.dailyQuestion.aiPersonality = body.aiPersonality;
      }

      // Note: In a production system, you would save this to config.yaml
      // For now, changes are in-memory only

      return {
        success: true,
        message: 'Configuration updated (in-memory only)',
        config: config.aiFeatures.dailyQuestion,
      };
    } catch (error) {
      server.log.error({ error }, 'Failed to update configuration');
      ErrorHandler.handleError(reply, error);
    }
  });

  server.log.info('Conversation starter routes registered');
}
