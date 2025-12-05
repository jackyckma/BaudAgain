/**
 * Demo Data Initialization Script
 * 
 * Creates sample data for BaudAgain BBS demo:
 * - Sysop account (sysop / demo123)
 * - Sample user accounts
 * - Message bases (General, Tech Talk, Random)
 * - Sample messages
 * 
 * This script is idempotent - safe to run multiple times.
 */

import { BBSDatabase } from '../src/db/Database.js';
import { UserRepository } from '../src/db/repositories/UserRepository.js';
import { MessageBaseRepository } from '../src/db/repositories/MessageBaseRepository.js';
import { MessageRepository } from '../src/db/repositories/MessageRepository.js';
import bcrypt from 'bcrypt';
import pino from 'pino';

const BCRYPT_ROUNDS = 10;

// Create logger
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
  },
});

// Configuration
const DATA_DIR = process.env.DATA_DIR || 'data';
const DB_PATH = `${DATA_DIR}/bbs.db`;

console.log('');
console.log('🎮 BaudAgain BBS - Demo Data Initialization');
console.log('==========================================');
console.log(`Database: ${DB_PATH}`);
console.log('');

// Initialize database
const database = new BBSDatabase(DB_PATH, logger);
await database.ready();

const userRepository = new UserRepository(database);
const messageBaseRepository = new MessageBaseRepository(database);
const messageRepository = new MessageRepository(database);

// Track what was created
let created = {
  users: 0,
  messageBases: 0,
  messages: 0,
};

// =============================================================================
// Create Sysop Account
// =============================================================================
console.log('👤 Creating sysop account...');

const sysopHandle = 'sysop';
const sysopPassword = 'demo123';

const existingSysop = userRepository.getUserByHandle(sysopHandle);
if (existingSysop) {
  console.log('   ✓ Sysop already exists');
} else {
  const passwordHash = await bcrypt.hash(sysopPassword, BCRYPT_ROUNDS);
  userRepository.create(sysopHandle, passwordHash, {
    realName: 'System Operator',
    location: 'The Server Room',
    bio: 'Welcome to BaudAgain BBS! I\'m the AI-enhanced system operator.',
    accessLevel: 255,
  });
  created.users++;
  console.log(`   ✓ Created sysop (password: ${sysopPassword})`);
}

// =============================================================================
// Create Sample Users
// =============================================================================
console.log('');
console.log('👥 Creating sample users...');

const sampleUsers = [
  {
    handle: 'retrogeek',
    password: 'demo123',
    realName: 'Retro Geek',
    location: 'Silicon Valley',
    bio: 'Vintage computing enthusiast. I collect old terminals.',
    accessLevel: 50,
  },
  {
    handle: 'nightcrawler',
    password: 'demo123',
    realName: 'Night Crawler',
    location: 'The Internet',
    bio: 'Late night caller. The best conversations happen after midnight.',
    accessLevel: 30,
  },
  {
    handle: 'pixelartist',
    password: 'demo123',
    realName: 'Pixel Artist',
    location: 'ASCII Art Studio',
    bio: 'Creating digital art one character at a time.',
    accessLevel: 30,
  },
];

for (const userData of sampleUsers) {
  const existing = userRepository.getUserByHandle(userData.handle);
  if (existing) {
    console.log(`   ✓ ${userData.handle} already exists`);
  } else {
    const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);
    userRepository.create(userData.handle, passwordHash, {
      realName: userData.realName,
      location: userData.location,
      bio: userData.bio,
      accessLevel: userData.accessLevel,
    });
    created.users++;
    console.log(`   ✓ Created ${userData.handle}`);
  }
}

// =============================================================================
// Create Message Bases
// =============================================================================
console.log('');
console.log('📋 Creating message bases...');

const messageBases = [
  {
    name: 'General Discussion',
    description: 'Chat about anything and everything. All topics welcome!',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    sortOrder: 1,
  },
  {
    name: 'Tech Talk',
    description: 'Discuss technology, programming, and vintage computing.',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    sortOrder: 2,
  },
  {
    name: 'Random Thoughts',
    description: 'Share your random thoughts, ideas, and musings.',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    sortOrder: 3,
  },
];

const createdBases: { [key: string]: string } = {};

