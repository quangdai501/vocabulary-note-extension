# Data Flow Documentation

This document describes how data moves through the extension across different user actions and scenarios.

## Core Data Flow Patterns

### 1. Adding a New Vocabulary Word

```
User Input (Popup)
       ↓
AddWordTab Component
       ↓
┌─────────────────────────────────────┐
│ User fills form:                    │
│ - Word name                         │
│ - Meaning (optional)                │
│ - Examples (optional)               │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ Click "Fetch from Dictionary"       │
│ ↓                                   │
│ DictionaryService.fetchWord()       │
│ ↓                                   │
│ Call Dictionary API                 │
│ GET /api/entries/en/{word}          │
│ ↓                                   │
│ Returns:                            │
│ - Meaning                           │
│ - Examples                          │
│ - IPA pronunciation                 │
│ - Audio URL                         │
│ - Youglish link                     │
└─────────────────────────────────────┘
       ↓
User approves and clicks "Add Word"
       ↓
┌─────────────────────────────────────┐
│ StorageService.addWord(wordData)    │
│ ↓                                   │
│ Create new word object:             │
│ - id: word_<timestamp>_<random>    │
│ - word, meaning, examples, ipa      │
│ - audioUrl, youglishLink            │
│ - SRS defaults: interval=1, ease=2.5│
│ - nextReview = today + interval     │
│ - createdAt = now                   │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ Save to chrome.storage.local        │
│ Key: "vocabulary"                   │
│ Value: [..existing, new_word]       │
└─────────────────────────────────────┘
       ↓
Is Firebase enabled? 
├─ Yes → FirebaseStorageService.addWord()
│         └─ Write to Firestore:
│            /users/{uid}/vocabulary/{id}
└─ No → Skip cloud sync
       ↓
Update component state + UI refresh
       ↓
Show success alert to user
```

### 2. Searching Vocabulary

```
User types in SearchInput
       ↓
SearchInput onChange handler fires
       ↓
Update parent state: setSearchTerm(value)
       ↓
VocabularyTab re-renders with new searchTerm
       ↓
VocabularyList receives searchTerm prop
       ↓
┌──────────────────────────────────────┐
│ Filter in-memory vocabulary array:   │
│ vocabulary.filter(word =>            │
│   word.word.toLowerCase()            │
│   .includes(searchTerm.toLowerCase())│
│ )                                    │
│                                      │
│ No storage access, pure JS filter    │
└──────────────────────────────────────┘
       ↓
Map filtered array to WordCard components
       ↓
Render results instantly (client-side only)
```

### 3. Reviewing Vocabulary (Spaced Repetition)

```
User clicks "Review" tab
       ↓
ReviewTab mounts
       ↓
Load vocabulary from storage
       ↓
┌──────────────────────────────────────┐
│ Filter words due for review:         │
│ const dueWords = vocabulary.filter(   │
│   word => word.nextReview <= today   │
│ )                                    │
│                                      │
│ Show count of due words              │
└──────────────────────────────────────┘
       ↓
Is dueWords.length > 0?
├─ Yes → Show first word card
│        Display:
│        - Word
│        - IPA pronunciation
│        - Meaning
│        - Examples
│        - Audio button
│        - 3 rating buttons: Hard/Good/Easy
│
└─ No → Show "No words to review"
            message
       ↓
User clicks rating button (Hard/Good/Easy)
       ↓
┌──────────────────────────────────────┐
│ SRSService.updateWord(word, rating)  │
│                                      │
│ SM-2 Algorithm (see SERVICES.md)     │
│                                      │
│ Input: word object + rating (1-3)    │
│ ↓                                    │
│ Calculate:                           │
│ - New easeFactor based on quality    │
│ - New interval in days               │
│ - New nextReview timestamp           │
│ ↓                                    │
│ Return updated word object           │
└──────────────────────────────────────┘
       ↓
StorageService.updateWord(updatedWord)
       ↓
Save to chrome.storage.local
       ↓
Is Firebase enabled?
├─ Yes → FirebaseStorageService.updateWord()
│         └─ Update in Firestore
└─ No → Skip cloud sync
       ↓
Move to next word in dueWords array
       ↓
Repeat until dueWords exhausted
       ↓
Show review summary (total reviewed, stats)
```

