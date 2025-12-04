import { AIProvider, AIOptions } from './AIProvider.js';
import { ConfigLoader, BBSConfig, MessageBaseConfig, DoorConfig } from '../config/ConfigLoader.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * Configuration change preview
 */
export interface ConfigChange {
  description: string;
  preview: string;
  changes: Partial<BBSConfig>;
}

/**
 * Configuration tool definition for AI function calling
 */
interface ConfigTool {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * AI Configuration Assistant
 * 
 * Helps SysOps configure the BBS through natural language conversation.
 * Uses AI with function calling to interpret requests and generate configuration changes.
 */
export class AIConfigAssistant {
  private tools: ConfigTool[];
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    private aiProvider: AIProvider,
    private configLoader: ConfigLoader,
    private logger: FastifyBaseLogger
  ) {
    this.tools = this.defineTools();
  }

  /**
   * Define configuration tools for AI function calling
   */
  private defineTools(): ConfigTool[] {
    return [
      {
        name: 'update_bbs_settings',
        description: 'Update basic BBS settings like name, tagline, sysop name, max nodes, or theme',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'BBS name' },
            tagline: { type: 'string', description: 'BBS tagline' },
            sysopName: { type: 'string', description: 'System operator name' },
            maxNodes: { type: 'number', description: 'Maximum concurrent connections' },
            theme: { type: 'string', description: 'BBS theme' },
          },
          required: [],
        },
      },
      {
        name: 'update_ai_sysop',
        description: 'Update AI SysOp settings including personality, behavior, and chat frequency',
        input_schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable or disable AI SysOp' },
            personality: { type: 'string', description: 'AI SysOp personality description' },
            welcomeNewUsers: { type: 'boolean', description: 'Welcome new users automatically' },
            participateInChat: { type: 'boolean', description: 'Participate in chat' },
            chatFrequency: {
              type: 'string',
              enum: ['always', 'occasional', 'only_when_paged'],
              description: 'How often AI SysOp participates in chat',
            },
          },
          required: [],
        },
      },
      {
        name: 'update_security_settings',
        description: 'Update security settings like password requirements, login attempts, session timeout, and rate limits',
        input_schema: {
          type: 'object',
          properties: {
            passwordMinLength: { type: 'number', description: 'Minimum password length' },
            maxLoginAttempts: { type: 'number', description: 'Maximum login attempts per session' },
            sessionTimeoutMinutes: { type: 'number', description: 'Session timeout in minutes' },
            messagesPerHour: { type: 'number', description: 'Maximum messages per hour per user' },
            doorRequestsPerMinute: { type: 'number', description: 'Maximum door requests per minute per user' },
          },
          required: [],
        },
      },
      {
        name: 'add_message_base',
        description: 'Add a new message base (forum) to the BBS',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Message base name' },
            description: { type: 'string', description: 'Message base description' },
            accessLevelRead: { type: 'number', description: 'Minimum access level to read (0-255)' },
            accessLevelWrite: { type: 'number', description: 'Minimum access level to post (0-255)' },
          },
          required: ['name', 'description'],
        },
      },
      {
        name: 'update_message_base',
        description: 'Update an existing message base',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Message base ID' },
            name: { type: 'string', description: 'New name' },
            description: { type: 'string', description: 'New description' },
            accessLevelRead: { type: 'number', description: 'Minimum access level to read' },
            accessLevelWrite: { type: 'number', description: 'Minimum access level to post' },
          },
          required: ['id'],
        },
      },
      {
        name: 'remove_message_base',
        description: 'Remove a message base from the BBS',
        input_schema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Message base ID to remove' },
          },
          required: ['id'],
        },
      },
    ];
  }

  /**
   * Process a configuration request from the SysOp
   */
  async processRequest(request: string): Promise<{ response: string; change?: ConfigChange }> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: request,
      });

      // Get current configuration for context
      const currentConfig = this.configLoader.getConfig();

      // Create system prompt
      const systemPrompt = this.createSystemPrompt(currentConfig);

      // Call AI with function calling
      const aiResponse = await this.aiProvider.generateCompletion(
        this.buildConversationPrompt(),
        {
          systemPrompt,
          maxTokens: 1000,
          temperature: 0.7,
        }
      );

      // Add AI response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Check if AI wants to use a tool
      const toolCall = this.extractToolCall(aiResponse);
      
      if (toolCall) {
        // Execute the tool and generate preview
        const change = await this.executeToolCall(toolCall.name, toolCall.parameters);
        
        return {
          response: aiResponse,
          change,
        };
      }

      // No tool call, just return the response
      return {
        response: aiResponse,
      };
    } catch (error) {
      this.logger.error({ error }, 'Error processing configuration request');
      throw error;
    }
  }

  /**
   * Create system prompt with current configuration context
   */
  private createSystemPrompt(config: BBSConfig): string {
    return `You are an AI Configuration Assistant for BaudAgain BBS. Your role is to help the SysOp configure their BBS through natural language conversation.

CURRENT CONFIGURATION:
- BBS Name: ${config.bbs.name}
- Tagline: ${config.bbs.tagline}
- SysOp: ${config.bbs.sysopName}
- Max Nodes: ${config.bbs.maxNodes}
- Theme: ${config.bbs.theme}
- AI SysOp Enabled: ${config.ai.sysop.enabled}
- AI SysOp Chat Frequency: ${config.ai.sysop.chatFrequency}
- Password Min Length: ${config.security.passwordMinLength}
- Max Login Attempts: ${config.security.maxLoginAttempts}
- Session Timeout: ${config.security.sessionTimeoutMinutes} minutes
- Message Bases: ${config.messageBases?.length || 0} configured

AVAILABLE TOOLS:
${this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

INSTRUCTIONS:
1. Listen to the SysOp's request and understand what they want to change
2. If the request is clear, use the appropriate tool to make the change
3. If the request is ambiguous, ask clarifying questions
4. Always explain what changes you're about to make before using a tool
5. Be friendly and helpful, using BBS terminology
6. When using a tool, format your response as: "I'll [action]. TOOL_CALL: {name: 'tool_name', parameters: {...}}"

EXAMPLES:
User: "Change the BBS name to Retro Haven"
You: "I'll update the BBS name to 'Retro Haven'. TOOL_CALL: {name: 'update_bbs_settings', parameters: {name: 'Retro Haven'}}"

User: "Make the AI SysOp more active"
You: "I'll set the AI SysOp to participate in chat more frequently. TOOL_CALL: {name: 'update_ai_sysop', parameters: {chatFrequency: 'always'}}"

User: "Add a message base for gaming discussions"
You: "I'll create a new message base called 'Gaming' for gaming discussions. TOOL_CALL: {name: 'add_message_base', parameters: {name: 'Gaming', description: 'Discuss your favorite games', accessLevelRead: 0, accessLevelWrite: 10}}"`;
  }

  /**
   * Build conversation prompt from history
   */
  private buildConversationPrompt(): string {
    return this.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'SysOp' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Extract tool call from AI response
   */
  private extractToolCall(response: string): { name: string; parameters: any } | null {
    // Look for TOOL_CALL: {name: '...', parameters: {...}}
    const match = response.match(/TOOL_CALL:\s*({[^}]+})/);
    if (!match) return null;

    try {
      const toolCall = JSON.parse(match[1]);
      return toolCall;
    } catch (error) {
      this.logger.warn({ error, response }, 'Failed to parse tool call');
      return null;
    }
  }

  /**
   * Execute a tool call and generate preview
   */
  private async executeToolCall(toolName: string, parameters: any): Promise<ConfigChange> {
    const currentConfig = this.configLoader.getConfig();
    const changes: Partial<BBSConfig> = {};

    switch (toolName) {
      case 'update_bbs_settings':
        changes.bbs = { ...currentConfig.bbs, ...parameters };
        return {
          description: 'Update BBS settings',
          preview: this.generatePreview('BBS Settings', currentConfig.bbs, changes.bbs!),
          changes,
        };

      case 'update_ai_sysop':
        changes.ai = {
          ...currentConfig.ai,
          sysop: { ...currentConfig.ai.sysop, ...parameters },
        };
        return {
          description: 'Update AI SysOp settings',
          preview: this.generatePreview('AI SysOp', currentConfig.ai.sysop, changes.ai!.sysop),
          changes,
        };

      case 'update_security_settings':
        const securityChanges: any = { ...currentConfig.security };
        if (parameters.passwordMinLength !== undefined) {
          securityChanges.passwordMinLength = parameters.passwordMinLength;
        }
        if (parameters.maxLoginAttempts !== undefined) {
          securityChanges.maxLoginAttempts = parameters.maxLoginAttempts;
        }
        if (parameters.sessionTimeoutMinutes !== undefined) {
          securityChanges.sessionTimeoutMinutes = parameters.sessionTimeoutMinutes;
        }
        if (parameters.messagesPerHour !== undefined) {
          securityChanges.rateLimit = {
            ...currentConfig.security.rateLimit,
            messagesPerHour: parameters.messagesPerHour,
          };
        }
        if (parameters.doorRequestsPerMinute !== undefined) {
          securityChanges.rateLimit = {
            ...currentConfig.security.rateLimit,
            doorRequestsPerMinute: parameters.doorRequestsPerMinute,
          };
        }
        changes.security = securityChanges;
        return {
          description: 'Update security settings',
          preview: this.generatePreview('Security', currentConfig.security, changes.security!),
          changes,
        };

      case 'add_message_base':
        const newBase: MessageBaseConfig = {
          id: this.generateId(),
          name: parameters.name,
          description: parameters.description,
          accessLevelRead: parameters.accessLevelRead ?? 0,
          accessLevelWrite: parameters.accessLevelWrite ?? 10,
          sortOrder: (currentConfig.messageBases?.length || 0) + 1,
        };
        changes.messageBases = [...(currentConfig.messageBases || []), newBase];
        return {
          description: `Add message base: ${parameters.name}`,
          preview: `New message base:\n  Name: ${newBase.name}\n  Description: ${newBase.description}\n  Read Access: ${newBase.accessLevelRead}\n  Write Access: ${newBase.accessLevelWrite}`,
          changes,
        };

      case 'update_message_base':
        const updatedBases = (currentConfig.messageBases || []).map(base =>
          base.id === parameters.id ? { ...base, ...parameters } : base
        );
        changes.messageBases = updatedBases;
        const updatedBase = updatedBases.find(b => b.id === parameters.id);
        return {
          description: `Update message base: ${updatedBase?.name}`,
          preview: `Updated message base:\n  Name: ${updatedBase?.name}\n  Description: ${updatedBase?.description}\n  Read Access: ${updatedBase?.accessLevelRead}\n  Write Access: ${updatedBase?.accessLevelWrite}`,
          changes,
        };

      case 'remove_message_base':
        const filteredBases = (currentConfig.messageBases || []).filter(
          base => base.id !== parameters.id
        );
        const removedBase = (currentConfig.messageBases || []).find(b => b.id === parameters.id);
        changes.messageBases = filteredBases;
        return {
          description: `Remove message base: ${removedBase?.name}`,
          preview: `Removing message base: ${removedBase?.name}`,
          changes,
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Generate a preview of changes
   */
  private generatePreview(section: string, before: any, after: any): string {
    const lines: string[] = [`${section} Changes:`];
    
    for (const key in after) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        lines.push(`  ${key}: ${JSON.stringify(before[key])} → ${JSON.stringify(after[key])}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Apply configuration changes
   */
  async applyChanges(change: ConfigChange): Promise<{ requiresRestart: boolean; message: string }> {
    try {
      const currentConfig = this.configLoader.getConfig();
      const newConfig = this.mergeConfig(currentConfig, change.changes);
      
      // Save to file
      this.configLoader.save(newConfig);
      
      // Determine if restart is required
      const requiresRestart = this.requiresRestart(change.changes);
      
      const message = requiresRestart
        ? 'Configuration saved. Server restart required for changes to take effect.'
        : 'Configuration saved and applied successfully.';
      
      this.logger.info(
        { change: change.description, requiresRestart },
        'Configuration changes applied'
      );
      
      return { requiresRestart, message };
    } catch (error) {
      this.logger.error({ error }, 'Failed to apply configuration changes');
      throw error;
    }
  }

  /**
   * Determine if configuration changes require a server restart
   */
  private requiresRestart(changes: Partial<BBSConfig>): boolean {
    // Changes that require restart:
    // - AI provider or model changes (requires re-initialization)
    // - Network settings (port changes)
    // - Appearance templates (ANSI file paths)
    
    if (changes.ai?.provider || changes.ai?.model) {
      return true;
    }
    
    if (changes.network) {
      return true;
    }
    
    if (changes.appearance) {
      return true;
    }
    
    // Changes that can be applied without restart:
    // - BBS settings (name, tagline, etc.) - displayed dynamically
    // - AI SysOp settings - can be reloaded
    // - Security settings - applied on next request
    // - Message bases - stored in database
    
    return false;
  }

  /**
   * Merge configuration changes
   */
  private mergeConfig(current: BBSConfig, changes: Partial<BBSConfig>): BBSConfig {
    return {
      ...current,
      ...changes,
      bbs: changes.bbs ? { ...current.bbs, ...changes.bbs } : current.bbs,
      network: changes.network ? { ...current.network, ...changes.network } : current.network,
      ai: changes.ai ? { ...current.ai, ...changes.ai } : current.ai,
      security: changes.security ? { ...current.security, ...changes.security } : current.security,
      appearance: changes.appearance ? { ...current.appearance, ...changes.appearance } : current.appearance,
      messageBases: changes.messageBases !== undefined ? changes.messageBases : current.messageBases,
      doors: changes.doors !== undefined ? changes.doors : current.doors,
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }
}
