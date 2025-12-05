# BaudAgain BBS - Critical Issues Report

**Date:** December 5, 2025
**Status:** 🔴 **BLOCKING** - Multiple critical user-facing issues
**Tested By:** User (Browser Testing)
**Server Status:** ✅ Running on http://localhost:8080

---

## Executive Summary

While the deployment build is successful and the server runs, user testing revealed **5 critical functional issues** that prevent basic BBS usage. These issues span frontend rendering, backend logic, and feature implementation.

### Priority Issues

1. 🔴 **P0** - Welcome screen broken (duplicate prompts, formatting destroyed)
2. 🔴 **P0** - Cannot view message bodies (only see list)
3. 🔴 **P0** - Message list missing author names
4. 🔴 **P1** - AI features not accessible (summary, conversation starters)
5. 🔴 **P1** - AI ANSI art game broken

---

## Architecture Context: Terminal Rendering System

### How Rendering Works

**Centralized Approach:**
```
Handler → Creates Content Object → Renderer → ANSI String → Connection → Client
```

**Key Components:**
- **Content Objects**: Structured data (`WelcomeScreenContent`, `MessageContent`, etc.)
- **TerminalRenderer**: Converts content to ANSI (`BaseTerminalRenderer`, `WebTerminalRenderer`)
- **ANSIFrameBuilder**: Constructs frames with width enforcement
- **Handlers**: Business logic creates content, doesn't deal with ANSI directly

**Files:**
- `server/src/terminal/BaseTerminalRenderer.ts` - Core rendering
- `server/src/ansi/ANSIFrameBuilder.ts` - Frame construction
- `server/src/ansi/ANSIRenderer.ts` - ANSI utilities
- `server/src/handlers/*Handler.ts` - Content creators
- `client/terminal/src/main.ts` - Client-side display

**Problem**: Multiple layers (server render + client render + xterm.js) can interfere with each other.

---

## Issue #1: Welcome Screen Broken 🔴 P0

### Observed Behavior
![Screenshot shows duplicate prompts inside frame]

- Frame formatting destroyed
- "Enter your handle" appears TWICE
- First prompt breaks the frame border
- Visual corruption

### Expected Behavior
```
╔══════════════════════════════════════════════════════════════════════════╗
║                           BAUDAGAIN BBS                                  ║
║                      The Haunted Terminal                                ║
╠══════════════════════════════════════════════════════════════════════════╣
║              Where digital spirits dwell                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║                  Node 1/4 • 2 callers online                            ║
╚══════════════════════════════════════════════════════════════════════════╝

Enter your handle, or type NEW to register: _
```

### Root Cause Analysis

