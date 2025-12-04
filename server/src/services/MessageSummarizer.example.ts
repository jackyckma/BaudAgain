/**
 * MessageSummarizer Usage Examples
 * 
 * This file demonstrates how to use the MessageSummarizer service
 * in various scenarios.
 */

import { MessageSummarizer } from './MessageSummarizer.js';
import { AIProviderFactory } from '../ai/AIProviderFactory.js';
import type { Message } from '../db/repositories/MessageRepository.js';
import type { FastifyBaseLogger } from 'fastify';

// Example 1: Basic Usage
async function basicSummarization(
  messages: Message[],
  aiProvider: any,
  logger: FastifyBaseLogger
) {
  const summarizer = new MessageSummarizer(aiProvider, logger);

  const summary = await summarizer.summarizeMessages(messages, {
    messageBaseId: 'general',
    messageBaseName: 'General Discussion',
  });

  console.log('Summary:', summary.summary);
  console.log('Key Points:', summary.keyPoints);
  console.log('Active Topics:', summary.activeTopics);
}

// Example 2: Formatted Display
async function formattedDisplay(
  messages: Message[],
  aiProvider: any,
  logger: FastifyBaseLogger
) {
  const summarizer = new MessageSummarizer(aiProvider, logger);

  const summary = await summarizer.summarizeMessages(messages, {
    messageBaseId: 'general',
    messageBaseName: 'General Discussion',
  });

  // Get all three formats
  const formatted = summarizer.formatSummary(summary, 80);

  // Display framed version (best for terminal)
  console.log('\n=== FRAMED VERSION ===');
  console.log(formatted.framed);

  // Display colored version
  console.log('\n=== COLORED VERSION ===');
  console.log(formatted.colored);

  // Display plain version (for logs or non-terminal output)
  console.log('\n=== PLAIN VERSION ===');
  console.log(formatted.plain);
}

// Example 3: With Cache Management
async function withCacheManagement(
  messages: Message[],
  aiProvider: any,
  logger: FastifyBaseLogger
) {
  const summarizer = new MessageSummarizer(aiProvider, logger);

  // First call - generates summary
  console.log('Generating summary...');
  const summary1 = await summarizer.summarizeMessages(messages, {
    messageBaseId: 'general',
    messageBaseName: 'General Discussion',
  });
  console.log('Generated at:', summary1.generatedAt);

  // Second call - uses cache
  console.log('\nGetting cached summary...');
  const summary2 = await summarizer.summarizeMessages(messages, {
    messageBaseId: 'general',
    messageBaseName: 'General Discussion',
  });
  console.log('Generated at:', summary2.generatedAt);
  console.log('Same timestamp?', summary1.generatedAt === summary2.generatedAt);

  // Check cache stats
  const stats = summarizer.getCacheStats();
  console.log('\nCache stats:', stats);

  // Invalidate cache (e.g., after new message posted)
  console.log('\nInvalidating cache...');
  summarizer.invalidateCache('general');

  // Third call - generates new summary
  console.log('Generating new summary...');
  const summary3 = await summarizer.summarizeMessages(messages, {
    messageBaseId: 'general',
    messageBaseName: 'General Discussion',
  });
  console.log('Generated at:', summary3.generatedAt);
  console.log('Different timestamp?', summary1.generatedAt !== summary3.generatedAt);
}

// Example 4: Integration with Message Service
class ExampleMessageService {
  constructor(
    private messageRepo: any,
    private messageBaseRepo: any,
    private summarizer: MessageSummarizer
  ) {}

  async postMessage(data: any): Promise<Message> {
    // Post the message
    const message = this.messageRepo.createMessage(data);

    // Invalidate summary cache for this message base
    this.summarizer.invalidateCache(data.baseId);

    return message;
  }

  async getSummary(baseId: string): Promise<any> {
    // Get messages
    const messages = this.messageRepo.getMessages(baseId, 50);
    const base = this.messageBaseRepo.getMessageBase(baseId);

    // Generate summary
    const summary = await this.summarizer.summarizeMessages(messages, {
      messageBaseId: baseId,
      messageBaseName: base?.name || 'Unknown',
    });

    // Format for display
    const formatted = this.summarizer.formatSummary(summary);

    return {
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      activeTopics: summary.activeTopics,
      messageCount: summary.messageCount,
      generatedAt: summary.generatedAt,
      formatted: {
        plain: formatted.plain,
        colored: formatted.colored,
        framed: formatted.framed,
      },
    };
  }
}

