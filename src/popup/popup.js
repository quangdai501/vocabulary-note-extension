import storageService from '../services/storage.js';
import srsService from '../services/srs.js';
import dictionaryService from '../services/dictionary.js';
import pronunciationService from '../services/pronunciation.js';

/**
 * Popup UI Controller
 * Manages the popup interface for vocabulary review and management
 */

// State
let currentReviewWords = [];
let currentReviewIndex = 0;
let allVocabulary = [];
let filteredVocabulary = [];

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
const totalWordsEl = document.getElementById('totalWords');
const dueWordsEl = document.getElementById('dueWords');
const settingsBtn = document.getElementById('settingsBtn');

// Review Tab
const emptyReview = document.getElementById('emptyReview');
const reviewCard = document.getElementById('reviewCard');
const reviewWord = document.getElementById('reviewWord');
const reviewIPA = document.getElementById('reviewIPA');
const reviewMeaning = document.getElementById('reviewMeaning');
const reviewExample = document.getElementById('reviewExample');
const youglishLink = document.getElementById('youglishLink');
const playBtn = document.getElementById('playBtn');
const reviewButtons = document.querySelectorAll('.review-btn');
const reviewProgress = document.getElementById('reviewProgress');
const hardInterval = document.getElementById('hardInterval');
const goodInterval = document.getElementById('goodInterval');
const easyInterval = document.getElementById('easyInterval');

// Vocabulary Tab
const searchInput = document.getElementById('searchInput');
const vocabularyList = document.getElementById('vocabularyList');

// Add Word Tab
const addWordForm = document.getElementById('addWordForm');
const wordInput = document.getElementById('wordInput');
const meaningInput = document.getElementById('meaningInput');
const exampleInput = document.getElementById('exampleInput');
const fetchBtn = document.getElementById('fetchBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetProgressBtn = document.getElementById('resetProgressBtn');

// Initialize
init();

async function init() {
  await loadData();
  setupEventListeners();
  showReviewTab();
}

/**
 * Load all data from storage
 */
async function loadData() {
  allVocabulary = await storageService.getAllVocabulary();
  currentReviewWords = await storageService.getDueWords();
  filteredVocabulary = [...allVocabulary];
  
  updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
  totalWordsEl.textContent = allVocabulary.length;
  dueWordsEl.textContent = currentReviewWords.length;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Settings button
  settingsBtn.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') }));

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Review buttons
  reviewButtons.forEach(btn => {
    btn.addEventListener('click', () => handleReview(btn.dataset.quality));
  });

  // Play pronunciation
  playBtn.addEventListener('click', handlePlayPronunciation);

  // Search
  searchInput.addEventListener('input', handleSearch);

  // Add word form
  addWordForm.addEventListener('submit', handleAddWord);
  fetchBtn.addEventListener('click', handleFetchWord);

  // Export/Import
  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);

  // Reset Progress
  resetProgressBtn.addEventListener('click', handleResetProgress);
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `${tabName}-panel`);
  });

  if (tabName === 'review') {
    showReviewTab();
  } else if (tabName === 'vocabulary') {
    showVocabularyTab();
  }
}

/**
 * Show review tab with current word
 */
function showReviewTab() {
  if (currentReviewWords.length === 0) {
    emptyReview.style.display = 'flex';
    reviewCard.style.display = 'none';
    return;
  }

  emptyReview.style.display = 'none';
  reviewCard.style.display = 'block';

  const word = currentReviewWords[currentReviewIndex];
  displayReviewWord(word);
}

/**
 * Display a word for review
 */
function displayReviewWord(word) {
  reviewWord.textContent = word.word;
  reviewIPA.textContent = word.ipa || 'No IPA available';
  reviewMeaning.textContent = word.meaning || 'No meaning available';
  
  // Show first example or random
  const example = word.examples && word.examples.length > 0 
    ? word.examples[0] 
    : 'No example available';
  reviewExample.textContent = example;

  // Update YouGlish link
  youglishLink.href = word.youglishLink;

  // Update progress
  reviewProgress.textContent = `${currentReviewIndex + 1} / ${currentReviewWords.length}`;

  // Update predicted intervals
  const predictions = srsService.getPredictedIntervals(word);
  hardInterval.textContent = predictions.hard;
  goodInterval.textContent = predictions.good;
  easyInterval.textContent = predictions.easy;
}

/**
 * Handle review button click
 */
async function handleReview(quality) {
  const word = currentReviewWords[currentReviewIndex];
  const qualityScore = srsService.getQualityScore(quality);
  
  // Calculate new SRS data
  const updatedSRS = srsService.calculateNextReview(word, qualityScore);
  
  // Update in storage
  await storageService.updateWordSRS(word.id, updatedSRS);

  // Move to next word
  currentReviewIndex++;

  if (currentReviewIndex >= currentReviewWords.length) {
    // Review session complete
    await loadData();
    currentReviewIndex = 0;
    showReviewTab();
  } else {
    // Show next word
    displayReviewWord(currentReviewWords[currentReviewIndex]);
  }
}

