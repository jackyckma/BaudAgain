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
    return this.substituteVariables(template, variables);
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
