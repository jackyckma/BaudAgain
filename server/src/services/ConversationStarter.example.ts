/**
 * ConversationStarter Service - Usage Examples
 * 
 * This file demonstrates how to use the ConversationStarter service
 * to analyze message base activity and generate engaging discussion questions.
 */

import { ConversationStarter } from './ConversationStarter.js';
import { AIProviderFactory } from '../ai/AIProviderFactory.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { MessageBase } from '../db/repositories/MessageBaseRepository.js';

// Example configuration (would come from config.yaml in real app)
const config = {
  ai: {
    provider: 'anthropic' as const,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-haiku-20241022',
  },
};

// Mock logger for examples
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log,
} as any;

// Initialize the service
const aiProvider = AIProviderFactory.create(config.ai);
const conversationStarter = new ConversationStarter(aiProvider, logger);

// Example 1: Analyze activity in a message base
async function example1_analyzeActivity() {
  console.log('\n=== Example 1: Analyze Activity ===\n');

  const messageBase: MessageBase = {
    id: 'general',
    name: 'General Discussion',
    description: 'General discussion area',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    postCount: 15,
    sortOrder: 0,
  };

  // Simulate recent messages
  const recentMessages: Message[] = [
    {
      id: 'msg1',
      baseId: 'general',
      userId: 'user1',
      subject: 'Welcome to the BBS!',
      body: 'Just joined, excited to be here!',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isDeleted: false,
      authorHandle: 'newbie',
    },
    {
      id: 'msg2',
      baseId: 'general',
      userId: 'user2',
      subject: 'Programming Languages Discussion',
      body: 'What is everyone\'s favorite programming language?',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      isDeleted: false,
      authorHandle: 'coder',
    },
    {
      id: 'msg3',
      baseId: 'general',
      userId: 'user3',
      subject: 'Re: Programming Languages Discussion',
      body: 'I love Python for its simplicity!',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isDeleted: false,
      authorHandle: 'pythonista',
    },
  ];

  const analysis = conversationStarter.analyzeActivity(
    messageBase,
    recentMessages,
    72 // analyze last 72 hours
  );

  console.log('Activity Analysis:');
  console.log('- Message Count:', analysis.messageCount);
  console.log('- Unique Authors:', analysis.uniqueAuthors);
  console.log('- Engagement Level:', analysis.engagementLevel);
  console.log('- Conversation Lull:', analysis.conversationLull);
  console.log('- Hours Since Last Activity:', Math.round(analysis.hoursSinceLastActivity));
  console.log('- Trending Topics:', analysis.trendingTopics.join(', '));
  console.log('- Average Message Length:', Math.round(analysis.averageMessageLength), 'chars');
}

// Example 2: Generate a question with auto style selection
async function example2_generateAutoQuestion() {
  console.log('\n=== Example 2: Generate Question (Auto Style) ===\n');

  const recentMessages: Message[] = [
    {
      id: 'msg1',
      baseId: 'tech',
      userId: 'user1',
      subject: 'ANSI Art Techniques',
      body: 'Anyone know good techniques for ANSI art?',
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30 hours ago (lull!)
      isDeleted: false,
      authorHandle: 'artist',
    },
  ];

  const question = await conversationStarter.generateQuestion({
    messageBaseId: 'tech',
    messageBaseName: 'Tech Talk',
    recentMessages,
    style: 'auto', // Let the service choose the best style
  });

  console.log('Generated Question:');
  console.log('- ID:', question.id);
  console.log('- Question:', question.question);
  console.log('- Style:', question.style);
  console.log('- Context:', question.context);
  console.log('- Generated At:', question.generatedAt.toLocaleString());
}

// Example 3: Generate questions with specific styles
async function example3_generateSpecificStyles() {
  console.log('\n=== Example 3: Generate Questions with Specific Styles ===\n');

  const recentMessages: Message[] = [];

  const styles = ConversationStarter.getAvailableStyles();

  for (const style of styles) {
    console.log(`\n${style.toUpperCase()} Style:`);
    console.log(`Description: ${ConversationStarter.getStyleDescription(style)}`);

    const question = await conversationStarter.generateQuestion({
      messageBaseId: 'general',
      messageBaseName: 'General Discussion',
      recentMessages,
      style,
    });

    console.log(`Question: ${question.question}`);
  }
}

// Example 4: Format questions for display
async function example4_formatQuestions() {
  console.log('\n=== Example 4: Format Questions for Display ===\n');

  const question = await conversationStarter.generateQuestion({
    messageBaseId: 'general',
    messageBaseName: 'General Discussion',
    recentMessages: [],
    style: 'fun',
  });

  // Add mock engagement metrics
  question.engagementMetrics = {
    views: 42,
    replies: 7,
    uniqueRepliers: 5,
  };

  const formatted = conversationStarter.formatQuestion(question, 80);

  console.log('Plain Text Format:');
  console.log(formatted.plain);

  console.log('\n\nColored Format (with ANSI codes):');
  console.log(formatted.colored);

  console.log('\n\nFramed Format (with borders):');
  console.log(formatted.framed);
}

