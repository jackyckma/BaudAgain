/**
 * Door Handler
 * 
 * Manages door game lifecycle and routing.
 * Handles door selection, entry, input processing, and exit.
 */

import type { CommandHandler } from '../core/CommandHandler.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import type { Session } from '@baudagain/shared';
import { SessionState, ContentType } from '@baudagain/shared';
import type { Door } from '../doors/Door.js';
import type { MenuContent } from '@baudagain/shared';
import type { DoorSessionRepository } from '../db/repositories/DoorSessionRepository.js';

export interface DoorHandlerDependencies extends HandlerDependencies {
  doorSessionRepository?: DoorSessionRepository;
}

export class DoorHandler implements CommandHandler {
  private doors: Map<string, Door> = new Map();
  
  constructor(private deps: DoorHandlerDependencies) {}
  
  /**
   * Register a door game
   */
  registerDoor(door: Door): void {
    this.doors.set(door.id, door);
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
      return '\r\nReturning to main menu...\r\n\r\n';
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
    
    // Enter the door
    try {
      const output = await door.enter(session);
      
      // If resuming, add a message
      if (savedSession) {
        return '\r\n\x1b[33m[Resuming saved game...]\x1b[0m\r\n\r\n' + output;
      }
      
      return output;
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
      
      return output;
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
      } catch (error) {
        console.error(`Error exiting door ${door.id}:`, error);
        exitMessage = '\r\nExiting door game...\r\n\r\n';
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
   * Show the door games menu
   */
  private showDoorMenu(message?: string): string {
    let output = message || '';
    
    output += '\r\n';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += '║                   DOOR GAMES                          ║\r\n';
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    
    if (this.doors.size === 0) {
      output += '║  No door games available                              ║\r\n';
    } else {
      let index = 1;
      for (const door of this.doors.values()) {
        const line = `║  ${index}. ${door.name.padEnd(48)}║\r\n`;
        output += line;
        const descLine = `║     ${door.description.padEnd(47)}║\r\n`;
        output += descLine;
        index++;
      }
    }
    
    output += '║                                                       ║\r\n';
    output += '║  Q. Return to Main Menu                               ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nSelect a door (or Q to quit): ';
    
    return output;
  }
}
