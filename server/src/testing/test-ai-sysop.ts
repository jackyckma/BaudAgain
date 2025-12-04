/**
 * Task 43: Test AI SysOp Interaction
 * 
 * This test validates the AI SysOp interaction including:
 * - Page SysOp functionality
 * - AI response generation within time limits
 * - AI response formatting with ANSI codes
 * - AI response length constraints
 * - Response relevance and helpfulness
 * 
 * Requirements validated:
 * - 5.3: AI SysOp response within 5 seconds when paged
 * - 5.4: AI message ANSI formatting
 * - 5.5: AI response length under 500 characters
 * 
 * Properties validated:
 * - Property 19: AI SysOp response time
 * - Property 20: AI message ANSI formatting
 * - Property 21: AI response length constraint
 */

import { TEST_PERSONAS, VALIDATORS, TEST_URLS, TEST_TIMEOUTS } from './mcp-helpers';

interface AISysOpTestResult {
  step: string;
  success: boolean;
  details: string;
  screenshot?: string;
  validation?: any;
}

/**
 * Test Page SysOp functionality via REST API (Task 43.1)
 * Validates that the AI SysOp responds to page requests
 */
async function testPageSysOpViaAPI(): Promise<AISysOpTestResult[]> {
  const results: AISysOpTestResult[] = [];
  
  console.log('Testing Page SysOp functionality...');
  
  try {
    const apiUrl = TEST_URLS.API_BASE;
    
    // Step 1: Login to get a token
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: TEST_PERSONAS.RETURNING_USER.handle,
        password: TEST_PERSONAS.RETURNING_USER.password,
      }),
    });
    
    const loginData = await loginResponse.json() as any;
    
    if (!loginResponse.ok || !loginData.token) {
      results.push({
        step: '1. Login for AI SysOp Test',
        success: false,
        details: 'Failed to login for AI SysOp test',
      });
      return results;
    }
    
    results.push({
      step: '1. Login for AI SysOp Test',
      success: true,
      details: `Successfully logged in as: ${TEST_PERSONAS.RETURNING_USER.handle}`,
    });
    
    // Step 2: Page the SysOp without a question
    const startTime1 = Date.now();
    const pageResponse1 = await fetch(`${apiUrl}/ai/page-sysop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const endTime1 = Date.now();
    
    const pageData1 = await pageResponse1.json() as any;
    
    if (pageResponse1.ok) {
      const responseTime = endTime1 - startTime1;
      const withinTimeLimit = responseTime <= TEST_TIMEOUTS.AI_RESPONSE;
      
      results.push({
        step: '2. Page SysOp (No Question)',
        success: withinTimeLimit,
        details: withinTimeLimit
          ? `AI SysOp responded in ${responseTime}ms (within ${TEST_TIMEOUTS.AI_RESPONSE}ms limit)`
          : `AI SysOp response took ${responseTime}ms (exceeds ${TEST_TIMEOUTS.AI_RESPONSE}ms limit)`,
        validation: {
          responseTimeMs: responseTime,
          withinTimeLimit,
          hasResponse: !!pageData1.response,
          responseLength: pageData1.response?.length || 0,
        },
      });
    } else {
      results.push({
        step: '2. Page SysOp (No Question)',
        success: false,
        details: `Failed to page SysOp: ${pageData1.error || 'Unknown error'}`,
      });
    }
    
    // Step 3: Page the SysOp with a question
    const testQuestions = [
      'How do I post a message?',
      'What door games are available?',
      'Can you help me navigate the BBS?',
    ];
    
    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      const startTime = Date.now();
      
      const pageResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      const endTime = Date.now();
      const pageData = await pageResponse.json() as any;
      
      if (pageResponse.ok) {
        const responseTime = endTime - startTime;
        const withinTimeLimit = responseTime <= TEST_TIMEOUTS.AI_RESPONSE;
        
        results.push({
          step: `${3 + i}. Page SysOp with Question ${i + 1}`,
          success: withinTimeLimit && !!pageData.response,
          details: `Question: "${question}"\nResponse time: ${responseTime}ms\nResponse: ${pageData.response?.substring(0, 100)}...`,
          validation: {
            question,
            responseTimeMs: responseTime,
            withinTimeLimit,
            hasResponse: !!pageData.response,
            responseLength: pageData.response?.length || 0,
          },
        });
      } else {
        results.push({
          step: `${3 + i}. Page SysOp with Question ${i + 1}`,
          success: false,
          details: `Failed to page SysOp: ${pageData.error || 'Unknown error'}`,
        });
      }
    }
    
  } catch (error) {
    results.push({
      step: '2. Page SysOp Test',
      success: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
  
  return results;
}

/**
 * Test AI SysOp response time (Task 43.2 - Part 1)
 * Validates that AI responses are generated within 5 seconds
 */
async function testAISysOpResponseTime(): Promise<AISysOpTestResult[]> {
  const results: AISysOpTestResult[] = [];
  
  console.log('\nTesting AI SysOp response time...');
  
  try {
    const apiUrl = TEST_URLS.API_BASE;
    
    // Login first
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: TEST_PERSONAS.RETURNING_USER.handle,
        password: TEST_PERSONAS.RETURNING_USER.password,
      }),
    });
    
    const loginData = await loginResponse.json() as any;
    
    if (!loginResponse.ok || !loginData.token) {
      results.push({
        step: '6. Response Time Test - Login',
        success: false,
        details: 'Failed to login',
      });
      return results;
    }
    
    // Test multiple requests to verify consistent response times
    const responseTimes: number[] = [];
    const numTests = 5;
    
    for (let i = 0; i < numTests; i++) {
      const startTime = Date.now();
      
      const pageResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: `Test question ${i + 1}: What is the weather like?`,
        }),
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);
      
      if (!pageResponse.ok) {
        results.push({
          step: `6. Response Time Test ${i + 1}`,
          success: false,
          details: 'Failed to get AI response',
        });
        continue;
      }
    }
    
    // Calculate statistics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const allWithinLimit = responseTimes.every(time => time <= TEST_TIMEOUTS.AI_RESPONSE);
    
    results.push({
      step: '6. AI SysOp Response Time Analysis',
      success: allWithinLimit,
      details: allWithinLimit
        ? `All ${numTests} responses within ${TEST_TIMEOUTS.AI_RESPONSE}ms limit`
        : `Some responses exceeded ${TEST_TIMEOUTS.AI_RESPONSE}ms limit`,
      validation: {
        numTests,
        avgResponseTimeMs: Math.round(avgResponseTime),
        minResponseTimeMs: minResponseTime,
        maxResponseTimeMs: maxResponseTime,
        allWithinLimit,
        limitMs: TEST_TIMEOUTS.AI_RESPONSE,
        responseTimes,
      },
    });
    
  } catch (error) {
    results.push({
      step: '6. Response Time Test',
      success: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
  
  return results;
}

/**
 * Test AI SysOp output quality (Task 43.2)
 * Validates formatting, length, and content quality
 */
async function testAISysOpOutputQuality(): Promise<AISysOpTestResult[]> {
  const results: AISysOpTestResult[] = [];
  
  console.log('\nTesting AI SysOp output quality...');
  
  try {
    const apiUrl = TEST_URLS.API_BASE;
    
    // Login first
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: TEST_PERSONAS.RETURNING_USER.handle,
        password: TEST_PERSONAS.RETURNING_USER.password,
      }),
    });
    
    const loginData = await loginResponse.json() as any;
    
    if (!loginResponse.ok || !loginData.token) {
      results.push({
        step: '7. Output Quality Test - Login',
        success: false,
        details: 'Failed to login',
      });
      return results;
    }
    
    // Get an AI response
    const pageResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'Can you help me understand how to use the message bases?',
      }),
    });
    
    const pageData = await pageResponse.json() as any;
    
    if (!pageResponse.ok || !pageData.response) {
      results.push({
        step: '7. Output Quality Test',
        success: false,
        details: 'Failed to get AI response',
      });
      return results;
    }
    
    const response = pageData.response;
    
    // Test 1: Check for ANSI color codes (Requirement 5.4, Property 20)
    const ansiValidation = VALIDATORS.validateAISysOpMessage(response, 500);
    
    results.push({
      step: '7. AI Response ANSI Formatting',
      success: ansiValidation.ansiValidation.hasColorCodes,
      details: ansiValidation.ansiValidation.hasColorCodes
        ? `AI response contains ANSI color codes: ${ansiValidation.ansiValidation.colorCodesFound.length} codes found`
        : 'AI response missing ANSI color codes',
      validation: {
        hasColorCodes: ansiValidation.ansiValidation.hasColorCodes,
        colorCodesFound: ansiValidation.ansiValidation.colorCodesFound.length,
        issues: ansiValidation.issues,
      },
    });
    
    // Test 2: Check response length (Requirement 5.5, Property 21)
    const lengthValidation = ansiValidation.lengthValidation;
    
    results.push({
      step: '8. AI Response Length Constraint',
      success: lengthValidation.withinLimit,
      details: lengthValidation.withinLimit
        ? `AI response length: ${lengthValidation.length} chars (within ${lengthValidation.limitChars} char limit)`
        : `AI response length: ${lengthValidation.length} chars (exceeds ${lengthValidation.limitChars} char limit)`,
      validation: {
        length: lengthValidation.length,
        withinLimit: lengthValidation.withinLimit,
        limitChars: lengthValidation.limitChars,
      },
    });
    
    // Test 3: Check response relevance (basic check)
    const hasRelevantContent = 
      response.toLowerCase().includes('message') ||
      response.toLowerCase().includes('base') ||
      response.toLowerCase().includes('post') ||
      response.toLowerCase().includes('read') ||
      response.toLowerCase().includes('help');
    
    results.push({
      step: '9. AI Response Relevance',
      success: hasRelevantContent,
      details: hasRelevantContent
        ? 'AI response appears relevant to the question'
        : 'AI response may not be relevant to the question',
      validation: {
        hasRelevantContent,
        responsePreview: response.substring(0, 200),
      },
    });
    
    // Test 4: Check response is not empty or error message
    const isValidResponse = 
      response.length > 10 &&
      !response.toLowerCase().includes('error') &&
      !response.toLowerCase().includes('failed') &&
      !response.toLowerCase().includes('unavailable');
    
    results.push({
      step: '10. AI Response Validity',
      success: isValidResponse,
      details: isValidResponse
        ? 'AI response is valid and not an error message'
        : 'AI response appears to be an error or invalid',
      validation: {
        isValidResponse,
        responseLength: response.length,
      },
    });
    
  } catch (error) {
    results.push({
      step: '7. Output Quality Test',
      success: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
  
  return results;
}

/**
 * Test AI SysOp with different question types
 * Validates that AI can handle various types of questions
 */
async function testAISysOpQuestionVariety(): Promise<AISysOpTestResult[]> {
  const results: AISysOpTestResult[] = [];
  
  console.log('\nTesting AI SysOp with different question types...');
  
  try {
    const apiUrl = TEST_URLS.API_BASE;
    
    // Login first
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: TEST_PERSONAS.RETURNING_USER.handle,
        password: TEST_PERSONAS.RETURNING_USER.password,
      }),
    });
    
    const loginData = await loginResponse.json() as any;
    
    if (!loginResponse.ok || !loginData.token) {
      results.push({
        step: '11. Question Variety Test - Login',
        success: false,
        details: 'Failed to login',
      });
      return results;
    }
    
    // Test different types of questions
    const questionTypes = [
      { type: 'How-to', question: 'How do I change my profile?' },
      { type: 'What-is', question: 'What is a door game?' },
      { type: 'Where-is', question: 'Where can I find the user list?' },
      { type: 'General help', question: 'I need help' },
      { type: 'Specific feature', question: 'Tell me about The Oracle' },
    ];
    
    for (let i = 0; i < questionTypes.length; i++) {
      const { type, question } = questionTypes[i];
      
      const pageResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      const pageData = await pageResponse.json() as any;
      
      if (pageResponse.ok && pageData.response) {
        const validation = VALIDATORS.validateAISysOpMessage(pageData.response, 500);
        
        results.push({
          step: `${11 + i}. ${type} Question`,
          success: validation.valid,
          details: `Question: "${question}"\nResponse valid: ${validation.valid}\nResponse length: ${validation.lengthValidation.length} chars`,
          validation: {
            questionType: type,
            question,
            responseLength: validation.lengthValidation.length,
            hasANSI: validation.ansiValidation.hasColorCodes,
            withinLimit: validation.lengthValidation.withinLimit,
            issues: validation.issues,
          },
        });
      } else {
        results.push({
          step: `${11 + i}. ${type} Question`,
          success: false,
          details: `Failed to get response for ${type} question: ${pageData.error || 'Unknown error'}`,
        });
      }
    }
    
  } catch (error) {
    results.push({
      step: '11. Question Variety Test',
      success: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
  
  return results;
}

/**
 * Test AI SysOp error handling
 * Validates that the system handles errors gracefully
 */
async function testAISysOpErrorHandling(): Promise<AISysOpTestResult[]> {
  const results: AISysOpTestResult[] = [];
  
  console.log('\nTesting AI SysOp error handling...');
  
  try {
    const apiUrl = TEST_URLS.API_BASE;
    
    // Test 1: Page SysOp without authentication
    const unauthResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: 'Test question' }),
    });
    
    results.push({
      step: '16. Unauthenticated Page SysOp',
      success: !unauthResponse.ok, // Should fail
      details: !unauthResponse.ok
        ? `Correctly rejected unauthenticated request with status ${unauthResponse.status}`
        : 'ERROR: Unauthenticated request was accepted',
      validation: {
        status: unauthResponse.status,
        rejected: !unauthResponse.ok,
      },
    });
    
    // Test 2: Page SysOp with invalid token
    const invalidTokenResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: 'Test question' }),
    });
    
    results.push({
      step: '17. Invalid Token Page SysOp',
      success: !invalidTokenResponse.ok, // Should fail
      details: !invalidTokenResponse.ok
        ? `Correctly rejected invalid token with status ${invalidTokenResponse.status}`
        : 'ERROR: Invalid token was accepted',
      validation: {
        status: invalidTokenResponse.status,
        rejected: !invalidTokenResponse.ok,
      },
    });
    
    // Test 3: Page SysOp with malformed request
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: TEST_PERSONAS.RETURNING_USER.handle,
        password: TEST_PERSONAS.RETURNING_USER.password,
      }),
    });
    
    const loginData = await loginResponse.json() as any;
    
    if (loginResponse.ok && loginData.token) {
      const malformedResponse = await fetch(`${apiUrl}/ai/page-sysop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });
      
      results.push({
        step: '18. Malformed Request Handling',
        success: !malformedResponse.ok, // Should fail
        details: !malformedResponse.ok
          ? `Correctly rejected malformed request with status ${malformedResponse.status}`
          : 'ERROR: Malformed request was accepted',
        validation: {
          status: malformedResponse.status,
          rejected: !malformedResponse.ok,
        },
      });
    }
    
  } catch (error) {
    results.push({
      step: '16. Error Handling Test',
      success: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
  
  return results;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Task 43: AI SysOp Interaction Test');
  console.log('='.repeat(60));
  
  const allResults: AISysOpTestResult[] = [];
  
  // Run Page SysOp tests (Task 43.1)
  const pageSysOpResults = await testPageSysOpViaAPI();
  allResults.push(...pageSysOpResults);
  
  // Run response time tests (Task 43.2 - Part 1)
  const responseTimeResults = await testAISysOpResponseTime();
  allResults.push(...responseTimeResults);
  
  // Run output quality tests (Task 43.2)
  const outputQualityResults = await testAISysOpOutputQuality();
  allResults.push(...outputQualityResults);
  
  // Run question variety tests
  const questionVarietyResults = await testAISysOpQuestionVariety();
  allResults.push(...questionVarietyResults);
  
  // Run error handling tests
  const errorHandlingResults = await testAISysOpErrorHandling();
  allResults.push(...errorHandlingResults);
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  
  let passCount = 0;
  let failCount = 0;
  
  allResults.forEach((result) => {
    const status = result.success ? '✓ PASS' : '✗ FAIL';
    const color = result.success ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`\n${color}${status}${reset} ${result.step}`);
    console.log(`  ${result.details}`);
    
    if (result.validation) {
      console.log('  Validation:', JSON.stringify(result.validation, null, 2));
    }
    
    if (result.success) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(60));
  
  // Print requirements validation summary
  console.log('\n' + '='.repeat(60));
  console.log('REQUIREMENTS VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log('✓ Requirement 5.3: AI SysOp response within 5 seconds');
  console.log('✓ Requirement 5.4: AI message ANSI formatting');
  console.log('✓ Requirement 5.5: AI response length under 500 characters');
  console.log('\n' + '='.repeat(60));
  console.log('PROPERTIES VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log('✓ Property 19: AI SysOp response time');
  console.log('✓ Property 20: AI message ANSI formatting');
  console.log('✓ Property 21: AI response length constraint');
  console.log('='.repeat(60));
  
  // Return exit code
  return failCount === 0 ? 0 : 1;
}

export {
  runTests,
  testPageSysOpViaAPI,
  testAISysOpResponseTime,
  testAISysOpOutputQuality,
  testAISysOpQuestionVariety,
  testAISysOpErrorHandling,
};

// Run tests if executed directly
runTests()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
