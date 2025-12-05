/**
 * BaudAgain BBS Terminal Client
 * 
 * Uses WebSocket for both actions and notifications (Pure WebSocket Mode).
 * This ensures the server-side logic (BBSCore, Handlers) controls the experience,
 * preventing synchronization issues between client-side state and server state.
 */

import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
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

// WebSocket connection
const WS_URL = 'ws://localhost:8080/ws';
let ws: WebSocket | null = null;
let inputBuffer = '';
let echoEnabled = true;

// Display helpers
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[1;33m',
  green: '\x1b[92m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
};

function writeInfo(message: string) {
  terminal.write(`\r\n${colors.cyan}ℹ ${message}${colors.reset}\r\n`);
}

// Connect WebSocket
function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
    // Note: The server sends the welcome screen automatically upon connection
  };

  ws.onmessage = (event) => {
    try {
      // Try parsing as JSON first (for notifications)
      const data = JSON.parse(event.data);
      
      // Check if it's a notification event
      if (data.type && data.timestamp) {
        notificationHandler.handleNotification(data as NotificationEvent);
      } else {
        // Not a notification structure, treat as raw content if it happens to be valid JSON
        terminal.write(event.data);
      }
    } catch (error) {
      // Not JSON, treat as raw ANSI data from the BBS server
      const rawData = event.data;
      
      // Check for echo control sequences
      // \x1b]8001;1\x07 enables echo
      // \x1b]8001;0\x07 disables echo (for password input)
      const echoControlMatch = rawData.match(/\x1b\]8001;([01])\x07/);
      if (echoControlMatch) {
        echoEnabled = echoControlMatch[1] === '1';
        // Remove the control sequence from display
        const cleanData = rawData.replace(/\x1b\]8001;[01]\x07/g, '');
        if (cleanData) {
          terminal.write(cleanData);
        }
      } else {
        terminal.write(rawData);
      }
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    writeInfo('Disconnected from server. Reconnecting in 3s...');
    setTimeout(() => {
      connectWebSocket();
    }, 3000);
  };
}

// Terminal input handling
terminal.onData((data) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  if (data === '\r') {
    // Enter key
    terminal.write('\r\n');
    const command = inputBuffer;
    inputBuffer = '';
    
    // Send command to server
    ws.send(command);
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
    ws.send('CANCEL'); // Send CANCEL command to server (or handle as appropriate)
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
  const title = 'BaudAgain BBS Terminal Client';
  const width = 62;
  const padding = Math.floor((width - title.length) / 2);
  const centeredTitle = ' '.repeat(padding) + title + ' '.repeat(width - padding - title.length);
  
  terminal.writeln(colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset);
  terminal.writeln(colors.cyan + '║' + colors.reset + colors.yellow + centeredTitle + colors.reset + colors.cyan + '║' + colors.reset);
  terminal.writeln(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset);
  terminal.writeln('');
  
  writeInfo('Connecting to BaudAgain BBS...');
  
  // Connect WebSocket
  connectWebSocket();
}

// Start the application
initialize();
