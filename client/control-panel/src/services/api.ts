const API_BASE_URL = 'http://localhost:8080/api';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    handle: string;
    accessLevel: number;
  };
}

interface DashboardData {
  currentCallers: number;
  totalUsers: number;
  messagesToday: number;
  recentActivity: any[];
  uptime: number;
  nodeUsage: {
    active: number;
    total: number;
  };
}

interface User {
  id: string;
  handle: string;
  accessLevel: number;
  createdAt: string;
  lastLogin?: string;
  totalCalls: number;
  totalPosts: number;
}

interface MessageBase {
  id: string;
  name: string;
  description?: string;
  accessLevelRead: number;
  accessLevelWrite: number;
  postCount: number;
  lastPostAt?: string;
  sortOrder: number;
}

interface CreateMessageBaseData {
  name: string;
  description?: string;
  accessLevelRead?: number;
  accessLevelWrite?: number;
  sortOrder?: number;
}

interface UpdateMessageBaseData {
  name?: string;
  description?: string;
  accessLevelRead?: number;
  accessLevelWrite?: number;
  sortOrder?: number;
}

interface AISettings {
  provider: string;
  model: string;
  sysop: {
    enabled: boolean;
    welcomeNewUsers: boolean;
    participateInChat: boolean;
    chatFrequency: string;
    personality: string;
  };
  doors: {
    enabled: boolean;
    maxTokensPerTurn: number;
  };
}

class APIClient {
  private token: string | null = null;
  private onTokenExpired?: () => void;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  setOnTokenExpired(callback: () => void) {
    this.onTokenExpired = callback;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
        this.clearToken();
        
        // Check if it's a token expiration
        if (errorData.error === 'Token expired') {
          if (this.onTokenExpired) {
            this.onTokenExpired();
          }
          throw new Error('Token expired');
        }
        
        throw new Error('Unauthorized');
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async login(handle: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ handle, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async getDashboard(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard');
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async updateUserAccessLevel(userId: string, accessLevel: number): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ accessLevel }),
    });
  }

  async getMessageBases(): Promise<MessageBase[]> {
    return this.request<MessageBase[]>('/message-bases');
  }

  async createMessageBase(data: CreateMessageBaseData): Promise<MessageBase> {
    return this.request<MessageBase>('/message-bases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMessageBase(id: string, data: UpdateMessageBaseData): Promise<MessageBase> {
    return this.request<MessageBase>(`/message-bases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMessageBase(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/message-bases/${id}`, {
      method: 'DELETE',
    });
  }

  async getAISettings(): Promise<AISettings> {
    return this.request<AISettings>('/ai-settings');
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export const api = new APIClient();
export type { LoginResponse, DashboardData, User, MessageBase, CreateMessageBaseData, UpdateMessageBaseData, AISettings };
