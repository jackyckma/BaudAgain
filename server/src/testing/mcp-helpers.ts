/**
 * MCP-based Testing Helpers for BaudAgain BBS
 * 
 * This module provides utilities for automated user testing using the Chrome DevTools MCP.
 * These helpers enable comprehensive end-to-end testing of the BBS terminal interface,
 * control panel, and REST API.
 */

/**
 * Test user personas for different testing scenarios
 */
export interface TestPersona {
  handle: string;
  password: string;
  realName?: string;
  location?: string;
  bio?: string;
  accessLevel?: number;
}

/**
 * Predefined test personas
 */
export const TEST_PERSONAS = {
  NEW_USER: {
    handle: 'TestNewbie',
    password: 'TestPass123!',
    realName: 'Test Newbie',
    location: 'Test City',
    bio: 'A new user for testing',
  } as TestPersona,
  
  RETURNING_USER: {
    handle: 'TestVeteran',
    password: 'VetPass456!',
    realName: 'Test Veteran',
    location: 'Test Town',
    bio: 'A returning user for testing',
  } as TestPersona,
  
  ADMIN_USER: {
    handle: 'TestAdmin',
    password: 'AdminPass789!',
    realName: 'Test Administrator',
    location: 'Admin HQ',
    bio: 'An admin user for testing',
    accessLevel: 255,
  } as TestPersona,
};

/**
 * Test scenarios for different user journeys
 */
export interface TestScenario {
  name: string;
  description: string;
  persona: TestPersona;
  steps: string[];
  expectedOutcomes: string[];
}

/**
 * Predefined test scenarios
 */
export const TEST_SCENARIOS: Record<string, TestScenario> = {
  NEW_USER_REGISTRATION: {
    name: 'New User Registration',
    description: 'Complete registration flow for a new user',
    persona: TEST_PERSONAS.NEW_USER,
    steps: [
      'Navigate to BBS terminal URL',
      'Wait for welcome screen',
      'Enter "NEW" command',
      'Enter handle',
      'Enter password',
      'Confirm password',
      'Enter optional profile information',
      'Verify AI SysOp welcome message',
    ],
    expectedOutcomes: [
      'Welcome screen displays with ANSI formatting',
      'Registration prompts are clear',
      'AI welcome message appears with color codes',
      'User is logged in after registration',
      'Main menu displays',
    ],
  },
  
  RETURNING_USER_LOGIN: {
    name: 'Returning User Login',
    description: 'Login flow for an existing user',
    persona: TEST_PERSONAS.RETURNING_USER,
    steps: [
      'Navigate to BBS terminal URL',
      'Wait for welcome screen',
      'Enter handle',
      'Enter password',
      'Verify AI SysOp greeting',
      'Verify last login date',
      'Verify new message count',
    ],
    expectedOutcomes: [
      'Welcome screen displays',
      'Login prompts are clear',
      'AI greeting appears',
      'Last login information displays',
      'Main menu displays',
    ],
  },
  
  MESSAGE_BASE_INTERACTION: {
    name: 'Message Base Interaction',
    description: 'Browse and post messages in message bases',
    persona: TEST_PERSONAS.RETURNING_USER,
    steps: [
      'Login as returning user',
      'Navigate to Message Bases',
      'Select a message base',
      'Read existing messages',
      'Post a new message',
      'Verify message appears',
    ],
    expectedOutcomes: [
      'Message base list displays',
      'Messages show subject, author, timestamp',
      'Message posting succeeds',
      'New message is visible',
    ],
  },
  
  DOOR_GAME_PLAY: {
    name: 'Door Game Play',
    description: 'Enter and play The Oracle door game',
    persona: TEST_PERSONAS.RETURNING_USER,
    steps: [
      'Login as returning user',
      'Navigate to Door Games',
      'Enter The Oracle',
      'Ask a question',
      'Receive AI response',
      'Exit door game',
    ],
    expectedOutcomes: [
      'Door games list displays',
      'Oracle introduction screen appears',
      'AI response is mystical and formatted',
      'Response is under 150 characters',
      'Exit returns to door games menu',
    ],
  },
  
  CONTROL_PANEL_ADMIN: {
    name: 'Control Panel Administration',
    description: 'Admin tasks in the control panel',
    persona: TEST_PERSONAS.ADMIN_USER,
    steps: [
      'Navigate to control panel URL',
      'Login with admin credentials',
      'View dashboard',
      'Manage users',
      'Manage message bases',
      'View AI settings',
    ],
    expectedOutcomes: [
      'Dashboard displays current callers',
      'User list shows all users',
      'Message base management works',
      'AI settings are visible',
    ],
  },
};

