# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

The extension uses **two separate Vite build configs** — both must be run for a complete build:

```bash
# Build popup + options pages (React, outputs to dist/)
npm run build

# Build content script (outputs dist/content.js + dist/content.css as IIFE)
npx vite build --config vite.content.config.js

# Development server (popup/options only — content script changes require manual rebuild)
npm run dev
```

After building, load/reload the unpacked extension from `chrome://extensions/` pointing to the repo root.

## Architecture Overview

This is a **Manifest V3 Chrome Extension** with a React frontend built via Vite.

### Extension Entry Points

| Entry | Source | Build Output | Purpose |
|---|---|---|---|
| Popup | `src/popup/mainPopup.jsx` | `dist/popup.js` | Extension toolbar popup |
| Options | `src/options/main.jsx` | `dist/options.js` | Full-page options (`options.html`) |
| Content | `src/content/content.jsx` | `dist/content.js` | Injected into all web pages |
| Background | `src/background/background.js` | loaded directly | Service worker (no build) |

The **background script is not bundled** — it's loaded directly by Chrome and cannot use ES module imports. Constants are inlined there to avoid this limitation.

### Service Layer (`src/services/`)

- **`storage.js`** — `chrome.storage.local` CRUD for vocabulary and settings (singleton `StorageService`)
- **`firebaseStorage.js`** — Firestore mirror of vocabulary, requires Google OAuth via `chrome.identity`
- **`firebase.js`** — Firebase initialization reading config from `VITE_FIREBASE_*` env vars
- **`dictionary.js`** — Fetches word data from `https://api.dictionaryapi.dev`
- **`srs.js`** — SM-2 spaced repetition algorithm (Hard/Good/Easy → interval/easeFactor updates)
- **`pronunciation.js`** — Plays audio URL with fallback to Web Speech API

### Data Flow

The popup and options page both read/write from `chrome.storage.local` via `StorageService`. Firebase sync is opt-in (requires user authentication) and mirrors the same vocabulary array to Firestore under the authenticated user's UID.

### Two-Storage Pattern

Local-first: all operations go through `StorageService` (`chrome.storage.local`). `FirebaseStorageService` is a secondary sync layer — it wraps the same vocabulary structure but targets Firestore. When modifying vocabulary operations, update both services if Firebase sync should be supported.

## Environment Variables

Firebase config is loaded from `.env` via Vite env vars. Required keys:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

## Content Script Constraints

`content.jsx` is bundled as an **IIFE** (see `vite.content.config.js`) because content scripts cannot use ES module format. Dynamic imports are inlined. CSS is extracted to `dist/content.css` and injected via `manifest.json`.

## Manifest V3 Audio Limitation

The background service worker **cannot play audio**. Pronunciation playback must happen in the popup or content script context. The background script's `handlePronunciation()` is a no-op stub for this reason.

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
  // SRS fields (SM-2):
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
