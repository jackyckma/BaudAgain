/**
 * Terminal Abstraction Layer
 * 
 * This module provides a structured way to represent terminal content
 * and render it appropriately for different client types.
 */

/**
 * Content types that can be rendered
 */
export enum ContentType {
  WELCOME_SCREEN = 'welcome_screen',
  MENU = 'menu',
  MESSAGE = 'message',
  PROMPT = 'prompt',
  ERROR = 'error',
  RAW_ANSI = 'raw_ansi',
}

/**
 * Base content structure
 */
export interface TerminalContent {
  type: ContentType;
}

/**
 * Welcome screen content
 */
export interface WelcomeScreenContent extends TerminalContent {
  type: ContentType.WELCOME_SCREEN;
  title: string;
  subtitle?: string;
  tagline?: string;
  node: string;
  maxNodes: string;
  callerCount: string;
}

/**
 * Menu content
 */
export interface MenuContent extends TerminalContent {
  type: ContentType.MENU;
  title: string;
  options: MenuOptionDisplay[];
}

export interface MenuOptionDisplay {
  key: string;
  label: string;
  description?: string;
}

/**
 * Message content
 */
export interface MessageContent extends TerminalContent {
  type: ContentType.MESSAGE;
  text: string;
  style?: 'normal' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * Prompt content
 */
export interface PromptContent extends TerminalContent {
  type: ContentType.PROMPT;
  text: string;
}

/**
 * Error content
 */
export interface ErrorContent extends TerminalContent {
  type: ContentType.ERROR;
  message: string;
}

/**
 * Raw ANSI content (for backward compatibility)
 */
export interface RawANSIContent extends TerminalContent {
  type: ContentType.RAW_ANSI;
  ansi: string;
}

/**
 * Union type of all content types
 */
export type AnyTerminalContent =
  | WelcomeScreenContent
  | MenuContent
  | MessageContent
  | PromptContent
  | ErrorContent
  | RawANSIContent;

/**
 * Terminal renderer interface
 */
export interface TerminalRenderer {
  /**
   * Render content to a string suitable for the target terminal
   */
  render(content: AnyTerminalContent): string;
}
