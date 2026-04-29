# Build Process and Development Setup

This document explains how the project is built, configured, and deployed.

## Quick Start

### Prerequisites
- Node.js 16+
- npm 7+
- Chrome 90+ (or Chromium-based browser)

### Installation

```bash
# Install dependencies
npm install

# Create .env file with Firebase config (see Environment Setup below)
cp .env.example .env
# Edit .env with your Firebase credentials
```

### Development

```bash
# Start dev server (popup + options only)
npm run dev

# In another terminal, build content script (as needed)
npm run build:content

# Open Chrome and load unpacked:
# 1. chrome://extensions
# 2. "Load unpacked" → select repo root
# 3. Click reload icon after each content script rebuild
```

### Production Build

```bash
# Build everything (popup + options + content script in parallel)
npm run build

# Output is in dist/
# Zip dist/ folder to create extension package
```

---

## Build System Overview

The project uses **two separate Vite configurations** because the content script cannot use ES module format.

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Main: Popup + Options (React, ES modules) |
| `vite.content.config.js` | Content script (IIFE bundle) |

### Why Two Configs?

**Content scripts in Manifest V3 cannot use ES modules.** They must be:
- IIFE (Immediately Invoked Function Expression)
- Single file with all dependencies bundled
- No dynamic imports

The popup and options pages can be modern React + ES modules because they run in the extension context (not injected into page).

---

## Vite Configuration

### Main Config (`vite.config.js`)

```javascript
export default {
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}
```

**Key points**:
- Builds `popup.html` → `popup.js`
- Builds `options.html` → `options.js`
- Code splitting enabled for shared modules
- Path alias `@` maps to `src/`

### Content Script Config (`vite.content.config.js`)

```javascript
export default {
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/content/content.jsx'),
      name: 'ContentScript',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js',
        extend: true
      }
    }
  }
}
```

**Key points**:
- Uses `lib` mode for IIFE output
- Entry point: `src/content/content.jsx`
- Output: Single file `dist/content.js` (no chunks)
- CSS extracted to `dist/content.css`

---

## Build Output Structure

```
dist/
├── popup.html              # HTML entry point (serves nothing)
├── popup.js                # Popup React bundle
├── popup.css               # Popup styles
├── options.html            # Options page entry point
├── options.js              # Options React bundle
├── options.css             # Options styles
├── content.js              # Content script (IIFE, minified)
├── content.css             # Content script styles
├── chunks/                 # Shared module chunks
│   └── [hash].js
└── manifest.json           # Copied from root
```

### Why HTML Files in dist/?

HTML files are entry points for Vite but are **not served** in the extension. Instead:
- `popup.html` loads `popup.js` → renders React app
- `options.html` loads `options.js` → renders React app
- Both exist so Vite knows what to build

---

## Environment Variables

### Setup

Create `.env` file in project root:

```bash
# Firebase config (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-123
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=G-...

# Optional: Feature flags
VITE_ENABLE_SENTRY=false
VITE_LOG_LEVEL=debug
```

### Loading in Code

**In React components (popup/options)**:
```javascript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isDev = import.meta.env.DEV;
```

**In background script** (plain JS):
- Cannot use Vite env vars
- Constants must be inlined manually

**In content script**:
- Uses Vite env vars (bundled into IIFE)
- Access via `import.meta.env.VITE_*`

### .env vs .env.production

- `.env`: Development defaults (loaded always)
- `.env.production`: Overrides for production builds (optional)

To use production env:
```bash
npm run build # Automatically loads .env.production if it exists
```

---

## Development Workflow

### Step 1: Start Dev Server

```bash
npm run dev
```

This:
- Builds popup + options with source maps
- Watches for changes (hot reload)
- Serves to `chrome-extension://...` (handled by manifest)
- **Does NOT rebuild content script**

### Step 2: Rebuild Content Script (When Changed)

Content script needs manual rebuild because it's built separately:

```bash
npx vite build --config vite.content.config.js
```

Or use a file watcher:
```bash
# In second terminal
npx vite build --config vite.content.config.js --watch
```

### Step 3: Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode" (toggle top right)
3. Click "Load unpacked"
4. Select repo root directory
5. Extension appears in list

### Step 4: Test & Debug

**Popup/Options (React)**:
- Change code
- Hit Cmd+S to save
- Popup/options automatically reload (hot module replacement)
- Use Chrome DevTools (F12 in popup)

**Content Script**:
- Change code in `src/content/`
- Run `npx vite build --config vite.content.config.js`
- Go to `chrome://extensions`
- Click reload icon on extension card
- Reload active web page to test

**Background Service Worker**:
- Change code in `src/background/`
- Go to `chrome://extensions`
- Click "Details" on extension card
- Scroll to "Service Worker" section
- Click "Reload" (not the extension reload)

### Debugging

**Popup/Options**:
```bash
# Right-click popup/options page → Inspect
```

**Content Script**:
```bash
# Open DevTools on any web page (F12)
# Sources tab → extension: [ID] → src/content/...
# or Console tab (errors logged here)
```

**Background Service Worker**:
```bash
# chrome://extensions → Details → Service Worker (Inspect)
# Opens DevTools for background script
```

---

## Production Build

### Build All Artifacts

```bash
# Build popup + options + content script (minified, in parallel)
npm run build
```

Output goes to `dist/`.

