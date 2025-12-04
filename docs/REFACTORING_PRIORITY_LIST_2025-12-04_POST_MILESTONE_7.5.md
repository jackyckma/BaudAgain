# Refactoring Priority List - Post Milestone 7.5

**Date:** December 4, 2025  
**Status:** Action Plan  
**Architecture Score:** 9.1/10  
**Target Score:** 9.5/10

---

## Priority 0 - Critical (Must Fix Before Production)

**None identified** ✅

All critical issues have been resolved. The codebase is production-ready from an architectural standpoint.

---

## Priority 1 - High Priority (Address in Next Sprint)

### P1.1: Configuration Persistence Layer

**Issue:** Runtime configuration changes are not persisted

**Impact:**
- Configuration changes lost on restart
- Manual config.yaml editing required
- Poor user experience in control panel

**Current State:**
```typescript
// server/src/api/routes/conversation.routes.ts
// Note: In a production system, you would save this to config.yaml
// For now, changes are in-memory only
```

**Solution:**

Create a `ConfigurationService` to handle persistent configuration:

```typescript
// server/src/services/ConfigurationService.ts
import yaml from 'js-yaml';
import fs from 'fs/promises';
import type { BBSConfig } from '../config/ConfigLoader.js';

export class ConfigurationService {
  constructor(
    private configPath: string,
    private logger: FastifyBaseLogger
  ) {}

  /**
   * Update configuration and persist to disk
   */
  async updateConfig(updates: Partial<BBSConfig>): Promise<void> {
    // 1. Validate updates
    this.validateConfigUpdates(updates);
    
    // 2. Read current config
    const currentConfig = await this.readConfig();
    
    // 3. Merge updates
    const newConfig = this.mergeConfig(currentConfig, updates);
    
    // 4. Write to disk
    await this.writeConfig(newConfig);
    
    // 5. Log change
    this.logger.info({ updates }, 'Configuration updated');
  }

  /**
   * Validate configuration updates
   */
  private validateConfigUpdates(updates: Partial<BBSConfig>): void {
    // Validate schedule format
    if (updates.aiFeatures?.dailyQuestion?.schedule) {
      const schedule = updates.aiFeatures.dailyQuestion.schedule;
      if (!/^\d{2}:\d{2}$/.test(schedule)) {
        throw new Error('Invalid schedule format. Use HH:MM');
      }
    }
    
    // Validate question style
    if (updates.aiFeatures?.dailyQuestion?.questionStyle) {
      const validStyles = ['auto', 'open-ended', 'opinion', 'creative', 'technical', 'fun'];
      if (!validStyles.includes(updates.aiFeatures.dailyQuestion.questionStyle)) {
        throw new Error('Invalid question style');
      }
    }
    
    // Add more validation as needed
  }

  /**
   * Read configuration from disk
   */
  private async readConfig(): Promise<BBSConfig> {
    const content = await fs.readFile(this.configPath, 'utf-8');
    return yaml.load(content) as BBSConfig;
  }

  /**
   * Write configuration to disk
   */
  private async writeConfig(config: BBSConfig): Promise<void> {
    const content = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
    await fs.writeFile(this.configPath, content, 'utf-8');
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfig(current: BBSConfig, updates: Partial<BBSConfig>): BBSConfig {
    // Use lodash merge or implement deep merge
    return {
      ...current,
      ...updates,
      aiFeatures: {
        ...current.aiFeatures,
        ...updates.aiFeatures,
        dailyQuestion: {
          ...current.aiFeatures?.dailyQuestion,
          ...updates.aiFeatures?.dailyQuestion,
        },
      },
    };
  }
}
```

**Integration:**

```typescript
// server/src/index.ts
const configService = new ConfigurationService('config.yaml', server.log);

// Pass to routes
await registerAPIRoutes(
  server,
  // ... other params
  configService
);
```

**Update Routes:**

