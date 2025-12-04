/**
 * Scheduled Task Service
 * 
 * Manages scheduled tasks like daily question generation.
 * Provides a simple scheduling mechanism without external dependencies.
 */

import type { FastifyBaseLogger } from 'fastify';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron-like format: "HH:MM" for daily tasks
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  handler: () => Promise<void>;
}

export interface ScheduledTaskConfig {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  handler: () => Promise<void>;
}

export class ScheduledTaskService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute

  constructor(private logger: FastifyBaseLogger) {}

  /**
   * Register a scheduled task
   */
  registerTask(config: ScheduledTaskConfig): void {
    const task: ScheduledTask = {
      ...config,
      nextRun: this.calculateNextRun(config.schedule),
    };

    this.tasks.set(task.id, task);
    this.logger.info(
      { taskId: task.id, taskName: task.name, schedule: task.schedule },
      'Scheduled task registered'
    );

    if (task.enabled) {
      this.startTask(task.id);
    }
  }

  /**
   * Unregister a scheduled task
   */
  unregisterTask(taskId: string): void {
    this.stopTask(taskId);
    this.tasks.delete(taskId);
    this.logger.info({ taskId }, 'Scheduled task unregistered');
  }

  /**
   * Start a task (begin checking for execution)
   */
  startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logger.warn({ taskId }, 'Cannot start task: not found');
      return;
    }

    if (this.intervals.has(taskId)) {
      this.logger.debug({ taskId }, 'Task already running');
      return;
    }

    // Check immediately if task should run
    this.checkAndRunTask(task);

    // Set up interval to check periodically
    const interval = setInterval(() => {
      this.checkAndRunTask(task);
    }, this.CHECK_INTERVAL_MS);

    this.intervals.set(taskId, interval);
    this.logger.info({ taskId, taskName: task.name }, 'Scheduled task started');
  }

  /**
   * Stop a task
   */
  stopTask(taskId: string): void {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
      this.logger.info({ taskId }, 'Scheduled task stopped');
    }
  }

  /**
   * Enable a task
   */
  enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      this.startTask(taskId);
      this.logger.info({ taskId }, 'Scheduled task enabled');
    }
  }

  /**
   * Disable a task
   */
  disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.stopTask(taskId);
      this.logger.info({ taskId }, 'Scheduled task disabled');
    }
  }

  /**
   * Manually trigger a task
   */
  async triggerTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    this.logger.info({ taskId, taskName: task.name }, 'Manually triggering task');
    await this.executeTask(task);
  }

  /**
   * Get all registered tasks
   */
  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get a specific task
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Check if a task should run and execute it
   */
  private async checkAndRunTask(task: ScheduledTask): Promise<void> {
    if (!task.enabled) {
      return;
    }

    const now = new Date();
    
    // Check if it's time to run
    if (task.nextRun && now >= task.nextRun) {
      await this.executeTask(task);
    }
  }

  /**
   * Execute a task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    this.logger.info({ taskId: task.id, taskName: task.name }, 'Executing scheduled task');

    try {
      task.lastRun = new Date();
      await task.handler();
      
      // Calculate next run time
      task.nextRun = this.calculateNextRun(task.schedule, task.lastRun);
      
      this.logger.info(
        {
          taskId: task.id,
          taskName: task.name,
          nextRun: task.nextRun?.toISOString(),
        },
        'Scheduled task completed successfully'
      );
    } catch (error) {
      this.logger.error(
        { taskId: task.id, taskName: task.name, error },
        'Scheduled task failed'
      );
      
      // Still calculate next run even if task failed
      task.nextRun = this.calculateNextRun(task.schedule, task.lastRun);
    }
  }

  /**
   * Calculate next run time based on schedule
   * Schedule format: "HH:MM" for daily tasks
   */
  private calculateNextRun(schedule: string, from?: Date): Date {
    const now = from || new Date();
    const [hours, minutes] = schedule.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid schedule format: ${schedule}. Expected HH:MM`);
    }

    // Create next run date
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Stop all tasks and clean up
   */
  shutdown(): void {
    this.logger.info('Shutting down scheduled task service');
    
    for (const taskId of this.intervals.keys()) {
      this.stopTask(taskId);
    }
    
    this.tasks.clear();
    this.intervals.clear();
  }
}
