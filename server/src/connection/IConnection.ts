// Connection abstraction interface
// This allows us to support multiple protocols (WebSocket, Telnet, SSH) in the future

export interface IConnection {
  readonly id: string;
  readonly isOpen: boolean;
  
  send(data: string): Promise<void>;
  close(): Promise<void>;
  onData(callback: (data: string) => void): void;
  onClose(callback: () => void): void;
  onError(callback: (error: Error) => void): void;
}
