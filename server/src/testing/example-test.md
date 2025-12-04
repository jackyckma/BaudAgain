# Example MCP Test: Welcome Screen Validation

This document demonstrates a complete MCP-based test for validating the BBS welcome screen.

## Test Objective

Validate that the BBS welcome screen:
1. Loads successfully when navigating to the terminal URL
2. Contains ANSI color codes for formatting
3. Displays the BBS name or welcome message
4. Renders box-drawing characters correctly

**Requirements Validated**: 1.2, 13.1, 13.2

## Test Steps

### Step 1: Navigate to Terminal

```typescript
// Use MCP to navigate to the BBS terminal
mcp_chrome_devtools_navigate_page({
  type: 'url',
  url: 'http://localhost:8080'
})
```

**Expected Result**: Browser navigates to terminal URL successfully

### Step 2: Wait for Page Load

```typescript
// Wait for the terminal to initialize
mcp_chrome_devtools_wait_for({
  text: 'Terminal',
  timeout: 10000
})
```

**Expected Result**: Terminal loads within 10 seconds

### Step 3: Take Snapshot

```typescript
// Capture the page content
const snapshot = mcp_chrome_devtools_take_snapshot()
```

**Expected Result**: Snapshot contains terminal content

### Step 4: Take Screenshot

```typescript
// Save a visual screenshot
mcp_chrome_devtools_take_screenshot({
  filePath: 'screenshots/welcome_screen_test.png'
})
```

**Expected Result**: Screenshot saved to file

### Step 5: Validate Content

```typescript
// Use validation helper
import { VALIDATORS } from './mcp-helpers';

const validation = VALIDATORS.validateWelcomeScreen(snapshot.content);

console.log('Validation Results:');
console.log('- Valid:', validation.valid);
console.log('- Issues:', validation.issues);
console.log('- Has ANSI codes:', validation.ansiValidation.hasColorCodes);
console.log('- Has box drawing:', validation.ansiValidation.hasBoxDrawing);
console.log('- Color codes found:', validation.ansiValidation.colorCodesFound.length);
```

**Expected Result**: 
- `valid` is `true`
- `issues` array is empty
- `hasColorCodes` is `true`
- Color codes are present

## Success Criteria

✅ Terminal loads successfully  
✅ Welcome screen displays  
✅ ANSI color codes are present  
✅ Content includes BBS name or welcome message  
✅ Screenshot captured successfully  

## Example Output

```
Validation Results:
- Valid: true
- Issues: []
- Has ANSI codes: true
- Has box drawing: true
- Color codes found: 15
```

## Troubleshooting

### Issue: Terminal doesn't load

**Solution**: 
1. Check that BBS server is running: `npm run dev`
2. Verify terminal client is built: `cd client/terminal && npm run build`
3. Check browser console for errors

### Issue: No ANSI codes detected

**Solution**:
1. Verify terminal is using xterm.js
2. Check that ANSI templates are being loaded
3. Inspect terminal output in browser DevTools

### Issue: Screenshot not saving

**Solution**:
1. Ensure `screenshots/` directory exists
2. Check file permissions
3. Verify path is correct

## Next Tests

After validating the welcome screen:
1. Test NEW command handling
2. Test registration flow
3. Test login flow
4. Test main menu display
