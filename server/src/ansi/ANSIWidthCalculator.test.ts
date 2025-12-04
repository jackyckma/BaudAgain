import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

describe('ANSIWidthCalculator', () => {
  describe('Unit Tests', () => {
    it('should calculate width of plain text', () => {
      expect(ANSIWidthCalculator.calculate('hello')).toBe(5);
      expect(ANSIWidthCalculator.calculate('test')).toBe(4);
      expect(ANSIWidthCalculator.calculate('')).toBe(0);
    });

    it('should strip ANSI codes when calculating width', () => {
      expect(ANSIWidthCalculator.calculate('\x1b[33mhello\x1b[0m')).toBe(5);
      expect(ANSIWidthCalculator.calculate('\x1b[1;31mtest\x1b[0m')).toBe(4);
    });

    it('should handle box-drawing characters as single-width', () => {
      expect(ANSIWidthCalculator.calculate('╔═╗')).toBe(3);
      expect(ANSIWidthCalculator.calculate('║ ║')).toBe(3);
      expect(ANSIWidthCalculator.calculate('╚═╝')).toBe(3);
    });

    it('should check if text fits in width', () => {
      expect(ANSIWidthCalculator.fitsIn('hello', 5)).toBe(true);
      expect(ANSIWidthCalculator.fitsIn('hello', 4)).toBe(false);
      expect(ANSIWidthCalculator.fitsIn('\x1b[33mhello\x1b[0m', 5)).toBe(true);
    });

    it('should truncate text to fit width', () => {
      expect(ANSIWidthCalculator.truncate('hello world', 8)).toBe('hello...');
      expect(ANSIWidthCalculator.truncate('hello', 10)).toBe('hello');
      expect(ANSIWidthCalculator.truncate('hello world', 8, '…')).toBe('hello w…');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: ansi-rendering-refactor, Property 4: Visual width calculation strips ANSI codes
     * Validates: Requirements 4.1
     * 
     * For any string with ANSI codes, visual width should equal the length of the 
     * string after stripping all ANSI escape codes.
     */
    it('Property 4: Visual width calculation strips ANSI codes', () => {
      // Generator for ANSI color codes
      const ansiCode = fc.oneof(
        fc.constant('\x1b[0m'),   // reset
        fc.constant('\x1b[1m'),   // bold
        fc.constant('\x1b[31m'),  // red
        fc.constant('\x1b[32m'),  // green
        fc.constant('\x1b[33m'),  // yellow
        fc.constant('\x1b[34m'),  // blue
        fc.constant('\x1b[35m'),  // magenta
        fc.constant('\x1b[36m'),  // cyan
        fc.constant('\x1b[37m'),  // white
        fc.constant('\x1b[1;31m') // bold red
      );

      // Generator for plain ASCII text (no wide characters for this property)
      const plainText = fc.stringOf(
        fc.char().filter(c => {
          const code = c.charCodeAt(0);
          // Only ASCII printable characters (no wide chars, no control chars)
          return code >= 32 && code <= 126;
        }),
        { minLength: 0, maxLength: 50 }
      );

      // Generator for text with ANSI codes
      // We'll wrap the text with ANSI codes or insert them between characters
      const textWithAnsi = fc.tuple(plainText, fc.array(ansiCode, { maxLength: 5 }))
        .map(([text, codes]) => {
          // Build result by interleaving ANSI codes with text characters
          // This ensures we don't break ANSI sequences
          let result = '';
          let codeIndex = 0;
          
          // Add some codes at the beginning
          if (codes.length > 0 && Math.random() > 0.5) {
            result += codes[codeIndex++];
          }
          
          // Add text with codes interspersed
          for (let i = 0; i < text.length; i++) {
            result += text[i];
            if (codeIndex < codes.length && Math.random() > 0.7) {
              result += codes[codeIndex++];
            }
          }
          
          // Add remaining codes at the end
          while (codeIndex < codes.length) {
            result += codes[codeIndex++];
          }
          
          return { original: text, withAnsi: result };
        });

      fc.assert(
        fc.property(textWithAnsi, ({ original, withAnsi }) => {
          const calculatedWidth = ANSIWidthCalculator.calculate(withAnsi);
          const expectedWidth = original.length;
          
          // The visual width should equal the original text length
          // (ANSI codes should not contribute to width)
          return calculatedWidth === expectedWidth;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty strings', () => {
      fc.assert(
        fc.property(fc.array(fc.constant('\x1b[0m')), (codes) => {
          const text = codes.join('');
          return ANSIWidthCalculator.calculate(text) === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should be consistent with fitsIn', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 50 }),
          fc.integer({ min: 0, max: 100 }),
          (text, width) => {
            const calculatedWidth = ANSIWidthCalculator.calculate(text);
            const fits = ANSIWidthCalculator.fitsIn(text, width);
            return fits === (calculatedWidth <= width);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
