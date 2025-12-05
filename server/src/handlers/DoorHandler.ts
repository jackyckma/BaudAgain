/**
 * Door Handler
 * 
 * Manages door game lifecycle and routing.
 * Handles door selection, entry, input processing, and exit.
 */

import type { CommandHandler } from '../core/CommandHandler.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import type { Session } from '@baudagain/shared';
import { SessionState, TERMINAL_WIDTH, ContentType } from '@baudagain/shared';
import type { Door } from '../doors/Door.js';
import type { DoorSessionRepository } from '../db/repositories/DoorSessionRepository.js';
import { NotificationEventType, createNotificationEvent, DoorEnteredPayload, DoorExitedPayload } from '../notifications/types.js';
import { ANSIWidthCalculator } from '../ansi/ANSIWidthCalculator.js';

export interface DoorHandlerDependencies extends HandlerDependencies {
  doorSessionRepository?: DoorSessionRepository;
}

export class DoorHandler implements CommandHandler {
  private doors: Map<string, Door> = new Map();
  private doorTimeoutMs: number = 30 * 60 * 1000; // 30 minutes default
  private timeoutCheckInterval: NodeJS.Timeout | null = null;
  private readonly MAX_WIDTH = TERMINAL_WIDTH; // 80
  private readonly BOX_WIDTH = TERMINAL_WIDTH - 2; // 78
  
  constructor(private deps: DoorHandlerDependencies) {
    // Start timeout checking
    this.startTimeoutChecking();
  }
  
  /**
   * Enforce width limit on door output
   * Intercepts door output and ensures all lines respect MAX_WIDTH
   * 
   * @param output - Raw output from door game
   * @returns Width-enforced output
   */
  private enforceWidth(output: string): string {
    // Split into lines (handle both \r\n and \n)
    const lines = output.split(/\r?\n/);
    
    // Process each line
    const processedLines = lines.map(line => {
      const width = ANSIWidthCalculator.calculate(line);
      
      // If line exceeds max width, truncate it
      if (width > this.MAX_WIDTH) {
        return ANSIWidthCalculator.truncate(line, this.MAX_WIDTH, '...');
      }
      
      return line;
    });
    
    // Rejoin with original line endings (preserve \r\n if present)
    const hasCarriageReturn = output.includes('\r\n');
    return processedLines.join(hasCarriageReturn ? '\r\n' : '\n');
  }
  
  /**
   * Register a door game
   */
  registerDoor(door: Door): void {
    this.doors.set(door.id, door);
  }

  /**
   * Get all registered doors
   */
  getDoors(): Map<string, Door> {
    return this.doors;
  }