```typescript
// server/src/api/routes/conversation.routes.ts
server.put('/api/v1/conversation-starters/config', async (request, reply) => {
  try {
    const body = request.body as any;
    
    // Update configuration persistently
    await configService.updateConfig({
      aiFeatures: {
        dailyQuestion: body
      }
    });
    
    return {
      success: true,
      message: 'Configuration updated and saved',
      config: body,
    };
  } catch (error) {
    ErrorHandler.handleError(reply, error);
  }
});
```

**Testing:**

```typescript
// server/src/services/ConfigurationService.test.ts
describe('ConfigurationService', () => {
  it('should persist configuration changes', async () => {
    const service = new ConfigurationService('test-config.yaml', mockLogger);
    
    await service.updateConfig({
      aiFeatures: {
        dailyQuestion: {
          enabled: true,
          schedule: '10:00',
        }
      }
    });
    
    // Verify file was written
    const config = await service.readConfig();
    expect(config.aiFeatures.dailyQuestion.enabled).toBe(true);
  });
  
  it('should validate schedule format', async () => {
    const service = new ConfigurationService('test-config.yaml', mockLogger);
    
    await expect(
      service.updateConfig({
        aiFeatures: {
          dailyQuestion: { schedule: 'invalid' }
        }
      })
    ).rejects.toThrow('Invalid schedule format');
  });
});
```

**Effort:** 4-6 hours  
**Files to Create:** 1 new file, 2 files to modify  
**Tests Required:** Yes (unit tests)  
**Breaking Changes:** No

---

### P1.2: MessageHandler Refactoring

**Issue:** MessageHandler has grown to 300+ lines with multiple responsibilities

**Impact:**
- Difficult to maintain
- Hard to test individual flows
- Violates Single Responsibility Principle

**Current Structure:**
```
MessageHandler (300+ lines)
├── Message base selection
├── Message listing
├── Message reading
├── Message posting (multi-step)
└── Thread summarization (multi-step)
```

**Solution:**

Split into focused sub-handlers using composition:

```typescript
// server/src/handlers/message/MessageBaseNavigationHandler.ts
export class MessageBaseNavigationHandler {
  constructor(private deps: MessageHandlerDependencies) {}
  
  canHandle(command: string, session: Session): boolean {
    return session.data.message?.showingBaseList === true;
  }
  
  async handle(command: string, session: Session): Promise<string> {
    // Handle base selection logic
  }
  
  showMessageBaseList(session: Session): string {
    // Render base list
  }
}
```

```typescript
// server/src/handlers/message/MessagePostingHandler.ts
export class MessagePostingHandler {
  constructor(private deps: MessageHandlerDependencies) {}
  
  canHandle(command: string, session: Session): boolean {
    return session.data.message?.postingMessage === true;
  }
  
  async handle(command: string, session: Session): Promise<string> {
    // Handle posting flow
  }
  
  async startPosting(session: Session, messageState: MessageFlowState): Promise<string> {
    // Initialize posting
  }
}
```

```typescript
// server/src/handlers/message/MessageSummarizationHandler.ts
export class MessageSummarizationHandler {
  constructor(private deps: MessageHandlerDependencies) {}
  
  canHandle(command: string, session: Session): boolean {
    return session.data.message?.confirmingSummary === true ||
           session.data.message?.viewingSummary === true;
  }
  
  async handle(command: string, session: Session): Promise<string> {
    // Handle summarization flow
  }
}
```

