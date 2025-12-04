/**
 * Setup Test Data for MCP-Based Testing
 * 
 * This script creates test users, message bases, and messages for automated testing.
 */

import { BBSDatabase } from '../src/db/Database.js';
import { UserRepository } from '../src/db/repositories/UserRepository.js';
import { MessageBaseRepository } from '../src/db/repositories/MessageBaseRepository.js';
import { MessageRepository } from '../src/db/repositories/MessageRepository.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const BCRYPT_ROUNDS = 10;

// Create logger
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
  },
});

// Test personas from mcp-helpers.ts
const TEST_PERSONAS = {
  NEW_USER: {
    handle: 'TestNewbie',
    password: 'TestPass123!',
    realName: 'Test Newbie',
    location: 'Test City',
    bio: 'A new user for testing',
    accessLevel: 10,
  },
  RETURNING_USER: {
    handle: 'TestVeteran',
    password: 'VetPass456!',
    realName: 'Test Veteran',
    location: 'Test Town',
    bio: 'A returning user for testing',
    accessLevel: 10,
  },
  ADMIN_USER: {
    handle: 'TestAdmin',
    password: 'AdminPass789!',
    realName: 'Test Administrator',
    location: 'Admin HQ',
    bio: 'An admin user for testing',
    accessLevel: 255,
  },
};

// Test message bases
const TEST_MESSAGE_BASES = [
  {
    name: 'Test General',
    description: 'General discussion for testing',
    accessLevelRead: 0,
    accessLevelWrite: 10,
  },
  {
    name: 'Test Announcements',
    description: 'System announcements for testing',
    accessLevelRead: 0,
    accessLevelWrite: 255,
  },
  {
    name: 'Test Private',
    description: 'Private discussion for testing',
    accessLevelRead: 50,
    accessLevelWrite: 50,
  },
];

// Test messages
const TEST_MESSAGES = [
  {
    subject: 'Welcome to the Test BBS!',
    body: 'This is a test message to verify message display functionality. It includes proper formatting and should display with subject, author, and timestamp.',
  },
  {
    subject: 'Testing ANSI Formatting',
    body: 'This message tests ANSI color codes and formatting. \x1b[32mGreen text\x1b[0m and \x1b[1;31mBold red text\x1b[0m should display correctly.',
  },
  {
    subject: 'Long Message Test',
    body: 'This is a longer test message to verify that the message display can handle multiple lines of text. '.repeat(5),
  },
];

async function setupTestData() {
  console.log('🚀 Setting up test data for MCP-based testing...\n');

  // Initialize database
  const database = new BBSDatabase('data/bbs.db', logger);
  const userRepository = new UserRepository(database);
  const messageBaseRepository = new MessageBaseRepository(database);
  const messageRepository = new MessageRepository(database);

  try {
    // Create test users
    console.log('👥 Creating test users...');
    const createdUsers: any[] = [];

    for (const [key, persona] of Object.entries(TEST_PERSONAS)) {
      // Check if user already exists
      const existing = userRepository.getUserByHandle(persona.handle);
      if (existing) {
        console.log(`   ⏭️  User ${persona.handle} already exists`);
        createdUsers.push(existing);
        continue;
      }

      // Create user
      const passwordHash = await bcrypt.hash(persona.password, BCRYPT_ROUNDS);
      const user = userRepository.createUser({
        id: uuidv4(),
        handle: persona.handle,
        passwordHash,
        realName: persona.realName,
        location: persona.location,
        bio: persona.bio,
        accessLevel: persona.accessLevel,
        createdAt: new Date(),
        totalCalls: 0,
        totalPosts: 0,
        preferences: {
          terminalType: 'ansi',
          screenWidth: 80,
          screenHeight: 24,
        },
      });

      console.log(`   ✅ Created user: ${user.handle} (Access Level: ${user.accessLevel})`);
      createdUsers.push(user);
    }

    // Create test message bases
    console.log('\n📁 Creating test message bases...');
    const createdBases: any[] = [];

    // Get all existing message bases once
    const allBases = messageBaseRepository.getAllMessageBases();
    
    for (const baseData of TEST_MESSAGE_BASES) {
      // Check if message base already exists
      const existing = allBases.find((b: any) => b.name === baseData.name);
      if (existing) {
        console.log(`   ⏭️  Message base "${baseData.name}" already exists`);
        createdBases.push(existing);
        continue;
      }

      // Create message base
      const base = messageBaseRepository.createMessageBase({
        id: uuidv4(),
        name: baseData.name,
        description: baseData.description,
        accessLevelRead: baseData.accessLevelRead,
        accessLevelWrite: baseData.accessLevelWrite,
        postCount: 0,
        sortOrder: createdBases.length,
      });

      console.log(`   ✅ Created message base: ${base.name}`);
      createdBases.push(base);
    }

    // Create test messages
    console.log('\n💬 Creating test messages...');
    
    // Use the returning user as the author
    const author = createdUsers.find(u => u.handle === 'TestVeteran');
    if (!author) {
      console.log('   ⚠️  TestVeteran user not found, skipping message creation');
    } else {
      // Post messages to the first message base
      const targetBase = createdBases[0];
      if (!targetBase) {
        console.log('   ⚠️  No message base found, skipping message creation');
      } else {
        for (const msgData of TEST_MESSAGES) {
          const message = messageRepository.createMessage({
            id: uuidv4(),
            baseId: targetBase.id,
            userId: author.id,
            subject: msgData.subject,
            body: msgData.body,
            createdAt: new Date(),
            isDeleted: false,
          });

          console.log(`   ✅ Created message: ${message.subject}`);
        }

        // Update message base post count
        messageBaseRepository.updateMessageBase(targetBase.id, {
          postCount: TEST_MESSAGES.length,
          lastPostAt: new Date(),
        });
      }
    }

    // Summary
    console.log('\n📊 Test Data Setup Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n👥 Test Users:');
    for (const user of createdUsers) {
      console.log(`   • ${user.handle} / ${TEST_PERSONAS[Object.keys(TEST_PERSONAS).find(k => TEST_PERSONAS[k as keyof typeof TEST_PERSONAS].handle === user.handle) as keyof typeof TEST_PERSONAS]?.password}`);
      console.log(`     Access Level: ${user.accessLevel}`);
    }

    console.log('\n📁 Test Message Bases:');
    for (const base of createdBases) {
      console.log(`   • ${base.name}`);
      console.log(`     Read: ${base.accessLevelRead}, Write: ${base.accessLevelWrite}`);
    }

    console.log('\n💬 Test Messages:');
    console.log(`   • ${TEST_MESSAGES.length} messages in "${createdBases[0]?.name || 'N/A'}"`);

    console.log('\n✨ Ready for MCP-based testing!');
    console.log('   Terminal: http://localhost:8080');
    console.log('   Control Panel: http://localhost:3000');
    console.log('   API: http://localhost:3001/api');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  } finally {
    database.close();
  }
}

// Run the setup
setupTestData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
