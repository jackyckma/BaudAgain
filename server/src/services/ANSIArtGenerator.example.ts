/**
 * Example usage of ANSIArtGenerator
 * 
 * This demonstrates how to use the ANSIArtGenerator service to create
 * AI-generated ASCII/ANSI art for the BBS.
 */

import { ANSIArtGenerator } from './ANSIArtGenerator.js';
import { AIProviderFactory } from '../ai/AIProviderFactory.js';
import pino from 'pino';

async function main() {
  // Create logger
  const logger = pino({ level: 'info' });

  // Create AI provider (requires ANTHROPIC_API_KEY environment variable)
  const aiProvider = AIProviderFactory.create({
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  // Create art generator
  const generator = new ANSIArtGenerator(aiProvider, logger);

  console.log('='.repeat(80));
  console.log('ANSIArtGenerator Example');
  console.log('='.repeat(80));
  console.log();

  // Example 1: Simple art generation
  console.log('Example 1: Simple retro-style art');
  console.log('-'.repeat(80));
  try {
    const art1 = await generator.generateArt({
      description: 'a retro computer terminal',
      style: 'retro',
      width: 40,
      height: 10,
    });

    console.log('Generated art:');
    console.log(art1.content);
    console.log();
    console.log(`Dimensions: ${art1.width}x${art1.height}`);
    console.log(`Style: ${art1.style}`);
    console.log();
  } catch (error) {
    console.error('Error generating art:', error);
  }

  // Example 2: Colored art
  console.log('Example 2: Colored cyberpunk art');
  console.log('-'.repeat(80));
  try {
    const art2 = await generator.generateArt({
      description: 'a futuristic robot',
      style: 'cyberpunk',
      width: 40,
      height: 12,
      applyColors: true,
      colorTheme: '16-color',
    });

    console.log('Generated colored art:');
    console.log(art2.coloredContent || art2.content);
    console.log();
    console.log(`Dimensions: ${art2.width}x${art2.height}`);
    console.log(`Style: ${art2.style}`);
    console.log(`Color theme: ${art2.colorTheme}`);
    console.log();
  } catch (error) {
    console.error('Error generating art:', error);
  }

  // Example 3: Framed art
  console.log('Example 3: Framed fantasy art');
  console.log('-'.repeat(80));
  try {
    const art3 = await generator.generateFramedArt(
      {
        description: 'a magical dragon',
        style: 'fantasy',
        width: 50,
        height: 15,
        applyColors: true,
        colorTheme: 'bright',
      },
      {
        title: 'DRAGON OF THE ANCIENT REALM',
        attribution: 'AI Art Studio',
        includeTimestamp: true,
        frameWidth: 80,
      }
    );

    console.log('Generated framed art:');
    console.log(art3.framedContent);
    console.log();
  } catch (error) {
    console.error('Error generating art:', error);
  }

  // Example 4: Different styles
  console.log('Example 4: Available styles and themes');
  console.log('-'.repeat(80));
  
  const styles = ANSIArtGenerator.getAvailableStyles();
  console.log('Available styles:');
  styles.forEach(style => {
    console.log(`  - ${style}: ${ANSIArtGenerator.getStyleDescription(style)}`);
  });
  console.log();

  const themes = ANSIArtGenerator.getAvailableThemes();
  console.log('Available color themes:');
  themes.forEach(theme => {
    console.log(`  - ${theme}: ${ANSIArtGenerator.getThemeDescription(theme)}`);
  });
  console.log();

  console.log('='.repeat(80));
  console.log('Examples complete!');
  console.log('='.repeat(80));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