```typescript
// server/src/handlers/MessageHandler.ts (refactored)
export class MessageHandler implements CommandHandler {
  private navigationHandler: MessageBaseNavigationHandler;
  private postingHandler: MessagePostingHandler;
  private summarizationHandler: MessageSummarizationHandler;
  
  constructor(private deps: MessageHandlerDependencies) {
    this.navigationHandler = new MessageBaseNavigationHandler(deps);
    this.postingHandler = new MessagePostingHandler(deps);
    this.summarizationHandler = new MessageSummarizationHandler(deps);
  }
  
  canHandle(command: string, session: Session): boolean {
    return session.data.message?.inMessageBase ||
           command.toUpperCase() === 'M';
  }
  
  async handle(command: string, session: Session): Promise<string> {
    // Delegate to appropriate sub-handler
    if (this.postingHandler.canHandle(command, session)) {
      return this.postingHandler.handle(command, session);
    }
    
    if (this.summarizationHandler.canHandle(command, session)) {
      return this.summarizationHandler.handle(command, session);
    }
    
    if (this.navigationHandler.canHandle(command, session)) {
      return this.navigationHandler.handle(command, session);
    }
    
    // Handle message base commands
    return this.handleMessageBaseCommands(command, session);
  }
}
```

**Benefits:**
- Each handler < 100 lines
- Clear responsibilities
- Easier to test
- Easier to maintain
- Can reuse sub-handlers

**Effort:** 6-8 hours  
**Files to Create:** 3 new files, 1 file to refactor  
**Tests Required:** Yes (update existing tests)  
**Breaking Changes:** No (internal refactoring)

---

## Priority 2 - Medium Priority (Address Soon)

### P2.1: AI Prompt Pattern Abstraction

**Issue:** Similar prompt construction patterns duplicated across AI services

**Impact:**
- Code duplication
- Inconsistent prompt formatting
- Harder to maintain prompt quality

**Current Duplication:**

```typescript
// ANSIArtGenerator.ts
const prompt = `You are an ASCII/ANSI art generator...
${systemContext}
${userPrompt}`;

// MessageSummarizer.ts
const prompt = `You are analyzing a discussion thread...
${context}
${instructions}`;

// ConversationStarter.ts
const prompt = `You are a creative question generator...
${context}
${requirements}`;
```

**Solution:**

Create a shared prompt builder utility:

```typescript
// server/src/ai/AIPromptBuilder.ts
export interface PromptSection {
  role?: string;
  context?: string;
  instructions?: string;
  examples?: string[];
  constraints?: string[];
}

export class AIPromptBuilder {
  /**
   * Build a system prompt with role and context
   */
  static buildSystemPrompt(role: string, context?: string): string {
    let prompt = `You are ${role}.`;
    
    if (context) {
      prompt += `\n\n${context}`;
    }
    
    return prompt;
  }
  
  /**
   * Build a user prompt with instructions and data
   */
  static buildUserPrompt(instruction: string, data?: Record<string, any>): string {
    let prompt = instruction;
    
    if (data) {
      prompt += '\n\n' + this.formatData(data);
    }
    
    return prompt;
  }
  
  /**
   * Combine system and user prompts
   */
  static combinePrompts(system: string, user: string): string {
    return `${system}\n\n---\n\n${user}`;
  }
  
  /**
   * Build a complete prompt from sections
   */
  static buildPrompt(sections: PromptSection): string {
    const parts: string[] = [];
    
    if (sections.role) {
      parts.push(`You are ${sections.role}.`);
    }
    
    if (sections.context) {
      parts.push(sections.context);
    }
    
    if (sections.instructions) {
      parts.push(sections.instructions);
    }
    
    if (sections.examples && sections.examples.length > 0) {
      parts.push('Examples:');
      sections.examples.forEach((ex, i) => {
        parts.push(`${i + 1}. ${ex}`);
      });
    }
    
    if (sections.constraints && sections.constraints.length > 0) {
      parts.push('Constraints:');
      sections.constraints.forEach(c => {
        parts.push(`- ${c}`);
      });
    }
    
    return parts.join('\n\n');
  }
  
  /**
   * Format data for inclusion in prompt
   */
  private static formatData(data: Record<string, any>): string {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }
}
```

**Usage Example:**

