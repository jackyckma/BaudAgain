/**
 * ANSI Art Generator Service
 * 
 * Generates ASCII/ANSI art using AI with support for different styles.
 * Validates generated art for terminal compatibility.
 */

import { AIProvider, AIOptions, AIProviderError } from '../ai/AIProvider.js';
import { ANSIColorizer, ColorName } from '../ansi/ANSIColorizer.js';
import { ANSIFrameBuilder, FrameLine } from '../ansi/ANSIFrameBuilder.js';
import type { FastifyBaseLogger } from 'fastify';

export type ArtStyle = 'retro' | 'cyberpunk' | 'fantasy' | 'minimal' | 'classic';
export type ColorTheme = 'monochrome' | '16-color' | 'bright';

export interface ArtGenerationOptions {
  description: string;
  style?: ArtStyle;
  width?: number;
  height?: number;
  maxTokens?: number;
  colorTheme?: ColorTheme;
  applyColors?: boolean;
}

export interface GeneratedArt {
  content: string;
  coloredContent?: string;
  framedContent?: string;
  style: ArtStyle;
  description: string;
  width: number;
  height: number;
  colorTheme?: ColorTheme;
  timestamp: Date;
}

export interface FramingOptions {
  title?: string;
  attribution?: string;
  frameWidth?: number;
  includeTimestamp?: boolean;
}

export interface ArtValidationResult {
  valid: boolean;
  issues: string[];
  actualWidth: number;
  actualHeight: number;
}

export class ANSIArtGenerator {
  private readonly DEFAULT_WIDTH = 60;
  private readonly DEFAULT_HEIGHT = 15;
  private readonly MAX_WIDTH = 80;
  private readonly MAX_HEIGHT = 40;
  private readonly DEFAULT_MAX_TOKENS = 1000;

  // Safe ASCII characters for terminal display
  private readonly SAFE_CHARS = /^[\x20-\x7E\n\r]*$/;

