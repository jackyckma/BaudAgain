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
} from '@baudagain/shared';

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
      default:
        return '';
    }
  }

  protected renderWelcomeScreen(content: WelcomeScreenContent): string {
    const lines: string[] = [];
    const boxWidth = 62;
    
    const borderedLine = (text: string, color: string = ''): string => {
      const centeredText = this.centerText(text, boxWidth);
      const coloredText = color ? color + centeredText + this.colors.reset : centeredText;
      return this.colors.cyan + '║' + this.colors.reset + coloredText + this.colors.cyan + '║' + this.colors.reset;
    };
    
    const emptyLine = (): string => {
      return this.colors.cyan + '║' + this.colors.reset + ' '.repeat(boxWidth) + this.colors.cyan + '║' + this.colors.reset;
    };
    
    lines.push(this.colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + this.colors.reset);
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
    
    lines.push(this.colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + this.colors.reset);
    
    const statusText = `Node ${content.node}/${content.maxNodes} • ${content.callerCount} callers online`;
    lines.push(borderedLine(statusText, this.colors.white));
    lines.push(this.colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + this.colors.reset);
    
    return lines.join('\r\n') + '\r\n';
  }

  protected renderMenu(content: MenuContent): string {
    const lines: string[] = [];
    const boxWidth = 62;
    
    const borderedLine = (text: string, color: string = ''): string => {
      const centeredText = this.centerText(text, boxWidth);
      const coloredText = color ? color + centeredText + this.colors.reset : centeredText;
      return this.colors.cyan + '║' + this.colors.reset + coloredText + this.colors.cyan + '║' + this.colors.reset;
    };
    
    const emptyLine = (): string => {
      return this.colors.cyan + '║' + this.colors.reset + ' '.repeat(boxWidth) + this.colors.cyan + '║' + this.colors.reset;
    };
    
    lines.push('');
    lines.push(this.colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + this.colors.reset);
    lines.push(borderedLine(content.title, this.colors.brightYellow + this.colors.bold));
    lines.push(this.colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + this.colors.reset);
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
    lines.push(this.colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + this.colors.reset);
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

  /**
   * Render raw ANSI content (can be overridden by subclasses)
   */
  protected abstract renderRawANSI(content: RawANSIContent): string;

  /**
   * Center text within a given width
   */
  protected centerText(text: string, width: number): string {
    const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, Math.floor((width - visibleLength) / 2));
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - visibleLength);
  }

  /**
   * Pad text to the right
   */
  protected padRight(text: string, width: number): string {
    const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, width - visibleLength);
    return text + ' '.repeat(padding);
  }
}
