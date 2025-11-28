# Testing Password Masking and AI Formatting

## Quick Test Guide

### Test 1: Password Masking During Registration

1. Open http://localhost:5173 in your browser
2. Type `NEW` and press Enter
3. Enter a handle (e.g., `testuser`)
4. When prompted for password:
   - ✅ Characters should NOT be visible as you type
   - ✅ Backspace should work but not show anything
   - ✅ You can still type and submit the password
5. After registration:
   - ✅ Echo should be re-enabled
   - ✅ You should see the AI welcome message with proper colors

### Test 2: Password Masking During Login

1. Disconnect and reconnect (refresh page)
2. Type your handle from Test 1
3. When prompted for password:
   - ✅ Characters should NOT be visible
   - ✅ Backspace works invisibly
4. After login:
   - ✅ Echo re-enabled
   - ✅ AI greeting message displays with proper formatting

### Test 3: AI Message Formatting

1. After logging in, press `P` to Page SysOp
2. Press Enter (or type a question)
3. Check the AI response:
   - ✅ Colors should be vibrant and properly formatted
   - ✅ No double color codes or weird formatting
   - ✅ Cyan, yellow, green colors should be distinct
   - ✅ Text should be readable and well-formatted

### Test 4: Failed Login Attempts

1. Disconnect and reconnect
2. Type a valid handle
3. Type wrong password
4. Verify:
   - ✅ Password still masked
   - ✅ Error message shows attempt count
   - ✅ Can retry with masked input
   - ✅ After 5 failed attempts, disconnected

## Expected Behavior

### Password Input
- **Before fix**: Characters visible as `p`, `a`, `s`, `s`, `w`, `o`, `r`, `d`
- **After fix**: No characters visible, just cursor position

### AI Messages
- **Before fix**: 
  ```
  [bright green][cyan]Welcome[reset][bright green] to BaudAgain![reset]
  ```
  (Double color codes causing conflicts)

- **After fix**:
  ```
  [cyan]Welcome[reset] to BaudAgain!
  ```
  (Clean, single color codes as intended by AI)

## Technical Verification

### Check Echo Control Sequences
Open browser DevTools Console and watch WebSocket messages:
- Look for `\x1b]8001;0\x07` (echo off) before password prompts
- Look for `\x1b]8001;1\x07` (echo on) after authentication

### Check AI Message Format
In the terminal, AI messages should:
- Use cyan (`\x1b[36m`) for highlights
- Use yellow (`\x1b[33m`) for important info
- Use green (`\x1b[32m`) for positive messages
- Properly reset colors (`\x1b[0m`)

## Troubleshooting

### Password still visible?
- Check browser console for errors
- Verify WebSocket connection is working
- Check that echo control sequences are being sent

### AI messages look wrong?
- Check that AI SysOp is enabled in config.yaml
- Verify ANTHROPIC_API_KEY is set in .env
- Check server logs for AI errors

### Echo not re-enabled after login?
- Check that authentication completes successfully
- Verify echo-on sequence is sent after auth
- Try typing a command - it should be visible