### 4. Editing a Word

```
User clicks edit icon on WordCard
       ↓
EditReviewModal opens in "edit" mode
       ↓
Modal displays current word data
       ↓
User modifies fields:
- Word
- Meaning
- Examples
- (IPA/audio are not editable)
       ↓
Click "Save" button
       ↓
Validate form (optional)
       ↓
StorageService.updateWord(updatedWord)
       ↓
Save to chrome.storage.local
       ↓
Is Firebase enabled?
├─ Yes → FirebaseStorageService.updateWord()
└─ No → Skip cloud sync
       ↓
Close modal + refresh vocabulary list
       ↓
Show success alert
```

### 5. Deleting a Word

```
User clicks delete icon on WordCard
       ↓
Show confirmation dialog
       ↓
User confirms deletion
       ↓
StorageService.deleteWord(wordId)
       ↓
Remove from chrome.storage.local
       ↓
Is Firebase enabled?
├─ Yes → FirebaseStorageService.deleteWord(wordId)
│         └─ Delete from Firestore
└─ No → Skip cloud sync
       ↓
Update component state (remove from array)
       ↓
Re-render vocabulary list
       ↓
Show success alert
```

## Storage Architecture

### Chrome Storage Local (Primary)

```
chrome.storage.local = {
  "vocabulary": [
    {
      id: "word_1682000000000_abc123",
      word: "serendipity",
      meaning: "The occurrence of events by chance in a happy or beneficial way",
      examples: ["It was pure serendipity that we met"],
      ipa: "/ˌserənˈdɪpɪti/",
      audioUrl: "https://...",
      youglishLink: "https://youglish.com/search/serendipity",
      interval: 3,
      repetition: 2,
      easeFactor: 2.35,
      nextReview: 1682260000000,
      lastReview: 1682000000000,
      createdAt: 1681000000000,
      updatedAt: 1682000000000,
      isManual: false
    },
    // ...more words
  ],
  "settings": {
    "theme": "light",
    "notificationsEnabled": true,
    "cloudSyncEnabled": true
  }
}
```

### Firestore (Secondary, Optional)

```
users/{uid}/
├── settings/
│   └── Basic user settings
└── vocabulary/{wordId}
    ├── id: "word_1682000000000_abc123"
    ├── word: "serendipity"
    ├── meaning: "..."
    ├── (all fields same as local storage)
    └── updatedAt: timestamp
```

**Sync behavior**:
- When user signs in, `FirebaseStorageService` mirrors local vocabulary to Firestore
- Subsequent add/edit/delete operations update both storage systems
- On app start, Firestore is read-only reference (local storage is source of truth)
- No real-time sync: changes are pushed, not pulled

## Message Passing Between Contexts

### Background Service Worker as Coordinator

```
                    ┌──────────────────┐
                    │  Content Script  │
                    └────────┬─────────┘
                             │
                             │ chrome.runtime.sendMessage()
                             │ { action: "translateWord",
                             │   word: "serendipity" }
                             ↓
                    ┌──────────────────┐
                    │   Background     │
                    │  Service Worker  │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    ↓                  ↓
            (1) Handle directly     (2) Relay to popup
            (fetch API, etc)        chrome.runtime.sendMessage()
                             │
                    ┌────────▼─────────┐
                    │     Popup/       │
                    │    Options       │
                    └──────────────────┘
```

### Example: Content Script Requests Word Translation

```
Content Script (in web page)
├─ User selects text "serendipity"
├─ Shows inline popup
└─ User clicks "Add Word"
   │
   └─ chrome.runtime.sendMessage({
        action: "addWordFromContent",
        word: "serendipity",
        context: {page, selection}
      })
       │
       ↓ Message routed via chrome.runtime.onMessage
Background Service Worker
   │
   ├─ Receives message
   └─ Calls DictionaryService.fetchWord("serendipity")
       │
       └─ Returns word data
          │
          └─ chrome.tabs.sendMessage(tabId, {
               result: wordData
             })
              │
              ↓ Content script receives response
Content Script
   └─ Updates inline popup with word details
      User confirms → sends to popup for storage
```

