/**
 * Content Script
 * Handles word selection and inline popup display
 */

console.log('🔵 Vocabulary Note: Content script loading...');

let selectedWord = '';
let popupElement = null;

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

console.log('🔵 Vocabulary Note: Event listeners attached');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSelectedWord') {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      saveWord(selection);
    }
    sendResponse({ success: true });
  } else if (request.action === 'saveWord') {
    saveWord(request.word);
    sendResponse({ success: true });
  }
});

/**
 * Handle text selection event
 */
function handleTextSelection(event) {
  
  // Don't retrigger if clicking inside the popup
  if (event && event.target && event.target.closest('.Vocabulary-popup')) {
    return;
  }
  
  removePopup();

  const selection = window.getSelection();
  const text = selection.toString().trim();


  // Only show popup for single word selections
  if (!text || text.split(/\s+/).length > 3) {
    console.log('Skipping - empty or too many words');
    return;
  }

  // Get selection position
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Store selected word
  selectedWord = text;

  // Show inline popup
  showPopup(rect);
}

/**
 * Create and show inline popup
 */
function showPopup(rect) {
  
  // Create popup element
  popupElement = document.createElement('div');
  popupElement.className = 'Vocabulary-popup';
  
  // Calculate position - place below the selected text
  const top = rect.top + window.scrollY + rect.height + 10;
  const left = rect.left + window.scrollX + (rect.width / 2);
  
  
  popupElement.style.top = `${top}px`;
  popupElement.style.left = `${left}px`;

  // Create popup content
  popupElement.innerHTML = `
    <div class="Vocabulary-popup-content">
      <div class="Vocabulary-popup-header">
        <div class="Vocabulary-word-display">
          <span class="Vocabulary-word-icon">📚</span>
          <span class="Vocabulary-word-text">${selectedWord}</span>
        </div>
      </div>
      <div class="Vocabulary-translation-section">
        <div class="Vocabulary-translation-loading">
          <span class="Vocabulary-spinner"></span>
          <span>Translating...</span>
        </div>
        <div class="Vocabulary-translation-content" style="display: none;">
          <div class="Vocabulary-translation-text"></div>
        </div>
      </div>
      <div class="Vocabulary-popup-actions">
        <button class="Vocabulary-btn Vocabulary-btn-save" title="Save to Vocabulary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Save</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-play" title="Play Pronunciation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
          </svg>
          <span>Pronounce</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-cambridge" title="Open Cambridge Dictionary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 6h7M9 10h7M9 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Cambridge</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-translate" title="Open Google Translate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 8h6m-6 4h6m4-4h3m-4.5 0L18 3m-3 5l-4.5 13M19 21l-2-5.5M21 16l-2 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Translate</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-youglish" title="See examples on YouGlish">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M8 8l8 4-8 4V8z" fill="currentColor"/>
          </svg>
          <span>Examples</span>
        </button>
      </div>
    </div>
  `;

  // Add to document first
  document.body.appendChild(popupElement);

  // Fetch translation
  fetchTranslation(selectedWord);

  // Add event listeners after adding to DOM
  const saveBtn = popupElement.querySelector('.Vocabulary-btn-save');
  const playBtn = popupElement.querySelector('.Vocabulary-btn-play');
  const cambridgeBtn = popupElement.querySelector('.Vocabulary-btn-cambridge');
  const translateBtn = popupElement.querySelector('.Vocabulary-btn-translate');
  const youglishBtn = popupElement.querySelector('.Vocabulary-btn-youglish');


  if (saveBtn) {
    // Test if button is clickable
    saveBtn.onmouseenter = () => console.log('🔵 Mouse entered Save button');
    saveBtn.onmouseleave = () => console.log('🔵 Mouse left Save button');
    
    saveBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);
    
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('✅ Save button clicked for word:', selectedWord);
      saveWord(selectedWord);
    }, true);
  } else {
    console.error('❌ Save button not found!');
  }

  if (playBtn) {
    playBtn.onmouseenter = () => console.log('🔵 Mouse entered Play button');
    
    playBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);
    
    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('✅ Play button clicked for word:', selectedWord);
      playPronunciation(selectedWord);
    }, true);
  } else {
    console.error('❌ Play button not found!');
  }

  if (youglishBtn) {
    youglishBtn.onmouseenter = () => console.log('🔵 Mouse entered YouGlish button');
    
    youglishBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);
    
    youglishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('✅ YouGlish button clicked for word:', selectedWord);
      openYouGlish(selectedWord);
    }, true);
  } else {
    console.error('❌ YouGlish button not found!');
  }

  if (cambridgeBtn) {
    cambridgeBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);
    
    cambridgeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('✅ Cambridge button clicked for word:', selectedWord);
      openCambridge(selectedWord);
    }, true);
  }

  if (translateBtn) {
    translateBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);
    
    translateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('✅ Translate button clicked for word:', selectedWord);
      openGoogleTranslate(selectedWord);
    }, true);
  }

  // Remove popup when clicking outside (with longer delay)
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick, false);
  }, 300);
}

