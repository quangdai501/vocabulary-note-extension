import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * Storage Service
 * Handles all chrome.storage.local operations for vocabulary data
 */
class StorageService {
  /**
   * Get all vocabulary words
   * @returns {Promise<Array>} Array of vocabulary objects
   */
  async getAllVocabulary() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.VOCABULARY);
      return result[STORAGE_KEYS.VOCABULARY] || [];
    } catch (error) {
      console.error('Error getting vocabulary:', error);
      return [];
    }
  }

  /**
   * Save a new word to vocabulary
   * @param {Object} wordData - Word object containing all required fields
   * @returns {Promise<boolean>} Success status
   */
  async saveWord(wordData) {
    try {
      const vocabulary = await this.getAllVocabulary();
      
      // Check if word already exists
      const existingIndex = vocabulary.findIndex(
        item => item.word.toLowerCase() === wordData.word.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Update existing word
        vocabulary[existingIndex] = {
          ...vocabulary[existingIndex],
          ...wordData,
          updatedAt: Date.now()
        };
      } else {
        // Add new word
        vocabulary.push({
          ...wordData,
          id: this.generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: vocabulary
      });

      return true;
    } catch (error) {
      console.error('Error saving word:', error);
      return false;
    }
  }

  /**
   * Update a word's SRS data after review
   * @param {string} wordId - Word ID
   * @param {Object} srsData - Updated SRS data
   * @returns {Promise<boolean>} Success status
   */
  async updateWordSRS(wordId, srsData) {
    try {
      const vocabulary = await this.getAllVocabulary();
      const wordIndex = vocabulary.findIndex(item => item.id === wordId);

      if (wordIndex === -1) return false;

      vocabulary[wordIndex] = {
        ...vocabulary[wordIndex],
        ...srsData,
        lastReview: Date.now(),
        updatedAt: Date.now()
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: vocabulary
      });

      return true;
    } catch (error) {
      console.error('Error updating word SRS:', error);
      return false;
    }
  }

  /**
   * Update a word's data (general update method)
   * @param {Object} wordData - Word object with updated data (must include id)
   * @returns {Promise<boolean>} Success status
   */
  async updateWord(wordData) {
    try {
      const vocabulary = await this.getAllVocabulary();
      const wordIndex = vocabulary.findIndex(item => item.id === wordData.id);

      if (wordIndex === -1) return false;

      vocabulary[wordIndex] = {
        ...vocabulary[wordIndex],
        ...wordData,
        updatedAt: Date.now()
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: vocabulary
      });

      return true;
    } catch (error) {
      console.error('Error updating word:', error);
      return false;
    }
  }

  /**
   * Delete a word from vocabulary
   * @param {string} wordId - Word ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteWord(wordId) {
    try {
      const vocabulary = await this.getAllVocabulary();
      const filtered = vocabulary.filter(item => item.id !== wordId);

      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: filtered
      });

      return true;
    } catch (error) {
      console.error('Error deleting word:', error);
      return false;
    }
  }

  /**
   * Get words due for review today
   * @returns {Promise<Array>} Array of words due for review
   */
  async getDueWords() {
    try {
      const vocabulary = await this.getAllVocabulary();
      const now = Date.now();

      return vocabulary.filter(word => {
        return !word.nextReview || word.nextReview <= now;
      });
    } catch (error) {
      console.error('Error getting due words:', error);
      return [];
    }
  }

  /**
   * Export vocabulary as JSON
   * @returns {Promise<string>} JSON string of all vocabulary
   */
  async exportVocabulary() {
    const vocabulary = await this.getAllVocabulary();
    return JSON.stringify(vocabulary, null, 2);
  }

  /**
   * Import vocabulary from JSON
   * @param {string} jsonData - JSON string of vocabulary data
   * @returns {Promise<boolean>} Success status
   */
  async importVocabulary(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      const existing = await this.getAllVocabulary();

      // Merge imported words with existing, avoiding duplicates
      const merged = [...existing];
      
      imported.forEach(importedWord => {
        const existingIndex = merged.findIndex(
          w => w.word.toLowerCase() === importedWord.word.toLowerCase()
        );
        
        if (existingIndex === -1) {
          merged.push({
            ...importedWord,
            id: this.generateId(),
            importedAt: Date.now()
          });
        }
      });

      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: merged
      });

      return true;
    } catch (error) {
      console.error('Error importing vocabulary:', error);
      return false;
    }
  }

  /**
   * Get statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const vocabulary = await this.getAllVocabulary();
    const dueWords = await this.getDueWords();
    
    return {
      totalWords: vocabulary.length,
      dueToday: dueWords.length,
      reviewedToday: vocabulary.filter(w => {
        if (!w.lastReview) return false;
        const today = new Date().setHours(0, 0, 0, 0);
        return w.lastReview >= today;
      }).length
    };
  }

  /**
   * Generate unique ID for words
   * @returns {string} Unique ID
   */
  generateId() {
    return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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
   * Reset all SRS progress
   * @returns {Promise<boolean>} Success status
   */
  async resetProgress() {
    try {
      const vocabulary = await this.getAllVocabulary();
      
      const resetVocabulary = vocabulary.map(word => ({
        ...word,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: null,
        lastReview: null,
        updatedAt: Date.now()
      }));

      await chrome.storage.local.set({
        [STORAGE_KEYS.VOCABULARY]: resetVocabulary
      });

      return true;
    } catch (error) {
      console.error('Error resetting progress:', error);
      return false;
    }
  }
}

export default new StorageService();
