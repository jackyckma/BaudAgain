/**
 * State Manager for Terminal Client
 * 
 * Manages authentication state, current context, and user session
 */

export enum AppState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  IN_MENU = 'in_menu',
  IN_MESSAGES = 'in_messages',
  IN_DOOR_SELECTION = 'in_door_selection',
  IN_DOOR = 'in_door',
  DISCONNECTED = 'disconnected',
}

export interface UserInfo {
  id: string;
  handle: string;
  accessLevel: number;
}

export interface StateData {
  appState: AppState;
  user: UserInfo | null;
  token: string | null;
  currentMessageBase: string | null;
  currentDoor: string | null;
  useRestAPI: boolean; // If false, fallback to WebSocket-only
}

class StateManager {
  private state: StateData = {
    appState: AppState.CONNECTING,
    user: null,
    token: null,
    currentMessageBase: null,
    currentDoor: null,
    useRestAPI: true,
  };

  private listeners: Array<(state: StateData) => void> = [];

  getState(): StateData {
    return { ...this.state };
  }

  setState(updates: Partial<StateData>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (state: StateData) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  // Convenience methods
  setUser(user: UserInfo, token: string) {
    this.setState({
      user,
      token,
      appState: AppState.AUTHENTICATED,
    });
  }

  clearUser() {
    this.setState({
      user: null,
      token: null,
      appState: AppState.CONNECTED,
    });
  }

  setAppState(appState: AppState) {
    this.setState({ appState });
  }

  setCurrentMessageBase(baseId: string | null) {
    this.setState({ currentMessageBase: baseId });
  }

  setCurrentDoor(doorId: string | null) {
    this.setState({ currentDoor: doorId });
  }

  enableFallbackMode() {
    this.setState({ useRestAPI: false });
  }

  disableFallbackMode() {
    this.setState({ useRestAPI: true });
  }

  isAuthenticated(): boolean {
    return this.state.user !== null && this.state.token !== null;
  }

  getToken(): string | null {
    return this.state.token;
  }

  getUser(): UserInfo | null {
    return this.state.user;
  }

  shouldUseRestAPI(): boolean {
    return this.state.useRestAPI;
  }
}

// Export singleton instance
export const stateManager = new StateManager();
