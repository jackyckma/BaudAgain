/**
 * Base Terminal Renderer Tests
 */

import { describe, it, expect } from 'vitest';
import { BaseTerminalRenderer } from './BaseTerminalRenderer.js';
import type {
  WelcomeScreenContent,
  MenuContent,
  MessageContent,
  PromptContent,
  ErrorContent,
  RawANSIContent,
  EchoControlContent,
} from '@baudagain/shared';

// Concrete implementation for testing
class TestTerminalRenderer extends BaseTerminalRenderer {
  protected renderRawANSI(content: RawANSIContent): string {
    return content.ansi;
  }
}

describe('BaseTerminalRenderer', () => {
  let renderer: TestTerminalRenderer;

  beforeEach(() => {
    renderer = new TestTerminalRenderer();
  });

  describe('renderWelcomeScreen', () => {
    it('should render welcome screen with title', () => {
      const content: WelcomeScreenContent = {
        type: 'welcome_screen',
        title: 'BaudAgain BBS',
        node: 1,
        maxNodes: 4,
        callerCount: 2,
      };

      const result = renderer.render(content);

      expect(result).toContain('BaudAgain BBS');
      expect(result).toContain('Node 1/4');
      expect(result).toContain('2 callers online');
      expect(result).toContain('╔');
      expect(result).toContain('╚');
    });

    it('should include subtitle when provided', () => {
      const content: WelcomeScreenContent = {
        type: 'welcome_screen',
        title: 'BaudAgain BBS',
        subtitle: 'Welcome Back',
        node: 1,
        maxNodes: 4,
        callerCount: 1,
      };

      const result = renderer.render(content);

      expect(result).toContain('Welcome Back');
    });

    it('should include tagline when provided', () => {
      const content: WelcomeScreenContent = {
        type: 'welcome_screen',
        title: 'BaudAgain BBS',
        tagline: 'The Future of the Past',
        node: 1,
        maxNodes: 4,
        callerCount: 1,
      };

      const result = renderer.render(content);

      expect(result).toContain('The Future of the Past');
    });

    it('should include ANSI color codes', () => {
      const content: WelcomeScreenContent = {
        type: 'welcome_screen',
        title: 'Test BBS',
        node: 1,
        maxNodes: 4,
        callerCount: 0,
      };

      const result = renderer.render(content);

      // Should contain ANSI escape sequences
      expect(result).toContain('\x1b[');
    });
  });

  describe('renderMenu', () => {
    it('should render menu with title and options', () => {
      const content: MenuContent = {
        type: 'menu',
        title: 'Main Menu',
        options: [
          { key: 'M', label: 'Messages', description: 'Read and post messages' },
          { key: 'D', label: 'Doors', description: 'Play door games' },
          { key: 'G', label: 'Goodbye', description: 'Disconnect' },
        ],
      };

      const result = renderer.render(content);

      expect(result).toContain('Main Menu');
      expect(result).toContain('[M]');
      expect(result).toContain('Messages');
      expect(result).toContain('Read and post messages');
      expect(result).toContain('[D]');
      expect(result).toContain('Doors');
      expect(result).toContain('[G]');
      expect(result).toContain('Goodbye');
    });

    it('should render menu without descriptions', () => {
      const content: MenuContent = {
        type: 'menu',
        title: 'Simple Menu',
        options: [
          { key: 'A', label: 'Option A' },
          { key: 'B', label: 'Option B' },
        ],
      };

      const result = renderer.render(content);

      expect(result).toContain('Simple Menu');
      expect(result).toContain('[A]');
      expect(result).toContain('Option A');
      expect(result).toContain('[B]');
      expect(result).toContain('Option B');
    });

    it('should include box drawing characters', () => {
      const content: MenuContent = {
        type: 'menu',
        title: 'Test Menu',
        options: [{ key: 'X', label: 'Exit' }],
      };

      const result = renderer.render(content);

      expect(result).toContain('╔');
      expect(result).toContain('╠');
      expect(result).toContain('╚');
      expect(result).toContain('║');
    });
  });

  describe('renderMessage', () => {
    it('should render normal message', () => {
      const content: MessageContent = {
        type: 'message',
        text: 'Hello, world!',
        style: 'normal',
      };

      const result = renderer.render(content);

      expect(result).toContain('Hello, world!');
      expect(result).toContain('\r\n');
    });

    it('should render success message with green color', () => {
      const content: MessageContent = {
        type: 'message',
        text: 'Operation successful',
        style: 'success',
      };

      const result = renderer.render(content);

      expect(result).toContain('Operation successful');
      expect(result).toContain('\x1b[92m'); // bright green
    });

    it('should render error message with red color', () => {
      const content: MessageContent = {
        type: 'message',
        text: 'Operation failed',
        style: 'error',
      };

      const result = renderer.render(content);

      expect(result).toContain('Operation failed');
      expect(result).toContain('\x1b[91m'); // bright red
    });

    it('should render warning message with yellow color', () => {
      const content: MessageContent = {
        type: 'message',
        text: 'Warning message',
        style: 'warning',
      };

      const result = renderer.render(content);

      expect(result).toContain('Warning message');
      expect(result).toContain('\x1b[93m'); // bright yellow
    });

    it('should render info message with cyan color', () => {
      const content: MessageContent = {
        type: 'message',
        text: 'Info message',
        style: 'info',
      };

      const result = renderer.render(content);

      expect(result).toContain('Info message');
      expect(result).toContain('\x1b[96m'); // bright cyan
    });
  });

  describe('renderPrompt', () => {
    it('should render prompt text', () => {
      const content: PromptContent = {
        type: 'prompt',
        text: 'Enter your choice: ',
      };

      const result = renderer.render(content);

      expect(result).toContain('Enter your choice: ');
      expect(result).toContain('\x1b[97m'); // bright white
    });

    it('should not include newline', () => {
      const content: PromptContent = {
        type: 'prompt',
        text: 'Username: ',
      };

      const result = renderer.render(content);

      expect(result).not.toContain('\r\n');
    });
  });

  describe('renderError', () => {
    it('should render error with red color and symbol', () => {
      const content: ErrorContent = {
        type: 'error',
        message: 'Invalid command',
      };

      const result = renderer.render(content);

      expect(result).toContain('Invalid command');
      expect(result).toContain('✗');
      expect(result).toContain('\x1b[91m'); // bright red
      expect(result).toContain('\r\n');
    });
  });

  describe('renderEchoControl', () => {
    it('should render echo control for enabled', () => {
      const content: EchoControlContent = {
        type: 'echo_control',
        enabled: true,
      };

      const result = renderer.render(content);

      expect(result).toContain('\x1b]8001;1\x07');
    });

    it('should render echo control for disabled', () => {
      const content: EchoControlContent = {
        type: 'echo_control',
        enabled: false,
      };

      const result = renderer.render(content);

      expect(result).toContain('\x1b]8001;0\x07');
    });
  });

  describe('renderRawANSI', () => {
    it('should render raw ANSI content', () => {
      const content: RawANSIContent = {
        type: 'raw_ansi',
        ansi: '\x1b[31mRed text\x1b[0m',
      };

      const result = renderer.render(content);

      expect(result).toBe('\x1b[31mRed text\x1b[0m');
    });
  });

  describe('utility methods', () => {
    it('should center text correctly', () => {
      // Access protected method through type assertion for testing
      const centerText = (renderer as any).centerText.bind(renderer);
      
      const result = centerText('Hello', 20);
      const visibleLength = result.trim().length;
      
      expect(result).toContain('Hello');
      expect(result.length).toBe(20);
    });

    it('should pad text to the right', () => {
      const padRight = (renderer as any).padRight.bind(renderer);
      
      const result = padRight('Hello', 20);
      
      expect(result).toContain('Hello');
      expect(result.length).toBe(20);
      expect(result.endsWith(' ')).toBe(true);
    });

    it('should handle ANSI codes in text length calculations', () => {
      const padRight = (renderer as any).padRight.bind(renderer);
      
      const coloredText = '\x1b[31mHello\x1b[0m';
      const result = padRight(coloredText, 20);
      
      // Should pad based on visible length (5) not total length
      expect(result.length).toBeGreaterThan(20);
      expect(result).toContain('Hello');
    });
  });

  describe('content type routing', () => {
    it('should handle unknown content types gracefully', () => {
      const content = {
        type: 'unknown_type',
      } as any;

      const result = renderer.render(content);

      expect(result).toBe('');
    });
  });
});