/**
 * Handle pronunciation playback
 */
async function handlePlayPronunciation() {
  const word = currentReviewWords[currentReviewIndex];
  await pronunciationService.playPronunciation(word.word, word.audioUrl);
}

/**
 * Show vocabulary list tab
 */
function showVocabularyTab() {
  renderVocabularyList();
}

/**
 * Render vocabulary list
 */
function renderVocabularyList() {
  if (filteredVocabulary.length === 0) {
    vocabularyList.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M16 16h32v32H16z" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M24 28h16M24 36h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>${allVocabulary.length === 0 ? 'No vocabulary yet' : 'No matches found'}</p>
        <small>${allVocabulary.length === 0 ? 'Start saving words to build your vocabulary!' : 'Try a different search term'}</small>
      </div>
    `;
    return;
  }

  const html = filteredVocabulary.map(word => {
    const isDue = srsService.isDue(word);
    const nextReviewDate = word.nextReview 
      ? new Date(word.nextReview).toLocaleDateString() 
      : 'Not reviewed yet';

    return `
      <div class="vocab-item" data-id="${word.id}">
        <div class="vocab-item-header">
          <div>
            <div class="vocab-item-word">${word.word}</div>
            <div class="vocab-item-ipa">${word.ipa || 'No IPA'}</div>
          </div>
          ${isDue ? '<span class="due-badge">DUE</span>' : ''}
        </div>
        <div class="vocab-item-meaning">${word.meaning || 'No meaning'}</div>
        <div class="vocab-item-footer">
          <span>Next review: ${nextReviewDate}</span>
          <div class="vocab-item-actions">
            <button class="vocab-action-btn" data-action="play" data-id="${word.id}" title="Play">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3l8 5-8 5V3z" fill="currentColor"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="youglish" data-id="${word.id}" title="YouGlish">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M6 8l4-2.5v5L6 8z" fill="currentColor"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="cambridge" data-id="${word.id}" title="Cambridge Dictionary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="translate" data-id="${word.id}" title="Google Translate">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="edit" data-id="${word.id}" title="Edit next review">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 3.5l1 1L7 12.5l-1-1L11.5 3.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 6l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
             <button class="vocab-action-btn" data-action="delete" data-id="${word.id}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  vocabularyList.innerHTML = html;

  // Add event listeners
  vocabularyList.querySelectorAll('.vocab-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      
      if (action === 'play') {
        handleVocabPlay(id);
      } else if (action === 'youglish') {
        handleVocabYouglish(id);
      } else if (action === 'cambridge') {
        handleVocabCambridge(id);
      } else if (action === 'translate') {
        handleVocabTranslate(id);
      } else if (action === 'edit') {
        handleVocabEdit(id);
      } else if (action === 'delete') {
        handleVocabDelete(id);
      }
    });
  });
}

/**
 * Handle search input
 */
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  
  if (query === '') {
    filteredVocabulary = [...allVocabulary];
  } else {
    filteredVocabulary = allVocabulary.filter(word => {
      return word.word.toLowerCase().includes(query) ||
             (word.meaning && word.meaning.toLowerCase().includes(query));
    });
  }
  
  renderVocabularyList();
}

/**
 * Handle play pronunciation for vocabulary item
 */
async function handleVocabPlay(wordId) {
  const word = allVocabulary.find(w => w.id === wordId);
  if (word) {
    await pronunciationService.playPronunciation(word.word, word.audioUrl);
  }
}
/**
 * Handle open YouGlish for vocabulary item
 */
function handleVocabYouglish(wordId) {
  const word = allVocabulary.find(w => w.id === wordId);
  if (word) {
    const youglishUrl = word.youglishLink || `https://youglish.com/pronounce/${encodeURIComponent(word.word)}/english`;
    chrome.tabs.create({ url: youglishUrl });
  }
}

/**
 * Handle open Cambridge Dictionary for vocabulary item
 */
function handleVocabCambridge(wordId) {
  const word = allVocabulary.find(w => w.id === wordId);
  if (word) {
    const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.word)}`;
    chrome.tabs.create({ url: cambridgeUrl });
  }
}

/**
 * Handle open Google Translate for vocabulary item
 */
function handleVocabTranslate(wordId) {
  const word = allVocabulary.find(w => w.id === wordId);
  if (word) {
    const translateUrl = `https://translate.google.com/?hl=vi&sl=en&tl=vi&text=${encodeURIComponent(word.word)}&op=translate`;
    chrome.tabs.create({ url: translateUrl });
  }
}

/**
 * Handle edit next review time for vocabulary item
 */