## State Synchronization

### When Popup Loads

```
PopupApp mounts
       ↓
useEffect(() => {
  StorageService.getVocabulary()
    .then(vocab => setVocabulary(vocab))
}, [])
       ↓
chrome.storage.local.get("vocabulary") returns data
       ↓
Component state updated
       ↓
Render VocabularyTab/ReviewTab/etc with data
```

### When Word is Updated in Options Page

```
OptionsApp: Word updated
       ↓
StorageService.updateWord() 
       ↓
Saves to chrome.storage.local
       ↓
Popup is still open (background context)
       │
┌──────┴─────────────────────────────────┐
│ Does popup get updated automatically?  │
│ No! Only if:                           │
│ 1. User clicks reload                  │
│ 2. Popup is re-opened (onMessage)      │
│ 3. We implement storage.onChanged()    │
└───────────────────────────────────────┘
```

**Solution**: Implement `chrome.storage.onChanged()` listener to sync popup when storage changes:

```javascript
// In PopupApp.jsx
useEffect(() => {
  const handleStorageChange = (changes) => {
    if (changes.vocabulary) {
      setVocabulary(changes.vocabulary.newValue);
    }
  };
  
  chrome.storage.onChanged.addListener(handleStorageChange);
  return () => chrome.storage.onChanged.removeListener(handleStorageChange);
}, []);
```

## Error Handling Flow

### Storage Operation Fails

```
StorageService.addWord() called
       ↓
chrome.storage.local.set() rejects
       ↓
Catch error
       ↓
┌──────────────────────────────────────┐
│ Options:                             │
│ 1. Retry operation                   │
│ 2. Show error alert to user          │
│ 3. Log to console/monitoring         │
└──────────────────────────────────────┘
```

### Dictionary API Fails

```
DictionaryService.fetchWord() called
       ↓
Fetch request fails (no network, 404, etc)
       ↓
Catch error
       ↓
┌──────────────────────────────────────┐
│ Return fallback data:                │
│ - word: user input                   │
│ - meaning: "" (empty)                │
│ - examples: []                       │
│ - IPA: "" (user can add manually)    │
│                                      │
│ isManual = true flag                 │
└──────────────────────────────────────┘
       ↓
User can still save with manual entry
       ↓
Show alert: "Couldn't fetch data"
           "But you can add it manually"
```

### Firebase Sync Fails

```
FirebaseStorageService.addWord() called
       ↓
Firestore write fails
       ↓
┌──────────────────────────────────────┐
│ Options:                             │
│ 1. Silently fail (warn in console)   │
│ 2. Queue for later sync              │
│                                      │
│ Local storage already saved, so      │
│ data is not lost                     │
└──────────────────────────────────────┘
       ↓
Show non-blocking alert: "Cloud sync failed"
       │ (Optional: show retry button)
```

## Offline Behavior

```
User offline, adds word
       ↓
StorageService.addWord() succeeds
(chrome.storage.local works offline)
       ↓
FirebaseStorageService.addWord() fails
(No network)
       ↓
Word stored locally
       ↓
Firebase sync queued or skipped
       ↓
User comes back online
       ↓
┌────────────────────────────────────────┐
│ Options:                               │
│ 1. Auto-sync: Listen for online event │
│    window.addEventListener('online'.. │
│ 2. Manual sync: User clicks button    │
│ 3. Sync on next operation             │
└────────────────────────────────────────┘
```

## Summary

- **Local storage** (`chrome.storage.local`) is always primary and persistent
- **Firebase** is optional secondary sync layer
- **Filtering/searching** is client-side only (no server calls)
- **Message passing** coordinates between popup, options, content script
- **SRS calculations** are client-side (no server storage)
- **Storage changes** should be listened to for real-time popup updates
- **Offline works**: words saved locally, Firebase sync when back online
