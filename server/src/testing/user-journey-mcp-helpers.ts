/**
 * MCP Test Infrastructure for User Journey Testing
 * 
 * This module provides comprehensive test helpers for validating the complete
 * user journey through the BaudAgain BBS system using Chrome DevTools MCP.
 * 
 * Requirements validated: 11.1
 */

/**
 * Test user personas for user journey testing
 */
export interface UserJourneyPersona {
  handle: string;
  password: string;
  realName?: string;
  location?: string;
}

/**
 * Predefined test personas for user journey tests
 */
export const JOURNEY_TEST_PERSONAS = {
  NEW_USER: {
    handle: `NewUser${Date.now().toString().slice(-6)}`,
    password: 'NewPass123!',
    realName: 'New Journey User',
    location: 'Test City',
  } as UserJourneyPersona,
  
  EXISTING_USER: {
    handle: 'JourneyVet',
    password: 'VetPass456!',
    realName: 'Journey Veteran',
    location: 'Test Town',
  } as UserJourneyPersona,
};

/**
 * Test URLs for user journey testing
 */
export const JOURNEY_TEST_URLS = {
  TERMINAL: 'http://localhost:8080',
  API_BASE: 'http://localhost:8080/api/v1',
};

/**
 * Test timeouts for various operations
 */
export const JOURNEY_TEST_TIMEOUTS = {
  PAGE_LOAD: 10000,
  WEBSOCKET_CONNECT: 5000,
  WELCOME_SCREEN: 5000,
  PROMPT_APPEAR: 3000,
  MENU_DISPLAY: 3000,
  MESSAGE_LOAD: 5000,
  DOOR_LAUNCH: 5000,
  AI_RESPONSE: 10000,
};

/**
 * Expected text patterns for validation
 */
export const EXPECTED_TEXT = {
  WELCOME: ['BaudAgain', 'Welcome', 'Enter your handle'],
  REGISTRATION: ['NEW', 'handle', 'password'],
  LOGIN: ['password', 'Enter'],
  MAIN_MENU: ['Messages', 'Doors', 'Goodbye'],
  MESSAGE_BASE_LIST: ['message base', 'select'],
  MESSAGE_LIST: ['subject', 'author', 'date'],
  DOOR_LIST: ['door', 'game', 'select'],
};

/**
 * ANSI width validation
 */
export interface WidthValidation {
  maxWidth: number;
  allLinesValid: boolean;
  violations: Array<{ lineNumber: number; width: number; content: string }>;
}

/**
 * Validate that all lines in content are within 80 characters
 * Strips ANSI codes before measuring
 */
export function validateLineWidth(content: string, maxWidth: number = 80): WidthValidation {
  const lines = content.split('\n');
  const violations: Array<{ lineNumber: number; width: number; content: string }> = [];
  
  lines.forEach((line, index) => {
    // Strip ANSI escape codes for accurate width measurement
    const strippedLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    const width = strippedLine.length;
    
    if (width > maxWidth) {
      violations.push({
        lineNumber: index + 1,
        width,
        content: strippedLine.substring(0, 100) + (strippedLine.length > 100 ? '...' : ''),
      });
    }
  });
  
  return {
    maxWidth,
    allLinesValid: violations.length === 0,
    violations,
  };
}

/**
 * Frame validation
 */
export interface FrameValidation {
  hasTopBorder: boolean;
  hasBottomBorder: boolean;
  hasLeftBorder: boolean;
  hasRightBorder: boolean;
  bordersAligned: boolean;
  issues: string[];
}

/**
 * Validate frame borders are properly aligned
 */
export function validateFrameBorders(content: string): FrameValidation {
  const lines = content.split('\n');
  const issues: string[] = [];
  
  // Look for box-drawing characters
  const boxChars = /[─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬]/;
  
  const hasTopBorder = lines.some(line => /[┌┬┐╔╦╗]/.test(line));
  const hasBottomBorder = lines.some(line => /[└┴┘╚╩╝]/.test(line));
  const hasLeftBorder = lines.some(line => /^[│║]/.test(line.replace(/\x1b\[[0-9;]*m/g, '')));
  const hasRightBorder = lines.some(line => /[│║]$/.test(line.replace(/\x1b\[[0-9;]*m/g, '')));
  
  if (!hasTopBorder) issues.push('Missing top border');
  if (!hasBottomBorder) issues.push('Missing bottom border');
  if (!hasLeftBorder) issues.push('Missing left border');
  if (!hasRightBorder) issues.push('Missing right border');
  
  // Check if borders are aligned (all frame lines should have similar width)
  const frameLines = lines.filter(line => boxChars.test(line));
  if (frameLines.length > 0) {
    const widths = frameLines.map(line => line.replace(/\x1b\[[0-9;]*m/g, '').length);
    const minWidth = Math.min(...widths);
    const maxWidth = Math.max(...widths);
    
    if (maxWidth - minWidth > 2) {
      issues.push(`Frame borders not aligned (width varies from ${minWidth} to ${maxWidth})`);
    }
  }
  
  return {
    hasTopBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasRightBorder,
    bordersAligned: issues.length === 0,
    issues,
  };
}

/**
 * Author handle validation
 */
export interface AuthorValidation {
  hasAuthor: boolean;
  authorNotUndefined: boolean;
  authorNotNull: boolean;
  authorNotEmpty: boolean;
  issues: string[];
}

/**
 * Validate that author handles are displayed correctly (not "undefined")
 */
export function validateAuthorDisplay(content: string): AuthorValidation {
  const issues: string[] = [];
  
  // Check for "undefined" in author context
  const hasUndefined = /by undefined|author.*undefined|from.*undefined/i.test(content);
  if (hasUndefined) {
    issues.push('Found "undefined" in author display');
  }
  
  // Check for "null" in author context
  const hasNull = /by null|author.*null|from.*null/i.test(content);
  if (hasNull) {
    issues.push('Found "null" in author display');
  }
  
  // Check if author field exists
  const hasAuthor = /by |author|from /i.test(content);
  
  // Check if author field is empty
  const hasEmptyAuthor = /by\s*$|author:\s*$|from:\s*$/im.test(content);
  if (hasEmptyAuthor) {
    issues.push('Found empty author field');
  }
  
  return {
    hasAuthor,
    authorNotUndefined: !hasUndefined,
    authorNotNull: !hasNull,
    authorNotEmpty: !hasEmptyAuthor,
    issues,
  };
}

/**
 * Prompt counting validation
 */
export interface PromptValidation {
  promptCount: number;
  singlePrompt: boolean;
  promptText: string[];
}

/**
 * Count prompts in terminal output
 */
export function countPrompts(content: string): PromptValidation {
  // Look for common prompt patterns
  const promptPatterns = [
    /Enter your handle/gi,
    /Enter handle/gi,
    /Your handle/gi,
    /Handle:/gi,
  ];
  
  const promptText: string[] = [];
  let totalCount = 0;
  
  promptPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      totalCount += matches.length;
      promptText.push(...matches);
    }
  });
  
  return {
    promptCount: totalCount,
    singlePrompt: totalCount === 1,
    promptText,
  };
}

