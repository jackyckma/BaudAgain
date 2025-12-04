import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ANSIValidator } from './ANSIValidator.js';
import { ANSIColorizer } from './ANSIColorizer.js';

describe('ANSIValidator', () => {
  describe('Unit Tests', () => {
    it('should validate frame with uniform width', () => {
      const frame = [
        '╔════════╗',
        '║ Hello  ║',
        '║ World  ║',
        '╚════════╝',
      ].join('\n');

      const result = ANSIValidator.validateFrame(frame);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.width).toBe(10);
      expect(result.height).toBe(4);
    });

    it('should detect width mismatch', () => {
      const frame = [
        '╔════════╗',
        '║ Hello  ║',
        '║ World ║', // One character short
        '╚════════╝',
      ].join('\n');

      const result = ANSIValidator.validateFrame(frame);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('Line 3');
    });

    it('should validate lines with same width', () => {
      const lines = ['hello', 'world', 'test!'];
      const result = ANSIValidator.validateWidth(lines);
      
      expect(result.valid).toBe(true);
      expect(result.width).toBe(5);
    });

    it('should detect line width mismatch', () => {
      const lines = ['hello', 'world', 'test'];
      const result = ANSIValidator.validateWidth(lines);
      
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should validate single-style borders', () => {
      const frame = [
        '┌────────┐',
        '│ Hello  │',
        '│ World  │',
        '└────────┘',
      ].join('\n');

      const result = ANSIValidator.validateBorders(frame, 'single');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should validate double-style borders', () => {
      const frame = [
        '╔════════╗',
        '║ Hello  ║',
        '║ World  ║',
        '╚════════╝',
      ].join('\n');

      const result = ANSIValidator.validateBorders(frame, 'double');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect incorrect border style', () => {
      const frame = [
        '┌────────┐', // Single style
        '│ Hello  │',
        '│ World  │',
        '└────────┘',
      ].join('\n');

      const result = ANSIValidator.validateBorders(frame, 'double');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should validate max width', () => {
      const content = [
        'hello',
        'world',
        'test',
      ].join('\n');

      const result = ANSIValidator.validateMaxWidth(content, 10);
      expect(result.valid).toBe(true);
    });

    it('should detect width exceeding max', () => {
      const content = [
        'hello world this is too long',
        'short',
      ].join('\n');

      const result = ANSIValidator.validateMaxWidth(content, 10);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle empty frames', () => {
      const result = ANSIValidator.validateFrame('');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Frame is empty');
    });

    it('should handle frames with ANSI codes', () => {
      const frame = [
        ANSIColorizer.colorize('╔════════╗', 'yellow'),
        ANSIColorizer.colorize('║ Hello  ║', 'yellow'),
        ANSIColorizer.colorize('║ World  ║', 'yellow'),
        ANSIColorizer.colorize('╚════════╝', 'yellow'),
      ].join('\n');

      const result = ANSIValidator.validateFrame(frame);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(10); // Visual width, not including ANSI codes
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: ansi-rendering-refactor, Property 12: Validation provides specific errors
     * Validates: Requirements 9.2
     * 
     * For any invalid ANSI content, validation should return at least one specific 
     * error message describing the issue.
     */
    it('Property 12: Validation provides specific errors', () => {
      // Generator for frames with intentional width mismatches
      const invalidFrameGen = fc.tuple(
        fc.integer({ min: 5, max: 20 }), // base width
        fc.integer({ min: 1, max: 5 })   // width difference
      ).map(([baseWidth, diff]) => {
        // Create a frame where one line is shorter
        const line1 = '═'.repeat(baseWidth);
        const line2 = '═'.repeat(baseWidth - diff); // Intentionally shorter
        const line3 = '═'.repeat(baseWidth);
        
        return [
          `╔${line1}╗`,
          `║${' '.repeat(baseWidth)}║`,
          `║${' '.repeat(baseWidth - diff)}║`, // Shorter line
          `╚${line3}╝`,
        ].join('\n');
      });

      fc.assert(
        fc.property(invalidFrameGen, (frame) => {
          const result = ANSIValidator.validateFrame(frame);
          
          // Should be invalid
          if (result.valid) {
            return false;
          }
          
          // Should have at least one issue
          if (result.issues.length === 0) {
            return false;
          }
          
          // Each issue should be a non-empty string
          const allIssuesAreStrings = result.issues.every(
            issue => typeof issue === 'string' && issue.length > 0
          );
          
          // Issues should mention line numbers or specific problems
          const issuesAreSpecific = result.issues.some(
            issue => issue.includes('Line') || issue.includes('width')
          );
          
          return allIssuesAreStrings && issuesAreSpecific;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate uniform width frames as valid', () => {
      // Generator for valid frames with uniform width
      const validFrameGen = fc.tuple(
        fc.integer({ min: 5, max: 20 }), // width
        fc.integer({ min: 2, max: 10 })  // content lines
      ).map(([width, contentLines]) => {
        const lines = [`╔${'═'.repeat(width)}╗`];
        
        for (let i = 0; i < contentLines; i++) {
          lines.push(`║${' '.repeat(width)}║`);
        }
        
        lines.push(`╚${'═'.repeat(width)}╝`);
        
        return lines.join('\n');
      });

      fc.assert(
        fc.property(validFrameGen, (frame) => {
          const result = ANSIValidator.validateFrame(frame);
          return result.valid && result.issues.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle ANSI codes in validation', () => {
      const colorGen = fc.constantFrom('red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'gray');
      
      const coloredFrameGen = fc.tuple(
        fc.integer({ min: 5, max: 20 }),
        fc.integer({ min: 2, max: 10 }),
        colorGen
      ).map(([width, contentLines, color]) => {
        const lines = [ANSIColorizer.colorize(`╔${'═'.repeat(width)}╗`, color as any)];
        
        for (let i = 0; i < contentLines; i++) {
          lines.push(ANSIColorizer.colorize(`║${' '.repeat(width)}║`, color as any));
        }
        
        lines.push(ANSIColorizer.colorize(`╚${'═'.repeat(width)}╝`, color as any));
        
        return lines.join('\n');
      });

      fc.assert(
        fc.property(coloredFrameGen, (frame) => {
          const result = ANSIValidator.validateFrame(frame);
          // Colored frames should still validate correctly
          return result.valid;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate max width consistently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 10, max: 100 }),
          (lines, maxWidth) => {
            const content = lines.join('\n');
            const result = ANSIValidator.validateMaxWidth(content, maxWidth);
            
            // Manually check if any line exceeds max width
            const hasExceeding = lines.some(line => {
              // Strip ANSI codes for width calculation
              const stripped = line.replace(/\x1b\[[0-9;]*m/g, '');
              return stripped.length > maxWidth;
            });
            
            // Result should match manual check
            return result.valid === !hasExceeding;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect border style mismatches', () => {
      // Generate frames with wrong border style
      const wrongStyleGen = fc.tuple(
        fc.integer({ min: 5, max: 20 }),
        fc.constantFrom('single', 'double')
      ).map(([width, style]) => {
        // Create frame with opposite style
        const actualStyle = style === 'single' ? 'double' : 'single';
        const chars = actualStyle === 'single' 
          ? { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }
          : { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };
        
        const frame = [
          `${chars.tl}${chars.h.repeat(width)}${chars.tr}`,
          `${chars.v}${' '.repeat(width)}${chars.v}`,
          `${chars.bl}${chars.h.repeat(width)}${chars.br}`,
        ].join('\n');
        
        return { frame, expectedStyle: style as 'single' | 'double' };
      });

      fc.assert(
        fc.property(wrongStyleGen, ({ frame, expectedStyle }) => {
          const result = ANSIValidator.validateBorders(frame, expectedStyle);
          // Should be invalid because style doesn't match
          return !result.valid && result.issues.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
