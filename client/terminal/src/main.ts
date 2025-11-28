import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

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

// Add fit addon for responsive sizing
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

// Mount terminal to DOM
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

// WebSocket connection
const WS_URL = 'ws://localhost:8080/ws';
let ws: WebSocket | null = null;
let inputBuffer = '';
let echoEnabled = true; // Track whether to echo input

function connect() {
  terminal.writeln('Connecting to BaudAgain BBS...\r\n');
  
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    terminal.writeln('Connected!\r\n');
  };

  ws.onmessage = (event) => {
    const data = event.data;
    
    // Check for echo control sequence: \x1b]8001;{0|1}\x07
    const echoControlMatch = data.match(/\x1b\]8001;([01])\x07/);
    if (echoControlMatch) {
      echoEnabled = echoControlMatch[1] === '1';
      // Remove the control sequence and write the rest
      const cleanData = data.replace(/\x1b\]8001;[01]\x07/g, '');
      if (cleanData) {
        terminal.write(cleanData);
      }
    } else {
      terminal.write(data);
    }
  };

  ws.onerror = (error) => {
    terminal.writeln('\r\n\x1b[31mConnection error!\x1b[0m\r\n');
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    terminal.writeln('\r\n\x1b[33mDisconnected from server.\x1b[0m\r\n');
    terminal.writeln('Refresh the page to reconnect.\r\n');
  };
}

// Handle terminal input
terminal.onData((data) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  // Handle special keys
  if (data === '\r') {
    // Enter key - send the buffered input
    ws.send(inputBuffer + '\n');
    inputBuffer = '';
    terminal.write('\r\n');
  } else if (data === '\x7F') {
    // Backspace
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      // Only show backspace if echo is enabled
      if (echoEnabled) {
        terminal.write('\b \b');
      }
    }
  } else if (data === '\x03') {
    // Ctrl+C
    ws.send('\x03');
    inputBuffer = '';
  } else {
    // Regular character
    inputBuffer += data;
    // Only echo if echo is enabled (for password masking)
    if (echoEnabled) {
      terminal.write(data);
    }
  }
});

// Start connection
connect();

// Display initial message
const cyan = '\x1b[36m';
const yellow = '\x1b[1;33m';
const reset = '\x1b[0m';

// Helper to center text in a box
function centerText(text: string, width: number): string {
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
}

const title = 'BaudAgain BBS Terminal Client';
const centeredTitle = centerText(title, 62);

terminal.writeln(cyan + '╔══════════════════════════════════════════════════════════════╗' + reset);
terminal.writeln(cyan + '║' + reset + yellow + centeredTitle + reset + cyan + '║' + reset);
terminal.writeln(cyan + '╚══════════════════════════════════════════════════════════════╝' + reset);
terminal.writeln('');
