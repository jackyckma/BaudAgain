/**
 * Art Gallery Handler
 * 
 * Handles art gallery browsing and viewing.
 * Displays list of saved art pieces and allows viewing individual pieces.
 */

import type { CommandHandler } from '../core/CommandHandler.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import type { Session, MessageContent } from '@baudagain/shared';
import { SessionState, ContentType, TERMINAL_WIDTH } from '@baudagain/shared';
import type { ArtGalleryRepository } from '../db/repositories/ArtGalleryRepository.js';
import { ANSIWidthCalculator } from '../ansi/ANSIWidthCalculator.js';

export interface ArtGalleryHandlerDependencies extends HandlerDependencies {
  artGalleryRepository: ArtGalleryRepository;
}

interface ArtGalleryFlowState {
  viewing: boolean;
  currentPage: number;
  selectedArtId?: string;
}

export class ArtGalleryHandler implements CommandHandler {
  private readonly ITEMS_PER_PAGE = 10;
  private readonly BOX_WIDTH: number;
  
  constructor(private deps: ArtGalleryHandlerDependencies) {
    this.BOX_WIDTH = (TERMINAL_WIDTH || 80) - 2;
  }
  
  canHandle(command: string, session: Session): boolean {
    // Handle 'A' command from main menu or when in art gallery flow
    const upperCommand = command.toUpperCase();
    
    // Check if we're in art gallery flow
    if (session.data.artGallery?.viewing) {
      return true;
    }
    
    // Check if command is 'A' for Art Gallery from main menu
    return upperCommand === 'A' && 
           (session.state === SessionState.AUTHENTICATED || 
            session.state === SessionState.IN_MENU);
  }
  
  async handle(command: string, session: Session): Promise<string> {
    try {
      const upperCommand = command.toUpperCase();
      
      // If we're in art gallery flow
      if (session.data.artGallery?.viewing) {
        return this.handleArtGalleryInput(command, session);
      }
      
      // Starting art gallery flow
      if (upperCommand === 'A') {
        return this.startArtGallery(session);
      }
      
      return '';
    } catch (error) {
      console.error('ArtGalleryHandler error:', error);
      throw error;
    }
  }
  
  /**
   * Helper to create borders
   */
  private getBorders() {
    const width = this.BOX_WIDTH;
    const cyan = '\x1b[36m';
    const reset = '\x1b[0m';
    
    return {
      top: cyan + '╔' + '═'.repeat(width) + '╗' + reset + '\r\n',
      mid: cyan + '╠' + '═'.repeat(width) + '╣' + reset + '\r\n',
      bot: cyan + '╚' + '═'.repeat(width) + '╝' + reset + '\r\n',
      empty: cyan + '║' + reset + ' '.repeat(width) + cyan + '║' + reset + '\r\n',
      line: (text: string) => {
        // Calculate visual width (strips ANSI codes, handles emojis correctly)
        const visualWidth = ANSIWidthCalculator.calculate(text);
        // Calculate needed padding
        const paddingNeeded = Math.max(0, width - visualWidth);
        const padding = ' '.repeat(paddingNeeded);
        return cyan + '║' + reset + text + padding + cyan + '║' + reset + '\r\n';
      },
      center: (text: string) => {
        const visualWidth = ANSIWidthCalculator.calculate(text);
        const totalPadding = Math.max(0, width - visualWidth);
        const left = Math.floor(totalPadding / 2);
        const right = totalPadding - left;
        return cyan + '║' + reset + ' '.repeat(left) + text + ' '.repeat(right) + cyan + '║' + reset + '\r\n';
      }
    };
  }
  
  /**
   * Start the art gallery flow
   */
  private startArtGallery(session: Session): string {
    const galleryState: ArtGalleryFlowState = {
      viewing: true,
      currentPage: 0,
    };
    
    this.deps.sessionManager.updateSession(session.id, {
      state: SessionState.IN_MENU,
      data: {
        ...session.data,
        artGallery: galleryState,
      },
    });
    
    return this.displayArtGalleryList(session, 0);
  }
  
  /**
   * Display the art gallery list
   */
  private displayArtGalleryList(session: Session, page: number): string {
    const offset = page * this.ITEMS_PER_PAGE;
    const artPieces = this.deps.artGalleryRepository.getAllArtPieces(this.ITEMS_PER_PAGE, offset);
    const totalCount = this.deps.artGalleryRepository.getArtPieceCount();
    const totalPages = Math.ceil(totalCount / this.ITEMS_PER_PAGE);
    
    const b = this.getBorders();
    let output = '\r\n';
    output += b.top;
    output += b.center('\x1b[1;33mANSI ART GALLERY\x1b[0m');
    output += b.mid;
    
    if (artPieces.length === 0) {
      output += b.empty;
      output += b.center('\x1b[33mNo art pieces in the gallery yet.\x1b[0m');
      output += b.center('Visit the Art Studio door game to create some!');
      output += b.empty;
    } else {
      output += b.empty;
      
      artPieces.forEach((art, index) => {
        const num = offset + index + 1;
        const title = art.title.substring(0, 30).padEnd(30);
        const author = (art.authorHandle || 'Unknown').substring(0, 15).padEnd(15);
        const date = art.createdAt.toLocaleDateString().padEnd(10);
        
        const line = `  \x1b[1;33m${num.toString().padStart(2)}.\x1b[0m ${title} \x1b[90m${author} ${date}\x1b[0m  `;
        output += b.line(line);
      });
      
      output += b.empty;
    }
    
    output += b.mid;
    output += b.line(`  Page ${page + 1} of ${totalPages || 1}`);
    output += b.mid;
    output += b.line('  \x1b[1;32m[#]\x1b[0m View art piece    \x1b[1;32m[N]\x1b[0m Next page');
    output += b.line('  \x1b[1;32m[P]\x1b[0m Previous page     \x1b[1;32m[Q]\x1b[0m Return to main menu');
    output += b.bot;
    output += '\r\nCommand: ';
    
    return output;
  }
  
