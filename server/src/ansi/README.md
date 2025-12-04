# ANSI Rendering System

A comprehensive, centralized ANSI rendering architecture for BaudAgain BBS that guarantees correct visual output across all contexts (terminal, telnet, web).

## Overview

The ANSI rendering system provides a reliable way to create perfectly aligned frames, boxes, and colored text that works consistently across different output contexts. It handles all the complexity of ANSI escape codes, visual width calculation, and context-specific formatting in one place.

## Core Components

### ANSIRenderingService

The main service that coordinates all ANSI rendering operations.

```typescript
import { ANSIRenderingService, RENDER_CONTEXTS } from './ANSIRenderingService.js';

const service = new ANSIRenderingService();
```

#### Render Contexts

The service supports three render contexts:

```typescript
// Terminal context (80 columns, LF line endings)
const TERMINAL_80 = { type: 'terminal', width: 80 };

// Telnet context (80 columns, CRLF line endings)
const TELNET_80 = { type: 'telnet', width: 80 };

// Web context (80 columns, HTML output, LF line endings)
const WEB_80 = { type: 'web', width: 80 };
```

#### Rendering Frames

**Basic Frame:**

```typescript
const content = [
  { text: 'Hello World' },
  { text: 'Welcome to BaudAgain BBS', align: 'center' },
  { text: 'Press any key to continue...' }
];

const frame = service.renderFrame(
  content,
  { width: 80, style: 'double' },
  RENDER_CONTEXTS.TERMINAL_80
);

console.log(frame);
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ Hello World                                                                  ║
// ║                        Welcome to BaudAgain BBS                              ║
// ║ Press any key to continue...                                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
```

**Frame with Title:**

```typescript
const frame = service.renderFrameWithTitle(
  'System Message',
  [
    { text: 'Your message has been posted successfully!' },
    { text: '' },
    { text: 'Thank you for using BaudAgain BBS.' }
  ],
  { width: 60 },
  RENDER_CONTEXTS.TERMINAL_80,
  'cyan'  // Title color
);
```

**Frame Options:**

```typescript
interface FrameOptions {
  width: number;           // Frame width in columns
  style?: 'single' | 'double';  // Border style (default: 'double')
  padding?: number;        // Internal padding (default: 1)
}
```

**Content Options:**

```typescript
interface FrameLine {
  text: string;            // Line content
  align?: 'left' | 'center';  // Text alignment (default: 'left')
  color?: ColorName;       // Text color (optional)
}
```

#### Rendering Text

**Colored Text:**

```typescript
const text = service.renderText(
  'This is a warning message',
  'yellow',
  RENDER_CONTEXTS.TERMINAL_80
);
// Terminal: \x1b[33mThis is a warning message\x1b[0m
// Web: <span style="color: #ffff00">This is a warning message</span>
```

**Supported Colors:**
- `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `white`, `gray`

#### Template Rendering

**Define a Template:**

```typescript
const template: Template = {
  name: 'welcome',
  width: 80,
  style: 'double',
  content: [
    { text: 'Welcome, {{username}}!', align: 'center' },
    { text: '' },
    { text: 'You have {{messageCount}} new messages.' }
  ],
  variables: ['username', 'messageCount']
};
```

**Render Template:**

```typescript
const output = service.renderTemplate(
  template,
  { username: 'Alice', messageCount: '5' },
  RENDER_CONTEXTS.TERMINAL_80
);
```

#### Context-Specific Rendering

**Terminal Context:**
- Uses LF (`\n`) line endings
- Includes ANSI color codes
- Validates width to prevent wrapping

**Telnet Context:**
- Uses CRLF (`\r\n`) line endings
- Includes ANSI color codes
- Validates width to prevent wrapping

**Web Context:**
- Uses LF (`\n`) line endings
- Converts ANSI codes to HTML/CSS
- No raw ANSI escape codes in output

### ANSIFrameBuilder

Low-level frame building utility (used internally by ANSIRenderingService).

```typescript
import { ANSIFrameBuilder } from './ANSIFrameBuilder.js';

const builder = new ANSIFrameBuilder({ width: 60, style: 'double' });
const lines = builder.build([
  { text: 'Line 1' },
  { text: 'Line 2', align: 'center' }
]);
// Returns: string[] (array of frame lines)
```

### ANSIColorizer

Color management utility.

```typescript
import { ANSIColorizer } from './ANSIColorizer.js';

// Apply color (automatically adds reset code)
const colored = ANSIColorizer.colorize('Hello', 'red');
// \x1b[31mHello\x1b[0m

// Convert to HTML
const html = ANSIColorizer.toHTML(colored);
// <span style="color: #ff0000">Hello</span>

