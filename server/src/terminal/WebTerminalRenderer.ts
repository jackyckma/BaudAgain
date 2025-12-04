import type { RawANSIContent } from '@baudagain/shared';
import { BaseTerminalRenderer } from './BaseTerminalRenderer.js';

/**
 * Web Terminal Renderer
 * 
 * Renders structured content with ANSI codes optimized for xterm.js
 * This renderer ensures proper formatting and avoids issues with
 * raw ANSI art that may not render correctly in web terminals.
 * 
 * Extends BaseTerminalRenderer to inherit shared rendering logic.
 */
export class WebTerminalRenderer extends BaseTerminalRenderer {
  /**
   * Render raw ANSI content for web terminals
   * Ensures proper line endings for xterm.js
   */
  protected renderRawANSI(content: RawANSIContent): string {
    // For web terminals, we pass through ANSI but ensure proper line endings
    return content.ansi.replace(/\n/g, '\r\n');
  }
}
