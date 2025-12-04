/**
 * ANSIColorizer - Manages color application and conversion
 * 
 * This utility provides:
 * - Simple color API with named colors
 * - Automatic reset code insertion
 * - ANSI to HTML conversion for web contexts
 * - ANSI code stripping
 */

export type ColorName = 'red' | 'green' | 'blue' | 'yellow' | 'cyan' | 'magenta' | 'white' | 'gray';

export class ANSIColorizer {
  /**
   * ANSI color codes mapping
   */
  private static readonly COLOR_CODES: Record<ColorName, string> = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };

  /**
   * ANSI reset code
   */
  private static readonly RESET = '\x1b[0m';

  /**
   * Regex to match ANSI escape codes
   */
  private static readonly ANSI_REGEX = /\x1b\[[0-9;]*m/g;

  /**
   * HTML color mapping for web context
   */
  private static readonly HTML_COLORS: Record<ColorName, string> = {
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    gray: '#6272a4',
  };

  /**
   * Apply color to text (adds reset automatically)
   * 
   * @param text - Text to colorize
   * @param color - Color name
   * @returns Colorized text with reset code
   */
  static colorize(text: string, color: ColorName): string {
    const colorCode = this.getANSICode(color);
    return `${colorCode}${text}${this.RESET}`;
  }

  /**
   * Convert ANSI codes to HTML
   * 
   * @param ansiText - Text with ANSI codes
   * @returns HTML with span elements for colors
   */
  static toHTML(ansiText: string): string {
    let html = ansiText;
    let currentColor: string | null = null;
    let result = '';
    let i = 0;

    while (i < html.length) {
      // Check for ANSI escape sequence
      if (html[i] === '\x1b' && html[i + 1] === '[') {
        // Find the end of the escape sequence
        let j = i + 2;
        while (j < html.length && html[j] !== 'm') {
          j++;
        }
        
        if (j < html.length) {
          const sequence = html.substring(i + 2, j);
          
          // Close previous span if open
          if (currentColor !== null) {
            result += '</span>';
            currentColor = null;
          }
          
          // Parse the color code
          if (sequence === '0' || sequence === '') {
            // Reset code - already closed span above
          } else {
            // Map ANSI code to color
            const color = this.ansiCodeToColor(sequence);
            if (color) {
              currentColor = this.HTML_COLORS[color];
              result += `<span style="color: ${currentColor}">`;
            }
          }
          
          i = j + 1;
          continue;
        }
      }
      
      // Regular character
      result += html[i];
      i++;
    }
    
    // Close any open span
    if (currentColor !== null) {
      result += '</span>';
    }
    
    return result;
  }

  /**
   * Strip all ANSI codes from text
   * 
   * @param text - Text with ANSI codes
   * @returns Plain text without ANSI codes
   */
  static strip(text: string): string {
    return text.replace(this.ANSI_REGEX, '');
  }

  /**
   * Get ANSI code for a color name
   * 
   * @param color - Color name
   * @returns ANSI escape code
   */
  private static getANSICode(color: ColorName): string {
    return this.COLOR_CODES[color];
  }

  /**
   * Map ANSI code sequence to color name
   * 
   * @param sequence - ANSI code sequence (e.g., '31' for red)
   * @returns Color name or null if not recognized
   */
  private static ansiCodeToColor(sequence: string): ColorName | null {
    // Handle simple color codes
    const code = sequence.split(';').pop(); // Get last part for compound codes like '1;31'
    
    switch (code) {
      case '31': return 'red';
      case '32': return 'green';
      case '33': return 'yellow';
      case '34': return 'blue';
      case '35': return 'magenta';
      case '36': return 'cyan';
      case '37': return 'white';
      case '90': return 'gray';
      default: return null;
    }
  }
}