**Server Side** ([server/src/index.ts:289-314](server/src/index.ts#L289-L314)):
```typescript
// Sends welcome frame
const welcomeScreen = terminalRenderer.render(welcomeContent);
await connection.send(welcomeScreen);

// Then sends prompt
const promptContent: PromptContent = {
  type: ContentType.PROMPT,
  text: '\r\nEnter your handle, or type NEW to register: ',
};
await connection.send(terminalRenderer.render(promptContent));
```

**Potential Issues:**
1. Client may be adding its own prompt
2. Timing issue - prompt sent before frame completes
3. xterm.js rendering interference
4. ANSI escape codes conflicting

### Investigation Needed

**Check Client Code** (`client/terminal/src/main.ts`):
- Does it add its own "Enter your handle" prompt?
- How does it handle welcome screen display?
- Is it processing ANSI codes correctly?

**Check Renderer** (`server/src/terminal/BaseTerminalRenderer.ts:80-114`):
- Welcome screen rendering logic
- Frame construction
- Ensure no embedded prompts

### Fix Strategy

**Option A: Server-Side Fix (Recommended)**
1. Ensure welcome frame ends with proper `\r\n\r\n`
2. Add delay between frame and prompt sends
3. Investigate if prompt should be part of welcome content

**Option B: Client-Side Fix**
1. Check if client is duplicating prompt
2. Ensure xterm.js processes ANSI correctly
3. Remove any client-side prompt generation

**Option C: Combined**
1. Server sends complete welcome with embedded prompt
2. Client simply displays without modification

---

## Issue #2: Cannot View Message Bodies 🔴 P0

### Observed Behavior
- User can see message list
- Selecting a message number does nothing
- Only stays on list view
- No way to read actual message content

### Expected Behavior
```
[Message List]
1. Subject Line - Author

> 1
[Shows full message with subject, author, timestamp, body]
```

### Code Investigation

**MessageHandler Flow:**
- `showMessageList()` - Displays message titles
- `handleMessageListCommand()` - Should handle number selection
- Missing: `showMessage(messageId)` function

**Key File**: `server/src/handlers/MessageHandler.ts`

**Line 228**: Comment says "Read message by number" but no implementation:
```typescript
// Read message by number
if (command.match(/^\d+$/)) {
  const messageNum = parseInt(command, 10);
  // TODO: Show message body
}
```

### Root Cause
**Missing Feature**: Message body viewing not implemented

### Fix Required

**Add to MessageHandler.ts:**
```typescript
private async showMessageBody(
  messageId: string,
  session: Session,
  messageState: MessageFlowState
): Promise<string> {
  const message = await this.messageService.getMessage(messageId);

  if (!message) {
    return '\r\nMessage not found.\r\n\r\n' + this.showMessageList(session, messageState);
  }

  const output: string[] = [];
  output.push('\r\n' + '═'.repeat(78));
  output.push(`From: ${message.authorHandle}`);
  output.push(`Subject: ${message.subject}`);
  output.push(`Date: ${new Date(message.createdAt).toLocaleString()}`);
  output.push('═'.repeat(78));
  output.push('');
  output.push(message.body);
  output.push('');
  output.push('═'.repeat(78));
  output.push('\r\n[R]eply, [N]ext, [P]revious, [Q]uit: ');

  return output.join('\r\n');
}
```

**Update handleMessageListCommand():**
```typescript
if (command.match(/^\d+$/)) {
  const messageNum = parseInt(command, 10) - 1; // Zero-indexed
  const messages = await this.messageService.getMessagesByBase(messageState.baseId!);

  if (messageNum >= 0 && messageNum < messages.length) {
    return this.showMessageBody(messages[messageNum].id, session, messageState);
  }

  return '\r\nInvalid message number.\r\n\r\n' + this.showMessageList(session, messageState);
}
```

---

## Issue #3: Message List Missing Author Names 🔴 P0

### Observed Behavior
- Message list shows only subjects
- No author information displayed
- Can't tell who posted what

### Expected Behavior
```
General Discussion - 5 messages

1. Welcome to BaudAgain!              - SysOp       (12/04/25)
2. Testing the message system         - jackyma     (12/04/25)
3. RE: Welcome to BaudAgain!          - testuser    (12/05/25)
```

### Root Cause

**MessageHandler.ts `showMessageList()`** doesn't include author:
```typescript
// Current (broken):
output.push(`${index + 1}. ${message.subject}`);

// Should be:
output.push(`${index + 1}. ${message.subject.padEnd(40)} - ${message.authorHandle}`);
```

### Fix Required

**Update** `server/src/handlers/MessageHandler.ts` line ~270:
```typescript
private showMessageList(session: Session, messageState: MessageFlowState): string {
  // ... existing code ...

  messages.forEach((message, index) => {
    const num = (index + 1).toString().padStart(2);
    const subject = message.subject.padEnd(45);
    const author = message.authorHandle.padEnd(15);
    const date = new Date(message.createdAt).toLocaleDateString();

    output.push(`${num}. ${subject} - ${author} (${date})`);
  });

  // ... rest of code ...
}
```

**Data Check**: Verify `messageRepository.getMessagesByBase()` returns `authorHandle`:
- Check if JOIN with users table is working
- Ensure `authorHandle` is populated

---

## Issue #4: AI Features Not Accessible 🔴 P1

### Missing Features
1. **AI Message Summarization** ("Catch Me Up", "Summarize Thread")
2. **AI Conversation Starters** ("Question of the Day")

### Observed Behavior
- Features don't appear in menus
- No way to trigger AI summary
- No conversation starter prompts

### Expected Behavior

**In Message List:**
```
[S] Summarize thread
[C] Catch me up (unread summary)
```

**In Main Menu or Message Base:**
```
[Q] Question of the Day
```

### Code Investigation

**AI Services Initialized** (confirmed in logs):
```
AI SysOp, Configuration Assistant, Art Generator, Message Summarizer,
Daily Digest, and Conversation Starter initialized successfully
```

**But Missing in Handlers:**
- MessageHandler doesn't have summarize commands
- MenuHandler doesn't show conversation starters
- No menu options to trigger these features

### Fix Required

**MessageHandler.ts** - Add summarize options:
```typescript
private showMessageList(session: Session, messageState: MessageFlowState): string {
  // ... existing message list ...

  output.push('');
  output.push('[Number] Read message');
  output.push('[P] Post new message');
  output.push('[S] Summarize thread');        // NEW
  output.push('[C] Catch me up (unread)');    // NEW
  output.push('[Q] Back to message bases');

  // ... rest ...
}
```

**Handle 'S' command:**
```typescript
if (upperCommand === 'S') {
  if (!this.deps.messageSummarizer) {
    return '\r\nAI summarization not available.\r\n\r\n' + this.showMessageList(session, messageState);
  }

  const messages = await this.messageService.getMessagesByBase(messageState.baseId!);
  const summary = await this.deps.messageSummarizer.summarizeThread(messages);

  return `\r\n=== Thread Summary ===\r\n${summary}\r\n\r\n` + this.showMessageList(session, messageState);
}
```

**MenuHandler.ts** - Add conversation starter:
```typescript
// Check for daily question
if (this.deps.dailyQuestionService) {
  const question = await this.deps.dailyQuestionService.getTodaysQuestion();
  if (question) {
    options.push({
      key: 'Q',
      label: 'Question of the Day',
      description: question.question
    });
  }
}
```

---

## Issue #5: AI ANSI Art Game Broken 🔴 P1

### Observed Behavior
- Art Studio door game crashes or doesn't work
- Unknown if backend or frontend issue

### Investigation Needed

**Check Door Registration:**
```bash
# Verify Art Studio is registered
curl http://localhost:8080/api/v1/doors
```

**Check Door Handler:**
- `server/src/doors/ArtStudioDoor.ts`
- `server/src/handlers/DoorHandler.ts`

**Check Client:**
- `client/terminal/src/main.ts` - Door game handling

### Debugging Steps

1. **Test Backend API:**
   ```bash
   # List doors
   curl http://localhost:8080/api/v1/doors \
     -H "Authorization: Bearer $TOKEN"

   # Enter Art Studio
   curl http://localhost:8080/api/v1/doors/art-studio/enter \
     -X POST \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Check Server Logs:**
   - Look for Art Studio errors
   - Check AI service calls

3. **Check Client Logs:**
   - Browser console for errors
   - WebSocket message flow

### Potential Issues
- AI API key not configured
- Door session state corruption
- Frontend not handling door responses
- ANSI art rendering broken

---

## Recommended Fix Priority

### Phase 1: Critical UX (2-4 hours)
1. ✅ Fix message body viewing (30 min)
2. ✅ Fix message list author names (15 min)
3. ✅ Fix welcome screen duplicate prompt (1 hour)

### Phase 2: AI Features (2-3 hours)
4. ✅ Add AI summary commands to MessageHandler (1 hour)
5. ✅ Add conversation starter to MenuHandler (30 min)
6. ✅ Debug and fix Art Studio door (1-2 hours)

### Phase 3: Polish (1 hour)
7. ✅ Test all flows end-to-end
8. ✅ Verify ANSI rendering consistency
9. ✅ Update documentation

---

## Testing Checklist

After fixes:
- [ ] Welcome screen displays correctly
- [ ] Can view message bodies
- [ ] Message list shows author names
- [ ] Can summarize threads
- [ ] "Catch me up" works
- [ ] Conversation starters appear
- [ ] Art Studio door functional
- [ ] All ANSI frames aligned properly

---

## Next Steps

1. **Decision Point**: Fix issues now or document for later?
2. **If fixing now**: Start with Phase 1 (critical UX)
3. **If documenting**: Create detailed fix tickets with code examples

**Recommendation**: Fix Phase 1 issues immediately (core BBS functionality broken), then Phase 2 for demo readiness.
