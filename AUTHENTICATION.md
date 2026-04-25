# Authentication

Vocabulary Note uses Google Sign-In via Firebase Auth and the Chrome Identity API. Sign-in is optional — the extension works fully offline using local Chrome storage.

## How It Works

### Sign-in Flow

1. User clicks **Sign in with Google** on the options page.
2. `chrome.identity.getAuthToken({ interactive: true })` opens the Google OAuth consent screen.
3. The returned access token is exchanged for a Firebase credential via `GoogleAuthProvider.credential(null, token)`.
4. `signInWithCredential(auth, credential)` establishes a Firebase session.
5. `auth.onAuthStateChanged` fires in both the options page and the popup, switching both to `firebaseStorage` as the active service.

### Sign-out Flow

1. User clicks **Logout** in the options page header.
2. `firebaseStorage.signOut()` is called, which:
   - Gets the cached Chrome OAuth token (`chrome.identity.getAuthToken({ interactive: false })`)
   - Revokes it from Chrome's cache (`chrome.identity.removeCachedAuthToken`)
   - Calls `auth.signOut()` to end the Firebase session
3. `auth.onAuthStateChanged` fires with `null`, switching both contexts back to `storageService`.

Revoking the Chrome token is critical — skipping it causes silent re-authentication on the next sign-in attempt.

### Auth Persistence

`setPersistence(auth, browserLocalPersistence)` is configured in `src/services/firebase.js`. Auth tokens are stored in `localStorage` at the extension's origin (`chrome-extension://ID/`). Because the popup and options page share the same origin, a single sign-in persists across both contexts and survives popup close/reopen.

### Local-Only Mode

Clicking **Continue without signing in** on the login card sets `useLocalOnly = true` in the options page. The full UI loads using `storageService` (Chrome local storage). This state is in-memory only — it resets when the options page is reloaded, re-showing the login card.

---

## Storage Services

| State | Service used | Storage backend |
|---|---|---|
| Signed out | `StorageService` | `chrome.storage.local` |
| Signed in | `FirebaseStorageService` | Firestore (`users/{uid}/vocabulary`) |
| Local-only mode | `StorageService` | `chrome.storage.local` |

Both services implement the same interface (same method names and signatures), so all UI components can accept either as a `service` prop.

---

## Data Sync on Login

When a user signs in, the extension performs a one-time bi-directional sync:

| Firebase state | Local state | Action |
|---|---|---|
| Empty | Has words | Push local → Firebase |
| Has words | Any | Pull Firebase → local (merge via deduplication) |
| Empty | Empty | Nothing |

Settings use the same pattern: if Firebase has non-default settings, they overwrite local settings; otherwise local settings are pushed to Firebase.

Deduplication is by `word.toLowerCase()` — no duplicate entries are created.

---

## Manifest Requirements

```json
"permissions": ["storage", "alarms", "notifications", "contextMenus", "identity"],
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["openid", "email", "profile"]
}
```

The `identity` permission grants access to `chrome.identity.getAuthToken` and `chrome.identity.removeCachedAuthToken`. The `oauth2` block registers the extension with Google OAuth — the `client_id` must be a **Chrome App** type client ID created in Google Cloud Console.

---

## Environment Variables

Firebase is initialized from Vite env vars (`.env` file, not committed to source control):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

If any variable is missing, Firebase initialization fails gracefully — a fallback `auth` object with a no-op `onAuthStateChanged` is used, and the extension runs in local-only mode automatically.

---

## Auth-Aware Components

### Options page (`src/options/OptionsApp.jsx`)

- Shows a loading spinner while Firebase checks for a cached session (prevents login screen flash).
- Shows the login card when no user is authenticated and `useLocalOnly` is false.
- Shows the full app UI when either a user is signed in or `useLocalOnly` is true.
- The `service` variable (`firebaseStorage` or `storageService`) is passed to all child sections.

### Popup (`src/popup/PopupApp.jsx`)

- Listens to `auth.onAuthStateChanged` and switches the active service when auth state changes.
- The popup header shows a **Syncing** badge (with user avatar) when signed in, or a **Sign in** badge when not. Clicking either opens the options page.
- The popup does **not** host a sign-in UI — authentication always happens in the options page.

### Child components

All popup data components accept a `service` prop (defaulting to `storageService`):

| Component | Operations routed through `service` |
|---|---|
| `ReviewTab` | `updateWordSRS` |
| `VocabularyTab` | `deleteWord` |
| `AddWordTab` | `saveWord`, `exportVocabulary`, `importVocabulary` |
| `EditReviewModal` | `updateWord` |

---

## Key Files

| File | Role |
|---|---|
| `src/services/firebase.js` | Firebase app init, auth persistence config |
| `src/services/firebaseStorage.js` | Firestore CRUD + `authenticate()` + `signOut()` |
| `src/services/storage.js` | Local Chrome storage (same interface as FirebaseStorageService) |
| `src/options/OptionsApp.jsx` | Auth gate, login/logout UI, data sync on login |
| `src/popup/PopupApp.jsx` | Auth state listener, service selection, passes to children |
| `src/popup/components/Header.jsx` | Auth status indicator in popup |
