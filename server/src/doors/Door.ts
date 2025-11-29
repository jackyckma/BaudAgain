/**
 * Door Interface
 * 
 * Defines the contract for door games in the BBS.
 * Door games are interactive programs that users can enter from the main menu.
 */

import type { Session } from '@baudagain/shared';

export interface Door {
  /**
   * Unique identifier for the door
   */
  id: string;
  
  /**
   * Display name of the door
   */
  name: string;
  
  /**
   * Brief description shown in the door menu
   */
  description: string;
  
  /**
   * Enter the door game
   * Called when a user first enters the door
   * 
   * @param session - The user's session
   * @returns The initial output to display
   */
  enter(session: Session): Promise<string>;
  
  /**
   * Process user input within the door
   * Called for each command the user types while in the door
   * 
   * @param input - The user's input
   * @param session - The user's session
   * @returns The response output to display
   */
  processInput(input: string, session: Session): Promise<string>;
  
  /**
   * Exit the door game
   * Called when the user leaves the door
   * 
   * @param session - The user's session
   * @returns The exit message to display
   */
  exit(session: Session): Promise<string>;
}