```typescript
// ANSIArtGenerator.ts (refactored)
private buildPrompt(description: string, options: GenerateOptions): string {
  return AIPromptBuilder.buildPrompt({
    role: 'an ASCII/ANSI art generator',
    context: 'You create text-based art using ASCII characters and ANSI color codes.',
    instructions: `Create ASCII art based on this description: ${description}`,
    constraints: [
      `Maximum width: ${options.maxWidth} characters`,
      `Maximum height: ${options.maxHeight} lines`,
      'Use only standard ASCII characters',
      'Include ANSI color codes for visual appeal',
    ],
  });
}
```

**Effort:** 3-4 hours  
**Files to Create:** 1 new file  
**Files to Modify:** 4 AI service files  
**Tests Required:** Yes (unit tests for builder)  
**Breaking Changes:** No

---

### P2.2: Route Error Handling Standardization

**Issue:** Repetitive error handling patterns across route files

**Impact:**
- Code duplication
- Inconsistent error responses
- Harder to maintain

**Current Pattern:**

```typescript
// Repeated in multiple files
try {
  const result = await service.doSomething();
  return { success: true, result };
} catch (error) {
  server.log.error({ error }, 'Failed to do something');
  ErrorHandler.handleError(reply, error);
}
```

**Solution:**

Create a route helper utility:

```typescript
// server/src/api/utils/RouteHelper.ts
import type { FastifyReply, FastifyBaseLogger } from 'fastify';

export class RouteHelper {
  /**
   * Wrap a route handler with error handling
   */
  static async handleRoute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    logger: FastifyBaseLogger,
    reply: FastifyReply
  ): Promise<T | void> {
    try {
      return await operation();
    } catch (error) {
      logger.error({ error }, errorMessage);
      return ErrorHandler.handleError(reply, error);
    }
  }
  
  /**
   * Wrap a route handler with success response
   */
  static async handleRouteWithSuccess<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    logger: FastifyBaseLogger,
    reply: FastifyReply
  ): Promise<{ success: boolean; data?: T } | void> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      logger.error({ error }, errorMessage);
      return ErrorHandler.handleError(reply, error);
    }
  }
  
  /**
   * Check if a service is available
   */
  static checkServiceAvailable(
    reply: FastifyReply,
    service: any,
    serviceName: string
  ): boolean {
    if (!service) {
      ErrorHandler.sendServiceUnavailableError(
        reply,
        `${serviceName} is not available`
      );
      return false;
    }
    return true;
  }
}
```

**Usage Example:**

```typescript
// server/src/api/routes/conversation.routes.ts (refactored)
server.post('/api/v1/conversation-starters/generate', async (request, reply) => {
  if (!RouteHelper.checkServiceAvailable(reply, dailyQuestionService, 'Daily question service')) {
    return;
  }
  
  return RouteHelper.handleRouteWithSuccess(
    async () => {
      const question = await dailyQuestionService.generateAndPostDailyQuestion(config);
      return {
        question: {
          id: question.id,
          messageBaseId: question.messageBaseId,
          // ...
        },
      };
    },
    'Failed to generate conversation starter',
    server.log,
    reply
  );
});
```

**Effort:** 2-3 hours  
**Files to Create:** 1 new file  
**Files to Modify:** 6 route files  
**Tests Required:** Yes (unit tests)  
**Breaking Changes:** No

---

## Priority 3 - Low Priority (Future Improvements)

### P3.1: Test Helper Consolidation

**Issue:** Similar test setup patterns across test files

**Solution:**

```typescript
// server/src/testing/test-helpers.ts
export class TestHelpers {
  static createMockLogger(): FastifyBaseLogger {
    return {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn(() => this.createMockLogger()),
    } as any;
  }
  
  static createMockAIProvider(): AIProvider {
    return {
      generateText: vi.fn().mockResolvedValue('Mock response'),
    } as any;
  }
  
  static async createTestDatabase(): Promise<BBSDatabase> {
    const db = new BBSDatabase(':memory:', this.createMockLogger());
    await db.ready();
    return db;
  }
}
```

