# MessageSummarizer Service

AI-powered message thread summarization with caching and ANSI formatting.

## Overview

The `MessageSummarizer` service generates concise summaries of message board discussions using AI. It includes intelligent caching to minimize API calls and provides formatted output for terminal display.

## Features

- **AI-Powered Summarization**: Uses Claude to analyze and summarize message threads
- **Smart Caching**: Caches summaries for 1 hour to reduce API costs
- **ANSI Formatting**: Provides plain, colored, and framed output formats
- **Key Points Extraction**: Identifies main discussion points
- **Topic Detection**: Highlights active topics and themes
- **Cache Management**: Invalidate cache when new messages are posted

## Usage

### Basic Summarization

```typescript
import { MessageSummarizer } from './services/MessageSummarizer.js';
import { AIProviderFactory } from './ai/AIProviderFactory.js';

// Initialize
const aiProvider = AIProviderFactory.create(config.ai);
const summarizer = new MessageSummarizer(aiProvider, logger);

// Fetch messages from repository
const messages = messageRepo.getMessages('base-id', 50);

// Generate summary
const summary = await summarizer.summarizeMessages(messages, {
  messageBaseId: 'base-id',
  messageBaseName: 'General Discussion',
  maxMessages: 50,
});

console.log(summary.summary);
console.log('Key Points:', summary.keyPoints);
console.log('Active Topics:', summary.activeTopics);
```

### Formatted Output

```typescript
// Get formatted versions
const formatted = summarizer.formatSummary(summary, 80);

// Plain text (no ANSI codes)
console.log(formatted.plain);

// Colored text (with ANSI color codes)
connection.send(formatted.colored);

// Framed text (with box-drawing characters)
connection.send(formatted.framed);
```

### Cache Management

```typescript
// Invalidate cache when new message is posted
messageService.postMessage(messageData);
summarizer.invalidateCache(messageData.baseId);

// Clear all cache
summarizer.clearCache();

// Get cache statistics
const stats = summarizer.getCacheStats();
console.log(`Cached summaries: ${stats.size}`);
```

## API Reference

### `summarizeMessages(messages, options)`

Generate a summary of message threads.

**Parameters:**
- `messages: Message[]` - Array of messages to summarize
- `options: SummaryOptions` - Configuration options
  - `messageBaseId: string` - ID of the message base
  - `messageBaseName?: string` - Display name of the message base
  - `maxMessages?: number` - Maximum messages to analyze (default: 50)
  - `includeMetadata?: boolean` - Include additional metadata

**Returns:** `Promise<MessageSummary>`

**Example:**
```typescript
const summary = await summarizer.summarizeMessages(messages, {
  messageBaseId: 'general',
  messageBaseName: 'General Discussion',
  maxMessages: 30,
});
```

### `formatSummary(summary, frameWidth?)`

Format a summary for display.

**Parameters:**
- `summary: MessageSummary` - The summary to format
- `frameWidth?: number` - Width of the frame (default: 80)

**Returns:** `FormattedSummary`
- `plain: string` - Plain text without ANSI codes
- `colored: string` - Text with ANSI color codes
- `framed: string` - Text in a decorative frame

**Example:**
```typescript
const formatted = summarizer.formatSummary(summary, 80);
connection.send(formatted.framed);
```

### `invalidateCache(messageBaseId)`

Invalidate cached summaries for a message base.

**Parameters:**
- `messageBaseId: string` - ID of the message base

**Example:**
```typescript
// Call after posting a new message
summarizer.invalidateCache('general');
```

### `clearCache()`

Clear all cached summaries.

**Example:**
```typescript
summarizer.clearCache();
```

### `getCacheStats()`

Get cache statistics.

**Returns:** Object with cache size and entries

**Example:**
```typescript
const stats = summarizer.getCacheStats();
console.log(`Cached: ${stats.size} summaries`);
stats.entries.forEach(entry => {
  console.log(`${entry.cacheKey} expires at ${entry.expiresAt}`);
});
```

## Summary Structure

```typescript
interface MessageSummary {
  messageBaseId: string;      // ID of the message base
  messageBaseName: string;    // Display name
  messageCount: number;       // Number of messages analyzed
  summary: string;            // 2-3 sentence overview
  keyPoints: string[];        // 3-5 main discussion points
  activeTopics: string[];     // 2-4 active themes
  generatedAt: Date;          // When summary was created
  cacheKey: string;           // Cache identifier
}
```

## Caching Behavior

- **Cache Duration**: 1 hour (3600000 ms)
- **Cache Key**: `{messageBaseId}:{messageCount}`
- **Invalidation**: Automatic on expiration, manual via `invalidateCache()`
- **Storage**: In-memory (cleared on server restart)

### When to Invalidate Cache

1. **New Message Posted**: Invalidate cache for that message base
2. **Message Edited**: Invalidate cache for that message base
3. **Message Deleted**: Invalidate cache for that message base
4. **Server Restart**: Cache is automatically cleared

## Integration Example

### With MessageService

```typescript
class MessageService {
  constructor(
    private messageRepo: MessageRepository,
    private summarizer: MessageSummarizer
  ) {}

  async postMessage(data: CreateMessageData): Promise<Message> {
    const message = this.messageRepo.createMessage(data);
    
    // Invalidate summary cache
    this.summarizer.invalidateCache(data.baseId);
    
    return message;
  }

  async getSummary(baseId: string): Promise<MessageSummary> {
    const messages = this.messageRepo.getMessages(baseId, 50);
    const base = this.messageBaseRepo.getMessageBase(baseId);
    
    return this.summarizer.summarizeMessages(messages, {
      messageBaseId: baseId,
      messageBaseName: base?.name || 'Unknown',
    });
  }
}
```

### With REST API

```typescript
// Add to routes
fastify.post('/api/message-bases/:id/summarize', async (request, reply) => {
  const { id } = request.params;
  
  // Get messages
  const messages = messageService.getMessages(id, 50);
  const base = messageService.getMessageBase(id);
  
  // Generate summary
  const summary = await summarizer.summarizeMessages(messages, {
    messageBaseId: id,
    messageBaseName: base?.name || 'Unknown',
  });
  
  // Format for display
  const formatted = summarizer.formatSummary(summary);
  
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
});
```

## Performance Considerations

- **API Costs**: Each summary generation calls the AI API. Use caching to minimize costs.
- **Message Limit**: Default limit is 50 messages. Adjust based on API token limits.
- **Cache Memory**: In-memory cache grows with usage. Consider periodic cleanup.
- **Generation Time**: Summaries take 2-5 seconds to generate. Show loading indicator.

## Error Handling

```typescript
try {
  const summary = await summarizer.summarizeMessages(messages, options);
  connection.send(formatted.framed);
} catch (error) {
  if (error instanceof AIProviderError) {
    // AI API error
    connection.send('AI service temporarily unavailable. Please try again later.');
  } else {
    // Other error
    connection.send('Failed to generate summary.');
  }
}
```

## Testing

Run tests with:
```bash
npm test -- MessageSummarizer.test.ts
```

## Future Enhancements

- [ ] Persistent cache (database or Redis)
- [ ] Configurable cache duration
- [ ] Summary history tracking
- [ ] Sentiment analysis
- [ ] User-specific summaries (based on read/unread messages)
- [ ] Multi-language support
- [ ] Summary quality metrics
