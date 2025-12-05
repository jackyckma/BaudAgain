/**
 * Art Studio Door Game
 * 
 * An AI-powered ASCII art generator that allows users to create
 * custom ANSI art by describing what they want to see.
 */

import type { Door } from './Door.js';
import { TERMINAL_WIDTH } from '@baudagain/shared';
import type { Session } from '@baudagain/shared';
import type { ANSIArtGenerator, ArtStyle, ColorTheme } from '../services/ANSIArtGenerator.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { sanitizeInput } from '../utils/ValidationUtils.js';
import { ANSIRenderingService, RENDER_CONTEXTS } from '../ansi/ANSIRenderingService.js';
import type { FrameLine } from '../ansi/ANSIFrameBuilder.js';

interface ArtStudioState {
  currentArt?: {
    description: string;
    style: ArtStyle;
    colorTheme: ColorTheme;
    content: string;
    framedContent: string;
  };
  mode: 'menu' | 'description' | 'style' | 'theme' | 'generating' | 'preview' | 'save_title';
  pendingDescription?: string;
  pendingStyle?: ArtStyle;
  pendingTitle?: string;
}

export class ArtStudioDoor implements Door {
  id = 'art_studio';
  name = 'Art Studio';
  description = 'Create custom ASCII art with AI';
  private rateLimiter: RateLimiter;
  private renderingService: ANSIRenderingService;
  
  constructor(
    private artGenerator?: ANSIArtGenerator,
    private artGalleryRepository?: any
  ) {
    // 5 art generations per minute per user (AI is expensive!)
    this.rateLimiter = new RateLimiter(5, 60000);
    this.renderingService = new ANSIRenderingService();
  }
  
  /**
   * Enter the Art Studio
   */
  async enter(session: Session): Promise<string> {
    // Initialize door state
    if (!session.data.door) {
      session.data.door = {
        doorId: this.id,
        gameState: {},
        history: []
      };
    }
    
    const state: ArtStudioState = session.data.door.gameState as ArtStudioState;
    state.mode = 'menu';
    
    return this.showMainMenu(session);
  }
  
  /**
   * Process user input
   */
  async processInput(input: string, session: Session): Promise<string> {
    const sanitizedInput = sanitizeInput(input);
    
    if (!sanitizedInput) {
      return '\r\n\x1b[33mPlease enter a command.\x1b[0m\r\n\r\n' + this.showMainMenu(session);
    }
    
    if (!session.data.door) {
      return this.enter(session);
    }
    
    const state: ArtStudioState = session.data.door.gameState as ArtStudioState;
    
    // Handle based on current mode
    switch (state.mode) {
      case 'menu':
        return this.handleMenuInput(sanitizedInput, session, state);
      case 'description':
        return this.handleDescriptionInput(sanitizedInput, session, state);
      case 'style':
        return this.handleStyleInput(sanitizedInput, session, state);
      case 'theme':
        return this.handleThemeInput(sanitizedInput, session, state);
      case 'preview':
        return this.handlePreviewInput(sanitizedInput, session, state);
      case 'save_title':
        return this.handleSaveTitleInput(sanitizedInput, session, state);
      default:
        state.mode = 'menu';
        return this.showMainMenu(session);
    }
  }
  
  /**
   * Handle menu input
   */
  private async handleMenuInput(
    input: string,
    session: Session,
    state: ArtStudioState
  ): Promise<string> {
    const cmd = input.toUpperCase();
    
    switch (cmd) {
      case '1':
      case 'N':
      case 'NEW':
        // Start new art creation
        state.mode = 'description';
        state.currentArt = undefined;
        state.pendingDescription = undefined;
        state.pendingStyle = undefined;
        return this.promptForDescription();
        
      case '2':
      case 'V':
      case 'VIEW':
        // View current art
        if (!state.currentArt) {
          return '\r\n\x1b[33mNo art to view. Create some art first!\x1b[0m\r\n\r\n' +
                 this.showMainMenu(session);
        }
        state.mode = 'preview';
        return this.showArtPreview(state.currentArt);
        
      case '3':
      case 'H':
      case 'HELP':
        // Show help
        return this.showHelp(session);
        
      default:
        return '\r\n\x1b[33mInvalid selection. Please try again.\x1b[0m\r\n\r\n' +
               this.showMainMenu(session);
    }
  }
  
