import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

/**
 * BBS Configuration Structure
 */
export interface BBSConfig {
  bbs: {
    name: string;
    tagline: string;
    sysopName: string;
    maxNodes: number;
    defaultAccessLevel: number;
    theme: string;
  };
  network: {
    websocketPort: number;
  };
  ai: {
    provider: 'anthropic' | 'openai' | 'ollama';
    model: string;
    sysop: {
      enabled: boolean;
      personality: string;
      welcomeNewUsers: boolean;
      participateInChat: boolean;
      chatFrequency: 'always' | 'occasional' | 'only_when_paged';
    };
    doors: {
      enabled: boolean;
      maxTokensPerTurn: number;
    };
  };
  security: {
    passwordMinLength: number;
    maxLoginAttempts: number;
    sessionTimeoutMinutes: number;
    rateLimit: {
      messagesPerHour: number;
      doorRequestsPerMinute: number;
    };
  };
  appearance: {
    welcomeScreen: string;
    goodbyeScreen: string;
    menuTemplate: string;
  };
  messageBases: MessageBaseConfig[];
  doors: DoorConfig[];
}

export interface MessageBaseConfig {
  id: string;
  name: string;
  description: string;
  accessLevelRead: number;
  accessLevelWrite: number;
  sortOrder: number;
}

export interface DoorConfig {
  id: string;
  name: string;
  description: string;
  minAccessLevel: number;
  enabled: boolean;
}

/**
 * Configuration Loader
 * 
 * Loads and validates BBS configuration from config.yaml
 * Merges with environment variables where appropriate
 */
export class ConfigLoader {
  private config: BBSConfig | null = null;
  private configPath: string;

  constructor(configPath: string = 'config.yaml') {
    // Resolve path relative to project root
    // If running from server directory, go up one level
    const projectRoot = process.cwd().endsWith('/server') 
      ? path.resolve(process.cwd(), '..')
      : process.cwd();
    this.configPath = path.resolve(projectRoot, configPath);
  }

  /**
   * Load configuration from file
   */
  load(): BBSConfig {
    try {
      // Read and parse YAML file
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(fileContents) as BBSConfig;

      // Validate configuration
      this.validate();

      // Merge with environment variables
      this.mergeEnvironment();

      return this.config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get current configuration (loads if not already loaded)
   */
  getConfig(): BBSConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  /**
   * Reload configuration from file
   */
  reload(): BBSConfig {
    this.config = null;
    return this.load();
  }

  /**
   * Validate configuration structure
   */
  private validate(): void {
    if (!this.config) {
      throw new Error('Configuration is null');
    }

    // Validate required sections
    if (!this.config.bbs) {
      throw new Error('Missing required section: bbs');
    }
    if (!this.config.network) {
      throw new Error('Missing required section: network');
    }
    if (!this.config.ai) {
      throw new Error('Missing required section: ai');
    }
    if (!this.config.security) {
      throw new Error('Missing required section: security');
    }

    // Validate AI provider
    const validProviders = ['anthropic', 'openai', 'ollama'];
    if (!validProviders.includes(this.config.ai.provider)) {
      throw new Error(`Invalid AI provider: ${this.config.ai.provider}`);
    }

    // Validate port
    if (this.config.network.websocketPort < 1 || this.config.network.websocketPort > 65535) {
      throw new Error('Invalid websocket port number');
    }

    // Validate security settings
    if (this.config.security.passwordMinLength < 1) {
      throw new Error('Password minimum length must be at least 1');
    }
    if (this.config.security.maxLoginAttempts < 1) {
      throw new Error('Max login attempts must be at least 1');
    }
  }

  /**
   * Merge environment variables into configuration
   */
  private mergeEnvironment(): void {
    if (!this.config) return;

    // Override port from environment
    if (process.env.PORT) {
      const port = parseInt(process.env.PORT);
      if (!isNaN(port)) {
        this.config.network.websocketPort = port;
      }
    }

    // Override AI model from environment
    if (process.env.AI_MODEL) {
      this.config.ai.model = process.env.AI_MODEL;
    }

    // Override AI provider from environment
    if (process.env.AI_PROVIDER) {
      const provider = process.env.AI_PROVIDER as BBSConfig['ai']['provider'];
      if (['anthropic', 'openai', 'ollama'].includes(provider)) {
        this.config.ai.provider = provider;
      }
    }
  }

  /**
   * Get AI API key from environment
   */
  getAIApiKey(): string {
    const provider = this.config?.ai.provider || 'anthropic';

    switch (provider) {
      case 'anthropic':
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
        return anthropicKey;

      case 'openai':
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
          throw new Error('OPENAI_API_KEY environment variable is required');
        }
        return openaiKey;

      case 'ollama':
        // Ollama typically runs locally and doesn't need an API key
        return '';

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  /**
   * Save configuration to file
   */
  save(config: BBSConfig): void {
    try {
      const yamlStr = yaml.dump(config, {
        indent: 2,
        lineWidth: 100,
        noRefs: true,
      });
      fs.writeFileSync(this.configPath, yamlStr, 'utf8');
      this.config = config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save configuration: ${error.message}`);
      }
      throw error;
    }
  }
}

// Singleton instance
let configLoader: ConfigLoader | null = null;

/**
 * Get the global configuration loader instance
 */
export function getConfigLoader(): ConfigLoader {
  if (!configLoader) {
    configLoader = new ConfigLoader();
  }
  return configLoader;
}

/**
 * Get the current configuration
 */
export function getConfig(): BBSConfig {
  return getConfigLoader().getConfig();
}
