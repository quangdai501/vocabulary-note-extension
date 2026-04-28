# Vocabulary Note - Chrome Extension

A powerful Chrome Extension for learning and storing English vocabulary with daily reminders using Spaced Repetition (SM-2 algorithm).

## 🎯 Features

### Core Features

1. **Vocabulary Capture**
   - Select any English word on a webpage
   - Inline popup with Save, Play pronunciation, and YouGlish options
   - Keyboard shortcut (Ctrl+Shift+S / Cmd+Shift+S) to quickly save words
   - Context menu integration

2. **Comprehensive Word Data**
   - Word definition and meaning
   - IPA pronunciation notation
   - Audio pronunciation (with fallback to Web Speech API)
   - Example sentences
   - Direct link to YouGlish for real-world usage

3. **Dictionary Integration**
   - Automatic fetching from Free Dictionary API
   - Fallback to manual entry if word not found
   - Parses definitions, examples, IPA, and audio

4. **Spaced Repetition System (SM-2)**
   - Scientifically proven algorithm for optimal learning
   - Three difficulty levels: Hard, Good, Easy
   - Automatic scheduling of next review
   - Tracks interval, repetition count, and ease factor

5. **Daily Reminders**
   - Chrome alarms for scheduled reviews
   - Desktop notifications for due words
   - Customizable reminder time

6. **Popup Interface**
   - **Vocabulary Overview**: Browse and search saved words from the toolbar popup
   - **Quick Access**: Open the full options page for review, manual entry, and settings

7. **Options Interface**
   - **Today Review**: Review due words with SRS buttons
   - **All Vocabulary**: Browse and search saved words
   - **Add Word**: Manually add words with auto-fetch option

7. **Storage & Export**
   - Local storage using chrome.storage.local
   - Export vocabulary as JSON
   - Import vocabulary from JSON
   - Data structure optimized for future export formats

## 📁 Project Structure

```
Vocabulary-note/
├── manifest.json                 # Extension manifest (Manifest V3)
├── background/
│   └── background.js            # Service worker for alarms & notifications
├── content/
│   ├── content.js               # Content script for word selection
│   └── content.css              # Styles for inline popup
├── popup/
│   ├── popup.html               # Extension popup interface
│   ├── popup.js                 # Popup logic and UI controller
│   └── popup.css                # Popup styles
├── services/
│   ├── dictionary.js            # Dictionary API integration
│   ├── srs.js                   # Spaced Repetition System (SM-2)
│   ├── storage.js               # Chrome storage management
│   └── pronunciation.js         # Audio pronunciation handling
├── utils/
│   ├── constants.js             # App constants and configuration
│   └── example-data.js          # Example data structures
├── icons/
│   ├── icon16.png               # 16x16 icon (needs to be created)
│   ├── icon48.png               # 48x48 icon (needs to be created)
│   ├── icon128.png              # 128x128 icon (needs to be created)
│   └── icon.svg                 # Source SVG icon
└── README.md                    # This file
```

## 🚀 Installation

### Development Mode

1. **Clone or download** this project to your local machine

