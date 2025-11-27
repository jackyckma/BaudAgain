import { IConnection } from './IConnection.js';
import { FastifyBaseLogger } from 'fastify';

export class ConnectionManager {
  private connections: Map<string, IConnection> = new Map();

  constructor(private logger: FastifyBaseLogger) {}

  addConnection(connection: IConnection): void {
    this.connections.set(connection.id, connection);
    this.logger.info({ connectionId: connection.id }, 'Connection added');

    // Set up cleanup on close
    connection.onClose(() => {
      this.removeConnection(connection.id);
    });
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.logger.info({ connectionId }, 'Connection removed');
    }
  }

  getConnection(connectionId: string): IConnection | undefined {
    return this.connections.get(connectionId);
  }

  getAllConnections(): IConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  async closeAll(): Promise<void> {
    this.logger.info('Closing all connections');
    const closePromises = Array.from(this.connections.values()).map(conn => 
      conn.close().catch(err => 
        this.logger.error({ err, connectionId: conn.id }, 'Error closing connection')
      )
    );
    await Promise.all(closePromises);
    this.connections.clear();
  }
}
