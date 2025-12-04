# ConversationStarter Service

## Overview

The ConversationStarter service analyzes message base activity and generates AI-powered discussion questions to encourage engagement and spark conversations. It's designed to help keep BBS communities active and vibrant by:

- Detecting conversation lulls
- Analyzing trending topics
- Generating contextual, engaging questions
- Adapting question style to community needs

## Features

### Activity Analysis

The service analyzes message base activity to understand:
- **Message volume**: How many messages in recent time window
- **Engagement level**: High, medium, low, or none
- **Unique participants**: Number of different users posting
- **Trending topics**: Keywords extracted from message subjects
- **Conversation lulls**: Periods of inactivity
- **Average message length**: Indicator of discussion depth

### Question Generation

Generates questions in five different styles:

1. **Open-ended**: Invites diverse perspectives and experiences
2. **Opinion**: Encourages debate and discussion
3. **Creative**: Sparks imagination and fun responses
4. **Technical**: Invites knowledge sharing
5. **Fun**: Lighthearted entertainment

The service can automatically select the most appropriate style based on current activity patterns.

### ANSI Formatting

Questions can be formatted with:
- Plain text (no formatting)
- ANSI colors (terminal-friendly)
- Framed display (with borders and title)

## Usage

### Basic Usage

```typescript
import { ConversationStarter } from './services/ConversationStarter.js';
import { AIProviderFactory } from './ai/AIProviderFactory.js';

// Initialize
const aiProvider = AIProviderFactory.create(config.ai);
const conversationStarter = new ConversationStarter(aiProvider, logger);

// Analyze activity
const analysis = conversationStarter.analyzeActivity(
  messageBase,
  recentMessages,
  72 // time window in hours
);

console.log('Engagement level:', analysis.engagementLevel);
console.log('Conversation lull:', analysis.conversationLull);
console.log('Trending topics:', analysis.trendingTopics);

// Generate a question
const question = await conversationStarter.generateQuestion({
  messageBaseId: messageBase.id,
  messageBaseName: messageBase.name,
  recentMessages: recentMessages,
  style: 'auto', // or specific style
});

console.log('Generated question:', question.question);
console.log('Context:', question.context);

// Format for display
const formatted = conversationStarter.formatQuestion(question, 80);
console.log(formatted.framed); // Display in terminal
```

### Specific Question Styles

```typescript
// Generate a fun question
const funQuestion = await conversationStarter.generateQuestion({
  messageBaseId: messageBase.id,
  messageBaseName: messageBase.name,
  recentMessages: recentMessages,
  style: 'fun',
});

// Generate an opinion question
const opinionQuestion = await conversationStarter.generateQuestion({
  messageBaseId: messageBase.id,
  messageBaseName: messageBase.name,
  recentMessages: recentMessages,
  style: 'opinion',
});
```

### Activity Analysis Only

```typescript
// Just analyze without generating a question
const analysis = conversationStarter.analyzeActivity(
  messageBase,
  recentMessages,
  72 // last 72 hours
);

if (analysis.conversationLull) {
  console.log('Time to post a conversation starter!');
  console.log(`It's been ${Math.round(analysis.hoursSinceLastActivity)} hours since last activity`);
}

