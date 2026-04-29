# Vocabulary Note - Full Feature Specification

> This document describes all features of the Vocabulary Note Chrome Extension, intended as a reference for building a mobile app equivalent.

---

## 1. Overview

**Vocabulary Note** is a vocabulary learning app that helps users save English words, look up definitions and translations, and review them using the SM-2 Spaced Repetition algorithm. Users authenticate with Google, and all data is stored in Firebase Firestore.

---

## 2. Authentication

- **Provider:** Google OAuth 2.0 via Firebase Auth
- **Scopes:** `openid`, `email`, `profile`
- **Session persistence:** OAuth token cached locally; silent re-authentication on app launch using cached token
- **Sign-in screen:** Single "Sign in with Google" button; no guest mode
- **Sign-out:** Available from the settings/profile area; clears cached token and Firebase session

---

## 3. Core Screens & Features

### 3.1 Home / Dashboard

| Element | Description |
|---------|-------------|
| Total word count | Number of saved vocabulary words |
| Due word count | Words scheduled for review today (highlighted) |
| User profile | Avatar (or initials), display name or email |
| Navigation | Access to Review, Vocabulary, Add Word, and Settings |

---

### 3.2 Review (Spaced Repetition Practice)

The main learning screen. Shows words that are due for review.

**Display:**
- Word in large text
- IPA pronunciation (toggleable via settings)
- "Show Meaning" / "Hide Meaning" toggle
- Meaning displayed in a highlighted box when revealed
- Progress indicator: "Word X of Y"

**Actions:**
- **Play pronunciation** — plays audio URL if available, falls back to text-to-speech (en-US)
- **YouGlish** — opens YouGlish.com to show real-world pronunciation examples
- **4 review buttons** with predicted next interval shown:

| Button | Color | Quality Score | Behavior |
|--------|-------|---------------|----------|
| Again | Red | 1 | Forgot — resets repetition counter, interval = 1 day |
| Hard | Orange | 3 | Difficult recall — interval × 0.5 |
| Good | Green | 4 | Normal recall — standard SM-2 calculation |
| Easy | Blue | 5 | Easy recall — interval × 1.3 bonus |

**Empty state:** "No words to review today! Great job! Check back tomorrow."

---

### 3.3 Vocabulary List

Browse and manage all saved words.

**Features:**
- **Search:** Real-time filtering by word or meaning (case-insensitive)
- **Word cards** display:
  - Word name (bold)
  - IPA pronunciation
  - Meaning
  - Status badge: "Due" (red) or "Learned" (green)
  - Next review date

**Per-word actions:**
| Action | Description |
|--------|-------------|
| Play | Pronunciation playback |
| YouGlish | Open pronunciation examples |
| Cambridge | Open Cambridge Dictionary page |
| Google Translate | Open Google Translate (English → Vietnamese) |
| Edit review | Change next review date (input: days from today) |
| Delete | Remove word (with confirmation dialog) |

**Bulk actions:**
- **Reset all progress** — resets every word to initial SRS state (easeFactor=2.5, interval=1, repetitions=0). Requires confirmation.

---

### 3.4 Add Word

Add new vocabulary manually or via dictionary lookup.

**Workflow:**
1. Type a word in the input field
2. Tap **Lookup** (or press Enter) — fetches definition from Free Dictionary API
3. If found: meaning, IPA, and audio URL auto-populate
4. If not found: user can still save with a custom meaning
5. User can edit the meaning before saving
6. Tap **Save Word** to store

**Data saved per word:**
```
id:            "word_<timestamp>_<random>"
word:          string
meaning:       string (from API or manual)
ipa:           string (from API)
audioUrl:      string (from API)
youglishLink:  "https://youglish.com/pronounce/{word}/english"
examples:      string[] (from API)
interval:      1
repetition:    0
easeFactor:    2.5
nextReview:    Date.now()  (immediately due)
lastReview:    null
createdAt:     timestamp
updatedAt:     timestamp
isManual:      boolean
```

---

### 3.5 Settings

**General settings:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Daily reminder time | HH:MM | 09:00 | When to send daily review notification |
| Show notifications | boolean | true | Enable/disable push notifications |
| Auto-play pronunciation | boolean | false | Auto-play audio during review |
| Show IPA | boolean | true | Display IPA notation in UI |
| Daily review limit | number (1-100) | 20 | Max words per review session |

**Data management:**

| Action | Description |
|--------|-------------|
| Export vocabulary | Download all words as JSON backup file (`vocabulary-backup-YYYY-MM-DD.json`) |
| Import vocabulary | Upload a previously exported JSON file; merges with existing words |
| Clear all vocabulary | Permanently delete all words (requires confirmation) |

---