2. **Create icon files** (required):
   - Convert `icons/icon.svg` to PNG in three sizes: 16x16, 48x48, 128x128
   - Save them as `icon16.png`, `icon48.png`, `icon128.png` in the `icons/` folder
   - You can use online tools like [favicon.io](https://favicon.io/) or [icoconverter.com](https://www.icoconverter.com/)

3. **Load extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `Vocabulary-note` folder

4. **Start using**:
   - Click the extension icon in the toolbar
   - Select words on any webpage
   - Use the keyboard shortcut `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)

## 💡 Usage Guide

### Saving Words

**Method 1: Text Selection**
1. Highlight any word on a webpage
2. An inline popup will appear with three buttons
3. Click "Save" to add the word to your vocabulary

**Method 2: Keyboard Shortcut**
1. Highlight a word
2. Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)

**Method 3: Context Menu**
1. Right-click on selected text
2. Choose "Save to Vocabulary"

**Method 4: Manual Entry**
1. Click the extension icon
2. Open the full options page from the popup header
3. Go to "Add Word"
4. Enter word, meaning, and example
5. Click "Auto-fetch from Dictionary" to get data automatically
6. Click "Add Word" to save

### Reviewing Words

1. Click the extension icon
2. Open the full options page from the popup header
3. Go to "Today Review"
4. For each word:
   - Read the word, meaning, and example
   - Click the play button to hear pronunciation
   - Click "Open YouGlish" to see real-world usage
   - Rate your recall: **Hard**, **Good**, or **Easy**
5. The system automatically schedules the next review

### Managing Vocabulary

1. Click the extension icon
2. Use the vocabulary view in the popup, or open the full options page for management
3. Use the search box to filter words
4. Click the play button to hear pronunciation
5. Click the delete button to remove words

### Export & Import

**Export:**
1. Open the full options page
2. Go to "Add Word"
3. Scroll to "Import / Export" section
4. Click "Export JSON"
5. Save the file to your computer

**Import:**
1. Open the full options page
2. Go to "Add Word"
3. Click "Import JSON"
4. Select a previously exported JSON file
5. Words will be merged with existing vocabulary

## 🧠 Spaced Repetition Algorithm (SM-2)

The extension uses the SM-2 (SuperMemo 2) algorithm for optimal learning:

### How It Works

1. **Initial State**: New words start with interval = 0, repetition = 0, easeFactor = 2.5

2. **After Each Review**:
   - **Hard (Quality 3)**: Difficult to recall → shorter interval
   - **Good (Quality 4)**: Recalled with effort → standard interval
   - **Easy (Quality 5)**: Easy recall → longer interval

3. **Interval Calculation**:
   - First review: 1 day
   - Second review: 6 days
   - Subsequent reviews: previous_interval × easeFactor

4. **Ease Factor**: Adjusts based on performance
   - Formula: `EF' = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))`
   - Minimum: 1.3

5. **Modifiers**:
   - Hard: interval × 0.5
   - Easy: interval × 1.3

### Example Timeline

- Day 0: Learn word "serendipity"
- Day 1: Review (Good) → Next review in 6 days
- Day 7: Review (Easy) → Next review in ~16 days
- Day 23: Review (Good) → Next review in ~39 days
- And so on...

## 🛠️ Technical Stack

- **Manifest Version**: V3 (latest Chrome Extension standard)
- **JavaScript**: Vanilla ES6+ with modules
- **Storage**: chrome.storage.local
- **APIs**:
  - [Free Dictionary API](https://dictionaryapi.dev/)
  - Web Speech API (speechSynthesis)
  - Chrome Alarms API
  - Chrome Notifications API
  - Chrome Context Menus API

## 📊 Data Structure

### Vocabulary Object

```javascript
{
  id: "word_1704556800000_abc123def",
  word: "serendipity",
  meaning: "(noun) The occurrence of events by chance...",
  examples: ["A fortunate stroke of serendipity..."],
  ipa: "/ˌserənˈdɪpɪti/",
  audioUrl: "https://...",
  youglishLink: "https://youglish.com/pronounce/serendipity/english",
  interval: 6,
  repetition: 2,
  easeFactor: 2.6,
  nextReview: 1705161600000,
  lastReview: 1704643200000,
  createdAt: 1704556800000,
  updatedAt: 1704643200000,
  isManual: false
}
```

## 🎨 Customization

### Change Daily Reminder Time

1. Open `background/background.js`
2. Find the `setupDailyAlarm()` function
3. Modify the default time:
   ```javascript
   const reminderTime = settings.dailyReminderTime || '09:00'; // Change '09:00'
   ```

### Customize Colors

1. Open `popup/popup.css`
2. Find the gradient definitions:
   ```css
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   ```
3. Replace with your preferred colors

## 🐛 Troubleshooting

### Icons Not Showing
- Make sure icon files (16x16, 48x48, 128x128) are present in the `icons/` folder
- Check that filenames match exactly: `icon16.png`, `icon48.png`, `icon128.png`

### Content Script Not Working
- Refresh the page after installing the extension
- Check if the site allows content scripts (some sites block extensions)

### Pronunciation Not Playing
- Check browser audio permissions
- Ensure the audio URL is valid
- Web Speech API fallback should work if audio URL fails

### Daily Reminders Not Working
- Check Chrome notification permissions
- Ensure Chrome is running at the reminder time
- Alarms persist even when popup is closed

## 🚀 Future Enhancements

Potential features for future versions:

- [ ] Word difficulty tagging
- [ ] Multiple example sentences per word
- [ ] CSV export format
- [ ] Anki integration
- [ ] Dark mode
- [ ] Statistics dashboard
- [ ] Word of the day
- [ ] Pronunciation practice mode
- [ ] Sync across devices (using chrome.storage.sync)
- [ ] Multiple languages support

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to fork, modify, and improve this extension. Some areas that could use improvement:

- Better error handling
- Unit tests
- Performance optimization
- UI/UX enhancements
- Additional API integrations

## 📞 Support

For issues, questions, or suggestions:
- Check the troubleshooting section
- Review the code comments for implementation details
- Examine the example data structure in `utils/example-data.js`

---

**Built with ❤️ for language learners**
`npx vite build --config vite.content.config.js`
