import type {
  TerminalRenderer,
  AnyTerminalContent,
  WelcomeScreenContent,
  MenuContent,
  MessageContent,
  PromptContent,
  ErrorContent,
  RawANSIContent,
} from '@baudagain/shared';

/**
 * Web Terminal Renderer
 * 
 * Renders structured content with ANSI codes optimized for xterm.js
 * This renderer ensures proper formatting and avoids issues with
 * raw ANSI art that may not render correctly in web terminals.
 */
export class WebTerminalRenderer implements TerminalRenderer {
  // ANSI color codes
  private readonly colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    
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
      default:
        return '';
    }
  }

  private renderWelcomeScreen(content: WelcomeScreenContent): string {
    const lines: string[] = [];
    const boxWidth = 62;
    
    // Helper to create a bordered line with colored content
    const borderedLine = (text: string, color: string = ''): string => {
      // Center the plain text first
      const centeredText = this.centerText(text, boxWidth);
      // Then apply color to the centered text
      const coloredText = color ? color + centeredText + this.colors.reset : centeredText;
      return this.colors.cyan + '║' + this.colors.reset + coloredText + this.colors.cyan + '║' + this.colors.reset;
    };
    
    const emptyLine = (): string => {
      return this.colors.cyan + '║' + this.colors.reset + ' '.repeat(boxWidth) + this.colors.cyan + '║' + this.colors.reset;
    };
    
    // Top border
    lines.push(this.colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + this.colors.reset);
    lines.push(emptyLine());
    
    // Title
    lines.push(borderedLine(content.title, this.colors.brightYellow + this.colors.bold));
    lines.push(emptyLine());
    
    // Subtitle
    if (content.subtitle) {
      lines.push(borderedLine(content.subtitle, this.colors.brightMagenta));
      lines.push(emptyLine());
    }
    
    // Tagline
    if (content.tagline) {
      lines.push(borderedLine(content.tagline, this.colors.gray));
      lines.push(emptyLine());
    }
    
    // Middle border
    lines.push(this.colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + this.colors.reset);
    
    // Status info
    const statusText = `Node ${content.node}/${content.maxNodes} • ${content.callerCount} callers online`;
    lines.push(borderedLine(statusText, this.colors.white));
    
    // Bottom border
    lines.push(this.colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + this.colors.reset);
    
    return lines.join('\r\n') + '\r\n';
  }

  private renderMenu(content: MenuContent): string {
    const lines: string[] = [];
    const boxWidth = 62;
    
    // Helper to create a bordered line
    const borderedLine = (text: string, color: string = ''): string => {
      const centeredText = this.centerText(text, boxWidth);
      const coloredText = color ? color + centeredText + this.colors.reset : centeredText;
      return this.colors.cyan + '║' + this.colors.reset + coloredText + this.colors.cyan + '║' + this.colors.reset;
    };
    
    const emptyLine = (): string => {
      return this.colors.cyan + '║' + this.colors.reset + ' '.repeat(boxWidth) + this.colors.cyan + '║' + this.colors.reset;
    };
    
    // Title
    lines.push('');
    lines.push(this.colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + this.colors.reset);
    lines.push(borderedLine(content.title, this.colors.brightYellow + this.colors.bold));
    lines.push(this.colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + this.colors.reset);
    lines.push(emptyLine());
    
    // Options
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
    lines.push(this.colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + this.colors.reset);
    lines.push('');
    
    return lines.join('\r\n');
  }

  private renderMessage(content: MessageContent): string {
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

  private renderPrompt(content: PromptContent): string {
    return this.colors.brightWhite + content.text + this.colors.reset;
  }

  private renderError(content: ErrorContent): string {
    return this.colors.brightRed + '✗ ' + content.message + this.colors.reset + '\r\n';
  }

  private renderRawANSI(content: RawANSIContent): string {
    // For web terminals, we pass through ANSI but ensure proper line endings
    return content.ansi.replace(/\n/g, '\r\n');
  }

  /**
   * Center text within a given width
   */
  private centerText(text: string, width: number): string {
    // Calculate visible length (excluding ANSI codes)
    const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, Math.floor((width - visibleLength) / 2));
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - visibleLength);
  }

  /**
   * Pad text to the right
   */
  private padRight(text: string, width: number): string {
    // Calculate visible length (excluding ANSI codes)
    const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, width - visibleLength);
    return text + ' '.repeat(padding);
  }
}
