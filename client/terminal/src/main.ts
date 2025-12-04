/**
 * BaudAgain BBS Terminal Client - Hybrid Architecture
 * 
 * Uses REST API for actions and WebSocket for notifications
 */

import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { apiClient, type APIError } from './api-client.js';
import { stateManager, AppState } from './state.js';
import { NotificationHandler, type NotificationEvent } from './notification-handler.js';

// Create terminal instance
const terminal = new Terminal({
  cursorBlink: true,
  fontSize: 16,
  fontFamily: '"Courier New", Courier, monospace',
  theme: {
    background: '#000000',
    foreground: '#00ff00',
    cursor: '#00ff00',
    cursorAccent: '#000000',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#808080',
    brightRed: '#ff8080',
    brightGreen: '#80ff80',
    brightYellow: '#ffff80',
    brightBlue: '#8080ff',
    brightMagenta: '#ff80ff',
    brightCyan: '#80ffff',
    brightWhite: '#ffffff',
  },
  cols: 80,
  rows: 24,
});

// Add fit addon
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

// Mount terminal
const terminalElement = document.getElementById('terminal');
if (!terminalElement) {
  throw new Error('Terminal element not found');
}
terminal.open(terminalElement);
fitAddon.fit();

// Handle window resize
window.addEventListener('resize', () => {
  fitAddon.fit();
});

// Initialize notification handler
const notificationHandler = new NotificationHandler(terminal);

// WebSocket for notifications
const WS_URL = 'ws://localhost:8080/ws';
let ws: WebSocket | null = null;
let inputBuffer = '';
let echoEnabled = true;
let awaitingInput = false;
let currentPrompt = '';

// Display helpers
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[1;33m',
  green: '\x1b[92m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
};

function centerText(text: string, width: number): string {
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
}

function writeError(message: string) {
  terminal.write(`\r\n${colors.red}✗ ${message}${colors.reset}\r\n`);
}

function writeSuccess(message: string) {
  terminal.write(`\r\n${colors.green}✓ ${message}${colors.reset}\r\n`);
}

function writeInfo(message: string) {
  terminal.write(`\r\n${colors.cyan}ℹ ${message}${colors.reset}\r\n`);
}

function prompt(text: string) {
  currentPrompt = text;
  awaitingInput = true;
  terminal.write(`\r\n${text}`);
}

// Connect WebSocket for notifications
function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected for notifications');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Check if it's a notification event
      if (data.type && data.timestamp) {
        notificationHandler.handleNotification(data as NotificationEvent);
      } else {
        // Fallback: treat as raw ANSI data (for WebSocket-only mode)
        const rawData = event.data;
        
        // Check for echo control
        const echoControlMatch = rawData.match(/\x1b\]8001;([01])\x07/);
        if (echoControlMatch) {
          echoEnabled = echoControlMatch[1] === '1';
          const cleanData = rawData.replace(/\x1b\]8001;[01]\x07/g, '');
          if (cleanData) {
            terminal.write(cleanData);
          }
        } else {
          terminal.write(rawData);
        }
      }
    } catch (error) {
      // Not JSON, treat as raw data
      terminal.write(event.data);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(() => {
      if (stateManager.getState().appState !== AppState.DISCONNECTED) {
        connectWebSocket();
      }
    }, 3000);
  };
}

// Handle API errors
function handleAPIError(error: any) {
  if (error.error) {
    const apiError = error as APIError;
    writeError(apiError.error.message);
    
    // Check if it's a network error - enable fallback mode
    if (apiError.error.code === 'NETWORK_ERROR') {
      writeInfo('Falling back to WebSocket-only mode...');
      stateManager.enableFallbackMode();
    }
  } else {
    writeError('An unexpected error occurred');
    console.error(error);
  }
}

