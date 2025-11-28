import type { CommandHandler } from '../core/CommandHandler.js';
import type { Session, SessionState } from '@baudagain/shared';

/**
 * Echo Handler
 * 
 * Simple handler that echoes back user input.
 * This is a temporary handler for testing the command routing system.
 */
export class EchoHandler implements CommandHandler {
  canHandle(command: string, session: Session): boolean {
    // Handle all commands in CONNECTED state (temporary)
    return session.state === 'connected' as SessionState;
  }

  async handle(command: string, session: Session): Promise<string> {
    if (command.toLowerCase() === 'help') {
      return this.getHelpText();
    }

    return `You typed: ${command}\r\nType something: `;
  }

  private getHelpText(): string {
    return `
╔══════════════════════════════════════════════════════════════╗
║                         HELP                                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  This is a temporary echo handler for testing.              ║
║  More commands will be available soon!                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Type something: `;
  }
}
