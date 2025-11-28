import type { CommandHandler } from './CommandHandler.js';
import type { SessionManager } from '../session/SessionManager.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * BBS Core Engine
 * 
 * Central command router that processes user input and delegates to appropriate handlers.
 * This is the heart of the BBS application logic.
 */
export class BBSCore {
  private handlers: CommandHandler[] = [];

  constructor(
    private sessionManager: SessionManager,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Register a command handler
   */
  registerHandler(handler: CommandHandler): void {
    this.handlers.push(handler);
    this.logger.info({ handler: handler.constructor.name }, 'Handler registered');
  }

  /**
   * Process user input and route to appropriate handler
   */
  async processInput(sessionId: string, input: string): Promise<string> {
    const session = this.sessionManager.getSession(sessionId);
    
    if (!session) {
      this.logger.warn({ sessionId }, 'Session not found for input processing');
      return 'Session expired. Please reconnect.\r\n';
    }

    // Update session activity
    this.sessionManager.touchSession(sessionId);

    // Trim input
    const command = input.trim();

    // Log the command
    this.logger.info(
      { sessionId, command, state: session.state },
      'Processing command'
    );

    // Find a handler that can process this command
    for (const handler of this.handlers) {
      if (handler.canHandle(command, session)) {
        try {
          const response = await handler.handle(command, session);
          return response;
        } catch (error) {
          this.logger.error(
            { sessionId, command, error, handler: handler.constructor.name },
            'Handler error'
          );
          return 'An error occurred processing your command. Please try again.\r\n';
        }
      }
    }

    // No handler found
    this.logger.warn({ sessionId, command }, 'No handler found for command');
    return 'Unknown command. Type HELP for assistance.\r\n';
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): CommandHandler[] {
    return [...this.handlers];
  }
}
