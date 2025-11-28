# Password Masking and AI Message Formatting Fixes

## Summary

Fixed two critical issues with the BaudAgain BBS authentication and AI integration:

1. **Password Masking** - Passwords are now hidden when typed
2. **AI Message Formatting** - AI-generated messages with ANSI codes no longer have conflicting color codes

## Changes Made

### 1. Password Masking Implementation

#### Shared Types (`packages/shared/src/terminal.ts`)
- Added `ECHO_CONTROL` content type for controlling terminal echo
- Added `echoInput?: boolean` field to `PromptContent` interface
- Created `EchoControlContent` interface for echo control messages

#### Terminal Renderers
- **WebTerminalRenderer** (`server/src/terminal/WebTerminalRenderer.ts`)
  - Added `renderEchoControl()` method that sends special escape sequence `\x1b]8001;{0|1}\x07`
  
- **ANSITerminalRenderer** (`server/src/terminal/ANSITerminalRenderer.ts`)
  - Added `renderEchoControl()` method with same escape sequence

#### Terminal Client (`client/terminal/src/main.ts`)
- Added `echoEnabled` state variable to track echo status
- Modified `ws.onmessage` to detect and parse echo control sequences
- Updated input handler to only echo characters when `echoEnabled` is true
- Backspace handling now respects echo state

#### AuthHandler (`server/src/handlers/AuthHandler.ts`)
- Added echo control before all password prompts:
  - Registration password prompt
  - Login password prompt
  - Password retry prompts
- Re-enables echo after successful authentication
- Maintains echo-off state during password validation errors

### 2. AI Message Formatting Fix

#### Problem
AI-generated messages already contain ANSI color codes, but were being wrapped in `MessageContent` with `style: 'success'`, causing the renderer to add additional color codes that conflicted with the AI's formatting.

#### Solution
Changed AI message handling to use `RawANSIContent` instead of `MessageContent`:

- **AuthHandler** (`server/src/handlers/AuthHandler.ts`)
  - Welcome messages now use `RawANSIContent` type
  - Login greeting messages now use `RawANSIContent` type
  - Fallback messages still use `MessageContent` for consistent styling

- **MenuHandler** (`server/src/handlers/MenuHandler.ts`)
  - Page SysOp responses now use `RawANSIContent` type
  - AI responses are passed through without additional color wrapping

## Technical Details

### Echo Control Protocol
The echo control uses a custom OSC (Operating System Command) escape sequence:
```
\x1b]8001;{enabled}\x07
```
Where `{enabled}` is:
- `1` = echo enabled (show typed characters)
- `0` = echo disabled (hide typed characters, for passwords)

This approach:
- Works with xterm.js and standard terminal emulators
- Doesn't interfere with other ANSI sequences
- Can be easily extended for other terminal control features

### Content Type Strategy
```typescript
// For AI-generated content with ANSI codes
const aiContent: RawANSIContent = {
  type: ContentType.RAW_ANSI,
  ansi: aiResponse,
};

// For system messages without ANSI codes
const systemMessage: MessageContent = {
  type: ContentType.MESSAGE,
  text: 'Welcome!',
  style: 'success',
};
```

## Testing

To test the fixes:

1. **Password Masking**:
   - Open http://localhost:5173
   - Type "NEW" to register
   - Enter a handle
   - When prompted for password, verify characters are NOT visible
   - Try backspace - should work but not show anything
   - Complete registration

2. **AI Message Formatting**:
   - After registration, check the AI welcome message
   - Colors should be properly formatted (cyan, yellow, green, etc.)
   - No double color codes or formatting conflicts
   - Try "P" to Page SysOp and verify response formatting

## Files Modified

- `packages/shared/src/terminal.ts` - Added echo control types
- `server/src/terminal/WebTerminalRenderer.ts` - Added echo control rendering
- `server/src/terminal/ANSITerminalRenderer.ts` - Added echo control rendering
- `server/src/handlers/AuthHandler.ts` - Implemented password masking and fixed AI message formatting
- `server/src/handlers/MenuHandler.ts` - Fixed AI response formatting
- `client/terminal/src/main.ts` - Implemented echo control handling

## Requirements Validated

These fixes address:
- **Requirement 2.4**: Password hashing (now with proper masking during input)
- **Requirement 5.4**: AI message ANSI formatting (no longer conflicts with renderer)
- **Requirement 13.1**: ANSI escape code interpretation (echo control sequences)