// Example 5: Detect conversation lulls and generate revival questions
async function example5_detectAndReviveLulls() {
  console.log('\n=== Example 5: Detect and Revive Conversation Lulls ===\n');

  const messageBase: MessageBase = {
    id: 'retro',
    name: 'Retro Computing',
    description: 'Discussion about vintage computers',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    postCount: 50,
    sortOrder: 0,
  };

  // Last message was 26 hours ago - conversation lull!
  const recentMessages: Message[] = [
    {
      id: 'msg1',
      baseId: 'retro',
      userId: 'user1',
      subject: 'Commodore 64 Memories',
      body: 'Anyone remember programming on the C64?',
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      isDeleted: false,
      authorHandle: 'retroman',
    },
  ];

  const analysis = conversationStarter.analyzeActivity(messageBase, recentMessages, 72);

  if (analysis.conversationLull) {
    console.log(`⚠️  Conversation lull detected!`);
    console.log(`   Last activity: ${Math.round(analysis.hoursSinceLastActivity)} hours ago`);
    console.log(`   Generating revival question...\n`);

    const question = await conversationStarter.generateQuestion({
      messageBaseId: messageBase.id,
      messageBaseName: messageBase.name,
      recentMessages,
      style: 'auto',
    });

    console.log('Revival Question:');
    console.log(question.question);
    console.log('\nThis question would be posted to revive the conversation!');
  }
}

// Example 6: Monitor multiple message bases
async function example6_monitorMultipleBases() {
  console.log('\n=== Example 6: Monitor Multiple Message Bases ===\n');

  const messageBases: Array<{
    base: MessageBase;
    messages: Message[];
  }> = [
    {
      base: {
        id: 'general',
        name: 'General Discussion',
        description: 'General chat',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        postCount: 100,
        sortOrder: 0,
      },
      messages: [], // Empty - needs attention
    },
    {
      base: {
        id: 'tech',
        name: 'Tech Talk',
        description: 'Technology discussions',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        postCount: 50,
        sortOrder: 1,
      },
      messages: [
        {
          id: 'msg1',
          baseId: 'tech',
          userId: 'user1',
          subject: 'AI Discussion',
          body: 'What do you think about AI?',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago - active!
          isDeleted: false,
          authorHandle: 'techie',
        },
      ],
    },
  ];

  console.log('Monitoring message bases for conversation opportunities...\n');

  for (const { base, messages } of messageBases) {
    const analysis = conversationStarter.analyzeActivity(base, messages, 72);

    console.log(`${base.name}:`);
    console.log(`  Engagement: ${analysis.engagementLevel}`);
    console.log(`  Lull: ${analysis.conversationLull ? 'Yes' : 'No'}`);

    // Generate question for bases that need it
    if (analysis.engagementLevel === 'none' || analysis.conversationLull) {
      console.log(`  → Needs conversation starter!`);
    } else {
      console.log(`  → Active, no action needed`);
    }
    console.log();
  }
}

// Example 7: Integration with scheduled tasks
async function example7_scheduledDailyQuestion() {
  console.log('\n=== Example 7: Scheduled Daily Question ===\n');

  console.log('This would run daily at 9 AM via a scheduler...\n');

  const messageBase: MessageBase = {
    id: 'general',
    name: 'General Discussion',
    description: 'General chat',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    postCount: 100,
    sortOrder: 0,
  };

  // Get recent messages (would come from database)
  const recentMessages: Message[] = [];

  // Generate question
  const question = await conversationStarter.generateQuestion({
    messageBaseId: messageBase.id,
    messageBaseName: messageBase.name,
    recentMessages,
    style: 'auto',
  });

  console.log('Daily Question Generated:');
  console.log(question.question);
  console.log('\nThis would be posted to the message base as:');
  console.log('  Subject: 💭 Question of the Day');
  console.log('  Body:', question.question);
  console.log('  Author: AI SysOp');
}

// Run examples
async function runExamples() {
  try {
    // Check if API key is available
    if (!config.ai.apiKey) {
      console.log('⚠️  ANTHROPIC_API_KEY not set. Using mock examples only.\n');
      console.log('Set ANTHROPIC_API_KEY environment variable to run live examples.\n');
      return;
    }

    // Run examples
    await example1_analyzeActivity();
    await example2_generateAutoQuestion();
    await example3_generateSpecificStyles();
    await example4_formatQuestions();
    await example5_detectAndReviveLulls();
    await example6_monitorMultipleBases();
    await example7_scheduledDailyQuestion();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other files
export {
  example1_analyzeActivity,
  example2_generateAutoQuestion,
  example3_generateSpecificStyles,
  example4_formatQuestions,
  example5_detectAndReviveLulls,
  example6_monitorMultipleBases,
  example7_scheduledDailyQuestion,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