// Strip ANSI codes
const plain = ANSIColorizer.strip(colored);
// Hello
```

### ANSIWidthCalculator

Visual width calculation utility.

```typescript
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

// Calculate visual width (strips ANSI codes)
const width = ANSIWidthCalculator.calculate('\x1b[31mHello\x1b[0m');
// 5

// Check if text fits
const fits = ANSIWidthCalculator.fitsIn('Hello World', 10);
// false

// Truncate to fit
const truncated = ANSIWidthCalculator.truncate('Hello World', 8);
// Hello...
```

### ANSIValidator

Frame validation utility.

```typescript
import { ANSIValidator } from './ANSIValidator.js';

// Validate frame alignment
const result = ANSIValidator.validateFrame(frameContent);
if (!result.valid) {
  console.error('Validation issues:', result.issues);
}

// Validate max width
const widthResult = ANSIValidator.validateMaxWidth(content, 80);
```

## Usage Examples

### Example 1: Welcome Screen

```typescript
import { ANSIRenderer } from './ANSIRenderer.js';
import { RENDER_CONTEXTS } from './ANSIRenderingService.js';

const renderer = new ANSIRenderer();

// Render for terminal
const welcome = renderer.render('welcome', {
  nodeNumber: '1',
  totalNodes: '4',
  callersToday: '42'
}, RENDER_CONTEXTS.TERMINAL_80);

console.log(welcome);
```

### Example 2: Message Frame

```typescript
import { ANSIRenderingService, RENDER_CONTEXTS } from './ANSIRenderingService.js';

const service = new ANSIRenderingService();

const message = service.renderFrameWithTitle(
  'New Message',
  [
    { text: 'From: Alice', color: 'cyan' },
    { text: 'Subject: Meeting Tomorrow', color: 'cyan' },
    { text: '' },
    { text: 'Hi Bob,' },
    { text: '' },
    { text: 'Can we meet tomorrow at 2pm?' },
    { text: '' },
    { text: 'Thanks!' }
  ],
  { width: 70 },
  RENDER_CONTEXTS.TERMINAL_80,
  'yellow'
);
```

### Example 3: Web Terminal Output

```typescript
// For web terminal emulator
const webOutput = service.renderFrame(
  [
    { text: 'System Status', align: 'center', color: 'green' },
    { text: '' },
    { text: 'All systems operational' }
  ],
  { width: 60 },
  RENDER_CONTEXTS.WEB_80
);

// webOutput contains HTML with <span> tags, no ANSI codes
document.getElementById('terminal').innerHTML = `<pre>${webOutput}</pre>`;
```

### Example 4: Custom Context

```typescript
// Create custom context for different terminal width
const TERMINAL_132: RenderContext = {
  type: 'terminal',
  width: 132
};

