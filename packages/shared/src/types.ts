// Shared TypeScript types

export enum SessionState {
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  IN_MENU = 'in_menu',
  IN_DOOR = 'in_door',
  DISCONNECTED = 'disconnected',
}

/**
 * Authentication Flow State
 * Tracks the state of user registration or login process
 */
export interface AuthFlowState {
  flow: 'registration' | 'login';
  step: 'handle' | 'password';
  handle?: string;
  loginAttempts?: number;
}

/**
 * Menu Flow State
 * Tracks the state of menu interactions
 */
export interface MenuFlowState {
  pagingSysOp?: boolean;
  question?: string;
}

/**
 * Door Game Flow State
 * Tracks the state of door game sessions
 */
export interface DoorFlowState {
  doorId?: string;
  gameState?: any;
  history?: any[];
}

/**
 * Message Flow State
 * Tracks the state of message base interactions
 */
export interface MessageFlowState {
  inMessageBase?: boolean;
  currentBaseId?: string;
  readingMessage?: boolean;
  currentMessageId?: string;
  postingMessage?: boolean;
  postStep?: 'subject' | 'body';
  draftSubject?: string;
}

/**
 * Typed Session Data
 * Provides type safety for session-specific data
 */
export interface SessionData {
  auth?: AuthFlowState;
  menu?: MenuFlowState;
  door?: DoorFlowState;
  message?: MessageFlowState;
  artGallery?: any; // Art gallery flow state
  digestAvailable?: boolean; // Whether daily digest is available for this session
}

export interface Session {
  id: string;
  connectionId: string;
  userId?: string;
  handle?: string;
  state: SessionState;
  currentMenu: string;
  lastActivity: Date;
  data: SessionData;
}

export interface User {
  id: string;
  handle: string;
  passwordHash: string;
  realName?: string;
  location?: string;
  bio?: string;
  accessLevel: number;
  createdAt: Date;
  lastLogin?: Date;
  totalCalls: number;
  totalPosts: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  terminalType: 'ansi' | 'ascii' | 'utf8';
  screenWidth: 80 | 132;
  screenHeight: 24 | 25 | 50;
}

export interface MessageBase {
  id: string;
  name: string;
  description: string;
  accessLevelRead: number;
  accessLevelWrite: number;
  postCount: number;
  lastPostAt?: Date;
  sortOrder: number;
}

export interface Message {
  id: string;
  baseId: string;
  parentId?: string;
  userId: string;
  subject: string;
  body: string;
  createdAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
  aiModerationFlag?: 'flagged' | 'approved' | 'removed';
}

export interface DoorSession {
  id: string;
  userId: string;
  doorId: string;
  state: any;
  history: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Menu {
  id: string;
  title: string;
  options: MenuOption[];
}

export interface MenuOption {
  key: string;
  label: string;
  description?: string;
  handler?: string;
  accessLevel?: number;
}
