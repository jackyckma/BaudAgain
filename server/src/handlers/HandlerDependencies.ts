import type { TerminalRenderer } from '@baudagain/shared';
import type { SessionManager } from '../session/SessionManager.js';
import type { AISysOp } from '../ai/AISysOp.js';

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
}
