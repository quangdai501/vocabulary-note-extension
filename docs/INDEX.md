# Documentation Index

Welcome to the Vocabulary Note Extension architecture documentation. This guide helps you understand the project structure, how components work together, and how to develop and deploy the extension.

## Quick Navigation

### For First-Time Developers

Start here to get up to speed:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Project overview, high-level design, and core concepts
   - What is this project?
   - Extension entry points and how they interact
   - Two-storage pattern (local + Firebase)
   - Manifest V3 constraints
   - Vocabulary data structure

2. **[BUILD_PROCESS.md](./BUILD_PROCESS.md)** - How to build, develop, and deploy
   - Installation and quick start
   - Development workflow
   - Two separate Vite configs (why and how)
   - Production build and packaging
   - Troubleshooting

3. **[COMPONENTS.md](./COMPONENTS.md)** - React component hierarchy
   - Component tree (popup, options, shared)
   - Purpose and responsibilities of each component
   - Props and state management
   - Data flow between components

### For In-Depth Understanding

Dive deeper into specific areas:

4. **[DATA_FLOW.md](./DATA_FLOW.md)** - How data moves through the application
   - Step-by-step flows for common operations (add, search, review, edit, delete)
   - Storage architecture and synchronization
   - Message passing between contexts
   - Error handling and offline behavior

5. **[SERVICES.md](./SERVICES.md)** - Service layer APIs
   - StorageService (local chrome.storage)
   - FirebaseStorageService (cloud sync)
   - DictionaryService (word lookups)
   - SRSService (SM-2 algorithm)
   - PronunciationService (audio playback)

## Document Purposes

### ARCHITECTURE.md
**High-level overview of the entire system.**

- System diagrams (ASCII art)
- Entry points and how they connect
- Core architectural decisions
- Constraints and limitations
- Vocabulary data structure
- Build output structure

**Read this if you**: Want to understand the big picture, new to the project, making architectural decisions

---

### BUILD_PROCESS.md
**Step-by-step guide to building, developing, and deploying.**

- Prerequisites and setup
- Development workflow
- Vite configuration explanation
- Environment variables
- Debugging in Chrome DevTools
- Production builds and packaging
- CI/CD integration examples

**Read this if you**: Need to set up dev environment, build the project, debug issues, deploy to Chrome Web Store

---

### COMPONENTS.md
**React component structure and relationships.**

- Popup component tree
- Options page component tree
- Detailed API for each component (props, state, methods)
- AlertContext and shared utilities
- Data flow patterns between components
- Best practices for components

**Read this if you**: Working on React components, adding new UI features, understanding component responsibilities

---

### DATA_FLOW.md
**How data moves through the application.**

- Step-by-step flows with ASCII diagrams for:
  - Adding a word
  - Searching vocabulary
  - Reviewing (spaced repetition)
  - Editing/deleting words
- Storage architecture and synchronization
- Message passing between popup, options, content script, background
- State synchronization patterns
- Error handling flows
- Offline behavior

**Read this if you**: Debugging data issues, understanding how operations work, implementing new features that involve data flow

---

### SERVICES.md
**Service layer APIs and implementation.**

- StorageService (CRUD for vocabulary and settings)
- FirebaseStorageService (cloud sync, auth)
- DictionaryService (word lookups from API)
- SRSService (SM-2 spaced repetition algorithm)
- PronunciationService (audio playback)
- Best practices for service usage

**Read this if you**: Integrating with external APIs, fixing service-related bugs, understanding how services communicate with storage/auth

---

## Project Structure

```
vocabulary-note-extension/
├── docs/                         # This documentation
│   ├── INDEX.md                  # (You are here)
│   ├── ARCHITECTURE.md           # System overview
│   ├── BUILD_PROCESS.md          # Build & dev setup
│   ├── COMPONENTS.md             # React components
│   ├── DATA_FLOW.md              # Data movement
│   └── SERVICES.md               # Service layer
│
├── src/
│   ├── popup/                    # Popup UI (React)
│   ├── options/                  # Options page (React)
│   ├── content/                  # Content script
│   ├── background/               # Service worker
│   ├── services/                 # Service layer
│   └── utils/                    # Utilities
│
├── dist/                         # Build output
├── package.json                  # Dependencies
├── vite.config.js                # Main build config
├── vite.content.config.js        # Content script config
├── manifest.json                 # Extension manifest
└── CLAUDE.md                     # Project guidelines
```

## Common Tasks

### "I want to add a new feature"

1. Understand the feature requirements
2. Identify which entry points are affected:
   - **Popup only** → Edit `src/popup/` components
   - **Options only** → Edit `src/options/` components
   - **Content script** → Edit `src/content/`
   - **All** → Update services and background script
3. Check [DATA_FLOW.md](./DATA_FLOW.md) for similar operations
4. Review [COMPONENTS.md](./COMPONENTS.md) for component APIs
5. Use [SERVICES.md](./SERVICES.md) to understand service interfaces
6. Implement, test in dev environment, build for production

### "I'm fixing a bug"

1. Reproduce the issue (which entry point? what action?)
2. Check [DATA_FLOW.md](./DATA_FLOW.md) for that operation's flow
3. Add `console.log` at key points in the flow
4. Use Chrome DevTools to debug (see [BUILD_PROCESS.md](./BUILD_PROCESS.md) Debugging section)
5. Verify the fix doesn't break other flows
6. Test in dev and production environments

### "I need to understand how X works"

