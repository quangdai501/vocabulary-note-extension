/**
 * Pronunciation Service
 * Handles audio playback using either provided URL or Web Speech API fallback
 */
class PronunciationService {
  constructor() {
    this.currentAudio = null;
  }

  /**
   * Play pronunciation for a word
   * @param {string} word - Word to pronounce
   * @param {string} audioUrl - Audio URL (optional)
   * @returns {Promise<boolean>} Success status
   */
  async playPronunciation(word, audioUrl = '') {
    try {
      // Stop any currently playing audio
      this.stopCurrentAudio();

      // Try to play from URL first
      if (audioUrl && audioUrl.trim() !== '') {
        const success = await this.playFromUrl(audioUrl);
        if (success) return true;
      }

      // Fallback to Web Speech API
      return this.playWithSpeechSynthesis(word);
    } catch (error) {
      console.error('Pronunciation error:', error);
      return false;
    }
  }

  /**
   * Play audio from URL
   * @param {string} url - Audio URL
   * @returns {Promise<boolean>} Success status
   */
  async playFromUrl(url) {
    return new Promise((resolve) => {
      try {
        this.currentAudio = new Audio(url);
        
        this.currentAudio.addEventListener('ended', () => {
          this.currentAudio = null;
          resolve(true);
        });

        this.currentAudio.addEventListener('error', (error) => {
          console.warn('Audio URL playback failed:', error);
          this.currentAudio = null;
          resolve(false);
        });

        this.currentAudio.play();
      } catch (error) {
        console.warn('Audio playback error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Play pronunciation using Web Speech API
   * @param {string} word - Word to pronounce
   * @returns {Promise<boolean>} Success status
   */
  playWithSpeechSynthesis(word) {
    return new Promise((resolve) => {
      try {
        if (!('speechSynthesis' in window)) {
          console.warn('Speech synthesis not supported');
          resolve(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onend = () => resolve(true);
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Stop currently playing audio
   */
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Check if audio URL is valid
   * @param {string} url - Audio URL to validate
   * @returns {Promise<boolean>} Validity status
   */
  async validateAudioUrl(url) {
    if (!url || url.trim() === '') return false;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new PronunciationService();
