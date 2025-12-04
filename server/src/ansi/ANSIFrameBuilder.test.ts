import { describe, it, expect } from 'vitest';
import { ANSIFrameBuilder, type FrameLine } from './ANSIFrameBuilder.js';

describe('ANSIFrameBuilder', () => {
  describe('Basic Frame Creation', () => {
    it('should create a frame with consistent width', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: 'Line 1' },
        { text: 'Line 2' },
      ]);
      
      // build() should return an array of strings
      expect(Array.isArray(frameLines)).toBe(true);
      expect(frameLines.length).toBeGreaterThan(0);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
    
    it('should create frames with different widths', () => {
      const widths = [40, 60, 80, 100];
      
      for (const width of widths) {
        const builder = new ANSIFrameBuilder({ width, maxWidth: Math.max(width, 80) });
        const lines = builder.build([{ text: 'Test' }]);
        
        // build() should return an array
        expect(Array.isArray(lines)).toBe(true);
        
        const strippedLines = lines.map(line => 
          line.replace(/\x1b\[[0-9;]*m/g, '')
        );
        
        // All lines should have the same width
        const firstLineWidth = strippedLines[0].length;
        expect(firstLineWidth).toBe(width);
        
        strippedLines.forEach(line => {
          expect(line.length).toBe(width);
        });
      }
    });
    
    it('should handle empty content', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([]);
      
      // build() should return an array
      expect(Array.isArray(frameLines)).toBe(true);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should return array of lines from build()', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const lines = builder.build([
        { text: 'Line 1' },
        { text: 'Line 2' },
        { text: 'Line 3' },
      ]);
      
      // Should return array, not joined string
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(3); // At least content + borders
      
      // Each element should be a string
      lines.forEach(line => {
        expect(typeof line).toBe('string');
      });
    });
  });
  
  describe('ANSI Color Code Handling', () => {
    it('should handle ANSI color codes without affecting width', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: 'Plain text' },
        { text: '\x1b[32mGreen text\x1b[0m' },
        { text: '\x1b[1m\x1b[35mBold magenta\x1b[0m' },
      ]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
    
    it('should apply color to entire line when specified', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: 'Colored line', color: '\x1b[33m' },
      ]);
      
      const frame = frameLines.join('\r\n');
      expect(frame).toContain('\x1b[33m');
      expect(frame).toContain('\x1b[0m');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Text Alignment', () => {
    it('should left-align text by default', () => {
      const builder = new ANSIFrameBuilder({ width: 60, padding: 2 });
      const lines = builder.build([
        { text: 'Left' },
      ]);
      
      const contentLine = lines[1]; // First content line
      const stripped = contentLine.replace(/\x1b\[[0-9;]*m/g, '');
      
      // Should have border, padding, text, then spaces
      expect(stripped).toMatch(/^║  Left\s+║$/);
    });
    
    it('should center text when specified', () => {
      const builder = new ANSIFrameBuilder({ width: 60, padding: 2 });
      const lines = builder.build([
        { text: 'Center', align: 'center' },
      ]);
      
      const contentLine = lines[1];
      const stripped = contentLine.replace(/\x1b\[[0-9;]*m/g, '');
      
      // Text should be centered
      const textStart = stripped.indexOf('Center');
      const textEnd = textStart + 6;
      const leftSpace = textStart - 3; // After border and padding
      const rightSpace = stripped.length - textEnd - 3; // Before padding and border
      
      // Left and right spacing should be roughly equal (within 1 char)
      expect(Math.abs(leftSpace - rightSpace)).toBeLessThanOrEqual(1);
    });
    
    it('should support per-line alignment', () => {
      const builder = new ANSIFrameBuilder({ width: 60, align: 'left' });
      const frameLines = builder.build([
        { text: 'Left aligned' },
        { text: 'Center aligned', align: 'center' },
        { text: 'Also left' },
      ]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Variable Content Lengths', () => {
    it('should handle varying content lengths', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      const frameLines = builder.build([
        { text: 'Short' },
        { text: 'This is a much longer line of text' },
        { text: 'X' },
        { text: 'Medium length line' },
      ]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
    
    it('should handle content with variable substitution', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      
      // Simulate variable substitution with different lengths
      const node = '1';
      const maxNodes = '4';
      const callerCount = '0';
      
      const statusLine = `Node ${node}/${maxNodes} • ${callerCount} callers online`;
      
      const frameLines = builder.build([
        { text: statusLine },
      ]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle maximum-length variables', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      
      // Maximum length values
      const node = '100';
      const maxNodes = '100';
      const callerCount = '999';
      
      const statusLine = `Node ${node}/${maxNodes} • ${callerCount} callers online`;
      
      const frameLines = builder.build([
        { text: statusLine },
      ]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Frame Styles', () => {
    it('should create single-line frames', () => {
      const builder = new ANSIFrameBuilder({ width: 60, style: 'single' });
      const frameLines = builder.build([{ text: 'Test' }]);
      const frame = frameLines.join('\r\n');
      
      expect(frame).toContain('┌');
      expect(frame).toContain('┐');
      expect(frame).toContain('└');
      expect(frame).toContain('┘');
      expect(frame).toContain('│');
      expect(frame).toContain('─');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should create double-line frames', () => {
      const builder = new ANSIFrameBuilder({ width: 60, style: 'double' });
      const frameLines = builder.build([{ text: 'Test' }]);
      const frame = frameLines.join('\r\n');
      
      expect(frame).toContain('╔');
      expect(frame).toContain('╗');
      expect(frame).toContain('╚');
      expect(frame).toContain('╝');
      expect(frame).toContain('║');
      expect(frame).toContain('═');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Frame with Title', () => {
    it('should create frame with title and content', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.buildWithTitle(
        'MAIN MENU',
        [
          { text: 'Option 1' },
          { text: 'Option 2' },
        ]
      );
      const frame = frameLines.join('\r\n');
      
      expect(frame).toContain('MAIN MENU');
      expect(frame).toContain('Option 1');
      expect(frame).toContain('Option 2');
      expect(frame).toContain('╠');
      expect(frame).toContain('╣');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should apply color to title', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.buildWithTitle(
        'COLORED TITLE',
        [{ text: 'Content' }],
        '\x1b[33m'
      );
      const frame = frameLines.join('\r\n');
      
      expect(frame).toContain('\x1b[33m');
      expect(frame).toContain('COLORED TITLE');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Simple Message Frame', () => {
    it('should create simple message frame', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.buildMessage('Hello, World!');
      const frame = frameLines.join('\r\n');
      
      expect(frame).toContain('Hello, World!');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should center message text', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.buildMessage('Centered Message');
      
      const messageLine = frameLines.find(line => line.includes('Centered Message'));
      expect(messageLine).toBeDefined();
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Frame Validation', () => {
    it('should validate correct frames', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: 'Line 1' },
        { text: 'Line 2' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
    
    it('should detect width inconsistencies', () => {
      // Create a malformed frame manually
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Line 1                     ║',
        '║ Line 2 is too long                    ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(badFrame);
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('width mismatch');
    });
    
    it('should detect missing corners', () => {
      const badFrame = [
        '════════════════════════════',
        '║ Line 1                   ║',
        '════════════════════════════',
      ].join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(badFrame);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('corners'))).toBe(true);
    });
    
    it('should detect missing vertical borders', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '  Line 1 without borders     ',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(badFrame);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('vertical borders'))).toBe(true);
    });
  });
  
  describe('Width Calculator Integration', () => {
    it('should use ANSIWidthCalculator for visual width', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      
      // Text with ANSI codes should be handled correctly
      const textWithANSI = '\x1b[32mGreen\x1b[0m text';
      const frameLines = builder.build([{ text: textWithANSI }]);
      
      // All lines should have consistent visual width
      const strippedLines = frameLines.map(line => 
        line.replace(/\x1b\[[0-9;]*m/g, '')
      );
      
      const widths = strippedLines.map(line => line.length);
      const uniqueWidths = [...new Set(widths)];
      expect(uniqueWidths.length).toBe(1);
      expect(uniqueWidths[0]).toBe(60);
    });
    
    it('should handle Unicode characters correctly', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      
      // Text with Unicode characters
      const textWithUnicode = 'Hello 世界 🌍';
      const frameLines = builder.build([{ text: textWithUnicode }]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle box-drawing characters correctly', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      
      // Text with box-drawing characters
      const textWithBoxChars = '─═│║┌┐└┘╔╗╚╝';
      const frameLines = builder.build([{ text: textWithBoxChars }]);
      
      const frame = frameLines.join('\r\n');
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle very narrow frames', () => {
      const builder = new ANSIFrameBuilder({ width: 20, padding: 1 });
      const frameLines = builder.build([{ text: 'X' }]);
      const frame = frameLines.join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle very wide frames', () => {
      const builder = new ANSIFrameBuilder({ width: 132, maxWidth: 132 });
      const frameLines = builder.build([{ text: 'Wide frame test' }]);
      const frame = frameLines.join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle text that exactly fills content width', () => {
      const builder = new ANSIFrameBuilder({ width: 60, padding: 2 });
      const contentWidth = 60 - 2 - 4; // width - borders - padding
      const text = 'X'.repeat(contentWidth);
      
      const frameLines = builder.build([{ text }]);
      const frame = frameLines.join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
    
    it('should handle multiple ANSI codes in same text', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: '\x1b[1m\x1b[32m\x1b[4mMultiple codes\x1b[0m' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const validation = ANSIFrameBuilder.validate(frame);
      expect(validation.valid).toBe(true);
    });
  });
});
