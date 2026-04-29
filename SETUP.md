# Setup Guide

## Prerequisites

- **Node.js** 16+ and **npm** 7+
- **Chrome** 90+ (or any Chromium-based browser)
- A Firebase project (optional — needed only for cloud sync)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment (Optional)

If you want Firebase cloud sync, create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Firebase config:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

Without a `.env` file, the extension works fully offline using local Chrome storage.

## Step 3: Build

```bash
# Build everything (popup + options + content script)
npm run build
```

This runs two Vite builds in parallel:
- `vite build` — popup and options pages (React)
- `vite build --config vite.content.config.js` — content script (IIFE bundle)

Output goes to `dist/`.

## Step 4: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the **repo root** directory (not `dist/`)
5. The extension should appear in your toolbar

## Step 5: Test

1. **Content script**: Visit any webpage, highlight a word — an inline popup should appear
2. **Keyboard shortcut**: Highlight a word, press `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac)
3. **Popup**: Click the extension icon in the toolbar
4. **Options page**: Open from popup header or right-click extension icon > Options

## Development Workflow

```bash
# Start dev server with hot reload (popup + options only)
npm run dev

# Rebuild content script after changes (no hot reload for content scripts)
npm run build:content

# After content script rebuild, reload the extension at chrome://extensions/
```

The dev server provides hot reload for popup and options pages. Content script changes require a manual rebuild and extension reload.

## Firebase Emulators (Optional)

For local Firebase development:

```bash
# Install Cloud Functions dependencies
npm run functions:install

# Start Firestore + Functions emulators
npm run emulators:start

# Emulator UI available at http://localhost:4000
```

## Shared Core Package (Optional)

The `packages/shared-core/` package contains shared TypeScript code (SRS types):

```bash
# Run shared-core tests
npm run shared-core:test
```

## Troubleshooting

### Extension fails to load
- Make sure `dist/` directory exists (run `npm run build` first)
- Check `chrome://extensions/` for error details
- Verify `manifest.json` is in the selected directory

### Content script not working
- Refresh the webpage after loading/reloading the extension
- Some sites block content scripts
- Ensure `dist/content.js` exists (run `npm run build:content`)

### Firebase errors
- Check that all `VITE_FIREBASE_*` variables are set in `.env`
- Rebuild after changing `.env` (Vite env vars are compile-time)
- Without valid config, the extension falls back to local-only mode

### Popup doesn't open
- Check for errors at `chrome://extensions/`
- Make sure `dist/popup.js` exists (run `npm run build`)

## File Verification

After `npm run build`, these files should exist in `dist/`:

- `popup.js` — Popup bundle
- `options.js` — Options page bundle
- `content.js` — Content script bundle
- `content.css` — Content script styles
- CSS files for popup/options (generated from Tailwind)