/**
 * Helper to wait for text to appear on the page
 */
export async function waitForText(text: string, timeoutMs: number = 5000): Promise<void> {
  // This would be implemented using MCP wait_for tool
  // For now, this is a placeholder that documents the interface
  throw new Error('waitForText must be called via MCP chrome_devtools_wait_for tool');
}

/**
 * Helper to take a screenshot with a descriptive filename
 */
export function generateScreenshotFilename(scenario: string, step: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedScenario = scenario.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedStep = step.replace(/[^a-zA-Z0-9]/g, '_');
  return `screenshots/${sanitizedScenario}_${sanitizedStep}_${timestamp}.png`;
}

/**
 * Helper to validate ANSI formatting in terminal output
 */
export interface ANSIValidation {
  hasColorCodes: boolean;
  hasBoxDrawing: boolean;
  colorCodesFound: string[];
  issues: string[];
}

export function validateANSIFormatting(content: string): ANSIValidation {
  const validation: ANSIValidation = {
    hasColorCodes: false,
    hasBoxDrawing: false,
    colorCodesFound: [],
    issues: [],
  };
  
  // Check for ANSI color codes (ESC[...m)
  const colorCodeRegex = /\x1b\[\d+(?:;\d+)*m/g;
  const colorCodes = content.match(colorCodeRegex);
  if (colorCodes && colorCodes.length > 0) {
    validation.hasColorCodes = true;
    validation.colorCodesFound = colorCodes;
  } else {
    validation.issues.push('No ANSI color codes found');
  }
  
  // Check for box-drawing characters (CP437)
  const boxDrawingChars = /[─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬]/;
  if (boxDrawingChars.test(content)) {
    validation.hasBoxDrawing = true;
  }
  
  return validation;
}

/**
 * Helper to validate response time
 */
export interface ResponseTimeValidation {
  responseTimeMs: number;
  withinLimit: boolean;
  limitMs: number;
}

export function validateResponseTime(
  startTime: number,
  endTime: number,
  limitMs: number
): ResponseTimeValidation {
  const responseTimeMs = endTime - startTime;
  return {
    responseTimeMs,
    withinLimit: responseTimeMs <= limitMs,
    limitMs,
  };
}

/**
 * Helper to validate message length
 */
export interface LengthValidation {
  length: number;
  withinLimit: boolean;
  limitChars: number;
}

export function validateLength(content: string, limitChars: number): LengthValidation {
  // Strip ANSI codes for accurate character count
  const strippedContent = content.replace(/\x1b\[\d+(?:;\d+)*m/g, '');
  const length = strippedContent.length;
  
  return {
    length,
    withinLimit: length <= limitChars,
    limitChars,
  };
}

/**
 * Test data generators
 */
export const TEST_DATA = {
  /**
   * Generate a test message
   */
  generateMessage: (baseId: string, userId: string, index: number) => ({
    subject: `Test Message ${index}`,
    body: `This is test message number ${index} for automated testing.`,
    baseId,
    userId,
  }),
  
  /**
   * Generate a test message base
   */
  generateMessageBase: (index: number) => ({
    name: `Test Base ${index}`,
    description: `Test message base ${index} for automated testing`,
    accessLevelRead: 0,
    accessLevelWrite: 10,
  }),
  
  /**
   * Generate a test question for The Oracle
   */
  generateOracleQuestion: (index: number) => {
    const questions = [
      'What does the future hold?',
      'Will I find success?',
      'What is the meaning of life?',
      'Should I take the risk?',
      'What wisdom can you share?',
    ];
    return questions[index % questions.length];
  },
};

/**
 * Validation helpers for specific requirements
 */
export const VALIDATORS = {
  /**
   * Validate welcome screen (Requirements 1.2, 13.1, 13.2)
   */
  validateWelcomeScreen: (content: string) => {
    const issues: string[] = [];
    
    // Check for ANSI formatting
    const ansiValidation = validateANSIFormatting(content);
    if (!ansiValidation.hasColorCodes) {
      issues.push('Welcome screen missing ANSI color codes');
    }
    
    // Check for expected content
    if (!content.includes('BaudAgain') && !content.toLowerCase().includes('welcome')) {
      issues.push('Welcome screen missing BBS name or welcome message');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      ansiValidation,
    };
  },
  
  /**
   * Validate AI SysOp message (Requirements 5.1, 5.4, 5.5)
   */
  validateAISysOpMessage: (content: string, maxLength: number = 500) => {
    const issues: string[] = [];
    
    // Check for ANSI formatting
    const ansiValidation = validateANSIFormatting(content);
    if (!ansiValidation.hasColorCodes) {
      issues.push('AI SysOp message missing ANSI color codes');
    }
    
    // Check length
    const lengthValidation = validateLength(content, maxLength);
    if (!lengthValidation.withinLimit) {
      issues.push(`AI SysOp message exceeds ${maxLength} character limit (${lengthValidation.length} chars)`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      ansiValidation,
      lengthValidation,
    };
  },
  
  /**
   * Validate Oracle response (Requirements 7.3, 7.4)
   */
  validateOracleResponse: (content: string) => {
    const issues: string[] = [];
    
    // Check length (150 character limit)
    const lengthValidation = validateLength(content, 150);
    if (!lengthValidation.withinLimit) {
      issues.push(`Oracle response exceeds 150 character limit (${lengthValidation.length} chars)`);
    }
    
    // Check for mystical symbols (including emojis used by Oracle)
    const mysticalSymbols = /[✧☽⚝◈ψ…🔮✨🌙⭐]/;
    if (!mysticalSymbols.test(content)) {
      issues.push('Oracle response missing mystical symbols');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      lengthValidation,
    };
  },
  
  /**
   * Validate menu display (Requirements 3.1, 3.2)
   */
  validateMenuDisplay: (content: string, expectedOptions: string[]) => {
    const issues: string[] = [];
    
    // Check for each expected option
    for (const option of expectedOptions) {
      if (!content.toLowerCase().includes(option.toLowerCase())) {
        issues.push(`Menu missing expected option: ${option}`);
      }
    }
    
    // Check for ANSI formatting
    const ansiValidation = validateANSIFormatting(content);
    if (!ansiValidation.hasColorCodes) {
      issues.push('Menu missing ANSI color codes');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      ansiValidation,
    };
  },
  
  /**
   * Validate message display (Requirements 4.3)
   */
  validateMessageDisplay: (content: string) => {
    const issues: string[] = [];
    
    // Check for required fields
    const hasSubject = /subject:/i.test(content) || /from:/i.test(content);
    const hasAuthor = /author:/i.test(content) || /from:/i.test(content);
    const hasTimestamp = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(content);
    
    if (!hasSubject) {
      issues.push('Message display missing subject');
    }
    if (!hasAuthor) {
      issues.push('Message display missing author');
    }
    if (!hasTimestamp) {
      issues.push('Message display missing timestamp');
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  },
};

/**
 * URLs for testing
 */
export const TEST_URLS = {
  TERMINAL: 'http://localhost:8080',
  CONTROL_PANEL: 'http://localhost:3000',
  API_BASE: 'http://localhost:8080/api/v1',
};

/**
 * Common test timeouts
 */
export const TEST_TIMEOUTS = {
  PAGE_LOAD: 10000,
  AI_RESPONSE: 5000,
  WEBSOCKET_CONNECT: 3000,
  API_REQUEST: 2000,
};
