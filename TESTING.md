# Testing Guide

This guide will help you test all features of the Vocabulary Note extension.

## Prerequisites

1. Extension loaded in Chrome (`chrome://extensions/`)
2. Icons generated and placed in `icons/` folder
3. Chrome notifications enabled

## Test Checklist

### ✅ 1. Extension Installation

- [ ] Extension appears in Chrome toolbar
- [ ] Extension icon is visible
- [ ] No errors in `chrome://extensions/` page
- [ ] Popup opens when clicking icon

### ✅ 2. Content Script - Word Selection

**Test 2.1: Inline Popup Display**
1. Go to any webpage (e.g., https://en.wikipedia.org/wiki/Vocabulary)
2. Highlight a word (e.g., "vocabulary")
3. Verify popup appears above selection
4. Verify popup shows 3 buttons: Save, Play, YouGlish

**Test 2.2: Save Button**
1. Click "Save" button in inline popup
2. Wait for loading notification
3. Verify success notification appears
4. Click extension icon → "All Vocabulary" tab
5. Verify word appears in list

**Test 2.3: Play Button**
1. Highlight a word
2. Click "Play" in inline popup
3. Verify pronunciation plays (audio or speech synthesis)
4. Verify notification shows "Playing pronunciation..."

**Test 2.4: YouGlish Button**
1. Highlight a word
2. Click "YouGlish" in inline popup
3. Verify YouGlish opens in new tab
4. Verify word is pre-filled in YouGlish search

**Test 2.5: Popup Dismissal**
1. Highlight a word to show popup
2. Click elsewhere on page
3. Verify popup disappears

### ✅ 3. Keyboard Shortcut

**Test 3.1: Windows/Linux**
1. Highlight a word
2. Press `Ctrl+Shift+S`
3. Verify word is saved
4. Verify success notification appears

**Test 3.2: Mac**
1. Highlight a word
2. Press `Cmd+Shift+S`
3. Verify word is saved

### ✅ 4. Context Menu

**Test 4.1: Right-Click Save**
1. Highlight a word
2. Right-click to open context menu
3. Verify "Save to Vocabulary" option appears
4. Click the option
5. Verify word is saved

### ✅ 5. Popup Interface - Review Tab

**Test 5.1: Empty State**
1. Clear all vocabulary (if any)
2. Open popup → "Today Review" tab
3. Verify empty state shows:
   - Icon
   - "No words to review today!"
   - "Great job! Check back tomorrow."

**Test 5.2: Review Card Display**
1. Add at least one word
2. Open popup → "Today Review" tab
3. Verify card shows:
   - Word in large text
   - IPA pronunciation
   - Meaning
   - Example sentence
   - YouGlish link
   - Play button
   - Three review buttons (Hard, Good, Easy)
   - Progress counter (e.g., "1 / 5")

**Test 5.3: Play Pronunciation**
1. In review card, click play button (speaker icon)
2. Verify pronunciation plays

**Test 5.4: YouGlish Link**
1. Click "Open YouGlish" link
2. Verify opens in new tab
3. Verify word is pre-filled

**Test 5.5: Review Buttons - Hard**
1. Click "Hard" button
2. Verify next word appears (if multiple words due)
3. Check "All Vocabulary" → verify interval is short (likely 1 day)

**Test 5.6: Review Buttons - Good**
1. Click "Good" button
2. Verify next word appears
3. Check interval is moderate

**Test 5.7: Review Buttons - Easy**
1. Click "Easy" button
2. Verify next word appears
3. Check interval is longer than "Good"

**Test 5.8: Review Session Complete**
1. Review all due words
2. Verify empty state appears after last word
3. Verify statistics update

### ✅ 6. Popup Interface - Vocabulary Tab

**Test 6.1: Empty State**
1. Clear all vocabulary
2. Go to "All Vocabulary" tab
3. Verify empty state shows appropriate message

**Test 6.2: Vocabulary List Display**
1. Add multiple words
2. Go to "All Vocabulary" tab
3. Verify each word card shows:
   - Word name
   - IPA notation
   - Meaning
   - Next review date
   - Play button
   - Delete button
   - "DUE" badge (if applicable)

**Test 6.3: Search Functionality**
1. Add words: "vocabulary", "dictionary", "language"
2. Type "voc" in search box
3. Verify only "vocabulary" appears
4. Clear search
5. Verify all words reappear

**Test 6.4: Play Button**
1. Click play button on a word card
2. Verify pronunciation plays

**Test 6.5: Delete Button**
1. Click delete button
2. Verify confirmation dialog appears
3. Click "OK"
4. Verify word is removed from list
5. Verify statistics update

### ✅ 7. Popup Interface - Add Word Tab

**Test 7.1: Manual Entry - Basic**
1. Go to "Add Word" tab
2. Enter word: "test"
3. Enter meaning: "a trial of quality"
4. Enter example: "This is a test."
5. Click "Add Word"
6. Verify success message
7. Go to "All Vocabulary" → verify word appears

**Test 7.2: Manual Entry - Word Only**
1. Enter only word field: "sample"
2. Leave meaning and example empty
3. Click "Add Word"
4. Verify word saves with default values

**Test 7.3: Auto-Fetch from Dictionary**
1. Enter word: "serendipity"
2. Click "Auto-fetch from Dictionary"
3. Wait for API response
4. Verify meaning field populates
5. Verify example field populates
6. Click "Add Word"
7. Verify full data is saved (check IPA, audio)

**Test 7.4: Auto-Fetch - Word Not Found**
1. Enter gibberish word: "asdfghjkl"
2. Click "Auto-fetch from Dictionary"
3. Verify alert: "Word not found in dictionary..."
4. Verify can still add manually

**Test 7.5: Duplicate Word**
1. Add word "example"
2. Try to add "example" again
3. Verify alert: "This word already exists..."

**Test 7.6: Form Validation**
1. Leave word field empty
2. Click "Add Word"
3. Verify HTML5 validation prevents submission

### ✅ 8. Export & Import

**Test 8.1: Export JSON**
1. Add multiple words
2. Go to "Add Word" tab → "Import / Export" section
3. Click "Export JSON"
4. Verify file downloads
5. Open file in text editor
6. Verify JSON structure is correct
7. Verify all words are present

**Test 8.2: Import JSON**
1. Export current vocabulary
2. Clear all vocabulary (delete all words)
3. Click "Import JSON"
4. Select exported file
5. Verify success message
6. Go to "All Vocabulary"
7. Verify all words are restored

**Test 8.3: Import with Existing Data**
1. Have some words in vocabulary
2. Import a JSON file with different words
3. Verify both old and new words appear (merge, not replace)

**Test 8.4: Import Invalid File**
1. Create a text file with invalid JSON
2. Try to import
3. Verify appropriate error message

### ✅ 9. Statistics

**Test 9.1: Total Words Counter**
1. Note current total
2. Add a word
3. Verify total increases by 1
4. Delete a word
5. Verify total decreases by 1

**Test 9.2: Due Words Counter**
1. Add a new word (due immediately)
2. Verify "Due" counter includes it
3. Review the word
4. Verify "Due" counter decreases

### ✅ 10. Spaced Repetition Algorithm

**Test 10.1: First Review**
1. Add a new word
2. Review it as "Good"
3. Check next review date
4. Verify interval is 1 day

**Test 10.2: Second Review**
1. Wait for first review (or manually set nextReview to past)
2. Review as "Good"
3. Verify interval is 6 days

**Test 10.3: Easy Response**
1. Review a word as "Easy"
2. Verify interval is longer than "Good" would give
3. Verify ease factor increases

**Test 10.4: Hard Response**
1. Review a word as "Hard"
2. Verify interval is shorter than "Good" would give
3. Verify ease factor decreases

**Test 10.5: Predicted Intervals**
1. During review, check the small text on each button
2. Verify "Hard" shows shortest interval
3. Verify "Good" shows medium interval
4. Verify "Easy" shows longest interval

### ✅ 11. Background Service & Alarms

**Test 11.1: Daily Alarm Setup**
1. Install extension
2. Check Chrome background processes
3. Verify service worker is active
4. Check console logs for "Daily alarm set for..."

**Test 11.2: Notification - Due Words**
1. Add a word and review it
2. Manually set its `nextReview` to current time (use storage inspector)
3. Wait for notification (or trigger alarm manually)
4. Verify notification appears with correct count

**Test 11.3: Notification Button**
1. When notification appears
2. Click "Review Now" button
3. Verify popup opens to review tab

### ✅ 12. Storage Persistence

**Test 12.1: Data Persistence**
1. Add several words
2. Close popup
3. Close Chrome completely
4. Restart Chrome
5. Open extension popup
6. Verify all words are still there

**Test 12.2: Review Progress Persistence**
1. Start reviewing words (do 2 out of 5)
2. Close popup
3. Reopen popup
4. Verify progress continues from where you left off

### ✅ 13. Edge Cases

**Test 13.1: Very Long Word**
1. Try to save: "pneumonoultramicroscopicsilicovolcanoconiosis"
2. Verify it displays correctly in all views

**Test 13.2: Special Characters**
1. Try word with apostrophe: "don't"
2. Try word with hyphen: "well-being"
3. Verify saves and displays correctly

**Test 13.3: Multiple Tabs**
1. Open extension in multiple tabs
2. Add a word in one tab
3. Open popup in another tab
4. Verify word appears

**Test 13.4: No Internet**
1. Disconnect internet
2. Try to save a word from webpage
3. Verify content script still works
4. Verify fallback to manual entry works

**Test 13.5: API Rate Limiting**
1. Rapidly save multiple words
2. Verify all complete successfully
3. Check for any errors

### ✅ 14. Cross-Browser Compatibility

**Test 14.1: Chromium-based Browsers**
- [ ] Google Chrome
- [ ] Microsoft Edge
- [ ] Brave
- [ ] Opera

**Test 14.2: Different OS**
- [ ] Windows
- [ ] macOS
- [ ] Linux

## Performance Tests

### ✅ 15. Performance

**Test 15.1: Large Vocabulary**
1. Import or add 100+ words
2. Open "All Vocabulary" tab
3. Verify loads within 2 seconds
4. Test search performance

**Test 15.2: Search Performance**
1. With 100+ words loaded
2. Type rapidly in search box
3. Verify no lag or delay

**Test 15.3: Memory Usage**
1. Open `chrome://extensions/`
2. Find extension
3. Click "Inspect views: service worker"
4. Check memory usage in DevTools
5. Verify no memory leaks over time

## Bug Reporting Template

If you find a bug, report it with this format:

```
**Bug Title:** Short description

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: Windows/Mac/Linux
- Chrome Version: X.X.X
- Extension Version: 1.0.0

**Screenshots/Logs:**
(if applicable)
```

## Success Criteria

The extension is ready for use when:
- ✅ All core features work (save, review, search)
- ✅ No console errors in normal usage
- ✅ Data persists across sessions
- ✅ UI is responsive and smooth
- ✅ SRS algorithm schedules correctly
- ✅ Export/Import works reliably

---

**Happy Testing! 🚀**
