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
  SETTINGS: 'settings'
};

const ICON_PATHS = {
  NOTIFICATION: 'src/assets/icons/icon128.svg'
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
chrome.runtime.onStartup.addListener(async () => {
  console.log('Vocabulary Note extension started');
  createContextMenu();
  // Recreate alarm on startup so reminder-time changes are always applied.
  await setupDailyAlarm();
  await checkAndNotifyDueWords();
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
  } else if (request.action === 'launchOAuthFlow') {
    // Run OAuth flow from background. The popup will likely close when the
    // auth window opens, so we store the token in chrome.storage.local.
    // When the popup reopens, it restores the session from that cached token.
    launchOAuthFlow()
      .then(token => {
        chrome.storage.local.set({ oauthAccessToken: token });
        sendResponse({ success: true, token });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

// Keep alarm schedule in sync when options save new reminder settings.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEYS.SETTINGS]) {
    setupDailyAlarm();
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
 * Check for due words and show notification.
 * Reads the pre-computed notificationCache written by the popup/options page
 * after each data load, since the background script cannot access Firestore directly.
 */
async function checkAndNotifyDueWords() {
  try {
    const result = await chrome.storage.local.get(['notificationCache', STORAGE_KEYS.SETTINGS]);
    const dueCount = result.notificationCache?.dueCount ?? 0;

    if (dueCount > 0) {
      const settings = result[STORAGE_KEYS.SETTINGS] || {};

      if (settings.showNotifications !== false) {
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL(ICON_PATHS.NOTIFICATION),
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
    // Reviews live in the options page; opening popup would not show review UI.
    chrome.runtime.openOptionsPage();
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
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);

    if (!result[STORAGE_KEYS.SETTINGS]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: {
          dailyReminderTime: '09:00',
          autoPlayPronunciation: false,
          showNotifications: true
        }
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
 * Run the Google OAuth flow via chrome.identity.launchWebAuthFlow.
 * Called from the background so the popup closing doesn't kill the flow.
 */
function launchOAuthFlow() {
  return new Promise((resolve, reject) => {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    const redirectUrl = chrome.identity.getRedirectURL();
    const scopes = (manifest.oauth2.scopes || ['openid', 'email', 'profile']).join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('prompt', 'select_account');

    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!responseUrl) {
          reject(new Error('No response from auth flow'));
          return;
        }
        const hash = new URL(responseUrl).hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        if (!token) {
          reject(new Error('No access token in response'));
          return;
        }
        resolve(token);
      }
    );
  });
}

/**
 * Handle pronunciation playback
 */
async function handlePronunciation(word, audioUrl) {
  // This will be handled in the popup/content script context
  // Background script can't play audio directly in MV3
  console.log('Pronunciation request:', word);
}

console.log('Vocabulary Note background script loaded');
