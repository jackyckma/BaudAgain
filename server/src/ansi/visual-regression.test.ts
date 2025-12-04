import { describe, it, expect } from 'vitest';
import { ANSIRenderer } from './ANSIRenderer.js';
import { ANSIFrameBuilder } from './ANSIFrameBuilder.js';
import { ANSIFrameValidator } from './ANSIFrameValidator.js';

describe('Visual Regression Tests', () => {
  describe('Welcome Screen', () => {
    it('should maintain consistent frame alignment across different terminal widths', () => {
      const renderer = new ANSIRenderer();
      
      // Test with different variable values
      const testCases = [
        { node: '1', max_nodes: '4', caller_count: '0' },
        { node: '10', max_nodes: '10', caller_count: '5' },
        { node: '100', max_nodes: '100', caller_count: '999' },
      ];
      
      testCases.forEach((vars) => {
        const welcome = renderer.render('welcome.ans', vars);
        const results = ANSIFrameValidator.validateMultiple(welcome);
        
        results.forEach((result, index) => {
          expect(result.valid).toBe(true);
          if (!result.valid) {
            console.log(`Welcome screen frame ${index + 1} with vars ${JSON.stringify(vars)} failed:`);
            console.log(result.issues);
          }
        });
      });
    });
    
    it('should have consistent width across all lines', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      });
      
      // Split on both LF and CRLF to handle different line endings
      const lines = welcome.split(/\r?\n/).filter(line => line.length > 0);
      const strippedLines = lines.map(line => 
        line.replace(/\x1b\[[0-9;]*m/g, '')
      );
      
      const widths = strippedLines.map(line => line.length);
      const uniqueWidths = [...new Set(widths)];
      
      expect(uniqueWidths.length).toBe(1);
      expect(uniqueWidths[0]).toBe(80);
    });
    
    it('should contain all required elements', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      });
      
      // Check for ASCII art (contains box-drawing characters)
      expect(welcome).toContain('█');
      expect(welcome).toContain('╗');
      expect(welcome).toContain('╔');
      
      // Check for tagline
      expect(welcome).toContain('spirits');
      expect(welcome).toContain('whisper');
      
      // Check for status line
      expect(welcome).toContain('Node 1/4');
      expect(welcome).toContain('0 callers');
    });
  });
  
  describe('Goodbye Screen', () => {
    it('should maintain consistent frame alignment', () => {
      const renderer = new ANSIRenderer();
      const goodbye = renderer.render('goodbye.ans');
      
      const result = ANSIFrameValidator.validate(goodbye);
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.log('Goodbye screen validation failed:');
        console.log(result.issues);
      }
    });
    
    it('should have consistent width across all lines', () => {
      const renderer = new ANSIRenderer();
      const goodbye = renderer.render('goodbye.ans');
      
      // Split on both LF and CRLF to handle different line endings
      const lines = goodbye.split(/\r?\n/).filter(line => line.length > 0);
      const strippedLines = lines.map(line => 
        line.replace(/\x1b\[[0-9;]*m/g, '')
      );
      
      const widths = strippedLines.map(line => line.length);
      const uniqueWidths = [...new Set(widths)];
      
      expect(uniqueWidths.length).toBe(1);
      expect(uniqueWidths[0]).toBe(61);
    });
    
    it('should contain all required elements', () => {
      const renderer = new ANSIRenderer();
      const goodbye = renderer.render('goodbye.ans');
      
      expect(goodbye).toContain('GOODBYE');
      expect(goodbye).toContain('Thank you');
      expect(goodbye).toContain('Stay retro');
    });
  });
  
  describe('Frame Builder - Different Widths', () => {
    it('should create valid frames at 40 columns', () => {
      const builder = new ANSIFrameBuilder({ width: 40 });
      const frameLines = builder.build([
        { text: 'Test at 40 columns' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(40);
    });
    
    it('should create valid frames at 60 columns', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: 'Test at 60 columns' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(60);
    });
    
    it('should create valid frames at 80 columns', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      const frameLines = builder.build([
        { text: 'Test at 80 columns' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(80);
    });
    
    it('should reject frames wider than 80 columns', () => {
      // Per requirements, all frames must be 80 characters or less
      expect(() => {
        new ANSIFrameBuilder({ width: 132 });
      }).toThrow('Frame width 132 exceeds maximum allowed width 80');
    });
  });
  
  describe('Frame Builder - Complex Content', () => {
    it('should handle frames with many lines', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      const lines = Array.from({ length: 20 }, (_, i) => ({
        text: `Line ${i + 1}`,
      }));
      
      const frameLines = builder.build(lines);
      const frame = frameLines.join('\r\n');
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.height).toBe(22); // 20 content lines + 2 borders
    });
    
    it('should handle frames with mixed alignment', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      const frameLines = builder.build([
        { text: 'Left aligned', align: 'left' },
        { text: 'Center aligned', align: 'center' },
        { text: 'Left again', align: 'left' },
        { text: 'Center again', align: 'center' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      expect(result.valid).toBe(true);
    });
    
    it('should handle frames with colors', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      const frameLines = builder.build([
        { text: 'Red text', color: '\x1b[31m' },
        { text: 'Green text', color: '\x1b[32m' },
        { text: 'Blue text', color: '\x1b[34m' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      expect(result.valid).toBe(true);
    });
    
    it('should handle frames with long text', () => {
      const builder = new ANSIFrameBuilder({ width: 80, padding: 2 });
      const longText = 'This is a very long line of text that should be properly padded';
      
      const frameLines = builder.build([
        { text: longText },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('No Regressions', () => {
    it('should not have width inconsistencies in any generated frame', () => {
      const renderer = new ANSIRenderer();
      const builder = new ANSIFrameBuilder({ width: 80 });
      
      // Test various frame types
      const frames = [
        renderer.render('welcome.ans', { node: '1', max_nodes: '4', caller_count: '0' }),
        renderer.render('goodbye.ans'),
        builder.build([{ text: 'Simple frame' }]).join('\r\n'),
        builder.buildWithTitle('Title', [{ text: 'Content' }]).join('\r\n'),
        builder.buildMessage('Message').join('\r\n'),
      ];
      
      frames.forEach((frame, index) => {
        const results = ANSIFrameValidator.validateMultiple(frame);
        results.forEach((result) => {
          expect(result.valid).toBe(true);
          if (!result.valid) {
            console.log(`Frame ${index} validation failed:`);
            console.log(result.issues);
          }
        });
      });
    });
    
    it('should maintain alignment with variable substitution', () => {
      const renderer = new ANSIRenderer();
      
      // Test with various lengths of variables
      const testCases = [
        { node: '1', max_nodes: '1', caller_count: '0' },
        { node: '99', max_nodes: '99', caller_count: '99' },
        { node: '100', max_nodes: '100', caller_count: '999' },
      ];
      
      testCases.forEach((vars) => {
        const welcome = renderer.render('welcome.ans', vars);
        const results = ANSIFrameValidator.validateMultiple(welcome);
        
        results.forEach((result) => {
          expect(result.valid).toBe(true);
        });
      });
    });
  });
});