// Authentication flows
async function handleLogin(handle: string, password: string) {
  try {
    const response = await apiClient.login(handle, password);
    apiClient.setToken(response.token);
    stateManager.setUser(response.user, response.token);
    
    writeSuccess(`Welcome back, ${response.user.handle}!`);
    showMainMenu();
  } catch (error) {
    handleAPIError(error);
    promptForLogin();
  }
}

async function handleRegister(handle: string, password: string) {
  try {
    const response = await apiClient.register(handle, password);
    apiClient.setToken(response.token);
    stateManager.setUser(response.user, response.token);
    
    writeSuccess(`Account created! Welcome, ${response.user.handle}!`);
    showMainMenu();
  } catch (error) {
    handleAPIError(error);
    promptForInitial();
  }
}

// Menu displays
function showMainMenu() {
  stateManager.setAppState(AppState.IN_MENU);
  
  terminal.write('\r\n');
  terminal.write(colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '║' + colors.reset + colors.yellow + centerText('MAIN MENU', 62) + colors.reset + colors.cyan + '║' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '║' + colors.reset + '  [M] Messages      Read and post messages                    ' + colors.cyan + '║' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '║' + colors.reset + '  [D] Doors         Play door games                           ' + colors.cyan + '║' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '║' + colors.reset + '  [G] Goodbye       Disconnect                                ' + colors.cyan + '║' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
  terminal.write(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset + '\r\n');
  
  prompt('Command: ');
}

// Store message bases for selection
let messageBases: any[] = [];
let selectedMessageBase: any = null;

async function showMessageBases() {
  try {
    messageBases = await apiClient.getMessageBases();
    
    terminal.write('\r\n');
    terminal.write(colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + colors.yellow + centerText('MESSAGE BASES', 62) + colors.reset + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
    
    messageBases.forEach((base, index) => {
      const line = `  [${index + 1}] ${base.name} (${base.postCount} messages)`;
      terminal.write(colors.cyan + '║' + colors.reset + line.padEnd(62) + colors.cyan + '║' + colors.reset + '\r\n');
    });
    
    terminal.write(colors.cyan + '║' + colors.reset + '  [Q] Return to main menu                                     ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset + '\r\n');
    
    stateManager.setAppState(AppState.IN_MESSAGES);
    prompt('Select base: ');
  } catch (error) {
    handleAPIError(error);
    showMainMenu();
  }
}

async function showMessages(baseId: string) {
  try {
    const messages = await apiClient.getMessages(baseId);
    
    terminal.write('\r\n');
    terminal.write(colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + colors.yellow + centerText(selectedMessageBase.name, 62) + colors.reset + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + colors.reset + '\r\n');
    
    if (messages.length === 0) {
      terminal.write(colors.cyan + '║' + colors.reset + '  No messages yet. Be the first to post!                     ' + colors.cyan + '║' + colors.reset + '\r\n');
    } else {
      messages.forEach((msg, index) => {
        const line = `  ${index + 1}. ${msg.subject}`;
        terminal.write(colors.cyan + '║' + colors.reset + line.padEnd(62) + colors.cyan + '║' + colors.reset + '\r\n');
        const authorLine = `     by ${msg.author} - ${new Date(msg.createdAt).toLocaleDateString()}`;
        terminal.write(colors.cyan + '║' + colors.reset + authorLine.padEnd(62) + colors.cyan + '║' + colors.reset + '\r\n');
      });
    }
    
    terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + '  [P] Post new message                                        ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + '  [Q] Return to message bases                                 ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset + '\r\n');
    
    prompt('Command: ');
  } catch (error) {
    handleAPIError(error);
    showMessageBases();
  }
}

// Store doors for selection
let doors: any[] = [];
let currentDoor: any = null;

async function showDoors() {
  try {
    doors = await apiClient.getDoors();
    
    terminal.write('\r\n');
    terminal.write(colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + colors.yellow + centerText('DOOR GAMES', 62) + colors.reset + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '╠══════════════════════════════════════════════════════════════╣' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
    
    doors.forEach((door, index) => {
      const line = `  [${index + 1}] ${door.name}`;
      terminal.write(colors.cyan + '║' + colors.reset + line.padEnd(62) + colors.cyan + '║' + colors.reset + '\r\n');
      const descLine = `      ${door.description}`;
      terminal.write(colors.cyan + '║' + colors.reset + descLine.padEnd(62) + colors.cyan + '║' + colors.reset + '\r\n');
    });
    
    terminal.write(colors.cyan + '║' + colors.reset + '  [Q] Return to main menu                                     ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '║' + colors.reset + '                                                              ' + colors.cyan + '║' + colors.reset + '\r\n');
    terminal.write(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset + '\r\n');
    
    stateManager.setAppState(AppState.IN_DOOR_SELECTION);
    prompt('Select door: ');
  } catch (error) {
    handleAPIError(error);
    showMainMenu();
  }
}

async function enterDoor(doorId: string) {
  try {
    const response = await apiClient.enterDoor(doorId);
    stateManager.setAppState(AppState.IN_DOOR);
    stateManager.setCurrentDoor(doorId);
    
    terminal.write('\r\n' + response.output + '\r\n');
    
    if (response.exited) {
      await exitDoor();
    } else {
      prompt('');
    }
  } catch (error) {
    handleAPIError(error);
    showDoors();
  }
}

async function sendDoorInput(input: string) {
  if (!currentDoor) return;
  
  try {
    const response = await apiClient.sendDoorInput(currentDoor.id, input);
    terminal.write('\r\n' + response.output + '\r\n');
    
    if (response.exited) {
      await exitDoor();
    } else {
      prompt('');
    }
  } catch (error) {
    handleAPIError(error);
    await exitDoor();
  }
}

async function exitDoor() {
  if (!currentDoor) return;
  
  try {
    await apiClient.exitDoor(currentDoor.id);
  } catch (error) {
    console.error('Error exiting door:', error);
  }
  
  stateManager.setAppState(AppState.IN_MENU);
  stateManager.setCurrentDoor(null);
  currentDoor = null;
  showMainMenu();
}

// Initial prompts
function promptForInitial() {
  terminal.write('\r\n');
  prompt('Enter your handle (or NEW to register): ');
}

function promptForLogin() {
  prompt('Handle: ');
}

// Command handling
let authStep: 'initial' | 'handle' | 'password' | 'new-handle' | 'new-password' = 'initial';
let tempHandle = '';
let messageStep: 'list' | 'post-subject' | 'post-body' | null = null;
let tempSubject = '';

async function handleCommand(input: string) {
  const trimmed = input.trim();
  
  if (!stateManager.isAuthenticated()) {
    // Authentication flow
    if (authStep === 'initial') {
      if (trimmed.toUpperCase() === 'NEW') {
        authStep = 'new-handle';
        prompt('Choose a handle: ');
      } else {
        tempHandle = trimmed;
        authStep = 'password';
        echoEnabled = false;
        prompt('Password: ');
      }
    } else if (authStep === 'password') {
      echoEnabled = true;
      await handleLogin(tempHandle, trimmed);
      authStep = 'initial';
      tempHandle = '';
    } else if (authStep === 'new-handle') {
      tempHandle = trimmed;
      authStep = 'new-password';
      echoEnabled = false;
      prompt('Choose a password: ');
    } else if (authStep === 'new-password') {
      echoEnabled = true;
      await handleRegister(tempHandle, trimmed);
      authStep = 'initial';
      tempHandle = '';
    }
  } else {
    // Authenticated commands
    const state = stateManager.getState();
    
    if (state.appState === AppState.IN_MENU) {
      const cmd = trimmed.toUpperCase();
      if (cmd === 'M') {
        await showMessageBases();
      } else if (cmd === 'D') {
        await showDoors();
      } else if (cmd === 'G') {
        writeInfo('Goodbye!');
        stateManager.setAppState(AppState.DISCONNECTED);
        apiClient.clearToken();
        stateManager.clearUser();
      } else {
        writeError('Invalid command');
        showMainMenu();
      }
    } else if (state.appState === AppState.IN_MESSAGES) {
      if (messageStep === null) {
        // Selecting message base
        const cmd = trimmed.toUpperCase();
        if (cmd === 'Q') {
          showMainMenu();
        } else {
          const index = parseInt(trimmed) - 1;
          if (index >= 0 && index < messageBases.length) {
            selectedMessageBase = messageBases[index];
            messageStep = 'list';
            await showMessages(selectedMessageBase.id);
          } else {
            writeError('Invalid selection');
            await showMessageBases();
          }
        }
      } else if (messageStep === 'list') {
        // In message list
        const cmd = trimmed.toUpperCase();
        if (cmd === 'Q') {
          messageStep = null;
          selectedMessageBase = null;
          await showMessageBases();
        } else if (cmd === 'P') {
          messageStep = 'post-subject';
          prompt('Subject: ');
        } else {
          writeError('Invalid command');
          await showMessages(selectedMessageBase.id);
        }
      } else if (messageStep === 'post-subject') {
        tempSubject = trimmed;
        messageStep = 'post-body';
        prompt('Message body: ');
      } else if (messageStep === 'post-body') {
        try {
          await apiClient.postMessage(selectedMessageBase.id, tempSubject, trimmed);
          writeSuccess('Message posted!');
          messageStep = 'list';
          tempSubject = '';
          await showMessages(selectedMessageBase.id);
        } catch (error) {
          handleAPIError(error);
          messageStep = 'list';
          tempSubject = '';
          await showMessages(selectedMessageBase.id);
        }
      }
    } else if (state.appState === AppState.IN_DOOR_SELECTION) {
      // Door selection
      const cmd = trimmed.toUpperCase();
      if (cmd === 'Q') {
        showMainMenu();
      } else {
        const index = parseInt(trimmed) - 1;
        if (index >= 0 && index < doors.length) {
          currentDoor = doors[index];
          await enterDoor(currentDoor.id);
        } else {
          writeError('Invalid selection');
          await showDoors();
        }
      }
    } else if (state.appState === AppState.IN_DOOR) {
      // Door input handling
      if (trimmed.toUpperCase() === 'QUIT' || trimmed.toUpperCase() === 'Q') {
        await exitDoor();
      } else {
        await sendDoorInput(trimmed);
      }
    }
  }
}

// Terminal input handling
terminal.onData((data) => {
  if (!awaitingInput) {
    return;
  }

  if (data === '\r') {
    // Enter key
    terminal.write('\r\n');
    awaitingInput = false;
    const command = inputBuffer;
    inputBuffer = '';
    handleCommand(command);
  } else if (data === '\x7F') {
    // Backspace
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      if (echoEnabled) {
        terminal.write('\b \b');
      }
    }
  } else if (data === '\x03') {
    // Ctrl+C
    inputBuffer = '';
    terminal.write('\r\n^C\r\n');
    if (stateManager.isAuthenticated()) {
      showMainMenu();
    } else {
      promptForInitial();
    }
  } else {
    // Regular character
    inputBuffer += data;
    if (echoEnabled) {
      terminal.write(data);
    }
  }
});

// Initialize
function initialize() {
  // Display welcome
  const title = 'BaudAgain BBS Terminal Client';
  const centeredTitle = centerText(title, 62);
  
  terminal.writeln(colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset);
  terminal.writeln(colors.cyan + '║' + colors.reset + colors.yellow + centeredTitle + colors.reset + colors.cyan + '║' + colors.reset);
  terminal.writeln(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset);
  terminal.writeln('');
  
  writeInfo('Connecting to BaudAgain BBS...');
  
  // Connect WebSocket for notifications
  connectWebSocket();
  
  // Set initial state
  stateManager.setAppState(AppState.CONNECTED);
  
  // Start authentication flow
  promptForInitial();
}

// Start the application
initialize();
