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
  showingBaseList?: boolean;
  inMessageBase?: boolean;
  currentBaseId?: string;
  readingMessage?: boolean;
  currentMessageId?: string;
  postingMessage?: boolean;
  postStep?: 'subject' | 'body';
  draftSubject?: string;
  viewingSummary?: boolean;
  confirmingSummary?: boolean;
  viewingStarters?: boolean;
  cachedStarters?: any[]; // Cache for conversation starters
  startersGeneratedAt?: Date;
  viewingCatchUp?: boolean;
  confirmingCatchUp?: boolean;
}

export interface MessageHandlerDependencies extends HandlerDependencies {
  messageService: MessageService;
  messageSummarizer?: any; // MessageSummarizer - optional for now
  conversationStarter?: any; // ConversationStarter - optional for now
  userService?: any; // UserService - optional for now
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
    
    // Handle viewing summary
    if (messageState.viewingSummary) {
      return this.handleViewingSummary(command, session, messageState);
    }
    
    // Handle confirming summary generation
    if (messageState.confirmingSummary) {
      return await this.handleConfirmingSummary(command, session, messageState);
    }
    
    // Handle viewing conversation starters
    if (messageState.viewingStarters) {
      return await this.handleViewingStarters(command, session, messageState);
    }
    
    // Handle viewing catch-me-up summary
    if (messageState.viewingCatchUp) {
      return this.handleViewingCatchUp(command, session, messageState);
    }
    
    // Handle confirming catch-me-up generation
    if (messageState.confirmingCatchUp) {
      return await this.handleConfirmingCatchUp(command, session, messageState);
    }
    
    // Handle message base navigation (inside a base)
    if (messageState.inMessageBase && messageState.currentBaseId) {
      return this.handleMessageBaseCommands(command, session, messageState);
    }
    
    // Show message base list (first time or after 'M' command)
    if (cmd === 'M') {
      messageState.inMessageBase = false;
      messageState.currentBaseId = undefined;
      messageState.showingBaseList = true;
      return this.showMessageBaseList(session);
    }
    
    // Handle message base selection from list
    if (messageState.showingBaseList) {
      return this.handleMessageBaseSelection(command, session, messageState);
    }
    
