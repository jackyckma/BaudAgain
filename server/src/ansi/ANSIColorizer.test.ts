import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ANSIColorizer, ColorName } from './ANSIColorizer.js';
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

describe('ANSIColorizer', () => {
  describe('Unit Tests', () => {
    it('should colorize text with named colors', () => {
      const text = 'hello';
      const colored = ANSIColorizer.colorize(text, 'red');
      
      expect(colored).toContain('hello');
      expect(colored).toContain('\x1b[31m'); // red code
      expect(colored).toContain('\x1b[0m');  // reset code
    });

    it('should add reset codes automatically', () => {
      const colors: ColorName[] = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'gray'];
      
      for (const color of colors) {
        const colored = ANSIColorizer.colorize('test', color);
        expect(colored).toMatch(/\x1b\[0m$/); // Should end with reset
      }
    });

    it('should strip all ANSI codes', () => {
      const colored = ANSIColorizer.colorize('hello', 'red');
      const stripped = ANSIColorizer.strip(colored);
      
      expect(stripped).toBe('hello');
      expect(stripped).not.toContain('\x1b');
    });

    it('should convert ANSI to HTML', () => {
      const colored = ANSIColorizer.colorize('hello', 'red');
      const html = ANSIColorizer.toHTML(colored);
      
      expect(html).toContain('<span');
      expect(html).toContain('color:');
      expect(html).toContain('hello');
      expect(html).not.toContain('\x1b');
    });

    it('should handle text without ANSI codes', () => {
      const plain = 'hello world';
      expect(ANSIColorizer.strip(plain)).toBe(plain);
      expect(ANSIColorizer.toHTML(plain)).toBe(plain);
    });

    it('should handle empty strings', () => {
      expect(ANSIColorizer.colorize('', 'red')).toBe('\x1b[31m\x1b[0m');
      expect(ANSIColorizer.strip('')).toBe('');
      expect(ANSIColorizer.toHTML('')).toBe('');
    });
  });

  describe('Property-Based Tests', () => {
    const colorGen = fc.constantFrom<ColorName>(
      'red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'gray'
    );

    const plainTextGen = fc.stringOf(
      fc.char().filter(c => {
        const code = c.charCodeAt(0);
        // Only ASCII printable characters
        return code >= 32 && code <= 126;
      }),
      { minLength: 0, maxLength: 100 }
    );

    /**
     * Feature: ansi-rendering-refactor, Property 3: Colorization preserves visual width
     * Validates: Requirements 3.4
     * 
     * For any text, applying color codes should not change its visual width.
     */
    it('Property 3: Colorization preserves visual width', () => {
      fc.assert(
        fc.property(plainTextGen, colorGen, (text, color) => {
          const originalWidth = ANSIWidthCalculator.calculate(text);
          const colorized = ANSIColorizer.colorize(text, color);
          const colorizedWidth = ANSIWidthCalculator.calculate(colorized);
          
          // Visual width should be unchanged after colorization
          return originalWidth === colorizedWidth;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: ansi-rendering-refactor, Property 9: Colors include reset codes
     * Validates: Requirements 7.2
     * 
     * For any text with color applied, the output should end with an ANSI reset code.
     */
    it('Property 9: Colors include reset codes', () => {
      fc.assert(
        fc.property(plainTextGen, colorGen, (text, color) => {
          const colorized = ANSIColorizer.colorize(text, color);
          
          // Should end with reset code
          return colorized.endsWith('\x1b[0m');
        }),
        { numRuns: 100 }
      );
    });

    it('should strip all ANSI codes from colorized text', () => {
      fc.assert(
        fc.property(plainTextGen, colorGen, (text, color) => {
          const colorized = ANSIColorizer.colorize(text, color);
          const stripped = ANSIColorizer.strip(colorized);
          
          // Stripped text should equal original
          return stripped === text;
        }),
        { numRuns: 100 }
      );
    });

    it('should produce HTML without ANSI codes', () => {
      fc.assert(
        fc.property(plainTextGen, colorGen, (text, color) => {
          const colorized = ANSIColorizer.colorize(text, color);
          const html = ANSIColorizer.toHTML(colorized);
          
          // HTML should not contain ANSI escape sequences
          return !html.includes('\x1b');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve text content in HTML conversion', () => {
      fc.assert(
        fc.property(plainTextGen, colorGen, (text, color) => {
          const colorized = ANSIColorizer.colorize(text, color);
          const html = ANSIColorizer.toHTML(colorized);
          
          // HTML should contain the original text
          return html.includes(text);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple colorizations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(plainTextGen, colorGen), { minLength: 1, maxLength: 5 }),
          (pairs) => {
            const parts = pairs.map(([text, color]) => ANSIColorizer.colorize(text, color));
            const combined = parts.join('');
            
            // Each part should end with reset
            const allHaveReset = parts.every(part => part.endsWith('\x1b[0m'));
            
            // Combined text should strip back to original
            const originalText = pairs.map(([text]) => text).join('');
            const stripped = ANSIColorizer.strip(combined);
            
            return allHaveReset && stripped === originalText;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
