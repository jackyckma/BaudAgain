import { describe, it, expect } from 'vitest';
import { ANSIRenderer } from './ANSIRenderer.js';
import { ANSIFrameValidator } from './ANSIFrameValidator.js';
import { RENDER_CONTEXTS } from './ANSIRenderingService.js';

describe('ANSIRenderer', () => {
  describe('Welcome Screen', () => {
    it('should render welcome screen with proper alignment', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      });
      
      expect(welcome).toBeTruthy();
      expect(welcome.length).toBeGreaterThan(0);
      
      // Validate frame alignment
      const result = ANSIFrameValidator.validate(welcome);
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.log('Welcome frame issues:', result.issues);
      }
    });
    
    it('should handle different variable lengths', () => {
      const renderer = new ANSIRenderer();
      
      // Test with maximum length values
      const welcome = renderer.render('welcome.ans', {
        node: '100',
        max_nodes: '100',
        caller_count: '999',
      });
      
      expect(welcome).toBeTruthy();
      
      // Validate frame alignment
      const result = ANSIFrameValidator.validate(welcome);
      expect(result.valid).toBe(true);
    });
    
    it('should include ANSI color codes', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      });
      
      // Should contain color codes
      expect(welcome).toContain('\x1b[');
      expect(welcome).toContain('\x1b[0m'); // Reset code
    });
  });
  
  describe('Goodbye Screen', () => {
    it('should render goodbye screen with proper alignment', () => {
      const renderer = new ANSIRenderer();
      const goodbye = renderer.render('goodbye.ans');
      
      expect(goodbye).toBeTruthy();
      expect(goodbye.length).toBeGreaterThan(0);
      
      // Validate frame alignment
      const result = ANSIFrameValidator.validate(goodbye);
      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.log('Goodbye frame issues:', result.issues);
      }
    });
    
    it('should include goodbye message text', () => {
      const renderer = new ANSIRenderer();
      const goodbye = renderer.render('goodbye.ans');
      
      expect(goodbye).toContain('GOODBYE');
      expect(goodbye).toContain('Thank you');
      expect(goodbye).toContain('Stay retro');
    });
  });
  
  describe('Frame Consistency', () => {
    it('should produce consistent width across all lines', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      });
      
      const lines = welcome.split('\r\n').filter(line => line.length > 0);
      const strippedLines = lines.map(line => 
        line.replace(/\x1b\[[0-9;]*m/g, '')
      );
      
      // All lines should have the same width
      const widths = strippedLines.map(line => line.length);
      const uniqueWidths = [...new Set(widths)];
      
      expect(uniqueWidths.length).toBe(1);
    });
  });
  
  describe('Context Parameter', () => {
    it('should render with terminal context by default', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      });
      
      // Should use LF for terminal (default)
      expect(welcome).toContain('\n');
      expect(welcome).toContain('\x1b['); // Should have ANSI codes
    });
    
    it('should render with telnet context', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      }, RENDER_CONTEXTS.TELNET_80);
      
      // Should use CRLF for telnet
      expect(welcome).toContain('\r\n');
      expect(welcome).toContain('\x1b['); // Should have ANSI codes
      
      // Validate frame alignment
      const result = ANSIFrameValidator.validate(welcome);
      expect(result.valid).toBe(true);
    });
    
    it('should render with web context', () => {
      const renderer = new ANSIRenderer();
      const welcome = renderer.render('welcome.ans', {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      }, RENDER_CONTEXTS.WEB_80);
      
      // Should use LF for web
      expect(welcome).toContain('\n');
      // Should NOT have raw ANSI codes (converted to HTML)
      expect(welcome).not.toContain('\x1b[');
      expect(welcome).toContain('<span'); // Should have HTML spans
    });
    
    it('should render goodbye screen with different contexts', () => {
      const renderer = new ANSIRenderer();
      
      // Terminal context (uses LF)
      const terminalGoodbye = renderer.render('goodbye.ans', {}, RENDER_CONTEXTS.TERMINAL_80);
      expect(terminalGoodbye).toContain('\n');
      expect(terminalGoodbye).toContain('\x1b[');
      
      // Web context
      const webGoodbye = renderer.render('goodbye.ans', {}, RENDER_CONTEXTS.WEB_80);
      expect(webGoodbye).toContain('\n');
      expect(webGoodbye).not.toContain('\x1b[');
      expect(webGoodbye).toContain('<span');
    });
    
    it('should maintain alignment across all contexts', () => {
      const renderer = new ANSIRenderer();
      const variables = {
        node: '1',
        max_nodes: '4',
        caller_count: '0',
      };
      
      // Test all contexts
      const contexts = [
        RENDER_CONTEXTS.TERMINAL_80,
        RENDER_CONTEXTS.TELNET_80,
        RENDER_CONTEXTS.WEB_80,
      ];
      
      contexts.forEach(context => {
        const output = renderer.render('welcome.ans', variables, context);
        expect(output).toBeTruthy();
        
        // For web context, we need to strip HTML before validation
        if (context.type === 'web') {
          // Web output should have HTML tags
          expect(output).toContain('<span');
        } else {
          // Terminal and telnet should validate as frames
          const result = ANSIFrameValidator.validate(output);
          expect(result.valid).toBe(true);
        }
      });
    });
  });
});
