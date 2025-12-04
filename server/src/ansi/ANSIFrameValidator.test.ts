import { describe, it, expect } from 'vitest';
import { ANSIFrameValidator } from './ANSIFrameValidator.js';
import { ANSIFrameBuilder } from './ANSIFrameBuilder.js';

describe('ANSIFrameValidator', () => {
  describe('Valid Frame Detection', () => {
    it('should validate a properly formed frame', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: 'Line 1' },
        { text: 'Line 2' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.width).toBe(60);
      expect(result.height).toBeGreaterThan(0);
    });
    
    it('should validate frames with ANSI color codes', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frameLines = builder.build([
        { text: '\x1b[32mGreen text\x1b[0m' },
        { text: '\x1b[1m\x1b[35mBold magenta\x1b[0m' },
      ]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
    
    it('should validate single-line style frames', () => {
      const builder = new ANSIFrameBuilder({ width: 60, style: 'single' });
      const frameLines = builder.build([{ text: 'Test' }]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.corners.topLeft.char).toBe('┌');
      expect(result.corners.topRight.char).toBe('┐');
      expect(result.corners.bottomLeft.char).toBe('└');
      expect(result.corners.bottomRight.char).toBe('┘');
    });
    
    it('should validate double-line style frames', () => {
      const builder = new ANSIFrameBuilder({ width: 60, style: 'double' });
      const frameLines = builder.build([{ text: 'Test' }]);
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.corners.topLeft.char).toBe('╔');
      expect(result.corners.topRight.char).toBe('╗');
      expect(result.corners.bottomLeft.char).toBe('╚');
      expect(result.corners.bottomRight.char).toBe('╝');
    });
  });
  
  describe('Invalid Frame Detection', () => {
    it('should detect width inconsistencies', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Line 1                     ║',
        '║ Line 2 is too long                    ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const result = ANSIFrameValidator.validate(badFrame);
      
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.includes('width mismatch'))).toBe(true);
    });
    
    it('should detect missing top corners', () => {
      const badFrame = [
        '════════════════════════════',
        '║ Line 1                   ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const result = ANSIFrameValidator.validate(badFrame);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('corner'))).toBe(true);
    });
    
    it('should detect missing bottom corners', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Line 1                     ║',
        '════════════════════════════',
      ].join('\r\n');
      
      const result = ANSIFrameValidator.validate(badFrame);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('corner'))).toBe(true);
    });
    
    it('should detect missing left vertical borders', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '  Line 1 without left border║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const result = ANSIFrameValidator.validate(badFrame);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('left border'))).toBe(true);
    });
    
    it('should detect missing right vertical borders', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '║Line 1 without right border  ',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const result = ANSIFrameValidator.validate(badFrame);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('right border'))).toBe(true);
    });
    
    it('should detect mixed border styles', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '│ Single style border        │',
        '║ Double style border        ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const result = ANSIFrameValidator.validate(badFrame);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('Mixed border styles'))).toBe(true);
    });
    
    it('should handle empty frames', () => {
      const result = ANSIFrameValidator.validate('');
      
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Frame is empty');
    });
  });
  
  describe('Multiple Frame Validation', () => {
    it('should validate multiple frames in content', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frame1 = builder.build([{ text: 'Frame 1' }]).join('\r\n');
      const frame2 = builder.build([{ text: 'Frame 2' }]).join('\r\n');
      
      const content = frame1 + '\r\n\r\n' + frame2;
      const results = ANSIFrameValidator.validateMultiple(content);
      
      expect(results.length).toBe(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });
    
    it('should detect issues in multiple frames', () => {
      const goodFrame = [
        '╔════════════════════════════╗',
        '║ Good frame                 ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Bad frame with wrong width        ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const content = goodFrame + '\r\n\r\n' + badFrame;
      const results = ANSIFrameValidator.validateMultiple(content);
      
      expect(results.length).toBe(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
    });
  });
  
  describe('Validation Summary', () => {
    it('should provide summary of validation results', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frame1 = builder.build([{ text: 'Frame 1' }]).join('\r\n');
      const frame2 = builder.build([{ text: 'Frame 2' }]).join('\r\n');
      
      const content = frame1 + '\r\n\r\n' + frame2;
      const results = ANSIFrameValidator.validateMultiple(content);
      const summary = ANSIFrameValidator.getSummary(results);
      
      expect(summary.total).toBe(2);
      expect(summary.valid).toBe(2);
      expect(summary.invalid).toBe(0);
      expect(summary.issues).toHaveLength(0);
    });
    
    it('should include issues in summary', () => {
      const goodFrame = [
        '╔════════════════════════════╗',
        '║ Good frame                 ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Bad frame                       ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      const content = goodFrame + '\r\n\r\n' + badFrame;
      const results = ANSIFrameValidator.validateMultiple(content);
      const summary = ANSIFrameValidator.getSummary(results);
      
      expect(summary.total).toBe(2);
      expect(summary.valid).toBe(1);
      expect(summary.invalid).toBe(1);
      expect(summary.issues.length).toBeGreaterThan(0);
    });
  });
  
  describe('Assert Valid', () => {
    it('should not throw for valid frames', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frame = builder.build([{ text: 'Test' }]).join('\r\n');
      
      expect(() => {
        ANSIFrameValidator.assertValid(frame);
      }).not.toThrow();
    });
    
    it('should throw for invalid frames', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Bad frame                       ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      expect(() => {
        ANSIFrameValidator.assertValid(badFrame);
      }).toThrow('Frame validation failed');
    });
    
    it('should include custom message in error', () => {
      const badFrame = [
        '╔════════════════════════════╗',
        '║ Bad frame                       ║',
        '╚════════════════════════════╝',
      ].join('\r\n');
      
      expect(() => {
        ANSIFrameValidator.assertValid(badFrame, 'Custom error message');
      }).toThrow('Custom error message');
    });
  });
  
  describe('Corner Detection', () => {
    it('should correctly identify corner positions', () => {
      const builder = new ANSIFrameBuilder({ width: 60 });
      const frame = builder.build([{ text: 'Test' }]).join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.corners.topLeft.x).toBe(0);
      expect(result.corners.topLeft.y).toBe(0);
      expect(result.corners.topRight.x).toBe(59);
      expect(result.corners.topRight.y).toBe(0);
      expect(result.corners.bottomLeft.x).toBe(0);
      expect(result.corners.bottomRight.x).toBe(59);
    });
  });
  
  describe('Real-World Frame Validation', () => {
    it('should validate welcome screen style frames', () => {
      const builder = new ANSIFrameBuilder({ width: 80 });
      const frameLines = builder.buildWithTitle(
        'THE HAUNTED TERMINAL',
        [
          { text: 'Where the spirits of the old \'net still whisper...', align: 'center' },
          { text: '' },
          { text: 'Node 1/4 • 0 callers online', align: 'center' },
        ],
        '\x1b[33m'
      );
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.width).toBe(80);
    });
    
    it('should validate goodbye message style frames', () => {
      const builder = new ANSIFrameBuilder({ width: 61 });
      const frameLines = builder.buildWithTitle(
        '🌙 BAUDAGAIN BBS - GOODBYE 🌙',
        [
          { text: 'The system is shutting down for maintenance...' },
          { text: '' },
          { text: 'Thank you for calling BaudAgain BBS!' },
          { text: 'We hope to see you again soon.' },
          { text: '' },
          { text: 'Stay retro. Stay connected.' },
        ]
      );
      const frame = frameLines.join('\r\n');
      
      const result = ANSIFrameValidator.validate(frame);
      
      expect(result.valid).toBe(true);
      expect(result.width).toBe(61);
    });
  });
});
