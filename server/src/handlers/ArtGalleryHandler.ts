/**
 * Art Gallery Handler
 * 
 * Handles art gallery browsing and viewing.
 * Displays list of saved art pieces and allows viewing individual pieces.
 */

import type { CommandHandler } from '../core/CommandHandler.js';
import type { HandlerDependencies } from './HandlerDependencies.js';
import type { Session, MessageContent } from '@baudagain/shared';
import { SessionState, ContentType } from '@baudagain/shared';
import type { ArtGalleryRepository } from '../db/repositories/ArtGalleryRepository.js';

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
  
  constructor(private deps: ArtGalleryHandlerDependencies) {}
  
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
    
    let output = '\r\n\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m\r\n';
    output += '\x1b[36m║\x1b[0m                    \x1b[1;33mANSI ART GALLERY\x1b[0m                    \x1b[36m║\x1b[0m\r\n';
    output += '\x1b[36m╠══════════════════════════════════════════════════════════════╣\x1b[0m\r\n';
    
    if (artPieces.length === 0) {
      output += '\x1b[36m║\x1b[0m                                                              \x1b[36m║\x1b[0m\r\n';
      output += '\x1b[36m║\x1b[0m  \x1b[33mNo art pieces in the gallery yet.\x1b[0m                       \x1b[36m║\x1b[0m\r\n';
      output += '\x1b[36m║\x1b[0m  Visit the Art Studio door game to create some!            \x1b[36m║\x1b[0m\r\n';
      output += '\x1b[36m║\x1b[0m                                                              \x1b[36m║\x1b[0m\r\n';
    } else {
      output += '\x1b[36m║\x1b[0m                                                              \x1b[36m║\x1b[0m\r\n';
      
      artPieces.forEach((art, index) => {
        const num = offset + index + 1;
        const title = art.title.substring(0, 30).padEnd(30);
        const author = (art.authorHandle || 'Unknown').substring(0, 15).padEnd(15);
        const date = art.createdAt.toLocaleDateString().padEnd(10);
        
        output += `\x1b[36m║\x1b[0m  \x1b[1;33m${num.toString().padStart(2)}.\x1b[0m ${title} \x1b[90m${author} ${date}\x1b[0m  \x1b[36m║\x1b[0m\r\n`;
      });
      
      output += '\x1b[36m║\x1b[0m                                                              \x1b[36m║\x1b[0m\r\n';
    }
    
    output += '\x1b[36m╠══════════════════════════════════════════════════════════════╣\x1b[0m\r\n';
    output += `\x1b[36m║\x1b[0m  Page ${page + 1} of ${totalPages || 1}                                              \x1b[36m║\x1b[0m\r\n`;
    output += '\x1b[36m╠══════════════════════════════════════════════════════════════╣\x1b[0m\r\n';
    output += '\x1b[36m║\x1b[0m  \x1b[1;32m[#]\x1b[0m View art piece    \x1b[1;32m[N]\x1b[0m Next page                  \x1b[36m║\x1b[0m\r\n';
    output += '\x1b[36m║\x1b[0m  \x1b[1;32m[P]\x1b[0m Previous page     \x1b[1;32m[Q]\x1b[0m Return to main menu        \x1b[36m║\x1b[0m\r\n';
    output += '\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m\r\n';
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
      
      const messageContent: MessageContent = {
        type: ContentType.MESSAGE,
        text: '\r\n\x1b[33mReturning to main menu...\x1b[0m\r\n',
        style: 'info',
      };
      
      return this.deps.renderer.render(messageContent);
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
      const index = num - offset - 1;
      
      if (index >= 0 && index < artPieces.length) {
        return this.displayArtPiece(session, artPieces[index].id);
      }
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
    
    let output = '\r\n\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m\r\n';
    output += `\x1b[36m║\x1b[0m  \x1b[1;33m${art.title.substring(0, 56).padEnd(56)}\x1b[0m  \x1b[36m║\x1b[0m\r\n`;
    output += `\x1b[36m║\x1b[0m  \x1b[90mBy: ${(art.authorHandle || 'Unknown').substring(0, 52).padEnd(52)}\x1b[0m  \x1b[36m║\x1b[0m\r\n`;
    
    if (art.description) {
      output += `\x1b[36m║\x1b[0m  \x1b[90m${art.description.substring(0, 56).padEnd(56)}\x1b[0m  \x1b[36m║\x1b[0m\r\n`;
    }
    
    output += '\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m\r\n\r\n';
    
    // Display the art content
    output += art.artContent + '\r\n\r\n';
    
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
          ...session.data.artGallery,
          selectedArtId: artId,
        },
      },
    });
    
    return output;
  }
}
