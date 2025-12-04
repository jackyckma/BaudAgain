/**
 * ANSIValidator - Validates rendered ANSI output
 * 
 * This utility provides validation functions for rendered ANSI content:
 * - Frame alignment validation
 * - Width consistency validation
 * - Border integrity validation
 * - Detailed error messages
 */

import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  width?: number;
  height?: number;
}

export class ANSIValidator {
  /**
   * Box-drawing characters for different border styles
   */
  private static readonly BORDER_CHARS = {
    single: {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
    },
    double: {
      topLeft: '╔',
      topRight: '╗',
      bottomLeft: '╚',
      bottomRight: '╝',
      horizontal: '═',
      vertical: '║',
    },
  };

  /**
   * Validate frame alignment (all lines have same visual width)
   * 
   * @param content - Frame content to validate
   * @returns Validation result with issues if any
   */
  static validateFrame(content: string): ValidationResult {
    const lines = content.split(/\r?\n/).filter(line => line.length > 0);
    const issues: string[] = [];

    if (lines.length === 0) {
      return {
        valid: false,
        issues: ['Frame is empty'],
      };
    }

    // Calculate visual width for each line
    const widths = lines.map(line => ANSIWidthCalculator.calculate(line));
    const expectedWidth = widths[0];

    // Check all lines have same width
    widths.forEach((width, index) => {
      if (width !== expectedWidth) {
        issues.push(
          `Line ${index + 1} has width ${width}, expected ${expectedWidth}`
        );
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      width: expectedWidth,
      height: lines.length,
    };
  }

  /**
   * Validate all lines have same width
   * 
   * @param lines - Array of lines to validate
   * @returns Validation result with issues if any
   */
  static validateWidth(lines: string[]): ValidationResult {
    const issues: string[] = [];

    if (lines.length === 0) {
      return {
        valid: true,
        issues: [],
        width: 0,
        height: 0,
      };
    }

    const widths = lines.map(line => ANSIWidthCalculator.calculate(line));
    const expectedWidth = widths[0];

    widths.forEach((width, index) => {
      if (width !== expectedWidth) {
        issues.push(
          `Line ${index + 1} width mismatch: expected ${expectedWidth}, got ${width}`
        );
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      width: expectedWidth,
      height: lines.length,
    };
  }

  /**
   * Validate borders are intact
   * 
   * @param content - Frame content to validate
   * @param style - Border style ('single' or 'double')
   * @returns Validation result with issues if any
   */
  static validateBorders(content: string, style: 'single' | 'double'): ValidationResult {
    const lines = content.split(/\r?\n/).filter(line => line.length > 0);
    const issues: string[] = [];

    if (lines.length === 0) {
      return {
        valid: false,
        issues: ['Frame is empty'],
      };
    }

    if (lines.length < 3) {
      return {
        valid: false,
        issues: ['Frame must have at least 3 lines (top border, content, bottom border)'],
      };
    }

    // Strip ANSI codes for border checking
    const strippedLines = lines.map(line => 
      line.replace(/\x1b\[[0-9;]*m/g, '')
    );

    const borders = this.BORDER_CHARS[style];
    const firstLine = strippedLines[0];
    const lastLine = strippedLines[strippedLines.length - 1];
    const width = ANSIWidthCalculator.calculate(lines[0]);

    // Validate top-left corner
    if (firstLine[0] !== borders.topLeft) {
      issues.push(
        `Top-left corner is '${firstLine[0]}', expected '${borders.topLeft}' for ${style} border`
      );
    }

    // Validate top-right corner
    if (firstLine[width - 1] !== borders.topRight) {
      issues.push(
        `Top-right corner is '${firstLine[width - 1]}', expected '${borders.topRight}' for ${style} border`
      );
    }

    // Validate bottom-left corner
    if (lastLine[0] !== borders.bottomLeft) {
      issues.push(
        `Bottom-left corner is '${lastLine[0]}', expected '${borders.bottomLeft}' for ${style} border`
      );
    }

    // Validate bottom-right corner
    if (lastLine[width - 1] !== borders.bottomRight) {
      issues.push(
        `Bottom-right corner is '${lastLine[width - 1]}', expected '${borders.bottomRight}' for ${style} border`
      );
    }

    // Validate top border (all horizontal characters between corners)
    for (let i = 1; i < width - 1; i++) {
      if (firstLine[i] !== borders.horizontal) {
        issues.push(
          `Top border character at position ${i} is '${firstLine[i]}', expected '${borders.horizontal}'`
        );
        break; // Only report first issue
      }
    }

    // Validate bottom border
    for (let i = 1; i < width - 1; i++) {
      if (lastLine[i] !== borders.horizontal) {
        issues.push(
          `Bottom border character at position ${i} is '${lastLine[i]}', expected '${borders.horizontal}'`
        );
        break;
      }
    }

    // Validate vertical borders (skip first and last line)
    for (let i = 1; i < strippedLines.length - 1; i++) {
      const line = strippedLines[i];

      if (line[0] !== borders.vertical) {
        issues.push(
          `Line ${i + 1} left border is '${line[0]}', expected '${borders.vertical}'`
        );
      }

      if (line[width - 1] !== borders.vertical) {
        issues.push(
          `Line ${i + 1} right border is '${line[width - 1]}', expected '${borders.vertical}'`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      width,
      height: lines.length,
    };
  }

  /**
   * Validate that content fits within a maximum width
   * 
   * @param content - Content to validate
   * @param maxWidth - Maximum allowed width
   * @returns Validation result with issues if any
   */
  static validateMaxWidth(content: string, maxWidth: number): ValidationResult {
    const lines = content.split(/\r?\n/).filter(line => line.length > 0);
    const issues: string[] = [];

    lines.forEach((line, index) => {
      const width = ANSIWidthCalculator.calculate(line);
      if (width > maxWidth) {
        issues.push(
          `Line ${index + 1} width ${width} exceeds maximum ${maxWidth}`
        );
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Assert that content is valid (throws if not)
   * Useful for tests
   * 
   * @param content - Content to validate
   * @param validator - Validation function to use
   * @param message - Optional error message prefix
   */
  static assertValid(
    content: string,
    validator: (content: string) => ValidationResult,
    message?: string
  ): void {
    const result = validator(content);

    if (!result.valid) {
      const prefix = message || 'Validation failed';
      const details = result.issues.join('\n  - ');
      throw new Error(`${prefix}:\n  - ${details}`);
    }
  }
}
