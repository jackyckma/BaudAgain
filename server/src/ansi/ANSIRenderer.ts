import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { ANSIRenderingService, RenderContext, RENDER_CONTEXTS } from './ANSIRenderingService.js';
import { TERMINAL_WIDTH } from '@baudagain/shared';

export class ANSIRenderer {
  private templates: Map<string, string> = new Map();
  private templateDir: string;
  private renderingService: ANSIRenderingService;

  constructor(templateDir: string = 'data/ansi') {
    // Resolve to absolute path from workspace root (one level up from server dir)
    const workspaceRoot = resolve(process.cwd(), '..');
    this.templateDir = resolve(workspaceRoot, templateDir);
    this.renderingService = new ANSIRenderingService();
  }

  /**
   * Load a template from disk
   */
  private loadTemplate(templateName: string): string {
    const templatePath = join(this.templateDir, templateName);
    
    if (!existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const content = readFileSync(templatePath, 'utf-8');
    this.templates.set(templateName, content);
    return content;
  }

  /**
   * Get a template (from cache or load from disk)
   */
  private getTemplate(templateName: string): string {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }
    return this.loadTemplate(templateName);
  }

  /**
   * Substitute variables in template
   * Variables are in the format {{variable_name}}
   */
  private substituteVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Render a template with variables
   */
  render(templateName: string, variables: Record<string, string> = {}, context: RenderContext = RENDER_CONTEXTS.TERMINAL_80): string {
    // Use frame builder for welcome and goodbye screens
    if (templateName === 'welcome.ans') {
      return this.renderWelcomeScreen(variables, context);
    }
    
    if (templateName === 'goodbye.ans') {
      return this.renderGoodbyeScreen(context);
    }
    
    const template = this.getTemplate(templateName);
    const substituted = this.substituteVariables(template, variables);
    
    return substituted;
  }
  
  /**
   * Render welcome screen using frame builder
   */
  private renderWelcomeScreen(variables: Record<string, string>, context: RenderContext = RENDER_CONTEXTS.TERMINAL_80): string {
    const node = variables.node || '1';
    const maxNodes = variables.max_nodes || '4';
    const callerCount = variables.caller_count || '0';
    const statusText = `Node ${node}/${maxNodes}  │  ${callerCount} callers today`;
    
    // Build a single frame with all content
    const lines = [
      { text: '', align: 'center' as const },
      { text: '████████╗██╗  ██╗███████╗    ██╗  ██╗ █████╗ ██╗   ██╗███╗   ██╗████████╗', align: 'center' as const, color: '\x1b[33m' },
      { text: '╚══██╔══╝██║  ██║██╔════╝    ██║  ██║██╔══██╗██║   ██║████╗  ██║╚══██╔══╝', align: 'center' as const, color: '\x1b[33m' },
      { text: '   ██║   ███████║█████╗      ███████║███████║██║   ██║██╔██╗ ██║   ██║   ', align: 'center' as const, color: '\x1b[33m' },
      { text: '   ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██║██║   ██║██║╚██╗██║   ██║   ', align: 'center' as const, color: '\x1b[33m' },
      { text: '   ██║   ██║  ██║███████╗    ██║  ██║██║  ██║╚██████╔╝██║ ╚████║   ██║   ', align: 'center' as const, color: '\x1b[33m' },
      { text: '   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ', align: 'center' as const, color: '\x1b[33m' },
      { text: '', align: 'center' as const },
      { text: '███████╗██████╗     ████████╗███████╗██████╗ ███╗   ███╗', align: 'center' as const, color: '\x1b[35m' },
      { text: '██╔════╝██╔══██╗    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║', align: 'center' as const, color: '\x1b[35m' },
      { text: '█████╗  ██║  ██║       ██║   █████╗  ██████╔╝██╔████╔██║', align: 'center' as const, color: '\x1b[35m' },
      { text: '██╔══╝  ██║  ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║', align: 'center' as const, color: '\x1b[35m' },
      { text: '███████╗██████╔╝       ██║   ███████╗██║  ██║██║ ╚═╝ ██║', align: 'center' as const, color: '\x1b[35m' },
      { text: '╚══════╝╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝', align: 'center' as const, color: '\x1b[35m' },
      { text: '', align: 'center' as const },
      { text: '', align: 'center' as const },
      { text: '"Where the spirits of the old \'net still whisper..."', align: 'center' as const, color: '\x1b[90m' },
      { text: '', align: 'center' as const },
      { text: statusText, align: 'center' as const, color: '\x1b[36m' },
      { text: '', align: 'center' as const },
    ];
    
    // Use ANSIRenderingService to render the frame
    return this.renderingService.renderFrame(
      lines,
      { width: TERMINAL_WIDTH, style: 'double' },
      context
    );
  }
  
  /**
   * Render goodbye screen using frame builder
   */
  private renderGoodbyeScreen(context: RenderContext = RENDER_CONTEXTS.TERMINAL_80): string {
    const content = [
      { text: '' },
      { text: 'The system is shutting down for maintenance...' },
      { text: '' },
      { text: 'Thank you for calling BaudAgain BBS!' },
      { text: 'We hope to see you again soon.' },
      { text: '' },
      { text: 'Stay retro. Stay connected.' },
      { text: '' },
    ];
    
    // Use ANSIRenderingService to render the frame with title
    return this.renderingService.renderFrameWithTitle(
      'BAUDAGAIN BBS - GOODBYE',
      content,
      { width: TERMINAL_WIDTH, style: 'double' },
      context,
      'cyan'
    );
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templates.clear();
  }

  /**
   * Reload a specific template
   */
  reloadTemplate(templateName: string): void {
    this.templates.delete(templateName);
    this.loadTemplate(templateName);
  }
}
