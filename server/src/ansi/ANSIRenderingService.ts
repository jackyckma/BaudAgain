/**
 * ANSIRenderingService - Centralized ANSI rendering service
 * 
 * This service provides:
 * - Context-aware rendering (terminal, telnet, web)
 * - Guaranteed frame alignment
 * - Automatic line ending management
 * - Color management
 * - Template-based rendering
 * - Validation
 */

import { ANSIFrameBuilder, FrameLine, FrameOptions } from './ANSIFrameBuilder.js';
import { ANSIColorizer, ColorName } from './ANSIColorizer.js';
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';
import { ANSIValidator } from './ANSIValidator.js';

/**
 * Render context - defines the target environment
 */
export interface RenderContext {
  type: 'terminal' | 'telnet' | 'web';
  width: number;  // Target width (e.g., 80 columns)
}

/**
 * Common render contexts
 */
export const RENDER_CONTEXTS = {
  TERMINAL_80: { type: 'terminal', width: 80 } as RenderContext,
  TERMINAL_132: { type: 'terminal', width: 132 } as RenderContext,
  TELNET_80: { type: 'telnet', width: 80 } as RenderContext,
  WEB_80: { type: 'web', width: 80 } as RenderContext,
} as const;

/**
 * Render options
 */
export interface RenderOptions {
  context: RenderContext;
  validate?: boolean;  // Auto-validate output (default: true in dev)
}

/**
 * Template definition
 */
export interface Template {
  name: string;
  width: number;
  style: 'single' | 'double';
  content: FrameLine[];
  variables: string[];  // List of variable names used
}

/**
 * Custom error for rendering issues
 */
export class ANSIRenderingError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ANSIRenderingError';
  }
}

/**
 * Custom error for width exceeded
 */
export class WidthExceededError extends ANSIRenderingError {
  constructor(public actualWidth: number, public maxWidth: number) {
    super(`Content width ${actualWidth} exceeds maximum ${maxWidth}`);
    this.name = 'WidthExceededError';
  }
}

/**
 * ANSIRenderingService - Main rendering service
 */
