/**
 * ANSI Frame Builder
 * 
 * Utility class for creating ANSI box-drawing frames with guaranteed alignment.
 * Handles variable content lengths and ANSI color codes correctly.
 * 
 * Features:
 * - Calculates visual width (excluding ANSI codes)
 * - Normalizes padding for consistent width
 * - Supports centering and left-alignment
 * - Handles variable-length content
 * - Validates frame structure
 */

import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';
import { ANSIColorizer, ColorName } from './ANSIColorizer.js';

export interface FrameOptions {
  width?: number;           // Total frame width (default: 80)
  maxWidth?: number;        // Maximum allowed width (default: 80)
  padding?: number;         // Internal padding (default: 2)
  style?: 'single' | 'double';  // Border style (default: 'double')
  align?: 'left' | 'center';    // Text alignment (default: 'left')
}

export interface FrameLine {
  text: string;
  align?: 'left' | 'center';
  color?: ColorName | string;  // Color name or ANSI color code
}

export class ANSIFrameBuilder {
  private width: number;
  private maxWidth: number;
  private padding: number;
  private style: 'single' | 'double';
  private defaultAlign: 'left' | 'center';
  
  // Box-drawing characters
  private readonly chars = {
    single: {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
      leftT: '├',
      rightT: '┤',
    },
    double: {
      topLeft: '╔',
      topRight: '╗',
      bottomLeft: '╚',
      bottomRight: '╝',
      horizontal: '═',
      vertical: '║',
      leftT: '╠',
      rightT: '╣',
    },
  };
  
  constructor(options: FrameOptions = {}) {
    this.width = options.width || 80;
    this.maxWidth = options.maxWidth || 80;
    this.padding = options.padding || 2;
    this.style = options.style || 'double';
    this.defaultAlign = options.align || 'left';
    
    // Validate width doesn't exceed maxWidth
    if (this.width > this.maxWidth) {
      throw new Error(`Frame width ${this.width} exceeds maximum allowed width ${this.maxWidth}`);
    }
  }
  
  /**
   * Get visual length of text (excluding ANSI codes)
   * Uses ANSIWidthCalculator for accurate width calculation
   */
  private visualLength(text: string): number {
    return ANSIWidthCalculator.calculate(text);
  }
  
  /**
   * Pad text to specified width
   */
  private padText(text: string, width: number, align: 'left' | 'center' = 'left'): string {
    const visualLen = this.visualLength(text);
    const totalPadding = Math.max(0, width - visualLen);
    
    if (align === 'center') {
      const leftPad = Math.floor(totalPadding / 2);
      const rightPad = totalPadding - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    } else {
      // Left align
      return text + ' '.repeat(totalPadding);
    }
  }
  
  /**
   * Create top border
   */
  private createTopBorder(): string {
    const chars = this.chars[this.style];
    const innerWidth = this.width - 2;
    return chars.topLeft + chars.horizontal.repeat(innerWidth) + chars.topRight;
  }
  
  /**
   * Create bottom border
   */
  private createBottomBorder(): string {
    const chars = this.chars[this.style];
    const innerWidth = this.width - 2;
    return chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight;
  }
  
  /**
   * Create horizontal divider
   */
  private createDivider(): string {
    const chars = this.chars[this.style];
    const innerWidth = this.width - 2;
    return chars.leftT + chars.horizontal.repeat(innerWidth) + chars.rightT;
  }
  
  /**
   * Create empty line
   */
  private createEmptyLine(): string {
    const chars = this.chars[this.style];
    const innerWidth = this.width - 2;
    return chars.vertical + ' '.repeat(innerWidth) + chars.vertical;
  }
  
  /**
   * Create content line with proper padding
   */
  private createContentLine(line: FrameLine): string {
    const chars = this.chars[this.style];
    const innerWidth = this.width - 2;
    const contentWidth = innerWidth - (this.padding * 2);
    
    // Apply alignment
    const align = line.align || this.defaultAlign;
    const paddedText = this.padText(line.text, contentWidth, align);
    
    // Add internal padding
    const leftPadding = ' '.repeat(this.padding);
    const rightPadding = ' '.repeat(this.padding);
    
    // Apply color if specified
    let content = paddedText;
    if (line.color) {
      // Check if it's a color name or already an ANSI code
      if (line.color.startsWith('\x1b[')) {
        // Already an ANSI code
        content = line.color + paddedText + '\x1b[0m';
      } else {
        // Color name - use ANSIColorizer
        content = ANSIColorizer.colorize(paddedText, line.color as ColorName);
      }
    }
    
    return chars.vertical + leftPadding + content + rightPadding + chars.vertical;
  }
  
