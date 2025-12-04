/**
 * ANSI Frame Validator
 * 
 * Utility for validating ANSI box-drawing frames.
 * Checks for proper alignment, consistent width, and correct structure.
 * 
 * Can be used in tests to ensure frames are properly formatted.
 */

export interface FrameValidationResult {
  valid: boolean;
  width: number;
  height: number;
  issues: string[];
  corners: {
    topLeft: { x: number; y: number; char: string };
    topRight: { x: number; y: number; char: string };
    bottomLeft: { x: number; y: number; char: string };
    bottomRight: { x: number; y: number; char: string };
  };
}

export class ANSIFrameValidator {
  /**
   * Strip ANSI escape codes from text
   */
  private static stripANSI(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }
  
  /**
   * Check if character is a box-drawing corner
   */
  private static isCorner(char: string): boolean {
    return ['┌', '┐', '└', '┘', '╔', '╗', '╚', '╝'].includes(char);
  }
  
  /**
   * Check if character is a vertical border
   */
  private static isVerticalBorder(char: string): boolean {
    return ['│', '║', '├', '┤', '╠', '╣'].includes(char);
  }
  
  /**
   * Check if character is a horizontal border
   */
  private static isHorizontalBorder(char: string): boolean {
    return ['─', '═'].includes(char);
  }
  
  /**
   * Validate a frame's structure and alignment
   */
  static validate(frameContent: string): FrameValidationResult {
    const lines = frameContent.split(/\r?\n/).filter(line => line.length > 0);
    const issues: string[] = [];
    
    if (lines.length === 0) {
      return {
        valid: false,
        width: 0,
        height: 0,
        issues: ['Frame is empty'],
        corners: {
          topLeft: { x: 0, y: 0, char: '' },
          topRight: { x: 0, y: 0, char: '' },
          bottomLeft: { x: 0, y: 0, char: '' },
          bottomRight: { x: 0, y: 0, char: '' },
        },
      };
    }
    
    // Strip ANSI codes for width calculation
    const strippedLines = lines.map(line => this.stripANSI(line));
    
    // Check all lines have same width
    const expectedWidth = strippedLines[0].length;
    const widths = strippedLines.map(line => line.length);
    
    widths.forEach((width, index) => {
      if (width !== expectedWidth) {
        issues.push(
          `Line ${index + 1} width mismatch: expected ${expectedWidth}, got ${width}`
        );
      }
    });
    
    // Extract corners
    const firstLine = strippedLines[0];
    const lastLine = strippedLines[strippedLines.length - 1];
    
    const corners = {
      topLeft: { x: 0, y: 0, char: firstLine[0] },
      topRight: { x: expectedWidth - 1, y: 0, char: firstLine[expectedWidth - 1] },
      bottomLeft: { x: 0, y: lines.length - 1, char: lastLine[0] },
      bottomRight: { x: expectedWidth - 1, y: lines.length - 1, char: lastLine[expectedWidth - 1] },
    };
    
    // Validate top corners
    if (!this.isCorner(corners.topLeft.char)) {
      issues.push(`Top-left corner invalid: '${corners.topLeft.char}'`);
    }
    if (!this.isCorner(corners.topRight.char)) {
      issues.push(`Top-right corner invalid: '${corners.topRight.char}'`);
    }
    
    // Validate bottom corners
    if (!this.isCorner(corners.bottomLeft.char)) {
      issues.push(`Bottom-left corner invalid: '${corners.bottomLeft.char}'`);
    }
    if (!this.isCorner(corners.bottomRight.char)) {
      issues.push(`Bottom-right corner invalid: '${corners.bottomRight.char}'`);
    }
    
    // Validate top border (all horizontal characters between corners)
    for (let i = 1; i < expectedWidth - 1; i++) {
      if (!this.isHorizontalBorder(firstLine[i])) {
        issues.push(`Top border character ${i} is not horizontal: '${firstLine[i]}'`);
        break; // Only report first issue
      }
    }
    
    // Validate bottom border
    for (let i = 1; i < expectedWidth - 1; i++) {
      if (!this.isHorizontalBorder(lastLine[i])) {
        issues.push(`Bottom border character ${i} is not horizontal: '${lastLine[i]}'`);
        break;
      }
    }
    
    // Validate vertical borders (skip first and last line)
    for (let i = 1; i < strippedLines.length - 1; i++) {
      const line = strippedLines[i];
      
      if (!this.isVerticalBorder(line[0])) {
        issues.push(`Line ${i + 1} left border invalid: '${line[0]}'`);
      }
      
      if (!this.isVerticalBorder(line[expectedWidth - 1])) {
        issues.push(`Line ${i + 1} right border invalid: '${line[expectedWidth - 1]}'`);
      }
    }
    
    // Check for consistent border style (single vs double)
    // Only check the actual border characters (first and last char), not content
    const contentLines = strippedLines.slice(1, -1);
    const leftBorders = contentLines.map(line => line[0]);
    const rightBorders = contentLines.map(line => line[line.length - 1]);
    
    const hasSingleLeft = leftBorders.some(char => char === '│' || char === '├');
    const hasDoubleLeft = leftBorders.some(char => char === '║' || char === '╠');
    const hasSingleRight = rightBorders.some(char => char === '│' || char === '┤');
    const hasDoubleRight = rightBorders.some(char => char === '║' || char === '╣');
    
    if ((hasSingleLeft && hasDoubleLeft) || (hasSingleRight && hasDoubleRight)) {
      issues.push('Mixed border styles detected (single and double)');
    }
    
    return {
      valid: issues.length === 0,
      width: expectedWidth,
      height: lines.length,
      issues,
      corners,
    };
  }
  