  /**
   * Handle description input
   */
  private async handleDescriptionInput(
    input: string,
    session: Session,
    state: ArtStudioState
  ): Promise<string> {
    if (input.toUpperCase() === 'CANCEL') {
      state.mode = 'menu';
      return '\r\n\x1b[33mCancelled.\x1b[0m\r\n\r\n' + this.showMainMenu(session);
    }
    
    // Validate description length
    if (input.length < 3) {
      return '\r\n\x1b[33mDescription too short. Please be more descriptive.\x1b[0m\r\n\r\n' +
             this.promptForDescription();
    }
    
    if (input.length > 200) {
      return '\r\n\x1b[33mDescription too long (max 200 characters).\x1b[0m\r\n\r\n' +
             this.promptForDescription();
    }
    
    // Store description and move to style selection
    state.pendingDescription = input;
    state.mode = 'style';
    return this.promptForStyle();
  }
  
  /**
   * Handle style input
   */
  private async handleStyleInput(
    input: string,
    session: Session,
    state: ArtStudioState
  ): Promise<string> {
    if (input.toUpperCase() === 'CANCEL') {
      state.mode = 'menu';
      return '\r\n\x1b[33mCancelled.\x1b[0m\r\n\r\n' + this.showMainMenu(session);
    }
    
    // Parse style selection
    const styles: ArtStyle[] = ['retro', 'cyberpunk', 'fantasy', 'minimal', 'classic'];
    let selectedStyle: ArtStyle | undefined;
    
    const cmd = input.toUpperCase();
    if (cmd === '1' || cmd === 'R' || cmd === 'RETRO') {
      selectedStyle = 'retro';
    } else if (cmd === '2' || cmd === 'C' || cmd === 'CYBERPUNK') {
      selectedStyle = 'cyberpunk';
    } else if (cmd === '3' || cmd === 'F' || cmd === 'FANTASY') {
      selectedStyle = 'fantasy';
    } else if (cmd === '4' || cmd === 'M' || cmd === 'MINIMAL') {
      selectedStyle = 'minimal';
    } else if (cmd === '5' || cmd === 'CL' || cmd === 'CLASSIC') {
      selectedStyle = 'classic';
    }
    
    if (!selectedStyle) {
      return '\r\n\x1b[33mInvalid style. Please select 1-5.\x1b[0m\r\n\r\n' +
             this.promptForStyle();
    }
    
    // Store style and move to theme selection
    state.pendingStyle = selectedStyle;
    state.mode = 'theme';
    return this.promptForTheme();
  }
  
  /**
   * Handle theme input
   */
  private async handleThemeInput(
    input: string,
    session: Session,
    state: ArtStudioState
  ): Promise<string> {
    if (input.toUpperCase() === 'CANCEL') {
      state.mode = 'menu';
      return '\r\n\x1b[33mCancelled.\x1b[0m\r\n\r\n' + this.showMainMenu(session);
    }
    
    // Parse theme selection
    let selectedTheme: ColorTheme | undefined;
    
    const cmd = input.toUpperCase();
    if (cmd === '1' || cmd === 'M' || cmd === 'MONO' || cmd === 'MONOCHROME') {
      selectedTheme = 'monochrome';
    } else if (cmd === '2' || cmd === 'C' || cmd === 'COLOR' || cmd === '16') {
      selectedTheme = '16-color';
    } else if (cmd === '3' || cmd === 'B' || cmd === 'BRIGHT') {
      selectedTheme = 'bright';
    }
    
    if (!selectedTheme) {
      return '\r\n\x1b[33mInvalid theme. Please select 1-3.\x1b[0m\r\n\r\n' +
             this.promptForTheme();
    }
    
    // Check rate limit
    if (session.userId && !this.rateLimiter.isAllowed(session.userId)) {
      const resetTime = this.rateLimiter.getResetTime(session.userId);
      state.mode = 'menu';
      return '\r\n\x1b[33m⚠️  Rate limit reached. Please wait ' + resetTime + ' seconds.\x1b[0m\r\n\r\n' +
             this.showMainMenu(session);
    }
    
    // Generate the art!
    return this.generateArt(session, state, selectedTheme);
  }
  
