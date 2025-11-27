import { IConnection } from './IConnection.js';
import { WebSocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketConnection implements IConnection {
  public readonly id: string;
  private dataCallback?: (data: string) => void;
  private closeCallback?: () => void;
  private errorCallback?: (error: Error) => void;

  constructor(private ws: WebSocket) {
    this.id = uuidv4();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.ws.on('message', (message: Buffer) => {
      const data = message.toString();
      if (this.dataCallback) {
        this.dataCallback(data);
      }
    });

    this.ws.on('close', () => {
      if (this.closeCallback) {
        this.closeCallback();
      }
    });

    this.ws.on('error', (error: Error) => {
      if (this.errorCallback) {
        this.errorCallback(error);
      }
    });
  }

  get isOpen(): boolean {
    return this.ws.readyState === this.ws.OPEN;
  }

  async send(data: string): Promise<void> {
    if (!this.isOpen) {
      throw new Error('Connection is not open');
    }
    
    return new Promise((resolve, reject) => {
      this.ws.send(data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.isOpen) {
      this.ws.close();
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
}
