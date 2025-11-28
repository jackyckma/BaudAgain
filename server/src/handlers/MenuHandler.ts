import type { CommandHandler } from '../core/CommandHandler.js';
import type { Session, SessionState, Menu, MenuOption } from '@baudagain/shared';
import type { TerminalRenderer } from '@baudagain/shared';
import type { MenuContent, RawANSIContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';

/**
 * Menu Handler
 * 
 * Handles menu navigation and command routing.
 * Displays menus and processes single-character menu commands.
 */
export class MenuHandler implements CommandHandler {
  private menus: Map<string, Menu> = new Map();

  constructor(
    private renderer: TerminalRenderer,
    private aiSysOp?: any,  // Optional AI SysOp for Page SysOp feature
    private sessionManager?: any  // Optional SessionManager for state updates
  ) {
    this.initializeMenus();
  }

  /**
   * Initialize the menu structure
   */
  private initializeMenus(): void {
    // Main menu
    const mainMenu: Menu = {
      id: 'main',
      title: 'Main Menu',
      options: [
        {
          key: 'M',
          label: 'Message Bases',
          description: 'Read and post messages',
        },
        {
          key: 'D',
          label: 'Door Games',
          description: 'Play interactive games',
        },
        {
          key: 'P',
          label: 'Page SysOp',
          description: 'Get help from the AI SysOp',
        },
        {
          key: 'U',
          label: 'User Profile',
          description: 'View and edit your profile',
        },
        {
          key: 'G',
          label: 'Goodbye',
          description: 'Log off the BBS',
        },
      ],
    };

    this.menus.set('main', mainMenu);
  }

  canHandle(command: string, session: Session): boolean {
    // Handle commands when authenticated or in menu
    return (
      session.state === ('authenticated' as SessionState) ||
      session.state === ('in_menu' as SessionState)
    );
  }

  async handle(command: string, session: Session): Promise<string> {
    const upperCommand = command.toUpperCase();

    // Check if we're in Page SysOp flow
    if (session.data.pagingSysOp) {
      return this.handlePageSysOpInput(command, session);
    }

    // Ensure we have a valid menu, default to 'main'
    const currentMenuId = this.menus.has(session.currentMenu) ? session.currentMenu : 'main';

    // If empty command or just authenticated, show current menu
    if (command === '' || command.trim() === '') {
      return this.displayMenu(currentMenuId);
    }

    // Special commands
    if (upperCommand === 'MENU' || upperCommand === '?') {
      return this.displayMenu(currentMenuId);
    }

    // Handle menu selection
    const menu = this.menus.get(currentMenuId);
    if (!menu) {
      return this.displayMenu('main');
    }

    // Find matching option
    const option = menu.options.find((opt) => opt.key.toUpperCase() === upperCommand);

    if (!option) {
      return `\r\nInvalid command: ${command}\r\n\r\n` + this.displayMenu(menu.id);
    }

    // Handle the menu option
    return this.handleMenuOption(option, session);
  }

  /**
   * Display a menu
   */
  private displayMenu(menuId: string): string {
    const menu = this.menus.get(menuId);
    if (!menu) {
      return 'Menu not found.\r\n';
    }

    const menuContent: MenuContent = {
      type: ContentType.MENU,
      title: menu.title,
      options: menu.options.map((opt) => ({
        key: opt.key,
        label: opt.label,
        description: opt.description,
      })),
    };

    return this.renderer.render(menuContent) + '\r\nCommand: ';
  }

  /**
   * Handle a menu option selection
   */
  private async handleMenuOption(option: MenuOption, session: Session): Promise<string> {
    switch (option.key.toUpperCase()) {
      case 'M':
        return '\r\nMessage Bases coming soon!\r\n\r\n' + this.displayMenu('main');
      
      case 'D':
        return '\r\nDoor Games coming soon!\r\n\r\n' + this.displayMenu('main');
      
      case 'P':
        return this.startPageSysOp(session);
      
      case 'U':
        return '\r\nUser Profile coming soon!\r\n\r\n' + this.displayMenu('main');
      
      case 'G':
        return '\r\n\x1b[33mGoodbye! Thanks for calling BaudAgain BBS.\x1b[0m\r\n\r\n' +
               'Connection will close in 3 seconds...\r\n';
      
      default:
        return `\r\n"${option.label}" is not yet implemented.\r\n\r\n` + this.displayMenu('main');
    }
  }

  /**
   * Start the Page SysOp flow
   */
  private startPageSysOp(session: Session): string {
    if (!this.aiSysOp) {
      return '\r\n\x1b[33mThe AI SysOp is not available at this time.\x1b[0m\r\n\r\n' +
             this.displayMenu('main');
    }

    // Set session state to indicate we're paging the SysOp
    if (this.sessionManager) {
      this.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          pagingSysOp: true,
        },
      });
    }

    return '\r\n\x1b[36m=== Page SysOp ===\x1b[0m\r\n\r\n' +
           'The AI SysOp is here to help!\r\n\r\n' +
           'You can ask a question, or just press Enter for general help.\r\n' +
           'Type \x1b[33mCANCEL\x1b[0m to return to the main menu.\r\n\r\n' +
           'Your question (or press Enter): ';
  }

  /**
   * Handle input during Page SysOp flow
   */
  private async handlePageSysOpInput(input: string, session: Session): Promise<string> {
    // Check for cancel
    if (input.toUpperCase() === 'CANCEL') {
      if (this.sessionManager) {
        this.sessionManager.updateSession(session.id, {
          data: {
            ...session.data,
            pagingSysOp: false,
          },
        });
      }
      return '\r\n\x1b[33mPage cancelled.\x1b[0m\r\n\r\n' + this.displayMenu('main');
    }

    // Clear the paging state
    if (this.sessionManager) {
      this.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          pagingSysOp: false,
        },
      });
    }

    // Get response from AI SysOp
    if (!this.aiSysOp) {
      return '\r\n\x1b[33mThe AI SysOp is not available.\x1b[0m\r\n\r\n' +
             this.displayMenu('main');
    }

    try {
      const question = input.trim() || undefined;
      const handle = session.handle || 'User';
      
      // Show "thinking" message
      const thinking = '\r\n\x1b[36mThe SysOp is responding...\x1b[0m\r\n\r\n';
      
      // Get AI response (with 5 second timeout as per requirements)
      const aiResponse = await this.aiSysOp.respondToPage(handle, question);
      
      // AI messages already contain ANSI codes, use raw ANSI content
      const aiContent: RawANSIContent = {
        type: ContentType.RAW_ANSI,
        ansi: aiResponse,
      };
      
      return thinking + this.renderer.render(aiContent) + '\r\n' + this.displayMenu('main');
    } catch (error) {
      console.error('Page SysOp error:', error);
      return '\r\n\x1b[31mThe SysOp is temporarily unavailable. Please try again later.\x1b[0m\r\n\r\n' +
             this.displayMenu('main');
    }
  }

  /**
   * Get a menu by ID
   */
  getMenu(menuId: string): Menu | undefined {
    return this.menus.get(menuId);
  }

  /**
   * Add or update a menu
   */
  setMenu(menu: Menu): void {
    this.menus.set(menu.id, menu);
  }
}
