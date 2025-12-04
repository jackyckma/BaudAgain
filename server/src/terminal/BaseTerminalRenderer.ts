import type {
  TerminalRenderer,
  AnyTerminalContent,
  WelcomeScreenContent,
  MenuContent,
  MessageContent,
  PromptContent,
  ErrorContent,
  RawANSIContent,
  EchoControlContent,
  LoadingContent,
} from '@baudagain/shared';
import { TERMINAL_WIDTH } from '@baudagain/shared';

/**
 * Base Terminal Renderer
 * 
 * Shared rendering logic for all terminal types.
 * Subclasses can override specific methods for customization.
 */
export abstract class BaseTerminalRenderer implements TerminalRenderer {
  // ANSI color codes (shared across all renderers)
  protected readonly colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    
    // Bright foreground colors
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',
  };

  render(content: AnyTerminalContent): string {
    switch (content.type) {
      case 'welcome_screen':
        return this.renderWelcomeScreen(content);
      case 'menu':
        return this.renderMenu(content);
      case 'message':
        return this.renderMessage(content);
      case 'prompt':
        return this.renderPrompt(content);
      case 'error':
        return this.renderError(content);
      case 'raw_ansi':
        return this.renderRawANSI(content);
      case 'echo_control':
        return this.renderEchoControl(content);
      case 'loading':
        return this.renderLoading(content);
      default:
        return '';
    }
  }

  protected renderWelcomeScreen(content: WelcomeScreenContent): string {
    const lines: string[] = [];
    // Use TERMINAL_WIDTH - 2 for borders - 2*8 for padding = 62
    const boxWidth = TERMINAL_WIDTH - 2 - 16;
    
    const borderedLine = (text: string, color: string = ''): string => {
      const centeredText = this.centerText(text, boxWidth);
      const coloredText = color ? color + centeredText + this.colors.reset : centeredText;
      return this.colors.cyan + '║' + this.colors.reset + coloredText + this.colors.cyan + '║' + this.colors.reset;
    };
    
    const emptyLine = (): string => {
      return this.colors.cyan + '║' + this.colors.reset + ' '.repeat(boxWidth) + this.colors.cyan + '║' + this.colors.reset;
    };
    
    // Create borders dynamically based on boxWidth
    const topBorder = this.colors.cyan + '╔' + '═'.repeat(boxWidth) + '╗' + this.colors.reset;
    const middleBorder = this.colors.cyan + '╠' + '═'.repeat(boxWidth) + '╣' + this.colors.reset;
    const bottomBorder = this.colors.cyan + '╚' + '═'.repeat(boxWidth) + '╝' + this.colors.reset;
    
    lines.push(topBorder);
    lines.push(emptyLine());
    lines.push(borderedLine(content.title, this.colors.brightYellow + this.colors.bold));
    lines.push(emptyLine());
    
    if (content.subtitle) {
      lines.push(borderedLine(content.subtitle, this.colors.brightMagenta));
      lines.push(emptyLine());
    }
    
    if (content.tagline) {
      lines.push(borderedLine(content.tagline, this.colors.gray));
      lines.push(emptyLine());
    }
    
    lines.push(middleBorder);
    
    const statusText = `Node ${content.node}/${content.maxNodes} • ${content.callerCount} callers online`;
    lines.push(borderedLine(statusText, this.colors.white));
    lines.push(bottomBorder);
    
    return lines.join('\r\n') + '\r\n';
  }

  protected renderMenu(content: MenuContent): string {
    const lines: string[] = [];
    // Use TERMINAL_WIDTH - 2 for borders - 2*8 for padding = 62
    const boxWidth = TERMINAL_WIDTH - 2 - 16;
    
    const borderedLine = (text: string, color: string = ''): string => {
      const centeredText = this.centerText(text, boxWidth);
      const coloredText = color ? color + centeredText + this.colors.reset : centeredText;
      return this.colors.cyan + '║' + this.colors.reset + coloredText + this.colors.cyan + '║' + this.colors.reset;
    };
    
    const emptyLine = (): string => {
      return this.colors.cyan + '║' + this.colors.reset + ' '.repeat(boxWidth) + this.colors.cyan + '║' + this.colors.reset;
    };
    
    // Create borders dynamically based on boxWidth
    const topBorder = this.colors.cyan + '╔' + '═'.repeat(boxWidth) + '╗' + this.colors.reset;
    const middleBorder = this.colors.cyan + '╠' + '═'.repeat(boxWidth) + '╣' + this.colors.reset;
    const bottomBorder = this.colors.cyan + '╚' + '═'.repeat(boxWidth) + '╝' + this.colors.reset;
    
    lines.push('');
    lines.push(topBorder);
    lines.push(borderedLine(content.title, this.colors.brightYellow + this.colors.bold));
    lines.push(middleBorder);
    lines.push(emptyLine());
    
    content.options.forEach(option => {
      const keyPart = this.colors.brightCyan + `[${option.key}]` + this.colors.reset;
      const labelPart = this.colors.white + option.label + this.colors.reset;
      const optionLine = `  ${keyPart} ${labelPart}`;
      lines.push(this.colors.cyan + '║' + this.colors.reset + this.padRight(optionLine, boxWidth) + this.colors.cyan + '║' + this.colors.reset);
      
      if (option.description) {
        const descLine = `      ${this.colors.gray}${option.description}${this.colors.reset}`;
        lines.push(this.colors.cyan + '║' + this.colors.reset + this.padRight(descLine, boxWidth) + this.colors.cyan + '║' + this.colors.reset);
      }
    });
    
    lines.push(emptyLine());
    lines.push(bottomBorder);
    lines.push('');
    
    return lines.join('\r\n');
  }

  protected renderMessage(content: MessageContent): string {
    let colorCode = this.colors.white;
    
    switch (content.style) {
      case 'success':
        colorCode = this.colors.brightGreen;
        break;
      case 'error':
        colorCode = this.colors.brightRed;
        break;
      case 'warning':
        colorCode = this.colors.brightYellow;
        break;
      case 'info':
        colorCode = this.colors.brightCyan;
        break;
    }
    
    return colorCode + content.text + this.colors.reset + '\r\n';
  }

  protected renderPrompt(content: PromptContent): string {
    return this.colors.brightWhite + content.text + this.colors.reset;
  }

  protected renderError(content: ErrorContent): string {
    return this.colors.brightRed + '✗ ' + content.message + this.colors.reset + '\r\n';
  }

  protected renderEchoControl(content: EchoControlContent): string {
    return `\x1b]8001;${content.enabled ? '1' : '0'}\x07`;
  }

  protected renderLoading(content: LoadingContent): string {
    const style = content.style || 'simple';
    let indicator = '';
    
    switch (style) {
      case 'spinner':
        indicator = '⠋'; // Unicode spinner character
        break;
      case 'dots':
        indicator = '...';
        break;
      case 'simple':
      default:
        indicator = '⏳';
        break;
    }
    
    return this.colors.cyan + indicator + ' ' + content.message + this.colors.reset + '\r\n';
  }

  /**
   * Render raw ANSI content (can be overridden by subclasses)
   */
  protected abstract renderRawANSI(content: RawANSIContent): string;

  /**
   * Center text within a given width
   * Truncates text if it exceeds the width
   * Enforces TERMINAL_WIDTH as maximum
   */
  protected centerText(text: string, width: number): string {
    // Enforce maximum width
    const effectiveWidth = Math.min(width, TERMINAL_WIDTH);
    
    // Strip ANSI codes to get visible length
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    const visibleLength = stripAnsi(text).length;
    
    // If text is too long, truncate it
    if (visibleLength > effectiveWidth) {
      // Truncate to fit width with ellipsis
      const targetLength = effectiveWidth - 3; // Leave room for "..."
      let visibleCount = 0;
      let truncateIndex = 0;
      let inAnsiCode = false;
      
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\x1b') {
          inAnsiCode = true;
        } else if (inAnsiCode && text[i] === 'm') {
          inAnsiCode = false;
        } else if (!inAnsiCode) {
          if (visibleCount >= targetLength) {
            truncateIndex = i;
            break;
          }
          visibleCount++;
        }
      }
      
      // Extract any ANSI codes at the end to preserve them
      const truncated = text.substring(0, truncateIndex);
      const ansiReset = this.colors.reset;
      
      // Return truncated text with ellipsis, padded to exact width
      const result = truncated + '...' + ansiReset;
      const resultVisible = stripAnsi(result).length;
      const padding = Math.max(0, effectiveWidth - resultVisible);
      return result + ' '.repeat(padding);
    }
    
    // Center the text
    const padding = Math.max(0, Math.floor((effectiveWidth - visibleLength) / 2));
    const rightPadding = Math.max(0, effectiveWidth - padding - visibleLength);
    return ' '.repeat(padding) + text + ' '.repeat(rightPadding);
  }

  /**
   * Pad text to the right
   * Truncates text if it exceeds the width
   * Enforces TERMINAL_WIDTH as maximum
   */
  protected padRight(text: string, width: number): string {
    // Enforce maximum width
    const effectiveWidth = Math.min(width, TERMINAL_WIDTH);
    
    const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    
    // If text is too long, truncate it
    if (visibleLength > effectiveWidth) {
      // Find where to truncate (accounting for ANSI codes)
      let visibleCount = 0;
      let truncateIndex = 0;
      let inAnsiCode = false;
      
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\x1b') {
          inAnsiCode = true;
        } else if (inAnsiCode && text[i] === 'm') {
          inAnsiCode = false;
        } else if (!inAnsiCode) {
          visibleCount++;
          if (visibleCount >= effectiveWidth - 3) { // Leave room for "..."
            truncateIndex = i + 1;
            break;
          }
        }
      }
      
      return text.substring(0, truncateIndex) + '...';
    }
    
    const padding = Math.max(0, effectiveWidth - visibleLength);
    return text + ' '.repeat(padding);
  }
}
