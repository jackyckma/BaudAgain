import type { FastifyInstance } from 'fastify';
import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { SessionManager } from '../session/SessionManager.js';
import type { JWTUtil } from '../auth/jwt.js';
import type { BBSConfig } from '../config/ConfigLoader.js';
import type { MessageBaseRepository } from '../db/repositories/MessageBaseRepository.js';
import type { MessageService } from '../services/MessageService.js';
import type { DoorService } from '../services/DoorService.js';
import type { NotificationService } from '../notifications/NotificationService.js';
import type { AIConfigAssistant } from '../ai/AIConfigAssistant.js';
import type { AISysOp } from '../ai/AISysOp.js';
import type { ArtGalleryRepository } from '../db/repositories/ArtGalleryRepository.js';
import type { ANSIArtGenerator } from '../services/ANSIArtGenerator.js';

// Import route modules
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerUserRoutes } from './routes/user.routes.js';
import { registerMessageRoutes } from './routes/message.routes.js';
import { registerDoorRoutes } from './routes/door.routes.js';
import { registerSystemRoutes } from './routes/system.routes.js';
import { registerConfigRoutes } from './routes/config.routes.js';
import { registerArtRoutes } from './routes/art.routes.js';
import { registerConversationRoutes } from './routes/conversation.routes.js';

/**
 * Register all REST API routes
 */
export async function registerAPIRoutes(
  server: FastifyInstance,
  userRepository: UserRepository,
  sessionManager: SessionManager,
  jwtUtil: JWTUtil,
  config: BBSConfig,
  messageBaseRepository?: MessageBaseRepository,
  messageService?: MessageService,
  doorService?: DoorService,
  notificationService?: NotificationService,
  aiConfigAssistant?: AIConfigAssistant,
  aiSysOp?: AISysOp,
  artGalleryRepository?: ArtGalleryRepository,
  artGenerator?: ANSIArtGenerator,
  messageSummarizer?: any,
  dailyQuestionService?: any,
  scheduledTaskService?: any
) {
  server.log.info('🔧 Registering REST API routes...');
  
  // Register authentication routes
  await registerAuthRoutes(server, userRepository, jwtUtil);
  server.log.info('✅ Authentication routes registered');
  
  // Register user management routes
  await registerUserRoutes(server, userRepository, jwtUtil);
  server.log.info('✅ User management routes registered');
  
  // Register message and message base routes
  await registerMessageRoutes(server, jwtUtil, messageBaseRepository, messageService, messageSummarizer);
  server.log.info('✅ Message routes registered');
  
  // Register door game routes
  await registerDoorRoutes(server, jwtUtil, sessionManager, doorService);
  server.log.info('✅ Door game routes registered');
  
  // Register system administration routes
  await registerSystemRoutes(server, userRepository, sessionManager, jwtUtil, config, notificationService, aiSysOp);
  server.log.info('✅ System routes registered');
  
  // Register AI configuration assistant routes
  await registerConfigRoutes(server, jwtUtil, aiConfigAssistant);
  server.log.info('✅ Configuration routes registered');
  
  // Register art gallery routes
  if (artGalleryRepository) {
    await registerArtRoutes(server, { artGalleryRepository, artGenerator, jwtUtil });
    server.log.info('✅ Art gallery routes registered');
  }
  
  // Register conversation starter routes
  if (dailyQuestionService && scheduledTaskService) {
    await registerConversationRoutes(server, dailyQuestionService, scheduledTaskService, config);
    server.log.info('✅ Conversation starter routes registered');
  }
  
  server.log.info('✅ REST API routes registered successfully');
}
