import type { TerminalRenderer } from '@baudagain/shared';
import type { SessionManager } from '../session/SessionManager.js';
import type { AISysOp } from '../ai/AISysOp.js';
import type { NotificationService } from '../notifications/NotificationService.js';
import type { DailyDigestService } from '../services/DailyDigestService.js';
import type { MessageRepository } from '../db/repositories/MessageRepository.js';
import type { MessageBaseRepository } from '../db/repositories/MessageBaseRepository.js';
import type { UserService } from '../services/UserService.js';

/**
 * Handler Dependencies Interface
 * 
 * Standardizes dependencies for all command handlers.
 * Provides type safety and consistent dependency injection pattern.
 */
export interface HandlerDependencies {
  renderer: TerminalRenderer;
  sessionManager: SessionManager;
  aiSysOp?: AISysOp;
  notificationService?: NotificationService;
  dailyDigestService?: DailyDigestService;
  messageRepository?: MessageRepository;
  messageBaseRepository?: MessageBaseRepository;
  userService?: UserService;
}
