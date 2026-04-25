import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * Local Settings Service
 * Handles chrome.storage.local for settings and notification cache.
 * Vocabulary is stored exclusively in Firestore (FirebaseStorageService).
 */
class StorageService {
  /**
   * Get settings
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      return result[STORAGE_KEYS.SETTINGS] || {
        dailyLimit: 50,
        newWordsPerDay: 10,
        showNotifications: true,
        dailyReminderTime: '09:00'
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        dailyLimit: 50,
        newWordsPerDay: 10,
        showNotifications: true,
        dailyReminderTime: '09:00'
      };
    }
  }

  /**
   * Save settings
   * @param {Object} settings - Settings object
   * @returns {Promise<boolean>} Success status
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: settings
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Write the due-word count that background.js reads for notifications.
   * Fire-and-forget — call without awaiting in data load paths.
   * @param {number} dueCount
   */
  async setNotificationCache(dueCount) {
    try {
      await chrome.storage.local.set({
        notificationCache: { dueCount, updatedAt: Date.now() }
      });
    } catch (error) {
      console.error('Error setting notification cache:', error);
    }
  }

  /**
   * Add a word to the pending-save queue (used by the content script, which
   * cannot authenticate Firebase directly).
   * @param {Object} wordData
   */
  async addPendingWord(wordData) {
    try {
      const result = await chrome.storage.local.get('pendingWords');
      const pending = result.pendingWords || [];
      pending.push(wordData);
      await chrome.storage.local.set({ pendingWords: pending });
    } catch (error) {
      console.error('Error adding pending word:', error);
    }
  }

  /**
   * Claim and clear the pending-save queue atomically.
   * Returns the words that were queued, or [] if none.
   * @returns {Promise<Object[]>}
   */
  async claimPendingWords() {
    try {
      const result = await chrome.storage.local.get('pendingWords');
      const pending = result.pendingWords || [];
      if (pending.length > 0) {
        await chrome.storage.local.remove('pendingWords');
      }
      return pending;
    } catch (error) {
      console.error('Error claiming pending words:', error);
      return [];
    }
  }

  /**
   * Bump a timestamp in chrome.storage.local so any open extension page
   * (popup or options) can detect vocabulary changes and reload.
   */
  async notifyVocabularyChange() {
    try {
      await chrome.storage.local.set({ vocabularyUpdatedAt: Date.now() });
    } catch (error) {
      console.error('Error notifying vocabulary change:', error);
    }
  }

  /**
   * One-time migration: read legacy local vocabulary before clearing it.
   * Returns the array of legacy words, or null if already migrated / on error.
   * @returns {Promise<Array|null>}
   */
  async getAndClearLegacyVocabulary() {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.VOCABULARY, 'migrationDone']);
      if (result.migrationDone) return null;
      const legacy = result[STORAGE_KEYS.VOCABULARY] || [];
      await chrome.storage.local.set({ migrationDone: true });
      await chrome.storage.local.remove(STORAGE_KEYS.VOCABULARY);
      return legacy;
    } catch (error) {
      console.error('Error reading legacy vocabulary:', error);
      return null;
    }
  }
}

export default new StorageService();
