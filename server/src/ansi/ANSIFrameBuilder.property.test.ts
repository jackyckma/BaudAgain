/**
 * Property-Based Tests for ANSIFrameBuilder
 * 
 * Feature: ansi-rendering-refactor
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the ANSIFrameBuilder.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ANSIFrameBuilder, type FrameLine } from './ANSIFrameBuilder.js';
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

describe('ANSIFrameBuilder Property-Based Tests', () => {
  /**
   * Feature: ansi-rendering-refactor, Property 1: Frame lines have uniform visual width
   * Validates: Requirements 3.1
   * 
   * For any rendered frame, all lines should have identical visual width when ANSI codes are stripped.
   */
  describe('Property 1: Frame lines have uniform visual width', () => {
    it('should have all lines with same visual width', () => {
      fc.assert(
        fc.property(
          // Generate array of random text lines (1-20 lines)
          fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
          // Generate frame width (40-132 columns)
          fc.integer({ min: 40, max: 132 }),
          (textLines, width) => {
            // Create frame lines from text
            const lines: FrameLine[] = textLines.map(text => ({ text }));
            
            // Build frame with maxWidth set to allow the width
            const builder = new ANSIFrameBuilder({ width, maxWidth: width });
            const frameLines = builder.build(lines);
            
            // Calculate visual width of each line
            const widths = frameLines.map(line => ANSIWidthCalculator.calculate(line));
            
            // All widths should be identical
            const uniqueWidths = [...new Set(widths)];
            
            return uniqueWidths.length === 1 && uniqueWidths[0] === width;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should maintain uniform width with ANSI color codes', () => {
      fc.assert(
        fc.property(
          // Generate array of text with optional ANSI codes
          fc.array(
            fc.record({
              text: fc.string({ minLength: 0, maxLength: 50 }),
              color: fc.option(fc.constantFrom('\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[34m', '\x1b[35m', '\x1b[36m'), { nil: undefined })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 40, max: 132 }),
          (lineConfigs, width) => {
            const lines: FrameLine[] = lineConfigs.map(config => ({
              text: config.text,
              color: config.color
            }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: width });
            const frameLines = builder.build(lines);
            
            // Calculate visual width of each line (strips ANSI codes)
            const widths = frameLines.map(line => ANSIWidthCalculator.calculate(line));
            
            // All widths should be identical
            const uniqueWidths = [...new Set(widths)];
            
            return uniqueWidths.length === 1 && uniqueWidths[0] === width;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should maintain uniform width with mixed alignment', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 0, maxLength: 50 }),
              align: fc.constantFrom('left' as const, 'center' as const)
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 40, max: 132 }),
          (lineConfigs, width) => {
            const lines: FrameLine[] = lineConfigs.map(config => ({
              text: config.text,
              align: config.align
            }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: width });
            const frameLines = builder.build(lines);
            
            const widths = frameLines.map(line => ANSIWidthCalculator.calculate(line));
            const uniqueWidths = [...new Set(widths)];
            
            return uniqueWidths.length === 1 && uniqueWidths[0] === width;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ansi-rendering-refactor, Property 2: Frames fit within target width
   * Validates: Requirements 3.3
   * 
   * For any frame and target width, the frame's visual width should be less than or equal to the target width.
   */
  describe('Property 2: Frames fit within target width', () => {
    it('should never exceed target width', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 0, maxLength: 100 }), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 40, max: 132 }),
          (textLines, targetWidth) => {
            const lines: FrameLine[] = textLines.map(text => ({ text }));
            
            const builder = new ANSIFrameBuilder({ width: targetWidth, maxWidth: targetWidth });
            const frameLines = builder.build(lines);
            
            // Check that every line fits within target width
            const allFit = frameLines.every(line => {
              const visualWidth = ANSIWidthCalculator.calculate(line);
              return visualWidth <= targetWidth;
            });
            
            return allFit;
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should fit within target width with colors', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 0, maxLength: 100 }),
              color: fc.option(fc.constantFrom('\x1b[31m', '\x1b[32m', '\x1b[33m'), { nil: undefined })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 40, max: 132 }),
          (lineConfigs, targetWidth) => {
            const lines: FrameLine[] = lineConfigs.map(config => ({
              text: config.text,
              color: config.color
            }));
            
            const builder = new ANSIFrameBuilder({ width: targetWidth, maxWidth: targetWidth });
            const frameLines = builder.build(lines);
            
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) <= targetWidth
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should fit within target width with buildWithTitle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 40, max: 132 }),
          (title, textLines, targetWidth) => {
            const lines: FrameLine[] = textLines.map(text => ({ text }));
            
            const builder = new ANSIFrameBuilder({ width: targetWidth, maxWidth: targetWidth });
            const frameLines = builder.buildWithTitle(title, lines);
            
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) <= targetWidth
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should fit within target width with buildMessage', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 40, max: 132 }),
          (message, targetWidth) => {
            const builder = new ANSIFrameBuilder({ width: targetWidth, maxWidth: targetWidth });
            const frameLines = builder.buildMessage(message);
            
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) <= targetWidth
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: ansi-rendering-refactor, Property 5: Padding produces exact width
   * Validates: Requirements 4.4
   * 
   * For any text padded to width W, the visual width of the padded result should be exactly W.
   */
  describe('Property 5: Padding produces exact width', () => {
    it('should produce exact width for all content lines', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 40, max: 132 }),
          fc.integer({ min: 1, max: 5 }),
          (textLines, width, padding) => {
            const lines: FrameLine[] = textLines.map(text => ({ text }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: width, padding });
            const frameLines = builder.build(lines);
            
            // Every line should have exactly the target width
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should produce exact width with different alignments', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 0, maxLength: 50 }),
              align: fc.constantFrom('left' as const, 'center' as const)
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 40, max: 132 }),
          fc.integer({ min: 1, max: 5 }),
          (lineConfigs, width, padding) => {
            const lines: FrameLine[] = lineConfigs.map(config => ({
              text: config.text,
              align: config.align
            }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: width, padding });
            const frameLines = builder.build(lines);
            
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should produce exact width with colors', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 0, maxLength: 50 }),
              color: fc.option(fc.constantFrom('\x1b[31m', '\x1b[32m', '\x1b[33m'), { nil: undefined })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.integer({ min: 40, max: 132 }),
          fc.integer({ min: 1, max: 5 }),
          (lineConfigs, width, padding) => {
            const lines: FrameLine[] = lineConfigs.map(config => ({
              text: config.text,
              color: config.color
            }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: width, padding });
            const frameLines = builder.build(lines);
            
            // ANSI color codes should not affect visual width
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should produce exact width for buildWithTitle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.array(fc.string({ minLength: 0, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 50, max: 132 }),
          fc.integer({ min: 1, max: 5 }),
          (title, textLines, width, padding) => {
            const lines: FrameLine[] = textLines.map(text => ({ text }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: width, padding });
            const frameLines = builder.buildWithTitle(title, lines);
            
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should produce exact width for buildMessage', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.integer({ min: 50, max: 132 }),
          fc.integer({ min: 1, max: 5 }),
          (message, width, padding) => {
            const builder = new ANSIFrameBuilder({ width, maxWidth: width, padding });
            const frameLines = builder.buildMessage(message);
            
            return frameLines.every(line => 
              ANSIWidthCalculator.calculate(line) === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