/**
 * Remove popup from DOM
 */
function removePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
    document.removeEventListener('click', handleOutsideClick);
  }
}

/**
 * Handle clicks outside popup
 */
function handleOutsideClick(event) {
  console.log('🔴 Outside click detected, target:', event.target);
  if (popupElement && !popupElement.contains(event.target)) {
    console.log('🔴 Removing popup');
    removePopup();
  } else {
    console.log('🔴 Click was inside popup, keeping it');
  }
}

/**
 * Save word to vocabulary
 */
async function saveWord(word) {
  console.log('saveWord function called with:', word);
  try {
    // Show loading state
    showNotification('Loading...', 'info');

    // Fetch word data from dictionary API
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    let wordData;

    if (response.ok) {
      const apiData = await response.json();
      wordData = parseWordData(apiData, word);
    } else {
      // Create manual entry if API fails
      wordData = createManualWordData(word);
    }

    // Save to storage
    const result = await chrome.storage.local.get('vocabulary');
    const vocabulary = result.vocabulary || [];

    // Check if word already exists
    const existingIndex = vocabulary.findIndex(
      item => item.word.toLowerCase() === word.toLowerCase()
    );

    if (existingIndex !== -1) {
      showNotification('Word already exists!', 'warning');
      removePopup();
      return;
    }

    // Add new word
    vocabulary.push({
      ...wordData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await chrome.storage.local.set({ vocabulary });

    showNotification(`"${word}" saved successfully!`, 'success');
    removePopup();
  } catch (error) {
    console.error('Error saving word:', error);
    console.error('Error details:', error.message, error.stack);
    showNotification('Failed to save word: ' + error.message, 'error');
  }
}

/**
 * Parse API response
 */
function parseWordData(apiData, word) {
  const firstEntry = apiData[0];
  const phonetics = firstEntry.phonetics || [];
  const meanings = firstEntry.meanings || [];

  // Extract IPA
  let ipa = '';
  for (const phonetic of phonetics) {
    if (phonetic.text) {
      ipa = phonetic.text;
      break;
    }
  }

  // Extract audio
  let audioUrl = '';
  for (const phonetic of phonetics) {
    if (phonetic.audio) {
      audioUrl = phonetic.audio;
      break;
    }
  }

  // Extract definition and examples
  let meaning = '';
  let examples = [];

  if (meanings.length > 0) {
    const firstMeaning = meanings[0];
    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
      const firstDef = firstMeaning.definitions[0];
      meaning = `(${firstMeaning.partOfSpeech}) ${firstDef.definition}`;

      for (let i = 0; i < Math.min(3, firstMeaning.definitions.length); i++) {
        const def = firstMeaning.definitions[i];
        if (def.example) {
          examples.push(def.example);
        }
      }
    }
  }

  if (examples.length === 0) {
    examples = ['No example available'];
  }

  return {
    word: firstEntry.word || word,
    meaning,
    examples,
    ipa,
    audioUrl,
    youglishLink: `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: null,
    lastReview: null
  };
}

/**
 * Create manual word data
 */
function createManualWordData(word) {
  return {
    word,
    meaning: 'User-defined word',
    examples: ['No example available'],
    ipa: '',
    audioUrl: '',
    youglishLink: `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: null,
    lastReview: null,
    isManual: true
  };
}

/**
 * Play pronunciation
 */
function playPronunciation(word) {
  console.log('playPronunciation called for:', word);
  try {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
    console.log('Pronunciation started');
    
    showNotification('Playing pronunciation...', 'info');
  } catch (error) {
    console.error('Error playing pronunciation:', error);
    showNotification('Failed to play pronunciation', 'error');
  }
}

/**
 * Open YouGlish
 */
function openYouGlish(word) {
  console.log('openYouGlish called for:', word);
  try {
    const url = `https://youglish.com/pronounce/${encodeURIComponent(word)}/english/us`;
    console.log('Opening URL:', url);
    window.open(url, '_blank');
    removePopup();
  } catch (error) {
    console.error('Error opening YouGlish:', error);
    showNotification('Failed to open YouGlish', 'error');
  }
}

/**
 * Open Cambridge Dictionary
 */
function openCambridge(word) {
  console.log('openCambridge called for:', word);
  try {
    const url = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`;
    console.log('Opening URL:', url);
    window.open(url, '_blank');
    removePopup();
  } catch (error) {
    console.error('Error opening Cambridge:', error);
    showNotification('Failed to open Cambridge Dictionary', 'error');
  }
}

/**
 * Open Google Translate
 */
function openGoogleTranslate(word) {
  console.log('openGoogleTranslate called for:', word);
  try {
    const url = `https://translate.google.com/?hl=vi&sl=en&tl=vi&text=${encodeURIComponent(word)}&op=translate`;
    console.log('Opening URL:', url);
    window.open(url, '_blank');
    removePopup();
  } catch (error) {
    console.error('Error opening Google Translate:', error);
    showNotification('Failed to open Google Translate', 'error');
  }
}

/**
 * Fetch translation for the selected word
 */
async function fetchTranslation(word) {
  const loadingEl = popupElement?.querySelector('.Vocabulary-translation-loading');
  const contentEl = popupElement?.querySelector('.Vocabulary-translation-content');
  const textEl = popupElement?.querySelector('.Vocabulary-translation-text');
  
  if (!loadingEl || !contentEl || !textEl) return;

  let englishDef = null;
  let vietnameseTrans = null;
  let partOfSpeech = null;

  try {
    // Fetch both English definition and Vietnamese translation in parallel
    const [dictResponse, viTransResponse] = await Promise.all([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
    ]);

    // Process English definition
    if (dictResponse.ok) {
      const dictData = await dictResponse.json();
      const firstEntry = dictData[0];
      const firstMeaning = firstEntry?.meanings?.[0];
      englishDef = firstMeaning?.definitions?.[0]?.definition;
      partOfSpeech = firstMeaning?.partOfSpeech;
    }

    // Process Vietnamese translation
    if (viTransResponse.ok) {
      const viData = await viTransResponse.json();
      if (viData.responseData?.translatedText) {
        vietnameseTrans = viData.responseData.translatedText;
      }
    }

    // Display results
    if (englishDef || vietnameseTrans) {
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';
      
      let html = '';
      
      if (englishDef) {
        html += `
          <div class="Vocabulary-translation-item">
            <div class="Vocabulary-translation-label">🇬🇧 ${partOfSpeech ? `(${partOfSpeech})` : 'English'}:</div>
            <div class="Vocabulary-translation-result">${englishDef}</div>
          </div>
        `;
      }
      
      if (vietnameseTrans) {
        html += `
          <div class="Vocabulary-translation-item">
            <div class="Vocabulary-translation-label">🇻🇳 Tiếng Việt:</div>
            <div class="Vocabulary-translation-result">${vietnameseTrans}</div>
          </div>
        `;
      }
      
      textEl.innerHTML = html;
    } else {
      throw new Error('No translation or definition found');
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';
    textEl.innerHTML = `
      <div class="Vocabulary-translation-info">
        Click Save to see full definition
      </div>
    `;
  }
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
  console.log('showNotification:', message, type);
  // Remove existing notification
  const existing = document.querySelector('.Vocabulary-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `Vocabulary-notification Vocabulary-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('Vocabulary-notification-hide');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Generate unique ID
 */
function generateId() {
  return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

console.log('Vocabulary Note content script loaded');