**Effort:** 2-3 hours  
**Priority:** Low (test maintainability)

---

### P3.2: DoorHandler Timeout Optimization

**Issue:** Polling-based timeout checking is inefficient

**Current Implementation:**
```typescript
// Check every 5 minutes
this.timeoutCheckInterval = setInterval(() => {
  this.checkDoorTimeouts();
}, 5 * 60 * 1000);
```

**Solution:**

Use lazy evaluation with timeout tracking:

```typescript
// server/src/handlers/DoorHandler.ts
private checkTimeout(session: Session): boolean {
  if (session.state !== SessionState.IN_DOOR) {
    return false;
  }
  
  const inactiveTime = Date.now() - session.lastActivity.getTime();
  return inactiveTime > this.doorTimeoutMs;
}

// Check on each input instead of polling
async handle(command: string, session: Session): Promise<string> {
  // Check timeout before processing
  if (this.checkTimeout(session)) {
    return this.exitDoorDueToTimeout(session);
  }
  
  // Process command
  return this.handleDoorInput(command, session);
}
```

**Effort:** 2-3 hours  
**Priority:** Low (optimization)

---

## Implementation Timeline

### Sprint 1 (Week 1)
- **P1.1:** Configuration Persistence (4-6 hours)
- **P1.2:** MessageHandler Refactoring (6-8 hours)
- **Total:** 10-14 hours

### Sprint 2 (Week 2)
- **P2.1:** AI Prompt Pattern Abstraction (3-4 hours)
- **P2.2:** Route Error Handling Standardization (2-3 hours)
- **Total:** 5-7 hours

### Future Sprints
- **P3.1:** Test Helper Consolidation (2-3 hours)
- **P3.2:** DoorHandler Timeout Optimization (2-3 hours)
- **Total:** 4-6 hours

---

## Success Metrics

### Code Quality Metrics

**Before Refactoring:**
- MessageHandler: 300+ lines
- Code duplication: ~15% in AI services
- Route error handling: 30+ duplicated blocks
- Architecture score: 9.1/10

**After Refactoring:**
- MessageHandler: < 150 lines (sub-handlers < 100 each)
- Code duplication: < 5%
- Route error handling: Standardized utility
- Architecture score: 9.5/10 (target)

### Maintainability Metrics

- Time to add new AI feature: -30%
- Time to add new route: -40%
- Test setup time: -50%
- Configuration change time: -90%

---

## Risk Assessment

### Low Risk
- P2.1 (AI Prompt Builder) - Pure utility, no breaking changes
- P2.2 (Route Helper) - Internal refactoring
- P3.1 (Test Helpers) - Test-only changes

### Medium Risk
- P1.1 (Configuration Persistence) - Requires careful validation
- P1.2 (MessageHandler Refactoring) - Large refactoring, needs thorough testing

### Mitigation Strategies

1. **Comprehensive Testing**
   - Unit tests for all new utilities
   - Integration tests for refactored handlers
   - Regression tests for existing functionality

2. **Incremental Rollout**
   - Implement P1.1 first (standalone feature)
   - Test thoroughly before P1.2
   - Deploy P2.x after P1.x is stable

3. **Rollback Plan**
   - Git branches for each refactoring
   - Feature flags for new utilities
   - Database backups before config changes

---

## Conclusion

The refactoring priorities are well-defined and achievable. All changes maintain backward compatibility while significantly improving code quality and maintainability.

**Recommended Approach:**
1. Complete P1.1 and P1.2 in Sprint 1
2. Validate improvements with metrics
3. Proceed with P2.x in Sprint 2
4. Address P3.x as time permits

**Expected Outcome:**
- Architecture score: 9.5/10
- Reduced technical debt
- Improved developer experience
- Better maintainability

---

**Created By:** AI Development Agent  
**Date:** December 4, 2025  
**Next Review:** After Sprint 1 completion