    return 'Unknown command in message handler.\r\n';
  }
  
  /**
   * Handle message base selection from list
   */
  private handleMessageBaseSelection(command: string, session: Session, messageState: MessageFlowState): string {
    const cmd = command.toUpperCase();
    
    // Return to main menu
    if (cmd === 'Q' || cmd === 'QUIT') {
      messageState.showingBaseList = false;
      messageState.inMessageBase = false;
      messageState.currentBaseId = undefined;
      session.state = SessionState.IN_MENU;
      return '\r\nReturning to main menu...\r\n';
    }
    
    // Select message base by number
    const baseNum = parseInt(cmd, 10);
    if (!isNaN(baseNum) && baseNum > 0) {
      const userAccessLevel = session.userId ? 10 : 0; // TODO: Get actual access level
      const bases = this.deps.messageService.getAccessibleMessageBases(userAccessLevel);
      
      if (baseNum <= bases.length) {
        const selectedBase = bases[baseNum - 1];
        messageState.showingBaseList = false;
        messageState.inMessageBase = true;
        messageState.currentBaseId = selectedBase.id;
        return this.showMessageList(session, messageState);
      }
    }
    
    // Invalid selection
    return '\r\nInvalid selection.\r\n\r\n' + this.showMessageBaseList(session);
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
    
    // Summarize thread
    if (cmd === 'S' || cmd === 'SUMMARIZE') {
      return this.startSummarizeThread(session, messageState);
    }
    
    // View conversation starters
    if (cmd === 'C' || cmd === 'STARTERS') {
      return await this.showConversationStarters(session, messageState);
    }
    
    // Catch me up - show unread messages summary
    if (cmd === 'U' || cmd === 'CATCHUP') {
      return await this.showCatchMeUpSummary(session, messageState);
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
        const author = (msg.authorHandle || 'Unknown').padEnd(12).substring(0, 12);
        output += `║ ${num} ${subject} ${author} ║\r\n`;
      });
    }
    
    // Add conversation starters section if available
    if (this.deps.conversationStarter && messages.length > 0) {
      output += '║                                                       ║\r\n';
      output += '║  \x1b[36m💡 Need inspiration? Try [C] for conversation\x1b[0m     ║\r\n';
      output += '║  \x1b[36m   starters!\x1b[0m                                      ║\r\n';
    }
    
    output += '║                                                       ║\r\n';
    
    // Update command menu based on available features
    if (this.deps.conversationStarter && messages.length > 0) {
      output += '║  [#] Read  [P] Post  [C] Starters                     ║\r\n';
      output += '║  [U] Catch Me Up  [S] Summarize  [Q] Back            ║\r\n';
    } else {
      output += '║  [#] Read  [P] Post  [U] Catch Me Up                  ║\r\n';
      output += '║  [S] Summarize  [Q] Back                              ║\r\n';
    }
    
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
    output += `║ From: ${(message.authorHandle || 'Unknown').padEnd(47)}║\r\n`;
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
      return '\r\n\x1b[33m⚠ You must be logged in to post messages.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\n\x1b[31m✗ Error: No message base selected.\x1b[0m\r\n';
    }
    
    const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
    if (!base) {
      return '\r\n\x1b[31m✗ Error: Message base not found. It may have been deleted.\x1b[0m\r\n';
    }
    
    // Check write access
    const canWrite = await this.deps.messageService.canUserWriteBase(session.userId, messageState.currentBaseId);
    if (!canWrite) {
      return '\r\n\x1b[33m⚠ You do not have permission to post in this message base.\x1b[0m\r\n\r\n' +
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
      return '\r\n\x1b[33mPost cancelled.\x1b[0m\r\n\r\n' + this.showMessageList(session, messageState);
    }
    
    if (messageState.postStep === 'subject') {
      if (!command.trim()) {
        return '\r\n\x1b[33m⚠ Subject cannot be empty.\x1b[0m\r\nEnter subject (or CANCEL to abort): ';
      }
      
      messageState.draftSubject = command.trim();
      messageState.postStep = 'body';
      
      return '\r\nEnter message body (or CANCEL to abort): ';
    }
    
    if (messageState.postStep === 'body') {
      if (!command.trim()) {
        return '\r\n\x1b[33m⚠ Message body cannot be empty.\x1b[0m\r\nEnter message body (or CANCEL to abort): ';
      }
      
      // Post the message
      try {
        // Show loading indicator
        const posting = '\r\n⏳ Posting message...\r\n';
        
        this.deps.messageService.postMessage({
          baseId: messageState.currentBaseId!,
          userId: session.userId!,
          subject: messageState.draftSubject!,
          body: command.trim()
        });
        
        messageState.postingMessage = false;
        messageState.postStep = undefined;
        messageState.draftSubject = undefined;
        
        return posting + '\r\n\x1b[32m✓ Message posted successfully!\x1b[0m\r\n\r\n' + 
               this.showMessageList(session, messageState);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        // Provide more helpful error messages
        let userMessage = 'Error posting message';
        if (errorMsg.includes('rate limit') || errorMsg.includes('Rate limit')) {
          userMessage = 'You are posting too quickly. Please wait a moment and try again.';
        } else if (errorMsg.includes('permission') || errorMsg.includes('access')) {
          userMessage = 'You do not have permission to post in this message base.';
        } else if (errorMsg.includes('not found')) {
          userMessage = 'Message base not found. It may have been deleted.';
        } else {
          userMessage = `Error posting message: ${errorMsg}`;
        }
        
        return `\r\n\x1b[31m✗ ${userMessage}\x1b[0m\r\n\r\n` +
               this.showMessageList(session, messageState);
      }
    }
    
    return '\r\nUnknown posting state.\r\n';
  }
  
  /**
   * Show conversation starters
   */
  private async showConversationStarters(session: Session, messageState: MessageFlowState): Promise<string> {
    if (!this.deps.conversationStarter) {
      return '\r\n\x1b[33m⚠ Conversation starters are not available.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\n\x1b[31m✗ Error: No message base selected.\x1b[0m\r\n';
    }
    
    const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
    if (!base) {
      return '\r\n\x1b[31m✗ Error: Message base not found.\x1b[0m\r\n';
    }
    
    // Check cache first (cache for 1 hour)
    const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
    const now = new Date();
    
    if (messageState.cachedStarters && 
        messageState.startersGeneratedAt &&
        (now.getTime() - messageState.startersGeneratedAt.getTime()) < CACHE_DURATION_MS) {
      // Use cached starters
      messageState.viewingStarters = true;
      return this.displayConversationStarters(messageState.cachedStarters, session, messageState);
    }
    
    // Generate new starters
    let output = '\r\n\x1b[36m⏳ Generating conversation starters...\x1b[0m\r\n';
    output += '\x1b[90mThis may take a few seconds...\x1b[0m\r\n\r\n';
    
    try {
      const messages = this.deps.messageService.getMessages(messageState.currentBaseId, 50);
      
      if (messages.length === 0) {
        return output + '\r\n\x1b[33m⚠ No messages yet. Post the first message to get started!\x1b[0m\r\n\r\n' +
               this.showMessageList(session, messageState);
      }
      
      // Generate 3 conversation starters with different styles
      const styles = ['open-ended', 'opinion', 'fun'] as const;
      const starters = [];
      const GENERATION_TIMEOUT_MS = 10000; // 10 seconds per starter
      
      for (const style of styles) {
        try {
          // Add timeout to generation
          const starterPromise = this.deps.conversationStarter.generateQuestion({
            messageBaseId: messageState.currentBaseId,
            messageBaseName: base.name,
            recentMessages: messages,
            style,
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Generation timeout')), GENERATION_TIMEOUT_MS);
          });
          
          const starter = await Promise.race([starterPromise, timeoutPromise]);
          starters.push(starter);
        } catch (error) {
          // Continue if one fails
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to generate ${style} conversation starter:`, errorMsg);
        }
      }
      
      if (starters.length === 0) {
        return output + '\r\n\x1b[33m⚠ Unable to generate conversation starters at this time.\x1b[0m\r\n\r\n' +
               this.showMessageList(session, messageState);
      }
      
      // Cache the starters
      messageState.cachedStarters = starters;
      messageState.startersGeneratedAt = now;
      messageState.viewingStarters = true;
      
      return output + this.displayConversationStarters(starters, session, messageState);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return output + 
             `\r\n\x1b[31m✗ Error generating conversation starters: ${errorMsg}\x1b[0m\r\n\r\n` +
             this.showMessageList(session, messageState);
    }
  }
  
  /**
   * Display conversation starters
   */
  private displayConversationStarters(starters: any[], session: Session, messageState: MessageFlowState): string {
    let output = '';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += '║           \x1b[36m💡 CONVERSATION STARTERS\x1b[0m                     ║\r\n';
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    output += '║                                                       ║\r\n';
    output += '║  Pick a question to start a new discussion:          ║\r\n';
    output += '║                                                       ║\r\n';
    
    starters.forEach((starter, index) => {
      const num = (index + 1).toString();
      const question = starter.question;
      
      // Word wrap the question to fit in the frame
      const lines = this.wordWrap(question, 50);
      lines.forEach((line, lineIndex) => {
        if (lineIndex === 0) {
          output += `║  \x1b[33m${num}.\x1b[0m ${line.padEnd(50)}║\r\n`;
        } else {
          output += `║     ${line.padEnd(50)}║\r\n`;
        }
      });
      
      output += '║                                                       ║\r\n';
    });
    
    output += '║  Select [1-' + starters.length + '] to use as subject, or [Q] to go back   ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nYour choice: ';
    
    return output;
  }
  
  /**
   * Handle viewing conversation starters
   */
  private async handleViewingStarters(command: string, session: Session, messageState: MessageFlowState): Promise<string> {
    const cmd = command.toUpperCase();
    
    // Go back to message list
    if (cmd === 'Q' || cmd === 'QUIT' || cmd === 'BACK') {
      messageState.viewingStarters = false;
      return this.showMessageList(session, messageState);
    }
    
    // Select a starter by number
    const starterNum = parseInt(cmd, 10);
    if (!isNaN(starterNum) && starterNum > 0 && messageState.cachedStarters) {
      if (starterNum <= messageState.cachedStarters.length) {
        const selectedStarter = messageState.cachedStarters[starterNum - 1];
        
        // Start posting flow with the selected question as subject
        messageState.viewingStarters = false;
        messageState.postingMessage = true;
        messageState.postStep = 'subject';
        messageState.draftSubject = selectedStarter.question;
        
        // Skip to body prompt since we already have the subject
        messageState.postStep = 'body';
        
        return '\r\n╔═══════════════════════════════════════════════════════╗\r\n' +
               '║                  POST NEW MESSAGE                     ║\r\n' +
               '╚═══════════════════════════════════════════════════════╝\r\n' +
               `\r\n\x1b[36mSubject:\x1b[0m ${selectedStarter.question}\r\n\r\n` +
               'Enter message body (or CANCEL to abort): ';
      }
    }
    
    // Invalid selection
    return '\r\n\x1b[33m⚠ Invalid selection.\x1b[0m\r\n\r\n' + 
           this.displayConversationStarters(messageState.cachedStarters || [], session, messageState);
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
  
  /**
   * Start summarize thread flow
   */
  private startSummarizeThread(session: Session, messageState: MessageFlowState): string {
    if (!this.deps.messageSummarizer) {
      return '\r\n\x1b[33m⚠ AI summarization is not available.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\n\x1b[31m✗ Error: No message base selected.\x1b[0m\r\n';
    }
    
    const messages = this.deps.messageService.getMessages(messageState.currentBaseId, 50);
    
    if (messages.length === 0) {
      return '\r\n\x1b[33m⚠ No messages to summarize.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    messageState.confirmingSummary = true;
    
    let output = '\r\n';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += '║              THREAD SUMMARIZATION                     ║\r\n';
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    output += '║                                                       ║\r\n';
    output += `║  Messages to analyze: ${messages.length.toString().padEnd(32)}║\r\n`;
    output += '║                                                       ║\r\n';
    output += '║  \x1b[33m⚠ Note: This uses AI and may take a few seconds\x1b[0m    ║\r\n';
    output += '║                                                       ║\r\n';
    output += '║  Generate summary? [Y/N]                              ║\r\n';
    output += '║                                                       ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nYour choice: ';
    
    return output;
  }
  
  /**
   * Handle confirming summary generation
   */
  private async handleConfirmingSummary(command: string, session: Session, messageState: MessageFlowState): Promise<string> {
    const cmd = command.toUpperCase();
    
    messageState.confirmingSummary = false;
    
    if (cmd !== 'Y' && cmd !== 'YES') {
      return '\r\n\x1b[33mSummarization cancelled.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\n\x1b[31m✗ Error: No message base selected.\x1b[0m\r\n';
    }
    
    // Show loading message
    let output = '\r\n\x1b[36m⏳ Generating summary...\x1b[0m\r\n';
    output += '\x1b[90mThis may take a few seconds...\x1b[0m\r\n\r\n';
    
    try {
      const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
      const messages = this.deps.messageService.getMessages(messageState.currentBaseId, 50);
      
      const summary = await this.deps.messageSummarizer.summarizeMessages(messages, {
        messageBaseId: messageState.currentBaseId,
        messageBaseName: base?.name || 'Message Base',
        maxMessages: 50,
      });
      
      const formatted = this.deps.messageSummarizer.formatSummary(summary, 80);
      
      messageState.viewingSummary = true;
      
      return output + formatted.framed + '\r\n\r\nPress Enter to continue: ';
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      return output + 
             `\r\n\x1b[31m✗ Error generating summary: ${errorMsg}\x1b[0m\r\n\r\n` +
             this.showMessageList(session, messageState);
    }
  }
  
  /**
   * Handle viewing summary
   */
  private handleViewingSummary(command: string, session: Session, messageState: MessageFlowState): string {
    messageState.viewingSummary = false;
    
    return this.showMessageList(session, messageState);
  }
  
  /**
   * Show catch-me-up summary
   */
  private async showCatchMeUpSummary(session: Session, messageState: MessageFlowState): Promise<string> {
    if (!this.deps.messageSummarizer) {
      return '\r\n\x1b[33m⚠ Catch-me-up summaries are not available.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\n\x1b[31m✗ Error: No message base selected.\x1b[0m\r\n';
    }
    
    if (!session.userId) {
      return '\r\n\x1b[33m⚠ You must be logged in to use catch-me-up.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
    if (!base) {
      return '\r\n\x1b[31m✗ Error: Message base not found.\x1b[0m\r\n';
    }
    
    // Get user's last login time to determine "unread" messages
    const user = await this.deps.userService?.getUserById(session.userId);
    const lastLogin = user?.lastLogin || new Date(0); // If no last login, show all messages
    
    // Get messages since last login
    const unreadMessages = this.deps.messageService.getMessagesSince(messageState.currentBaseId, lastLogin);
    
    if (unreadMessages.length === 0) {
      return '\r\n╔═══════════════════════════════════════════════════════╗\r\n' +
             '║              \x1b[36m📬 CATCH ME UP\x1b[0m                          ║\r\n' +
             '╠═══════════════════════════════════════════════════════╣\r\n' +
             '║                                                       ║\r\n' +
             '║  \x1b[32m✓ You\'re all caught up!\x1b[0m                           ║\r\n' +
             '║                                                       ║\r\n' +
             '║  No new messages since your last visit.              ║\r\n' +
             '║                                                       ║\r\n' +
             '╚═══════════════════════════════════════════════════════╝\r\n' +
             '\r\nPress Enter to continue: ';
    }
    
    messageState.confirmingCatchUp = true;
    
    let output = '\r\n';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += '║              \x1b[36m📬 CATCH ME UP\x1b[0m                          ║\r\n';
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    output += '║                                                       ║\r\n';
    output += `║  Unread messages: ${unreadMessages.length.toString().padEnd(34)}║\r\n`;
    output += `║  Since: ${lastLogin.toLocaleString().padEnd(42).substring(0, 42)}║\r\n`;
    output += '║                                                       ║\r\n';
    output += '║  \x1b[33m⚠ Note: This uses AI and may take a few seconds\x1b[0m    ║\r\n';
    output += '║                                                       ║\r\n';
    output += '║  Generate summary? [Y/N]                              ║\r\n';
    output += '║                                                       ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\nYour choice: ';
    
    return output;
  }
  
  /**
   * Handle confirming catch-me-up generation
   */
  private async handleConfirmingCatchUp(command: string, session: Session, messageState: MessageFlowState): Promise<string> {
    const cmd = command.toUpperCase();
    
    messageState.confirmingCatchUp = false;
    
    if (cmd !== 'Y' && cmd !== 'YES') {
      return '\r\n\x1b[33mCatch-me-up cancelled.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    if (!messageState.currentBaseId) {
      return '\r\n\x1b[31m✗ Error: No message base selected.\x1b[0m\r\n';
    }
    
    if (!session.userId) {
      return '\r\n\x1b[33m⚠ You must be logged in to use catch-me-up.\x1b[0m\r\n\r\n' + 
             this.showMessageList(session, messageState);
    }
    
    // Show loading message
    let output = '\r\n\x1b[36m⏳ Generating catch-me-up summary...\x1b[0m\r\n';
    output += '\x1b[90mThis may take a few seconds...\x1b[0m\r\n\r\n';
    
    try {
      const base = this.deps.messageService.getMessageBase(messageState.currentBaseId);
      
      // Get user's last login time
      const user = await this.deps.userService?.getUserById(session.userId);
      const lastLogin = user?.lastLogin || new Date(0);
      
      // Get unread messages
      const unreadMessages = this.deps.messageService.getMessagesSince(messageState.currentBaseId, lastLogin);
      
      if (unreadMessages.length === 0) {
        return output + '\r\n\x1b[32m✓ You\'re all caught up! No new messages.\x1b[0m\r\n\r\n' +
               this.showMessageList(session, messageState);
      }
      
      // Generate summary with timeout
      const SUMMARY_TIMEOUT_MS = 30000; // 30 seconds
      
      const summaryPromise = this.deps.messageSummarizer.summarizeMessages(unreadMessages, {
        messageBaseId: messageState.currentBaseId,
        messageBaseName: base?.name || 'Message Base',
        maxMessages: 50,
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Summary generation timeout')), SUMMARY_TIMEOUT_MS);
      });
      
      const summary = await Promise.race([summaryPromise, timeoutPromise]);
      
      // Format the summary with proper width
      const formatted = this.deps.messageSummarizer.formatSummary(summary, 80);
      
      messageState.viewingCatchUp = true;
      
      return output + formatted.framed + '\r\n\r\nPress Enter to continue: ';
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      let userMessage = 'Error generating catch-me-up summary';
      if (errorMsg.includes('timeout')) {
        userMessage = 'Summary generation timed out. Please try again later.';
      } else if (errorMsg.includes('rate limit')) {
        userMessage = 'AI service rate limit reached. Please try again in a few minutes.';
      } else {
        userMessage = `Error generating summary: ${errorMsg}`;
      }
      
      return output + 
             `\r\n\x1b[31m✗ ${userMessage}\x1b[0m\r\n\r\n` +
             this.showMessageList(session, messageState);
    }
  }
  
  /**
   * Handle viewing catch-me-up summary
   */
  private handleViewingCatchUp(command: string, session: Session, messageState: MessageFlowState): string {
    messageState.viewingCatchUp = false;
    
    return this.showMessageList(session, messageState);
  }
}
