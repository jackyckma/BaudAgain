/**
 * Art Studio Door Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArtStudioDoor } from './ArtStudioDoor.js';
import type { Session } from '@baudagain/shared';
import { SessionState } from '@baudagain/shared';
import type { ANSIArtGenerator } from '../services/ANSIArtGenerator.js';

describe('ArtStudioDoor', () => {
  let door: ArtStudioDoor;
  let mockArtGenerator: ANSIArtGenerator;
  let session: Session;

  beforeEach(() => {
    // Create mock art generator
    mockArtGenerator = {
      generateFramedArt: vi.fn().mockResolvedValue({
        content: 'Test ASCII art',
        coloredContent: '\x1b[36mTest ASCII art\x1b[0m',
        framedContent: '╔═══╗\n║Art║\n╚═══╝',
        style: 'retro',
        description: 'test',
        width: 60,
        height: 15,
        colorTheme: '16-color',
        timestamp: new Date(),
      }),
    } as any;

    door = new ArtStudioDoor(mockArtGenerator);

    // Create test session
    session = {
      id: 'test-session',
      connectionId: 'test-conn',
      userId: 'test-user',
      handle: 'TestUser',
      state: SessionState.IN_DOOR,
      currentMenu: '',
      lastActivity: new Date(),
      data: {},
    };
  });

  describe('enter', () => {
    it('should display main menu on entry', async () => {
      const output = await door.enter(session);

      expect(output).toContain('ART STUDIO');
      expect(output).toContain('Create New Art');
      expect(output).toContain('View Current Art');
      expect(output).toContain('Help & Tips');
      expect(session.data.door).toBeDefined();
      expect(session.data.door?.gameState).toBeDefined();
    });
  });

  describe('processInput - menu navigation', () => {
    beforeEach(async () => {
      await door.enter(session);
    });

    it('should start art creation when selecting option 1', async () => {
      const output = await door.processInput('1', session);

      expect(output).toContain('DESCRIBE YOUR ART');
      expect(output).toContain('What would you like to create?');
    });

    it('should show help when selecting option 3', async () => {
      const output = await door.processInput('3', session);

      expect(output).toContain('ART STUDIO HELP');
      expect(output).toContain('Tips for best results');
    });

    it('should handle invalid menu selection', async () => {
      const output = await door.processInput('99', session);

      expect(output).toContain('Invalid selection');
      expect(output).toContain('ART STUDIO');
    });
  });

  describe('processInput - art creation flow', () => {
    beforeEach(async () => {
      await door.enter(session);
      // Start art creation
      await door.processInput('1', session);
    });

    it('should accept description and move to style selection', async () => {
      const output = await door.processInput('A dragon breathing fire', session);

      expect(output).toContain('SELECT ART STYLE');
      expect(output).toContain('Retro');
      expect(output).toContain('Cyberpunk');
      expect(output).toContain('Fantasy');
    });

    it('should reject too short description', async () => {
      const output = await door.processInput('ab', session);

      expect(output).toContain('too short');
      expect(output).toContain('DESCRIBE YOUR ART');
    });

    it('should reject too long description', async () => {
      const longDesc = 'a'.repeat(201);
      const output = await door.processInput(longDesc, session);

      expect(output).toContain('too long');
      expect(output).toContain('DESCRIBE YOUR ART');
    });

    it('should allow canceling at description stage', async () => {
      const output = await door.processInput('CANCEL', session);

      expect(output).toContain('Cancelled');
      expect(output).toContain('ART STUDIO');
    });
  });

  describe('processInput - style and theme selection', () => {
    beforeEach(async () => {
      await door.enter(session);
      await door.processInput('1', session);
      await door.processInput('A dragon breathing fire', session);
    });

    it('should accept style selection and move to theme', async () => {
      const output = await door.processInput('1', session); // Retro

      expect(output).toContain('SELECT COLOR THEME');
      expect(output).toContain('Monochrome');
      expect(output).toContain('16-Color');
      expect(output).toContain('Bright');
    });

    it('should handle invalid style selection', async () => {
      const output = await door.processInput('99', session);

      expect(output).toContain('Invalid style');
      expect(output).toContain('SELECT ART STYLE');
    });
  });

  describe('processInput - art generation', () => {
    beforeEach(async () => {
      await door.enter(session);
      await door.processInput('1', session);
      await door.processInput('A dragon breathing fire', session);
      await door.processInput('1', session); // Retro style
    });

    it('should generate art when theme is selected', async () => {
      const output = await door.processInput('2', session); // 16-color theme

      expect(output).toContain('GENERATING ART');
      expect(output).toContain('Art generated successfully');
      expect(mockArtGenerator.generateFramedArt).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'A dragon breathing fire',
          style: 'retro',
          colorTheme: '16-color',
        }),
        expect.any(Object)
      );
    });

    it('should handle art generation error', async () => {
      mockArtGenerator.generateFramedArt = vi.fn().mockRejectedValue(new Error('AI error'));

      const output = await door.processInput('2', session);

      expect(output).toContain('Failed to generate art');
      expect(output).toContain('ART STUDIO');
    });

    it('should enforce rate limiting', async () => {
      // Exhaust rate limit (5 per minute)
      for (let i = 0; i < 5; i++) {
        await door.processInput('2', session);
        // Reset to theme selection for next iteration
        await door.enter(session);
        await door.processInput('1', session);
        await door.processInput('test', session);
        await door.processInput('1', session);
      }

      // This should be rate limited
      const output = await door.processInput('2', session);

      expect(output).toContain('Rate limit reached');
    });
  });

  describe('processInput - art preview', () => {
    beforeEach(async () => {
      await door.enter(session);
      await door.processInput('1', session);
      await door.processInput('A dragon', session);
      await door.processInput('1', session);
      await door.processInput('2', session); // Generate art
    });

    it('should allow viewing generated art from menu', async () => {
      // Return to menu
      await door.processInput('2', session);
      
      // View art
      const output = await door.processInput('2', session);

      expect(output).toContain('╔═══╗');
      expect(output).toContain('Regenerate');
      expect(output).toContain('Return to Menu');
    });

    it('should allow regenerating art', async () => {
      const output = await door.processInput('2', session); // Regenerate

      expect(output).toContain('GENERATING ART');
      expect(mockArtGenerator.generateFramedArt).toHaveBeenCalledTimes(2);
    });

    it('should return to menu from preview', async () => {
      const output = await door.processInput('3', session);

      expect(output).toContain('ART STUDIO');
      expect(output).toContain('Create New Art');
    });
  });

  describe('exit', () => {
    it('should display exit message', async () => {
      await door.enter(session);
      const output = await door.exit(session);

      expect(output).toContain('Thank you for visiting the Art Studio');
    });

    it('should show creation count on exit', async () => {
      await door.enter(session);
      session.data.door = {
        doorId: door.id,
        gameState: {},
        history: [
          { description: 'test1', style: 'retro', theme: 'monochrome', timestamp: new Date().toISOString() },
          { description: 'test2', style: 'fantasy', theme: 'bright', timestamp: new Date().toISOString() },
        ],
      };

      const output = await door.exit(session);

      expect(output).toContain('2 pieces');
    });
  });

  describe('without art generator', () => {
    beforeEach(() => {
      door = new ArtStudioDoor(undefined);
    });

    it('should show error when trying to generate art', async () => {
      await door.enter(session);
      await door.processInput('1', session);
      await door.processInput('A dragon', session);
      await door.processInput('1', session);
      const output = await door.processInput('2', session);

      expect(output).toContain('Art generation is not available');
      expect(output).toContain('AI service not configured');
    });
  });
});