  /**
   * Handle preview input
   */
  private async handlePreviewInput(
    input: string,
    session: Session,
    state: ArtStudioState
  ): Promise<string> {
    const cmd = input.toUpperCase();
    
    switch (cmd) {
      case '1':
      case 'S':
      case 'SAVE':
        // Save to gallery
        if (!state.currentArt) {
          state.mode = 'menu';
          return '\r\n\x1b[33mNo art to save.\x1b[0m\r\n\r\n' + this.showMainMenu(session);
        }
        
        if (!this.artGalleryRepository) {
          return '\r\n\x1b[33m⚠️  Gallery not available.\x1b[0m\r\n\r\n' +
                 this.showArtPreview(state.currentArt);
        }
        
        if (!session.userId) {
          return '\r\n\x1b[33m⚠️  You must be logged in to save art.\x1b[0m\r\n\r\n' +
                 this.showArtPreview(state.currentArt);
        }
        
        // Prompt for title
        state.mode = 'save_title';
        return this.promptForTitle(state.currentArt.description);
        
      case '2':
      case 'R':
      case 'REGENERATE':
        // Regenerate with same settings
        if (!state.currentArt) {
          state.mode = 'menu';
          return '\r\n\x1b[33mNo art to regenerate.\x1b[0m\r\n\r\n' + this.showMainMenu(session);
        }
        
        // Check rate limit
        if (session.userId && !this.rateLimiter.isAllowed(session.userId)) {
          const resetTime = this.rateLimiter.getResetTime(session.userId);
          return '\r\n\x1b[33m⚠️  Rate limit reached. Please wait ' + resetTime + ' seconds.\x1b[0m\r\n\r\n' +
                 this.showArtPreview(state.currentArt);
        }
        
        // Regenerate
        state.pendingDescription = state.currentArt.description;
        state.pendingStyle = state.currentArt.style;
        return this.generateArt(session, state, state.currentArt.colorTheme);
        
      case '3':
      case 'M':
      case 'MENU':
        // Return to menu
        state.mode = 'menu';
        return '\r\n' + this.showMainMenu(session);
        
      default:
        return '\r\n\x1b[33mInvalid selection. Please try again.\x1b[0m\r\n\r\n' +
               this.showArtPreview(state.currentArt!);
    }
  }
  
