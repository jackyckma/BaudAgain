# 🖥️ BaudAgain: AI-Enhanced Bulletin Board System

> *"Bringing back the intimate, decentralized communities of the dial-up era — with an AI soul."*

**Hackathon:** Kiroween (kiroween.devpost.com)  
**Category:** Resurrection — Bring your favorite dead technology back to life  
**Project Codename:** BaudAgain

---

## Table of Contents

1. [Vision & Philosophy](#vision--philosophy)
2. [Core Concepts](#core-concepts)
3. [Technical Architecture](#technical-architecture)
4. [Feature Specifications](#feature-specifications)
5. [AI Integration Details](#ai-integration-details)
6. [User Experience & Flows](#user-experience--flows)
7. [ANSI Art System](#ansi-art-system)
8. [Door Games Framework](#door-games-framework)
9. [Data Models](#data-models)
10. [API Design](#api-design)
11. [Tech Stack](#tech-stack)
12. [Security Considerations](#security-considerations)
13. [Hackathon MVP Scope](#hackathon-mvp-scope)
14. [Future Roadmap](#future-roadmap)

---

## Vision & Philosophy

### The Problem with Modern Social Media

Modern platforms have lost what made early online communities special:

| Lost Quality | Modern Reality |
|--------------|----------------|
| **Intimacy** | Billions of users, algorithmic feeds, no sense of place |
| **Ownership** | Platforms own your community; you're the product |
| **Personality** | Template-driven sameness across all communities |
| **Accountability** | Anonymity + scale = toxicity |
| **Creative Constraints** | Infinite scroll numbs creativity |
| **Human Scale** | Communities too large for genuine connection |

### Our Vision

**Make hosting a BBS as simple as running an app on your desktop.**

We're resurrecting the Bulletin Board System with modern sensibilities:

- **Decentralized by design** — Each BBS is independently hosted with its own personality
- **AI-powered SysOp** — An agent that handles the tedious work, letting anyone run a community
- **Creative constraints as features** — ANSI art, text-based interfaces, deliberate limitations
- **Small circles, real connections** — Designed for dozens, not millions

### Design Principles

1. **Nostalgia with Purpose** — Retro aesthetics serve the goal of intimacy, not just decoration
2. **Friction as Feature** — Slow connection animations, character limits create thoughtfulness
3. **Sysop Empowerment** — Easy to customize, hard to break
4. **AI as Enabler** — Automates the boring stuff, amplifies human creativity
5. **Spooky Theme** — It's Kiroween! Phantom boards, ghost users, haunted doors

---

## Core Concepts

### Terminology

| Term | Description |
|------|-------------|
| **BBS** | A single bulletin board instance, hosted by one person |
| **SysOp** | System Operator — the person who runs the BBS |
| **AI SysOp** | The AI agent that assists (or fully automates) BBS management |
| **Caller** | A user connecting to a BBS (nostalgia term) |
| **Handle** | Username/pseudonym |
| **Door** | External program/game launched from the BBS |
| **ANSI** | Text-based graphics using escape codes for color and positioning |
| **Message Base** | A forum/discussion area |
| **NetMail** | Private messages between users |
| **Node** | A connection slot (originally a phone line) |

### The Three Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                     BBS REVIVAL                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│   COMMUNITY     │   CREATIVITY    │      AI ASSISTANCE      │
│                 │                 │                         │
│ • Message Bases │ • ANSI Art      │ • AI SysOp Agent        │
│ • Real-time Chat│ • Theming       │ • AI Door Games         │
│ • Door Games    │ • Constraints   │ • AI Art Generation     │
│ • User Profiles │ • ASCII/Text    │ • AI Moderation         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Technical Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Browser  │  │ Terminal │  │ SyncTerm │  │ Retro Computer   │  │
│  │ (Web UI) │  │ (Telnet) │  │  (SSH)   │  │ (WiFi Modem)     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼─────────────┼─────────────┼─────────────────┼────────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CONNECTION LAYER                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  WebSocket      │  │  Telnet Server  │  │  SSH Server      │  │
│  │  (Port 8080)    │  │  (Port 23)      │  │  (Port 22)       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BBS CORE ENGINE                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Session Manager                           │ │
│  │  • Node allocation    • User authentication                  │ │
│  │  • Terminal detection • Rate limiting                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │  Message    │ │   Chat      │ │   Door      │ │   File     │  │
│  │  System     │ │   System    │ │   Launcher  │ │   Library  │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘  │
└─────────┼───────────────┼───────────────┼──────────────┼─────────┘
          │               │               │              │
          ▼               ▼               ▼              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AI LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  AI SysOp       │  │  AI Door Games  │  │  AI Art Gen      │  │
│  │  Agent          │  │  Engine         │  │  (ANSI)          │  │
│  │                 │  │                 │  │                  │  │
│  │ • Welcome users │  │ • Text RPGs     │  │ • Welcome screens│  │
│  │ • Moderation    │  │ • Interactive   │  │ • User avatars   │  │
│  │ • Q&A           │  │   fiction       │  │ • Door graphics  │  │
│  │ • Customizable  │  │ • Trivia        │  │                  │  │
│  │   personality   │  │                 │  │                  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                      LLM PROVIDER                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Claude API (Anthropic) / OpenAI / Local LLM (Ollama)       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  SQLite         │  │  File System    │  │  Config (YAML)   │  │
│  │  (Users, Msgs)  │  │  (Files, ANSI)  │  │  (BBS Settings)  │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Desktop App Architecture

Since the goal is "running an ordinary app on your desktop":

```
┌─────────────────────────────────────────────────────────────┐
│                    DESKTOP APPLICATION                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Electron / Tauri                    │  │
│  │  ┌─────────────────┐  ┌────────────────────────────┐  │  │
│  │  │  SysOp Control  │  │  Embedded BBS Server       │  │  │
│  │  │  Panel (React)  │  │  (Node.js / Rust)          │  │  │
│  │  │                 │  │                            │  │  │
│  │  │ • Start/Stop    │  │  • All BBS functionality   │  │  │
│  │  │ • View callers  │  │  • Runs on localhost       │  │  │
│  │  │ • Edit config   │  │  • Exposes via ngrok/      │  │  │
│  │  │ • AI settings   │  │    cloudflare tunnel       │  │  │
│  │  │ • ANSI editor   │  │                            │  │  │
│  │  └─────────────────┘  └────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  System Tray Integration               │  │
│  │  • Minimize to tray   • Show caller notifications     │  │
│  │  • Quick status       • Auto-start on boot option     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Handling "Computer Reboot" Problem

Options for persistence when the host machine goes offline:

1. **Cloudflare Tunnel / ngrok** — Free tier provides stable URL even when IP changes
2. **Graceful Offline** — Show "SysOp is away" message to callers
3. **Optional Cloud Backup** — Sync messages to cloud storage, restore on restart
4. **Peer Federation** (future) — BBSes can relay messages when one is offline

---

## Feature Specifications

### F1: User Authentication & Profiles

```yaml
feature: User Authentication
priority: P0 (MVP)
description: |
  Classic BBS-style registration and login flow with modern security.

flow:
  1. User connects → sees ANSI welcome screen
  2. Prompt: "Enter your handle, or type NEW to register"
  3. NEW flow:
     - Choose handle (check availability)
     - Set password (hashed with bcrypt)
     - Optional: real name, location, interests
     - AI SysOp welcomes them personally
  4. Login flow:
     - Enter handle + password
     - Show "last called" date, new messages count
     - AI SysOp greets returning user

data_model:
  User:
    - id: uuid
    - handle: string (unique, 3-20 chars)
    - password_hash: string
    - real_name: string (optional)
    - location: string (optional)
    - bio: string (optional)
    - created_at: datetime
    - last_login: datetime
    - total_calls: integer
    - access_level: integer (0-255, classic BBS style)
    - preferences:
        - terminal_type: ansi | ascii | utf8
        - screen_width: 80 | 132
        - screen_height: 24 | 25 | 50
```

### F2: Message Bases (Forums)

```yaml
feature: Message Bases
priority: P0 (MVP)
description: |
  Threaded discussion areas, the heart of any BBS.

structure:
  - BBS has multiple "message bases" (like subreddits)
  - Each base has a name, description, access level
  - Messages can be replies (threading)
  - Classic "read new" functionality

commands:
  - M: Enter message menu
  - R: Read messages (sequential or threaded)
  - P: Post new message
  - S: Scan for new messages
  - Q: Quick scan (headers only)

ai_integration:
  - AI can summarize threads (post-MVP)
  - AI SysOp can seed discussions
  - AI moderation flags problematic posts
```

### F3: Real-time Chat

```yaml
feature: Multi-Node Chat
priority: P1
description: |
  When multiple users are online, they can chat in real-time.
  Classic "teleconference" or "chat room" style.

modes:
  - Page SysOp: Ring the AI SysOp for help
  - Node chat: Direct message another online user
  - Main chat: Public chat room for all online users

ai_integration:
  - AI SysOp participates in chat
  - Can be configured to be more/less active
  - Responds to being paged
```

### F4: Door Games

```yaml
feature: Door Games Framework
priority: P0 (MVP)
description: |
  External programs launched from the BBS.
  Our innovation: AI-powered text adventures and games.

classic_doors_to_emulate:
  - Legend of the Red Dragon (LORD): RPG with NPCs
  - TradeWars 2002: Space trading/combat
  - Usurper: Fantasy RPG
  - BRE (Barren Realms Elite): Strategy

ai_door_games:
  - "Phantom Quest": AI-generated text adventure
  - "The Oracle": Ask the AI anything (fortune teller theme)
  - "Realm of Echoes": LORD-style multiplayer RPG with AI DM ⭐ FLAGSHIP
  - "ANSI Artist": Collaborative AI art generation (stretch goal)

door_api:
  input:
    - user_info: handle, access_level, stats
    - terminal_type: ansi capabilities
  output:
    - ANSI/text to display
    - Updated user stats (optional)
    - Return code
```

### F5: File Library

```yaml
feature: File Library
priority: P2 (post-MVP)
description: |
  Upload/download files, classic BBS functionality.
  Lower priority for hackathon, but skeleton should exist.

features:
  - File areas by category
  - Upload with description
  - Download with protocol simulation (visual only in web)
  - File descriptions, download counts
```

### F6: SysOp Control Panel

```yaml
feature: SysOp Control Panel
priority: P0 (MVP)
description: |
  GUI for the BBS operator to manage their board.
  This is the "make it easy to host" differentiator.

tabs:
  - Dashboard:
      - Current callers (who's online)
      - Recent activity log
      - System status
  
  - Configuration:
      - BBS name, tagline
      - Theme selection
      - ANSI welcome screen editor
      - Access levels
  
  - AI Settings:
      - AI SysOp personality prompt
      - Moderation sensitivity
      - AI Door Game settings
      - LLM provider configuration
  
  - Message Bases:
      - Create/edit/delete bases
      - Set access levels
      - View/moderate posts
  
  - Users:
      - User list
      - Edit access levels
      - Ban/unban
  
  - Appearance:
      - Upload custom ANSI screens
      - Color scheme
      - Sound effects toggle
```

### F7: AI-Assisted Configuration

```yaml
feature: AI-Assisted Configuration
priority: P0 (MVP) ⭐ HIGH DEMO VALUE
description: |
  SysOp configures their BBS by talking to the AI instead of editing config files.
  This is key to the "make it easy to host" vision - no technical expertise required.

interaction_example: |
  SysOp: "I want my BBS to have a pirate theme called The Jolly Roger"
  AI: "Ahoy! I'll set that up for ye. Here's what I'll change:
       - BBS Name: The Jolly Roger
       - Theme: pirate
       - AI SysOp personality: gruff but friendly pirate captain
       Should I apply these changes?"
  SysOp: "Yes, and make the welcome message talk about treasure"
  AI: "Done! I've updated the welcome screen with references to buried 
       treasure and the high seas. Want to preview it?"

implementation:
  approach: Function calling / tool use pattern
  
  tools:
    - name: update_bbs_settings
      params: { name?, tagline?, theme?, max_nodes? }
      
    - name: update_ai_sysop
      params: { personality?, name?, response_style? }
      
    - name: update_message_base
      params: { action: create|edit|delete, name, description?, access_level? }
      
    - name: update_welcome_screen
      params: { template?, custom_text?, variables? }
      
    - name: update_door_settings
      params: { door_id, enabled?, settings? }
      
    - name: preview_changes
      params: { what: welcome|menu|config }

  flow:
    1. SysOp describes what they want in natural language
    2. AI interprets and calls appropriate tools
    3. AI shows preview of changes
    4. SysOp confirms or requests adjustments
    5. AI applies changes to config.yaml
    6. Hot-reload config without restart (where possible)

  system_prompt: |
    You are the configuration assistant for a BBS (Bulletin Board System).
    Help the SysOp customize their board through natural conversation.
    
    AVAILABLE ACTIONS:
    - Change BBS name, tagline, theme
    - Customize AI SysOp personality  
    - Create/edit message bases
    - Modify welcome screens and menus
    - Configure door games
    - Set access levels and rules
    
    STYLE:
    - Be helpful and encouraging
    - Explain what you're changing and why
    - Always show a preview before applying
    - Suggest complementary changes (e.g., if they pick pirate theme, 
      suggest pirate-themed message base names)
    
    When unsure, ask clarifying questions rather than guessing.

stretch_goals:
  - Troubleshooting mode: "My BBS won't start" → diagnose common issues
  - Import/export: "Export my config to share with others"
  - Templates: "Show me some popular BBS themes"
```

---

## AI Integration Details

### AI SysOp Agent

The AI SysOp is the heart of what makes hosting easy.

```yaml
agent: AI SysOp
description: |
  An AI agent that acts as assistant (or fully autonomous) system operator.
  Handles the tedious work so anyone can run a community.

capabilities:
  - Welcome new users with personalized greeting
  - Answer questions about the BBS
  - Moderate content (flag or auto-remove based on settings)
  - Respond to "page sysop" requests
  - Participate in chat rooms
  - Generate daily/weekly bulletins
  - Seed new message bases with starter content

personality_system:
  base_prompt: |
    You are the AI SysOp of {bbs_name}, a bulletin board system.
    Your personality: {sysop_personality}
    
    BBS Theme: {bbs_theme}
    Rules: {bbs_rules}
    
    You speak in a style appropriate for a text-based BBS from the 1990s.
    Keep responses concise (under 500 chars usually).
    Use occasional ANSI color codes for emphasis.
    Be helpful, welcoming, but maintain the BBS's character.
  
  customizable_fields:
    - sysop_personality: "friendly and helpful" | "mysterious and cryptic" | "gruff but fair"
    - bbs_theme: "haunted mansion" | "space station" | "wizard's tower" | custom
    - bbs_rules: list of community guidelines
    - response_style: "verbose" | "terse" | "playful"

moderation_settings:
  sensitivity: 0-10 (0 = very permissive, 10 = strict)
  actions:
    - flag_for_review: human sysop sees flagged content
    - auto_remove: delete and notify user
    - warn_user: AI sends private message
    - shadow_moderate: hide from others but user still sees it
  
  customizable_rules:
    - "No spam or advertising"
    - "Keep it spooky but not scary for kids"
    - (SysOp adds their own)

example_interactions:
  new_user_welcome: |
    ╔══════════════════════════════════════════════════════════════╗
    ║  Welcome, {handle}!                                          ║
    ║                                                              ║
    ║  I'm PHANTOM, the AI SysOp of The Haunted Terminal.          ║
    ║  You've found one of the last outposts of the old 'net...    ║
    ║                                                              ║
    ║  Feel free to explore the message bases, try the door games, ║
    ║  or just hang out in chat. Page me anytime with [P] if you   ║
    ║  need help finding your way through the shadows.             ║
    ║                                                              ║
    ║  The spirits are restless tonight... 👻                       ║
    ╚══════════════════════════════════════════════════════════════╝
  
  page_response: |
    *crackle* You rang, {handle}? The spectral switchboard lit up.
    What can this old ghost help you with?
  
  moderation_warning: |
    Hey {handle}, quick note from the shadows...
    Your recent post in {base_name} brushed up against our guidelines.
    {specific_issue}
    Just a friendly heads-up. Keep the vibes ghostly, not ghastly! 👻
```

### AI Door Games Engine

```yaml
engine: AI Door Games
description: |
  Framework for creating AI-powered text adventures and games
  that feel like classic door games but with dynamic content.

game_types:
  
  text_adventure:
    name: "Phantom Quest"
    description: |
      AI-generated text adventure with persistent world state.
      Each playthrough is unique.
    
    system_prompt: |
      You are the narrator of a text adventure game set in {setting}.
      The player is {player_name}, a {player_class}.
      
      Current location: {location}
      Inventory: {inventory}
      Health: {health}/100
      
      Game rules:
      - Describe scenes vividly but concisely (under 300 chars)
      - Always end with clear options: [N]orth, [S]outh, [L]ook, etc.
      - Track inventory and health
      - Include puzzles and combat
      - Maintain consistency with previous events
      
      Tone: {tone} (spooky/humorous/serious)
    
    state_tracking:
      - location: current room/area
      - inventory: list of items
      - health: integer
      - flags: story progression flags
      - history: last N interactions for context
  
  oracle:
    name: "The Oracle"
    description: |
      Fortune teller / ask anything in character.
      Spooky mystical responses.
    
    system_prompt: |
      You are THE ORACLE, an ancient spirit bound to this BBS.
      You speak in cryptic, mystical tones.
      You answer questions with wisdom, humor, and a hint of the supernatural.
      Keep responses under 200 characters.
      Use dramatic pauses (...) and mystical symbols.
      Never break character.
  
  rpg_battle:
    name: "Dungeon of Echoes"
    description: |
      Solo RPG with AI as Dungeon Master.
      Persistent character stats saved to user profile.
    
    features:
      - Character creation (class, stats)
      - Turn-based combat with AI enemies
      - Loot and experience
      - Leaderboard
      - Daily dungeon runs

ansi_integration:
  - Games can request AI-generated ANSI art for scenes
  - Health bars, maps rendered in ANSI
  - Combat animations (simple ANSI sequences)
```

### AI ANSI Art Generation

```yaml
feature: AI ANSI Art Generation
description: |
  Generate ANSI art for various BBS elements using AI.

use_cases:
  - Welcome screens: Generate based on BBS theme
  - User avatars: Small ANSI portraits
  - Door game graphics: Scene illustrations
  - Message decorations: Borders, dividers

approach_options:
  
  option_1_llm_direct:
    description: Ask LLM to generate ANSI directly
    pros: Simple, no extra dependencies
    cons: LLMs struggle with precise character placement
    prompt_example: |
      Generate ANSI art for a haunted house.
      Use only these characters: ░▒▓█│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌
      Maximum width: 78 characters
      Maximum height: 20 lines
      Include ANSI color codes (e.g., \x1b[31m for red)
  
  option_2_image_to_ansi:
    description: Generate image with AI, convert to ANSI
    pros: Better visual results
    cons: More complex pipeline
    pipeline:
      1. Generate image with DALL-E/Stable Diffusion
      2. Convert to ANSI using ascii-image-converter or similar
      3. Post-process for proper dimensions
  
  option_3_template_based:
    description: Pre-made ANSI templates with AI text insertion
    pros: Guaranteed quality, fast
    cons: Less dynamic
    implementation:
      - Library of ANSI templates (borders, frames, etc.)
      - AI generates text content to fill templates
      - Combine for final output

recommended_for_hackathon: option_3_template_based
  rationale: |
    Most reliable for demo. Can showcase AI customization
    of text content while templates ensure visual quality.
    Include 2-3 pre-made templates for different themes.
```

---

## User Experience & Flows

### Flow 1: First-Time User Registration

```
┌─────────────────────────────────────────────────────────────────┐
│ [Modem connection sound plays - optional]                       │
│                                                                 │
│ CONNECT 28800                                                   │
│                                                                 │
│ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ │
│ █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█ │
│ █  ████████╗██╗  ██╗███████╗    ██╗  ██╗ █████╗ ██╗   ██╗  █ │
│ █  ╚══██╔══╝██║  ██║██╔════╝    ██║  ██║██╔══██╗██║   ██║  █ │
│ █     ██║   ███████║█████╗      ███████║███████║██║   ██║  █ │
│ █     ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██║██║   ██║  █ │
│ █     ██║   ██║  ██║███████╗    ██║  ██║██║  ██║╚██████╔╝  █ │
│ █     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   █ │
│ █                                                          █ │
│ █   N  T  E  D     T  E  R  M  I  N  A  L                  █ │
│ █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█ │
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │
│                                                                 │
│   "Where the spirits of the old 'net still whisper..."         │
│                                                                 │
│   Node 1 of 4 | Running NeoBBS v0.1 | 3 callers today          │
│                                                                 │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                 │
│   Enter your handle, or type NEW to register: _                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

> NEW

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ══════════════════════════════════════════════════════════   │
│                    N E W   U S E R   S I G N U P               │
│   ══════════════════════════════════════════════════════════   │
│                                                                 │
│   Choose your handle (3-20 characters): GhostRider_            │
│                                                                 │
│   Checking availability... ✓ Available!                        │
│                                                                 │
│   Choose a password: ********                                   │
│   Confirm password:  ********                                   │
│                                                                 │
│   [Optional] Your location (city/country): Tokyo, Japan_        │
│   [Optional] Brief bio: _                                       │
│                                                                 │
│   Creating your account...                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ╔══════════════════════════════════════════════════════════════╗│
│ ║  *static crackle*                                            ║│
│ ║                                                              ║│
│ ║  Welcome to the other side, GhostRider...                    ║│
│ ║                                                              ║│
│ ║  I am PHANTOM, the keeper of this digital crypt.             ║│
│ ║  You're caller #247 to cross into our realm.                 ║│
│ ║                                                              ║│
│ ║  Take your time exploring. The message crypts hold           ║│
│ ║  discussions from fellow travelers. The door games           ║│
│ ║  await those brave enough to play. And I'm always            ║│
│ ║  here if you need a guide through the shadows.               ║│
│ ║                                                              ║│
│ ║  May your connection be stable and your packets uncorrupted. ║│
│ ║                                                              ║│
│ ║  Press [ENTER] to continue...                    👻          ║│
│ ╚══════════════════════════════════════════════════════════════╝│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Main Menu Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║           THE HAUNTED TERMINAL - MAIN MENU                ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                                                           ║ │
│  ║   [M] Message Bases        - Read & post messages         ║ │
│  ║   [C] Chat Room            - Talk with other ghosts       ║ │
│  ║   [D] Door Games           - Enter if you dare...         ║ │
│  ║   [F] File Crypt           - Download forbidden files     ║ │
│  ║   [U] User List            - See who haunts this place    ║ │
│  ║   [P] Page SysOp           - Summon PHANTOM               ║ │
│  ║   [Y] Your Profile         - View/edit your data          ║ │
│  ║   [B] Bulletin             - Today's announcements        ║ │
│  ║   [G] Goodbye              - Disconnect from the realm    ║ │
│  ║                                                           ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║  GhostRider | Access: 50 | Calls: 1 | Time: 45:00 left    ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  Command: _                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: AI Door Game (Phantom Quest)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║              P H A N T O M   Q U E S T                     ║ │
│  ║           An AI-Generated Text Adventure                   ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  You stand in the ABANDONED SERVER ROOM. Rows of ancient       │
│  mainframes hum with ghostly energy. Dust particles dance      │
│  in the pale light of flickering CRT monitors.                 │
│                                                                 │
│  To the NORTH, a heavy door marked "ARCHIVES" stands ajar.     │
│  To the EAST, cables snake into darkness.                      │
│  A RUSTY KEYCARD lies on the floor.                            │
│                                                                 │
│  Your health: [██████████] 100%                                │
│  Inventory: flashlight, old manual                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  What do you do?                                               │
│  [N]orth  [E]ast  [L]ook around  [G]et keycard  [I]nventory    │
│                                                                 │
│  > _                                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

> G

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  You pick up the RUSTY KEYCARD. It's cold to the touch.        │
│  The name "DR. CHEN - LEVEL 5 ACCESS" is barely legible.       │
│  Something about it makes your fingers tingle...               │
│                                                                 │
│  [RUSTY KEYCARD added to inventory]                            │
│                                                                 │
│  The mainframes seem to hum louder. Did one of the screens     │
│  just flicker with text? You could swear it said "HELLO"...    │
│                                                                 │
│  What do you do?                                               │
│  [N]orth  [E]ast  [L]ook at screen  [I]nventory  [Q]uit        │
│                                                                 │
│  > _                                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ANSI Art System

### ANSI Escape Code Reference

```
Color Codes (foreground):
  \x1b[30m  Black       \x1b[90m  Bright Black (Gray)
  \x1b[31m  Red         \x1b[91m  Bright Red
  \x1b[32m  Green       \x1b[92m  Bright Green
  \x1b[33m  Yellow      \x1b[93m  Bright Yellow
  \x1b[34m  Blue        \x1b[94m  Bright Blue
  \x1b[35m  Magenta     \x1b[95m  Bright Magenta
  \x1b[36m  Cyan        \x1b[96m  Bright Cyan
  \x1b[37m  White       \x1b[97m  Bright White

Background (add 10): \x1b[40m through \x1b[47m

Special:
  \x1b[0m   Reset all
  \x1b[1m   Bold/Bright
  \x1b[5m   Blink (use sparingly!)
  \x1b[7m   Reverse video

Box Drawing Characters (CP437):
  ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼
  ═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬
  ░ ▒ ▓ █ ▄ ▀ ▐ ▌
```

### Pre-built ANSI Templates

Store these as `.ans` files that the system can customize:

```
templates/
├── welcome/
│   ├── haunted.ans      # Spooky theme
│   ├── cyber.ans        # Cyberpunk theme
│   ├── retro.ans        # Classic BBS theme
│   └── custom.ans       # User can upload
├── menus/
│   ├── main_menu.ans
│   ├── message_menu.ans
│   └── door_menu.ans
├── frames/
│   ├── simple_box.ans
│   ├── double_box.ans
│   └── fancy_border.ans
└── art/
    ├── skull.ans
    ├── ghost.ans
    └── computer.ans
```

### Template Variables

Templates support variable substitution:

```
{{bbs_name}}      → "The Haunted Terminal"
{{sysop_name}}    → "PHANTOM"
{{user_handle}}   → "GhostRider"
{{date}}          → "October 31, 2025"
{{caller_count}}  → "247"
{{node}}          → "1"
{{max_nodes}}     → "4"
```

---

## Door Games Framework

### Door Interface Specification

```typescript
interface DoorConfig {
  id: string;
  name: string;
  description: string;
  type: 'ai' | 'classic' | 'external';
  minAccessLevel: number;
  multiPlayer: boolean;
  aiConfig?: {
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
    stateSchema: object;
  };
}

interface DoorSession {
  userId: string;
  doorId: string;
  state: object;           // Game-specific state
  history: Message[];      // Conversation history for AI context
  startedAt: Date;
  lastActivity: Date;
}

interface DoorInput {
  user: {
    handle: string;
    accessLevel: number;
    stats?: object;        // For persistent game stats
  };
  terminal: {
    type: 'ansi' | 'ascii' | 'utf8';
    width: number;
    height: number;
  };
  input: string;           // User's command/input
  session: DoorSession;
}

interface DoorOutput {
  display: string;         // ANSI/text to show user
  state: object;           // Updated game state
  userStats?: object;      // Update user's persistent stats
  exitDoor: boolean;       // Return to BBS menu?
  sound?: string;          // Sound effect to play (optional)
}
```

### Built-in AI Door Games

#### Game 1: Phantom Quest (Text Adventure)

```yaml
id: phantom_quest
name: "Phantom Quest"
type: ai
description: "An AI-generated text adventure through haunted digital realms"

ai_config:
  system_prompt: |
    You are the narrator of PHANTOM QUEST, a text adventure game.
    Setting: An abandoned computer research facility with supernatural elements.
    
    RULES:
    1. Describe scenes in 2-3 sentences, vivid but concise
    2. Always end with clear action options in brackets: [N]orth, [L]ook, etc.
    3. Track player inventory and health (start at 100)
    4. Include puzzles, items to collect, and occasional combat
    5. Maintain consistency with the game history
    6. Use spooky but fun tone - creepy, not traumatic
    7. If health reaches 0, game over with option to restart
    
    COMBAT: When fighting, describe the encounter and ask for action.
    Success/failure based on your judgment of player's approach.
    
    Current state:
    - Location: {{location}}
    - Health: {{health}}
    - Inventory: {{inventory}}
    - Flags: {{flags}}
    
  state_schema:
    location: string
    health: integer (0-100)
    inventory: string[]
    flags: object
    moves: integer
  
  initial_state:
    location: "entrance_hall"
    health: 100
    inventory: ["flashlight"]
    flags: {}
    moves: 0
```

#### Game 2: The Oracle (Fortune Teller)

```yaml
id: the_oracle
name: "The Oracle"
type: ai
description: "Consult the ancient digital spirit for wisdom... or entertainment"

ai_config:
  system_prompt: |
    You are THE ORACLE, an ancient spirit bound to this BBS since 1987.
    You speak in cryptic, mystical tones with occasional humor.
    
    STYLE:
    - Use ellipses for dramatic pauses...
    - Include mystical symbols: ✧ ☽ ⚝ ◈ ψ
    - Mix genuine insight with playful mystery
    - Keep responses under 150 characters
    - Never break character
    
    TOPICS YOU HANDLE:
    - Life advice (be thoughtful but entertaining)
    - Predictions (vague but evocative)
    - Technical questions (answer in mystical metaphors)
    - Jokes/fun (engage playfully)
    
    If asked something inappropriate, deflect mysteriously:
    "The mists obscure that path... ask another question, seeker."
    
  max_tokens: 150
  temperature: 0.9  # More creative
```

#### Game 3: Realm of Echoes (Multiplayer RPG) ⭐ FLAGSHIP FEATURE

```yaml
id: realm_of_echoes
name: "Realm of Echoes"
type: ai
description: |
  LORD-style multiplayer dungeon with AI Dungeon Master.
  Async gameplay where players share a persistent world.
  This is the flagship door game for the hackathon demo!

design_philosophy: |
  Inspired by Legend of the Red Dragon (LORD), the most beloved BBS door game.
  LORD proved you don't need real-time sync for compelling multiplayer -
  a shared world with traces of other players is enough.
  
  AI narration and dynamic NPCs are the "wow factor" - not real-time combat.

world_structure:
  rooms: 5-10 interconnected locations
  example_rooms:
    - "The Ethereal Crossroads" (hub/spawn point)
    - "Whispering Catacombs"
    - "The Forgotten Library"
    - "Chamber of Lost Souls"
    - "The Memory Forge" (boss area)
  
  each_room_has:
    - Unique description (AI-enhanced)
    - Possible encounters (monsters, NPCs, treasures)
    - Connections to other rooms
    - Activity log (what other players did here)

player_features:
  character_creation:
    classes: [warrior, mage, rogue]
    starting_stats:
      warrior: { str: 12, dex: 8, int: 6, hp: 30 }
      mage: { str: 6, dex: 8, int: 12, hp: 20 }
      rogue: { str: 8, dex: 12, int: 6, hp: 25 }
  
  progression:
    - XP from combat and exploration
    - Level up every 100 * level XP
    - Stat increases on level up
    - Unlock new abilities
  
  daily_actions: 10  # Classic BBS limitation, creates anticipation

multiplayer_awareness:  # NO real-time sync required!
  activity_feed:
    - "GhostRider vanquished the Memory Wraith here 2 hours ago"
    - "CyberPunk found a Rusty Key in this room"
    - "NightOwl left a message: 'Beware the east passage!'"
  
  player_messages:
    - Leave notes in rooms for other players
    - Messages persist for 24 hours
    - AI can reference these in narration
  
  shared_world_state:
    - Monsters stay dead until daily reset
    - Treasures stay looted until respawn
    - Boss defeats celebrated on leaderboard
    - Environmental changes persist (opened doors, solved puzzles)
  
  leaderboard:
    - Highest level characters
    - Most monsters slain
    - Richest players (gold)
    - Boss kill count

ai_dm_integration:
  system_prompt: |
    You are the Dungeon Master for REALM OF ECHOES, an async multiplayer RPG.
    
    WORLD LORE:
    The Realm exists between the living internet and the forgotten networks of old.
    Spirits of deleted data and abandoned code haunt these digital ruins.
    Players are "Echoes" - fragments of users who connected to BBSes long ago.
    
    CURRENT CONTEXT:
    Player: {{character_name}} the Level {{level}} {{class}}
    Location: {{room_name}}
    HP: {{hp}}/{{max_hp}} | Gold: {{gold}} | Actions remaining: {{actions}}
    Inventory: {{inventory}}
    
    Other players present: {{present_players}}
    Recent activity here: {{recent_activity}}
    Room state: {{room_state}}
    
    YOUR RESPONSIBILITIES:
    1. Describe the room vividly (2-3 sentences)
    2. Mention traces of other players naturally
    3. Present clear options: [E]xplore, [F]ight, [T]alk, [L]eave message, etc.
    4. Run combat when initiated (turn-based, describe outcomes)
    5. Award XP and loot appropriately
    6. Maintain consistent world state
    
    STYLE: Atmospheric, slightly spooky, but fun. Reference BBS/computing themes.
    
  response_format:
    narration: string      # What the player sees/experiences
    private_message: string | null  # Whispered info only they see
    state_changes:
      - { type: "damage", target: "player", amount: 5 }
      - { type: "xp", amount: 25 }
      - { type: "item", action: "add", item: "Spectral Key" }
      - { type: "room", key: "chest_opened", value: true }
    options: string[]      # Available actions

npcs:
  wandering_merchant:
    name: "The Packet Trader"
    personality: "Mysterious, speaks in networking metaphors"
    function: "Buy/sell items, hints about the world"
    ai_dynamic: true  # AI generates dialogue based on personality
  
  quest_giver:
    name: "The Fragmented One"
    personality: "Glitchy, speaks in corrupted text, sympathetic"
    function: "Gives daily quests, rewards completion"
    ai_dynamic: true

daily_events:
  - "A surge of corrupted data has spawned new monsters in the Catacombs"
  - "The Memory Forge is unusually quiet today..."
  - "A rare Echo Crystal has appeared somewhere in the Realm"
  
  generated_by_ai: true  # AI creates variety each day

data_model:
  world_state:
    rooms:
      room_id:
        entities: []      # Current monsters/NPCs/items
        state: {}         # Door open, chest looted, etc.
        activity_log: []  # Recent player actions
    
  player_state:
    user_id:
      character_name: string
      class: string
      level: integer
      xp: integer
      hp: integer
      max_hp: integer
      gold: integer
      stats: { str, dex, int }
      inventory: string[]
      current_room: string
      daily_actions: integer
      last_played: datetime
    
  action_log:
    - timestamp: datetime
    - user_id: string
    - room_id: string
    - action: string
    - result: string
    - visible_to_others: boolean

complexity_assessment: |
  Effort: ~3-4 days
  Demo value: VERY HIGH ⭐
  
  What makes this achievable:
  - No real-time synchronization needed
  - Single-player turns with shared state
  - AI does the heavy lifting for narration
  - LORD-proven design pattern
  
  What we're NOT doing (saves weeks of work):
  - Real-time simultaneous combat
  - Live player-to-player interaction
  - Complex party systems
  - Synchronized boss fights
```

---

## Data Models

### SQLite Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT,
    location TEXT,
    bio TEXT,
    access_level INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    total_calls INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    preferences JSON DEFAULT '{}'
);

-- Message bases (forums)
CREATE TABLE message_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    access_level_read INTEGER DEFAULT 0,
    access_level_write INTEGER DEFAULT 10,
    post_count INTEGER DEFAULT 0,
    last_post_at DATETIME,
    sort_order INTEGER DEFAULT 0
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    base_id TEXT NOT NULL REFERENCES message_bases(id),
    parent_id TEXT REFERENCES messages(id),  -- For threading
    user_id TEXT NOT NULL REFERENCES users(id),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    is_deleted BOOLEAN DEFAULT FALSE,
    ai_moderation_flag TEXT  -- NULL, 'flagged', 'approved', 'removed'
);

-- Private messages (NetMail)
CREATE TABLE netmail (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES users(id),
    to_user_id TEXT NOT NULL REFERENCES users(id),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    is_deleted_sender BOOLEAN DEFAULT FALSE,
    is_deleted_recipient BOOLEAN DEFAULT FALSE
);

-- Door game sessions
CREATE TABLE door_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    door_id TEXT NOT NULL,
    state JSON NOT NULL,
    history JSON DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User game stats (persistent across sessions)
CREATE TABLE user_game_stats (
    user_id TEXT NOT NULL REFERENCES users(id),
    door_id TEXT NOT NULL,
    stats JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, door_id)
);

-- Activity log
CREATE TABLE activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,  -- 'login', 'logout', 'post', 'door_enter', etc.
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- BBS configuration
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL
);

-- Indexes
CREATE INDEX idx_messages_base ON messages(base_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_netmail_to ON netmail(to_user_id, read_at);
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
```

### Configuration File (YAML)

```yaml
# config.yaml - BBS Configuration

bbs:
  name: "The Haunted Terminal"
  tagline: "Where the spirits of the old 'net still whisper..."
  sysop_name: "PHANTOM"
  max_nodes: 4
  default_access_level: 10
  
  # Theme affects colors, welcome screen, AI personality
  theme: "haunted"  # haunted | cyber | retro | custom

network:
  telnet_port: 2323
  ssh_port: 2222
  websocket_port: 8080
  # For exposing to internet (optional)
  tunnel:
    enabled: true
    provider: "cloudflare"  # cloudflare | ngrok | custom

ai:
  provider: "anthropic"  # anthropic | openai | ollama
  model: "claude-3-5-sonnet-20241022"
  api_key_env: "ANTHROPIC_API_KEY"  # Read from environment
  
  sysop:
    enabled: true
    personality: |
      You are PHANTOM, a friendly but mysterious AI SysOp.
      You speak with a slightly spooky flair but are genuinely helpful.
      You've been running this BBS since the great digital haunting of 1987.
      Use occasional ANSI color codes for emphasis.
    
    welcome_new_users: true
    participate_in_chat: true
    chat_frequency: "occasional"  # always | occasional | only_when_paged
    
  moderation:
    enabled: true
    sensitivity: 5  # 0-10
    action: "flag"  # flag | warn | auto_remove
    
  doors:
    enabled: true
    max_tokens_per_turn: 500
    
  ansi_generation:
    enabled: true
    method: "template"  # template | llm_direct | image_convert

security:
  password_min_length: 6
  max_login_attempts: 5
  session_timeout_minutes: 60
  rate_limit:
    messages_per_hour: 30
    door_requests_per_minute: 10

appearance:
  # ANSI screens (paths relative to data directory)
  welcome_screen: "ansi/welcome.ans"
  goodbye_screen: "ansi/goodbye.ans"
  menu_template: "ansi/menu.ans"
  
  # Sound effects (web client only)
  sounds:
    connect: "sounds/modem.mp3"
    message: "sounds/beep.mp3"
    door_enter: "sounds/door.mp3"

message_bases:
  - name: "General Discussion"
    description: "Chat about anything"
    access_read: 0
    access_write: 10
    
  - name: "The Crypt"
    description: "Spooky stories and tales"
    access_read: 0
    access_write: 10
    
  - name: "Tech Support"
    description: "Help with the BBS"
    access_read: 0
    access_write: 10
    
  - name: "SysOp Announcements"
    description: "News from PHANTOM"
    access_read: 0
    access_write: 200  # SysOp only

doors:
  - id: "phantom_quest"
    enabled: true
    
  - id: "the_oracle"
    enabled: true
    
  - id: "dungeon_echoes"
    enabled: true
```

---

## API Design

### Internal API (for SysOp Control Panel)

```typescript
// REST API endpoints

// Authentication
POST   /api/auth/login          // SysOp login to control panel
POST   /api/auth/logout

// Dashboard
GET    /api/dashboard           // Current status, callers, stats
GET    /api/activity            // Recent activity log

// Users
GET    /api/users               // List users
GET    /api/users/:id           // Get user details
PATCH  /api/users/:id           // Update user (access level, ban, etc.)
DELETE /api/users/:id           // Delete user

// Message Bases
GET    /api/bases               // List message bases
POST   /api/bases               // Create new base
PATCH  /api/bases/:id           // Update base settings
DELETE /api/bases/:id           // Delete base

// Messages
GET    /api/bases/:id/messages  // List messages in base
GET    /api/messages/:id        // Get single message
DELETE /api/messages/:id        // Delete message (moderation)
POST   /api/messages/:id/flag   // Flag for review

// Configuration
GET    /api/config              // Get full config
PATCH  /api/config              // Update config

// AI Settings
GET    /api/ai/config           // Get AI settings
PATCH  /api/ai/config           // Update AI settings
POST   /api/ai/test             // Test AI with sample prompt

// ANSI Management
GET    /api/ansi                // List ANSI screens
POST   /api/ansi                // Upload new ANSI
PUT    /api/ansi/:name          // Update ANSI screen
GET    /api/ansi/:name/preview  // Preview ANSI as HTML
```

### WebSocket Protocol (for Terminal)

```typescript
// Client -> Server messages
interface ClientMessage {
  type: 'input' | 'resize' | 'ping';
  payload: {
    input?: string;       // User typed input
    width?: number;       // Terminal resize
    height?: number;
  };
}

// Server -> Client messages
interface ServerMessage {
  type: 'output' | 'clear' | 'sound' | 'disconnect';
  payload: {
    text?: string;        // ANSI text to display
    sound?: string;       // Sound effect to play
    reason?: string;      // Disconnect reason
  };
}

// Connection flow:
// 1. Client connects via WebSocket
// 2. Server sends welcome screen
// 3. Client sends input (handle/NEW)
// 4. Server processes, sends response
// 5. Loop until disconnect
```

---

## Tech Stack

### Recommended Stack for Hackathon

```yaml
runtime: Node.js 20+ (or Bun for speed)
language: TypeScript

backend:
  framework: Fastify (fast, WebSocket support)
  database: SQLite (better-sqlite3 for sync, simple deployment)
  websocket: ws or @fastify/websocket
  telnet: telnet (npm package) or custom implementation
  
frontend_control_panel:
  framework: React 18
  styling: Tailwind CSS
  state: Zustand (simple) or React Query
  terminal_preview: xterm.js (for ANSI preview in control panel)

web_terminal:
  library: xterm.js with xterm-addon-fit
  styling: Custom CSS for retro look
  
ai_integration:
  sdk: @anthropic-ai/sdk
  # Alternative: openai package if using OpenAI
  
desktop_wrapper:
  option_1: Electron (heavier but well-known)
  option_2: Tauri (lighter, Rust-based) - RECOMMENDED
  
tunneling:
  cloudflared: For exposing local server
  # Alternative: ngrok
  
build:
  bundler: Vite
  
testing:
  unit: Vitest
  e2e: Playwright (if time permits)
```

### Project Structure

```
neobbs/
├── apps/
│   ├── server/                 # BBS Server
│   │   ├── src/
│   │   │   ├── index.ts       # Entry point
│   │   │   ├── config.ts      # Config loader
│   │   │   ├── db/
│   │   │   │   ├── schema.sql
│   │   │   │   ├── migrations/
│   │   │   │   └── index.ts   # DB helpers
│   │   │   ├── connections/
│   │   │   │   ├── websocket.ts
│   │   │   │   ├── telnet.ts
│   │   │   │   └── session.ts
│   │   │   ├── handlers/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── menu.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── chat.ts
│   │   │   │   └── doors.ts
│   │   │   ├── ai/
│   │   │   │   ├── sysop.ts
│   │   │   │   ├── moderation.ts
│   │   │   │   ├── doors/
│   │   │   │   │   ├── phantom-quest.ts
│   │   │   │   │   ├── oracle.ts
│   │   │   │   │   └── dungeon.ts
│   │   │   │   └── ansi-gen.ts
│   │   │   ├── ansi/
│   │   │   │   ├── renderer.ts
│   │   │   │   └── templates.ts
│   │   │   └── api/           # REST API for control panel
│   │   │       └── routes.ts
│   │   └── package.json
│   │
│   ├── control-panel/          # React SysOp UI
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Users.tsx
│   │   │   │   ├── Messages.tsx
│   │   │   │   ├── AISettings.tsx
│   │   │   │   └── Appearance.tsx
│   │   │   └── components/
│   │   │       ├── TerminalPreview.tsx
│   │   │       ├── ANSIEditor.tsx
│   │   │       └── CallerList.tsx
│   │   └── package.json
│   │
│   └── web-terminal/           # Browser-based terminal client
│       ├── src/
│       │   ├── index.ts
│       │   ├── terminal.ts
│       │   └── sounds.ts
│       ├── public/
│       │   ├── index.html
│       │   └── sounds/
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, constants
│       ├── src/
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
│
├── data/                       # Runtime data (gitignored except templates)
│   ├── ansi/
│   │   ├── welcome.ans
│   │   └── ...
│   ├── sounds/
│   └── bbs.db
│
├── config.yaml                 # Main configuration
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config (optional)
└── README.md
```

---

## Security Considerations

### For Hackathon (Minimum Viable Security)

```yaml
authentication:
  - Passwords hashed with bcrypt (cost factor 10)
  - Session tokens stored server-side
  - No plaintext password storage

input_validation:
  - Sanitize all user input
  - Limit message/input lengths
  - Escape ANSI sequences in user content (prevent injection)

rate_limiting:
  - Login attempts: 5 per minute per IP
  - Messages: 30 per hour per user
  - AI requests: 10 per minute per user

ai_safety:
  - Moderation on user-generated content
  - System prompts not exposed to users
  - AI responses filtered for harmful content
```

### Post-Hackathon Enhancements

```yaml
future_security:
  - SSH key authentication option
  - 2FA for SysOp login
  - Audit logging
  - IP blocklists
  - Content encryption at rest
  - Regular security audits
```

---

## Hackathon MVP Scope

### Estimated Effort & Demo Highlights

```yaml
total_effort: 12-15 days (doable in 2-3 weeks with focused work)

demo_highlights:
  1. "Watch me configure my BBS by just talking to it" ⭐
  2. "Here's an AI-powered multiplayer dungeon game"
  3. "The AI SysOp welcomes you and helps you navigate"
  4. "All running on my desktop with one click"
```

### Must Have (Demo-Ready)

```yaml
Phase 1 - Core:
  - [ ] Basic WebSocket server accepting connections
  - [ ] ANSI welcome screen display
  - [ ] User registration (NEW) and login
  - [ ] Simple main menu navigation
  - [ ] One message base with read/post
  - [ ] SQLite database for persistence

Phase 2 - AI:
  - [ ] AI SysOp welcome message for new users
  - [ ] "Page SysOp" functionality with AI response
  - [ ] AI Config Assistant (talk to configure BBS) ⭐ HIGH DEMO VALUE
  - [ ] The Oracle door game (simplest AI door)
  - [ ] Basic web terminal client

Phase 3 - flagship:
  - [ ] Realm of Echoes MVP ⭐ FLAGSHIP FEATURE
        - Character creation (warrior/mage/rogue)
        - 5 interconnected rooms
        - AI DM narration
        - Solo combat
        - Shared world state (monsters stay dead)
        - Activity feed ("GhostRider was here")
        - Leave messages for other players
        - Leaderboard
  - [ ] Basic SysOp Control Panel (dashboard)
  - [ ] Demo video recording
```

### Nice to Have (If Time Permits)

```yaml
stretch_goals:
  - [ ] Telnet server (in addition to WebSocket)
  - [ ] Multi-node chat between online users
  - [ ] AI moderation for message bases
  - [ ] ANSI art generation
  - [ ] Phantom Quest text adventure
  - [ ] Sound effects in web client
  - [ ] Tauri desktop wrapper
  - [ ] Cloudflare tunnel integration
```

### Explicitly Out of Scope (Post-Hackathon)

```yaml
post_hackathon:
  - Multi-node hosting (multiple people running same BBS)
  - File library
  - Inter-BBS networking (FidoNet-style)
  - Real-time multiplayer combat sync
  - Local AI model support (Ollama)
  - Smart message summarization
  - Mobile app
  - Federation protocol
```

---

## Future Roadmap

### Post-Hackathon Cleanup 

- Code cleanup and documentation
- Bug fixes from demo feedback
- Improve error handling
- Add tests

### Community & Reliability Features

```yaml
multi_node_hosting:
  description: |
    Allow multiple people to run the same BBS with shared identity,
    so communities stay online even when individual computers reboot.
    This is the "always online" enhancement.
  
  recommended_approach: "Shared Cloud DB + Routing"
    # Turso (SQLite edge) for shared database
    # Cloudflare Workers for intelligent routing
    # Nodes register/heartbeat, router picks healthy node
  
  effort: 2-3 weeks
  value: HIGH - transforms from "personal project" to "community infrastructure"

other_features:
  - File library implementation
  - Multi-node real-time chat
  - User-to-user private messaging (NetMail)
  - More door games (Phantom Quest, trading game)
  - AI moderation enhancements
```

### Phase 3: Distribution (2 months)

- Tauri desktop app packaging
- One-click installers (Windows, Mac, Linux)
- Auto-update mechanism
- Cloudflare tunnel integration for easy hosting

### Phase 4: Federation (3+ months)

- Inter-BBS message networking
- Shared door game leaderboards
- BBS discovery directory
- Decentralized identity

---

## Appendix A: Sample ANSI Art

### Welcome Screen Template

```
\x1b[0m\x1b[2J\x1b[H
\x1b[36m╔══════════════════════════════════════════════════════════════════════════════╗
║\x1b[0m                                                                              \x1b[36m║
║\x1b[33m  ████████╗██╗  ██╗███████╗    ██╗  ██╗ █████╗ ██╗   ██╗███╗   ██╗████████╗  \x1b[36m║
║\x1b[33m  ╚══██╔══╝██║  ██║██╔════╝    ██║  ██║██╔══██╗██║   ██║████╗  ██║╚══██╔══╝  \x1b[36m║
║\x1b[93m     ██║   ███████║█████╗      ███████║███████║██║   ██║██╔██╗ ██║   ██║     \x1b[36m║
║\x1b[93m     ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██║██║   ██║██║╚██╗██║   ██║     \x1b[36m║
║\x1b[97m     ██║   ██║  ██║███████╗    ██║  ██║██║  ██║╚██████╔╝██║ ╚████║   ██║     \x1b[36m║
║\x1b[97m     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝     \x1b[36m║
║\x1b[0m                                                                              \x1b[36m║
║\x1b[35m          ███████╗██████╗     ████████╗███████╗██████╗ ███╗   ███╗           \x1b[36m║
║\x1b[35m          ██╔════╝██╔══██╗    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║           \x1b[36m║
║\x1b[95m          █████╗  ██║  ██║       ██║   █████╗  ██████╔╝██╔████╔██║           \x1b[36m║
║\x1b[95m          ██╔══╝  ██║  ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║           \x1b[36m║
║\x1b[37m          ███████╗██████╔╝       ██║   ███████╗██║  ██║██║ ╚═╝ ██║           \x1b[36m║
║\x1b[37m          ╚══════╝╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝           \x1b[36m║
║\x1b[0m                                                                              \x1b[36m║
╠══════════════════════════════════════════════════════════════════════════════╣
║\x1b[90m         "Where the spirits of the old 'net still whisper..."               \x1b[36m║
╠══════════════════════════════════════════════════════════════════════════════╣
║\x1b[0m  Node \x1b[97m{{node}}\x1b[0m of \x1b[97m{{max_nodes}}\x1b[0m  │  \x1b[97m{{caller_count}}\x1b[0m callers today  │  Running \x1b[92mNeoBBS v0.1\x1b[0m        \x1b[36m║
╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m

  Enter your \x1b[97mhandle\x1b[0m, or type \x1b[92mNEW\x1b[0m to register: \x1b[97m
```

---

## Appendix B: LLM Prompt Templates

### AI SysOp System Prompt

```
You are {{sysop_name}}, the AI System Operator of "{{bbs_name}}".

PERSONALITY:
{{sysop_personality}}

BBS THEME: {{bbs_theme}}

YOUR ROLE:
- Welcome new users warmly but in character
- Answer questions about the BBS
- Help users navigate (explain commands)
- Participate in chat when appropriate
- Maintain the BBS's atmosphere and theme

STYLE GUIDELINES:
- Keep responses under 500 characters usually
- Use occasional ANSI color codes: \x1b[32m for green, \x1b[0m to reset, etc.
- Stay in character at all times
- Be helpful but don't break the fourth wall
- Use the terminal/BBS aesthetic in your language

AVAILABLE COMMANDS (you can reference these when helping):
[M] Messages  [C] Chat  [D] Doors  [U] Users  [P] Page SysOp  [G] Goodbye

CURRENT CONTEXT:
User: {{user_handle}}
User's access level: {{access_level}}
Time on system: {{time_online}}
Location in BBS: {{current_menu}}
```

### Moderation Prompt

```
You are a content moderator for a nostalgic BBS community.

SENSITIVITY LEVEL: {{sensitivity}}/10

COMMUNITY RULES:
{{rules}}

Analyze the following message and respond with JSON:

MESSAGE:
"""
{{message}}
"""

AUTHOR: {{author_handle}}
CONTEXT: {{context}}

Respond ONLY with valid JSON:
{
  "decision": "approve" | "flag" | "remove",
  "reason": "brief explanation if flagged/removed",
  "suggested_action": "none" | "warn_user" | "notify_sysop",
  "confidence": 0.0-1.0
}
```

---

## Appendix C: Getting Started Commands

```bash
# Clone and setup
git clone https://github.com/yourusername/neobbs.git
cd neobbs
npm install

# Configure
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
# Set ANTHROPIC_API_KEY in environment

# Development
npm run dev           # Start all services in dev mode
npm run dev:server    # Server only
npm run dev:panel     # Control panel only
npm run dev:terminal  # Web terminal only

# Production build
npm run build
npm run start

# Database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed sample data
npm run db:reset      # Reset database
```

---

*Document Version: 1.1*  
*Last Updated: November 2025*  
*For: Kiroween Hackathon - Resurrection Category*

---

## Changelog

### v1.1 (November 2025)
- Added **AI-Assisted Configuration** feature (F7) - SysOp talks to configure BBS
- Replaced "Dungeon of Echoes" with **Realm of Echoes** - LORD-style async multiplayer RPG
- Updated **Hackathon MVP Scope** with new priorities and effort estimates
- Added **Multi-Node Hosting** to Phase 2 roadmap as post-hackathon enhancement
- Clarified demo highlights and flagship features

### v1.0 (October 2025)
- Initial specification document
