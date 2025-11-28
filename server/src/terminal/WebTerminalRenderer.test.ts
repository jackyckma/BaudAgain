import { describe, it, expect } from 'vitest';
import { WebTerminalRenderer } from './WebTerminalRenderer.js';
import { ContentType } from '@baudagain/shared';
import type { EchoControlContent, PromptContent } from '@baudagain/shared';

describe('WebTerminalRenderer', () => {
  const renderer = new WebTerminalRenderer();

  describe('Echo Control', () => {
    it('should render echo off control sequence', () => {
      const content: EchoControlContent = {
        type: ContentType.ECHO_CONTROL,
        enabled: false,
      };

      const result = renderer.render(content);
      expect(result).toBe('\x1b]8001;0\x07');
    });

    it('should render echo on control sequence', () => {
      const content: EchoControlContent = {
        type: ContentType.ECHO_CONTROL,
        enabled: true,
      };

      const result = renderer.render(content);
      expect(result).toBe('\x1b]8001;1\x07');
    });

    it('should render password prompt with echo control', () => {
      const echoOff: EchoControlContent = {
        type: ContentType.ECHO_CONTROL,
        enabled: false,
      };

      const prompt: PromptContent = {
        type: ContentType.PROMPT,
        text: 'Password: ',
      };

      const result = renderer.render(echoOff) + renderer.render(prompt);
      
      // Should contain echo control sequence followed by prompt
      expect(result).toContain('\x1b]8001;0\x07');
      expect(result).toContain('Password: ');
    });
  });
});
