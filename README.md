# Vocabulary Note - Chrome Extension

A Chrome Extension for learning and storing English vocabulary with spaced repetition (SM-2 algorithm), Firebase cloud sync, and daily review reminders.

## Features

- **Vocabulary Capture** — Select any word on a webpage to save it via inline popup, keyboard shortcut (`Ctrl+Shift+S` / `Cmd+Shift+S`), or context menu
- **Dictionary Integration** — Auto-fetches definitions, IPA, audio, and examples from Free Dictionary API
- **Spaced Repetition (SM-2)** — Scientifically proven algorithm with Hard/Good/Easy difficulty levels
- **Cloud Sync** — Optional Google Sign-In via Firebase Auth syncs vocabulary to Firestore
- **Daily Reminders** — Chrome alarms and desktop notifications for due reviews
- **Pronunciation** — Audio playback with Web Speech API fallback
- **Import/Export** — JSON backup and restore of vocabulary data

## Tech Stack

- **Manifest V3** Chrome Extension
- **React 18** + **Vite** (popup and options pages)
- **Tailwind CSS v4** for styling
- **Firebase** (Auth, Firestore, Cloud Functions)
- **Content script** bundled as IIFE via separate Vite config

## Project Structure

```
vocabulary-note-extension/
├── manifest.json                  # Extension manifest (Manifest V3)
├── popup.html                     # Popup entry HTML
├── options.html                   # Options page entry HTML
├── vite.config.js                 # Vite config for popup + options
├── vite.content.config.js         # Vite config for content script (IIFE)
├── firebase.json                  # Firebase project config
├── firestore.rules                # Firestore security rules
├── src/
│   ├── background/
│   │   └── background.js          # Service worker (alarms, context menus, messaging)
│   ├── popup/
│   │   ├── mainPopup.jsx          # Popup entry point
│   │   ├── PopupApp.jsx           # Popup root component
│   │   ├── popup.css              # Popup styles
│   │   ├── tailwind.css           # Tailwind directives
│   │   └── components/            # Header, VocabularyTab, SearchInput, WordCard, etc.
│   ├── options/
│   │   ├── main.jsx               # Options entry point
│   │   ├── OptionsApp.jsx         # Options root component (auth gate)
│   │   ├── tailwind.css           # Tailwind directives
│   │   └── components/            # ReviewSection, VocabularySection, AddWordSection, etc.
│   ├── content/
│   │   ├── content.jsx            # Content script (word selection + inline popup)
│   │   └── content.css            # Content script styles
│   ├── services/
│   │   ├── storage.js             # chrome.storage.local CRUD (StorageService)
│   │   ├── firebaseStorage.js     # Firestore CRUD + auth (FirebaseStorageService)
│   │   ├── firebase.js            # Firebase app initialization
│   │   ├── dictionary.js          # Free Dictionary API integration
│   │   ├── srs.js                 # SM-2 spaced repetition algorithm
│   │   └── pronunciation.js       # Audio playback + Web Speech API fallback
│   ├── assets/
│   │   └── icons/                 # SVG icons (icon16, icon48, icon128)
│   └── utils/
│       └── constants.js           # App constants and configuration
├── functions/                     # Firebase Cloud Functions (TypeScript)
│   └── src/
│       ├── index.ts               # onWordCreate trigger (FCM push notifications)
│       └── utils/sendFcm.ts       # FCM send helper
├── packages/
│   └── shared-core/               # Shared TypeScript library (SRS types, algorithms)
│       └── src/
│           ├── index.ts
│           ├── srs.ts
│           └── types.ts
├── tests/                         # Test suites
│   ├── e2e-checklist.md
│   └── integration/
├── scripts/
│   └── verify-word-trigger.js     # Firestore trigger verification script
├── docs/                          # Detailed architecture documentation
│   ├── INDEX.md                   # Documentation index
│   ├── ARCHITECTURE.md            # System overview and diagrams
│   ├── BUILD_PROCESS.md           # Build and dev setup guide
│   ├── COMPONENTS.md              # React component hierarchy
│   ├── DATA_FLOW.md               # Data movement patterns
│   └── SERVICES.md                # Service layer APIs
└── dist/                          # Build output (popup.js, options.js, content.js, etc.)
```

## Quick Start

### Prerequisites

- Node.js 16+
- npm 7+
- Chrome 90+ (or any Chromium-based browser)

