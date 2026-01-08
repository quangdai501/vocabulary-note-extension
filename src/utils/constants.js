// API and Configuration Constants
export const API = {
  DICTIONARY: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
  YOUGLISH_BASE: 'https://youglish.com/pronounce/'
};

// Storage Keys
export const STORAGE_KEYS = {
  VOCABULARY: 'vocabulary',
  SETTINGS: 'settings',
  STATS: 'stats'
};

// SRS Constants (SM-2 Algorithm)
export const SRS = {
  MIN_EASE_FACTOR: 1.3,
  INITIAL_EASE_FACTOR: 2.5,
  INITIAL_INTERVAL: 1,
  EASY_BONUS: 1.3,
  HARD_INTERVAL: 0.5,
  QUALITY_HARD: 3,
  QUALITY_GOOD: 4,
  QUALITY_EASY: 5
};

// Alarm Configuration
export const ALARMS = {
  DAILY_REVIEW: 'daily-review',
  CHECK_INTERVAL: 24 * 60 // 24 hours in minutes
};

// Review Labels
export const REVIEW_LABELS = {
  HARD: 'Hard',
  GOOD: 'Good',
  EASY: 'Easy'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  dailyReminderTime: '09:00',
  autoPlayPronunciation: false,
  showNotifications: true
};
