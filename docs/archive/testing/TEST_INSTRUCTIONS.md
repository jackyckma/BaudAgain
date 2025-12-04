# Testing BaudAgain BBS

## Current Status: Milestone 1 Complete! ✅

### What's Working

1. **WebSocket Server** (Port 8080)
   - Accepts WebSocket connections
   - Connection abstraction layer for future protocol support
   - Graceful shutdown handling
   - Health check endpoint

2. **Web Terminal Client** (Port 5173)
   - xterm.js-based terminal with ANSI support
   - Retro CRT effect styling
   - WebSocket connection to BBS server
   - Input handling (Enter, Backspace, Ctrl+C)

3. **ANSI Welcome Screen**
   - Template-based rendering system
   - Variable substitution ({{node}}, {{max_nodes}}, {{caller_count}})
   - Classic BBS ASCII art logo
   - Spooky "Haunted Terminal" theme

### How to Test

1. **Start the servers:**
   ```bash
   # Terminal 1: Start BBS server
   npm run dev:server
   
   # Terminal 2: Start terminal client
   npm run dev:terminal
   ```

2. **Open the terminal client:**
   - Navigate to http://localhost:5173 in your browser
   - You should see:
     - The BaudAgain BBS logo in ANSI art
     - "The Haunted Terminal" tagline
     - Connection status
     - Prompt: "Enter your handle, or type NEW to register:"

3. **Test the connection:**
   - Type anything and press Enter
   - The server will echo back what you typed
   - This confirms the WebSocket connection is working

4. **Check the health endpoint:**
   ```bash
   curl http://localhost:8080/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-27T...",
     "connections": 1
   }
   ```

### What You Should See

The terminal should display something like this:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ████████╗██╗  ██╗███████╗    ██╗  ██╗ █████╗ ██╗   ██╗███╗   ██╗████████╗  ║
║  ╚══██╔══╝██║  ██║██╔════╝    ██║  ██║██╔══██╗██║   ██║████╗  ██║╚══██╔══╝  ║
║     ██║   ███████║█████╗      ███████║███████║██║   ██║██╔██╗ ██║   ██║     ║
║     ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██║██║   ██║██║╚██╗██║   ██║     ║
║     ██║   ██║  ██║███████╗    ██║  ██║██║  ██║╚██████╔╝██║ ╚████║   ██║     ║
║     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝     ║
║                                                                              ║
║          ███████╗██████╗     ████████╗███████╗██████╗ ███╗   ███╗           ║
║          ██╔════╝██╔══██╗    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║           ║
║          █████╗  ██║  ██║       ██║   █████╗  ██████╔╝██╔████╔██║           ║
║          ██╔══╝  ██║  ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║           ║
║          ███████╗██████╔╝       ██║   ███████╗██║  ██║██║ ╚═╝ ██║           ║
║          ╚══════╝╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝           ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║         "Where the spirits of the old 'net still whisper..."               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Node 1 of 4  │  1 callers today  │  Running BaudAgain v0.1                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Enter your handle, or type NEW to register: _
```

### Tests

Run the property-based tests:
```bash
npm test -w server
```

All tests should pass, including:
- Connection abstraction tests (Property 46)
- Session management tests
- Basic functionality tests

### Next Steps (Milestone 2)

The next phase will implement:
- SQLite database
- User registration and login
- Session management with authentication
- Password hashing with bcrypt
- Rate limiting

### Troubleshooting

**Terminal client won't connect:**
- Make sure the server is running on port 8080
- Check browser console for WebSocket errors
- Verify firewall isn't blocking connections

**ANSI art looks wrong:**
- Make sure you're using a modern browser (Chrome, Firefox, Safari)
- xterm.js should handle ANSI escape codes automatically
- Check browser console for errors

**Server won't start:**
- Make sure port 8080 is not in use
- Run `npm install` to ensure all dependencies are installed
- Check server logs for errors