async function handleVocabEdit(wordId) {
  const word = allVocabulary.find(w => w.id === wordId);
  if (!word) return;

  const currentDays = word.nextReview 
    ? Math.max(0, Math.ceil((word.nextReview - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  showEditModal(word, currentDays);
}

/**
 * Show edit modal
 */
function showEditModal(word, currentDays) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Next Review Time</h3>
      <div class="modal-body">
        <p><strong>Word:</strong> ${word.word}</p>
        <p><strong>Current next review:</strong> ${word.nextReview 
          ? new Date(word.nextReview).toLocaleDateString() 
          : 'Not scheduled'}</p>
        <div class="form-group">
          <label>Days from now:</label>
          <input type="number" id="editDaysInput" min="0" value="${currentDays}" placeholder="Enter number of days">
          <small>Enter 0 to make it due immediately</small>
        </div>
      </div>
      <div class="modal-actions">
        <button id="cancelEdit" class="btn btn-secondary">Cancel</button>
        <button id="saveEdit" class="btn btn-primary">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Focus input
  setTimeout(() => {
    document.getElementById('editDaysInput').focus();
    document.getElementById('editDaysInput').select();
  }, 100);

  // Event listeners
  document.getElementById('cancelEdit').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document.getElementById('saveEdit').addEventListener('click', async () => {
    const daysInput = document.getElementById('editDaysInput');
    const days = parseInt(daysInput.value);
    
    if (isNaN(days) || days < 0) {
      alert('Please enter a valid number of days (0 or more)');
      daysInput.focus();
      return;
    }

    const newNextReview = days === 0 ? Date.now() : Date.now() + (days * 24 * 60 * 60 * 1000);
    
    word.nextReview = newNextReview;
    word.updatedAt = Date.now();
    
    await storageService.updateWord(word);
    await loadData();
    renderVocabularyList();
    
    document.body.removeChild(modal);
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function closeModal(e) {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', closeModal);
    }
  });
}

/**
 * Handle delete vocabulary item
 */
async function handleVocabDelete(wordId) {
  if (confirm('Are you sure you want to delete this word?')) {
    await storageService.deleteWord(wordId);
    await loadData();
    renderVocabularyList();
  }
}

/**
 * Handle add word form submission
 */
async function handleAddWord(e) {
  e.preventDefault();
  
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();
  const example = exampleInput.value.trim();
  
  if (!word) {
    alert('Please enter a word');
    return;
  }

  // Check if word already exists
  const exists = allVocabulary.some(
    w => w.word.toLowerCase() === word.toLowerCase()
  );

  if (exists) {
    alert('This word already exists in your vocabulary!');
    return;
  }

  // Create manual entry
  const wordData = dictionaryService.createManualEntry(
    word,
    meaning,
    example ? [example] : []
  );

  // Save to storage
  const success = await storageService.saveWord(wordData);

  if (success) {
    alert(`"${word}" added successfully!`);
    addWordForm.reset();
    await loadData();
  } else {
    alert('Failed to add word. Please try again.');
  }
}

/**
 * Handle fetch word from dictionary
 */
async function handleFetchWord() {
  const word = wordInput.value.trim();
  
  if (!word) {
    alert('Please enter a word first');
    return;
  }

  fetchBtn.textContent = 'Fetching...';
  fetchBtn.disabled = true;

  try {
    const wordData = await dictionaryService.fetchWordData(word);
    
    if (wordData) {
      meaningInput.value = wordData.meaning;
      exampleInput.value = wordData.examples[0] || '';
      alert('Word data fetched successfully!');
    } else {
      alert('Word not found in dictionary. You can still add it manually.');
    }
  } catch (error) {
    alert('Failed to fetch word data. Please try again.');
  } finally {
    fetchBtn.textContent = 'Auto-fetch from Dictionary';
    fetchBtn.disabled = false;
  }
}

/**
 * Handle export vocabulary
 */
async function handleExport() {
  const jsonData = await storageService.exportVocabulary();
  
  // Create download link
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocabulary-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert('Vocabulary exported successfully!');
}

/**
 * Handle import vocabulary
 */
async function handleImport(e) {
  const file = e.target.files[0];
  
  if (!file) return;

  try {
    const text = await file.text();
    const success = await storageService.importVocabulary(text);
    
    if (success) {
      alert('Vocabulary imported successfully!');
      await loadData();
      renderVocabularyList();
    } else {
      alert('Failed to import vocabulary. Please check the file format.');
    }
  } catch (error) {
    alert('Error reading file. Please try again.');
  }
  
  // Reset file input
  importFile.value = '';
}

/**
 * Handle reset progress
 */
async function handleResetProgress() {
  const confirmed = confirm(
    '⚠️ WARNING: This will reset ALL SRS progress for every word in your vocabulary!\n\n' +
    '• All words will be marked as "new" again\n' +
    '• Review intervals will be reset to 1 day\n' +
    '• Ease factors will be reset to default\n' +
    '• This action cannot be undone\n\n' +
    'Are you sure you want to continue?'
  );

  if (!confirmed) return;

  try {
    const success = await storageService.resetProgress();
    
    if (success) {
      alert('All SRS progress has been reset successfully!');
      await loadData();
      renderVocabularyList();
      showReviewTab(); // Refresh review tab
    } else {
      alert('Failed to reset progress. Please try again.');
    }
  } catch (error) {
    alert('Error resetting progress. Please try again.');
  }
}

console.log('Vocabulary Note popup loaded');
