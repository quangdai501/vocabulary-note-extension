import { API } from '../utils/constants.js';

/**
 * Dictionary Service
 * Fetches word definitions, examples, IPA, and audio from Free Dictionary API
 */
class DictionaryService {
  /**
   * Fetch word data from dictionary API
   * @param {string} word - Word to look up
   * @returns {Promise<Object|null>} Dictionary data or null if not found
   */
  async fetchWordData(word) {
    try {
      const response = await fetch(`${API.DICTIONARY}${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        console.warn(`Word "${word}" not found in dictionary`);
        return null;
      }

      const data = await response.json();
      return this.parseApiResponse(data, word);
    } catch (error) {
      console.error('Dictionary API error:', error);
      return null;
    }
  }

  /**
   * Parse API response into standardized format
   * @param {Array} apiData - Raw API response
   * @param {string} word - Original word
   * @returns {Object} Parsed word data
   */
  parseApiResponse(apiData, word) {
    if (!apiData || apiData.length === 0) return null;

    const firstEntry = apiData[0];
    const phonetics = firstEntry.phonetics || [];
    const meanings = firstEntry.meanings || [];

    // Extract IPA pronunciation
    const ipa = this.extractIPA(phonetics);

    // Extract audio URL
    const audioUrl = this.extractAudio(phonetics);

    // Extract definitions and examples
    const { definition, examples } = this.extractMeaningAndExamples(meanings);

    // Generate YouGlish link
    const youglishLink = `${API.YOUGLISH_BASE}${encodeURIComponent(word)}/english`;

    return {
      word: firstEntry.word || word,
      meaning: definition,
      examples: examples,
      ipa: ipa,
      audioUrl: audioUrl,
      youglishLink: youglishLink,
      // SRS initial values
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReview: null,
      lastReview: null
    };
  }

  /**
   * Extract IPA pronunciation from phonetics array
   * @param {Array} phonetics - Phonetics array from API
   * @returns {string} IPA notation or empty string
   */
  extractIPA(phonetics) {
    for (const phonetic of phonetics) {
      if (phonetic.text) {
        return phonetic.text;
      }
    }
    return '';
  }

  /**
   * Extract audio URL from phonetics array
   * @param {Array} phonetics - Phonetics array from API
   * @returns {string} Audio URL or empty string
   */
  extractAudio(phonetics) {
    for (const phonetic of phonetics) {
      if (phonetic.audio && phonetic.audio.trim() !== '') {
        return phonetic.audio;
      }
    }
    return '';
  }

  /**
   * Extract definition and examples from meanings
   * @param {Array} meanings - Meanings array from API
   * @returns {Object} Object with definition and examples array
   */
  extractMeaningAndExamples(meanings) {
    let definition = '';
    let examples = [];

    if (meanings.length > 0) {
      const firstMeaning = meanings[0];
      
      // Get first definition
      if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
        const firstDef = firstMeaning.definitions[0];
        definition = `(${firstMeaning.partOfSpeech}) ${firstDef.definition}`;

        // Collect examples from first few definitions
        for (let i = 0; i < Math.min(3, firstMeaning.definitions.length); i++) {
          const def = firstMeaning.definitions[i];
          if (def.example) {
            examples.push(def.example);
          }
        }
      }
    }

    // If no examples found, add a placeholder
    if (examples.length === 0) {
      examples = ['No example available'];
    }

    return { definition, examples };
  }

  /**
   * Create manual word entry (when user adds word without API)
   * @param {string} word - Word to add
   * @param {string} meaning - User-provided meaning
   * @param {Array} examples - User-provided examples
   * @returns {Object} Word data object
   */
  createManualEntry(word, meaning = '', examples = []) {
    const youglishLink = `${API.YOUGLISH_BASE}${encodeURIComponent(word)}/english`;

    return {
      word: word,
      meaning: meaning || 'User-defined word',
      examples: examples.length > 0 ? examples : ['No example available'],
      ipa: '',
      audioUrl: '',
      youglishLink: youglishLink,
      // SRS initial values
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReview: null,
      lastReview: null,
      isManual: true
    };
  }
}

export default new DictionaryService();
