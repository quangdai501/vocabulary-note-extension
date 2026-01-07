# Quick Setup Guide

Follow these steps to get the extension running:

## Step 1: Create Icon Files (Required)

The extension needs three icon sizes. You have two options:

### Option A: Use Online Tool (Recommended)
1. Go to https://favicon.io/favicon-converter/
2. Upload the `icons/icon.svg` file
3. Download the generated icons
4. Rename and place them in the `icons/` folder:
   - favicon-16x16.png → icon16.png
   - favicon-32x32.png → icon48.png (resize to 48x48)
   - android-chrome-192x192.png → icon128.png (resize to 128x128)

### Option B: Use Image Editor
1. Open `icons/icon.svg` in any image editor (Photoshop, GIMP, Inkscape, etc.)
2. Export as PNG in three sizes: 16x16, 48x48, 128x128
3. Save them as `icon16.png`, `icon48.png`, `icon128.png` in the `icons/` folder

### Option C: Use Temporary Placeholders
For testing only, you can use simple colored squares:
- Create 16x16, 48x48, and 128x128 pixel PNG files
- Fill them with any color (e.g., purple #764ba2)
- Name them correctly and place in `icons/` folder

## Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" button
5. Select the `Vocabulary-note` folder
6. The extension should now appear in your toolbar!

## Step 3: Test the Extension

### Test Content Script
1. Go to any webpage (e.g., Wikipedia, news site)
2. Select a word by highlighting it
3. An inline popup should appear with Save, Play, and YouGlish buttons
4. Click "Save" to add the word

### Test Popup Interface
1. Click the extension icon in the toolbar
2. You should see three tabs: Today Review, All Vocabulary, Add Word
3. Check "All Vocabulary" to see your saved word
4. Go to "Add Word" and try adding a word manually

### Test Keyboard Shortcut
1. Go to any webpage
2. Highlight a word
3. Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
4. The word should be saved

### Test Review System
1. Click the extension icon
2. Go to "Today Review" tab
3. Review a word by clicking Hard, Good, or Easy
4. The word will be rescheduled based on your response

## Step 4: Customize (Optional)

### Change Reminder Time
Edit `background/background.js` line 120:
```javascript
const reminderTime = settings.dailyReminderTime || '09:00'; // Change to your preferred time
```

### Change Colors
Edit `popup/popup.css` and `content/content.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Change to your preferred gradient */
```

## Troubleshooting

### "Extension failed to load"
- Check that all files are in the correct locations
- Ensure icon files exist (icon16.png, icon48.png, icon128.png)
- Check browser console for errors (F12)

### "Content script not working"
- Refresh the webpage after loading the extension
- Try a different website (some sites block extensions)
- Check `chrome://extensions/` for errors

### "Cannot read property"
- Make sure all service files are in the `services/` folder
- Check that import paths are correct in the files

### "Popup doesn't open"
- Check that popup.html exists
- Verify icon files are present
- Look for errors in the extension details page

## File Checklist

Before loading the extension, verify these files exist:

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
- [ ] icons/icon16.png (YOU NEED TO CREATE THIS)
- [ ] icons/icon48.png (YOU NEED TO CREATE THIS)
- [ ] icons/icon128.png (YOU NEED TO CREATE THIS)

## Next Steps

1. **Add more words** - Start building your vocabulary
2. **Review daily** - Check the "Today Review" tab each day
3. **Export data** - Regularly backup your vocabulary using Export JSON
4. **Customize** - Adjust colors, times, and features to your preference

## Resources

- Free Dictionary API: https://dictionaryapi.dev/
- YouGlish: https://youglish.com/
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- SM-2 Algorithm: https://en.wikipedia.org/wiki/SuperMemo

---

Need help? Check README.md for detailed documentation.
