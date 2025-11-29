import type { CommandHandler } from '../core/CommandHandler.js';
import type { Session, SessionState, Menu, MenuOption, MenuFlowState, MessageContent } from '@baudagain/shared';
import type { TerminalRenderer, MenuContent as MenuContentType } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';
import type { HandlerDependencies } from './HandlerDependencies.js';
import { AIResponseHelper } from '../utils/AIResponseHelper.js';

/**
 * Menu Handler
 * 
 * Handles menu navigation and command routing.
 * Displays menus and processes single-character menu commands.
 */
export class MenuHandler implements CommandHandler {
  private menus: Map<string, Menu> = new Map();

  constructor(private deps: HandlerDependencies) {
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
    if (session.data.menu?.pagingSysOp) {
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
      return this.displayMenuWithMessage(menu.id, `\r\nInvalid command: ${command}\r\n`);
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

    const menuContent: MenuContentType = {
      type: ContentType.MENU,
      title: menu.title,
      options: menu.options.map((opt) => ({
        key: opt.key,
        label: opt.label,
        description: opt.description,
      })),
    };

    return this.deps.renderer.render(menuContent) + '\r\nCommand: ';
  }

  /**
   * Display a menu with an optional message
   */
  private displayMenuWithMessage(
    menuId: string,
    message?: string,
    messageStyle: 'info' | 'success' | 'warning' = 'info'
  ): string {
    let output = '';
    
    if (message) {
      const messageContent: MessageContent = {
        type: ContentType.MESSAGE,
        text: message,
        style: messageStyle,
      };
      output += this.deps.renderer.render(messageContent);
    }
    
    output += this.displayMenu(menuId);
    return output;
  }

  /**
   * Handle a menu option selection
   */
  private async handleMenuOption(option: MenuOption, session: Session): Promise<string> {
    switch (option.key.toUpperCase()) {
      case 'M':
        return this.displayMenuWithMessage('main', '\r\nMessage Bases coming soon!\r\n');
      
      case 'D':
        // Door Games are handled by DoorHandler
        // This case should not be reached if DoorHandler is registered before MenuHandler
        return this.displayMenuWithMessage('main', '\r\nDoor Games - please try again.\r\n');
      
      case 'P':
        return this.startPageSysOp(session);
      
      case 'U':
        return this.displayMenuWithMessage('main', '\r\nUser Profile coming soon!\r\n');
      
      case 'G':
        return '\r\n\x1b[33mGoodbye! Thanks for calling BaudAgain BBS.\x1b[0m\r\n\r\n' +
               'Connection will close in 3 seconds...\r\n';
      
      default:
        return this.displayMenuWithMessage('main', `\r\n"${option.label}" is not yet implemented.\r\n`);
    }
  }

  /**
   * Start the Page SysOp flow
   */
  private startPageSysOp(session: Session): string {
    if (!this.deps.aiSysOp) {
      return this.displayMenuWithMessage(
        'main',
        '\r\n\x1b[33mThe AI SysOp is not available at this time.\x1b[0m\r\n',
        'warning'
      );
    }

    // Set session state to indicate we're paging the SysOp
    const menuState: MenuFlowState = {
      pagingSysOp: true,
    };

    this.deps.sessionManager.updateSession(session.id, {
      data: {
        ...session.data,
        menu: menuState,
      },
    });

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
      this.deps.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          menu: undefined,
        },
      });
      return this.displayMenuWithMessage('main', '\r\n\x1b[33mPage cancelled.\x1b[0m\r\n', 'warning');
    }

    // Clear the paging state
    this.deps.sessionManager.updateSession(session.id, {
      data: {
        ...session.data,
        menu: undefined,
      },
    });

    // Get response from AI SysOp
    if (!this.deps.aiSysOp) {
      return this.displayMenuWithMessage(
        'main',
        '\r\n\x1b[33mThe AI SysOp is not available.\x1b[0m\r\n',
        'warning'
      );
    }

    const question = input.trim() || undefined;
    const handle = session.handle || 'User';
    
    // Show "thinking" message
    const thinking = '\r\n\x1b[36mThe SysOp is responding...\x1b[0m\r\n\r\n';
    
    // Get AI response using helper (with 5 second timeout as per requirements)
    const aiOutput = await AIResponseHelper.renderAIResponse(
      this.deps.aiSysOp,
      () => this.deps.aiSysOp!.respondToPage(handle, question),
      this.deps.renderer,
      'The SysOp is temporarily unavailable. Please try again later.',
      false  // Don't wrap with newlines
    );
    
    return thinking + aiOutput + '\r\n' + this.displayMenu('main');
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
