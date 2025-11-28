import { BBSDatabase } from '../src/db/Database.js';
import { UserRepository } from '../src/db/repositories/UserRepository.js';
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

// Create SysOp user
const database = new BBSDatabase('data/bbs.db', logger);
const userRepository = new UserRepository(database);

const handle = 'sysop';
const password = 'admin123'; // Change this in production!

// Check if sysop already exists
const existing = userRepository.getUserByHandle(handle);
if (existing) {
  console.log('SysOp user already exists');
  database.close();
  process.exit(0);
}

// Create sysop user with access level 255
const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

const sysop = userRepository.createUser({
  id: uuidv4(),
  handle,
  passwordHash,
  accessLevel: 255, // SysOp level
  createdAt: new Date(),
  totalCalls: 0,
  totalPosts: 0,
  preferences: {
    terminalType: 'ansi',
    screenWidth: 80,
    screenHeight: 24,
  },
});

console.log(`✅ SysOp user created:`);
console.log(`   Handle: ${sysop.handle}`);
console.log(`   Password: ${password}`);
console.log(`   Access Level: ${sysop.accessLevel}`);
console.log(`\n⚠️  Remember to change the password!`);

database.close();
