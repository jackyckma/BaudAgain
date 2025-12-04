# Daily Digest Service

The Daily Digest Service provides "Catch Me Up" functionality for users who have been away from the BBS for more than 24 hours.

## Features

- **Automatic Detection**: Detects when a user has been away for 24+ hours
- **Activity Summary**: Generates AI-powered summaries of new messages across all message bases
- **Formatted Display**: Presents digest with ANSI colors and framing for terminal display
- **Smart Caching**: Uses the same caching mechanism as MessageSummarizer (1 hour expiration)

## How It Works

### 1. Login Detection

When a user logs in, the `AuthHandler` checks if they should receive a digest:

```typescript
const shouldShowDigest = dailyDigestService.shouldGenerateDigest(user.lastLogin);
```

This returns `true` if:
- User has a `lastLogin` date (not first-time user)
- More than 24 hours have passed since last login

### 2. Activity Collection

If a digest should be shown, the system:
1. Fetches all message bases
2. For each base, queries for new messages since last login
3. Collects bases with activity into an array

```typescript
const messageBasesWithActivity = [];
for (const base of allBases) {
  const newMessages = messageRepository.findByBaseIdSince(base.id, user.lastLogin);
  if (newMessages.length > 0) {
    messageBasesWithActivity.push({ base, newMessages });
  }
}
```

### 3. Digest Generation

The service uses AI to generate:
- **Per-base summaries**: 2-3 highlights for each message base with activity
- **Overall summary**: A friendly welcome-back message highlighting the most interesting activity

```typescript
const digest = await dailyDigestService.generateDigest({
  userId: user.id,
  lastLogin: user.lastLogin,
  messageBasesWithActivity,
});
```

### 4. Display

The digest is formatted with ANSI colors and framing, then displayed after the login greeting:

```
╔══════════════════════════════════════════════════════════════╗
║                      What You Missed                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ═══ CATCH ME UP ═══                                         ║
║                                                              ║
║  You've been away for 25 hours                               ║
║  5 new messages since your last visit                        ║
║                                                              ║
║  Welcome back! There has been some interesting activity...   ║
║                                                              ║
║  WHAT YOU MISSED:                                            ║
║                                                              ║
║  General Discussion (3 new)                                  ║
║    • Alice started a discussion about AI                     ║
║    • Bob shared some helpful tips                            ║
║                                                              ║
║  Tech Talk (2 new)                                           ║
║    • New thread about BBS development                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Press any key to continue to the main menu...
```

## API

### `shouldGenerateDigest(lastLogin?: Date): boolean`

Determines if a user should receive a digest based on their last login time.

**Parameters:**
- `lastLogin` - User's last login date (undefined for first-time users)

**Returns:**
- `true` if user has been away for 24+ hours
- `false` otherwise

### `generateDigest(options: DigestOptions): Promise<DailyDigest>`

Generates a daily digest for a user.

**Parameters:**
```typescript
interface DigestOptions {
  userId: string;
  lastLogin: Date;
  messageBasesWithActivity: Array<{
    base: MessageBase;
    newMessages: Message[];
  }>;
}
```

**Returns:**
```typescript
interface DailyDigest {
  userId: string;
  lastLogin: Date;
  generatedAt: Date;
  totalNewMessages: number;
  messageBaseSummaries: Array<{
    baseId: string;
    baseName: string;
    messageCount: number;
    highlights: string[];
  }>;
  overallSummary: string;
}
```

### `formatDigest(digest: DailyDigest, frameWidth?: number): FormattedDigest`

Formats a digest for display with ANSI colors and framing.

**Parameters:**
- `digest` - The digest to format
- `frameWidth` - Optional frame width (default: 80)

**Returns:**
```typescript
interface FormattedDigest {
  plain: string;      // Plain text version
  colored: string;    // ANSI colored version
  framed: string;     // Framed with ANSI colors
}
```

## Configuration

The service uses these constants:
- `HOURS_AWAY_THRESHOLD`: 24 hours (minimum time away to trigger digest)
- `DEFAULT_MAX_TOKENS`: 1000 tokens for AI generation
- `CACHE_EXPIRATION_MS`: 3600000 ms (1 hour)

## Integration

The service is integrated into the login flow in `AuthHandler`:

1. User authenticates successfully
2. System checks if digest should be shown
3. If yes, collects activity and generates digest
4. Digest is displayed before main menu
5. User presses any key to continue

## Error Handling

The service handles errors gracefully:
- If AI generation fails, the error is logged but login continues
- If no activity is found, an empty digest is returned with a friendly message
- Errors don't block the login process

## Testing

The service includes comprehensive unit tests:
- `shouldGenerateDigest` logic
- Digest generation with various scenarios
- Formatting with ANSI colors
- Empty digest handling

Run tests:
```bash
npm test -- DailyDigestService.test.ts
```

## Future Enhancements

Possible improvements:
- Configurable time threshold (not just 24 hours)
- User preferences for digest display
- Email digest option for offline users
- Digest history/archive
- More detailed activity metrics
