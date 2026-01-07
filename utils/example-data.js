/**
 * Example Vocabulary Data Structure
 * 
 * This file demonstrates the structure of vocabulary objects stored in chrome.storage.local
 */

export const exampleVocabularyData = [
  {
    // Unique identifier
    id: "word_1704556800000_abc123def",
    
    // Core word data
    word: "serendipity",
    meaning: "(noun) The occurrence of events by chance in a happy or beneficial way",
    examples: [
      "A fortunate stroke of serendipity brought the two old friends together after years.",
      "Their meeting was pure serendipity.",
      "The discovery was a happy serendipity."
    ],
    
    // Pronunciation data
    ipa: "/ˌserənˈdɪpɪti/",
    audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/serendipity-us.mp3",
    youglishLink: "https://youglish.com/pronounce/serendipity/english",
    
    // Spaced Repetition System (SRS) data
    interval: 1,           // Days until next review
    repetition: 0,         // Number of successful reviews
    easeFactor: 2.5,       // Ease factor (SM-2 algorithm)
    nextReview: 1704643200000,  // Timestamp of next review
    lastReview: 1704556800000,  // Timestamp of last review
    
    // Metadata
    createdAt: 1704556800000,   // Timestamp when word was added
    updatedAt: 1704556800000,   // Timestamp of last update
    isManual: false             // Whether word was added manually (without API)
  },
  
  {
    id: "word_1704560400000_xyz789ghi",
    word: "ephemeral",
    meaning: "(adjective) Lasting for a very short time",
    examples: [
      "Her success was ephemeral, lasting only a few months.",
      "The beauty of cherry blossoms is ephemeral.",
      "Fame can be ephemeral in the entertainment industry."
    ],
    ipa: "/ɪˈfem(ə)rəl/",
    audioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/ephemeral-us.mp3",
    youglishLink: "https://youglish.com/pronounce/ephemeral/english",
    interval: 6,
    repetition: 2,
    easeFactor: 2.6,
    nextReview: 1705161600000,
    lastReview: 1704643200000,
    createdAt: 1704560400000,
    updatedAt: 1704643200000,
    isManual: false
  },
  
  {
    id: "word_1704564000000_mno456pqr",
    word: "ubiquitous",
    meaning: "(adjective) Present, appearing, or found everywhere",
    examples: [
      "Smartphones have become ubiquitous in modern society.",
      "Coffee shops are ubiquitous in this neighborhood.",
      "The internet has made information ubiquitous."
    ],
    ipa: "/juːˈbɪkwɪtəs/",
    audioUrl: "",
    youglishLink: "https://youglish.com/pronounce/ubiquitous/english",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: null,
    lastReview: null,
    createdAt: 1704564000000,
    updatedAt: 1704564000000,
    isManual: false
  }
];

/**
 * Storage Structure
 * 
 * chrome.storage.local stores the following keys:
 */
export const storageStructure = {
  // Main vocabulary array
  vocabulary: [
    // Array of word objects (as shown above)
  ],
  
  // User settings
  settings: {
    dailyReminderTime: "09:00",      // Time for daily reminder (HH:MM format)
    autoPlayPronunciation: false,    // Auto-play pronunciation in review
    showNotifications: true          // Show desktop notifications
  },
  
  // Statistics (optional, can be calculated on-the-fly)
  stats: {
    totalWords: 150,
    reviewedToday: 10,
    dueToday: 5,
    streak: 7  // Days in a row with reviews
  }
};

/**
 * SM-2 Algorithm Explanation
 * 
 * The SM-2 (SuperMemo 2) algorithm is used for spaced repetition:
 * 
 * 1. After each review, user rates difficulty:
 *    - Hard (quality = 3): Difficult to recall
 *    - Good (quality = 4): Recalled with effort
 *    - Easy (quality = 5): Easy recall
 * 
 * 2. Based on quality, the algorithm calculates:
 *    - New ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *    - EF must be >= 1.3
 * 
 * 3. Next interval is calculated:
 *    - First review: 1 day
 *    - Second review: 6 days
 *    - Subsequent: interval * easeFactor
 * 
 * 4. Modifiers:
 *    - Hard: interval * 0.5
 *    - Easy: interval * 1.3
 *    - Failed: Reset to 1 day
 */

/**
 * API Response Example (Free Dictionary API)
 * 
 * https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 */
export const apiResponseExample = [
  {
    word: "hello",
    phonetic: "/həˈloʊ/",
    phonetics: [
      {
        text: "/həˈloʊ/",
        audio: "https://api.dictionaryapi.dev/media/pronunciations/en/hello-us.mp3"
      }
    ],
    meanings: [
      {
        partOfSpeech: "interjection",
        definitions: [
          {
            definition: "Used as a greeting or to begin a phone conversation.",
            example: "Hello, how are you?",
            synonyms: ["hi", "hey"],
            antonyms: []
          }
        ]
      }
    ]
  }
];
