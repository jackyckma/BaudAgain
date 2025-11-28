import type { CommandHandler } from '../core/CommandHandler.js';
import type { Session, SessionState, Menu } from '@baudagain/shared';
import type { UserRepository } from '../db/repositories/UserRepository.js';
import type { TerminalRenderer, MessageContent, PromptContent, ErrorContent, MenuContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';
import type { SessionManager } from '../session/SessionManager.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 10;
const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 6;
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Authentication Handler
 * 
 * Handles user registration and login.
 * Manages authentication state and validates credentials.
 */
export class AuthHandler implements CommandHandler {
  constructor(
    private userRepository: UserRepository,
    private sessionManager: SessionManager,
    private renderer: TerminalRenderer,
    private aiSysOp?: any  // Optional AI SysOp for welcome messages
  ) {}

  canHandle(command: string, session: Session): boolean {
    // Handle commands when in CONNECTED or AUTHENTICATING state
    return (
      session.state === ('connected' as SessionState) ||
      session.state === ('authenticating' as SessionState)
    );
  }

  async handle(command: string, session: Session): Promise<string> {
    const upperCommand = command.toUpperCase();

    // Check if we're in the middle of registration/login flow
    if (session.data.authFlow) {
      return this.handleAuthFlow(command, session);
    }

    // Initial command - NEW or handle
    if (upperCommand === 'NEW') {
      return this.startRegistration(session);
    }

    // Assume it's a handle for login
    return this.startLogin(command, session);
  }

  /**
   * Start registration flow
   */
  private startRegistration(session: Session): string {
    this.sessionManager.updateSession(session.id, {
      state: 'authenticating' as SessionState,
      data: {
        ...session.data,
        authFlow: 'registration',
        authStep: 'handle',
      },
    });

    const message: MessageContent = {
      type: ContentType.MESSAGE,
      text: '\r\n=== New User Registration ===\r\n',
      style: 'info',
    };

    const prompt: PromptContent = {
      type: ContentType.PROMPT,
      text: 'Choose a handle (3-20 characters): ',
    };

    return this.renderer.render(message) + this.renderer.render(prompt);
  }

  /**
   * Start login flow
   */
  private startLogin(handle: string, session: Session): string {
    this.sessionManager.updateSession(session.id, {
      state: 'authenticating' as SessionState,
      data: {
        ...session.data,
        authFlow: 'login',
        authStep: 'password',
        handle: handle,
        loginAttempts: (session.data.loginAttempts || 0),
      },
    });

    const prompt: PromptContent = {
      type: ContentType.PROMPT,
      text: 'Password: ',
    };

    return this.renderer.render(prompt);
  }

  /**
   * Handle authentication flow steps
   */
  private async handleAuthFlow(command: string, session: Session): Promise<string> {
    const { authFlow, authStep } = session.data;

    if (authFlow === 'registration') {
      return this.handleRegistrationFlow(command, session, authStep);
    } else if (authFlow === 'login') {
      return this.handleLoginFlow(command, session, authStep);
    }

    return 'Authentication error. Please try again.\r\n';
  }

  /**
   * Handle registration flow
   */
  private async handleRegistrationFlow(
    command: string,
    session: Session,
    step: string
  ): Promise<string> {
    if (step === 'handle') {
      // Validate handle
      const validation = this.validateHandle(command);
      if (!validation.valid) {
        const error: ErrorContent = {
          type: ContentType.ERROR,
          message: validation.error!,
        };
        const prompt: PromptContent = {
          type: ContentType.PROMPT,
          text: 'Choose a handle (3-20 characters): ',
        };
        return this.renderer.render(error) + this.renderer.render(prompt);
      }

      // Check if handle exists
      const existingUser = await this.userRepository.getUserByHandle(command);
      if (existingUser) {
        const error: ErrorContent = {
          type: ContentType.ERROR,
          message: 'Handle already taken. Please choose another.',
        };
        const prompt: PromptContent = {
          type: ContentType.PROMPT,
          text: 'Choose a handle (3-20 characters): ',
        };
        return this.renderer.render(error) + this.renderer.render(prompt);
      }

      // Handle is valid, move to password
      this.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          handle: command,
          authStep: 'password',
        },
      });

      const prompt: PromptContent = {
        type: ContentType.PROMPT,
        text: 'Choose a password (min 6 characters): ',
      };
      return this.renderer.render(prompt);
    }

    if (step === 'password') {
      // Validate password
      if (command.length < MIN_PASSWORD_LENGTH) {
        const error: ErrorContent = {
          type: ContentType.ERROR,
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        };
        const prompt: PromptContent = {
          type: ContentType.PROMPT,
          text: 'Choose a password (min 6 characters): ',
        };
        return this.renderer.render(error) + this.renderer.render(prompt);
      }

      // Create user
      const handle = session.data.handle;
      const passwordHash = await bcrypt.hash(command, BCRYPT_ROUNDS);

      const user = await this.userRepository.createUser({
        id: uuidv4(),
        handle,
        passwordHash,
        accessLevel: 10,
        createdAt: new Date(),
        totalCalls: 1,
        totalPosts: 0,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      });

      // Update session to authenticated state and set current menu to main
      this.sessionManager.updateSession(session.id, {
        state: 'authenticated' as SessionState,
        userId: user.id,
        handle: user.handle,
        currentMenu: 'main',
        data: {},
      });

      // Generate AI welcome message if available
      let welcomeText = `\r\nWelcome to BaudAgain BBS, ${user.handle}!\r\nYou are now logged in.\r\n\r\n`;
      
      if (this.aiSysOp) {
        try {
          const aiWelcome = await this.aiSysOp.generateWelcome(user.handle);
          welcomeText = `\r\n${aiWelcome}\r\n`;
        } catch (error) {
          // Fall back to default message if AI fails
          console.error('AI SysOp welcome failed:', error);
        }
      }

      const success: MessageContent = {
        type: ContentType.MESSAGE,
        text: welcomeText,
        style: 'success',
      };

      // Show main menu immediately after registration
      const menuContent: MenuContent = {
        type: ContentType.MENU,
        title: 'Main Menu',
        options: [
          { key: 'M', label: 'Message Bases', description: 'Read and post messages' },
          { key: 'D', label: 'Door Games', description: 'Play interactive games' },
          { key: 'P', label: 'Page SysOp', description: 'Get help from the AI SysOp' },
          { key: 'U', label: 'User Profile', description: 'View and edit your profile' },
          { key: 'G', label: 'Goodbye', description: 'Log off the BBS' },
        ],
      };

      return this.renderer.render(success) + this.renderer.render(menuContent) + '\r\nCommand: ';
    }

    return 'Registration error.\r\n';
  }

  /**
   * Handle login flow
   */
  private async handleLoginFlow(
    command: string,
    session: Session,
    step: string
  ): Promise<string> {
    if (step === 'password') {
      const handle = session.data.handle;
      const user = await this.userRepository.getUserByHandle(handle);

      if (!user) {
        return this.handleFailedLogin(session, 'Invalid handle or password.');
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(command, user.passwordHash);

      if (!passwordMatch) {
        return this.handleFailedLogin(session, 'Invalid handle or password.');
      }

      // Successful login
      await this.userRepository.updateLastLogin(user.id);

      // Update session to authenticated state and set current menu to main
      this.sessionManager.updateSession(session.id, {
        state: 'authenticated' as SessionState,
        userId: user.id,
        handle: user.handle,
        currentMenu: 'main',
        data: {},
      });

      // Generate AI greeting if available
      let greetingText = `\r\nWelcome back, ${user.handle}!\r\n`;
      if (user.lastLogin) {
        greetingText += `Last login: ${user.lastLogin.toLocaleString()}\r\n\r\n`;
      } else {
        greetingText += `This is your first login!\r\n\r\n`;
      }
      
      if (this.aiSysOp) {
        try {
          const aiGreeting = await this.aiSysOp.generateGreeting(user.handle, user.lastLogin);
          greetingText = `\r\n${aiGreeting}\r\n`;
        } catch (error) {
          // Fall back to default message if AI fails
          console.error('AI SysOp greeting failed:', error);
        }
      }
      
      const success: MessageContent = {
        type: ContentType.MESSAGE,
        text: greetingText,
        style: 'success',
      };

      // Show main menu immediately after login
      const menuContent: MenuContent = {
        type: ContentType.MENU,
        title: 'Main Menu',
        options: [
          { key: 'M', label: 'Message Bases', description: 'Read and post messages' },
          { key: 'D', label: 'Door Games', description: 'Play interactive games' },
          { key: 'P', label: 'Page SysOp', description: 'Get help from the AI SysOp' },
          { key: 'U', label: 'User Profile', description: 'View and edit your profile' },
          { key: 'G', label: 'Goodbye', description: 'Log off the BBS' },
        ],
      };

      return this.renderer.render(success) + this.renderer.render(menuContent) + '\r\nCommand: ';
    }

    return 'Login error.\r\n';
  }

  /**
   * Handle failed login attempt
   */
  private handleFailedLogin(session: Session, errorMessage: string): string {
    const attempts = (session.data.loginAttempts || 0) + 1;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const error: ErrorContent = {
        type: ContentType.ERROR,
        message: 'Too many failed login attempts. Disconnecting...',
      };
      return this.renderer.render(error);
    }

    this.sessionManager.updateSession(session.id, {
      data: {
        ...session.data,
        loginAttempts: attempts,
      },
    });

    const error: ErrorContent = {
      type: ContentType.ERROR,
      message: `${errorMessage} (Attempt ${attempts}/${MAX_LOGIN_ATTEMPTS})`,
    };
    const prompt: PromptContent = {
      type: ContentType.PROMPT,
      text: 'Password: ',
    };

    return this.renderer.render(error) + this.renderer.render(prompt);
  }

  /**
   * Validate handle format
   */
  private validateHandle(handle: string): { valid: boolean; error?: string } {
    if (handle.length < MIN_HANDLE_LENGTH) {
      return {
        valid: false,
        error: `Handle must be at least ${MIN_HANDLE_LENGTH} characters.`,
      };
    }

    if (handle.length > MAX_HANDLE_LENGTH) {
      return {
        valid: false,
        error: `Handle must be no more than ${MAX_HANDLE_LENGTH} characters.`,
      };
    }

    // Only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      return {
        valid: false,
        error: 'Handle can only contain letters, numbers, and underscores.',
      };
    }

    return { valid: true };
  }
}
