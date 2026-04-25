# Service Layer Documentation

The service layer provides abstractions for common operations like storage, dictionary lookups, authentication, and spaced repetition algorithms.

## Overview

```
Services/
├── storage.js               (Primary: chrome.storage.local)
├── firebaseStorage.js       (Secondary: Firestore sync)
├── firebase.js              (Firebase initialization)
├── dictionary.js            (External API: dictionaryapi.dev)
├── srs.js                   (SM-2 spaced repetition algorithm)
└── pronunciation.js         (Audio playback)
```

All services are **singletons** — imported once and reused across the app.

---

## StorageService (`src/services/storage.js`)

**Primary interface for local vocabulary and settings management.**

### Usage

```javascript
import StorageService from '@/services/storage';

// Get all vocabulary
const vocab = await StorageService.getVocabulary();

// Add a word
const newWord = {
  word: "example",
  meaning: "a thing characteristic of its kind",
  examples: ["She set an example"],
  ipa: "/ɪɡˈzɑːmpəl/",
  audioUrl: "https://...",
  youglishLink: "https://..."
};
await StorageService.addWord(newWord);

// Update a word
const updated = { ...word, meaning: "new meaning" };
await StorageService.updateWord(updated);

// Delete a word
await StorageService.deleteWord(wordId);

// Get settings
const settings = await StorageService.getSettings();

// Update settings
await StorageService.updateSettings({ theme: 'dark' });
```

### Methods

#### `getVocabulary(): Promise<Array>`
Returns all vocabulary items from `chrome.storage.local`.

**Returns**: Array of word objects

**Error handling**: Returns empty array if not found

---

#### `addWord(wordData): Promise<void>`
Creates a new word with SRS defaults and saves to storage.

**Parameters**:
- `wordData`: Object with `{ word, meaning, examples, ipa, audioUrl, youglishLink, isManual? }`

**Generates automatically**:
- `id`: `word_<timestamp>_<random>`
- `interval`: 1
- `repetition`: 0
- `easeFactor`: 2.5
- `nextReview`: Today + 1 day
- `createdAt`: Now
- `updatedAt`: Now

**Error handling**: Throws if save fails

---

#### `updateWord(word): Promise<void>`
Updates an existing word by ID.

**Parameters**:
- `word`: Full word object with updated fields

**Notes**:
- Updates `updatedAt` timestamp
- Does not modify `createdAt`
- Preserves SRS data if not explicitly changed

---

#### `deleteWord(wordId): Promise<void>`
Removes a word from vocabulary.

**Parameters**:
- `wordId`: Word ID string

**Error handling**: No-op if word not found

---

#### `getSettings(): Promise<Object>`
Retrieves user settings.

**Returns**:
```javascript
{
  theme: 'light' | 'dark',
  notificationsEnabled: true,
  cloudSyncEnabled: false,
  dailyReminder: '09:00',
  reviewsPerSession: 20
}
```

**Default settings**: Applied if not found in storage

---

#### `updateSettings(updates): Promise<void>`
Merges settings updates (shallow merge).

**Parameters**:
- `updates`: Object with settings to update

**Example**:
```javascript
await StorageService.updateSettings({ theme: 'dark' });
// Keeps other settings intact
```

---

## FirebaseStorageService (`src/services/firebaseStorage.js`)

**Secondary cloud sync layer using Firestore.**

### Important Notes

- Requires user to authenticate via `chrome.identity` OAuth
- Mirrors vocabulary to Firestore under user's UID
- Local storage (`StorageService`) is source of truth
- Use alongside `StorageService`, not instead of it

### Usage

```javascript
import FirebaseStorageService from '@/services/firebaseStorage';

// Check if user is authenticated
const isAuthenticated = await FirebaseStorageService.isAuthenticated();

// Sign in
await FirebaseStorageService.signIn();

// Sign out
await FirebaseStorageService.signOut();

// Get authenticated user
const user = await FirebaseStorageService.getAuthUser();

// Sync vocabulary to Firestore
await FirebaseStorageService.syncVocabulary(vocabularyArray);

// Add word to Firestore
await FirebaseStorageService.addWord(wordObject);

// Update word in Firestore
await FirebaseStorageService.updateWord(wordObject);

// Delete word from Firestore
await FirebaseStorageService.deleteWord(wordId);
```