  /**
   * Handle input during art gallery flow
   */
  private handleArtGalleryInput(input: string, session: Session): string {
    const upperInput = input.toUpperCase();
    const galleryState = session.data.artGallery as ArtGalleryFlowState;
    
    // Quit
    if (upperInput === 'Q') {
      this.deps.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          artGallery: undefined,
        },
      });
      
      // Return to menu immediately without requiring extra Enter
      const menuContent = {
        type: ContentType.MENU as const,
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
    
    // Next page
    if (upperInput === 'N') {
      const totalCount = this.deps.artGalleryRepository.getArtPieceCount();
      const totalPages = Math.ceil(totalCount / this.ITEMS_PER_PAGE);
      const nextPage = galleryState.currentPage + 1;
      
      if (nextPage < totalPages) {
        this.deps.sessionManager.updateSession(session.id, {
          data: {
            ...session.data,
            artGallery: {
              ...galleryState,
              currentPage: nextPage,
            },
          },
        });
        return this.displayArtGalleryList(session, nextPage);
      } else {
        return '\r\n\x1b[33mAlready on last page.\x1b[0m\r\n\r\n' + 
               this.displayArtGalleryList(session, galleryState.currentPage);
      }
    }
    
    // Previous page
    if (upperInput === 'P') {
      const prevPage = galleryState.currentPage - 1;
      
      if (prevPage >= 0) {
        this.deps.sessionManager.updateSession(session.id, {
          data: {
            ...session.data,
            artGallery: {
              ...galleryState,
              currentPage: prevPage,
            },
          },
        });
        return this.displayArtGalleryList(session, prevPage);
      } else {
        return '\r\n\x1b[33mAlready on first page.\x1b[0m\r\n\r\n' + 
               this.displayArtGalleryList(session, galleryState.currentPage);
      }
    }
    
    // View art piece by number
    const num = parseInt(input);
    if (!isNaN(num) && num > 0) {
      const offset = galleryState.currentPage * this.ITEMS_PER_PAGE;
      const artPieces = this.deps.artGalleryRepository.getAllArtPieces(this.ITEMS_PER_PAGE, offset);
      // Calculate index relative to current page list, not total offset
      // The list is numbered offset+1, offset+2, etc.
      // User enters (offset + i + 1)
      // So local index i = input - offset - 1
      const index = num - offset - 1;
      
      if (index >= 0 && index < artPieces.length) {
        return this.displayArtPiece(session, artPieces[index].id);
      }
    }
    
    // Handle return from viewing art piece (any key)
    if (galleryState.selectedArtId) {
      // Clear selected art ID
      this.deps.sessionManager.updateSession(session.id, {
        data: {
          ...session.data,
          artGallery: {
            ...galleryState,
            selectedArtId: undefined,
          },
        },
      });
      
      return this.displayArtGalleryList(session, galleryState.currentPage);
    }
    
    return '\r\n\x1b[31mInvalid command.\x1b[0m\r\n\r\n' + 
           this.displayArtGalleryList(session, galleryState.currentPage);
  }
  
  /**
   * Display a single art piece
   */
  private displayArtPiece(session: Session, artId: string): string {
    const art = this.deps.artGalleryRepository.getArtPiece(artId);
    
    if (!art) {
      return '\r\n\x1b[31mArt piece not found.\x1b[0m\r\n\r\n' + 
             this.displayArtGalleryList(session, session.data.artGallery?.currentPage || 0);
    }
    
    const b = this.getBorders();
    let output = '\r\n';
    output += b.top;
    
    // Title with possible icon
    output += b.center(`\x1b[1;33m${art.title}\x1b[0m`);
    
    output += b.center(`\x1b[90mBy: ${art.authorHandle || 'Unknown'}\x1b[0m`);
    
    if (art.description) {
      output += b.center(`\x1b[90m${art.description}\x1b[0m`);
    }
    
    output += b.bot;
    output += '\r\n';
    
    // Display the art content
    // Ensure line endings are correct (\r\n) for raw ANSI art
    const normalizedContent = art.artContent.replace(/\r?\n/g, '\r\n');
    
    // Calculate max width in the content to see if it needs truncation
    const lines = normalizedContent.split('\r\n');
    const maxWidth = this.BOX_WIDTH;
    
    // Process each line to ensure it doesn't break the terminal layout
    const processedLines = lines.map(line => {
      const visualWidth = ANSIWidthCalculator.calculate(line);
      if (visualWidth > maxWidth) {
        // If line is too wide, we might need to let it wrap naturally or truncate
        // For art, wrapping usually breaks the image, so we let it overflow if it must,
        // but ideally art should be authored for 80 columns.
        // However, to prevent it from messing up the 'Press Enter' prompt at the bottom,
        // we ensure it ends with reset code.
        return line + '\x1b[0m';
      }
      return line;
    });
    
    output += processedLines.join('\r\n') + '\r\n\r\n';
    
    output += '\x1b[90mCreated: ' + art.createdAt.toLocaleString() + '\x1b[0m\r\n';
    if (art.style) {
      output += '\x1b[90mStyle: ' + art.style + '\x1b[0m\r\n';
    }
    
    output += '\r\n\x1b[1;32mPress Enter to return to gallery...\x1b[0m ';
    
    // Update state to show we're viewing a specific piece
    this.deps.sessionManager.updateSession(session.id, {
      data: {
        ...session.data,
        artGallery: {
          ...(session.data.artGallery as ArtGalleryFlowState),
          selectedArtId: artId,
        },
      },
    });
    
    return output;
  }
}
