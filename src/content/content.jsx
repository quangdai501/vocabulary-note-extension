import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import storageService from '../services/storage.js';
import './content.css';

// Global state for the content script
let selectedWord = '';
let selectedRect = null;
let popupRoot = null;
let popupContainer = null;
let iconContainer = null;

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

// Listen for text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

/**
 * Handle text selection — show the small trigger icon only
 */
function handleTextSelection(event) {
  // Don't retrigger if clicking inside the popup or icon
  if (event?.target?.closest('.Vocabulary-popup') || event?.target?.closest('.Vocabulary-icon-trigger')) {
    return;
  }

  removeAll();

  const selection = window.getSelection();
  const text = selection.toString().trim();

  // Only show for single word or short phrase selections
  if (!text || text.split(/\s+/).length > 3) {
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  selectedWord = text;
  selectedRect = rect;

  showIcon(rect);
}

/**
 * Show the small extension icon near the selected text
 */
function showIcon(rect) {
  iconContainer = document.createElement('div');
  iconContainer.className = 'Vocabulary-icon-trigger';

  // Position above the selection, centred
  const top = rect.top + window.scrollY - 40;
  const left = rect.left + window.scrollX + rect.width / 2 - 14;

  iconContainer.style.cssText = `position:absolute;top:${top}px;left:${left}px;z-index:10000;`;

  iconContainer.innerHTML = `
    <button class="Vocabulary-icon-btn" title="Look up &quot;${selectedWord}&quot;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 7h6M9 11h6M9 15h3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  document.body.appendChild(iconContainer);

  iconContainer.querySelector('button').addEventListener('mousedown', (e) => {
    // Prevent the mousedown from collapsing the selection before the click fires
    e.preventDefault();
  });

  iconContainer.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    removeIcon();
    showPopup(selectedRect);
  });

  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick, false);
  }, 300);
}

/**
 * Remove the trigger icon
 */
function removeIcon() {
  if (iconContainer) {
    iconContainer.remove();
    iconContainer = null;
  }
}

/**
 * Create and show the full inline popup (fetches data on mount)
 */
function showPopup(rect) {
  popupContainer = document.createElement('div');
  popupContainer.className = 'Vocabulary-popup-container';
  document.body.appendChild(popupContainer);

  // Place below the selected text
  const top = rect.top + window.scrollY + rect.height + 10;
  const left = rect.left + window.scrollX + rect.width / 2;

  popupContainer.style.cssText = `position:absolute;top:${top}px;left:${left}px;z-index:10000;`;

  popupRoot = createRoot(popupContainer);
  popupRoot.render(<InlinePopup word={selectedWord} onClose={removeAll} />);

  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick, false);
  }, 300);
}

/**
 * Remove the full popup
 */
function removePopup() {
  if (popupRoot) {
    popupRoot.unmount();
    popupRoot = null;
  }
  if (popupContainer) {
    popupContainer.remove();
    popupContainer = null;
  }
}

/**
 * Remove everything (icon + popup)
 */
function removeAll() {
  removeIcon();
  removePopup();
  document.removeEventListener('click', handleOutsideClick);
}

/**
 * Handle clicks outside popup/icon
 */
function handleOutsideClick(event) {
  const insidePopup = popupContainer && popupContainer.contains(event.target);
  const insideIcon = iconContainer && iconContainer.contains(event.target);
  if (!insidePopup && !insideIcon) {
    removeAll();
  }
}

/**
 * Inline Popup React Component — data is fetched here, after the user clicks the icon
 */
function InlinePopup({ word, onClose }) {
  const [translation, setTranslation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTranslation(word).then(result => {
      setTranslation(result);
      setIsLoading(false);
    }).catch(() => {
      setTranslation(null);
      setIsLoading(false);
    });
  }, [word]);

  const handleSave = () => saveWord(word);
  const handlePlay = () => playPronunciation(word);
  const handleYouGlish = () => openYouGlish(word);
  const handleCambridge = () => openCambridge(word);
  const handleTranslate = () => openGoogleTranslate(word);

  return (
    <div className="Vocabulary-popup">
      <div className="Vocabulary-popup-content">
        <div className="Vocabulary-popup-header">
          <div className="Vocabulary-word-display">
            <span className="Vocabulary-word-icon">📚</span>
            <span className="Vocabulary-word-text">{word}</span>
          </div>
        </div>

        <div className="Vocabulary-translation-section">
          {isLoading ? (
            <div className="Vocabulary-translation-loading">
              <span className="Vocabulary-spinner"></span>
              <span>Translating...</span>
            </div>
          ) : (
            <div className="Vocabulary-translation-content">
              <div className="Vocabulary-translation-text">
                {translation ? (
                  <>
                    {translation.english && (
                      <div className="Vocabulary-translation-item">
                        <div className="Vocabulary-translation-label">
                          🇬🇧 {translation.partOfSpeech ? `(${translation.partOfSpeech})` : 'English'}:
                        </div>
                        <div className="Vocabulary-translation-result">{translation.english}</div>
                      </div>
                    )}
                    {translation.vietnamese && (
                      <div className="Vocabulary-translation-item">
                        <div className="Vocabulary-translation-label">🇻🇳 Tiếng Việt:</div>
                        <div className="Vocabulary-translation-result">{translation.vietnamese}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="Vocabulary-translation-info">
                    Click Save to see full definition
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="Vocabulary-popup-actions">
          <button className="Vocabulary-btn Vocabulary-btn-save" title="Save to Vocabulary" onClick={handleSave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Save</span>
          </button>

          <button className="Vocabulary-btn Vocabulary-btn-play" title="Play Pronunciation" onClick={handlePlay}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
            </svg>
            <span>Pronounce</span>
          </button>

          <button className="Vocabulary-btn Vocabulary-btn-cambridge" title="Open Cambridge Dictionary" onClick={handleCambridge}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 6h7M9 10h7M9 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Cambridge</span>
          </button>

          <button className="Vocabulary-btn Vocabulary-btn-translate" title="Open Google Translate" onClick={handleTranslate}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 8h6m-6 4h6m4-4h3m-4.5 0L18 3m-3 5l-4.5 13M19 21l-2-5.5M21 16l-2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Translate</span>
          </button>

          <button className="Vocabulary-btn Vocabulary-btn-youglish" title="See examples on YouGlish" onClick={handleYouGlish}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 8l8 4-8 4V8z" fill="currentColor"/>
            </svg>
            <span>Examples</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fetch translation for the selected word
 */
async function fetchTranslation(word) {
  try {
    const [dictResponse, viTransResponse] = await Promise.all([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
    ]);

    let englishDef = null;
    let vietnameseTrans = null;
    let partOfSpeech = null;

    if (dictResponse.ok) {
      const dictData = await dictResponse.json();
      const firstMeaning = dictData[0]?.meanings?.[0];
      englishDef = firstMeaning?.definitions?.[0]?.definition;
      partOfSpeech = firstMeaning?.partOfSpeech;
    }

    if (viTransResponse.ok) {
      const viData = await viTransResponse.json();
      vietnameseTrans = viData.responseData?.translatedText || null;
    }

    return { english: englishDef, vietnamese: vietnameseTrans, partOfSpeech };
  } catch {
    return null;
  }
}

/**
 * Save word to vocabulary
 */
async function saveWord(word) {
  try {
    const { isLoggedIn } = await chrome.storage.local.get('isLoggedIn');
    if (!isLoggedIn) {
      showNotification('Sign in to save words', 'warning');
      return;
    }

    showNotification('Saving...', 'info');

    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    const wordData = response.ok
      ? parseWordData(await response.json(), word)
      : createManualWordData(word);

    await storageService.addPendingWord(wordData);

    showNotification(`"${word}" saved!`, 'success');
    removeAll();
  } catch (error) {
    showNotification('Failed to save word: ' + error.message, 'error');
  }
}

function parseWordData(apiData, word) {
  const firstEntry = apiData[0];
  const phonetics = firstEntry.phonetics || [];
  const meanings = firstEntry.meanings || [];

  let ipa = '';
  let audioUrl = '';
  for (const p of phonetics) {
    if (!ipa && p.text) ipa = p.text;
    if (!audioUrl && p.audio) audioUrl = p.audio;
  }

  let meaning = '';
  let examples = [];
  if (meanings.length > 0) {
    const firstMeaning = meanings[0];
    const firstDef = firstMeaning.definitions?.[0];
    if (firstDef) {
      meaning = `(${firstMeaning.partOfSpeech}) ${firstDef.definition}`;
      for (let i = 0; i < Math.min(3, firstMeaning.definitions.length); i++) {
        if (firstMeaning.definitions[i].example) {
          examples.push(firstMeaning.definitions[i].example);
        }
      }
    }
  }

  if (examples.length === 0) examples = ['No example available'];

  return {
    word: firstEntry.word || word,
    meaning,
    examples,
    ipa,
    audioUrl,
    youglishLink: `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`,
    interval: 0, repetition: 0, easeFactor: 2.5,
    nextReview: null, lastReview: null
  };
}

function createManualWordData(word) {
  return {
    word,
    meaning: 'User-defined word',
    examples: ['No example available'],
    ipa: '', audioUrl: '',
    youglishLink: `https://youglish.com/pronounce/${encodeURIComponent(word)}/english`,
    interval: 0, repetition: 0, easeFactor: 2.5,
    nextReview: null, lastReview: null, isManual: true
  };
}

function playPronunciation(word) {
  try {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
    showNotification('Playing pronunciation...', 'info');
  } catch {
    showNotification('Failed to play pronunciation', 'error');
  }
}

function openYouGlish(word) {
  window.open(`https://youglish.com/pronounce/${encodeURIComponent(word)}/english/us`, '_blank');
  removeAll();
}

function openCambridge(word) {
  window.open(`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`, '_blank');
  removeAll();
}

function openGoogleTranslate(word) {
  window.open(`https://translate.google.com/?hl=vi&sl=en&tl=vi&text=${encodeURIComponent(word)}&op=translate`, '_blank');
  removeAll();
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.Vocabulary-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `Vocabulary-notification Vocabulary-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('Vocabulary-notification-hide');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
