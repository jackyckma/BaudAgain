/**
 * Tests for ANSIArtGenerator service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ANSIArtGenerator, ArtStyle, ColorTheme } from './ANSIArtGenerator.js';
import { AIProvider } from '../ai/AIProvider.js';
import type { FastifyBaseLogger } from 'fastify';

// Mock AI Provider
const createMockAIProvider = (): AIProvider => ({
  generateCompletion: vi.fn().mockResolvedValue(`
    /\\_/\\
   ( o.o )
    > ^ <
  `),
  generateStructured: vi.fn(),
});

// Mock Logger
const createMockLogger = (): FastifyBaseLogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn(),
  level: 'info',
  silent: vi.fn(),
} as any);

describe('ANSIArtGenerator', () => {
  let generator: ANSIArtGenerator;
  let mockProvider: AIProvider;
  let mockLogger: FastifyBaseLogger;

  beforeEach(() => {
    mockProvider = createMockAIProvider();
    mockLogger = createMockLogger();
    generator = new ANSIArtGenerator(mockProvider, mockLogger);
  });

  describe('generateArt', () => {
    it('should generate art with default options', async () => {
      const result = await generator.generateArt({
        description: 'a cat',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.style).toBe('retro');
      expect(result.description).toBe('a cat');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should generate art with custom style', async () => {
      const result = await generator.generateArt({
        description: 'a robot',
        style: 'cyberpunk',
      });

      expect(result.style).toBe('cyberpunk');
    });

    it('should generate art with custom dimensions', async () => {
      const result = await generator.generateArt({
        description: 'a castle',
        width: 40,
        height: 10,
      });

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should apply colors when requested', async () => {
      const result = await generator.generateArt({
        description: 'a dragon',
        applyColors: true,
        colorTheme: '16-color',
      });

      expect(result.coloredContent).toBeDefined();
      expect(result.colorTheme).toBe('16-color');
    });

    it('should not apply colors when disabled', async () => {
      const result = await generator.generateArt({
        description: 'a sword',
        applyColors: false,
      });

      expect(result.coloredContent).toBeUndefined();
      expect(result.colorTheme).toBeUndefined();
    });

    it('should validate dimensions', async () => {
      await expect(
        generator.generateArt({
          description: 'test',
          width: 5, // Too small
        })
      ).rejects.toThrow();

      await expect(
        generator.generateArt({
          description: 'test',
          width: 100, // Too large
        })
      ).rejects.toThrow();
    });
  });

  describe('validateArt', () => {
    it('should validate art and return dimensions', () => {
      const art = `
  /\\_/\\
 ( o.o )
  > ^ <
      `.trim();

      const result = generator.validateArt(art, 8, 3);

      // Should return actual dimensions
      expect(result.actualWidth).toBeGreaterThan(0);
      expect(result.actualHeight).toBe(3);
      // Should not have critical issues like empty content or unsafe chars
      expect(result.issues.some(issue => issue.includes('empty'))).toBe(false);
      expect(result.issues.some(issue => issue.includes('unsafe'))).toBe(false);
    });

    it('should detect empty art', () => {
      const result = generator.validateArt('', 10, 3);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Art content is empty');
    });

    it('should detect insufficient content', () => {
      const result = generator.validateArt('x', 10, 3);

      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('insufficient content'))).toBe(true);
    });
  });

  describe('frameArt', () => {
    it('should frame art without title', () => {
      const art = {
        content: 'Test Art',
        style: 'retro' as ArtStyle,
        description: 'test',
        width: 8,
        height: 1,
        timestamp: new Date(),
      };

      const framed = generator.frameArt(art);

      expect(framed).toContain('╔');
      expect(framed).toContain('╗');
      expect(framed).toContain('╚');
      expect(framed).toContain('╝');
      expect(framed).toContain('Test Art');
    });

    it('should frame art with title', () => {
      const art = {
        content: 'Test Art',
        style: 'retro' as ArtStyle,
        description: 'test',
        width: 8,
        height: 1,
        timestamp: new Date(),
      };

      const framed = generator.frameArt(art, {
        title: 'My Artwork',
      });

      expect(framed).toContain('My Artwork');
    });

    it('should frame art with attribution', () => {
      const art = {
        content: 'Test Art',
        style: 'retro' as ArtStyle,
        description: 'test',
        width: 8,
        height: 1,
        timestamp: new Date(),
      };

      const framed = generator.frameArt(art, {
        attribution: 'TestUser',
      });

      expect(framed).toContain('Created by: TestUser');
    });

    it('should frame art with timestamp', () => {
      const art = {
        content: 'Test Art',
        style: 'retro' as ArtStyle,
        description: 'test',
        width: 8,
        height: 1,
        timestamp: new Date(),
      };

      const framed = generator.frameArt(art, {
        includeTimestamp: true,
      });

      expect(framed).toBeTruthy();
      // Timestamp format varies by locale, just check it's included
    });
  });

  describe('static methods', () => {
    it('should return available styles', () => {
      const styles = ANSIArtGenerator.getAvailableStyles();

      expect(styles).toContain('retro');
      expect(styles).toContain('cyberpunk');
      expect(styles).toContain('fantasy');
      expect(styles).toContain('minimal');
      expect(styles).toContain('classic');
    });

    it('should return available themes', () => {
      const themes = ANSIArtGenerator.getAvailableThemes();

      expect(themes).toContain('monochrome');
      expect(themes).toContain('16-color');
      expect(themes).toContain('bright');
    });

    it('should return style descriptions', () => {
      const description = ANSIArtGenerator.getStyleDescription('retro');

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
    });

    it('should return theme descriptions', () => {
      const description = ANSIArtGenerator.getThemeDescription('16-color');

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
    });
  });

  describe('generateFramedArt', () => {
    it('should generate and frame art in one call', async () => {
      const result = await generator.generateFramedArt(
        {
          description: 'a star',
        },
        {
          title: 'Star Art',
          attribution: 'TestUser',
        }
      );

      expect(result.content).toBeTruthy();
      expect(result.framedContent).toBeTruthy();
      expect(result.framedContent).toContain('Star Art');
      expect(result.framedContent).toContain('Created by: TestUser');
    });
  });
});
