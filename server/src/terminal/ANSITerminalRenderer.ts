import type { RawANSIContent } from '@baudagain/shared';
import { BaseTerminalRenderer } from './BaseTerminalRenderer.js';

/**
 * ANSI Terminal Renderer
 * 
 * Renders structured content as ANSI escape sequences for traditional
 * terminal clients (Telnet, SSH, etc.)
 */
export class ANSITerminalRenderer extends BaseTerminalRenderer {
  /**
   * Render raw ANSI content as-is for traditional terminals
   */
  protected renderRawANSI(content: RawANSIContent): string {
    return content.ansi;
  }
}
