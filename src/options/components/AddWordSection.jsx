import React, { useState } from 'react'
import storageService from '../../services/storage.js'
import dictionaryService from '../../services/dictionary.js'
import pronunciationService from '../../services/pronunciation.js'

function AddWordSection({ onVocabularyUpdate }) {
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLookup = async () => {
    if (!word.trim()) {
      setError('Please enter a word to look up')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await dictionaryService.fetchWordData(word.trim())
      if (result) {
        setMeaning(result.meaning || '')
        setSuccess('Word found! You can now save it.')
      } else {
        setError('Word not found. You can still save it with a custom meaning.')
      }
    } catch (err) {
      setError('Failed to look up word. You can still save it with a custom meaning.')
      console.error('Dictionary lookup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!word.trim()) {
      setError('Please enter a word')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Get pronunciation data
      const pronunciationData = await pronunciationService.getPronunciation(word.trim())

      const wordData = {
        word: word.trim(),
        meaning: meaning.trim() || 'No meaning provided',
        ipa: pronunciationData?.ipa || '',
        audioUrl: pronunciationData?.audioUrl || '',
        youglishLink: pronunciationData?.youglishLink || '',
        dateAdded: new Date().toISOString(),
        nextReview: new Date().toISOString(),
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0
      }

      await storageService.saveWord(wordData)
      onVocabularyUpdate()

      // Reset form
      setWord('')
      setMeaning('')
      setSuccess('Word saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save word. Please try again.')
      console.error('Save word error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      if (e.ctrlKey || e.metaKey) {
        handleSave()
      } else {
        handleLookup()
      }
    }
  }

  return (
    <section className="py-8 px-4 md:px-8 max-w-2xl mx-auto" id="add-word-section">
      <h2 className="text-3xl font-bold mb-8 text-slate-800">Add New Word</h2>

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div>
          <label htmlFor="wordInput" className="block text-sm font-semibold mb-2 text-slate-700">Word</label>
          <div className="flex gap-3">
            <input
              id="wordInput"
              type="text"
              placeholder="Enter a word..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:cursor-not-allowed transition"
            />
            <button
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition whitespace-nowrap cursor-pointer"
              onClick={handleLookup}
              disabled={isLoading || !word.trim()}
              title="Look up word (Enter)"
            >
              {isLoading ? '...' : 'Lookup'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="meaningInput" className="block text-sm font-semibold mb-2 text-slate-700">Meaning</label>
          <textarea
            id="meaningInput"
            placeholder="Enter the meaning..."
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows="4"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:cursor-not-allowed transition resize-none"
          />
        </div>

        <div className="text-center">
          <button
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            onClick={handleSave}
            disabled={isLoading || !word.trim()}
            title="Save word (Ctrl+Enter)"
          >
            {isLoading ? 'Saving...' : 'Save Word'}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
            {success}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="font-semibold mb-3 text-slate-800">Tips:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 space-y-2">
            <li>Press <kbd className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">Enter</kbd> to look up a word</li>
            <li>Press <kbd className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">Ctrl+Enter</kbd> (or <kbd className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">Cmd+Enter</kbd> on Mac) to save</li>
            <li>If lookup fails, you can still save with a custom meaning</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default AddWordSection