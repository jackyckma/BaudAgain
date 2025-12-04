import type { AISysOp } from '../ai/AISysOp.js';
import type { TerminalRenderer, RawANSIContent, MessageContent, LoadingContent } from '@baudagain/shared';
import { ContentType } from '@baudagain/shared';

/**
 * AI Response Helper
 * 
 * Provides consistent handling of AI-generated responses with fallback support.
 * Eliminates duplication across handlers that use AI features.
 */
export class AIResponseHelper {
  /**
   * Render an AI-generated response with fallback handling and loading indicator
   * 
   * @param aiSysOp - The AI SysOp instance (optional)
   * @param generator - Function that generates the AI response
   * @param renderer - Terminal renderer for formatting
   * @param fallbackMessage - Message to display if AI is unavailable
   * @param wrapNewlines - Whether to wrap response with newlines
   * @param loadingMessage - Optional loading message to display while waiting
   * @returns Formatted response string
   */
  static async renderAIResponse(
    aiSysOp: AISysOp | undefined,
    generator: () => Promise<string>,
    renderer: TerminalRenderer,
    fallbackMessage: string,
    wrapNewlines: boolean = true,
    loadingMessage?: string
  ): Promise<string> {
    if (!aiSysOp) {
      return AIResponseHelper.renderFallback(fallbackMessage, renderer);
    }
    
    try {
      // Show loading indicator if message provided
      let output = '';
      if (loadingMessage) {
        const loading: LoadingContent = {
          type: ContentType.LOADING,
          message: loadingMessage,
          style: 'simple',
        };
        output = renderer.render(loading);
      }
      
      const aiResponse = await generator();
      const wrappedResponse = wrapNewlines 
        ? `\r\n${aiResponse}\r\n` 
        : aiResponse;
      
      const aiContent: RawANSIContent = {
        type: ContentType.RAW_ANSI,
        ansi: wrappedResponse,
      };
      
      return output + renderer.render(aiContent);
    } catch (error) {
      console.error('AI response error:', error);
      return AIResponseHelper.renderFallback(fallbackMessage, renderer);
    }
  }
  
  /**
   * Render an AI-generated response with timeout handling
   * 
   * @param aiSysOp - The AI SysOp instance (optional)
   * @param generator - Function that generates the AI response
   * @param renderer - Terminal renderer for formatting
   * @param fallbackMessage - Message to display if AI is unavailable
   * @param timeoutMs - Timeout in milliseconds (default: 5000)
   * @param wrapNewlines - Whether to wrap response with newlines
   * @param loadingMessage - Optional loading message to display while waiting
   * @returns Formatted response string
   */
  static async renderAIResponseWithTimeout(
    aiSysOp: AISysOp | undefined,
    generator: () => Promise<string>,
    renderer: TerminalRenderer,
    fallbackMessage: string,
    timeoutMs: number = 5000,
    wrapNewlines: boolean = true,
    loadingMessage?: string
  ): Promise<string> {
    if (!aiSysOp) {
      return AIResponseHelper.renderFallback(fallbackMessage, renderer);
    }
    
    try {
      // Show loading indicator if message provided
      let output = '';
      if (loadingMessage) {
        const loading: LoadingContent = {
          type: ContentType.LOADING,
          message: loadingMessage,
          style: 'simple',
        };
        output = renderer.render(loading);
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI response timeout')), timeoutMs);
      });
      
      // Race between AI response and timeout
      const aiResponse = await Promise.race([
        generator(),
        timeoutPromise
      ]);
      
      const wrappedResponse = wrapNewlines 
        ? `\r\n${aiResponse}\r\n` 
        : aiResponse;
      
      const aiContent: RawANSIContent = {
        type: ContentType.RAW_ANSI,
        ansi: wrappedResponse,
      };
      
      return output + renderer.render(aiContent);
    } catch (error) {
      console.error('AI response error:', error);
      
      // Provide more specific error message for timeout
      if (error instanceof Error && error.message === 'AI response timeout') {
        const timeoutError: MessageContent = {
          type: ContentType.MESSAGE,
          text: 'The AI is taking longer than expected. Please try again.',
          style: 'warning',
        };
        return renderer.render(timeoutError);
      }
      
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
