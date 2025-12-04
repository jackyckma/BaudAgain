import type { CommandHandler } from '../core/CommandHandler.js';
import type { Session, SessionState, AuthFlowState } from '@baudagain/shared';
import type { TerminalRenderer, MessageContent, PromptContent, ErrorContent, MenuContent, EchoControlContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';
import type { UserService } from '../services/UserService.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import { AIResponseHelper } from '../utils/AIResponseHelper.js';

const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Authentication Handler
 * 
 * Handles user registration and login.
 * Manages authentication state and validates credentials.
 * Uses UserService for business logic.
 */
export class AuthHandler implements CommandHandler {
  constructor(
    private userService: UserService,
    private deps: HandlerDependencies
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
    if (session.data.auth) {
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
    const authState: AuthFlowState = {
      flow: 'registration',
      step: 'handle',
    };

    this.deps.sessionManager.updateSession(session.id, {
      state: 'authenticating' as SessionState,
      data: {
        ...session.data,
        auth: authState,
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

    return this.deps.renderer.render(message) + this.deps.renderer.render(prompt);
  }

  /**
   * Start login flow
   */
  private startLogin(handle: string, session: Session): string {
    const authState: AuthFlowState = {
      flow: 'login',
      step: 'password',
      handle: handle,
      loginAttempts: session.data.auth?.loginAttempts || 0,
    };

    this.deps.sessionManager.updateSession(session.id, {
      state: 'authenticating' as SessionState,
      data: {
        ...session.data,
        auth: authState,
      },
    });

    // Disable echo for password input
    const echoOff: EchoControlContent = {
      type: ContentType.ECHO_CONTROL,
      enabled: false,
    };

    const prompt: PromptContent = {
      type: ContentType.PROMPT,
      text: 'Password: ',
    };

    return this.deps.renderer.render(echoOff) + this.deps.renderer.render(prompt);
  }

  /**
   * Handle authentication flow steps
   */
  private async handleAuthFlow(command: string, session: Session): Promise<string> {
    const authState = session.data.auth;

    if (!authState) {
      return 'Authentication error. Please try again.\r\n';
    }

    if (authState.flow === 'registration') {
      return this.handleRegistrationFlow(command, session, authState.step);
    } else if (authState.flow === 'login') {
      return this.handleLoginFlow(command, session, authState.step);
    }

    return 'Authentication error. Please try again.\r\n';
  }

  /**
   * Handle registration flow
   */
  private async handleRegistrationFlow(
    command: string,
    session: Session,
    step: 'handle' | 'password'
  ): Promise<string> {
    if (step === 'handle') {
      // Validate handle using UserService
      const validation = this.userService.validateHandle(command);
      if (!validation.valid) {
        const error: ErrorContent = {
          type: ContentType.ERROR,
          message: validation.error!,
        };
        const prompt: PromptContent = {
          type: ContentType.PROMPT,
          text: 'Choose a handle (3-20 characters): ',
        };
        return this.deps.renderer.render(error) + this.deps.renderer.render(prompt);
      }

      // Check if handle is available using UserService
      const isAvailable = await this.userService.isHandleAvailable(command);
      if (!isAvailable) {
        const error: ErrorContent = {
          type: ContentType.ERROR,
          message: 'Handle already taken. Please choose another.',
        };
        const prompt: PromptContent = {
          type: ContentType.PROMPT,
          text: 'Choose a handle (3-20 characters): ',
        };
        return this.deps.renderer.render(error) + this.deps.renderer.render(prompt);
      }

      // Handle is valid, move to password
      const authState: AuthFlowState = {
        flow: 'registration',
        step: 'password',
        handle: command,
      };

      this.deps.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          auth: authState,
        },
      });

      // Disable echo for password input
      const echoOff: EchoControlContent = {
        type: ContentType.ECHO_CONTROL,
        enabled: false,
      };

      const prompt: PromptContent = {
        type: ContentType.PROMPT,
        text: 'Choose a password (min 6 characters): ',
      };
      return this.deps.renderer.render(echoOff) + this.deps.renderer.render(prompt);
    }

    if (step === 'password') {
      // Validate password using UserService
      const validation = this.userService.validatePassword(command);
      if (!validation.valid) {
        const error: ErrorContent = {
          type: ContentType.ERROR,
          message: validation.error!,
        };
        
        // Keep echo disabled for retry
        const echoOff: EchoControlContent = {
          type: ContentType.ECHO_CONTROL,
          enabled: false,
        };
        
        const prompt: PromptContent = {
          type: ContentType.PROMPT,
          text: 'Choose a password (min 6 characters): ',
        };
        return this.deps.renderer.render(error) + this.deps.renderer.render(echoOff) + this.deps.renderer.render(prompt);
      }

      // Create user using UserService
      const handle = session.data.auth?.handle;
      if (!handle) {
        return 'Registration error: handle not found.\r\n';
      }

      const user = await this.userService.createUser({
        handle,
        password: command,
      });

      // Re-enable echo after password input
      const echoOn: EchoControlContent = {
        type: ContentType.ECHO_CONTROL,
        enabled: true,
      };

      // Update session to authenticated state and set current menu to main
      this.deps.sessionManager.updateSession(session.id, {
        state: 'authenticated' as SessionState,
        userId: user.id,
        handle: user.handle,
        currentMenu: 'main',
        data: {},
      });

      // Generate AI welcome message using helper with loading indicator
      const welcomeOutput = await AIResponseHelper.renderAIResponse(
        this.deps.aiSysOp,
        () => this.deps.aiSysOp!.generateWelcome(user.handle),
        this.deps.renderer,
        `\r\nWelcome to BaudAgain BBS, ${user.handle}!\r\nYou are now logged in.\r\n\r\n`,
        true,
        'Generating personalized welcome message...'
      );

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

      return this.deps.renderer.render(echoOn) + welcomeOutput + this.deps.renderer.render(menuContent) + '\r\nCommand: ';
    }

    return 'Registration error.\r\n';
  }

  /**
   * Handle login flow
   */
  private async handleLoginFlow(
    command: string,
    session: Session,
    step: 'handle' | 'password'
  ): Promise<string> {
    if (step === 'password') {
      const handle = session.data.auth?.handle;
      if (!handle) {
        return 'Login error: handle not found.\r\n';
      }
      
      // Authenticate user using UserService
      const user = await this.userService.authenticateUser(handle, command);

      if (!user) {
        return this.handleFailedLogin(session, 'Invalid handle or password.');
      }

      // Successful login (UserService already updated last login)

      // Re-enable echo after password input
      const echoOn: EchoControlContent = {
        type: ContentType.ECHO_CONTROL,
        enabled: true,
      };

      // Update session to authenticated state and set current menu to main
      this.deps.sessionManager.updateSession(session.id, {
        state: 'authenticated' as SessionState,
        userId: user.id,
        handle: user.handle,
        currentMenu: 'main',
        data: {},
      });

      // Generate AI greeting using helper with loading indicator
      let greetingText = `\r\nWelcome back, ${user.handle}!\r\n`;
      if (user.lastLogin) {
        greetingText += `Last login: ${user.lastLogin.toLocaleString()}\r\n\r\n`;
      } else {
        greetingText += `This is your first login!\r\n\r\n`;
      }

      const greetingOutput = await AIResponseHelper.renderAIResponse(
        this.deps.aiSysOp,
        () => this.deps.aiSysOp!.generateGreeting(user.handle, user.lastLogin),
        this.deps.renderer,
        greetingText,
        true,
        'Generating personalized greeting...'
      );

      // Check if user should receive a daily digest
      let digestAvailable = false;
      if (
        this.deps.dailyDigestService &&
        this.deps.messageRepository &&
        this.deps.messageBaseRepository &&
        user.lastLogin
      ) {
        digestAvailable = this.deps.dailyDigestService.shouldGenerateDigest(user.lastLogin);
      }

      // If digest is available, offer it to the user
      let digestOutput = '';
      if (digestAvailable) {
        // Store digest state in session for later retrieval
        this.deps.sessionManager.updateSession(session.id, {
          data: {
            ...session.data,
            digestAvailable: true,
          },
        });

        // Show notification about available digest
        const message: MessageContent = {
          type: ContentType.MESSAGE,
          text: '\r\n📰 A daily digest is available with updates since your last visit.\r\n',
          style: 'info',
        };
        digestOutput = this.deps.renderer.render(message);
        digestOutput += 'Type "DIGEST" at any time to view it, or continue to the main menu.\r\n\r\n';
      }

      // Show main menu immediately after login (or after digest)
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

      return this.deps.renderer.render(echoOn) + greetingOutput + digestOutput + this.deps.renderer.render(menuContent) + '\r\nCommand: ';
    }

    return 'Login error.\r\n';
  }

  /**
   * Handle failed login attempt
   */
  private handleFailedLogin(session: Session, errorMessage: string): string {
    const attempts = (session.data.auth?.loginAttempts || 0) + 1;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const error: ErrorContent = {
        type: ContentType.ERROR,
        message: 'Too many failed login attempts. Disconnecting...',
      };
      return this.deps.renderer.render(error);
    }

    const authState: AuthFlowState = {
      ...session.data.auth!,
      loginAttempts: attempts,
    };

    this.deps.sessionManager.updateSession(session.id, {
      data: {
        ...session.data,
        auth: authState,
      },
    });

    const error: ErrorContent = {
      type: ContentType.ERROR,
      message: `${errorMessage} (Attempt ${attempts}/${MAX_LOGIN_ATTEMPTS})`,
    };
    
    // Keep echo disabled for retry
    const echoOff: EchoControlContent = {
      type: ContentType.ECHO_CONTROL,
      enabled: false,
    };
    
    const prompt: PromptContent = {
      type: ContentType.PROMPT,
      text: 'Password: ',
    };

    return this.deps.renderer.render(error) + this.deps.renderer.render(echoOff) + this.deps.renderer.render(prompt);
  }
}