### Package for Distribution

```bash
# Create zip file for Chrome Web Store
cd dist
zip -r ../vocabulary-note-extension.zip *

# Or: Use Chrome's built-in packaging
# chrome://extensions → "Pack extension"
```

### Chrome Web Store Upload

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click "New Item"
3. Upload `vocabulary-note-extension.zip`
4. Fill in store listing:
   - Name
   - Short description (132 chars)
   - Detailed description
   - Screenshots
   - Icons (128x128, 48x48, 16x16)
5. Submit for review (24–72 hours)

---

## Manifest V3 Configuration

### Manifest Structure

```json
{
  "manifest_version": 3,
  "name": "Vocabulary Note",
  "version": "1.0.0",
  
  "permissions": [
    "storage",
    "identity"
  ],
  
  "host_permissions": [
    "<all_urls>"
  ],
  
  "background": {
    "service_worker": "src/background/background.js"
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "Vocabulary Note"
  },
  
  "options_page": "options.html",
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["dist/content.js"],
      "css": ["dist/content.css"]
    }
  ],
  
  "icons": {
    "16": "images/icon-16.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
}
```

### Key Fields

- **manifest_version**: Must be 3 (V2 is deprecated)
- **permissions**: `storage` (required), `identity` (for OAuth)
- **host_permissions**: `<all_urls>` to run content script everywhere
- **background.service_worker**: Path to service worker (not bundled)
- **action.default_popup**: Popup page (relative path)
- **options_page**: Settings page (relative path)
- **content_scripts**: Where/how to inject content script
- **icons**: Extension icons in various sizes

### Important Notes

- **No remote scripts**: Cannot load scripts from CDN (except Firebase SDK via specific whitelist)
- **CSP (Content Security Policy)**: Inline scripts blocked by default
- **background service_worker**: Cannot use ES imports (inline all code)

---

## CSS & Styling

### Tailwind CSS Setup

**Configuration** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: { extend: {} },
  plugins: [],
}
```

**Input** (`src/index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Content Script Styles

Content script CSS is extracted to `dist/content.css` and injected via manifest:

```json
"content_scripts": [
  {
    "js": ["dist/content.js"],
    "css": ["dist/content.css"]  // Injected before scripts run
  }
]
```

**Import in content script**:
```jsx
import '../styles/content.css'; // Extracted by Vite
```

---

## Troubleshooting Build Issues

### Issue: Content Script Not Updating

**Cause**: Content script only built manually

**Solution**:
```bash
# Rebuild content script
npx vite build --config vite.content.config.js

# Reload extension in chrome://extensions
# Reload web page to run new version
```

### Issue: "Cannot find module" Error

**Cause**: Path alias `@` not recognized in some context

**Solution**: Use relative paths or check `vite.config.js` includes alias

### Issue: Firebase Env Vars Undefined

**Cause**: `.env` file missing or typo in variable name

**Solution**:
```bash
# Verify .env exists
ls -la .env

# Check env var names (must start with VITE_)
echo "VITE_FIREBASE_API_KEY=test" >> .env

# Restart dev server
npm run dev
```

### Issue: Extension Not Loading

**Cause**: `manifest.json` not found or `dist/` path wrong

**Solution**:
- Load unpacked from **repo root**, not from `dist/`
- Ensure `dist/manifest.json` exists after build
- Check manifest syntax (JSON validator)

### Issue: Hot Reload Not Working

**Cause**: Popup/options HTML not open or changes not detected

**Solution**:
- Open popup/options page
- Make a change to source file
- Wait for "Reloaded" message in terminal
- Reload popup/options manually (Cmd+R)

---

## Advanced Configuration

### Code Splitting

Vite automatically code-splits shared modules:

```javascript
// src/popup/mainPopup.jsx
import StorageService from '@/services/storage'; // Shared

// src/options/main.jsx
import StorageService from '@/services/storage'; // Same module
```

Output:
- `dist/popup.js`
- `dist/options.js`
- `dist/chunks/storage-[hash].js` (shared)

Both popup and options load the shared chunk.

### Minification Settings

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser', // or 'esbuild'
    terserOptions: {
      compress: { drop_console: true }, // Remove console.log in prod
      output: { comments: false }
    }
  }
}
```

### Source Maps

Development builds include source maps for debugging:
```bash
npm run dev
# dist/popup.js.map, options.js.map, etc.
```

Production builds can optionally include source maps:
```javascript
// vite.config.js
build: {
  sourcemap: process.env.NODE_ENV === 'production' ? false : true
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Extension

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - run: npx vite build --config vite.content.config.js
      - uses: actions/upload-artifact@v2
        with:
          name: extension
          path: dist/
```

This builds the extension on every push and saves artifacts.

---

## Summary

| Command | Purpose | Output |
|---------|---------|--------|
| `npm install` | Install dependencies | `node_modules/` |
| `npm run dev` | Start dev server | Hot reload for popup/options |
| `npm run build` | Build everything (parallel) | `dist/popup.js`, `dist/options.js`, `dist/content.js` |
| `npm run build:ui` | Build popup + options only | `dist/popup.js`, `dist/options.js` |
| `npm run build:content` | Build content script only | `dist/content.js` |

**Load unpacked extension**: Repo root → `chrome://extensions`

**Hot reload**: Automatic for popup/options; manual for content script
