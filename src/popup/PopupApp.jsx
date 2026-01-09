import React from 'react';
import storageService from '../services/storage.js';
import srsService from '../services/srs.js';
import dictionaryService from '../services/dictionary.js';
import pronunciationService from '../services/pronunciation.js';
import { Header, TabNavigation, ReviewTab, VocabularyTab, AddWordTab, EditReviewModal, AlertProvider, useAlert } from './components/index.js';
/**
 * Popup React App
 * Vocabulary review and management interface
 */
function PopupApp() {
  return (
    <AlertProvider>
      <PopupAppContent />
    </AlertProvider>
  );
}

function PopupAppContent() {
  const { showAlert, showConfirm } = useAlert();
  const [activeTab, setActiveTab] = React.useState('review');
  const [allVocabulary, setAllVocabulary] = React.useState([]);
  const [currentReviewWords, setCurrentReviewWords] = React.useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = React.useState(0);
  const [filteredVocabulary, setFilteredVocabulary] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Add word form state
  // Moved to AddWordTab

  // Edit review modal state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingWord, setEditingWord] = React.useState(null);

  React.useEffect(() => {
    loadData();
  }, []);

  React.useEffect(() => {
    if (searchTerm) {
      const filtered = allVocabulary.filter(word =>
        word.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVocabulary(filtered);
    } else {
      setFilteredVocabulary(allVocabulary);
    }
  }, [searchTerm, allVocabulary]);

  const loadData = async () => {
    try {
      const [vocabulary, dueWords] = await Promise.all([
        storageService.getAllVocabulary(),
        storageService.getDueWords()
      ]);
      setAllVocabulary(vocabulary);
      setCurrentReviewWords(dueWords);
      setFilteredVocabulary(vocabulary);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);
  };

  const handleReviewComplete = async () => {
    const newIndex = currentReviewIndex + 1;
    if (newIndex >= currentReviewWords.length) {
      // Reload data and reset to first review
      await loadData();
      setCurrentReviewIndex(0);
    } else {
      setCurrentReviewIndex(newIndex);
    }
  };

  // Vocabulary functions moved to VocabularyTab

  const handleEditNextReview = (word) => {
    setEditingWord(word);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingWord(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Add word functions moved to AddWordTab

  const handleResetProgress = async () => {
    const confirmed = await showConfirm(
      'Are you sure you want to reset all SRS progress? This cannot be undone.',
      { title: 'Reset SRS Progress' }
    );

    if (!confirmed) {
      return;
    }

    try {
      const success = await storageService.resetProgress();
      if (!success) {
        throw new Error('Failed to reset progress');
      }
      await loadData();
      showAlert('SRS progress reset successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error resetting progress:', error);
      showAlert('Failed to reset progress: ' + error.message, { type: 'error' });
    }
  };

  const currentReviewWord = currentReviewWords[currentReviewIndex];
  const predictedIntervals = currentReviewWord ? srsService.getPredictedIntervals(currentReviewWord) : null;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <AlertProvider>
      <div className="flex flex-col h-full">
        <Header
          totalWords={allVocabulary.length}
          dueWords={currentReviewWords.length}
          onSettingsClick={handleSettingsClick}
        />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={switchTab}
        />

        {activeTab === 'review' && (
          <ReviewTab
            currentReviewWords={currentReviewWords}
            currentReviewIndex={currentReviewIndex}
            onReviewComplete={handleReviewComplete}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyTab
            filteredVocabulary={filteredVocabulary}
            allVocabulary={allVocabulary}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onEditNextReview={handleEditNextReview}
            onResetProgress={handleResetProgress}
            onVocabularyChange={loadData}
          />
        )}

        {activeTab === 'add' && (
          <AddWordTab
            allVocabulary={allVocabulary}
            onVocabularyChange={loadData}
            onResetProgress={handleResetProgress}
          />
        )}

        <EditReviewModal
          isOpen={isEditModalOpen}
          word={editingWord}
          onClose={handleEditModalClose}
          onUpdate={loadData}
        />
      </div>
    </AlertProvider>
  );
}

// Helper functions moved to AddWordTab

export default PopupApp;