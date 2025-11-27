import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionManager } from './ConnectionManager.js';
import { IConnection } from './IConnection.js';
import * as fc from 'fast-check';

// Mock connection for testing
class MockConnection implements IConnection {
  public readonly id: string;
  public isOpen: boolean = true;
  private dataCallback?: (data: string) => void;
  private closeCallback?: () => void;
  private errorCallback?: (error: Error) => void;

  constructor(id: string) {
    this.id = id;
  }

  async send(data: string): Promise<void> {
    if (!this.isOpen) {
      throw new Error('Connection is not open');
    }
  }

  async close(): Promise<void> {
    this.isOpen = false;
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  onData(callback: (data: string) => void): void {
    this.dataCallback = callback;
  }

  onClose(callback: () => void): void {
    this.closeCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  // Test helper
  triggerClose(): void {
    if (this.closeCallback) {
      this.closeCallback();
    }
  }
}

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    connectionManager = new ConnectionManager(mockLogger);
  });

  describe('Property 46: Connection abstraction usage', () => {
    // Feature: baudagain, Property 46: Connection abstraction usage
    // Validates: Requirements 12.1
    
    it('should use connection abstraction for all incoming connections', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          (connectionIds) => {
            // For any set of connection IDs, all should be managed through the abstraction
            const connections = connectionIds.map(id => new MockConnection(id));
            
            // Add all connections
            connections.forEach(conn => connectionManager.addConnection(conn));
            
            // Verify all connections are tracked
            expect(connectionManager.getConnectionCount()).toBe(connections.length);
            
            // Verify each connection can be retrieved
            connections.forEach(conn => {
              const retrieved = connectionManager.getConnection(conn.id);
              expect(retrieved).toBeDefined();
              expect(retrieved?.id).toBe(conn.id);
            });
            
            // Cleanup
            connections.forEach(conn => conn.triggerClose());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should properly clean up connections when they close', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          (connectionIds) => {
            const connections = connectionIds.map(id => new MockConnection(id));
            
            // Add all connections
            connections.forEach(conn => connectionManager.addConnection(conn));
            
            const initialCount = connectionManager.getConnectionCount();
            expect(initialCount).toBe(connections.length);
            
            // Close all connections
            connections.forEach(conn => conn.triggerClose());
            
            // Verify all connections are removed
            expect(connectionManager.getConnectionCount()).toBe(0);
            
            // Verify connections cannot be retrieved
            connections.forEach(conn => {
              const retrieved = connectionManager.getConnection(conn.id);
              expect(retrieved).toBeUndefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle concurrent connection additions and removals', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 5, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 10 }),
          (connectionIds, indicesToClose) => {
            const connections = connectionIds.map(id => new MockConnection(id));
            
            // Add all connections
            connections.forEach(conn => connectionManager.addConnection(conn));
            
            // Close some connections
            const uniqueIndices = [...new Set(indicesToClose)].filter(i => i < connections.length);
            uniqueIndices.forEach(index => {
              connections[index].triggerClose();
            });
            
            // Verify count is correct
            const expectedCount = connections.length - uniqueIndices.length;
            expect(connectionManager.getConnectionCount()).toBe(expectedCount);
            
            // Cleanup remaining
            connections.forEach(conn => {
              if (conn.isOpen) {
                conn.triggerClose();
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Basic functionality', () => {
    it('should add and retrieve a connection', () => {
      const conn = new MockConnection('test-1');
      connectionManager.addConnection(conn);
      
      const retrieved = connectionManager.getConnection('test-1');
      expect(retrieved).toBe(conn);
    });

    it('should remove connection when it closes', () => {
      const conn = new MockConnection('test-2');
      connectionManager.addConnection(conn);
      
      conn.triggerClose();
      
      const retrieved = connectionManager.getConnection('test-2');
      expect(retrieved).toBeUndefined();
    });

    it('should return all connections', () => {
      const conn1 = new MockConnection('test-3');
      const conn2 = new MockConnection('test-4');
      
      connectionManager.addConnection(conn1);
      connectionManager.addConnection(conn2);
      
      const all = connectionManager.getAllConnections();
      expect(all).toHaveLength(2);
      expect(all).toContain(conn1);
      expect(all).toContain(conn2);
      
      // Cleanup
      conn1.triggerClose();
      conn2.triggerClose();
    });

    it('should close all connections', async () => {
      const conn1 = new MockConnection('test-5');
      const conn2 = new MockConnection('test-6');
      
      connectionManager.addConnection(conn1);
      connectionManager.addConnection(conn2);
      
      await connectionManager.closeAll();
      
      expect(conn1.isOpen).toBe(false);
      expect(conn2.isOpen).toBe(false);
      expect(connectionManager.getConnectionCount()).toBe(0);
    });
  });
});