for (const baseData of messageBases) {
  const existing = messageBaseRepository.getAllMessageBases().find(b => b.name === baseData.name);
  if (existing) {
    console.log(`   ✓ "${baseData.name}" already exists`);
    createdBases[baseData.name] = existing.id;
  } else {
    const base = messageBaseRepository.createMessageBase(baseData);
    createdBases[baseData.name] = base.id;
    created.messageBases++;
    console.log(`   ✓ Created "${baseData.name}"`);
  }
}

// =============================================================================
// Create Sample Messages
// =============================================================================
console.log('');
console.log('💬 Creating sample messages...');

// Get user IDs
const sysop = userRepository.getUserByHandle('sysop');
const retrogeek = userRepository.getUserByHandle('retrogeek');
const nightcrawler = userRepository.getUserByHandle('nightcrawler');
const pixelartist = userRepository.getUserByHandle('pixelartist');

if (!sysop || !retrogeek || !nightcrawler || !pixelartist) {
  console.error('   ✗ Missing users - cannot create messages');
} else {
  // Check if messages already exist
  const existingMessages = messageRepository.getMessages(createdBases['General Discussion'], 10);
  
  if (existingMessages.length > 0) {
    console.log('   ✓ Messages already exist');
  } else {
    // General Discussion messages
    messageRepository.createMessage({
      baseId: createdBases['General Discussion'],
      userId: sysop.id,
      subject: 'Welcome to BaudAgain BBS!',
      body: `Greetings, fellow digital travelers!

Welcome to BaudAgain BBS - where the spirit of the dial-up era meets modern AI technology.

Feel free to explore:
- Chat with our AI SysOp (that's me!)
- Visit "The Oracle" door game for AI-powered fortunes
- Create ANSI art in the Art Studio
- Post messages and connect with other users

May your connection be stable and your packets uncorrupted!

- The AI SysOp 🤖`,
    });
    created.messages++;
    console.log('   ✓ Created welcome message');

    messageRepository.createMessage({
      baseId: createdBases['General Discussion'],
      userId: retrogeek.id,
      subject: 'RE: Welcome to BaudAgain BBS!',
      body: `This is amazing! Brings back memories of calling into local BBSes back in the 90s.

The AI features are a really cool modern twist. Looking forward to exploring more!`,
    });
    created.messages++;

    // Tech Talk messages
    messageRepository.createMessage({
      baseId: createdBases['Tech Talk'],
      userId: retrogeek.id,
      subject: 'Favorite vintage terminals?',
      body: `Hey everyone,

What are your favorite vintage terminals? I've been collecting old VT100s and DEC terminals.

There's something magical about that phosphor glow...`,
    });
    created.messages++;

    messageRepository.createMessage({
      baseId: createdBases['Tech Talk'],
      userId: nightcrawler.id,
      subject: 'RE: Favorite vintage terminals?',
      body: `I'm a big fan of the Wyse 60. The keyboard feel is unmatched!

Anyone here remember Telemate? Best terminal program ever made.`,
    });
    created.messages++;

    // Random Thoughts messages
    messageRepository.createMessage({
      baseId: createdBases['Random Thoughts'],
      userId: nightcrawler.id,
      subject: 'Late night callers unite!',
      body: `Who else is up at 3am browsing the BBS?

Something about the late night hours makes for the best conversations.
The world gets quiet and the ASCII characters glow brighter.`,
    });
    created.messages++;

    messageRepository.createMessage({
      baseId: createdBases['Random Thoughts'],
      userId: pixelartist.id,
      subject: 'ANSI Art is making a comeback!',
      body: `I've noticed more people getting into ANSI art lately.

The AI art generation here is incredible - but there's still something special 
about crafting art character by character.

Check out the Art Studio door game! 🎨`,
    });
    created.messages++;

    console.log(`   ✓ Created ${created.messages} sample messages`);
  }
}

// =============================================================================
// Summary
// =============================================================================
console.log('');
console.log('==========================================');
console.log('✅ Demo data initialization complete!');
console.log('');
console.log('Created:');
console.log(`   - ${created.users} user(s)`);
console.log(`   - ${created.messageBases} message base(s)`);
console.log(`   - ${created.messages} message(s)`);
console.log('');
console.log('Demo Credentials:');
console.log('   Sysop: sysop / demo123');
console.log('   Users: retrogeek, nightcrawler, pixelartist (all use demo123)');
console.log('');

database.close();

