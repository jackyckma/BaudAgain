/**
 * ANSIWidthCalculator - Calculates visual width of strings with ANSI codes
 * 
 * This utility correctly calculates the visual width of strings by:
 * - Stripping ANSI escape codes (which take no visual space)
 * - Handling Unicode character widths (most chars = 1, some emoji = 2)
 * - Handling box-drawing characters (always 1)
 */
export class ANSIWidthCalculator {
  /**
   * Regex to match ANSI escape codes
   * Matches: ESC [ ... m (color codes, cursor movement, etc.)
   */
  private static readonly ANSI_REGEX = /\x1b\[[0-9;]*m/g;

  /**
   * Calculate visual width of text (strips ANSI codes, handles Unicode)
   * 
   * @param text - Text to measure (may contain ANSI codes)
   * @returns Visual width in character cells
   */
  static calculate(text: string): number {
    // Strip ANSI escape codes first
    const stripped = text.replace(this.ANSI_REGEX, '');
    
    let width = 0;
    
    // Iterate through each character
    for (const char of stripped) {
      const codePoint = char.codePointAt(0);
      
      if (codePoint === undefined) {
        continue;
      }
      
      // Box-drawing characters (U+2500 to U+257F) are always single-width
      if (codePoint >= 0x2500 && codePoint <= 0x257F) {
        width += 1;
        continue;
      }
      
      // Check for wide characters (emoji, CJK characters, etc.)
      // This is a simplified check - full Unicode width calculation is complex
      // Most emoji are in these ranges:
      // - U+1F300 to U+1F9FF (Miscellaneous Symbols and Pictographs, Emoticons, etc.)
      // - U+2600 to U+26FF (Miscellaneous Symbols)
      // - U+2700 to U+27BF (Dingbats)
      // CJK characters: U+4E00 to U+9FFF, U+3400 to U+4DBF
      if (
        (codePoint >= 0x1F300 && codePoint <= 0x1F9FF) ||
        (codePoint >= 0x2600 && codePoint <= 0x26FF) ||
        (codePoint >= 0x2700 && codePoint <= 0x27BF) ||
        (codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
        (codePoint >= 0x3400 && codePoint <= 0x4DBF)
      ) {
        width += 2;
      } else {
        // Most characters are single-width
        width += 1;
      }
    }
    
    return width;
  }

  /**
   * Check if text fits within a given width
   * 
   * @param text - Text to check
   * @param width - Maximum width in character cells
   * @returns True if text fits, false otherwise
   */
  static fitsIn(text: string, width: number): boolean {
    return this.calculate(text) <= width;
  }

  /**
   * Truncate text to fit within a given width
   * 
   * @param text - Text to truncate
   * @param width - Maximum width in character cells
   * @param ellipsis - String to append if truncated (default: '...')
   * @returns Truncated text
   */
  static truncate(text: string, width: number, ellipsis: string = '...'): string {
    const stripped = text.replace(this.ANSI_REGEX, '');
    const ellipsisWidth = this.calculate(ellipsis);
    
    if (this.calculate(text) <= width) {
      return text;
    }
    
    let currentWidth = 0;
    let result = '';
    
    for (const char of stripped) {
      const charWidth = this.calculate(char);
      
      if (currentWidth + charWidth + ellipsisWidth > width) {
        break;
      }
      
      result += char;
      currentWidth += charWidth;
    }
    
    return result + ellipsis;
  }
}
