import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

export class ANSIRenderer {
  private templates: Map<string, string> = new Map();
  private templateDir: string;

  constructor(templateDir: string = 'data/ansi') {
    // Resolve to absolute path from workspace root (one level up from server dir)
    const workspaceRoot = resolve(process.cwd(), '..');
    this.templateDir = resolve(workspaceRoot, templateDir);
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
  render(templateName: string, variables: Record<string, string> = {}): string {
    const template = this.getTemplate(templateName);
    const substituted = this.substituteVariables(template, variables);
    
    // Add color codes for welcome screen
    if (templateName === 'welcome.ans') {
      return this.colorizeWelcomeScreen(substituted);
    }
    
    return substituted;
  }

  /**
   * Add ANSI color codes to welcome screen
   */
  private colorizeWelcomeScreen(content: string): string {
    const lines = content.split('\n');
    const colored: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Box borders in cyan
      if (line.includes('╔') || line.includes('╚') || line.includes('╠')) {
        colored.push(`\x1b[36m${line}\x1b[0m`);
      }
      // Title lines (THE HAUNTED) in yellow/bright yellow
      else if (i >= 2 && i <= 8) {
        colored.push(`\x1b[33m${line}\x1b[0m`);
      }
      // Subtitle (TERMINAL) in magenta/bright magenta
      else if (i >= 10 && i <= 15) {
        colored.push(`\x1b[35m${line}\x1b[0m`);
      }
      // Tagline in gray
      else if (line.includes('spirits')) {
        colored.push(`\x1b[90m${line}\x1b[0m`);
      }
      // Status line with mixed colors
      else if (line.includes('Node') && line.includes('callers')) {
        colored.push(`\x1b[36m${line}\x1b[0m`);
      }
      // Default
      else {
        colored.push(line);
      }
    }
    
    return colored.join('\r\n');
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