  /**
   * Generate art with AI
   */
  private async generateArt(
    session: Session,
    state: ArtStudioState,
    theme: ColorTheme
  ): Promise<string> {
    if (!this.artGenerator) {
      state.mode = 'menu';
      return '\r\n\x1b[31m❌ Art generation is not available (AI service not configured).\x1b[0m\r\n\r\n' +
             this.showMainMenu(session);
    }
    
    if (!state.pendingDescription || !state.pendingStyle) {
      state.mode = 'menu';
      return '\r\n\x1b[31m❌ Missing description or style.\x1b[0m\r\n\r\n' +
             this.showMainMenu(session);
    }
    
    // Ensure door state exists
    if (!session.data.door) {
      session.data.door = {
        doorId: this.id,
        gameState: state,
        history: []
      };
    }
    
    // Show loading message
    const loadingContent: FrameLine[] = [
      { text: '🎨 GENERATING ART... 🎨', align: 'center', color: '\x1b[36m' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      loadingContent,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\n';
    output += '\x1b[90mDescription: ' + state.pendingDescription + '\x1b[0m\r\n';
    output += '\x1b[90mStyle: ' + state.pendingStyle + '\x1b[0m\r\n';
    output += '\x1b[90mTheme: ' + theme + '\x1b[0m\r\n';
    output += '\r\n';
    output += '\x1b[33m⏳ Please wait while the AI creates your masterpiece...\x1b[0m\r\n';
    output += '\r\n';
    
    try {
      // Generate the art
      const art = await this.artGenerator.generateFramedArt(
        {
          description: state.pendingDescription,
          style: state.pendingStyle,
          width: 60,
          height: 15,
          colorTheme: theme,
          applyColors: true,
        },
        {
          title: '🎨 ' + state.pendingDescription.substring(0, 40) + (state.pendingDescription.length > 40 ? '...' : ''),
          attribution: session.handle || 'Anonymous',
          frameWidth: TERMINAL_WIDTH,
          includeTimestamp: false,
        }
      );
      
      // Store the art
      state.currentArt = {
        description: state.pendingDescription,
        style: state.pendingStyle,
        colorTheme: theme,
        content: art.content,
        framedContent: art.framedContent || art.content,
      };
      
      // Add to history
      if (!session.data.door.history) {
        session.data.door.history = [];
      }
      session.data.door.history.push({
        description: state.pendingDescription,
        style: state.pendingStyle,
        theme: theme,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only last 5 creations in history
      if (session.data.door.history.length > 5) {
        session.data.door.history = session.data.door.history.slice(-5);
      }
      
      // Show the art
      state.mode = 'preview';
      return output + '\x1b[32m✓ Art generated successfully!\x1b[0m\r\n\r\n' +
             this.showArtPreview(state.currentArt);
      
    } catch (error) {
      console.error('Error generating art:', error);
      
      state.mode = 'menu';
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      return output + '\x1b[31m❌ Failed to generate art: ' + errorMsg + '\x1b[0m\r\n\r\n' +
             this.showMainMenu(session);
    }
  }
  
  /**
   * Show main menu
   */
  private showMainMenu(session: Session): string {
    const state: ArtStudioState = session.data.door?.gameState as ArtStudioState;
    const hasArt = state?.currentArt !== undefined;
    const historyCount = session.data.door?.history?.length || 0;
    
    const content: FrameLine[] = [
      { text: '🎨 ART STUDIO 🎨', align: 'center' },
      { text: '' },
      { text: 'Create custom ASCII art with AI!' },
      { text: '' },
      { text: '\x1b[36m1.\x1b[0m Create New Art' },
      { text: '\x1b[36m2.\x1b[0m View Current Art' + (hasArt ? ' \x1b[32m✓\x1b[0m' : ' \x1b[90m(none)\x1b[0m') },
      { text: '\x1b[36m3.\x1b[0m Help & Tips' },
      { text: '' },
      { text: '\x1b[33mQ.\x1b[0m Exit Art Studio' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false // Don't validate since we're within door handler which enforces width
    );
    
    if (historyCount > 0) {
      output += '\r\n\x1b[90m[You have created ' + historyCount + ' piece' + (historyCount === 1 ? '' : 's') + ' of art]\x1b[0m\r\n';
    }
    
    output += '\r\nSelect an option: ';
    
    return output;
  }
  
  /**
   * Prompt for art description
   */
  private promptForDescription(): string {
    const content: FrameLine[] = [
      { text: 'DESCRIBE YOUR ART', align: 'center' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\n';
    output += 'What would you like to create? Be descriptive!\r\n';
    output += '\r\n';
    output += '\x1b[90mExamples:\x1b[0m\r\n';
    output += '\x1b[90m  - "A majestic dragon breathing fire"\x1b[0m\r\n';
    output += '\x1b[90m  - "A retro computer terminal"\x1b[0m\r\n';
    output += '\x1b[90m  - "A wizard casting a spell"\x1b[0m\r\n';
    output += '\r\n';
    output += 'Description (or CANCEL): ';
    
    return output;
  }
  
  /**
   * Prompt for art style
   */
  private promptForStyle(): string {
    const content: FrameLine[] = [
      { text: 'SELECT ART STYLE', align: 'center' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\n';
    output += '\x1b[36m1.\x1b[0m Retro      - Vintage 1980s BBS aesthetic\r\n';
    output += '\x1b[36m2.\x1b[0m Cyberpunk  - Futuristic tech style\r\n';
    output += '\x1b[36m3.\x1b[0m Fantasy    - Medieval & magical elements\r\n';
    output += '\x1b[36m4.\x1b[0m Minimal    - Clean, simple design\r\n';
    output += '\x1b[36m5.\x1b[0m Classic    - Traditional ASCII art\r\n';
    output += '\r\n';
    output += 'Select style (1-5 or CANCEL): ';
    
    return output;
  }
  
  /**
   * Prompt for color theme
   */
  private promptForTheme(): string {
    const content: FrameLine[] = [
      { text: 'SELECT COLOR THEME', align: 'center' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\n';
    output += '\x1b[36m1.\x1b[0m Monochrome - Classic ASCII, no colors\r\n';
    output += '\x1b[36m2.\x1b[0m 16-Color   - Standard ANSI colors\r\n';
    output += '\x1b[36m3.\x1b[0m Bright     - Vibrant, colorful\r\n';
    output += '\r\n';
    output += 'Select theme (1-3 or CANCEL): ';
    
    return output;
  }
  
  /**
   * Handle save title input
   */
  private async handleSaveTitleInput(
    input: string,
    session: Session,
    state: ArtStudioState
  ): Promise<string> {
    if (input.toUpperCase() === 'CANCEL') {
      state.mode = 'preview';
      return '\r\n\x1b[33mSave cancelled.\x1b[0m\r\n\r\n' + this.showArtPreview(state.currentArt!);
    }
    
    // Validate title
    if (input.length < 1) {
      return '\r\n\x1b[33mTitle cannot be empty.\x1b[0m\r\n\r\n' +
             this.promptForTitle(state.currentArt!.description);
    }
    
    if (input.length > 100) {
      return '\r\n\x1b[33mTitle too long (max 100 characters).\x1b[0m\r\n\r\n' +
             this.promptForTitle(state.currentArt!.description);
    }
    
    // Save to gallery
    try {
      if (!this.artGalleryRepository || !session.userId || !state.currentArt) {
        throw new Error('Cannot save art');
      }
      
      this.artGalleryRepository.createArtPiece({
        userId: session.userId,
        title: input,
        description: state.currentArt.description,
        artContent: state.currentArt.framedContent,
        style: state.currentArt.style,
      });
      
      state.mode = 'preview';
      return '\r\n\x1b[32m✓ Art saved to gallery!\x1b[0m\r\n' +
             '\x1b[90mVisit the Art Gallery from the main menu to view it.\x1b[0m\r\n\r\n' +
             this.showArtPreview(state.currentArt);
      
    } catch (error) {
      console.error('Error saving art:', error);
      state.mode = 'preview';
      return '\r\n\x1b[31m❌ Failed to save art.\x1b[0m\r\n\r\n' +
             this.showArtPreview(state.currentArt!);
    }
  }
  
  /**
   * Prompt for art title
   */
  private promptForTitle(defaultTitle: string): string {
    const content: FrameLine[] = [
      { text: 'SAVE TO GALLERY', align: 'center' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\n';
    output += 'Enter a title for your art:\r\n';
    output += '\r\n';
    output += '\x1b[90mSuggested: ' + defaultTitle.substring(0, 50) + '\x1b[0m\r\n';
    output += '\r\n';
    output += 'Title (or CANCEL): ';
    
    return output;
  }
  
  /**
   * Show art preview
   */
  private showArtPreview(art: { description: string; style: ArtStyle; colorTheme: ColorTheme; framedContent: string }): string {
    const content: FrameLine[] = [
      { text: '\x1b[36m1.\x1b[0m Save to Gallery' },
      { text: '\x1b[36m2.\x1b[0m Regenerate (create a new version)' },
      { text: '\x1b[36m3.\x1b[0m Return to Menu' },
    ];
    
    let output = '\r\n';
    output += art.framedContent;
    output += '\r\n\r\n';
    output += '\x1b[90mStyle: ' + art.style + ' | Theme: ' + art.colorTheme + '\x1b[0m\r\n';
    output += '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\nSelect an option: ';
    
    return output;
  }
  
  /**
   * Show help
   */
  private showHelp(session: Session): string {
    const content: FrameLine[] = [
      { text: 'ART STUDIO HELP', align: 'center' },
      { text: '' },
      { text: 'The Art Studio uses AI to generate custom ASCII' },
      { text: 'art based on your descriptions.' },
      { text: '' },
      { text: '\x1b[33mTips for best results:\x1b[0m' },
      { text: '• Be specific and descriptive' },
      { text: '• Mention key visual elements' },
      { text: '• Try different styles for variety' },
      { text: '• Regenerate if you want a different take' },
      { text: '' },
      { text: '\x1b[33mRate Limits:\x1b[0m' },
      { text: '• 5 generations per minute' },
      { text: '• Each generation takes 5-10 seconds' },
      { text: '' },
    ];
    
    let output = '\r\n';
    output += this.renderingService.renderFrame(
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      RENDER_CONTEXTS.TERMINAL_80,
      false
    );
    output += '\r\nPress ENTER to return to menu: ';
    
    // Set mode to wait for enter
    const state: ArtStudioState = session.data.door?.gameState as ArtStudioState;
    state.mode = 'menu';
    
    return output;
  }
  
  /**
   * Exit the Art Studio
   */
  async exit(session: Session): Promise<string> {
    const historyCount = session.data.door?.history?.length || 0;
    
    let output = '\r\n';
    output += '\x1b[36m🎨 Thank you for visiting the Art Studio! 🎨\x1b[0m\r\n';
    output += '\r\n';
    
    if (historyCount > 0) {
      output += `\x1b[90m[You created ${historyCount} piece${historyCount === 1 ? '' : 's'} of art this session]\x1b[0m\r\n`;
    }
    
    output += '\x1b[90mYour art is not saved permanently, but the memories remain...\x1b[0m\r\n';
    output += '\r\n';
    
    return output;
  }
}