### Data Structure in Firestore

```
users/{uid}/
  vocabulary/{wordId}
    ├── word: "example"
    ├── meaning: "..."
    ├── examples: [...]
    ├── ipa: "..."
    ├── interval: 1
    ├── nextReview: timestamp
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    └── (all fields from local storage)
```

### Methods

#### `isAuthenticated(): Promise<Boolean>`
Check if user is currently signed in.

---

#### `signIn(): Promise<Object>`
Open Google OAuth sign-in flow via `chrome.identity`.

**Returns**: User object with email, uid

**Errors**: Throws if user cancels or network fails

---

#### `signOut(): Promise<void>`
Sign out user and clear auth tokens.

---

#### `getAuthUser(): Promise<Object|null>`
Get current authenticated user if signed in.

**Returns**: User object or null

---

#### `syncVocabulary(vocabularyArray): Promise<void>`
Push all vocabulary to Firestore (initial sync).

**Parameters**:
- `vocabularyArray`: Array of word objects to sync

**Use case**: First-time sync when user enables cloud features

---

#### `addWord(word): Promise<void>`
Add word to Firestore collection.

---

#### `updateWord(word): Promise<void>`
Update word in Firestore.

---

#### `deleteWord(wordId): Promise<void>`
Remove word from Firestore.

---

## DictionaryService (`src/services/dictionary.js`)

**Fetch word definitions, pronunciations, and examples from external Dictionary API.**

### API Used

- **Base URL**: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **Free tier**: No authentication needed

### Usage

```javascript
import DictionaryService from '@/services/dictionary';

const wordData = await DictionaryService.fetchWord("serendipity");

// Returns:
// {
//   word: "serendipity",
//   phonetic: "/ˌserənˈdɪpɪti/",
//   meanings: [
//     {
//       partOfSpeech: "noun",
//       definitions: [{ definition: "...", example: "..." }]
//     }
//   ],
//   sourceUrls: ["https://..."]
// }
```

### Method

#### `fetchWord(word): Promise<Object>`
Fetch word data from Dictionary API.

**Parameters**:
- `word`: Word to look up (string)

**Returns**: Word object with definitions, examples, phonetics

**Error handling**: 
- Returns null if word not found (404)
- Returns null if network error
- Throws on other errors (caller should handle)

### Data Normalization

The service normalizes API response to extract:
- **word**: The word itself
- **meaning**: First definition
- **examples**: List of example sentences
- **ipa**: Phonetic spelling
- **audioUrl**: URL to pronunciation audio (if available)

---

## SRSService (`src/services/srs.js`)

**SM-2 Spaced Repetition System algorithm implementation.**

The SM-2 algorithm calculates optimal review intervals based on learning difficulty.

### Concepts

- **Interval**: Days until next review (starts at 1, grows with success)
- **Repetition**: Number of successful reviews (used in interval calculation)
- **EaseFactor**: Quality multiplier (1.3–5.0, controls growth rate)
- **Quality**: Rating from 0–5 indicating learning difficulty

### Quality Ratings

| Rating | Meaning | EaseFactor Adjustment | Interval Reset |
|--------|---------|----------------------|-----------------|
| 0–2    | Forgot/Too hard | Decrease | Reset to 1 |
| 3–4    | Struggled/OK | Decrease | Increase normally |
| 5      | Easy/Perfect | Increase | Increase faster |

### Usage

```javascript
import SRSService from '@/services/srs';

// When user reviews a word
const wordBeforeReview = {
  word: "serendipity",
  interval: 1,
  repetition: 0,
  easeFactor: 2.5,
  lastReview: 1682000000000
};

// User rates quality as 5 (perfect)
const wordAfterReview = SRSService.update(
  wordBeforeReview,
  5  // quality: 0-5
);

// Returns updated object:
// {
//   ...wordBeforeReview,
//   interval: 1,           // If rep 0
//   repetition: 1,         // Incremented
//   easeFactor: 2.6,       // Slightly increased
//   nextReview: <timestamp>, // today + new interval
//   lastReview: <now>
// }
```

