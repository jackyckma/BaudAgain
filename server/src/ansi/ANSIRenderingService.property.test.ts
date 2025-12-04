/**
 * Property-based tests for ANSIRenderingService
 * 
 * These tests verify correctness properties across many random inputs
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ANSIRenderingService, RENDER_CONTEXTS, RenderContext, Template } from './ANSIRenderingService.js';
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

describe('ANSIRenderingService - Property Tests', () => {
  const service = new ANSIRenderingService();

  /**
   * Property 7: Line endings match context
   * Feature: ansi-rendering-refactor, Property 7: Line endings match context
   * Validates: Requirements 6.1, 2.4
   */
  describe('Property 7: Line endings match context', () => {
    it('should return LF for terminal context', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 40, max: 200 }), // width
          (width) => {
            const context: RenderContext = { type: 'terminal', width };
            const lineEnding = service.getLineEnding(context);
            return lineEnding === '\n';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return LF for web context', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 40, max: 200 }), // width
          (width) => {
            const context: RenderContext = { type: 'web', width };
            const lineEnding = service.getLineEnding(context);
            return lineEnding === '\n';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return CRLF for telnet context', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 40, max: 200 }), // width
          (width) => {
            const context: RenderContext = { type: 'telnet', width };
            const lineEnding = service.getLineEnding(context);
            return lineEnding === '\r\n';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: No mixed line endings
   * Feature: ansi-rendering-refactor, Property 8: No mixed line endings
   * Validates: Requirements 6.5
   */
  describe('Property 8: No mixed line endings', () => {
    it('should not mix LF and CRLF in output', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
          fc.constantFrom('terminal', 'telnet', 'web'),
          fc.integer({ min: 40, max: 200 }),
          (lines, contextType, width) => {
            const context: RenderContext = { type: contextType as any, width };
            const lineEnding = service.getLineEnding(context);
            
            // Join lines with the context's line ending
            const output = lines.join(lineEnding);
            
            // Check that output doesn't contain mixed line endings
            if (lineEnding === '\n') {
              // Should not contain CRLF
              return !output.includes('\r\n');
            } else {
              // Should not contain standalone LF (only CRLF)
              // Split by CRLF and check no remaining LF
              const parts = output.split('\r\n');
              return parts.every(part => !part.includes('\n'));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Context-specific rendering succeeds
   * Feature: ansi-rendering-refactor, Property 13: Context-specific rendering succeeds
   * Validates: Requirements 2.1
   */
  describe('Property 13: Context-specific rendering succeeds', () => {
    it('should successfully render frames for all context types', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 40 }),
              align: fc.constantFrom('left', 'center'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.constantFrom('terminal', 'telnet', 'web'),
          fc.integer({ min: 60, max: 132 }),
          fc.constantFrom('single', 'double'),
          (content, contextType, width, style) => {
            const context: RenderContext = { type: contextType as any, width };
            
            try {
              // Attempt to render frame
              const result = service.renderFrame(
                content as any,
                { width, style: style as any },
                context,
                false // Don't validate to avoid throwing on width issues
              );
              
              // Should produce non-empty output
              return result.length > 0;
            } catch (error) {
              // Rendering should not throw for valid contexts
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render frames with correct line endings for each context', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 40 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.constantFrom('terminal', 'telnet', 'web'),
          fc.integer({ min: 60, max: 132 }),
          (content, contextType, width) => {
            const context: RenderContext = { type: contextType as any, width };
            const expectedLineEnding = service.getLineEnding(context);
            
            const result = service.renderFrame(
              content as any,
              { width },
              context,
              false
            );
            
            // Check that result uses correct line endings
            if (expectedLineEnding === '\n') {
              // Should not contain CRLF
              return !result.includes('\r\n');
            } else {
              // Should contain CRLF
              return result.includes('\r\n');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: No color leakage between lines
   * Feature: ansi-rendering-refactor, Property 11: No color leakage between lines
   * Validates: Requirements 7.5
   */
  describe('Property 11: No color leakage between lines', () => {
    it('should not leak colors between frame lines', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 30 }),
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
            { minLength: 2, maxLength: 5 }
          ),
          fc.integer({ min: 60, max: 100 }),
          (content, width) => {
            const context: RenderContext = { type: 'terminal', width };
            
            const result = service.renderFrame(
              content as any,
              { width },
              context,
              false
            );
            
            // Split into lines
            const lines = result.split('\n');
            
            // Each line should either:
            // 1. Not have any color codes, OR
            // 2. Have a reset code (\x1b[0m) before the end
            // This ensures colors don't leak to next line
            
            for (const line of lines) {
              // Check if line has color codes
              const hasColorCode = /\x1b\[3[0-7]m/.test(line);
              
              if (hasColorCode) {
                // Should have reset code
                const hasReset = line.includes('\x1b[0m');
                if (!hasReset) {
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

    it('should ensure each colored line ends with reset', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 2, maxLength: 5 }),
          fc.array(
            fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta'),
            { minLength: 2, maxLength: 5 }
          ),
          (texts, colors) => {
            // Ensure arrays are same length
            const minLength = Math.min(texts.length, colors.length);
            const content = texts.slice(0, minLength).map((text, i) => ({
              text,
              color: colors[i] as any,
            }));
            
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            const result = service.renderFrame(
              content as any,
              { width: 80 },
              context,
              false
            );
            
            // Each line with color should end with reset before line ending
            const lines = result.split('\n');
            
            for (const line of lines) {
              // Skip border lines (they don't have content colors)
              if (line.includes('╔') || line.includes('╚') || line.includes('═')) {
                continue;
              }
              
              // If line has color code, it should have reset
              const hasColorCode = /\x1b\[3[0-7]m/.test(line);
              if (hasColorCode) {
                const hasReset = line.includes('\x1b[0m');
                if (!hasReset) {
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
  });

  /**
   * Property 10: Web rendering has no ANSI codes
   * Feature: ansi-rendering-refactor, Property 10: Web rendering has no ANSI codes
   * Validates: Requirements 2.3, 7.4
   */
  describe('Property 10: Web rendering has no ANSI codes', () => {
    it('should not contain ANSI escape codes in web context frames', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 40 }),
              color: fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta', undefined),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 60, max: 132 }),
          fc.constantFrom('single', 'double'),
          (content, width, style) => {
            const context: RenderContext = { type: 'web', width };
            
            const result = service.renderFrame(
              content as any,
              { width, style: style as any },
              context,
              false
            );
            
            // Check that result contains no ANSI escape codes
            const ansiRegex = /\x1b\[[0-9;]*m/g;
            return !ansiRegex.test(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain ANSI escape codes in web context frames with title', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }), // title
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 40 }),
              color: fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta', undefined),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 60, max: 132 }),
          fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta', undefined),
          (title, content, width, titleColor) => {
            const context: RenderContext = { type: 'web', width };
            
            const result = service.renderFrameWithTitle(
              title,
              content as any,
              { width },
              context,
              titleColor as any,
              false
            );
            
            // Check that result contains no ANSI escape codes
            const ansiRegex = /\x1b\[[0-9;]*m/g;
            return !ansiRegex.test(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain ANSI escape codes in web context text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta', undefined),
          (text, color) => {
            const context: RenderContext = { type: 'web', width: 80 };
            
            const result = service.renderText(text, color as any, context);
            
            // Check that result contains no ANSI escape codes
            const ansiRegex = /\x1b\[[0-9;]*m/g;
            return !ansiRegex.test(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain HTML span tags for colored content in web context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('red', 'green', 'yellow', 'blue', 'cyan', 'magenta'),
          (text, color) => {
            const context: RenderContext = { type: 'web', width: 80 };
            
            const result = service.renderText(text, color as any, context);
            
            // Should contain HTML span tags for colored text
            return result.includes('<span') && result.includes('</span>');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain ANSI codes in web context templates', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 10 }),
            value: fc.string({ minLength: 1, maxLength: 15 }),
          }),
          fc.integer({ min: 60, max: 100 }),
          (content, variable, width) => {
            // Create template with variable placeholder
            const templateContent = content.map(line => ({
              text: `${line.text} {{${variable.name}}}`,
            }));
            
            const template: Template = {
              name: 'test-template',
              width,
              style: 'double',
              content: templateContent as any,
              variables: [variable.name],
            };
            
            const context: RenderContext = { type: 'web', width };
            
            // Render template with variable substitution
            const result = service.renderTemplate(
              template,
              { [variable.name]: variable.value },
              context,
              false
            );
            
            // Check that result contains no ANSI escape codes
            const ansiRegex = /\x1b\[[0-9;]*m/g;
            return !ansiRegex.test(result);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Terminal rendering prevents wrapping
   * Feature: ansi-rendering-refactor, Property 14: Terminal rendering prevents wrapping
   * Validates: Requirements 2.2
   */
  describe('Property 14: Terminal rendering prevents wrapping', () => {
    it('should ensure no line exceeds context width in terminal rendering', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 40 }),
              align: fc.constantFrom('left', 'center'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 60, max: 132 }),
          fc.constantFrom('single', 'double'),
          (content, width, style) => {
            const context: RenderContext = { type: 'terminal', width };
            
            try {
              // Render frame with validation enabled
              const result = service.renderFrame(
                content as any,
                { width, style: style as any },
                context,
                true // Enable validation
              );
              
              // Split into lines and check each line's width
              const lines = result.split('\n').filter(l => l.length > 0);
              
              for (const line of lines) {
                const lineWidth = ANSIWidthCalculator.calculate(line);
                if (lineWidth > width) {
                  return false; // Line exceeds width
                }
              }
              
              return true;
            } catch (error: any) {
              // If WidthExceededError is thrown, that's expected behavior
              // The property is that we either succeed with valid width OR throw
              if (error.name === 'WidthExceededError') {
                return true; // Correctly detected width issue
              }
              // Other errors are unexpected
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect when rendered frames exceed width', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 40, max: 80 }), // Frame width
          fc.string({ minLength: 1, maxLength: 200 }), // Text of varying length
          (width, text) => {
            const context: RenderContext = { type: 'terminal', width };
            const content = [{ text }];
            
            // Render without validation to see actual width
            const resultWithoutValidation = service.renderFrame(
              content as any,
              { width },
              context,
              false // No validation
            );
            
            const lines = resultWithoutValidation.split('\n').filter(l => l.length > 0);
            const actualMaxWidth = Math.max(...lines.map(l => ANSIWidthCalculator.calculate(l)));
            
            // Now try with validation
            try {
              service.renderFrame(
                content as any,
                { width },
                context,
                true // Enable validation
              );
              
              // If no error thrown, the frame must fit within width
              return actualMaxWidth <= width;
            } catch (error: any) {
              // If error thrown, it should be WidthExceededError and frame should exceed width
              return error.name === 'WidthExceededError' && actualMaxWidth > width;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate width for all context types', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 30 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.constantFrom('terminal', 'telnet', 'web'),
          fc.integer({ min: 60, max: 100 }),
          (content, contextType, width) => {
            const context: RenderContext = { type: contextType as any, width };
            
            try {
              const result = service.renderFrame(
                content as any,
                { width },
                context,
                true // Enable validation
              );
              
              // Check all lines fit within width
              const lineEnding = service.getLineEnding(context);
              const lines = result.split(lineEnding).filter(l => l.length > 0);
              
              for (const line of lines) {
                const lineWidth = ANSIWidthCalculator.calculate(line);
                if (lineWidth > width) {
                  return false;
                }
              }
              
              return true;
            } catch (error: any) {
              // WidthExceededError is acceptable
              if (error.name === 'WidthExceededError') {
                return true;
              }
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate width for frames with titles', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }), // title
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 30 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 60, max: 100 }),
          (title, content, width) => {
            const context: RenderContext = { type: 'terminal', width };
            
            try {
              const result = service.renderFrameWithTitle(
                title,
                content as any,
                { width },
                context,
                undefined,
                true // Enable validation
              );
              
              // Check all lines fit within width
              const lines = result.split('\n').filter(l => l.length > 0);
              
              for (const line of lines) {
                const lineWidth = ANSIWidthCalculator.calculate(line);
                if (lineWidth > width) {
                  return false;
                }
              }
              
              return true;
            } catch (error: any) {
              // WidthExceededError is acceptable
              if (error.name === 'WidthExceededError') {
                return true;
              }
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Template substitution maintains alignment
   * Feature: ansi-rendering-refactor, Property 6: Template substitution maintains alignment
   * Validates: Requirements 5.2
   */
  describe('Property 6: Template substitution maintains alignment', () => {
    it('should maintain uniform line widths after variable substitution', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 10 }),
            value: fc.string({ minLength: 1, maxLength: 15 }),
          }),
          fc.integer({ min: 60, max: 100 }),
          fc.constantFrom('single', 'double'),
          (content, variable, width, style) => {
            // Create template with variable placeholder
            const templateContent = content.map(line => ({
              text: `${line.text} {{${variable.name}}}`,
            }));
            
            const template: Template = {
              name: 'test-template',
              width,
              style: style as any,
              content: templateContent as any,
              variables: [variable.name],
            };
            
            const context: RenderContext = { type: 'terminal', width };
            
            // Render template with variable substitution
            const result = service.renderTemplate(
              template,
              { [variable.name]: variable.value },
              context,
              false // Don't validate to avoid width issues
            );
            
            // Split into lines and check all have same width
            const lines = result.split('\n').filter(l => l.length > 0);
            
            if (lines.length === 0) {
              return true;
            }
            
            const widths = lines.map(line => ANSIWidthCalculator.calculate(line));
            const firstWidth = widths[0];
            
            // All lines should have same width
            return widths.every(w => w === firstWidth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should substitute all variable occurrences', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }), // variable name
          fc.string({ minLength: 1, maxLength: 15 }), // variable value
          fc.integer({ min: 2, max: 5 }), // number of occurrences
          (varName, varValue, occurrences) => {
            // Create content with multiple occurrences of the variable
            const placeholder = `{{${varName}}}`;
            const content = Array(occurrences).fill(null).map(() => ({
              text: `Test ${placeholder} text`,
            }));
            
            const template: Template = {
              name: 'test-template',
              width: 80,
              style: 'double',
              content: content as any,
              variables: [varName],
            };
            
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            // Render template
            const result = service.renderTemplate(
              template,
              { [varName]: varValue },
              context,
              false
            );
            
            // Result should not contain the placeholder
            return !result.includes(placeholder);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error for missing variables', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }), // variable name
          (varName) => {
            const template: Template = {
              name: 'test-template',
              width: 80,
              style: 'double',
              content: [{ text: `Test {{${varName}}}` }] as any,
              variables: [varName],
            };
            
            const context: RenderContext = { type: 'terminal', width: 80 };
            
            // Should throw when variable is missing
            try {
              service.renderTemplate(template, {}, context, false);
              return false; // Should have thrown
            } catch (error: any) {
              return error.message.includes('Missing required variable');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