// Example 5: REST API Endpoint
function setupSummaryEndpoint(fastify: any, summarizer: MessageSummarizer, messageService: any) {
  fastify.post('/api/message-bases/:id/summarize', async (request: any, reply: any) => {
    const { id } = request.params;

    try {
      // Get messages
      const messages = messageService.getMessages(id, 50);
      const base = messageService.getMessageBase(id);

      if (!base) {
        return reply.code(404).send({ error: 'Message base not found' });
      }

      // Check if user has access
      const canRead = await messageService.canUserReadBase(request.user?.id, id);
      if (!canRead) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      // Generate summary
      const summary = await summarizer.summarizeMessages(messages, {
        messageBaseId: id,
        messageBaseName: base.name,
      });

      // Format for display
      const formatted = summarizer.formatSummary(summary);

      return {
        messageBaseId: summary.messageBaseId,
        messageBaseName: summary.messageBaseName,
        messageCount: summary.messageCount,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        activeTopics: summary.activeTopics,
        generatedAt: summary.generatedAt,
        formatted: {
          plain: formatted.plain,
          colored: formatted.colored,
          framed: formatted.framed,
        },
      };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to generate summary');
      return reply.code(500).send({ error: 'Failed to generate summary' });
    }
  });
}

// Example 6: Terminal Handler Integration
class ExampleMessageHandler {
  constructor(
    private messageService: any,
    private summarizer: MessageSummarizer
  ) {}

  async handleSummarizeCommand(session: any, baseId: string): Promise<string> {
    try {
      // Show loading message
      const loadingMsg = '\x1b[33mGenerating summary... This may take a few seconds.\x1b[0m\n';

      // Get messages
      const messages = this.messageService.getMessages(baseId, 50);
      const base = this.messageService.getMessageBase(baseId);

      if (!base) {
        return '\x1b[31mError: Message base not found.\x1b[0m\n';
      }

      // Generate summary
      const summary = await this.summarizer.summarizeMessages(messages, {
        messageBaseId: baseId,
        messageBaseName: base.name,
      });

      // Format for terminal display
      const formatted = this.summarizer.formatSummary(summary, 80);

      // Return framed version
      return loadingMsg + '\n' + formatted.framed + '\n\n' +
        '\x1b[36mPress any key to continue...\x1b[0m';
    } catch (error) {
      return '\x1b[31mError: Failed to generate summary. Please try again later.\x1b[0m\n';
    }
  }
}

// Example 7: "Catch Me Up" Feature
async function catchMeUpFeature(
  userId: string,
  lastLoginDate: Date,
  messageService: any,
  summarizer: MessageSummarizer
): Promise<string> {
  // Get all message bases
  const bases = messageService.getAccessibleMessageBases(10); // User access level

  const summaries: string[] = [];

  for (const base of bases) {
    // Get messages since last login
    const messages = messageService.getMessages(base.id, 50)
      .filter((msg: Message) => new Date(msg.createdAt) > lastLoginDate);

    if (messages.length === 0) {
      continue; // Skip bases with no new messages
    }

    // Generate summary
    const summary = await summarizer.summarizeMessages(messages, {
      messageBaseId: base.id,
      messageBaseName: base.name,
    });

    // Format summary
    const formatted = summarizer.formatSummary(summary, 80);
    summaries.push(formatted.framed);
  }

  if (summaries.length === 0) {
    return '\x1b[36mNo new activity since your last visit.\x1b[0m\n';
  }

  // Build "What You Missed" screen
  const header = '\x1b[33m╔════════════════════════════════════════════════════════════════════════════╗\x1b[0m\n' +
    '\x1b[33m║                          WHAT YOU MISSED                                   ║\x1b[0m\n' +
    '\x1b[33m╚════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n\n';

  return header + summaries.join('\n\n') + '\n\n' +
    '\x1b[36mPress any key to continue to the main menu...\x1b[0m';
}

// Export examples
export {
  basicSummarization,
  formattedDisplay,
  withCacheManagement,
  ExampleMessageService,
  setupSummaryEndpoint,
  ExampleMessageHandler,
  catchMeUpFeature,
};
