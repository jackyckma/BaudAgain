/**
 * Message Handler
 * 
 * Handles message base navigation, reading, and posting.
 */

import type { CommandHandler } from '../core/CommandHandler.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import type { Session } from '@baudagain/shared';
import { SessionState, ContentType } from '@baudagain/shared';
import type { MessageService } from '../services/MessageService.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';
import type { Message } from '../db/repositories/MessageRepository.js';

interface MessageFlowState {
  inMessageBase?: boolean;
  currentBaseId?: string;
  readingMessage?: boolean;
  currentMessageId?: string;
  postingMessage?: boolean;
  postStep?: 'subject' | 'body';
  draftSubject?: string;
}

export interface MessageHandlerDependencies extends HandlerDependencies {
  messageService: MessageService;
}

export class MessageHandler implements CommandHandler {
  constructor(private deps: MessageHandlerDependencies) {}
  
  /**
   * Check if this handler can handle the command
   */
  canHandle(command: string, session: Session): boolean {
    // Handle if user is in message base flow
    if (session.data.message?.inMessageBase) {
      return true;
    }
    
    // Handle if user selects message bases from menu
    if (command.toUpperCase() === 'M' && 
        (session.state === SessionState.IN_MENU || session.state === SessionState.AUTHENTICATED)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle the command
   */
  async handle(command: string, session: Session): Promise<string> {
    const cmd = command.toUpperCase();
    
    // Initialize message state if needed
    if (!session.data.message) {
      session.data.message = {};
    }
    
    const messageState = session.data.message as MessageFlowState;
    
    // Handle posting flow
    if (messageState.postingMessage) {
      return this.handlePostingFlow(command, session, messageState);
    }
    
    // Handle reading message
    if (messageState.readingMessage && messageState.currentMessageId) {
      return this.handleReadingMessage(command, session, messageState);
    }
    
    // Handle message base navigation
    if (messageState.inMessageBase && messageState.currentBaseId) {
      return this.handleMessageBaseCommands(command, session, messageState);
    }
    
    // Show message base list
    if (cmd === 'M' || !messageState.inMessageBase) {
      return this.showMessageBaseList(session);
    }
    
    return 'Unknown command in message handler.\r\n';
  }
  
  /**
   * Show list of message bases
   */
  private showMessageBaseList(session: Session): string {
    const userAccessLevel = session.userId ? 10 : 0; // TODO: Get actual access level
    const bases = this.deps.messageService.getAccessibleMessageBases(userAccessLevel);
    
    let output = '\r\n';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += '║                  MESSAGE BASES                        ║\r\n';
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    
    if (bases.length === 0) {
      output += '║  No message bases available                           ║\r\n';
    } else {
      bases.forEach((base, index) => {
        const num = (index + 1).toString().padEnd(2);
        const name = base.name.padEnd(30).substring(0, 30);
        const count = `(${base.postCount})`.padStart(6);
        output += `║  ${num}. ${name} ${count}           ║\r\n`;
      });
    }
    
    output += '║                                                       ║\r\n';
    output += '║  Q. Return to Main Menu                               ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nSelect a message base (or Q to quit): ';
    
    // Set state
    const messageState = session.data.message as MessageFlowState;
    messageState.inMessageBase = false;
    
    return output;
  }
  
  /**
   * Handle message base commands
   */
  private async handleMessageBaseCommands(command: string, session: Session, messageState: MessageFlowState): Promise<string> {
    const cmd = command.toUpperCase();
    
    // Return to message base list
    if (cmd === 'Q' || cmd === 'QUIT') {
      messageState.inMessageBase = false;
      messageState.currentBaseId = undefined;
      return this.showMessageBaseList(session);
    }
    
    // Post new message
    if (cmd === 'P' || cmd === 'POST') {
      return await this.startPostingMessage(session, messageState);
    }
    
    // Read message by number
    const messageNum = parseInt(cmd, 10);
    if (!isNaN(messageNum) && messageNum > 0) {
      return this.readMessage(messageNum, session, messageState);
    }
    
    // Show message list again
    return this.showMessageList(session, messageState);
  }
  
  /**
   * Show messages in current base
   */
  private showMessageList(session: Session, messageState: MessageFlowState): string {
    if (!messageState.currentBaseId) {
      return this.showMessageBaseList(session);
    }
    
    const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
    if (!base) {
      messageState.inMessageBase = false;
      messageState.currentBaseId = undefined;
      return '\r\nMessage base not found.\r\n\r\n' + this.showMessageBaseList(session);
    }
    
    const messages = this.deps.messageService.getMessages(messageState.currentBaseId, 20);
    
    let output = '\r\n';
    output += `╔═══════════════════════════════════════════════════════╗\r\n`;
    output += `║  ${base.name.padEnd(52)}║\r\n`;
    output += `╠═══════════════════════════════════════════════════════╣\r\n`;
    
    if (messages.length === 0) {
      output += '║  No messages yet. Be the first to post!              ║\r\n';
    } else {
      messages.forEach((msg, index) => {
        const num = (index + 1).toString().padEnd(3);
        const subject = msg.subject.padEnd(35).substring(0, 35);
        const author = msg.authorHandle?.padEnd(12).substring(0, 12) || 'Unknown';
        output += `║ ${num} ${subject} ${author} ║\r\n`;
      });
    }
    
    output += '║                                                       ║\r\n';
    output += '║  [#] Read message  [P] Post  [Q] Back                 ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nCommand: ';
    
    return output;
  }
  
  /**
   * Read a specific message
   */
  private readMessage(messageNum: number, session: Session, messageState: MessageFlowState): string {
    if (!messageState.currentBaseId) {
      return '\r\nError: No message base selected.\r\n';
    }
    
    const messages = this.deps.messageService.getMessages(messageState.currentBaseId, 20);
    
    if (messageNum < 1 || messageNum > messages.length) {
      return '\r\nInvalid message number.\r\n\r\n' + this.showMessageList(session, messageState);
    }
    
    const message = messages[messageNum - 1];
    
    messageState.readingMessage = true;
    messageState.currentMessageId = message.id;
    
    let output = '\r\n';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += `║ From: ${message.authorHandle?.padEnd(47) || 'Unknown'.padEnd(47)}║\r\n`;
    output += `║ Subject: ${message.subject.padEnd(44).substring(0, 44)}║\r\n`;
    output += `║ Date: ${message.createdAt.toLocaleString().padEnd(47)}║\r\n`;
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    
    // Word wrap the body
    const lines = this.wordWrap(message.body, 53);
    lines.forEach(line => {
      output += `║ ${line.padEnd(53)}║\r\n`;
    });
    
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nPress Enter to continue: ';
    
    return output;
  }
  
  /**
   * Handle reading message state
   */
  private handleReadingMessage(command: string, session: Session, messageState: MessageFlowState): string {
    messageState.readingMessage = false;
    messageState.currentMessageId = undefined;
    
    return this.showMessageList(session, messageState);
  }
  
  /**
   * Start posting a new message
   */
  private async startPostingMessage(session: Session, messageState: MessageFlowState): Promise<string> {
    if (!session.userId) {
      return '\r\nYou must be logged in to post messages.\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\nError: No message base selected.\r\n';
    }
    
    const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
    if (!base) {
      return '\r\nError: Message base not found.\r\n';
    }
    
    // Check write access
    const canWrite = await this.deps.messageService.canUserWriteBase(session.userId, messageState.currentBaseId);
    if (!canWrite) {
      return '\r\nYou do not have permission to post in this message base.\r\n\r\n' +
             this.showMessageList(session, messageState);
    }
    
    messageState.postingMessage = true;
    messageState.postStep = 'subject';
    
    return '\r\n╔═══════════════════════════════════════════════════════╗\r\n' +
           '║                  POST NEW MESSAGE                     ║\r\n' +
           '╚═══════════════════════════════════════════════════════╝\r\n' +
           '\r\nEnter subject (or CANCEL to abort): ';
  }
  
  /**
   * Handle posting flow
   */
  private handlePostingFlow(command: string, session: Session, messageState: MessageFlowState): string {
    if (command.toUpperCase() === 'CANCEL') {
      messageState.postingMessage = false;
      messageState.postStep = undefined;
      messageState.draftSubject = undefined;
      return '\r\nPost cancelled.\r\n\r\n' + this.showMessageList(session, messageState);
    }
    
    if (messageState.postStep === 'subject') {
      if (!command.trim()) {
        return '\r\nSubject cannot be empty.\r\nEnter subject (or CANCEL to abort): ';
      }
      
      messageState.draftSubject = command.trim();
      messageState.postStep = 'body';
      
      return '\r\nEnter message body (or CANCEL to abort): ';
    }
    
    if (messageState.postStep === 'body') {
      if (!command.trim()) {
        return '\r\nMessage body cannot be empty.\r\nEnter message body (or CANCEL to abort): ';
      }
      
      // Post the message
      try {
        this.deps.messageService.postMessage({
          baseId: messageState.currentBaseId!,
          userId: session.userId!,
          subject: messageState.draftSubject!,
          body: command.trim()
        });
        
        messageState.postingMessage = false;
        messageState.postStep = undefined;
        messageState.draftSubject = undefined;
        
        return '\r\n\x1b[32mMessage posted successfully!\x1b[0m\r\n\r\n' + 
               this.showMessageList(session, messageState);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return `\r\n\x1b[31mError posting message: ${errorMsg}\x1b[0m\r\n\r\n` +
               this.showMessageList(session, messageState);
      }
    }
    
    return '\r\nUnknown posting state.\r\n';
  }
  
  /**
   * Word wrap text to fit width
   */
  private wordWrap(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }
}
