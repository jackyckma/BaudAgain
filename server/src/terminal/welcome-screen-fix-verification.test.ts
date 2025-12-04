import { describe, it, expect } from 'vitest';
import { WebTerminalRenderer } from './WebTerminalRenderer.js';
import { ContentType } from '@baudagain/shared';
import type { WelcomeScreenContent } from '@baudagain/shared';

describe('Welcome Screen Rendering Fixes', () => {
  const renderer = new WebTerminalRenderer();
  
  const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
  
  it('should render welcome screen with proper frame alignment', () => {
    const content: WelcomeScreenContent = {
      type: ContentType.WELCOME_SCREEN,
      title: 'BAUDAGAIN BBS',
      subtitle: 'The Haunted Terminal',
      tagline: 'Where digital spirits dwell',
      node: '1',
      maxNodes: '4',
      callerCount: '5',
    };
    
    const output = renderer.render(content);
    const lines = output.split('\r\n').filter(line => line.length > 0);
    
    // All lines should have the same visible width
    const widths = lines.map(line => stripAnsi(line).length);
    const uniqueWidths = [...new Set(widths)];
    
    expect(uniqueWidths).toHaveLength(1);
    expect(uniqueWidths[0]).toBe(64);
  });
  
  it('should handle long content by truncating', () => {
    const content: WelcomeScreenContent = {
      type: ContentType.WELCOME_SCREEN,
      title: 'BAUDAGAIN BBS - THE ULTIMATE RETRO EXPERIENCE FOR MODERN TIMES AND BEYOND',
      subtitle: 'The Haunted Terminal Where All Your Digital Dreams Come True Forever',
      tagline: 'Where digital spirits dwell in the ethereal realm of cyberspace and beyond',
      node: '1',
      maxNodes: '4',
      callerCount: '999',
    };
    
    const output = renderer.render(content);
    const lines = output.split('\r\n').filter(line => line.length > 0);
    
    // All lines should still have the same visible width
    const widths = lines.map(line => stripAnsi(line).length);
    const uniqueWidths = [...new Set(widths)];
    
    expect(uniqueWidths).toHaveLength(1);
    expect(uniqueWidths[0]).toBe(64);
    
    // Check that truncation occurred (should contain "...")
    const visibleOutput = stripAnsi(output);
    expect(visibleOutput).toContain('...');
  });
  
  it('should maintain 80-character width limit', () => {
    const content: WelcomeScreenContent = {
      type: ContentType.WELCOME_SCREEN,
      title: 'X'.repeat(100), // Very long title
      subtitle: 'Y'.repeat(100), // Very long subtitle
      tagline: 'Z'.repeat(100), // Very long tagline
      node: '1',
      maxNodes: '4',
      callerCount: '999',
    };
    
    const output = renderer.render(content);
    const lines = output.split('\r\n');
    
    // No line should exceed 80 characters
    lines.forEach(line => {
      const visibleLength = stripAnsi(line).length;
      expect(visibleLength).toBeLessThanOrEqual(80);
    });
  });
  
  it('should render borders correctly', () => {
    const content: WelcomeScreenContent = {
      type: ContentType.WELCOME_SCREEN,
      title: 'Test',
      node: '1',
      maxNodes: '4',
      callerCount: '1',
    };
    
    const output = renderer.render(content);
    const visible = stripAnsi(output);
    
    // Should contain proper box drawing characters
    expect(visible).toContain('╔');
    expect(visible).toContain('╗');
    expect(visible).toContain('╚');
    expect(visible).toContain('╝');
    expect(visible).toContain('║');
    expect(visible).toContain('╠');
    expect(visible).toContain('╣');
  });
});
