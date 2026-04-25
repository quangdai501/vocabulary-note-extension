import React from 'react';
import storageService from '../services/storage.js';
import firebaseStorage from '../services/firebaseStorage.js';
import { auth } from '../services/firebase.js';
import srsService from '../services/srs.js';
import { Header, TabNavigation, ReviewTab, VocabularyTab, AddWordTab, EditReviewModal, AlertProvider, useAlert } from './components/index.js';
import SignInScreen from './components/SignInScreen.jsx';

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
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [signInError, setSignInError] = React.useState(null);
  const authInitialized = React.useRef(false);

  // Edit review modal state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingWord, setEditingWord] = React.useState(null);

  // Auth state listener
  React.useEffect(() => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      // Mirror auth state to local storage so the content script can read it
      chrome.storage.local.set({ isLoggedIn: !!currentUser });
      if (!authInitialized.current) {
        authInitialized.current = true;
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Load data after auth resolves, and whenever auth state changes
  React.useEffect(() => {
    if (!authLoading && user) loadData();
  }, [user, authLoading]);

  // Reload when another context mutates vocabulary or queues a new pending word
  React.useEffect(() => {
    const handleStorageChange = (changes) => {
      if ((changes.vocabularyUpdatedAt || changes.pendingWords) && user) {
        loadData();
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [user]);

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

  const processPendingWords = async () => {
    const pending = await storageService.claimPendingWords();
    for (const word of pending) {
      try {
        await firebaseStorage.saveWord(word);
      } catch (e) {
        console.error('Failed to sync pending word:', word.word, e);
      }
    }
  };

  const loadData = async () => {
    try {
      await processPendingWords();
      const [vocabulary, dueWords] = await Promise.all([
        firebaseStorage.getAllVocabulary(),
        firebaseStorage.getDueWords()
      ]);
      setAllVocabulary(vocabulary);
      setCurrentReviewWords(dueWords);
      setFilteredVocabulary(vocabulary);
      // Update the due-word count cache for the background script's notifications
      storageService.setNotificationCache(dueWords.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setSignInError(null);
    try {
      await firebaseStorage.authenticate();
      // onAuthStateChanged fires and updates user state, which triggers loadData
    } catch (error) {
      setSignInError(error.message);
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
      await loadData();
      setCurrentReviewIndex(0);
    } else {
      setCurrentReviewIndex(newIndex);
    }
  };

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

  const handleResetProgress = async () => {
    const confirmed = await showConfirm(
      'Are you sure you want to reset all SRS progress? This cannot be undone.',
      { title: 'Reset SRS Progress' }
    );

    if (!confirmed) return;

    try {
      const success = await firebaseStorage.resetProgress();
      if (!success) throw new Error('Failed to reset progress');
      await loadData();
      showAlert('SRS progress reset successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error resetting progress:', error);
      showAlert('Failed to reset progress: ' + error.message, { type: 'error' });
    }
  };

  const currentReviewWord = currentReviewWords[currentReviewIndex];
  const predictedIntervals = currentReviewWord ? srsService.getPredictedIntervals(currentReviewWord) : null;

  // Auth loading — prevent flash
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  // Not signed in — show sign-in gate
  if (!user) {
    return <SignInScreen onSignIn={handleSignIn} error={signInError} />;
  }

  // Data loading after sign-in
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        totalWords={allVocabulary.length}
        dueWords={currentReviewWords.length}
        onSettingsClick={handleSettingsClick}
        user={user}
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
          service={firebaseStorage}
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
          service={firebaseStorage}
        />
      )}

      {activeTab === 'add' && (
        <AddWordTab
          allVocabulary={allVocabulary}
          onVocabularyChange={loadData}
          onResetProgress={handleResetProgress}
          service={firebaseStorage}
        />
      )}

      <EditReviewModal
        isOpen={isEditModalOpen}
        word={editingWord}
        onClose={handleEditModalClose}
        onUpdate={loadData}
        service={firebaseStorage}
      />
    </div>
  );
}

export default PopupApp;
