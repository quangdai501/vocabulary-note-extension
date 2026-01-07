# 📋 Quick Reference Card

## Installation (1-2-3)
1. Generate icons: Open `icons/generate-icons.html` → Download all
2. Load extension: `chrome://extensions/` → Developer mode ON → Load unpacked
3. Start saving: Highlight word → Click "Save" or press `Ctrl+Shift+S`

## Keyboard Shortcuts
- **Save Word**: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)

## Ways to Save Words
1. **Inline Popup**: Highlight → Click "Save"
2. **Keyboard**: Highlight → `Ctrl/Cmd+Shift+S`
3. **Right-Click**: Highlight → Right-click → "Save to Vocabulary"
4. **Manual**: Extension icon → "Add Word" tab → Enter details

## Review System
- **Hard**: Difficult to recall → Shorter interval
- **Good**: Recalled with effort → Standard interval
- **Easy**: Easy recall → Longer interval

## SM-2 Intervals
- 1st review: 1 day
- 2nd review: 6 days
- 3rd+ review: previous × easeFactor

## Data Structure
```javascript
{
  word: "example",
  meaning: "(noun) definition",
  examples: ["sentence"],
  ipa: "/ɪɡˈzæmpəl/",
  audioUrl: "https://...",
  youglishLink: "https://youglish.com/...",
  interval: 6,        // days
  repetition: 2,      // count
  easeFactor: 2.6,    // SM-2
  nextReview: 123456, // timestamp
  lastReview: 123456
}
```

## File Locations
- **Background**: `background/background.js`
- **Content Script**: `content/content.js`, `content/content.css`
- **Popup UI**: `popup/popup.html`, `popup/popup.js`, `popup/popup.css`
- **Services**: `services/*.js`
- **Config**: `utils/constants.js`

## Chrome APIs Used
- `chrome.storage.local` - Data persistence
- `chrome.alarms` - Daily reminders
- `chrome.notifications` - Notifications
- `chrome.contextMenus` - Right-click menu
- `chrome.commands` - Keyboard shortcuts

## External APIs
- **Dictionary**: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- **YouGlish**: `https://youglish.com/pronounce/{word}/english`
- **Web Speech**: `window.speechSynthesis.speak()`

## Storage Keys
- `vocabulary` - Array of word objects
- `settings` - User settings object
- `stats` - Statistics object (optional)

## Common Tasks

### Change Reminder Time
`background/background.js` line ~120:
```javascript
const reminderTime = settings.dailyReminderTime || '09:00';
```

### Change Colors
`popup/popup.css` and `content/content.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modify SRS Parameters
`utils/constants.js`:
```javascript
export const SRS = {
  MIN_EASE_FACTOR: 1.3,
  INITIAL_EASE_FACTOR: 2.5,
  // ...
};
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Icons not showing | Generate PNG icons from `icons/generate-icons.html` |
| Content script not working | Refresh page after loading extension |
| Popup doesn't open | Check icon files exist: icon16.png, icon48.png, icon128.png |
| No pronunciation | Check audio URL or Web Speech API support |
| Data not saving | Check `chrome://extensions/` for errors |

## Testing Checklist
- [ ] Save word from webpage
- [ ] Review word (Hard/Good/Easy)
- [ ] Search vocabulary
- [ ] Delete word
- [ ] Export JSON
- [ ] Import JSON
- [ ] Play pronunciation
- [ ] Open YouGlish
- [ ] Keyboard shortcut
- [ ] Context menu

## File Checklist
- [x] manifest.json
- [x] background/background.js
- [x] content/content.js
- [x] content/content.css
- [x] popup/popup.html
- [x] popup/popup.js
- [x] popup/popup.css
- [x] services/dictionary.js
- [x] services/pronunciation.js
- [x] services/srs.js
- [x] services/storage.js
- [x] utils/constants.js
- [ ] icons/icon16.png ⚠️
- [ ] icons/icon48.png ⚠️
- [ ] icons/icon128.png ⚠️

## Important Functions

### Save Word
```javascript
// content/content.js
async function saveWord(word) {
  const wordData = await fetchFromAPI(word);
  await chrome.storage.local.set({ vocabulary: [...] });
}
```

### Review Word
```javascript
// popup/popup.js
async function handleReview(quality) {
  const updatedSRS = srsService.calculateNextReview(word, quality);
  await storageService.updateWordSRS(word.id, updatedSRS);
}
```

### Calculate SRS
```javascript
// services/srs.js
calculateNextReview(wordData, quality) {
  // SM-2 algorithm implementation
  return { interval, repetition, easeFactor, nextReview };
}
```

## Documentation Files
- **README.md** - Full documentation (4000+ words)
- **SETUP.md** - Quick setup guide
- **TESTING.md** - Testing checklist
- **PROJECT-SUMMARY.md** - Implementation overview
- **THIS FILE** - Quick reference

## Resources
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Free Dictionary API](https://dictionaryapi.dev/)
- [YouGlish](https://youglish.com/)
- [SM-2 Algorithm](https://en.wikipedia.org/wiki/SuperMemo)

## Statistics
- **Lines of Code**: ~2,500+
- **Files**: 20
- **Features**: 15+
- **APIs**: 3 external + 5 Chrome APIs

---

**Quick Start**: Generate icons → Load extension → Highlight word → Save → Review daily! 🚀