### Methods

#### `update(word, quality): Object`
Apply SM-2 algorithm to update word's SRS state.

**Parameters**:
- `word`: Word object with current SRS state
- `quality`: Number 0-5 indicating learning difficulty

**Returns**: Updated word object with new interval/easeFactor/nextReview

**SM-2 Algorithm Details**:
1. If quality < 3: Reset repetition to 0, interval to 1
2. If quality >= 3: Increment repetition
3. Calculate new interval: 
   - If repetition = 1: interval = 1
   - If repetition = 2: interval = 3
   - If repetition > 2: interval = previous × easeFactor
4. Calculate new easeFactor:
   - `easeFactor += (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))`
   - Clamped to minimum 1.3

**Performance Note**: Logarithmic interval growth means most reviews happen in first 2–3 months, then years apart.

---

## PronunciationService (`src/services/pronunciation.js`)

**Play word pronunciation audio with fallback options.**

### Usage

```javascript
import PronunciationService from '@/services/pronunciation';

// Play audio URL
await PronunciationService.play("https://api.dictionaryapi.dev/audio/...");

// If URL fails, falls back to Web Speech API text-to-speech
// PronunciationService.playTextToSpeech("serendipity");
```

### Methods

#### `play(audioUrl): Promise<void>`
Play pronunciation audio from URL.

**Parameters**:
- `audioUrl`: URL to audio file

**Error handling**:
- If URL fails to load, falls back to Web Speech API
- If Web Speech fails, silently ignores (no error thrown)

---

#### `playTextToSpeech(text): Promise<void>`
Fallback: Use browser's Web Speech API to synthesize pronunciation.

**Parameters**:
- `text`: Word to pronounce

**Browser support**: Works in all modern browsers

---

## Firebase Initialization (`src/services/firebase.js`)

**Initialize Firebase SDK with config from environment variables.**

### Configuration

Firebase config comes from `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-123
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=G-...
```

### Constraints

- **Background script cannot initialize Firebase** (uses plain JS, no ES imports)
- Only popup and options pages initialize Firebase
- Content script uses messaging to communicate with background for Firebase needs

### Usage

```javascript
// In React components (popup/options only)
import { db, auth } from '@/services/firebase';

// db = Firestore instance
// auth = Firebase Auth instance
```

---

## Summary Table

| Service | Purpose | Async | Singleton | Fallback |
|---------|---------|-------|-----------|----------|
| StorageService | Local chrome.storage | ✓ | ✓ | Returns defaults |
| FirebaseStorageService | Cloud Firestore sync | ✓ | ✓ | Silently fails |
| DictionaryService | Word lookups | ✓ | ✓ | Returns null |
| SRSService | Review intervals | ✗ | ✓ | N/A (pure function) |
| PronunciationService | Audio playback | ✓ | ✓ | Web Speech API |

---

## Best Practices

### Error Handling

Always wrap service calls in try-catch:

```javascript
try {
  await StorageService.addWord(wordData);
  showAlert("Word added!", "success");
} catch (error) {
  console.error("Failed to add word:", error);
  showAlert("Failed to add word", "error");
}
```

### Offline Resilience

Local storage works offline; Firebase calls will fail gracefully:

```javascript
// This works offline
await StorageService.addWord(wordData);

// This fails silently if offline
await FirebaseStorageService.addWord(wordData); // Safe to ignore error
```

### Caching

Do not cache service results in components. Instead:

```javascript
// Good: Load on mount, re-fetch when needed
useEffect(() => {
  StorageService.getVocabulary().then(setVocabulary);
}, []);

// Bad: Cache in module scope
// const cachedVocab = StorageService.getVocabulary(); // Stale data
```

### Testing

Mock services in tests:

```javascript
// Mock StorageService
jest.mock('@/services/storage', () => ({
  getVocabulary: jest.fn().mockResolvedValue([...]),
  addWord: jest.fn().mockResolvedValue(undefined),
}));
```