if (analysis.engagementLevel === 'low') {
  console.log('Engagement is low, consider posting a question');
}
```

## Integration Examples

### Scheduled Daily Question

```typescript
// Run daily at 9 AM
async function postDailyQuestion() {
  const messageBase = messageBaseRepository.getMessageBase('general');
  const recentMessages = messageRepository.findByBaseIdSince(
    messageBase.id,
    new Date(Date.now() - 72 * 60 * 60 * 1000) // last 72 hours
  );

  const question = await conversationStarter.generateQuestion({
    messageBaseId: messageBase.id,
    messageBaseName: messageBase.name,
    recentMessages,
    style: 'auto',
  });

  // Post as AI SysOp
  messageRepository.createMessage({
    baseId: messageBase.id,
    userId: AI_SYSOP_USER_ID,
    subject: '💭 Question of the Day',
    body: question.question,
  });

  logger.info({ questionId: question.id }, 'Daily question posted');
}
```

### Detect and Respond to Lulls

```typescript
// Check for conversation lulls every 6 hours
async function checkForLulls() {
  const messageBases = messageBaseRepository.getAllMessageBases();

  for (const base of messageBases) {
    const recentMessages = messageRepository.findByBaseIdSince(
      base.id,
      new Date(Date.now() - 72 * 60 * 60 * 1000)
    );

    const analysis = conversationStarter.analyzeActivity(
      base,
      recentMessages,
      72
    );

    if (analysis.conversationLull && analysis.messageCount > 0) {
      // There was activity before, but now it's quiet
      const question = await conversationStarter.generateQuestion({
        messageBaseId: base.id,
        messageBaseName: base.name,
        recentMessages,
        style: 'auto',
      });

      // Post to revive conversation
      messageRepository.createMessage({
        baseId: base.id,
        userId: AI_SYSOP_USER_ID,
        subject: '💬 Let\'s Talk!',
        body: question.question,
      });

      logger.info(
        { messageBaseId: base.id, questionId: question.id },
        'Posted question to revive conversation'
      );
    }
  }
}
```

### Control Panel Integration

```typescript
// Manual trigger from control panel
app.post('/api/v1/conversation-starters/generate', async (request, reply) => {
  const { messageBaseId, style } = request.body;

  const messageBase = messageBaseRepository.getMessageBase(messageBaseId);
  const recentMessages = messageRepository.findByBaseIdSince(
    messageBaseId,
    new Date(Date.now() - 72 * 60 * 60 * 1000)
  );

  const question = await conversationStarter.generateQuestion({
    messageBaseId: messageBase.id,
    messageBaseName: messageBase.name,
    recentMessages,
    style: style || 'auto',
  });

  return {
    question: question.question,
    context: question.context,
    style: question.style,
    formatted: conversationStarter.formatQuestion(question),
  };
});
```

## Configuration

The service uses these configurable thresholds:

```typescript
// In ConversationStarter class
private readonly LULL_THRESHOLD_HOURS = 24; // Hours of inactivity to trigger lull
private readonly LOW_ENGAGEMENT_THRESHOLD = 3; // Messages per day for low engagement
```

You can adjust these by extending the class or modifying the constants.

## Question Styles

### Open-Ended
Best for: General discussion, personal experiences
Example: "What's your favorite memory of the early internet?"

### Opinion
Best for: Debates, preferences, choices
Example: "Which was better: BBSs or early web forums?"

### Creative
Best for: Imagination, fun scenarios
Example: "If you could design your dream BBS door game, what would it be?"

### Technical
Best for: Knowledge sharing, learning
Example: "What's the most interesting thing you've learned about ANSI art?"

### Fun
Best for: Entertainment, humor, community building
Example: "What's the most ridiculous username you've ever seen on a BBS?"

## Activity Analysis Metrics

### Engagement Levels

- **High**: 10+ messages per day
- **Medium**: 3-10 messages per day
- **Low**: < 3 messages per day
- **None**: No messages

### Conversation Lull

A lull is detected when:
- No activity for 24+ hours
- Previous activity exists (not a new/empty base)

### Trending Topics

Extracted by:
1. Analyzing message subjects
2. Counting word frequency
3. Filtering stop words
4. Returning top 5 keywords

## Error Handling

The service handles errors gracefully:

```typescript
try {
  const question = await conversationStarter.generateQuestion(options);
} catch (error) {
  if (error instanceof AIProviderError) {
    // AI service is down or rate limited
    logger.error('AI provider error:', error.toJSON());
    // Fall back to pre-written questions or retry later
  } else {
    // Unexpected error
    logger.error('Unexpected error:', error);
  }
}
```

## Best Practices

1. **Don't over-post**: Limit to 1 question per day per message base
2. **Respect engagement**: Don't post questions in highly active bases
3. **Monitor responses**: Track which question styles get the most engagement
4. **Vary styles**: Rotate through different question styles
5. **Consider timing**: Post during peak activity hours
6. **Community fit**: Ensure questions match the community's interests

## Future Enhancements

Potential improvements:
- Learn from engagement metrics to improve question quality
- Support for multi-language questions
- Integration with user preferences
- Question templates for specific communities
- A/B testing different question styles
- Seasonal or themed questions

## Related Services

- **MessageSummarizer**: Summarizes existing discussions
- **DailyDigestService**: Creates "catch me up" summaries
- **AISysOp**: Provides AI-powered assistance
- **ANSIArtGenerator**: Creates visual content

## License

Part of the BaudAgain BBS project.
