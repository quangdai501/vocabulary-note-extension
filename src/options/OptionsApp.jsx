import React, { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Navigation from "./components/Navigation.jsx";
import ReviewSection from "./components/ReviewSection.jsx";
import VocabularySection from "./components/VocabularySection.jsx";
import AddWordSection from "./components/AddWordSection.jsx";
import SettingsSection from "./components/SettingsSection.jsx";
import { AlertProvider, useAlert } from "./components/AlertContext.jsx";
import storageService from "../services/storage.js";
import srsService from "../services/srs.js";
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

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
       
        // Sync vocabulary
        const firebaseVocab = await firebaseStorage.getAllVocabulary();
        if (firebaseVocab.length === 0) {
          const localVocab = await storageService.getAllVocabulary();
          for (const word of localVocab) {
            await firebaseStorage.saveWord(word);
          }
        }
        // Sync settings
        const firebaseSettings = await firebaseStorage.getSettings();
        if (Object.keys(firebaseSettings).length === 0) {
          const localSettings = await storageService.getSettings();
          await firebaseStorage.saveSettings(localSettings);
        }
        loadData();
        loadSettings();
      } else {
        loadData();
        loadSettings();
      }
    });
    return unsubscribe;
  }, []);

  const service = user ? firebaseStorage : storageService;

  const loadData = async () => {
    const vocab = await service.getAllVocabulary();
    const due = await service.getDueWords();
    setVocabulary(vocab);
    setDueWords(due);
    setFilteredVocabulary(vocab);
  };

  const loadSettings = async () => {
    const userSettings = await service.getSettings();
    setSettings(userSettings);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await firebaseStorage.authenticate();
    } catch (error) {
      showAlert("Login failed: " + error.message, { type: "error" });
    }
  };

  const updateStats = () => {
    // Stats are calculated from vocabulary and dueWords state
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
            service={service}
          />
        );
      case "vocabulary":
        return (
          <VocabularySection
            vocabulary={vocabulary}
            filteredVocabulary={filteredVocabulary}
            setFilteredVocabulary={setFilteredVocabulary}
            onVocabularyUpdate={loadData}
            service={service}
          />
        );
      case "add":
        return (
          <AddWordSection
            vocabulary={vocabulary}
            onWordAdded={loadData}
            service={service}
          />
        );
      case "settings":
        return (
          <SettingsSection
            settings={settings}
            setSettings={setSettings}
            onSettingsSaved={loadSettings}
            service={service}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {!user ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold mb-4">Vocabulary Note</h1>
            <p className="text-gray-600 mb-6">
              Sign in to sync your vocabulary across devices
            </p>
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Sign in with Google
            </button>
            <p className="text-sm text-gray-500 mt-4">
              You can still use the extension locally without signing in
            </p>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default OptionsApp;
