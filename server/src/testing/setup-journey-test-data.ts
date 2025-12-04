/**
 * Setup Test Data for User Journey Testing
 * 
 * This script creates test users, message bases, and messages
 * for comprehensive user journey testing.
 * 
 * Requirements validated: 11.1
 */

import { JourneyTestAPI, JOURNEY_TEST_PERSONAS, JOURNEY_TEST_DATA } from './user-journey-mcp-helpers';

async function setupTestData() {
  console.log('='.repeat(70));
  console.log('Setting up test data for user journey testing...');
  console.log('='.repeat(70));
  
  const api = new JourneyTestAPI();
  const results: string[] = [];
  
  // Step 1: Create existing user for login tests
  console.log('\n1. Creating existing user for login tests...');
  const existingUser = JOURNEY_TEST_PERSONAS.EXISTING_USER;
  
  const registerResult = await api.registerUser(existingUser);
  if (registerResult.success) {
    console.log(`✓ Created user: ${existingUser.handle}`);
    results.push(`User created: ${existingUser.handle} / ${existingUser.password}`);
  } else {
    // User might already exist, try to login
    const loginResult = await api.loginUser(existingUser.handle, existingUser.password);
    if (loginResult.success) {
      console.log(`✓ User already exists: ${existingUser.handle}`);
      results.push(`User exists: ${existingUser.handle} / ${existingUser.password}`);
    } else {
      console.log(`✗ Failed to create/login user: ${registerResult.error}`);
      results.push(`ERROR: Failed to setup user ${existingUser.handle}`);
    }
  }
  
  // Step 2: Create test message bases
  console.log('\n2. Creating test message bases...');
  
  const messageBases = [
    {
      name: 'General Discussion',
      description: 'General discussion for all users',
      accessLevelRead: 0,
      accessLevelWrite: 10,
    },
    {
      name: 'Test Messages',
      description: 'Test message base for journey testing',
      accessLevelRead: 0,
      accessLevelWrite: 10,
    },
  ];
  
  const createdBases: string[] = [];
  
  for (const baseData of messageBases) {
    const result = await api.createMessageBase(baseData);
    if (result.success) {
      console.log(`✓ Created message base: ${baseData.name} (ID: ${result.baseId})`);
      results.push(`Message base created: ${baseData.name} (ID: ${result.baseId})`);
      if (result.baseId) {
        createdBases.push(result.baseId);
      }
    } else {
      console.log(`✗ Failed to create message base: ${baseData.name} - ${result.error}`);
    }
  }
  
  // Step 3: Create test messages in the first base
  if (createdBases.length > 0) {
    console.log('\n3. Creating test messages...');
    
    const testMessages = [
      {
        subject: 'Welcome to BaudAgain!',
        body: 'This is a test message to validate message display functionality. The author handle should be visible.',
      },
      {
        subject: 'Testing Message Features',
        body: 'This message tests that messages are displayed correctly with proper formatting and author information.',
      },
      {
        subject: 'Journey Test Message',
        body: 'This message is specifically for user journey testing. It should display with the correct author handle.',
      },
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const result = await api.postMessage(createdBases[0], testMessages[i]);
      if (result.success) {
        console.log(`✓ Created message: ${testMessages[i].subject} (ID: ${result.messageId})`);
        results.push(`Message created: ${testMessages[i].subject}`);
      } else {
        console.log(`✗ Failed to create message: ${testMessages[i].subject} - ${result.error}`);
      }
    }
  }
  
  // Step 4: Verify test data
  console.log('\n4. Verifying test data...');
  
  const basesResult = await api.getMessageBases();
  if (basesResult.success && basesResult.bases) {
    console.log(`✓ Found ${basesResult.bases.length} message bases`);
    results.push(`Message bases available: ${basesResult.bases.length}`);
    
    // Check messages in first base
    if (basesResult.bases.length > 0) {
      const firstBase = basesResult.bases[0];
      const messagesResult = await api.getMessages(firstBase.id);
      if (messagesResult.success && messagesResult.messages) {
        console.log(`✓ Found ${messagesResult.messages.length} messages in "${firstBase.name}"`);
        results.push(`Messages in first base: ${messagesResult.messages.length}`);
        
        // Verify author handles are not undefined
        const undefinedAuthors = messagesResult.messages.filter(m => !m.authorHandle || m.authorHandle === 'undefined');
        if (undefinedAuthors.length > 0) {
          console.log(`⚠ Warning: ${undefinedAuthors.length} messages have undefined author handles`);
          results.push(`WARNING: ${undefinedAuthors.length} messages with undefined authors`);
        } else {
          console.log(`✓ All messages have valid author handles`);
          results.push(`All messages have valid author handles`);
        }
      }
    }
  } else {
    console.log(`✗ Failed to verify message bases: ${basesResult.error}`);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST DATA SETUP SUMMARY');
  console.log('='.repeat(70));
  results.forEach(result => console.log(`  ${result}`));
  console.log('='.repeat(70));
  
  console.log('\nTest data setup complete!');
  console.log('\nYou can now run user journey tests with:');
  console.log(`  - Existing user: ${existingUser.handle} / ${existingUser.password}`);
  console.log(`  - New users will be created dynamically during registration tests`);
  console.log(`  - Message bases and messages are available for testing`);
}

export { setupTestData };

// Run setup if executed directly
setupTestData()
  .then(() => {
    console.log('\n✓ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Setup failed:', error);
    process.exit(1);
  });
