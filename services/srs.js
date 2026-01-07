import { SRS } from '../utils/constants.js';

/**
 * Spaced Repetition Service
 * Implements SM-2 (SuperMemo 2) algorithm for optimal review scheduling
 */
class SRSService {
  /**
   * Calculate next review based on user response
   * @param {Object} wordData - Current word data with SRS fields
   * @param {number} quality - Quality of recall (3=Hard, 4=Good, 5=Easy)
   * @returns {Object} Updated SRS data
   */
  calculateNextReview(wordData, quality) {
    const {
      repetition = 0,
      easeFactor = SRS.INITIAL_EASE_FACTOR,
      interval = SRS.INITIAL_INTERVAL
    } = wordData;

    // Clone the word data to avoid mutation
    let newRepetition = repetition;
    let newInterval = interval;
    let newEaseFactor = easeFactor;

    // Calculate new ease factor
    newEaseFactor = this.calculateEaseFactor(easeFactor, quality);

    // Calculate interval based on quality
    if (quality < SRS.QUALITY_HARD) {
      // Failed - restart
      newRepetition = 0;
      newInterval = 1;
    } else {
      newRepetition = repetition + 1;

      if (newRepetition === 1) {
        newInterval = 1; // 1 day
      } else if (newRepetition === 2) {
        newInterval = 6; // 6 days
      } else {
        // Standard SM-2 formula
        newInterval = Math.round(interval * newEaseFactor);
      }

      // Apply quality modifiers
      if (quality === SRS.QUALITY_HARD) {
        newInterval = Math.max(1, Math.round(newInterval * SRS.HARD_INTERVAL));
      } else if (quality === SRS.QUALITY_EASY) {
        newInterval = Math.round(newInterval * SRS.EASY_BONUS);
      }
    }

    // Calculate next review date
    const nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

    return {
      repetition: newRepetition,
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReview: nextReview,
      lastReview: Date.now()
    };
  }

  /**
   * Calculate new ease factor using SM-2 formula
   * @param {number} currentEaseFactor - Current ease factor
   * @param {number} quality - Quality of recall (0-5)
   * @returns {number} New ease factor
   */
  calculateEaseFactor(currentEaseFactor, quality) {
    // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const newEF = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ensure ease factor doesn't go below minimum
    return Math.max(SRS.MIN_EASE_FACTOR, newEF);
  }

  /**
   * Get quality score from button type
   * @param {string} buttonType - 'hard', 'good', or 'easy'
   * @returns {number} Quality score for SM-2 algorithm
   */
  getQualityScore(buttonType) {
    const scores = {
      'hard': SRS.QUALITY_HARD,
      'good': SRS.QUALITY_GOOD,
      'easy': SRS.QUALITY_EASY
    };
    return scores[buttonType.toLowerCase()] || SRS.QUALITY_GOOD;
  }

  /**
   * Get human-readable interval string
   * @param {number} days - Number of days
   * @returns {string} Formatted interval string
   */
  formatInterval(days) {
    if (days < 1) {
      return 'Less than 1 day';
    } else if (days === 1) {
      return '1 day';
    } else if (days < 30) {
      return `${days} days`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else {
      const years = Math.floor(days / 365);
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
  }

  /**
   * Check if word is due for review
   * @param {Object} wordData - Word data with nextReview field
   * @returns {boolean} True if due for review
   */
  isDue(wordData) {
    if (!wordData.nextReview) return true;
    return Date.now() >= wordData.nextReview;
  }

  /**
   * Get predicted intervals for each button
   * @param {Object} wordData - Current word data
   * @returns {Object} Predicted intervals for hard/good/easy
   */
  getPredictedIntervals(wordData) {
    const hard = this.calculateNextReview(wordData, SRS.QUALITY_HARD);
    const good = this.calculateNextReview(wordData, SRS.QUALITY_GOOD);
    const easy = this.calculateNextReview(wordData, SRS.QUALITY_EASY);

    return {
      hard: this.formatInterval(hard.interval),
      good: this.formatInterval(good.interval),
      easy: this.formatInterval(easy.interval)
    };
  }

  /**
   * Initialize SRS data for a new word
   * @returns {Object} Initial SRS data
   */
  initializeWord() {
    return {
      repetition: 0,
      interval: 0,
      easeFactor: SRS.INITIAL_EASE_FACTOR,
      nextReview: null,
      lastReview: null
    };
  }
}

export default new SRSService();
