import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import ReviewSection from "./components/ReviewSection.jsx";
import VocabularySection from "./components/VocabularySection.jsx";
import AddWordSection from "./components/AddWordSection.jsx";
import SettingsSection from "./components/SettingsSection.jsx";
import { AlertProvider, useAlert } from "./components/AlertContext.jsx";
import storageService from "../services/storage.js";
import firebaseStorage from "../services/firebaseStorage.js";
import { auth } from "../services/firebase.js";

function OptionsApp() {
  return (
    <AlertProvider>
      <OptionsAppContent />
    </AlertProvider>
  );
}

function OptionsAppContent() {
  const { showAlert } = useAlert();
  const [currentSection, setCurrentSection] = useState("review");
  const [vocabulary, setVocabulary] = useState([]);
  const [dueWords, setDueWords] = useState([]);
  const [filteredVocabulary, setFilteredVocabulary] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [settings, setSettings] = useState({});
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      // Mirror auth state so the popup can react even if Firebase cross-tab sync is delayed
      chrome.storage.local.set({ isLoggedIn: !!currentUser });
      if (!authInitialized.current) {
        authInitialized.current = true;
        setAuthLoading(false);
      }
      if (currentUser) {
        await runOneTimeMigration();
        loadData(firebaseStorage);
        loadSettings(firebaseStorage);
      }
    });
    return unsubscribe;
  }, []);

  // Reload when another context mutates vocabulary or queues a new pending word
  useEffect(() => {
    const handleStorageChange = (changes) => {
      if ((changes.vocabularyUpdatedAt || changes.pendingWords) && user) {
        loadData(firebaseStorage);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [user]);

  /**
   * One-time migration: push any legacy chrome.storage.local vocabulary
   * into Firestore on first sign-in, then clear it locally.
   */
  const runOneTimeMigration = async () => {
    try {
      const legacyVocab = await storageService.getAndClearLegacyVocabulary();
      if (!legacyVocab || legacyVocab.length === 0) return;

      const existingFirebaseVocab = await firebaseStorage.getAllVocabulary();
      if (existingFirebaseVocab.length > 0) return; // cloud already has data, skip

      showAlert(`Migrating ${legacyVocab.length} local word${legacyVocab.length > 1 ? 's' : ''} to your account…`, { type: 'info' });
      for (const word of legacyVocab) {
        await firebaseStorage.saveWord(word);
      }
      showAlert('Local vocabulary migrated to your account!', { type: 'success' });
    } catch (error) {
      console.error('Migration error:', error);
      // Non-fatal — the user can still use the app
    }
  };

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

  const loadData = async (svc) => {
    await processPendingWords();
    const activeService = svc ?? firebaseStorage;
    const vocab = await activeService.getAllVocabulary();
    const due = await activeService.getDueWords();
    setVocabulary(vocab);
    setDueWords(due);
    setFilteredVocabulary(vocab);
    // Keep background script's notification cache in sync
    storageService.setNotificationCache(due.length);
  };

  const loadSettings = async (svc) => {
    const activeService = svc ?? firebaseStorage;
    const userSettings = await activeService.getSettings();
    setSettings(userSettings);
  };

  const handleLogout = async () => {
    try {
      await firebaseStorage.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await firebaseStorage.authenticate();
      // onAuthStateChanged fires and triggers data load
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "review":
        return (
          <ReviewSection
            dueWords={dueWords}
            currentReviewIndex={currentReviewIndex}
            setCurrentReviewIndex={setCurrentReviewIndex}
            onReviewComplete={loadData}
            service={firebaseStorage}
          />
        );
      case "vocabulary":
        return (
          <VocabularySection
            vocabulary={vocabulary}
            filteredVocabulary={filteredVocabulary}
            setFilteredVocabulary={setFilteredVocabulary}
            onVocabularyUpdate={loadData}
            service={firebaseStorage}
          />
        );
      case "add":
        return (
          <AddWordSection
            vocabulary={vocabulary}
            onWordAdded={loadData}
            service={firebaseStorage}
          />
        );
      case "settings":
        return (
          <SettingsSection
            settings={settings}
            setSettings={setSettings}
            onSettingsSaved={loadSettings}
            onVocabularyUpdate={loadData}
            service={firebaseStorage}
          />
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm w-full">
          <div className="mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto text-indigo-500">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Vocabulary Note</h1>
          <p className="text-gray-600 mb-6">
            Sign in to sync your vocabulary across devices
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Sign in with Google
          </button>
          {loginError && (
            <p className="mt-4 text-sm text-red-600">{loginError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header
        totalWords={vocabulary.length}
        dueWords={dueWords.length}
        user={user}
        onLogout={handleLogout}
      />
      <Navigation
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />
      <main>{renderCurrentSection()}</main>
    </div>
  );
}

export default OptionsApp;
