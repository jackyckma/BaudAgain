/**
 * Property-Based Tests for DoorHandler
 * 
 * Feature: user-journey-testing-and-fixes
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all door game outputs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { DoorHandler } from './DoorHandler.js';
import type { Door } from '../doors/Door.js';
import type { Session } from '@baudagain/shared';
import { SessionState } from '@baudagain/shared';
import { ANSIWidthCalculator } from '../ansi/ANSIWidthCalculator.js';
import { ANSIFrameBuilder } from '../ansi/ANSIFrameBuilder.js';

// Mock dependencies
const mockDeps = {
  sessionManager: {
    getAllSessions: () => [],
    updateSession: () => {},
    touchSession: () => {},
  } as any,
};

describe('DoorHandler Property-Based Tests', () => {
  let doorHandler: DoorHandler;

  beforeEach(() => {
    doorHandler = new DoorHandler(mockDeps);
  });

  /**
   * Feature: user-journey-testing-and-fixes, Property 4: Frame border alignment
   * Validates: Requirements 7.5, 12.3
   * 
   * For any frame rendered by door games, all border characters (top, bottom, left, right)
   * should be properly aligned with consistent width.
   */
  describe('Property 4: Frame border alignment', () => {
    it('should maintain proper border alignment for all door outputs', () => {
      fc.assert(
        fc.property(
          // Generate random door output with frames
          fc.array(fc.string({ minLength: 0, maxLength: 70 }), { minLength: 3, maxLength: 20 }),
          fc.integer({ min: 40, max: 80 }),
          fc.constantFrom('single' as const, 'double' as const),
          (contentLines, width, style) => {
            // Build a frame using ANSIFrameBuilder
            const frameLines = contentLines.map(text => ({ text }));
            const builder = new ANSIFrameBuilder({ width, maxWidth: 80, style });
            const frame = builder.build(frameLines);
            
            // Join into output string
            const output = frame.join('\r\n');
            
            // Validate the frame
            const validation = ANSIFrameBuilder.validate(output);
            
            // Frame should be valid (all borders aligned)
            return validation.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain border alignment with ANSI color codes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 0, maxLength: 70 }),
              color: fc.option(
                fc.constantFrom('\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[34m', '\x1b[35m', '\x1b[36m'),
                { nil: undefined }
              )
            }),
            { minLength: 3, maxLength: 20 }
          ),
          fc.integer({ min: 40, max: 80 }),
          fc.constantFrom('single' as const, 'double' as const),
          (lineConfigs, width, style) => {
            const frameLines = lineConfigs.map(config => ({
              text: config.text,
              color: config.color
            }));
            
            const builder = new ANSIFrameBuilder({ width, maxWidth: 80, style });
            const frame = builder.build(frameLines);
            const output = frame.join('\r\n');
            
            const validation = ANSIFrameBuilder.validate(output);
            return validation.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain border alignment with titles', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.string({ minLength: 0, maxLength: 70 }), { minLength: 1, maxLength: 15 }),
          fc.integer({ min: 40, max: 80 }),
          fc.constantFrom('single' as const, 'double' as const),
          (title, contentLines, width, style) => {
            const frameLines = contentLines.map(text => ({ text }));
            const builder = new ANSIFrameBuilder({ width, maxWidth: 80, style });
            const frame = builder.buildWithTitle(title, frameLines);
            const output = frame.join('\r\n');
            
            const validation = ANSIFrameBuilder.validate(output);
            return validation.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce 80-character width limit on all door outputs', () => {
      fc.assert(
        fc.property(
          // Generate random door output (may exceed 80 chars)
          fc.array(fc.string({ minLength: 0, maxLength: 150 }), { minLength: 1, maxLength: 30 }),
          (lines) => {
            // Simulate door output
            const doorOutput = lines.join('\r\n');
            
            // Apply width enforcement (simulating what DoorHandler does)
            const enforcedLines = doorOutput.split(/\r?\n/).map(line => {
              const width = ANSIWidthCalculator.calculate(line);
              if (width > 80) {
                return ANSIWidthCalculator.truncate(line, 80, '...');
              }
              return line;
            });
            
            // Check all lines are within 80 characters
            return enforcedLines.every(line => 
              ANSIWidthCalculator.calculate(line) <= 80
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve frame structure after width enforcement', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 0, maxLength: 70 }), { minLength: 3, maxLength: 20 }),
          fc.integer({ min: 40, max: 80 }),
          (contentLines, width) => {
            // Build a valid frame
            const frameLines = contentLines.map(text => ({ text }));
            const builder = new ANSIFrameBuilder({ width, maxWidth: 80 });
            const frame = builder.build(frameLines);
            const output = frame.join('\r\n');
            
            // Apply width enforcement (should not break valid frames)
            const enforcedLines = output.split(/\r?\n/).map(line => {
              const lineWidth = ANSIWidthCalculator.calculate(line);
              if (lineWidth > 80) {
                return ANSIWidthCalculator.truncate(line, 80, '...');
              }
              return line;
            });
            
            const enforcedOutput = enforcedLines.join('\r\n');
            
            // Frame should still be valid after enforcement
            const validation = ANSIFrameBuilder.validate(enforcedOutput);
            return validation.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed content with frames and text', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 0, maxLength: 70 }), { minLength: 3, maxLength: 10 }),
          fc.array(fc.string({ minLength: 0, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 40, max: 80 }),
          (frameContent, plainText, width) => {
            // Build a frame
            const frameLines = frameContent.map(text => ({ text }));
            const builder = new ANSIFrameBuilder({ width, maxWidth: 80 });
            const frame = builder.build(frameLines);
            
            // Mix frame with plain text
            const output = frame.join('\r\n') + '\r\n' + plainText.join('\r\n');
            
            // Apply width enforcement
            const enforcedLines = output.split(/\r?\n/).map(line => {
              const lineWidth = ANSIWidthCalculator.calculate(line);
              if (lineWidth > 80) {
                return ANSIWidthCalculator.truncate(line, 80, '...');
              }
              return line;
            });
            
            // All lines should be within 80 characters
            return enforcedLines.every(line => 
              ANSIWidthCalculator.calculate(line) <= 80
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