/**
 * Test data generators for user journey tests
 */
export const JOURNEY_TEST_DATA = {
  /**
   * Generate a unique test message
   */
  generateMessage: (index: number) => ({
    subject: `Journey Test Message ${index}`,
    body: `This is test message ${index} for user journey testing. It validates message posting and display functionality.`,
  }),
  
  /**
   * Generate a test message base
   */
  generateMessageBase: () => ({
    name: `Journey Test Base ${Date.now()}`,
    description: 'Test message base for user journey testing',
    accessLevelRead: 0,
    accessLevelWrite: 10,
  }),
  
  /**
   * Generate test user data
   */
  generateUser: () => {
    const timestamp = Date.now().toString().slice(-6);
    return {
      handle: `JTest${timestamp}`,
      password: 'TestPass123!',
      realName: 'Journey Test User',
      location: 'Test Location',
    };
  },
};

/**
 * API helper functions for test data setup
 */
export class JourneyTestAPI {
  private baseUrl: string;
  private token?: string;
  
  constructor(baseUrl: string = JOURNEY_TEST_URLS.API_BASE) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Register a new user
   */
  async registerUser(userData: UserJourneyPersona): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        return { success: true, token: data.token };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Login an existing user
   */
  async loginUser(handle: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        return { success: true, token: data.token };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Create a message base
   */
  async createMessageBase(baseData: any): Promise<{ success: boolean; baseId?: string; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/message-bases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(baseData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, baseId: data.id };
      } else {
        return { success: false, error: data.error || 'Failed to create message base' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Post a message to a message base
   */
  async postMessage(baseId: string, messageData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/message-bases/${baseId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(messageData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, messageId: data.id };
      } else {
        return { success: false, error: data.error || 'Failed to post message' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get messages from a message base
   */
  async getMessages(baseId: string): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/message-bases/${baseId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, messages: data };
      } else {
        return { success: false, error: data.error || 'Failed to get messages' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get message bases
   */
  async getMessageBases(): Promise<{ success: boolean; bases?: any[]; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/message-bases`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, bases: data };
      } else {
        return { success: false, error: data.error || 'Failed to get message bases' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * Screenshot helper for consistent naming
 */
export function generateJourneyScreenshotPath(testName: string, step: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sanitizedTest = testName.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedStep = step.replace(/[^a-zA-Z0-9]/g, '_');
  return `screenshots/journey_${sanitizedTest}_${sanitizedStep}_${timestamp}.png`;
}

/**
 * Test result interface
 */
export interface JourneyTestResult {
  testName: string;
  step: string;
  success: boolean;
  details: string;
  screenshot?: string;
  validation?: any;
  timestamp: Date;
}

/**
 * Test result logger
 */
export class JourneyTestLogger {
  private results: JourneyTestResult[] = [];
  
  log(result: Omit<JourneyTestResult, 'timestamp'>): void {
    this.results.push({
      ...result,
      timestamp: new Date(),
    });
  }
  
  getResults(): JourneyTestResult[] {
    return this.results;
  }
  
  getSummary(): { total: number; passed: number; failed: number } {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
    };
  }
  
  printResults(): void {
    console.log('\n' + '='.repeat(70));
    console.log('USER JOURNEY TEST RESULTS');
    console.log('='.repeat(70));
    
    this.results.forEach(result => {
      const status = result.success ? '✓ PASS' : '✗ FAIL';
      const color = result.success ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      
      console.log(`\n${color}${status}${reset} ${result.testName} - ${result.step}`);
      console.log(`  ${result.details}`);
      
      if (result.screenshot) {
        console.log(`  Screenshot: ${result.screenshot}`);
      }
      
      if (result.validation) {
        console.log('  Validation:', JSON.stringify(result.validation, null, 2));
      }
    });
    
    const summary = this.getSummary();
    console.log('\n' + '='.repeat(70));
    console.log(`SUMMARY: ${summary.passed}/${summary.total} passed, ${summary.failed} failed`);
    console.log('='.repeat(70));
  }
}
