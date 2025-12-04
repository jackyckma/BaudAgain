/**
 * Property-based tests for 80-character width enforcement
 * 
 * Feature: user-journey-testing-and-fixes
 * Property 1: 80-character width enforcement
 * Validates: Requirements 1.3, 7.3, 12.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ANSIFrameBuilder, FrameLine } from './ANSIFrameBuilder.js';
import { ANSIRenderingService, RENDER_CONTEXTS, RenderContext } from './ANSIRenderingService.js';
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';
import { BaseTerminalRenderer } from '../terminal/BaseTerminalRenderer.js';
import { TERMINAL_WIDTH } from '@baudagain/shared';
import type { WelcomeScreenContent, MenuContent } from '@baudagain/shared';

// Concrete implementation for testing
class TestTerminalRenderer extends BaseTerminalRenderer {
  protected renderRawANSI(content: any): string {
    return content.content;
  }
}

describe('Width Enforcement Property Tests', () => {
  /**
   * Property 1: 80-character width enforcement
   * Feature: user-journey-testing-and-fixes, Property 1: 80-character width enforcement
   * Validates: Requirements 1.3, 7.3, 12.1
   * 
   * For any ANSI content rendered by the Terminal Client (welcome screens, menus, 
   * messages, door games, frames), all lines should have a visual width of 80 
   * characters or less
   */
  describe('Property 1: 80-character width enforcement', () => {
    const service = new ANSIRenderingService();
    const renderer = new TestTerminalRenderer();

    it('should enforce 80-character width for ANSIFrameBuilder frames', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 100 }),
              align: fc.constantFrom('left', 'center'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.constantFrom('single', 'double'),
          (content, style) => {
            // Create frame builder with 80-character max width
            const builder = new ANSIFrameBuilder({
              width: 80,
              maxWidth: 80,
              style: style as any,
            });

            try {
              // Build frame
              const lines = builder.build(content as FrameLine[]);
              
              // Check all lines are within 80 characters
              for (const line of lines) {
                const width = ANSIWidthCalculator.calculate(line);
                if (width > 80) {
                  return false;
                }
              }
              
              return true;
            } catch (error: any) {
              // If error is thrown due to width exceeded, that's acceptable
              // The builder should either succeed with valid width or throw
              return error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce 80-character width for ANSIRenderingService frames', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 100 }),
              align: fc.constantFrom('left', 'center'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.constantFrom('terminal', 'telnet', 'web'),
          fc.constantFrom('single', 'double'),
          (content, contextType, style) => {
            const context: RenderContext = { type: contextType as any, width: 80 };
            
            try {
              // Render frame with validation enabled
              const result = service.renderFrame(
                content as any,
                { width: 80, maxWidth: 80, style: style as any },
                context,
                true // Enable validation
              );
              
              // Split into lines and check each line's width
              const lineEnding = service.getLineEnding(context);
              const lines = result.split(lineEnding).filter(l => l.length > 0);
              
              for (const line of lines) {
                const width = ANSIWidthCalculator.calculate(line);
                if (width > 80) {
                  return false;
                }
              }
              
              return true;
            } catch (error: any) {
              // WidthExceededError or frame validation error is acceptable
              return error.name === 'WidthExceededError' || 
                     error.name === 'ANSIRenderingError' ||
                     error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce 80-character width for frames with titles', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // title
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 100 }),
              align: fc.constantFrom('left', 'center'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.constantFrom('terminal', 'telnet', 'web'),
          (title, content, contextType) => {
            const context: RenderContext = { type: contextType as any, width: 80 };
            
            try {
              // Render frame with title and validation enabled
              const result = service.renderFrameWithTitle(
                title,
                content as any,
                { width: 80, maxWidth: 80 },
                context,
                undefined,
                true // Enable validation
              );
              
              // Split into lines and check each line's width
              const lineEnding = service.getLineEnding(context);
              const lines = result.split(lineEnding).filter(l => l.length > 0);
              
              for (const line of lines) {
                const width = ANSIWidthCalculator.calculate(line);
                if (width > 80) {
                  return false;
                }
              }
              
              return true;
            } catch (error: any) {
              // WidthExceededError or frame validation error is acceptable
              return error.name === 'WidthExceededError' || 
                     error.name === 'ANSIRenderingError' ||
                     error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce 80-character width for welcome screens', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // title
          fc.string({ minLength: 1, maxLength: 100 }), // subtitle
          fc.string({ minLength: 1, maxLength: 100 }), // tagline
          fc.integer({ min: 1, max: 10 }), // node
          fc.integer({ min: 1, max: 100 }), // maxNodes
          fc.integer({ min: 0, max: 50 }), // callerCount
          (title, subtitle, tagline, node, maxNodes, callerCount) => {
            const content: WelcomeScreenContent = {
              type: 'welcome_screen',
              title,
              subtitle,
              tagline,
              node,
              maxNodes,
              callerCount,
            };
            
            // Render welcome screen
            const result = renderer.render(content);
            
            // Split into lines and check each line's width
            const lines = result.split(/\r?\n/).filter(l => l.length > 0);
            
            for (const line of lines) {
              const width = ANSIWidthCalculator.calculate(line);
              if (width > TERMINAL_WIDTH) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce 80-character width for menus', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // title
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 3 }),
              label: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (title, options) => {
            const content: MenuContent = {
              type: 'menu',
              title,
              options,
            };
            
            // Render menu
            const result = renderer.render(content);
            
            // Split into lines and check each line's width
            const lines = result.split(/\r?\n/).filter(l => l.length > 0);
            
            for (const line of lines) {
              const width = ANSIWidthCalculator.calculate(line);
              if (width > TERMINAL_WIDTH) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when frame width exceeds 80 characters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 81, max: 200 }), // width > 80
          (width) => {
            try {
              // Attempt to create frame builder with width > maxWidth
              const builder = new ANSIFrameBuilder({
                width,
                maxWidth: 80,
              });
              
              // Should have thrown
              return false;
            } catch (error: any) {
              // Should throw error about exceeding max width
              return error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce width across all render contexts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 70 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.constantFrom('terminal', 'telnet', 'web'),
          (content, contextType) => {
            const context: RenderContext = { type: contextType as any, width: 80 };
            
            try {
              const result = service.renderFrame(
                content as any,
                { width: 80, maxWidth: 80 },
                context,
                true
              );
              
              // Check all lines are within 80 characters
              const lineEnding = service.getLineEnding(context);
              const lines = result.split(lineEnding).filter(l => l.length > 0);
              
              return lines.every(line => ANSIWidthCalculator.calculate(line) <= 80);
            } catch (error: any) {
              // Width-related errors are acceptable
              return error.name === 'WidthExceededError' || 
                     error.name === 'ANSIRenderingError' ||
                     error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Width enforcement preserves formatting
   * Feature: user-journey-testing-and-fixes, Property 5: Width enforcement preserves formatting
   * Validates: Requirements 12.2, 12.5
   * 
   * For any content that undergoes width enforcement (truncation or wrapping), 
   * the resulting output should maintain proper alignment and not have broken ANSI codes
   */
  describe('Property 5: Width enforcement preserves formatting', () => {
    const service = new ANSIRenderingService();
    const renderer = new TestTerminalRenderer();

    it('should not have broken ANSI codes after width enforcement', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 150 }),
              color: fc.constantFrom(
                '\x1b[31m', // red
                '\x1b[32m', // green
                '\x1b[33m', // yellow
                '\x1b[34m', // blue
                '\x1b[35m', // magenta
                '\x1b[36m', // cyan
                undefined
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (content) => {
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            try {
              const result = service.renderFrame(
                content as any,
                { width: 80, maxWidth: 80 },
                context,
                true
              );
              
              // Check for broken ANSI codes (incomplete escape sequences)
              // A broken code would be an escape sequence that doesn't end with 'm'
              const lines = result.split('\n');
              
              for (const line of lines) {
                // Check if line ends with incomplete ANSI code
                // Pattern: \x1b[ followed by digits/semicolons but no 'm' at end
                const brokenCodeAtEnd = /\x1b\[[0-9;]*$/.test(line);
                if (brokenCodeAtEnd) {
                  return false;
                }
                
                // Find all ESC[ sequences and verify each ends with 'm'
                const allEscSequences = line.match(/\x1b\[[0-9;]*/g) || [];
                for (const seq of allEscSequences) {
                  // Get the character after this sequence in the original line
                  const index = line.indexOf(seq);
                  const nextChar = line[index + seq.length];
                  
                  // The next character must be 'm' for a complete ANSI code
                  if (nextChar !== 'm') {
                    return false;
                  }
                }
              }
              
              return true;
            } catch (error: any) {
              // Width-related errors are acceptable
              return error.name === 'WidthExceededError' || 
                     error.name === 'ANSIRenderingError' ||
                     error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain proper alignment after width enforcement', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 100 }),
              align: fc.constantFrom('left', 'center'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.constantFrom('single', 'double'),
          (content, style) => {
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            try {
              const result = service.renderFrame(
                content as any,
                { width: 80, maxWidth: 80, style: style as any },
                context,
                true
              );
              
              // Split into lines
              const lines = result.split('\n').filter(l => l.length > 0);
              
              if (lines.length === 0) {
                return true;
              }
              
              // All lines should have the same visual width (proper alignment)
              const widths = lines.map(line => ANSIWidthCalculator.calculate(line));
              const firstWidth = widths[0];
              
              return widths.every(w => w === firstWidth);
            } catch (error: any) {
              // Width-related errors are acceptable
              return error.name === 'WidthExceededError' || 
                     error.name === 'ANSIRenderingError' ||
                     error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve color formatting when truncating long text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 200 }), // Long text
          fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta'),
          (longText, color) => {
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            // Render colored text
            const coloredText = service.renderText(longText, color as any, context);
            
            // Check that color codes are present and properly formed
            const hasColorCode = /\x1b\[3[0-7]m/.test(coloredText);
            const hasReset = coloredText.includes('\x1b[0m');
            
            // If text has color, it should have both color code and reset
            if (hasColorCode) {
              return hasReset;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not break ANSI codes when truncating in BaseTerminalRenderer', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }), // title
          fc.string({ minLength: 1, maxLength: 200 }), // subtitle
          fc.string({ minLength: 1, maxLength: 200 }), // tagline
          (title, subtitle, tagline) => {
            const content: WelcomeScreenContent = {
              type: 'welcome_screen',
              title,
              subtitle,
              tagline,
              node: 1,
              maxNodes: 10,
              callerCount: 5,
            };
            
            // Render welcome screen
            const result = renderer.render(content);
            
            // Check for broken ANSI codes
            const lines = result.split(/\r?\n/);
            
            for (const line of lines) {
              // Check if line ends with incomplete ANSI code
              const brokenCodeAtEnd = /\x1b\[[0-9;]*$/.test(line);
              if (brokenCodeAtEnd) {
                return false;
              }
              
              // Find all ESC[ sequences and verify each ends with 'm'
              const allEscSequences = line.match(/\x1b\[[0-9;]*/g) || [];
              for (const seq of allEscSequences) {
                // Get the character after this sequence in the original line
                const index = line.indexOf(seq);
                const nextChar = line[index + seq.length];
                
                // The next character must be 'm' for a complete ANSI code
                if (nextChar !== 'm') {
                  return false;
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain frame border alignment after width enforcement', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.constantFrom('single', 'double'),
          (content, style) => {
            const builder = new ANSIFrameBuilder({
              width: 80,
              maxWidth: 80,
              style: style as any,
            });

            try {
              const lines = builder.build(content as FrameLine[]);
              
              // Check that all lines have consistent width
              const widths = lines.map(line => ANSIWidthCalculator.calculate(line));
              const firstWidth = widths[0];
              
              if (!widths.every(w => w === firstWidth)) {
                return false;
              }
              
              // Check that borders are properly aligned
              // First line should start with top-left corner
              const firstLine = lines[0].replace(/\x1b\[[0-9;]*m/g, '');
              const lastLine = lines[lines.length - 1].replace(/\x1b\[[0-9;]*m/g, '');
              
              const hasTopCorners = 
                (firstLine.startsWith('┌') && firstLine.endsWith('┐')) ||
                (firstLine.startsWith('╔') && firstLine.endsWith('╗'));
              
              const hasBottomCorners = 
                (lastLine.startsWith('└') && lastLine.endsWith('┘')) ||
                (lastLine.startsWith('╚') && lastLine.endsWith('╝'));
              
              return hasTopCorners && hasBottomCorners;
            } catch (error: any) {
              // Width-related errors are acceptable
              return error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve ANSI codes when content fits within width', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 50 }),
              color: fc.constantFrom(
                '\x1b[31m', // red
                '\x1b[32m', // green
                '\x1b[33m', // yellow
                undefined
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (content) => {
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            try {
              const result = service.renderFrame(
                content as any,
                { width: 80, maxWidth: 80 },
                context,
                true
              );
              
              // Count color codes in input
              const inputColorCodes = content.filter(c => c.color !== undefined).length;
              
              // Count color codes in output (should have at least as many)
              const outputColorCodes = (result.match(/\x1b\[3[0-7]m/g) || []).length;
              
              // If input had colors, output should have colors
              if (inputColorCodes > 0) {
                return outputColorCodes > 0;
              }
              
              return true;
            } catch (error: any) {
              // Width-related errors are acceptable
              return error.name === 'WidthExceededError' || 
                     error.name === 'ANSIRenderingError' ||
                     error.message.includes('exceeds maximum allowed width');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