### 3.6 On-Page Word Saving (Mobile Equivalent: Share Sheet / Text Selection)

On the Chrome extension, users can select text on any webpage and save it. The mobile equivalent would be:
- **Share sheet integration** — receive shared text from other apps (browser, reader, etc.)
- **Text selection menu** — "Save to Vocabulary Note" option in system text selection menu
- **Clipboard import** — paste a word to look up and save

**Content script popup shows:**
- Selected word
- English definition (from Free Dictionary API)
- Vietnamese translation (from MyMemory Translation API)
- Part of speech
- 5 action buttons: Save, Pronounce, Cambridge, Translate, Examples (YouGlish)

---

## 4. Spaced Repetition Algorithm (SM-2)

The app uses the SM-2 algorithm for scheduling reviews.

**Parameters per word:**
- `easeFactor` — starts at 2.5, minimum 1.3
- `interval` — days until next review
- `repetition` — consecutive correct answers count
- `nextReview` — Unix timestamp (ms) of next scheduled review
- `lastReview` — Unix timestamp (ms) of last review

**Calculation:**
```
newEaseFactor = oldEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
// Clamped to minimum 1.3

If repetition == 0: interval = 1
If repetition == 1: interval = 6
Otherwise: interval = previousInterval * easeFactor

Modifiers:
  Hard: interval *= 0.5
  Easy: interval *= 1.3
```

**`isDue(word)`:** `word.nextReview <= Date.now()`

---

## 5. Push Notifications

- **Daily reminder** at user-configured time (default 09:00)
- **Content:** "You have X word(s) to review today!" (only if due words > 0)
- **Tap action:** Opens the Review screen
- **Configurable:** Can be disabled in settings

---

## 6. Data Architecture

### 6.1 Firebase Firestore Structure

```
users/
  {uid}/
    words/
      {wordId}/
        word: string
        meaning: string
        ipa: string
        audioUrl: string
        youglishLink: string
        examples: string[]
        easeFactor: number
        interval: number
        repetitions: number
        nextReview: number (Unix ms)
        lastReview: number (Unix ms)
        dateAdded: number
        createdAt: number
        updatedAt: number
        source: string
        isManual: boolean
    settings/
      preferences/
        dailyReminderTime: string
        showNotifications: boolean
        autoPlayPronunciation: boolean
        showIPA: boolean
        reviewLimit: number
```

### 6.2 Duplicate Detection

When saving a word, the app checks if a word with the same text already exists for the user. If it does, the existing entry is updated rather than creating a duplicate.

---

## 7. External APIs & Services

| Service | Purpose | URL/Endpoint |
|---------|---------|--------------|
| Free Dictionary API | Definitions, IPA, audio URLs | `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` |
| MyMemory Translation | English → Vietnamese translation | `https://api.mymemory.translated.net/get?q={text}&langpair=en|vi` |
| Google Translate | User-facing translation (opens in browser) | `https://translate.google.com/?sl=en&tl=vi&text={word}` |
| YouGlish | Real-world pronunciation examples | `https://youglish.com/pronounce/{word}/english` |
| Cambridge Dictionary | Reference dictionary (opens in browser) | `https://dictionary.cambridge.org/dictionary/english/{word}` |
| Firebase Auth | Google sign-in | Firebase SDK |
| Cloud Firestore | Data storage | Firebase SDK |

---

## 8. Pronunciation Playback

Two-tier fallback system:

1. **Audio URL** — if the dictionary API returned an audio file URL, play it directly
2. **Text-to-Speech** — fall back to device TTS engine (en-US locale, 0.9 speed)

---

## 9. User Workflows Summary

### Save a Word (from external source)
`Select/share text → See definition + translation → Tap Save → Word stored with SRS defaults`

### Daily Review
`Notification at configured time → Open app → See due words → Reveal meaning → Rate recall (Again/Hard/Good/Easy) → Next review scheduled`

### Manual Word Entry
`Open Add tab → Type word → Lookup → Edit meaning if needed → Save`

### Manage Vocabulary
`Open Vocabulary tab → Search/browse → Edit review dates, delete words, play pronunciation, open external references`

### Export/Import
`Settings → Export (JSON download) or Import (JSON upload) → Data preserved with all SRS fields`

---

## 10. Key UX Notes

- **Target language for translations:** Vietnamese (en → vi). This should ideally be configurable in the mobile app.
- **Color scheme:** The extension uses Tailwind CSS with indigo/blue primary colors. Cards use white backgrounds with subtle shadows.
- **Confirmation dialogs:** Required before destructive actions (delete word, clear all, reset progress).
- **Toast notifications:** Non-blocking success/error messages that auto-dismiss after 3 seconds.
- **Empty states:** Friendly messages with appropriate icons when no data exists or search returns no results.
