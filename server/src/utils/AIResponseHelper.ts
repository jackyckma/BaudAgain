import type { AISysOp } from '../ai/AISysOp.js';
import type { TerminalRenderer, RawANSIContent, MessageContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';

/**
 * AI Response Helper
 * 
 * Provides consistent handling of AI-generated responses with fallback support.
 * Eliminates duplication across handlers that use AI features.
 */
export class AIResponseHelper {
  /**
   * Render an AI-generated response with fallback handling
   * 
   * @param aiSysOp - The AI SysOp instance (optional)
   * @param generator - Function that generates the AI response
   * @param renderer - Terminal renderer for formatting
   * @param fallbackMessage - Message to display if AI is unavailable
   * @param wrapNewlines - Whether to wrap response with newlines
   * @returns Formatted response string
   */
  static async renderAIResponse(
    aiSysOp: AISysOp | undefined,
    generator: () => Promise<string>,
    renderer: TerminalRenderer,
    fallbackMessage: string,
    wrapNewlines: boolean = true
  ): Promise<string> {
    if (!aiSysOp) {
      return AIResponseHelper.renderFallback(fallbackMessage, renderer);
    }
    
    try {
      const aiResponse = await generator();
      const wrappedResponse = wrapNewlines 
        ? `\r\n${aiResponse}\r\n` 
        : aiResponse;
      
      const aiContent: RawANSIContent = {
        type: ContentType.RAW_ANSI,
        ansi: wrappedResponse,
      };
      
      return renderer.render(aiContent);
    } catch (error) {
      console.error('AI response error:', error);
      return AIResponseHelper.renderFallback(fallbackMessage, renderer);
    }
  }
  
  /**
   * Render a fallback message when AI is unavailable
   */
  private static renderFallback(
    message: string,
    renderer: TerminalRenderer
  ): string {
    const fallback: MessageContent = {
      type: ContentType.MESSAGE,
      text: message,
      style: 'success',
    };
    return renderer.render(fallback);
  }
}
