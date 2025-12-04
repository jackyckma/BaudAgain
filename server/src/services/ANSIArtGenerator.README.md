# ANSIArtGenerator Service

AI-powered ASCII/ANSI art generation service for BaudAgain BBS.

## Overview

The `ANSIArtGenerator` service uses AI (Claude) to generate ASCII art based on text descriptions. It supports multiple artistic styles, color themes, and automatic framing for terminal display.

## Features

- **AI-Powered Generation**: Uses Claude to create ASCII art from descriptions
- **Multiple Styles**: Retro, cyberpunk, fantasy, minimal, and classic styles
- **Color Support**: Monochrome, 16-color, and bright color themes
- **Automatic Framing**: Uses ANSIFrameBuilder for professional presentation
- **Validation**: Ensures generated art is terminal-safe and properly formatted
- **Flexible Options**: Customizable dimensions, colors, and framing

## Usage

### Basic Art Generation

```typescript
import { ANSIArtGenerator } from './services/ANSIArtGenerator.js';
import { AIProviderFactory } from './ai/AIProviderFactory.js';

// Create AI provider
const aiProvider = AIProviderFactory.create({
  provider: 'anthropic',
  model: 'claude-3-5-haiku-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create generator
const generator = new ANSIArtGenerator(aiProvider, logger);

// Generate art
const art = await generator.generateArt({
  description: 'a retro computer terminal',
  style: 'retro',
  width: 40,
  height: 10,
});

console.log(art.content);
```

### Colored Art

```typescript
const art = await generator.generateArt({
  description: 'a futuristic robot',
  style: 'cyberpunk',
  applyColors: true,
  colorTheme: '16-color',
});

console.log(art.coloredContent);
```

### Framed Art

```typescript
const art = await generator.generateFramedArt(
  {
    description: 'a magical dragon',
    style: 'fantasy',
    applyColors: true,
  },
  {
    title: 'DRAGON ART',
    attribution: 'Username',
    includeTimestamp: true,
  }
);

console.log(art.framedContent);
```

## Art Styles

- **retro**: Vintage 1980s BBS aesthetic with bold lines and geometric shapes
- **cyberpunk**: Futuristic cyberpunk style with angular designs and tech elements
- **fantasy**: Fantasy RPG style with medieval and magical elements
- **minimal**: Minimalist design with clean lines and simple shapes
- **classic**: Classic ASCII art style reminiscent of early computer art

## Color Themes

- **monochrome**: No colors, classic ASCII
- **16-color**: Standard 16-color ANSI palette
- **bright**: Bright, vibrant colors

## API Reference

### `generateArt(options: ArtGenerationOptions): Promise<GeneratedArt>`

Generate ASCII/ANSI art from a description.

**Options:**
- `description` (required): Text description of the art to generate
- `style`: Art style (default: 'retro')
- `width`: Art width in characters (default: 60, max: 80)
- `height`: Art height in lines (default: 15, max: 40)
- `maxTokens`: Maximum AI tokens (default: 1000)
- `colorTheme`: Color theme (default: '16-color')
- `applyColors`: Whether to apply colors (default: true)

**Returns:** `GeneratedArt` object with:
- `content`: Plain ASCII art
- `coloredContent`: Art with ANSI colors (if `applyColors` is true)
- `style`: The style used
- `description`: The description provided
- `width`: Actual width of generated art
- `height`: Actual height of generated art
- `colorTheme`: Color theme used (if colors applied)
- `timestamp`: Generation timestamp

### `frameArt(art: GeneratedArt, options?: FramingOptions): string`

Frame generated art with title and attribution.

**Options:**
- `title`: Title to display above art
- `attribution`: Creator attribution
- `frameWidth`: Total frame width (default: 80)
- `includeTimestamp`: Include generation timestamp

**Returns:** Framed art as a string

### `generateFramedArt(generationOptions, framingOptions): Promise<GeneratedArt>`

Generate and frame art in one call. Combines `generateArt()` and `frameArt()`.

### `validateArt(content, expectedWidth, expectedHeight): ArtValidationResult`

Validate generated art for terminal compatibility.

**Returns:** Validation result with:
- `valid`: Whether art passes validation
- `issues`: Array of validation issues
- `actualWidth`: Actual width of art
- `actualHeight`: Actual height of art

## Static Methods

### `getAvailableStyles(): ArtStyle[]`

Returns array of available art styles.

### `getAvailableThemes(): ColorTheme[]`

Returns array of available color themes.

### `getStyleDescription(style: ArtStyle): string`

Returns human-readable description of a style.

### `getThemeDescription(theme: ColorTheme): string`

Returns human-readable description of a color theme.

## Integration with BBS

The ANSIArtGenerator is designed to be used in:

1. **Art Studio Door Game** (Task 56): Interactive art generation for users
2. **Art Gallery** (Task 57): Persistent storage and display of generated art
3. **Welcome Screens**: Dynamic welcome art generation
4. **Message Bases**: Art attachments or decorations

## Error Handling

The service handles AI provider errors gracefully:

- Invalid API keys
- Rate limiting
- Timeouts
- Network errors

All errors are logged and can be caught by the caller.

## Performance Considerations

- Art generation typically takes 2-5 seconds depending on complexity
- Larger dimensions require more AI tokens
- Color application is fast (< 100ms)
- Framing is fast (< 50ms)

## Testing

Run tests with:

```bash
npm test -- ANSIArtGenerator.test.ts
```

See example usage:

```bash
tsx src/services/ANSIArtGenerator.example.ts
```

## Dependencies

- `AIProvider`: AI abstraction layer
- `ANSIColorizer`: Color code injection
- `ANSIFrameBuilder`: Frame generation
- `ANSIWidthCalculator`: Width calculation (via ANSIFrameBuilder)

## Future Enhancements

- Animation support (multi-frame art)
- Art style mixing
- User-defined color palettes
- Art templates and variations
- Batch generation
