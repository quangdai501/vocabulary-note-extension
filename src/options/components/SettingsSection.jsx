import React, { useState, useEffect } from 'react'
import storageService from '../../services/storage.js'
import { useAlert } from './AlertContext.jsx'

function SettingsSection({ onVocabularyUpdate, service }) {
  const { showConfirm } = useAlert();
  const [settings, setSettings] = useState({
    autoPlay: false,
    showIPA: true,
    reviewLimit: 20,
    notifications: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await service.getSettings()
      setSettings({ ...settings, ...savedSettings })
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      await service.saveSettings(settings)
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to save settings. Please try again.')
      console.error('Save settings error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const vocabulary = await service.getAllVocabulary()
      const dataStr = JSON.stringify(vocabulary, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

      const exportFileDefaultName = `vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (err) {
      setMessage('Failed to export vocabulary.')
      console.error('Export error:', err)
    }
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result)
        if (Array.isArray(importedData)) {
          await service.importVocabulary(importedData)
          onVocabularyUpdate()
          setMessage('Vocabulary imported successfully!')
          setTimeout(() => setMessage(''), 3000)
        } else {
          setMessage('Invalid file format. Please select a valid vocabulary backup file.')
        }
      } catch (err) {
        setMessage('Failed to import vocabulary. Please check the file format.')
        console.error('Import error:', err)
      }
    }
    reader.readAsText(file)
  }

  const handleClearAll = async () => {
    const confirmed = await showConfirm('Are you sure you want to delete ALL vocabulary? This action cannot be undone.', {
      title: 'Delete All Vocabulary'
    });
    if (confirmed) {
      try {
        await storageService.clearAllWords()
        onVocabularyUpdate()
        setMessage('All vocabulary cleared.')
        setTimeout(() => setMessage(''), 3000)
      } catch (err) {
        setMessage('Failed to clear vocabulary.')
        console.error('Clear error:', err)
      }
    }
  }

  return (
    <section className="py-8 px-4 md:px-8 max-w-2xl mx-auto" id="settings-section">
      <h2 className="text-3xl font-bold mb-8 text-slate-800">Settings</h2>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6 text-slate-800">General Settings</h3>

          {/* Auto-play Checkbox */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
                className="mt-1 w-4 h-4 accent-indigo-600"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 block">Auto-play pronunciation</span>
                <p className="text-sm text-slate-500 mt-1">Automatically play word pronunciation when reviewing</p>
              </div>
            </label>
          </div>

          {/* Show IPA Checkbox */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showIPA}
                onChange={(e) => handleSettingChange('showIPA', e.target.checked)}
                className="mt-1 w-4 h-4 accent-indigo-600"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 block">Show IPA pronunciation</span>
                <p className="text-sm text-slate-500 mt-1">Display International Phonetic Alphabet for words</p>
              </div>
            </label>
          </div>

          {/* Notifications Checkbox */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                className="mt-1 w-4 h-4 accent-indigo-600"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 block">Enable notifications</span>
                <p className="text-sm text-slate-500 mt-1">Show reminders for due reviews</p>
              </div>
            </label>
          </div>

          {/* Review Limit */}
          <div>
            <label htmlFor="reviewLimit" className="block text-sm font-medium text-slate-800 mb-2">Daily review limit</label>
            <input
              id="reviewLimit"
              type="number"
              min="1"
              max="100"
              value={settings.reviewLimit}
              onChange={(e) => handleSettingChange('reviewLimit', parseInt(e.target.value) || 20)}
              className="px-4 py-2 rounded-lg border-2 border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-24 transition"
            />
            <p className="text-sm text-slate-500 mt-2">Maximum number of words to review per day</p>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6 text-slate-800">Data Management</h3>

          {/* Export Button */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <button className="px-6 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition cursor-pointer" onClick={handleExport}>
              Export Vocabulary
            </button>
            <p className="text-sm text-slate-500 mt-2">Download your vocabulary as a JSON file</p>
          </div>

          {/* Import Button */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <span className="inline-block px-6 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition cursor-pointer">Import Vocabulary</span>
            </label>
            <p className="text-sm text-slate-500 mt-2">Import vocabulary from a JSON backup file</p>
          </div>

          {/* Clear All Button */}
          <div>
            <button className="px-6 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition cursor-pointer" onClick={handleClearAll}>
              Clear All Vocabulary
            </button>
            <p className="text-sm text-slate-500 mt-2">Delete all saved words (irreversible)</p>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="text-center">
          <button
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg font-medium ${message.includes('success') || message.includes('imported') || message.includes('cleared') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>
    </section>
  )
}

export default SettingsSection