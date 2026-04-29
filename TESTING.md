# Testing Guide

## Prerequisites

1. Run `npm install` and `npm run build`
2. Load the extension from repo root at `chrome://extensions/` (Developer mode ON)
3. Chrome notifications enabled

## Build Verification

After `npm run build`, verify these files exist in `dist/`:

- [ ] `popup.js`
- [ ] `options.js`
- [ ] `content.js`
- [ ] `content.css`

## 1. Extension Installation

- [ ] Extension appears in Chrome toolbar
- [ ] Extension icon (SVG) is visible
- [ ] No errors in `chrome://extensions/`
- [ ] Popup opens when clicking icon

## 2. Content Script (Word Selection)

**Test 2.1: Inline Popup**
1. Go to any webpage (e.g., Wikipedia)
2. Highlight a word
3. Verify inline popup appears with Save, Play, and YouGlish buttons

**Test 2.2: Save Button**
1. Click "Save" in the inline popup
2. Verify success notification
3. Open popup > verify word appears in vocabulary list

**Test 2.3: Play Button**
1. Highlight a word, click "Play" in inline popup
2. Verify pronunciation plays (audio URL or Web Speech API fallback)

**Test 2.4: YouGlish Button**
1. Click "YouGlish" in inline popup
2. Verify YouGlish opens in new tab with the word pre-filled

**Test 2.5: Popup Dismissal**
1. Show inline popup by highlighting a word
2. Click elsewhere on page
3. Verify popup disappears

## 3. Keyboard Shortcut

1. Highlight a word on any webpage
2. Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
3. Verify word is saved

## 4. Context Menu

1. Highlight a word
2. Right-click > "Save to Vocabulary"
3. Verify word is saved

## 5. Popup Interface

**Test 5.1: Vocabulary List**
1. Click extension icon to open popup
2. Verify saved words appear with word, IPA, meaning, next review date
3. Verify play and delete buttons work

**Test 5.2: Search**
1. Type in the search box
2. Verify vocabulary list filters correctly
3. Clear search, verify all words reappear

**Test 5.3: Sign In Status**
1. When signed out, popup header should show "Sign in" badge
2. Clicking it should open the options page

## 6. Options Page - Review

**Test 6.1: Empty State**
1. Open options page > "Today Review"
2. With no due words, verify empty state message

**Test 6.2: Review Card**
1. Add a word (it's immediately due)
2. Open options page > "Today Review"
3. Verify card shows word, IPA, meaning, example, YouGlish link, play button
4. Verify Hard/Good/Easy buttons with predicted intervals

**Test 6.3: Review Buttons**
1. Click "Hard" — verify shorter interval
2. Click "Good" — verify standard interval
3. Click "Easy" — verify longer interval
4. After reviewing all words, verify empty state appears

## 7. Options Page - Add Word

**Test 7.1: Manual Entry**
1. Go to "Add Word" section
2. Enter word, meaning, example
3. Click "Add Word"
4. Verify word appears in vocabulary list

**Test 7.2: Auto-Fetch**
1. Enter a common word (e.g., "serendipity")
2. Click "Auto-fetch from Dictionary"
3. Verify meaning, IPA, examples populate automatically

**Test 7.3: Word Not Found**
1. Enter gibberish (e.g., "asdfghjkl")
2. Click "Auto-fetch from Dictionary"
3. Verify appropriate error message

**Test 7.4: Duplicate Prevention**
1. Try adding a word that already exists
2. Verify duplicate warning

## 8. Export / Import

**Test 8.1: Export**
1. Options page > Settings/Export section
2. Click "Export JSON"
3. Verify file downloads with valid JSON content

**Test 8.2: Import**
1. Click "Import JSON"
2. Select a previously exported file
3. Verify words are merged (not replaced)

**Test 8.3: Invalid Import**
1. Try importing an invalid JSON file
2. Verify error message

## 9. Authentication (Firebase)

**Test 9.1: Sign In**
1. Open options page
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify user avatar/name appears in header
5. Verify vocabulary syncs to Firestore

**Test 9.2: Sign Out**
1. Click "Logout" in options header
2. Verify returns to sign-in screen
3. Verify local data is still accessible

**Test 9.3: Local-Only Mode**
1. Click "Continue without signing in"
2. Verify full UI loads with local storage
3. Verify all features work without authentication

**Test 9.4: Cross-Context Auth**
1. Sign in on options page
2. Open popup
3. Verify popup shows "Syncing" badge with user avatar
4. Sign out on options page
5. Verify popup returns to "Sign in" state

## 10. Spaced Repetition (SM-2)

**Test 10.1: First Review**
1. Add a new word, review as "Good"
2. Verify next review is in ~1 day

**Test 10.2: Second Review**
1. Review the same word again as "Good"
2. Verify next review is in ~6 days

**Test 10.3: Difficulty Impact**
1. Review as "Easy" — verify longer interval, higher ease factor
2. Review as "Hard" — verify shorter interval, lower ease factor

## 11. Data Persistence

**Test 11.1: Across Sessions**
1. Add several words
2. Close and reopen Chrome
3. Verify all words persist

**Test 11.2: Popup/Options Consistency**
1. Add a word via options page
2. Open popup — verify word appears
3. Delete from popup — verify gone from options page

## 12. Edge Cases

- [ ] Very long word displays correctly
- [ ] Words with apostrophes/hyphens (e.g., "don't", "well-being")
- [ ] Offline mode: content script works, dictionary fetch shows error gracefully
- [ ] Rapid word saving (no data corruption)
- [ ] 100+ words: search and list performance acceptable

## Firebase Emulators (Developer Testing)

```bash
# Start emulators
npm run emulators:start

# Verify Cloud Functions trigger
npm run verify:word-trigger
```

## Shared Core Tests

```bash
npm run shared-core:test
```

## Bug Report Template

```
**Bug**: Short description

**Steps to Reproduce**:
1. ...
2. ...

**Expected**: What should happen
**Actual**: What happens instead

**Environment**: Chrome version, OS
**Logs**: Console errors (if any)
```
