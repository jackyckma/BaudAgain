/**
 * Loading Indicator Tests
 * 
 * Tests for loading indicator rendering in terminal
 */

import { describe, it, expect } from 'vitest';
import { WebTerminalRenderer } from './WebTerminalRenderer.js';
import { ContentType } from '@baudagain/shared';
import type { LoadingContent } from '@baudagain/shared';

describe('Loading Indicator', () => {
  const renderer = new WebTerminalRenderer();

  it('should render simple loading indicator', () => {
    const content: LoadingContent = {
      type: ContentType.LOADING,
      message: 'Loading data...',
      style: 'simple',
    };

    const output = renderer.render(content);
    
    expect(output).toContain('Loading data...');
    expect(output).toContain('⏳');
  });

  it('should render spinner loading indicator', () => {
    const content: LoadingContent = {
      type: ContentType.LOADING,
      message: 'Processing...',
      style: 'spinner',
    };

    const output = renderer.render(content);
    
    expect(output).toContain('Processing...');
    expect(output).toContain('⠋');
  });

  it('should render dots loading indicator', () => {
    const content: LoadingContent = {
      type: ContentType.LOADING,
      message: 'Please wait...',
      style: 'dots',
    };

    const output = renderer.render(content);
    
    expect(output).toContain('Please wait...');
    expect(output).toContain('...');
  });

  it('should default to simple style when not specified', () => {
    const content: LoadingContent = {
      type: ContentType.LOADING,
      message: 'Working...',
    };

    const output = renderer.render(content);
    
    expect(output).toContain('Working...');
    expect(output).toContain('⏳');
  });

  it('should include ANSI color codes', () => {
    const content: LoadingContent = {
      type: ContentType.LOADING,
      message: 'Generating response...',
      style: 'simple',
    };

    const output = renderer.render(content);
    
    // Should contain cyan color code
    expect(output).toContain('\x1b[36m');
    // Should contain reset code
    expect(output).toContain('\x1b[0m');
  });

  it('should end with line break', () => {
    const content: LoadingContent = {
      type: ContentType.LOADING,
      message: 'Loading...',
      style: 'simple',
    };

    const output = renderer.render(content);
    
    expect(output).toMatch(/\r\n$/);
  });
});
