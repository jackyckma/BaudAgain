/**
 * REST API Client for Terminal
 * 
 * Handles all REST API communication with the BBS server
 */

const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface APIError {
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: any;
  };
}

export interface LoginRequest {
  handle: string;
  password: string;
}

export interface RegisterRequest {
  handle: string;
  password: string;
  realName?: string;
  location?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

export interface MessageBase {
  id: string;
  name: string;
  description: string;
  postCount: number;
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface Door {
  id: string;
  name: string;
  description: string;
}

export interface DoorResponse {
  sessionId: string;
  output: string;
  doorId: string;
  doorName: string;
  resumed?: boolean;
  exited?: boolean;
}

/**
 * API Client class
 */
export class APIClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data as APIError;
      }

      return data as T;
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error
        throw {
          error: {
            code: 'NETWORK_ERROR',
            message: 'Unable to connect to server',
            timestamp: new Date().toISOString(),
          },
        } as APIError;
      }
      throw error;
    }
  }

  // Authentication
  async login(handle: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ handle, password }),
    });
  }

  async register(
    handle: string,
    password: string,
    realName?: string,
    location?: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ handle, password, realName, location }),
    });
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    return this.request<AuthResponse['user']>('/auth/me');
  }

  // Message Bases
  async getMessageBases(): Promise<MessageBase[]> {
    const response = await this.request<{ messageBases: MessageBase[]; pagination: any }>('/message-bases');
    return response.messageBases;
  }

  async getMessages(baseId: string): Promise<Message[]> {
    const response = await this.request<{ messages: Message[]; pagination: any }>(`/message-bases/${baseId}/messages`);
    return response.messages;
  }

  async postMessage(
    baseId: string,
    subject: string,
    body: string
  ): Promise<Message> {
    return this.request<Message>(`/message-bases/${baseId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ subject, body }),
    });
  }

  // Doors
  async getDoors(): Promise<Door[]> {
    const response = await this.request<{ doors: Door[] }>('/doors');
    return response.doors;
  }

  async enterDoor(doorId: string): Promise<DoorResponse> {
    return this.request<DoorResponse>(`/doors/${doorId}/enter`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async sendDoorInput(doorId: string, input: string): Promise<DoorResponse> {
    return this.request<DoorResponse>(`/doors/${doorId}/input`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  async exitDoor(doorId: string): Promise<void> {
    await this.request<void>(`/doors/${doorId}/exit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
