# Vocabulary Note Extension - Architecture Overview

## Project Type

**Manifest V3 Chrome Extension** with React frontend built via Vite.

## High-Level Structure

This is a vocabulary learning extension that runs in the browser and helps users build and review vocabulary with spaced repetition. The extension features:
- A popup interface for quick vocabulary access from the toolbar
- A full-page options interface for detailed management
- A content script for inline text selection and translation
- A background service worker for event handling and messaging
- Cloud synchronization via Firebase (optional)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension Context                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │   Popup UI       │  │  Options Page    │  │ Content Script   │
│  │  (React App)     │  │  (React App)     │  │  (Injected)      │
│  │                  │  │                  │  │                  │
│  │ - Tabs           │  │ - Add Word       │  │ - Text selection │
│  │ - Vocabulary     │  │ - Vocabulary     │  │ - Inline popup   │
│  │ - Review         │  │ - Review         │  │ - Translation    │
│  │ - Settings       │  │ - Settings       │  │                  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
│           │                     │                     │
│           └─────────────────────┼─────────────────────┘
│                                 │
│  ┌──────────────────────────────▼──────────────────────────────┐
│  │            Background Service Worker                         │
│  │  - Message routing & event handling                          │
│  │  - Context menus                                            │
│  └──────────────────────────────┬───────────────────────────────┘
│                                  │
├──────────────────────────────────┼──────────────────────────────┤
│  Service Layer                    │                              │
├──────────────────────────────────┼──────────────────────────────┤
│                                  │                              │
│  ┌──────────────────┐  ┌─────────▼──────────┐  ┌─────────────┐ │
│  │   Storage        │  │  Firebase Storage  │  │ Dictionary  │ │
│  │   Service        │  │  Service           │  │ Service     │ │
│  │                  │  │                    │  │             │ │
│  │ - CRUD           │  │ - Firestore sync   │  │ - Word data │ │
│  │ - Vocabulary     │  │ - Auth             │  │ - Audio URL │ │
│  │ - Settings       │  │ - Mirroring        │  │ - Examples  │ │
│  └──────────────────┘  └────────────────────┘  └─────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   SRS Service    │  │ Pronunciation     │                     │
│  │  (SM-2 Algorithm)│  │ Service           │                     │
│  │                  │  │                   │                     │
│  │ - Intervals      │  │ - Audio playback  │                     │
│  │ - Ease Factor    │  │ - Web Speech API  │                     │
│  │ - Scheduling     │  │ - Fallback        │                     │
│  └──────────────────┘  └──────────────────┘                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Storage Layer                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐      ┌──────────────────────────┐   │
│  │ Chrome Storage Local   │      │ Firebase/Firestore       │   │
│  │ (Primary)              │      │ (Cloud Sync)             │   │
│  │                        │      │                          │   │
│  │ - Vocabulary array     │      │ - User doc (UID)         │   │
│  │ - Settings             │      │ - Vocabulary collection  │   │
│  │ - Quick access         │      │ - Auth tokens            │   │
│  └────────────────────────┘      └──────────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  External APIs                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │ Dictionary API   │  │ Google OAuth / Firebase Auth         │ │
│  │ (dictionaryapi)  │  │ (chrome.identity)                    │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Extension Entry Points

| Entry | Source | Build Output | Purpose |
|---|---|---|---|
| **Popup** | `src/popup/mainPopup.jsx` | `dist/popup.js` | Toolbar popup interface (React) |
| **Options** | `src/options/main.jsx` | `dist/options.js` | Full-page settings & management (React) |
| **Content** | `src/content/content.jsx` | `dist/content.js` | Injected into web pages (IIFE) |
| **Background** | `src/background/background.js` | Loaded directly | Service worker for events & messaging |

### Key Details

- **Popup & Options**: Built as React apps via Vite, bundled as ES modules
- **Content Script**: Bundled as an IIFE (Immediately Invoked Function Expression) because content scripts cannot use ES module format
- **Background Script**: Plain JavaScript, cannot use ES imports. Firebase config is inlined as constants

## Core Concepts

### Two-Storage Pattern

The extension uses a **local-first, cloud-optional** approach:

1. **Primary Storage**: `chrome.storage.local` via `StorageService`
   - Always available, synchronous
   - Stores vocabulary, settings, user preferences
   - Direct access from popup and options pages