### Installation

```bash
# Install dependencies
npm install

# Create .env with Firebase config
cp .env.example .env
# Fill in VITE_FIREBASE_* variables (see Environment Variables below)
```

### Development

```bash
# Start dev server (popup + options pages with hot reload)
npm run dev

# Build content script separately (required for content script changes)
npm run build:content

# Load the extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select repo root
# 4. Reload after content script rebuilds
```

### Production Build

```bash
# Build everything (popup + options + content script in parallel)
npm run build
```

## Environment Variables

Create a `.env` file in the project root with your Firebase config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

If any variable is missing, the extension falls back to local-only mode automatically.

## Architecture

### Entry Points

| Entry | Source | Build Output | Purpose |
|---|---|---|---|
| Popup | `src/popup/mainPopup.jsx` | `dist/popup.js` | Toolbar popup (vocabulary browse, search) |
| Options | `src/options/main.jsx` | `dist/options.js` | Full-page management (review, add, settings) |
| Content | `src/content/content.jsx` | `dist/content.js` | Injected into web pages (word selection) |
| Background | `src/background/background.js` | loaded directly | Service worker (alarms, context menus) |

### Two-Storage Pattern

- **Primary**: `chrome.storage.local` via `StorageService` — always available, works offline
- **Secondary**: Firestore via `FirebaseStorageService` — optional cloud sync, requires Google Sign-In
- Both services share the same interface, so UI components accept either as a `service` prop

### Authentication

Google Sign-In is handled via `chrome.identity.getAuthToken` + Firebase Auth. See [AUTHENTICATION.md](AUTHENTICATION.md) for the full flow.

### Cloud Functions

Firebase Cloud Functions (`functions/`) send FCM push notifications when a new word is saved to Firestore.

### Shared Core

`packages/shared-core/` contains shared TypeScript code (SRS types and algorithms) intended for reuse across the extension and potential mobile app.

## Usage

### Saving Words

1. **Text Selection** — Highlight a word on any webpage, click "Save" in the inline popup
2. **Keyboard Shortcut** — Highlight a word, press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
3. **Context Menu** — Right-click selected text, choose "Save to Vocabulary"
4. **Manual Entry** — Options page > "Add Word" section with optional auto-fetch

### Reviewing Words

1. Open the options page (from popup header or `chrome://extensions`)
2. Go to "Today Review"
3. Rate each word: **Hard**, **Good**, or **Easy**
4. The SM-2 algorithm schedules the next review automatically

### Managing Vocabulary

- **Search**: Filter words in the vocabulary list
- **Play**: Hear pronunciation (audio URL or Web Speech API fallback)
- **Export/Import**: JSON backup from the options page settings

## Spaced Repetition (SM-2)

| Review # | Interval |
|---|---|
| 1st | 1 day |
| 2nd | 6 days |
| Subsequent | `previous_interval * easeFactor` |

Ease factor adjusts based on difficulty rating (min 1.3, initial 2.5). Hard responses shorten intervals (x0.5), Easy responses lengthen them (x1.3).

## Firebase Emulators

```bash
# Install functions dependencies
npm run functions:install

# Start Firestore + Functions emulators
npm run emulators:start

# Verify word trigger
npm run verify:word-trigger
```

## Vocabulary Data Structure

```javascript
{
  id: "word_<timestamp>_<random>",
  word: string,
  meaning: string,
  examples: string[],
  ipa: string,
  audioUrl: string,
  youglishLink: string,
  interval: number,        // days until next review
  repetition: number,
  easeFactor: number,      // min 1.3, initial 2.5
  nextReview: number,      // Unix ms timestamp
  lastReview: number,
  createdAt: number,
  updatedAt: number,
  isManual: boolean
}
```

## Documentation

- [AUTHENTICATION.md](AUTHENTICATION.md) — Auth flow, sign-in/sign-out, storage services
- [docs/](docs/INDEX.md) — Detailed architecture, components, data flow, services, build process

## Manifest Permissions

| Permission | Purpose |
|---|---|
| `storage` | Local vocabulary persistence |
| `alarms` | Daily review reminders |
| `notifications` | Desktop notifications |
| `contextMenus` | Right-click "Save to Vocabulary" |
| `identity` | Google OAuth for Firebase Auth |

## License

This project is open source and available for educational purposes.
