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

class APIClient {
  private token: string | null = null;

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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
        this.clearToken();
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

  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export const api = new APIClient();
export type { LoginResponse, DashboardData, User };