2. **Secondary Storage**: Firebase/Firestore via `FirebaseStorageService` (optional)
   - User must authenticate via `chrome.identity`
   - Mirrors vocabulary to Firestore under user's UID
   - Enables cross-device sync
   - Requires internet connection

Both services implement the same interface, making it easy to swap or use in parallel.

### Manifest V3 Service Worker Constraints

- **No audio playback**: Background service workers cannot play audio. All audio must be handled in popup/content script context.
- **No persistent background**: Service worker only runs when needed (message/event received), then stops.
- **No setTimeout persistence**: Timers don't persist across worker lifecycle.
- **Async-only storage**: `chrome.storage.sync` is async (vs V2's synchronous `localStorage`).

## Vocabulary Data Structure

Each vocabulary entry follows the SM-2 spaced repetition format:

```javascript
{
  // Core vocabulary
  id: "word_<timestamp>_<random>",
  word: "example",
  meaning: "a thing characteristic of its kind or illustrating a general rule",
  examples: ["She set an example for others to follow"],
  ipa: "/ɪɡˈzɑːmpəl/",
  audioUrl: "https://api.dictionaryapi.dev/...",
  youglishLink: "https://youglish.com/search/example",

  // SRS (Spaced Repetition System) - SM-2 Algorithm
  interval: 1,              // Days until next review
  repetition: 0,            // Number of successful reviews
  easeFactor: 2.5,          // Quality multiplier (min 1.3)
  nextReview: 1682000000,   // Unix timestamp (ms) of next review date
  lastReview: 1681900000,   // Unix timestamp (ms) of last review
  
  // Metadata
  createdAt: 1681800000,
  updatedAt: 1681900000,
  isManual: false           // True if user created manually, not from API
}
```

### SRS Fields Explained

- **interval**: How many days until the word should be reviewed again. Increases with successful repetitions.
- **repetition**: Count of successful reviews. Used to calculate next interval.
- **easeFactor**: Multiplier that adjusts interval growth. Higher = faster reviews. Min 1.3 (prevents too-long delays).
- **nextReview**: When the word becomes due for review. Used to filter "due now" items.
- **lastReview**: Timestamp of the last review for UI display.

See `src/services/srs.js` for the SM-2 algorithm implementation.

## Build Output Structure

```
dist/
├── popup.html           # Popup entry point (from popup.html)
├── popup.js             # Popup bundle (React)
├── options.html         # Options page entry (from options.html)
├── options.js           # Options bundle (React)
├── content.js           # Content script bundle (IIFE)
├── content.css          # Content script styles
└── manifest.json        # Extension manifest (copied from root)
```

Load the unpacked extension from the repo root (not the `dist/` folder) to ensure `manifest.json` is found.

## Styling & CSS

- **Tailwind CSS**: Used throughout for utility-first styling
- **Extracted CSS**: Content script CSS is extracted to `dist/content.css` and injected via `manifest.json`
- **React-specific**: Popup and options pages import CSS directly; built into bundles

## Message Passing

The background service worker coordinates communication between popup, options, and content script via `chrome.runtime.sendMessage()` and `chrome.runtime.onMessage`:

- **Popup → Background**: Request vocabulary updates, settings changes
- **Content Script → Background**: Request translation, word lookup
- **Background → All**: Broadcast vocabulary sync events

See `src/background/background.js` for message handler implementation.

## Environment Configuration

Firebase config is injected at build time via `.env`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

These are available in React components as `import.meta.env.VITE_*`.

## Development vs. Production

### Development

```bash
npm run dev
```

- Builds popup + options with source maps for debugging
- **Content script must be manually rebuilt** with `npx vite build --config vite.content.config.js`
- Open `chrome://extensions/` and load unpacked from repo root
- Hot reload applies to popup/options; content script changes require manual reload

### Production

```bash
npm run build
npx vite build --config vite.content.config.js
```

- Builds minified popup + options
- Builds content script
- Ready to package as `.zip` for Chrome Web Store

## Next Steps

- See [COMPONENTS.md](./COMPONENTS.md) for component hierarchy and relationships
- See [DATA_FLOW.md](./DATA_FLOW.md) for detailed data flow diagrams
- See [SERVICES.md](./SERVICES.md) for service layer documentation
- See [BUILD_PROCESS.md](./BUILD_PROCESS.md) for build setup and configuration
