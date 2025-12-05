import type { CommandHandler } from '../core/CommandHandler.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import type { Session, MessageContent } from '@baudagain/shared';
import { SessionState, ContentType, TERMINAL_WIDTH } from '@baudagain/shared';
import type { ArtGalleryRepository } from '../db/repositories/ArtGalleryRepository.js';
import { ANSIWidthCalculator } from '../ansi/ANSIWidthCalculator.js';

export interface UserProfileHandlerDependencies extends HandlerDependencies {
  artGalleryRepository: ArtGalleryRepository;
}

export class UserProfileHandler implements CommandHandler {
  private readonly BOX_WIDTH: number;
  
  constructor(private deps: UserProfileHandlerDependencies) {
    this.BOX_WIDTH = (TERMINAL_WIDTH || 80) - 2;
  }
  
  canHandle(command: string, session: Session): boolean {
    const upperCommand = command.toUpperCase();
    return upperCommand === 'U' && 
           (session.state === SessionState.AUTHENTICATED || 
            session.state === SessionState.IN_MENU);
  }
  
  async handle(command: string, session: Session): Promise<string> {
    try {
      // Ensure we have user ID
      const userId = session.userId;
      if (!userId) {
        return 'Error: User not authenticated.\r\n';
      }

      // Fetch user details  
      const user = await this.deps.userService!.getUserById(userId);
      if (!user) {
        return 'Error: User profile not found.\r\n';
      }

      // Get stats
      const messageCount = this.deps.messageRepository!.getMessageCountByUser(userId);
      const artCount = this.deps.artGalleryRepository.getArtPieceCountByUser(userId);

      return this.renderProfile(user, messageCount, artCount);
    } catch (error) {
      console.error('UserProfileHandler error:', error);
      return 'An error occurred loading the profile.\r\n';
    }
  }
  
  /**
   * Helper to create borders
   */
  private getBorders() {
    const width = this.BOX_WIDTH;
    const cyan = '\x1b[36m';
    const reset = '\x1b[0m';
    
    return {
      top: cyan + '╔' + '═'.repeat(width) + '╗' + reset + '\r\n',
      mid: cyan + '╠' + '═'.repeat(width) + '╣' + reset + '\r\n',
      bot: cyan + '╚' + '═'.repeat(width) + '╝' + reset + '\r\n',
      empty: cyan + '║' + reset + ' '.repeat(width) + cyan + '║' + reset + '\r\n',
      line: (text: string) => {
        const visualWidth = ANSIWidthCalculator.calculate(text);
        const paddingNeeded = Math.max(0, width - visualWidth);
        const padding = ' '.repeat(paddingNeeded);
        return cyan + '║' + reset + text + padding + cyan + '║' + reset + '\r\n';
      },
      center: (text: string) => {
        const visualWidth = ANSIWidthCalculator.calculate(text);
        const totalPadding = Math.max(0, width - visualWidth);
        const left = Math.floor(totalPadding / 2);
        const right = totalPadding - left;
        return cyan + '║' + reset + ' '.repeat(left) + text + ' '.repeat(right) + cyan + '║' + reset + '\r\n';
      },
      pair: (label: string, value: string) => {
        // Format: "  Label: Value"
        const labelStr = `  ${label}: `;
        const valueStr = value;
        const combined = labelStr + valueStr;
        const visualWidth = ANSIWidthCalculator.calculate(combined);
        const paddingNeeded = Math.max(0, width - visualWidth);
        return cyan + '║' + reset + combined + ' '.repeat(paddingNeeded) + cyan + '║' + reset + '\r\n';
      }
    };
  }
  
  private renderProfile(user: any, messageCount: number, artCount: number): string {
    const b = this.getBorders();
    let output = '\r\n';
    
    output += b.top;
    output += b.center(`\x1b[1;33mUSER PROFILE: ${user.handle}\x1b[0m`);
    output += b.mid;
    output += b.empty;
    
    // Basic Info
    output += b.pair('Handle', user.handle);
    if (user.realName) output += b.pair('Real Name', user.realName);
    if (user.location) output += b.pair('Location', user.location);
    
    output += b.empty;
    output += b.center('\x1b[36m--- Statistics ---\x1b[0m');
    output += b.empty;
    
    // Stats
    output += b.pair('Access Level', user.accessLevel.toString());
    output += b.pair('Total Logins', user.totalCalls.toString());
    output += b.pair('Messages Posted', messageCount.toString());
    output += b.pair('Art Pieces Created', artCount.toString());
    
    output += b.empty;
    output += b.center('\x1b[36m--- Dates ---\x1b[0m');
    output += b.empty;
    
    // Dates
    output += b.pair('First Seen', new Date(user.createdAt).toLocaleString());
    output += b.pair('Last Seen', user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never');
    
    if (user.bio) {
      output += b.empty;
      output += b.center('\x1b[36m--- Bio ---\x1b[0m');
      output += b.empty;
      // Wrap bio text? For now assume short.
      output += b.center(user.bio);
    }
    
    output += b.empty;
    output += b.bot;
    output += '\r\n\x1b[1;32mPress Enter to return to menu...\x1b[0m ';
    
    return output;
  }
}