export class ANSIRenderingService {
  /**
   * Color code mapping
   */
  private readonly COLOR_CODES: Record<ColorName, string> = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };

  /**
   * Get ANSI code for a color name
   * 
   * @param color - Color name
   * @returns ANSI escape code
   */
  private getANSICodeForColor(color: ColorName): string {
    return this.COLOR_CODES[color];
  }

  /**
   * Get line ending for context
   * 
   * @param context - Render context
   * @returns Line ending string (LF or CRLF)
   */
  getLineEnding(context: RenderContext): string {
    // Telnet uses CRLF, terminal and web use LF
    return context.type === 'telnet' ? '\r\n' : '\n';
  }

  /**
   * Render a frame with content
   * 
   * @param content - Frame content (array of lines)
   * @param options - Frame options
   * @param context - Render context
   * @param validate - Whether to validate output (default: true)
   * @returns Rendered frame as string
   */
  renderFrame(
    content: FrameLine[],
    options: FrameOptions,
    context: RenderContext,
    validate: boolean = true
  ): string {
    // Create frame builder with options, enforcing maxWidth from context
    const builder = new ANSIFrameBuilder({
      width: options.width || context.width,
      maxWidth: options.maxWidth || context.width,
      padding: options.padding,
      style: options.style,
      align: options.align,
    });

    // Build frame (returns array of lines)
    // This will throw if width exceeds maxWidth
    const lines = builder.build(content);
    
    // For web context, convert ANSI codes to HTML
    let processedLines = lines;
    if (context.type === 'web') {
      processedLines = lines.map(line => ANSIColorizer.toHTML(line));
    }
    
    // Join lines with appropriate line ending
    const lineEnding = this.getLineEnding(context);
    const result = processedLines.join(lineEnding);

    // Validate if requested (validate before HTML conversion)
    if (validate) {
      const validation = ANSIValidator.validateFrame(lines.join('\n'));
      if (!validation.valid) {
        throw new ANSIRenderingError(
          'Frame validation failed',
          { issues: validation.issues }
        );
      }
      
      // Check width doesn't exceed context width
      const widthValidation = ANSIValidator.validateMaxWidth(lines.join('\n'), context.width);
      if (!widthValidation.valid) {
        const maxWidth = Math.max(...lines.map(line => ANSIWidthCalculator.calculate(line)));
        throw new WidthExceededError(maxWidth, context.width);
      }
    }

    return result;
  }

  /**
   * Render a frame with title
   * 
   * @param title - Frame title
   * @param content - Frame content (array of lines)
   * @param options - Frame options
   * @param context - Render context
   * @param titleColor - Optional title color
   * @param validate - Whether to validate output (default: true)
   * @returns Rendered frame as string
   */
  renderFrameWithTitle(
    title: string,
    content: FrameLine[],
    options: FrameOptions,
    context: RenderContext,
    titleColor?: ColorName,
    validate: boolean = true
  ): string {
    // Create frame builder with options, enforcing maxWidth from context
    const builder = new ANSIFrameBuilder({
      width: options.width || context.width,
      maxWidth: options.maxWidth || context.width,
      padding: options.padding,
      style: options.style,
      align: options.align,
    });

    // Convert ColorName to ANSI code if provided
    const titleColorCode = titleColor ? this.getANSICodeForColor(titleColor) : undefined;

    // Build frame with title (returns array of lines)
    // This will throw if width exceeds maxWidth
    const lines = builder.buildWithTitle(title, content, titleColorCode);
    
    // For web context, convert ANSI codes to HTML
    let processedLines = lines;
    if (context.type === 'web') {
      processedLines = lines.map(line => ANSIColorizer.toHTML(line));
    }
    
    // Join lines with appropriate line ending
    const lineEnding = this.getLineEnding(context);
    const result = processedLines.join(lineEnding);

    // Validate if requested
    if (validate) {
      const validation = ANSIValidator.validateFrame(lines.join('\n'));
      if (!validation.valid) {
        throw new ANSIRenderingError(
          'Frame validation failed',
          { issues: validation.issues }
        );
      }
      
      // Check width doesn't exceed context width
      const widthValidation = ANSIValidator.validateMaxWidth(lines.join('\n'), context.width);
      if (!widthValidation.valid) {
        const maxWidth = Math.max(...lines.map(line => ANSIWidthCalculator.calculate(line)));
        throw new WidthExceededError(maxWidth, context.width);
      }
    }

    return result;
  }

  /**
   * Render text with color
   * 
   * @param text - Text to render
   * @param color - Optional color name
   * @param context - Render context
   * @returns Rendered text
   */
  renderText(text: string, color: ColorName | undefined, context: RenderContext): string {
    // Apply color if specified
    let result = text;
    if (color) {
      result = ANSIColorizer.colorize(text, color);
    }

    // Convert to HTML for web context
    if (context.type === 'web') {
      result = ANSIColorizer.toHTML(result);
    }

    return result;
  }

  /**
   * Render a template with variables
   * 
   * @param template - Template definition
   * @param variables - Variable values
   * @param context - Render context
   * @param validate - Whether to validate output (default: true)
   * @returns Rendered template
   */
  renderTemplate(
    template: Template,
    variables: Record<string, string>,
    context: RenderContext,
    validate: boolean = true
  ): string {
    // Validate that all required variables are provided
    for (const varName of template.variables) {
      if (!Object.prototype.hasOwnProperty.call(variables, varName)) {
        throw new ANSIRenderingError(
          `Missing required variable: ${varName}`,
          { template: template.name, missingVariable: varName }
        );
      }
    }

    // Substitute variables in content
    const substitutedContent = template.content.map(line => {
      let text = line.text;
      
      // Replace all variables in the format {{variableName}}
      for (const [varName, varValue] of Object.entries(variables)) {
        const placeholder = `{{${varName}}}`;
        
        // Escape special regex characters in the placeholder
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Escape special replacement patterns in the value ($&, $`, $', $n)
        const escapedValue = varValue.replace(/\$/g, '$$$$');
        
        text = text.replace(new RegExp(escapedPlaceholder, 'g'), escapedValue);
      }
      
      return {
        ...line,
        text,
      };
    });

    // Render the frame with substituted content
    return this.renderFrame(
      substitutedContent,
      {
        width: template.width,
        style: template.style,
      },
      context,
      validate
    );
  }
}
