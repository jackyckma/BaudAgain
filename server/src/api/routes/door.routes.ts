import type { FastifyInstance } from 'fastify';
import type { DoorService } from '../../services/DoorService.js';
import type { SessionManager } from '../../session/SessionManager.js';
import type { JWTUtil } from '../../auth/jwt.js';
import { createUserAuthMiddleware } from '../middleware/auth.middleware.js';
import { 
  listDoorsSchema, 
  enterDoorSchema, 
  sendDoorInputSchema, 
  exitDoorSchema,
  getDoorSessionSchema,
  resumeDoorSchema,
  getMySavedSessionsSchema,
  getAllDoorSessionsSchema,
  getDoorStatsSchema
} from '../schemas/door.schema.js';

/**
 * Register door game routes
 */
export async function registerDoorRoutes(
  server: FastifyInstance,
  jwtUtil: JWTUtil,
  sessionManager: SessionManager,
  doorService?: DoorService
) {
  const authenticateUser = createUserAuthMiddleware(jwtUtil);

  // GET /api/v1/doors - List available doors
  server.get('/api/v1/doors', { 
    schema: listDoorsSchema,
    preHandler: authenticateUser 
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const doors = doorService.getDoors();
    
    return { doors };
  });

  // POST /api/v1/doors/:id/enter - Enter door game
  server.post('/api/v1/doors/:id/enter', {
    schema: enterDoorSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    
    try {
      const result = await doorService.enterDoor(currentUser.id, currentUser.handle, id);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'Door game not found') {
        reply.status(404 as any).send({ 
          error: {
            code: 'NOT_FOUND',
            message: 'Door game not found'
          }
        });
      } else {
        reply.status(500 as any).send({ 
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to enter door game'
          }
        });
      }
    }
  });

  // POST /api/v1/doors/:id/input - Send input to door
  server.post('/api/v1/doors/:id/input', {
    schema: sendDoorInputSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const { input, sessionId } = request.body as { input: string; sessionId?: string };
    
    try {
      const result = await doorService.sendInput(currentUser.id, id, input || '', sessionId);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Door game not found') {
          reply.status(404 as any).send({ 
            error: {
              code: 'NOT_FOUND',
              message: 'Door game not found'
            }
          });
        } else if (error.message.includes('Session not found')) {
          reply.status(400 as any).send({ 
            error: {
              code: 'INVALID_STATE',
              message: 'You must enter the door before sending input'
            }
          });
        } else if (error.message.includes('does not belong')) {
          reply.status(403 as any).send({ 
            error: {
              code: 'FORBIDDEN',
              message: error.message
            }
          });
        } else if (error.message.includes('not in this door')) {
          reply.status(400 as any).send({ 
            error: {
              code: 'INVALID_STATE',
              message: error.message
            }
          });
        } else {
          reply.status(500 as any).send({ 
            error: {
              code: 'INTERNAL_ERROR',
              message: error.message
            }
          });
        }
      } else {
        reply.status(500 as any).send({ 
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to process door input'
          }
        });
      }
    }
  });

  // POST /api/v1/doors/:id/exit - Exit door game
  server.post('/api/v1/doors/:id/exit', {
    schema: exitDoorSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    const { sessionId } = request.body as { sessionId?: string };
    
    try {
      const result = await doorService.exitDoor(currentUser.id, id, sessionId);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Door game not found') {
          reply.status(404 as any).send({ 
            error: {
              code: 'NOT_FOUND',
              message: 'Door game not found'
            }
          });
        } else if (error.message === 'Session not found') {
          reply.status(404 as any).send({ 
            error: {
              code: 'NOT_FOUND',
              message: 'Session not found'
            }
          });
        } else if (error.message.includes('does not belong')) {
          reply.status(403 as any).send({ 
            error: {
              code: 'FORBIDDEN',
              message: error.message
            }
          });
        } else {
          reply.status(500 as any).send({ 
            error: {
              code: 'INTERNAL_ERROR',
              message: error.message
            }
          });
        }
      } else {
        reply.status(500 as any).send({ 
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to exit door game'
          }
        });
      }
    }
  });

  // GET /api/v1/doors/:id/session - Get current door session info
  server.get('/api/v1/doors/:id/session', {
    schema: getDoorSessionSchema,
    preHandler: authenticateUser,
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    
    try {
      const sessionInfo = doorService.getDoorSessionInfo(currentUser.id, id);
      return sessionInfo;
    } catch (error) {
      if (error instanceof Error && error.message === 'Door game not found') {
        reply.status(404 as any).send({ 
          error: {
            code: 'NOT_FOUND',
            message: 'Door game not found'
          }
        });
      } else {
        reply.status(500 as any).send({ 
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get session info'
          }
        });
      }
    }
  });

  // POST /api/v1/doors/:id/resume - Resume a saved door session
  server.post('/api/v1/doors/:id/resume', {
    schema: resumeDoorSchema,
    preHandler: authenticateUser,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;
    
    try {
      const sessionInfo = doorService.getDoorSessionInfo(currentUser.id, id);
      
      if (!sessionInfo.hasSavedSession) {
        reply.status(404 as any).send({ 
          error: {
            code: 'NOT_FOUND',
            message: 'No saved session found for this door'
          }
        });
        return;
      }
      
      const result = await doorService.enterDoor(currentUser.id, currentUser.handle, id);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'Door game not found') {
        reply.status(404 as any).send({ 
          error: {
            code: 'NOT_FOUND',
            message: 'Door game not found'
          }
        });
      } else {
        reply.status(500 as any).send({ 
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to resume door session'
          }
        });
      }
    }
  });

  // GET /api/v1/doors/my-sessions - Get current user's saved door sessions
  server.get('/api/v1/doors/my-sessions', {
    schema: getMySavedSessionsSchema,
    preHandler: authenticateUser,
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const currentUser = (request as any).user;
    const savedSessions = doorService.getSavedSessions(currentUser.id);
    
    return {
      sessions: savedSessions,
      totalCount: savedSessions.length,
    };
  });

  // GET /api/v1/doors/sessions - Get all active door sessions (admin only)
  server.get('/api/v1/doors/sessions', {
    schema: getAllDoorSessionsSchema,
    preHandler: authenticateUser,
  }, async (request, reply) => {
    const currentUser = (request as any).user;
    
    if (currentUser.accessLevel < 255) {
      reply.status(403 as any).send({ 
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
      return;
    }
    
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const allSessions = sessionManager.getAllSessions();
    const doorSessions = allSessions.filter(
      session => session.state === 'in_door' && session.data.door?.doorId
    );
    
    const doors = doorService.getDoors();
    const doorMap = new Map(doors.map(d => [d.id, d]));
    
    return {
      sessions: doorSessions.map(session => {
        const door = doorMap.get(session.data.door?.doorId || '');
        return {
          sessionId: session.id,
          userId: session.userId,
          handle: session.handle,
          doorId: session.data.door?.doorId,
          doorName: door?.name || 'Unknown',
          lastActivity: session.lastActivity,
          inactiveTime: Date.now() - session.lastActivity.getTime(),
        };
      }),
      totalCount: doorSessions.length,
    };
  });

  // GET /api/v1/doors/:id/stats - Get door statistics
  server.get('/api/v1/doors/:id/stats', {
    schema: getDoorStatsSchema,
    preHandler: authenticateUser,
  }, async (request, reply) => {
    if (!doorService) {
      reply.status(501 as any).send({ 
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Door game service not available'
        }
      });
      return;
    }
    
    const { id } = request.params as { id: string };
    
    try {
      const door = doorService.getDoor(id);
      if (!door) {
        reply.status(404 as any).send({ 
          error: {
            code: 'NOT_FOUND',
            message: 'Door game not found'
          }
        });
        return;
      }
      
      const activeSessions = sessionManager.getDoorSessionCount(id);
      
      return {
        doorId: id,
        doorName: door.name,
        activeSessions: activeSessions,
        timeout: 30 * 60 * 1000,
      };
    } catch (error) {
      reply.status(500 as any).send({ 
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get door stats'
        }
      });
    }
  });
}
