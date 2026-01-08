import React, { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Navigation from './components/Navigation.jsx'
import ReviewSection from './components/ReviewSection.jsx'
import VocabularySection from './components/VocabularySection.jsx'
import AddWordSection from './components/AddWordSection.jsx'
import SettingsSection from './components/SettingsSection.jsx'
import storageService from '../services/storage.js'
import srsService from '../services/srs.js'

function OptionsApp() {
  const [currentSection, setCurrentSection] = useState('review')
  const [vocabulary, setVocabulary] = useState([])
  const [dueWords, setDueWords] = useState([])
  const [filteredVocabulary, setFilteredVocabulary] = useState([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    loadData()
    loadSettings()
  }, [])

  const loadData = async () => {
    const vocab = await storageService.getAllVocabulary()
    const due = await storageService.getDueWords()
    setVocabulary(vocab)
    setDueWords(due)
    setFilteredVocabulary(vocab)
  }

  const loadSettings = async () => {
    const userSettings = await storageService.getSettings()
    setSettings(userSettings)
  }

  const updateStats = () => {
    // Stats are calculated from vocabulary and dueWords state
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'review':
        return (
          <ReviewSection
            dueWords={dueWords}
            currentReviewIndex={currentReviewIndex}
            setCurrentReviewIndex={setCurrentReviewIndex}
            onReviewComplete={loadData}
          />
        )
      case 'vocabulary':
        return (
          <VocabularySection
            vocabulary={vocabulary}
            filteredVocabulary={filteredVocabulary}
            setFilteredVocabulary={setFilteredVocabulary}
            onVocabularyUpdate={loadData}
          />
        )
      case 'add':
        return (
          <AddWordSection
            vocabulary={vocabulary}
            onWordAdded={loadData}
          />
        )
      case 'settings':
        return (
          <SettingsSection
            settings={settings}
            setSettings={setSettings}
            onSettingsSaved={loadSettings}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header totalWords={vocabulary.length} dueWords={dueWords.length} />
      <Navigation currentSection={currentSection} setCurrentSection={setCurrentSection} />
      <main>
        {renderCurrentSection()}
      </main>
    </div>
  )
}

export default OptionsApp