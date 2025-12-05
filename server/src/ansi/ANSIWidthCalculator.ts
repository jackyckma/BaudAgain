import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Interface for width overrides file
 */
interface WidthOverrides {
  description?: string;
  forceNarrow: Array<{
    range?: [string, string];
    chars?: string[];
    comment?: string;
  }>;
  forceWide: Array<{
    range?: [string, string];
    chars?: string[];
    comment?: string;
  }>;
}

/**
 * ANSIWidthCalculator - Calculates visual width of strings with ANSI codes
 * 
 * This utility correctly calculates the visual width of strings by:
 * - Stripping ANSI escape codes (which take no visual space)
 * - Handling Unicode character widths (most chars = 1, some emoji = 2)
 * - Handling box-drawing characters (always 1)
 * - Handling grapheme clusters (emoji sequences) correctly using Intl.Segmenter
 * - Loading external width overrides from server/data/ansi/width-overrides.json
 */
export class ANSIWidthCalculator {
  /**
   * Regex to match ANSI escape codes
   * Matches: ESC [ ... m (color codes, cursor movement, etc.)
   */
  private static readonly ANSI_REGEX = /\x1b\[[0-9;]*m/g;
  
  // Cache for overrides
  private static overridesLoaded = false;
  private static narrowRanges: Array<[number, number]> = [];
  private static wideRanges: Array<[number, number]> = [];

  /**
   * Load overrides from JSON file
   */
  private static loadOverrides() {
    if (this.overridesLoaded) return;

    try {
      // Resolve path relative to where this code is running
      const workspaceRoot = resolve(process.cwd());
      // We'll look in known location server/data/ansi/width-overrides.json or data/ansi/width-overrides.json
      const pathsToTry = [
        join(workspaceRoot, 'data/ansi/width-overrides.json'),
        join(workspaceRoot, 'server/data/ansi/width-overrides.json')
      ];

      let overridePath = '';
      for (const p of pathsToTry) {
        if (existsSync(p)) {
          overridePath = p;
          break;
        }
      }
      
      if (overridePath) {
        const content = readFileSync(overridePath, 'utf-8');
        const data: WidthOverrides = JSON.parse(content);
        
        // Process Force Narrow
        if (data.forceNarrow) {
          for (const item of data.forceNarrow) {
            if (item.range) {
              // Strip '0x' prefix if present before parsing
              const startStr = item.range[0].startsWith('0x') ? item.range[0].substring(2) : item.range[0];
              const endStr = item.range[1].startsWith('0x') ? item.range[1].substring(2) : item.range[1];
              const start = parseInt(startStr, 16);
              const end = parseInt(endStr, 16);
              
              if (!isNaN(start) && !isNaN(end)) {
                this.narrowRanges.push([start, end]);
              }
            }
            if (item.chars) {
              for (const charHex of item.chars) {
                // Strip '0x' prefix if present before parsing
                const cleanHex = charHex.startsWith('0x') ? charHex.substring(2) : charHex;
                const code = parseInt(cleanHex, 16);
                if (!isNaN(code)) {
                  this.narrowRanges.push([code, code]);
                }
              }
            }
          }
        }
        
        // Process Force Wide
        if (data.forceWide) {
          for (const item of data.forceWide) {
            if (item.range) {
              const startStr = item.range[0].startsWith('0x') ? item.range[0].substring(2) : item.range[0];
              const endStr = item.range[1].startsWith('0x') ? item.range[1].substring(2) : item.range[1];
              const start = parseInt(startStr, 16);
              const end = parseInt(endStr, 16);
              
              if (!isNaN(start) && !isNaN(end)) {
                this.wideRanges.push([start, end]);
              }
            }
            if (item.chars) {
              for (const charHex of item.chars) {
                const cleanHex = charHex.startsWith('0x') ? charHex.substring(2) : charHex;
                const code = parseInt(cleanHex, 16);
                if (!isNaN(code)) {
                  this.wideRanges.push([code, code]);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load width overrides:', err);
    }
    
    this.overridesLoaded = true;
  }

  /**
   * Calculate visual width of text (strips ANSI codes, handles Unicode)
   * 
   * @param text - Text to measure (may contain ANSI codes)
   * @returns Visual width in character cells
   */
  static calculate(text: string): number {
    // Ensure overrides are loaded
    this.loadOverrides();
    
    // Strip ANSI escape codes first
    const stripped = text.replace(this.ANSI_REGEX, '');
    
    // Use Intl.Segmenter to handle grapheme clusters (e.g. emoji sequences)
    // This treats a sequence like 👨‍👩‍👧‍👦 as a single unit
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    let width = 0;
    
    for (const { segment } of segmenter.segment(stripped)) {
      if (this.isWide(segment)) {
        width += 2;
      } else {
        width += 1;
      }
    }
    
    return width;
  }

  /**
   * Check if a grapheme cluster should be considered "wide" (2 cells)
   */
  private static isWide(grapheme: string): boolean {
    const codePoint = grapheme.codePointAt(0);
    
    if (codePoint === undefined) {
      return false;
    }
    
    // Check overrides first
    if (this.overridesLoaded) {
      // Check narrow overrides
      for (const [start, end] of this.narrowRanges) {
        if (codePoint >= start && codePoint <= end) {
          return false;
        }
      }
      // Check wide overrides (if we had any that contradicted standard logic)
      for (const [start, end] of this.wideRanges) {
        if (codePoint >= start && codePoint <= end) {
          return true;
        }
      }
    }
    
    // Box-drawing characters (U+2500 to U+257F) are always single-width
    if (codePoint >= 0x2500 && codePoint <= 0x257F) {
      return false;
    }
    
    // Legacy Logic (fallback if JSON missing, though loadOverrides is called)
    // We keep this for safety but the JSON should override it.
    
    // Specifically forcing '💡' (U+1F4A1), '📬' (U+1F4EC), '🎨' (U+1F3A8), and '🖼️' (U+1F5BC) to width 1
    if (
      codePoint === 0x1F4A1 || // 💡
      codePoint === 0x1F4EC || // 📬
      codePoint === 0x1F3A8 || // 🎨
      codePoint === 0x1F5BC    // 🖼️
    ) {
      return false;
    }

    // GENERIC FIX: Force most "Symbol/Object" emojis (U+1F300-U+1F5FF) to single width
    if (codePoint >= 0x1F300 && codePoint <= 0x1F5FF) {
      return false;
    }

    return (
      (codePoint >= 0x1F600 && codePoint <= 0x1F9FF) || // Emoticons (Faces)
      (codePoint === 0x2B50) || 
      (codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
      (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
      (codePoint >= 0x20000 && codePoint <= 0x2FFFF) // SIP (CJK Extension B, C, etc)
    );
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
   * @param ellipsis - String to append when truncated (default: '...')
   * @returns Truncated text
   */
  static truncate(text: string, width: number, ellipsis: string = '...'): string {
    const currentWidth = this.calculate(text);
    
    if (currentWidth <= width) {
      return text;
    }
    
    const ellipsisWidth = this.calculate(ellipsis);
    const targetWidth = width - ellipsisWidth;
    
    if (targetWidth <= 0) {
      return ellipsis.substring(0, width);
    }
    
    // Find truncation point
    const stripped = text.replace(this.ANSI_REGEX, '');
    let accumulatedWidth = 0;
    
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    let charCount = 0;
    
    // Iterate through graphemes to find where to cut
    for (const { segment } of segmenter.segment(stripped)) {
      const segmentWidth = this.isWide(segment) ? 2 : 1;
      
      if (accumulatedWidth + segmentWidth > targetWidth) {
        break;
      }
      
      accumulatedWidth += segmentWidth;
      charCount += segment.length;
    }
    
    // Simple truncation preserving ANSI end reset
    return stripped.substring(0, charCount) + '\x1b[0m' + ellipsis;
  }
}