- **Components** → [COMPONENTS.md](./COMPONENTS.md)
- **Data flow** → [DATA_FLOW.md](./DATA_FLOW.md)
- **Services** → [SERVICES.md](./SERVICES.md)
- **Build process** → [BUILD_PROCESS.md](./BUILD_PROCESS.md)
- **High-level design** → [ARCHITECTURE.md](./ARCHITECTURE.md)

### "I need to set up the development environment"

Follow [BUILD_PROCESS.md](./BUILD_PROCESS.md) step by step:
1. Prerequisites
2. Installation
3. Development (Start Dev Server)
4. Load Extension in Chrome
5. Test & Debug

### "I need to deploy to production"

Follow [BUILD_PROCESS.md](./BUILD_PROCESS.md):
1. Production Build section
2. Package for Distribution
3. Chrome Web Store Upload

## Architecture at a Glance

```
┌─────────────────────────────────────────────────┐
│         Extension UI (React)                    │
├─────────────────────────────────────────────────┤
│  Popup              Options            Content  │
│  (vocabulary        (full-page)        (inject) │
│   overview)         management)                  │
│                                                  │
│  Popup:             Sections:         Features: │
│  - Vocabulary       - Add              - Text   │
│  - Search           - Vocabulary        selection│
│  - Settings link    - Review           - Inline │
│  - Sign in gate     - Settings          popup   │
│                     - Export/Import    - Translate
│                                                  │
└────────┬──────────────────────────────┬─────────┘
         │                              │
         └──────────┬───────────────────┘
                    │ chrome.runtime.sendMessage()
         ┌──────────▼──────────┐
         │ Background Service  │
         │ Worker              │
         └──────────┬──────────┘
                    │
         ┌──────────▼────────────────┐
         │  Services                 │
         ├───────────────────────────┤
         │ - Storage (local)         │
         │ - Firebase (cloud sync)   │
         │ - Dictionary (API lookup) │
         │ - SRS (spaced repetition) │
         │ - Pronunciation (audio)   │
         └──────────┬────────────────┘
                    │
         ┌──────────▼────────────────┐
         │  Storage Layer            │
         ├───────────────────────────┤
         │ - chrome.storage.local    │
         │ - Firestore (optional)    │
         └───────────────────────────┘
```

## Key Concepts

### Two-Storage Pattern
- **Primary**: `chrome.storage.local` (always available, offline-first)
- **Secondary**: Firebase/Firestore (cloud sync, requires auth)
- Local storage is source of truth; Firebase mirrors it

### Manifest V3 Constraints
- Service workers are ephemeral (run when needed, then stop)
- Content scripts cannot use ES modules
- Background cannot play audio
- No persistent background timers

### SRS (Spaced Repetition System)
- SM-2 algorithm for optimal review intervals
- Words reviewed grow exponentially in days
- Quality rating (0-5) adjusts difficulty

### Three Execution Contexts
- **Popup**: React app, short-lived
- **Options**: React app, long-lived
- **Content Script**: Injected into every page
- **Background**: Event handler, ephemeral

All communicate via `chrome.runtime.sendMessage()`.

## Glossary

| Term | Definition |
|------|-----------|
| **IIFE** | Immediately Invoked Function Expression (required for content scripts) |
| **Service Worker** | Manifest V3's background script (ephemeral, event-driven) |
| **SRS** | Spaced Repetition System (learning technique with increasing intervals) |
| **SM-2** | Specific SRS algorithm used (calculates optimal review intervals) |
| **Firestore** | Firebase's real-time database (used for cloud sync) |
| **Chrome Storage** | Browser storage API (chrome.storage.local is key-value) |
| **Content Script** | JavaScript injected into web pages (separate context) |
| **Hot Reload** | Auto-reload when code changes (available for popup/options) |
| **Manifest** | manifest.json — tells Chrome how to load the extension |
| **OAuth** | Open authentication (used for Google sign-in via chrome.identity) |

## Important Files (Quick Reference)

| File | Purpose |
|------|---------|
| `src/popup/mainPopup.jsx` | Popup entry point |
| `src/options/main.jsx` | Options page entry point |
| `src/content/content.jsx` | Content script entry point |
| `src/background/background.js` | Service worker (message router) |
| `src/services/storage.js` | Local storage interface (CRUD) |
| `src/services/firebaseStorage.js` | Cloud sync interface |
| `src/services/srs.js` | SM-2 algorithm |
| `vite.config.js` | Main build config (popup + options) |
| `vite.content.config.js` | Content script build config |
| `manifest.json` | Extension manifest |
| `package.json` | Dependencies and build scripts |

## Support & Resources

- **General help**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for overview
- **Build issues**: See [BUILD_PROCESS.md](./BUILD_PROCESS.md) Troubleshooting
- **Component issues**: See [COMPONENTS.md](./COMPONENTS.md)
- **Data flow issues**: See [DATA_FLOW.md](./DATA_FLOW.md)
- **Service issues**: See [SERVICES.md](./SERVICES.md)
- **Project guidelines**: See `CLAUDE.md` (in repo root)
- **Chrome Extension docs**: https://developer.chrome.com/docs/extensions/

## How to Use This Documentation

1. **Start with ARCHITECTURE.md** if you're new to the project
2. **Reference specific docs** as you work on features or fix bugs
3. **Use INDEX.md** (this file) to find what you need
4. **Keep BUILD_PROCESS.md** handy during development
5. **Refer to COMPONENTS.md** when working on UI
6. **Check DATA_FLOW.md** when debugging data issues
7. **Review SERVICES.md** when integrating with external APIs or storage

Each document is self-contained but cross-referenced. You can jump between them using the links.

Good luck! 🚀
