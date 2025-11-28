import type { Session } from '@baudagain/shared';

/**
 * Command Handler Interface
 * 
 * Handlers implement this interface to process specific types of commands.
 * The BBSCore routes incoming input to the appropriate handler.
 */
export interface CommandHandler {
  /**
   * Determine if this handler can process the given command
   */
  canHandle(command: string, session: Session): boolean;

  /**
   * Process the command and return output to send to the client
   */
  handle(command: string, session: Session): Promise<string>;
}