const wideFrame = service.renderFrame(
  content,
  { width: 132 },
  TERMINAL_132
);
```

## Migration Guide

### Migrating from Direct Frame Building

**Before:**
```typescript
// Old way - manual frame construction
const frame = new ANSIFrameBuilder({ width: 80 });
const lines = frame.build(content);
const output = lines.join('\n');
```

**After:**
```typescript
// New way - use ANSIRenderingService
const service = new ANSIRenderingService();
const output = service.renderFrame(
  content,
  { width: 80 },
  RENDER_CONTEXTS.TERMINAL_80
);
```

### Migrating from Manual Color Application

**Before:**
```typescript
// Old way - manual ANSI codes
const text = `\x1b[33m${message}\x1b[0m`;
```

**After:**
```typescript
// New way - use ANSIColorizer or renderText
const text = ANSIColorizer.colorize(message, 'yellow');
// or
const text = service.renderText(message, 'yellow', context);
```

### Migrating Web Output

**Before:**
```typescript
// Old way - custom conversion function
function ansiToHtml(text) {
  return text.replace(/\x1b\[33m/g, '<span style="color: yellow">')
             .replace(/\x1b\[0m/g, '</span>');
}
```

**After:**
```typescript
// New way - use web context
const html = service.renderFrame(
  content,
  { width: 80 },
  RENDER_CONTEXTS.WEB_80
);
// No ANSI codes, proper HTML output
```

## Best Practices

### 1. Always Use ANSIRenderingService

Don't construct ANSI strings manually. Use the service for all rendering:

```typescript
// ✅ Good
const output = service.renderFrame(content, options, context);

// ❌ Bad
const output = `\x1b[33m${text}\x1b[0m`;
```

### 2. Choose the Right Context

Always specify the appropriate context for your output:

```typescript
// For terminal connections
const output = service.renderFrame(content, options, RENDER_CONTEXTS.TERMINAL_80);

// For telnet connections
const output = service.renderFrame(content, options, RENDER_CONTEXTS.TELNET_80);

// For web terminal emulator
const output = service.renderFrame(content, options, RENDER_CONTEXTS.WEB_80);
```

### 3. Enable Validation in Development

Enable validation to catch alignment issues early:

```typescript
const output = service.renderFrame(
  content,
  options,
  context,
  true  // Enable validation
);
```

### 4. Use Templates for Reusable Screens

Define templates for screens you render frequently:

```typescript
const templates = {
  welcome: { /* template definition */ },
  goodbye: { /* template definition */ },
  menu: { /* template definition */ }
};

const output = service.renderTemplate(
  templates.welcome,
  variables,
  context
);
```

### 5. Handle Errors Gracefully

```typescript
try {
  const output = service.renderFrame(content, options, context, true);
  connection.send(output);
} catch (error) {
  if (error instanceof WidthExceededError) {
    // Handle width issue
    console.error(`Content too wide: ${error.actualWidth} > ${error.maxWidth}`);
  } else if (error instanceof ANSIRenderingError) {
    // Handle other rendering errors
    console.error('Rendering failed:', error.message, error.details);
  }
}
```

## Testing

### Unit Tests

Test individual components:

```typescript
import { ANSIWidthCalculator } from './ANSIWidthCalculator.js';

describe('Width Calculation', () => {
  it('should strip ANSI codes', () => {
    const width = ANSIWidthCalculator.calculate('\x1b[31mHello\x1b[0m');
    expect(width).toBe(5);
  });
});
```

### Property-Based Tests

The system includes comprehensive property-based tests that verify correctness across many random inputs:

```bash
npm test -- --run ANSIFrameBuilder.property.test.ts
npm test -- --run ANSIRenderingService.property.test.ts
```

### Integration Tests

Test complete rendering scenarios:

```bash
npm test -- --run ANSIRenderer.test.ts
npm test -- --run visual-regression.test.ts
```

### Visual Verification

Run the verification script to see actual output:

```bash
npx tsx verify-ansi-rendering.ts
```

## Troubleshooting

### Frame Alignment Issues

If frames appear misaligned:

1. Enable validation to get specific error messages
2. Check that all content fits within the target width
3. Verify ANSI codes are being stripped correctly

```typescript
const result = ANSIValidator.validateFrame(output);
console.log('Validation:', result);
```

### Color Not Appearing

If colors don't appear:

1. Check you're using the right context (web vs terminal)
2. Verify color names are correct
3. Check terminal supports ANSI colors

```typescript
// For web, use web context
const output = service.renderText(text, 'red', RENDER_CONTEXTS.WEB_80);
```

### Line Wrapping in Terminal

If lines wrap unexpectedly:

1. Check frame width matches terminal width
2. Enable validation to detect width issues
3. Use appropriate context width

```typescript
// For 80-column terminal
const output = service.renderFrame(
  content,
  { width: 80 },
  RENDER_CONTEXTS.TERMINAL_80,
  true  // Validate
);
```

## API Reference

### ANSIRenderingService

#### Methods

- `renderFrame(content, options, context, validate?)` - Render a frame
- `renderFrameWithTitle(title, content, options, context, titleColor?, validate?)` - Render frame with title
- `renderText(text, color?, context)` - Render colored text
- `renderTemplate(template, variables, context, validate?)` - Render template with variables
- `getLineEnding(context)` - Get line ending for context

### ANSIFrameBuilder

#### Methods

- `build(content)` - Build frame, returns string[]
- `buildWithTitle(title, content, titleColor?)` - Build frame with title
- `buildMessage(message, color?)` - Build simple message frame

### ANSIColorizer

#### Methods

- `colorize(text, color)` - Apply color with reset
- `toHTML(ansiText)` - Convert ANSI to HTML
- `strip(ansiText)` - Remove all ANSI codes

### ANSIWidthCalculator

#### Methods

- `calculate(text)` - Calculate visual width
- `fitsIn(text, width)` - Check if text fits
- `truncate(text, width, ellipsis?)` - Truncate to fit

### ANSIValidator

#### Methods

- `validateFrame(content)` - Validate frame alignment
- `validateWidth(lines)` - Validate uniform width
- `validateBorders(content, style)` - Validate border integrity
- `validateMaxWidth(content, maxWidth)` - Validate max width

## Performance

The rendering system is optimized for correctness over performance, which is appropriate for a BBS where rendering happens infrequently. Typical performance:

- Frame rendering: < 1ms
- Template rendering: < 2ms
- Validation: < 1ms

For high-frequency rendering, consider caching rendered output.

## License

Part of BaudAgain BBS - see main project license.
