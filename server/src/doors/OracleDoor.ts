/**
 * The Oracle Door Game
 * 
 * An AI-powered mystical fortune teller that responds to user questions
 * with cryptic, mystical wisdom.
 */

import type { Door } from './Door.js';
import type { Session } from '@baudagain/shared';
import type { AIService } from '../ai/AIService.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { sanitizeInput } from '../utils/ValidationUtils.js';

export class OracleDoor implements Door {
  id = 'oracle';
  name = 'The Oracle';
  description = 'Seek wisdom from the mystical Oracle';
  private rateLimiter: RateLimiter;
  
  constructor(private aiService?: AIService) {
    // 10 requests per minute per user
    this.rateLimiter = new RateLimiter(10, 60000);
  }
  
  /**
   * Enter The Oracle's chamber
   */
  async enter(session: Session): Promise<string> {
    // Check if this is a resumed session
    const isResuming = session.data.door?.history && session.data.door.history.length > 0;
    
    let output = '\r\n';
    output += '╔═══════════════════════════════════════════════════════╗\r\n';
    output += '║              🔮 THE ORACLE 🔮                         ║\r\n';
    output += '╠═══════════════════════════════════════════════════════╣\r\n';
    
    if (isResuming) {
      output += '║  You return to the dimly lit chamber...              ║\r\n';
      output += '║  The Oracle remembers you.                           ║\r\n';
    } else {
      output += '║  You enter a dimly lit chamber. Incense fills the    ║\r\n';
      output += '║  air. A mysterious figure sits before a crystal ball.║\r\n';
    }
    
    output += '║                                                       ║\r\n';
    output += '║  \x1b[35m"Ask, and you shall receive wisdom..."\x1b[0m              ║\r\n';
    output += '╚═══════════════════════════════════════════════════════╝\r\n';
    output += '\r\n';
    
    // Show recent history if resuming
    if (isResuming && session.data.door?.history) {
      const recentHistory = session.data.door.history.slice(-3);  // Last 3 exchanges
      output += '\x1b[2m[Recent exchanges:]\x1b[0m\r\n';
      for (const exchange of recentHistory) {
        output += `\x1b[2mYou: ${exchange.question}\x1b[0m\r\n`;
        output += `\x1b[2mOracle: ${exchange.response}\x1b[0m\r\n`;
      }
      output += '\r\n';
    }
    
    output += 'Enter your question (or type \x1b[33mQ\x1b[0m to leave): ';
    
    return output;
  }
  
  /**
   * Process user input
   */
  async processInput(input: string, session: Session): Promise<string> {
    // Sanitize and trim input
    const sanitizedInput = sanitizeInput(input);
    
    // Empty input
    if (!sanitizedInput) {
      return '\r\n\x1b[35m"Speak your question clearly..."\x1b[0m\r\n\r\n' +
             'Enter your question (or type \x1b[33mQ\x1b[0m to leave): ';
    }
    
    // Check rate limit
    if (session.userId && !this.rateLimiter.isAllowed(session.userId)) {
      const resetTime = this.rateLimiter.getResetTime(session.userId);
      return '\r\n\x1b[35m🔮 "The spirits grow weary... Return in ' + resetTime + ' seconds."\x1b[0m\r\n\r\n' +
             'Enter your question (or type \x1b[33mQ\x1b[0m to leave): ';
    }
    
    // Generate Oracle response
    let response: string;
    
    if (!this.aiService) {
      // Fallback if AI is not available
      response = '🔮 The mists cloud my vision... The spirits are silent today.';
    } else {
      try {
        // Show thinking message
        const thinking = '\r\n\x1b[35m🔮 The Oracle gazes into the crystal ball...\x1b[0m\r\n\r\n';
        
        // Generate mystical response
        const prompt = `You are a mystical oracle, a fortune teller with ancient wisdom. 
A seeker asks: "${sanitizedInput}"

Respond in a cryptic, mystical tone. Use mystical symbols (🔮, ✨, 🌙, ⭐) and be dramatic.
Keep your response under 150 characters. Be mysterious and profound.`;
        
        response = await this.aiService.generateCompletion(prompt, {
          maxTokens: 150,
          temperature: 0.9  // Higher temperature for more creative/mystical responses
        });
        
        // Ensure response starts with a mystical symbol if it doesn't have one
        if (!response.match(/^[🔮✨🌙⭐]/)) {
          response = '🔮 ' + response;
        }
        
        // Enforce 150 character limit
        if (response.length > 150) {
          response = response.substring(0, 147) + '...';
        }
        
        // Store in history
        if (!session.data.door) {
          session.data.door = { doorId: this.id, gameState: {}, history: [] };
        }
        if (!session.data.door.history) {
          session.data.door.history = [];
        }
        
        session.data.door.history.push({
          question: sanitizedInput,
          response: response,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 exchanges
        if (session.data.door.history.length > 10) {
          session.data.door.history = session.data.door.history.slice(-10);
        }
        
        return thinking + 
               `\x1b[35m${response}\x1b[0m\r\n\r\n` +
               'Enter your question (or type \x1b[33mQ\x1b[0m to leave): ';
        
      } catch (error) {
        console.error('Error generating Oracle response:', error);
        response = '🔮 The spirits are restless... Try again, seeker.';
        
        return '\r\n' +
               `\x1b[35m${response}\x1b[0m\r\n\r\n` +
               'Enter your question (or type \x1b[33mQ\x1b[0m to leave): ';
      }
    }
    
    return '\r\n' +
           `\x1b[35m${response}\x1b[0m\r\n\r\n` +
           'Enter your question (or type \x1b[33mQ\x1b[0m to leave): ';
  }
  
  /**
   * Exit The Oracle's chamber
   */
  async exit(session: Session): Promise<string> {
    const questionCount = session.data.door?.history?.length || 0;
    
    let output = '\r\n';
    output += '\x1b[35m🔮 "The Oracle bids you farewell, seeker..."\x1b[0m\r\n';
    output += '\x1b[35m   "May the wisdom you gained light your path."\x1b[0m\r\n';
    output += '\r\n';
    
    if (questionCount > 0) {
      output += `\x1b[2m[You asked ${questionCount} question${questionCount === 1 ? '' : 's'}]\x1b[0m\r\n`;
    }
    
    output += '\r\n';
    
    return output;
  }
}