  /**
   * Start checking for door timeouts
   */
  private startTimeoutChecking(): void {
    // Check every 5 minutes
    this.timeoutCheckInterval = setInterval(() => {
      this.checkDoorTimeouts();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop timeout checking
   */
  stopTimeoutChecking(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
  }

  /**
   * Check for door sessions that have timed out
   */
  private checkDoorTimeouts(): void {
    const now = Date.now();
    const allSessions = this.deps.sessionManager.getAllSessions();
    
    for (const session of allSessions) {
      // Only check sessions that are in a door
      if (session.state === SessionState.IN_DOOR && session.data.door?.doorId) {
        const inactiveTime = now - session.lastActivity.getTime();
        
        // If inactive for longer than door timeout, exit the door
        if (inactiveTime > this.doorTimeoutMs) {
          const doorId = session.data.door.doorId;
          const door = this.doors.get(doorId);
          
          console.log(`Door timeout for session ${session.id} in door ${doorId}`);
          
          // Exit the door gracefully
          this.exitDoorDueToTimeout(session, door).catch(error => {
            console.error(`Error exiting door on timeout for session ${session.id}:`, error);
          });
        }
      }
    }
  }

  /**
   * Exit a door due to timeout
   */
  private async exitDoorDueToTimeout(session: Session, door?: Door): Promise<void> {
    // Save the door session state before exiting
    if (this.deps.doorSessionRepository && session.userId && session.data.door?.doorId) {
      const doorId = session.data.door.doorId;
      const savedSession = this.deps.doorSessionRepository.getActiveDoorSession(session.userId, doorId);
      
      if (savedSession) {
        // Update the session with current state
        this.deps.doorSessionRepository.updateDoorSession(
          savedSession.id,
          session.data.door.gameState,
          session.data.door.history
        );
      }
    }
    
    // Call door's exit method if available
    if (door) {
      try {
        await door.exit(session);
      } catch (error) {
        console.error(`Error calling door exit on timeout:`, error);
      }
    }
    
    // Clear door state and return to menu
    session.state = SessionState.IN_MENU;
    session.data.door = undefined;
    this.deps.sessionManager.updateSession(session.id, {
      state: SessionState.IN_MENU,
      data: { ...session.data, door: undefined }
    });
  }

  /**
   * Set door timeout in milliseconds
   */
  setDoorTimeout(timeoutMs: number): void {
    this.doorTimeoutMs = timeoutMs;
  }

  /**
   * Get current door timeout in milliseconds
   */
  getDoorTimeout(): number {
    return this.doorTimeoutMs;
  }
  
  /**
   * Check if this handler can handle the command
   */
  canHandle(command: string, session: Session): boolean {
    // Handle if user is in a door game
    if (session.state === SessionState.IN_DOOR && session.data.door?.doorId) {
      return true;
    }
    
    // Handle if user selects door games from menu (authenticated or in_menu state)
    if (command.toUpperCase() === 'D' && 
        (session.state === SessionState.IN_MENU || session.state === SessionState.AUTHENTICATED)) {
      return true;
    }
    
    // Handle if user is in door selection menu
    if (session.data.door && !session.data.door.doorId) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle the command
   */
  async handle(command: string, session: Session): Promise<string> {
    // If not in door, show door menu
    if (!session.data.door || !session.data.door.doorId) {
      return this.handleDoorSelection(command, session);
    }
    
    // If in door, process input
    return this.handleDoorInput(command, session);
  }
  
  /**
   * Handle door selection from menu
   */
  private async handleDoorSelection(command: string, session: Session): Promise<string> {
    const cmd = command.toUpperCase();
    
    // Show door menu if 'D' command
    if (cmd === 'D') {
      session.data.door = {};  // Initialize door state
      return this.showDoorMenu();
    }
    
    // Handle 'Q' to return to main menu
    if (cmd === 'Q') {
      session.data.door = undefined;
      session.state = SessionState.IN_MENU;
      // Return to menu immediately without requiring extra Enter
      const menuContent = {
        type: ContentType.MENU,
        title: 'Main Menu',
        options: [
          { key: 'M', label: 'Message Bases', description: 'Read and post messages' },
          { key: 'D', label: 'Door Games', description: 'Play interactive games' },
          { key: 'A', label: 'Art Gallery', description: 'View AI-generated ANSI art' },
          { key: 'P', label: 'Page SysOp', description: 'Get help from the AI SysOp' },
          { key: 'U', label: 'User Profile', description: 'View and edit your profile' },
          { key: 'G', label: 'Goodbye', description: 'Log off the BBS' },
        ],
      };
      return '\r\n\x1b[33mReturning to main menu...\x1b[0m\r\n\r\n' + 
             this.deps.renderer.render(menuContent) + '\r\nCommand: ';
    }
    
    // Try to parse door selection (1, 2, 3, etc.)
    const doorIndex = parseInt(cmd, 10);
    if (isNaN(doorIndex) || doorIndex < 1) {
      return this.showDoorMenu('\r\nInvalid selection. Please try again.\r\n\r\n');
    }
    
    // Get door by index
    const doorsArray = Array.from(this.doors.values());
    if (doorIndex > doorsArray.length) {
      return this.showDoorMenu('\r\nInvalid selection. Please try again.\r\n\r\n');
    }
    
    const door = doorsArray[doorIndex - 1];
    return this.enterDoor(door, session);
  }
  
  /**
   * Enter a door game
   */
  private async enterDoor(door: Door, session: Session): Promise<string> {
    // Check if user has a saved session for this door
    let savedSession = null;
    if (this.deps.doorSessionRepository && session.userId) {
      savedSession = this.deps.doorSessionRepository.getActiveDoorSession(session.userId, door.id);
    }
    
    // Update session state
    session.state = SessionState.IN_DOOR;
    session.data.door = {
      doorId: door.id,
      gameState: savedSession ? JSON.parse(savedSession.state) : {},
      history: savedSession ? JSON.parse(savedSession.history) : []
    };
    
    // Update session
    this.deps.sessionManager.updateSession(session.id, {
      state: session.state,
      data: session.data
    });
    
    // Save door session to database
    if (this.deps.doorSessionRepository && session.userId && !savedSession) {
      this.deps.doorSessionRepository.createDoorSession({
        userId: session.userId,
        doorId: door.id,
        state: session.data.door.gameState,
        history: session.data.door.history
      });
    }
    
    // Broadcast door entered event
    if (this.deps.notificationService && session.userId && session.handle) {
      const doorEnteredPayload: DoorEnteredPayload = {
        doorId: door.id,
        doorName: door.name,
        userId: session.userId,
        handle: session.handle,
      };
      const doorEnteredEvent = createNotificationEvent(
        NotificationEventType.DOOR_ENTERED,
        doorEnteredPayload
      );
      
      try {
        await this.deps.notificationService.broadcastToAuthenticated(doorEnteredEvent);
      } catch (error) {
        console.error(`Error broadcasting door entered event:`, error);
      }
    }
    
    // Enter the door
    try {
      const output = await door.enter(session);
      
      // Apply width enforcement to door output
      const enforcedOutput = this.enforceWidth(output);
      
      // If resuming, add a message
      if (savedSession) {
        return '\r\n\x1b[33m[Resuming saved game...]\x1b[0m\r\n\r\n' + enforcedOutput;
      }
      
      return enforcedOutput;
    } catch (error) {
      console.error(`Error entering door ${door.id}:`, error);
      session.state = SessionState.IN_MENU;
      session.data.door = undefined;
      return '\r\nError entering door game. Returning to main menu.\r\n\r\n';
    }
  }
  
  /**
   * Handle input while in a door
   */
  private async handleDoorInput(command: string, session: Session): Promise<string> {
    const doorId = session.data.door?.doorId;
    if (!doorId) {
      return this.exitDoor(session);
    }
    
    const door = this.doors.get(doorId);
    if (!door) {
      console.error(`Door not found: ${doorId}`);
      return this.exitDoor(session);
    }
    
    // Check for exit command
    if (command.toUpperCase() === 'Q' || command.toUpperCase() === 'QUIT' || command.toUpperCase() === 'EXIT') {
      return this.exitDoor(session, door);
    }
    
    // Process input through the door
    try {
      const output = await door.processInput(command, session);
      
      // Apply width enforcement to door output
      const enforcedOutput = this.enforceWidth(output);
      
      // Save door session state to database
      if (this.deps.doorSessionRepository && session.userId && session.data.door) {
        const savedSession = this.deps.doorSessionRepository.getActiveDoorSession(session.userId, doorId);
        if (savedSession) {
          this.deps.doorSessionRepository.updateDoorSession(
            savedSession.id,
            session.data.door.gameState,
            session.data.door.history
          );
        }
      }
      
      // Update session activity
      this.deps.sessionManager.touchSession(session.id);
      
      return enforcedOutput;
    } catch (error) {
      console.error(`Error processing door input for ${door.id}:`, error);
      return '\r\nError processing command. Type Q to exit.\r\n\r\n';
    }
  }
  
  /**
   * Exit the current door
   */
  private async exitDoor(session: Session, door?: Door): Promise<string> {
    let exitMessage = '';
    
    // Call door's exit method if available
    if (door) {
      try {
        exitMessage = await door.exit(session);
        // Apply width enforcement to exit message
        exitMessage = this.enforceWidth(exitMessage);
      } catch (error) {
        console.error(`Error exiting door ${door.id}:`, error);
        exitMessage = '\r\nExiting door game...\r\n\r\n';
      }
    }
    
    // Broadcast door exited event
    if (this.deps.notificationService && session.userId && session.handle && session.data.door?.doorId) {
      const doorExitedPayload: DoorExitedPayload = {
        doorId: session.data.door.doorId,
        userId: session.userId,
        handle: session.handle,
      };
      const doorExitedEvent = createNotificationEvent(
        NotificationEventType.DOOR_EXITED,
        doorExitedPayload
      );
      
      try {
        await this.deps.notificationService.broadcastToAuthenticated(doorExitedEvent);
      } catch (error) {
        console.error(`Error broadcasting door exited event:`, error);
      }
    }
    
    // Delete saved door session from database (user is exiting, not just disconnecting)
    if (this.deps.doorSessionRepository && session.userId && session.data.door?.doorId) {
      const savedSession = this.deps.doorSessionRepository.getActiveDoorSession(
        session.userId,
        session.data.door.doorId
      );
      if (savedSession) {
        this.deps.doorSessionRepository.deleteDoorSession(savedSession.id);
      }
    }
    
    // Clear door state
    session.state = SessionState.IN_MENU;
    session.data.door = undefined;
    this.deps.sessionManager.updateSession(session.id, {
      state: SessionState.IN_MENU,
      data: { ...session.data, door: undefined }
    });
    
    return exitMessage + 'Returning to main menu...\r\n\r\n';
  }

  /**
   * Helper to create borders
   */
  private getBorders() {
    const width = this.BOX_WIDTH;
    return {
      top: '╔' + '═'.repeat(width) + '╗\r\n',
      mid: '╠' + '═'.repeat(width) + '╣\r\n',
      bot: '╚' + '═'.repeat(width) + '╝\r\n',
      empty: '║' + ' '.repeat(width) + '║\r\n',
      line: (text: string) => {
        // Calculate visual width (strips ANSI codes, handles emojis correctly)
        const visualWidth = ANSIWidthCalculator.calculate(text);
        // Calculate needed padding
        const paddingNeeded = Math.max(0, (width - 2) - visualWidth);
        const padding = ' '.repeat(paddingNeeded);
        return '║ ' + text + padding + ' ║\r\n';
      },
      center: (text: string) => {
        const visualWidth = ANSIWidthCalculator.calculate(text);
        const totalPadding = Math.max(0, (width - 2) - visualWidth);
        const left = Math.floor(totalPadding / 2);
        const right = totalPadding - left;
        return '║ ' + ' '.repeat(left) + text + ' '.repeat(right) + ' ║\r\n';
      }
    };
  }
  
  /**
   * Show the door games menu
   */
  private showDoorMenu(message?: string): string {
    let output = message || '';
    const b = this.getBorders();
    
    output += '\r\n';
    output += b.top;
    output += b.center('DOOR GAMES');
    output += b.mid;
    
    if (this.doors.size === 0) {
      output += b.line('No door games available');
    } else {
      let index = 1;
      for (const door of this.doors.values()) {
        const name = door.name.padEnd(48).substring(0, 48); // Ensure it fits
        const line = `${index}. ${name}`;
        output += b.line(line);
        
        const desc = door.description.padEnd(this.BOX_WIDTH - 6).substring(0, this.BOX_WIDTH - 6);
        const descLine = `   ${desc}`;
        output += b.line(descLine);
        index++;
      }
    }
    
    output += b.empty;
    output += b.line('Q. Return to Main Menu');
    output += b.bot;
    output += '\r\nSelect a door (or Q to quit): ';
    
    // Apply width enforcement to the menu (optional, but good for safety)
    return this.enforceWidth(output);
  }
}