  /**
   * Validate multiple frames in content
   */
  static validateMultiple(content: string): FrameValidationResult[] {
    const results: FrameValidationResult[] = [];
    
    // Split content into potential frames
    // A frame starts with a top corner and ends with a bottom corner
    const lines = content.split(/\r?\n/);
    let currentFrame: string[] = [];
    let inFrame = false;
    
    for (const line of lines) {
      const stripped = this.stripANSI(line);
      
      // Skip empty lines between frames
      if (stripped.length === 0 && !inFrame) {
        continue;
      }
      
      // Check if this is a top border (start of frame)
      if (stripped.length > 0 && 
          (stripped[0] === '┌' || stripped[0] === '╔') &&
          !inFrame) {
        inFrame = true;
        currentFrame = [line];
        continue;
      }
      
      // If we're in a frame, add the line
      if (inFrame) {
        currentFrame.push(line);
        
        // Check if this is a bottom border (end of frame)
        if (stripped.length > 0 && 
            (stripped[0] === '└' || stripped[0] === '╚')) {
          const frameContent = currentFrame.join('\r\n');
          results.push(this.validate(frameContent));
          currentFrame = [];
          inFrame = false;
        }
      }
    }
    
    // Validate any remaining frame (incomplete frame)
    if (currentFrame.length > 0) {
      const frameContent = currentFrame.join('\r\n');
      results.push(this.validate(frameContent));
    }
    
    return results;
  }
  
  /**
   * Get a summary of validation results
   */
  static getSummary(results: FrameValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    issues: string[];
  } {
    const allIssues: string[] = [];
    
    results.forEach((result, index) => {
      if (!result.valid) {
        allIssues.push(`Frame ${index + 1}:`);
        allIssues.push(...result.issues.map(issue => `  - ${issue}`));
      }
    });
    
    return {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      issues: allIssues,
    };
  }
  
  /**
   * Assert that a frame is valid (for use in tests)
   */
  static assertValid(frameContent: string, message?: string): void {
    const result = this.validate(frameContent);
    
    if (!result.valid) {
      const errorMessage = message || 'Frame validation failed';
      const details = result.issues.join('\n  - ');
      throw new Error(`${errorMessage}:\n  - ${details}`);
    }
  }
}
