import type { CommandHandler } from '../core/CommandHandler.js';
import type { Session, SessionState, Menu, MenuOption } from '@baudagain/shared';
import type { TerminalRenderer } from '@baudagain/shared';
import type { MenuContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';

/**
 * Menu Handler
 * 
 * Handles menu navigation and command routing.
 * Displays menus and processes single-character menu commands.
 */
export class MenuHandler implements CommandHandler {
  private menus: Map<string, Menu> = new Map();

  constructor(private renderer: TerminalRenderer) {
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
  private handleMenuOption(option: MenuOption, session: Session): Promise<string> {
    // For now, just acknowledge the selection
    // In the future, this will route to appropriate handlers
    switch (option.key.toUpperCase()) {
      case 'M':
        return Promise.resolve(
          '\r\nMessage Bases coming soon!\r\n\r\n' + this.displayMenu('main')
        );
      case 'D':
        return Promise.resolve(
          '\r\nDoor Games coming soon!\r\n\r\n' + this.displayMenu('main')
        );
      case 'P':
        return Promise.resolve(
          '\r\nAI SysOp coming soon!\r\n\r\n' + this.displayMenu('main')
        );
      case 'U':
        return Promise.resolve(
          '\r\nUser Profile coming soon!\r\n\r\n' + this.displayMenu('main')
        );
      case 'G':
        return Promise.resolve(
          '\r\n\x1b[33mGoodbye! Thanks for calling BaudAgain BBS.\x1b[0m\r\n\r\n' +
            'Connection will close in 3 seconds...\r\n'
        );
      default:
        return Promise.resolve(
          `\r\n"${option.label}" is not yet implemented.\r\n\r\n` + this.displayMenu('main')
        );
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
