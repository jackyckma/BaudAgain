# Conversation Starters Integration

## Overview

This document describes the integration of AI-powered conversation starters into the MessageHandler, allowing users to get AI-generated discussion prompts when viewing message bases.

## Implementation Summary

### Changes Made

#### 1. MessageHandler Updates (server/src/handlers/MessageHandler.ts)

**Added to MessageFlowState interface:**
- `viewingStarters?: boolean` - Tracks if user is viewing conversation starters
- `cachedStarters?: any[]` - Caches generated starters for 1 hour
- `startersGeneratedAt?: Date` - Timestamp of when starters were generated

**Added to MessageHandlerDependencies:**
- `conversationStarter?: any` - Optional ConversationStarter service dependency

**New Methods:**
- `showConversationStarters()` - Generates and displays conversation starters with caching
- `displayConversationStarters()` - Formats and displays the starters list
- `handleViewingStarters()` - Handles user selection of conversation starters

**Updated Methods:**
- `showMessageList()` - Now shows conversation starters option when available
- `handleMessageBaseCommands()` - Added 'C' command handler for conversation starters
- `handle()` - Added routing for viewing starters state

#### 2. Dependency Injection (server/src/index.ts)

**Updated messageHandlerDeps:**
```typescript
const messageHandlerDeps = {
  ...handlerDeps,
  messageService,
  messageSummarizer,
  conversationStarter  // Added
};
```

#### 3. Integration Tests (server/src/handlers/MessageHandler.integration.test.ts)

Created comprehensive integration tests covering:
- Display of conversation starters option
- Generation and display of starters
- Caching behavior (1 hour cache)
- Starter selection flow
- Error handling
- Timeout handling
- Edge cases (no messages, service unavailable)

## Features

### 1. Conversation Starter Display

When viewing a message base with messages, users see:
```
║  💡 Need inspiration? Try [C] for conversation     ║
║     starters!                                      ║
```

### 2. Starter Generation

When user presses 'C':
- Generates 3 conversation starters with different styles (open-ended, opinion, fun)
- Each generation has a 10-second timeout
- Results are cached for 1 hour
- Shows loading indicator during generation

### 3. Starter Selection

Users can:
- Select a starter by number (1-3)
- The selected question becomes the message subject
- User is prompted to enter message body
- Can cancel with 'Q' to go back

### 4. Caching

- Starters are cached for 1 hour per message base
- Reduces AI API calls
- Improves response time for repeated requests
- Cache is stored in session state

### 5. Error Handling

Gracefully handles:
- AI service unavailable
- Generation timeouts (10 seconds per starter)
- No messages in base (shows helpful message)
- Partial failures (shows available starters even if some fail)

## User Flow

1. User navigates to message base (M command)
2. User sees conversation starters option if available
3. User presses 'C' to view starters
4. System generates 3 starters (or uses cache)
5. User selects a starter by number
6. System pre-fills subject and prompts for body
7. User enters body and posts message

## Requirements Validated

This implementation satisfies the following requirements from the spec:

- **Requirement 8.1**: Display AI-generated conversation starters when viewing message bases ✓
- **Requirement 8.3**: Allow user to select a conversation starter to initiate a new message ✓
- **Requirement 8.4**: Display helpful message when no starters available ✓
- **Requirement 8.5**: Cache conversation starters for performance ✓

## Testing

All integration tests pass (8/8):
- ✓ Shows conversation starters option when available
- ✓ Hides option when service unavailable
- ✓ Generates and displays conversation starters
- ✓ Caches starters for 1 hour
- ✓ Handles starter selection
- ✓ Handles errors gracefully
- ✓ Handles generation timeouts
- ✓ Shows helpful message when no messages exist

## Configuration

The feature is automatically enabled when:
1. AI is enabled in config.yaml
2. ConversationStarter service is initialized
3. User is viewing a message base with messages

No additional configuration required.

## Performance Considerations

- **Caching**: 1-hour cache reduces API calls
- **Timeouts**: 10-second timeout per starter prevents hanging
- **Async Generation**: Multiple starters generated in parallel
- **Graceful Degradation**: Partial failures don't block the feature

## Future Enhancements

Potential improvements:
- Allow users to regenerate starters
- Show starter style/type in display
- Track engagement metrics (which starters get used)
- Personalize starters based on user history
- Allow users to rate starters