  /**
   * Build a complete frame
   * Returns an array of lines (without line endings)
   */
  build(lines: FrameLine[]): string[] {
    const result: string[] = [];
    
    // Top border
    result.push(this.createTopBorder());
    
    // Content lines
    for (const line of lines) {
      result.push(this.createContentLine(line));
    }
    
    // Bottom border
    result.push(this.createBottomBorder());
    
    // Validate width before returning
    this.validateFrameWidth(result);
    
    return result;
  }
  
  /**
   * Validate that all lines in the frame respect maxWidth
   * Throws error if any line exceeds maxWidth
   */
  private validateFrameWidth(frameLines: string[]): void {
    for (let i = 0; i < frameLines.length; i++) {
      const lineWidth = this.visualLength(frameLines[i]);
      if (lineWidth > this.maxWidth) {
        throw new Error(
          `Frame line ${i + 1} width ${lineWidth} exceeds maximum allowed width ${this.maxWidth}`
        );
      }
    }
  }
  
  /**
   * Build a frame with title and content sections
   * Returns an array of lines (without line endings)
   */
  buildWithTitle(title: string, content: FrameLine[], titleColor?: string): string[] {
    const result: string[] = [];
    
    // Top border
    result.push(this.createTopBorder());
    
    // Empty line
    result.push(this.createEmptyLine());
    
    // Title (centered)
    result.push(this.createContentLine({
      text: title,
      align: 'center',
      color: titleColor,
    }));
    
    // Empty line
    result.push(this.createEmptyLine());
    
    // Divider
    result.push(this.createDivider());
    
    // Empty line
    result.push(this.createEmptyLine());
    
    // Content lines
    for (const line of content) {
      result.push(this.createContentLine(line));
    }
    
    // Empty line
    result.push(this.createEmptyLine());
    
    // Bottom border
    result.push(this.createBottomBorder());
    
    // Validate width before returning
    this.validateFrameWidth(result);
    
    return result;
  }
  
  /**
   * Build a simple message frame
   * Returns an array of lines (without line endings)
   */
  buildMessage(message: string, messageColor?: string): string[] {
    const result: string[] = [];
    
    // Top border
    result.push(this.createTopBorder());
    
    // Empty line
    result.push(this.createEmptyLine());
    
    // Message (centered)
    result.push(this.createContentLine({
      text: message,
      align: 'center',
      color: messageColor,
    }));
    
    // Empty line
    result.push(this.createEmptyLine());
    
    // Bottom border
    result.push(this.createBottomBorder());
    
    // Validate width before returning
    this.validateFrameWidth(result);
    
    return result;
  }
  
  /**
   * Validate that all lines in a frame have consistent width
   */
  static validate(frameContent: string): { valid: boolean; issues: string[] } {
    const lines = frameContent.split(/\r?\n/);
    const issues: string[] = [];
    
    if (lines.length === 0) {
      issues.push('Frame is empty');
      return { valid: false, issues };
    }
    
    // Use ANSIWidthCalculator for accurate width calculation
    const widths = lines.map(line => ANSIWidthCalculator.calculate(line));
    
    // Check all lines have same width
    const expectedWidth = widths[0];
    
    widths.forEach((width, index) => {
      if (width !== expectedWidth) {
        issues.push(
          `Line ${index + 1} width mismatch: expected ${expectedWidth}, got ${width}`
        );
      }
    });
    
    // Strip ANSI codes for border checking
    const strippedLines = lines.map(line => 
      line.replace(/\x1b\[[0-9;]*m/g, '')
    );
    
    // Check corners are present
    const firstLine = strippedLines[0];
    const lastLine = strippedLines[strippedLines.length - 1];
    
    const hasTopCorners = 
      (firstLine.startsWith('┌') && firstLine.endsWith('┐')) ||
      (firstLine.startsWith('╔') && firstLine.endsWith('╗'));
    
    const hasBottomCorners = 
      (lastLine.startsWith('└') && lastLine.endsWith('┘')) ||
      (lastLine.startsWith('╚') && lastLine.endsWith('╝'));
    
    if (!hasTopCorners) {
      issues.push('Top border missing proper corners');
    }
    
    if (!hasBottomCorners) {
      issues.push('Bottom border missing proper corners');
    }
    
    // Check vertical borders (skip first and last line)
    for (let i = 1; i < strippedLines.length - 1; i++) {
      const line = strippedLines[i];
      const hasVerticalBorders = 
        (line.startsWith('│') && line.endsWith('│')) ||
        (line.startsWith('║') && line.endsWith('║')) ||
        (line.startsWith('├') && line.endsWith('┤')) ||
        (line.startsWith('╠') && line.endsWith('╣'));
      
      if (!hasVerticalBorders) {
        issues.push(`Line ${i + 1} missing vertical borders`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