  constructor(
    private provider: AIProvider,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Generate ASCII/ANSI art from a description
   */
  async generateArt(options: ArtGenerationOptions): Promise<GeneratedArt> {
    const {
      description,
      style = 'retro',
      width = this.DEFAULT_WIDTH,
      height = this.DEFAULT_HEIGHT,
      maxTokens = this.DEFAULT_MAX_TOKENS,
      colorTheme = '16-color',
      applyColors = true,
    } = options;

    // Validate dimensions
    if (width > this.MAX_WIDTH || width < 10) {
      throw new Error(`Width must be between 10 and ${this.MAX_WIDTH}`);
    }
    if (height > this.MAX_HEIGHT || height < 5) {
      throw new Error(`Height must be between 5 and ${this.MAX_HEIGHT}`);
    }

    this.logger.info(
      { description, style, width, height },
      'Generating ANSI art'
    );

    try {
      const prompt = this.buildPrompt(description, style, width, height);
      const systemPrompt = this.getSystemPrompt(style);

      const aiOptions: AIOptions = {
        maxTokens,
        temperature: 0.8,
        systemPrompt,
      };

      const artContent = await this.provider.generateCompletion(prompt, aiOptions);

      // Clean and validate the generated art
      const cleanedArt = this.cleanArt(artContent);
      const validation = this.validateArt(cleanedArt, width, height);

      if (!validation.valid) {
        this.logger.warn(
          { issues: validation.issues },
          'Generated art has validation issues'
        );
        // Continue anyway - art might still be usable
      }

      // Apply colors if requested
      let coloredContent: string | undefined;
      if (applyColors) {
        coloredContent = this.applyColors(cleanedArt, style, colorTheme);
      }

      const result: GeneratedArt = {
        content: cleanedArt,
        coloredContent,
        style,
        description,
        width: validation.actualWidth,
        height: validation.actualHeight,
        colorTheme: applyColors ? colorTheme : undefined,
        timestamp: new Date(),
      };

      this.logger.info(
        { 
          actualWidth: validation.actualWidth,
          actualHeight: validation.actualHeight,
          valid: validation.valid,
          colored: applyColors 
        },
        'ANSI art generated successfully'
      );

      return result;
    } catch (error) {
      if (error instanceof AIProviderError) {
        this.logger.error(
          { error: error.toJSON() },
          'AI provider error during art generation'
        );
        throw error;
      }

      this.logger.error({ error }, 'Unexpected error during art generation');
      throw new Error('Failed to generate art');
    }
  }

  /**
   * Build the prompt for art generation
   */
  private buildPrompt(
    description: string,
    style: ArtStyle,
    width: number,
    height: number
  ): string {
    const styleDescriptions: Record<ArtStyle, string> = {
      retro: 'vintage 1980s BBS aesthetic with bold lines and geometric shapes',
      cyberpunk: 'futuristic cyberpunk style with angular designs and tech elements',
      fantasy: 'fantasy RPG style with medieval and magical elements',
      minimal: 'minimalist design with clean lines and simple shapes',
      classic: 'classic ASCII art style reminiscent of early computer art',
    };

    return `Create ASCII art of: ${description}

Style: ${styleDescriptions[style]}

Requirements:
- Width: approximately ${width} characters
- Height: approximately ${height} lines
- Use only standard ASCII characters (no Unicode)
- Use characters like: | - / \\ _ = + * # @ . : ; ' " ( ) [ ] { } < >
- Create clear, recognizable imagery
- Ensure the art is well-balanced and centered
- Do NOT include any explanatory text, just the art itself
- Do NOT use markdown code blocks or formatting
- Start immediately with the art

Generate the ASCII art now:`;
  }

  /**
   * Get system prompt for the specified style
   */
  private getSystemPrompt(style: ArtStyle): string {
    const basePrompt = `You are an expert ASCII art generator specializing in creating art for vintage BBS terminals.

CRITICAL RULES:
1. Output ONLY the ASCII art - no explanations, no markdown, no code blocks
2. Use ONLY standard ASCII characters (printable characters from space to tilde)
3. Do NOT use Unicode box-drawing characters
4. Do NOT include any text before or after the art
5. Ensure consistent line lengths for proper terminal display
6. Create art that looks good in a monospace terminal font`;

    const styleGuidance: Record<ArtStyle, string> = {
      retro: `
Style: Retro 1980s BBS
- Use bold, blocky characters like █ ▓ ▒ ░ (represented with #, =, -, .)
- Create geometric, angular designs
- Think vintage computer graphics and early video games
- Use repetition and patterns for visual impact`,

      cyberpunk: `
Style: Cyberpunk/Tech
- Use angular, sharp lines with / \\ | -
- Incorporate circuit-like patterns
- Create a sense of digital/technological aesthetic
- Use characters that suggest data, grids, and technology`,

      fantasy: `
Style: Fantasy/Medieval
- Use flowing, organic lines
- Create imagery of castles, dragons, swords, magic
- Use characters that suggest texture and depth
- Think dungeons, wizards, and adventure`,

      minimal: `
Style: Minimalist
- Use simple, clean lines
- Focus on essential shapes and forms
- Avoid clutter and excessive detail
- Create elegant, understated designs`,

      classic: `
Style: Classic ASCII Art
- Use traditional ASCII art techniques
- Create recognizable imagery with character density
- Use shading with characters like: @ # * + = - . (space)
- Think classic computer art from the 1970s-1990s`,
    };

    return `${basePrompt}\n${styleGuidance[style]}`;
  }

  /**
   * Clean generated art content
   */
  private cleanArt(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.replace(/```[\w]*\n?/g, '');
    
    // Remove leading/trailing whitespace from the entire content
    cleaned = cleaned.trim();
    
    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');
    
    // Remove any non-ASCII characters (keep only printable ASCII + newlines)
    cleaned = cleaned.split('').filter(char => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code <= 126) || code === 10; // printable ASCII + newline
    }).join('');
    
    return cleaned;
  }

  /**
   * Validate generated art
   */
  validateArt(
    content: string,
    expectedWidth: number,
    expectedHeight: number
  ): ArtValidationResult {
    const issues: string[] = [];
    
    // Check if content is empty
    if (!content || content.trim().length === 0) {
      issues.push('Art content is empty');
      return {
        valid: false,
        issues,
        actualWidth: 0,
        actualHeight: 0,
      };
    }

    // Split into lines
    const lines = content.split('\n');
    const actualHeight = lines.length;

    // Calculate actual width (max line length)
    const actualWidth = Math.max(...lines.map(line => line.length));

    // Check character safety
    if (!this.SAFE_CHARS.test(content)) {
      issues.push('Art contains unsafe or non-ASCII characters');
    }

    // Check dimensions
    const widthTolerance = Math.ceil(expectedWidth * 0.2); // 20% tolerance
    const heightTolerance = Math.ceil(expectedHeight * 0.3); // 30% tolerance

    if (Math.abs(actualWidth - expectedWidth) > widthTolerance) {
      issues.push(
        `Width ${actualWidth} differs significantly from expected ${expectedWidth}`
      );
    }

    if (Math.abs(actualHeight - expectedHeight) > heightTolerance) {
      issues.push(
        `Height ${actualHeight} differs significantly from expected ${expectedHeight}`
      );
    }

    // Check for excessive blank lines
    const blankLines = lines.filter(line => line.trim().length === 0).length;
    if (blankLines > actualHeight * 0.3) {
      issues.push('Art contains too many blank lines');
    }

    // Check for minimum content
    const totalChars = content.replace(/\s/g, '').length;
    if (totalChars < 20) {
      issues.push('Art contains insufficient content');
    }

    return {
      valid: issues.length === 0,
      issues,
      actualWidth,
      actualHeight,
    };
  }

  /**
   * Get style description for display
   */
  static getStyleDescription(style: ArtStyle): string {
    const descriptions: Record<ArtStyle, string> = {
      retro: 'Vintage 1980s BBS aesthetic',
      cyberpunk: 'Futuristic cyberpunk style',
      fantasy: 'Fantasy RPG medieval style',
      minimal: 'Clean minimalist design',
      classic: 'Classic ASCII art style',
    };
    return descriptions[style];
  }

  /**
   * Get available art styles
   */
  static getAvailableStyles(): ArtStyle[] {
    return ['retro', 'cyberpunk', 'fantasy', 'minimal', 'classic'];
  }

  /**
   * Apply ANSI colors to ASCII art based on theme and style
   */
  private applyColors(
    art: string,
    style: ArtStyle,
    theme: ColorTheme
  ): string {
    if (theme === 'monochrome') {
      // No colors, just return original art
      return art;
    }

    // Get color palette based on style and theme
    const palette = this.getColorPalette(style, theme);

    // Apply colors line by line with variation
    const lines = art.split('\n');
    const coloredLines = lines.map((line, index) => {
      if (line.trim().length === 0) {
        return line; // Don't color empty lines
      }

      // Select color based on line position and content
      const color = this.selectColorForLine(line, index, palette);
      return ANSIColorizer.colorize(line, color);
    });

    return coloredLines.join('\n');
  }

  /**
   * Get color palette for a style and theme
   */
  private getColorPalette(style: ArtStyle, theme: ColorTheme): ColorName[] {
    const palettes: Record<ArtStyle, Record<ColorTheme, ColorName[]>> = {
      retro: {
        'monochrome': ['white'],
        '16-color': ['cyan', 'magenta', 'yellow'],
        'bright': ['cyan', 'magenta', 'yellow', 'green'],
      },
      cyberpunk: {
        'monochrome': ['white'],
        '16-color': ['cyan', 'magenta', 'blue'],
        'bright': ['cyan', 'magenta', 'blue', 'green'],
      },
      fantasy: {
        'monochrome': ['white'],
        '16-color': ['yellow', 'magenta', 'cyan'],
        'bright': ['yellow', 'magenta', 'cyan', 'green'],
      },
      minimal: {
        'monochrome': ['white'],
        '16-color': ['cyan', 'white'],
        'bright': ['cyan', 'white', 'blue'],
      },
      classic: {
        'monochrome': ['white'],
        '16-color': ['green', 'cyan'],
        'bright': ['green', 'cyan', 'yellow'],
      },
    };

    return palettes[style][theme];
  }

  /**
   * Select appropriate color for a line based on content and position
   */
  private selectColorForLine(
    line: string,
    index: number,
    palette: ColorName[]
  ): ColorName {
    // Use character density to determine color
    const density = this.calculateLineDensity(line);

    if (palette.length === 1) {
      return palette[0];
    }

    // Map density to color index
    // Higher density = later colors in palette
    const colorIndex = Math.min(
      Math.floor(density * palette.length),
      palette.length - 1
    );

    return palette[colorIndex];
  }

  /**
   * Calculate the density of characters in a line (0.0 to 1.0)
   */
  private calculateLineDensity(line: string): number {
    if (line.length === 0) return 0;

    // Count non-space characters
    const nonSpaceChars = line.replace(/\s/g, '').length;
    return nonSpaceChars / line.length;
  }

  /**
   * Get available color themes
   */
  static getAvailableThemes(): ColorTheme[] {
    return ['monochrome', '16-color', 'bright'];
  }

  /**
   * Get theme description for display
   */
  static getThemeDescription(theme: ColorTheme): string {
    const descriptions: Record<ColorTheme, string> = {
      monochrome: 'No colors, classic ASCII',
      '16-color': 'Standard 16-color ANSI palette',
      bright: 'Bright, vibrant colors',
    };
    return descriptions[theme];
  }

  /**
   * Frame generated art with title and attribution
   */
  frameArt(art: GeneratedArt, options: FramingOptions = {}): string {
    const {
      title,
      attribution,
      frameWidth = 80,
      includeTimestamp = false,
    } = options;

    // Use colored content if available, otherwise use plain content
    const artContent = art.coloredContent || art.content;
    const artLines = artContent.split('\n');

    // Build frame content
    const frameLines: FrameLine[] = [];

    // Add art lines
    artLines.forEach(line => {
      frameLines.push({ text: line, align: 'center' });
    });

    // Add attribution if provided
    if (attribution || includeTimestamp) {
      frameLines.push({ text: '', align: 'center' }); // Empty line
      
      if (attribution) {
        frameLines.push({
          text: `Created by: ${attribution}`,
          align: 'center',
          color: '\x1b[36m', // Cyan
        });
      }

      if (includeTimestamp) {
        const timestamp = art.timestamp.toLocaleString();
        frameLines.push({
          text: timestamp,
          align: 'center',
          color: '\x1b[90m', // Gray
        });
      }
    }

    // Create frame builder
    const frameBuilder = new ANSIFrameBuilder({
      width: frameWidth,
      padding: 2,
      style: 'double',
      align: 'center',
    });

    // Build frame with title if provided
    let framedLines: string[];
    if (title) {
      framedLines = frameBuilder.buildWithTitle(
        title,
        frameLines,
        '\x1b[33m' // Yellow for title
      );
    } else {
      framedLines = frameBuilder.build(frameLines);
    }

    return framedLines.join('\n');
  }

  /**
   * Generate and frame art in one call
   */
  async generateFramedArt(
    generationOptions: ArtGenerationOptions,
    framingOptions: FramingOptions = {}
  ): Promise<GeneratedArt> {
    const art = await this.generateArt(generationOptions);
    const framedContent = this.frameArt(art, framingOptions);

    return {
      ...art,
      framedContent,
    };
  }
}
