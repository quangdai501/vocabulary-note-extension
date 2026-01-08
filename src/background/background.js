/**
 * Background Service Worker (Manifest V3)
 * Handles alarms, notifications, and context menu
 */

// Constants (inlined to avoid import issues)
const ALARMS = {
  DAILY_REVIEW: 'daily-review',
  CHECK_INTERVAL: 24 * 60 // 24 hours in minutes
};

const STORAGE_KEYS = {
  VOCABULARY: 'vocabulary',
  SETTINGS: 'settings',
  STATS: 'stats'
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Vocabulary Note installed');
    
    // Set up daily alarm
    await setupDailyAlarm();
    
    // Create context menu
    createContextMenu();
    
    // Initialize storage with default settings
    await initializeStorage();
  } else if (details.reason === 'update') {
    console.log('Vocabulary Note updated');
    await setupDailyAlarm();
    createContextMenu();
  }
});

// Also create context menu on startup to ensure it's always available
chrome.runtime.onStartup.addListener(() => {
  console.log('Vocabulary Note extension started');
  createContextMenu();
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.DAILY_REVIEW) {
    await checkAndNotifyDueWords();
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-word') {
    // Send message to active tab to save selected word
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'saveSelectedWord' });
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-word' && info.selectionText) {
    // Send message to content script to save the word
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'saveWord',
        word: info.selectionText.trim()
      });
    }
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'playPronunciation') {
    // Forward to tab to play pronunciation
    handlePronunciation(request.word, request.audioUrl);
    sendResponse({ success: true });
  } else if (request.action === 'checkDueWords') {
    checkAndNotifyDueWords().then(count => {
      sendResponse({ dueCount: count });
    });
    return true; // Keep channel open for async response
  }
});

/**
 * Set up daily alarm for review reminders
 */
async function setupDailyAlarm() {
  try {
    // Clear existing alarm
    await chrome.alarms.clear(ALARMS.DAILY_REVIEW);
    
    // Get user's preferred reminder time (default 9:00 AM)
    const settings = await getSettings();
    const reminderTime = settings.dailyReminderTime || '09:00';
    
    // Calculate next alarm time
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const nextAlarm = new Date();
    nextAlarm.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, set for tomorrow
    if (nextAlarm <= now) {
      nextAlarm.setDate(nextAlarm.getDate() + 1);
    }
    
    // Create alarm
    await chrome.alarms.create(ALARMS.DAILY_REVIEW, {
      when: nextAlarm.getTime(),
      periodInMinutes: ALARMS.CHECK_INTERVAL
    });
    
    console.log('Daily alarm set for:', nextAlarm);
  } catch (error) {
    console.error('Error setting up alarm:', error);
  }
}

/**
 * Check for due words and show notification
 */
async function checkAndNotifyDueWords() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.VOCABULARY);
    const vocabulary = result[STORAGE_KEYS.VOCABULARY] || [];
    
    const now = Date.now();
    const dueWords = vocabulary.filter(word => {
      return !word.nextReview || word.nextReview <= now;
    });
    
    const dueCount = dueWords.length;
    
    if (dueCount > 0) {
      const settings = await getSettings();
      
      if (settings.showNotifications !== false) {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: '../icons/icon128.png',
          title: 'Vocabulary Review',
          message: `You have ${dueCount} word${dueCount > 1 ? 's' : ''} to review today!`,
          priority: 2,
          buttons: [
            { title: 'Review Now' }
          ]
        });
      }
    }
    
    return dueCount;
  } catch (error) {
    console.error('Error checking due words:', error);
    return 0;
  }
}

/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Open popup
    chrome.action.openPopup();
  }
  chrome.notifications.clear(notificationId);
});

/**
 * Create context menu for saving words
 */
function createContextMenu() {
  // Remove existing menu items first to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-word',
      title: 'Save "%s" to Vocabulary',
      contexts: ['selection']
    });
  });
}

/**
 * Initialize storage with default settings
 */
async function initializeStorage() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.VOCABULARY]);
    
    if (!result[STORAGE_KEYS.SETTINGS]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: {
          dailyReminderTime: '09:00',
          autoPlayPronunciation: false,
          showNotifications: true
        }
      });
    }
    
    if (!result[STORAGE_KEYS.VOCABULARY]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: []
      });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * Get settings from storage
 */
async function getSettings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || {
      dailyReminderTime: '09:00',
      autoPlayPronunciation: false,
      showNotifications: true
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
}

/**
 * Handle pronunciation playback
 */
async function handlePronunciation(word, audioUrl) {
  // This will be handled in the popup/content script context
  // Background script can't play audio directly in MV3
  console.log('Pronunciation request:', word);
}

// Check for due words on startup
chrome.runtime.onStartup.addListener(async () => {
  await checkAndNotifyDueWords();
});

console.log('Vocabulary Note background script loaded');
