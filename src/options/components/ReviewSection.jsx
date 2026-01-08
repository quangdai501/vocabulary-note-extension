import React, { useState, useEffect } from 'react'
import storageService from '../../services/storage.js'
import srsService from '../../services/srs.js'
import pronunciationService from '../../services/pronunciation.js'

function ReviewSection({ dueWords, currentReviewIndex, setCurrentReviewIndex, onReviewComplete, service }) {
  const [currentWord, setCurrentWord] = useState(null)
  const [predictions, setPredictions] = useState({ hard: '1d', good: '3d', easy: '5d' })
  const [showMeaning, setShowMeaning] = useState(false)

  useEffect(() => {
    if (dueWords.length > 0 && currentReviewIndex < dueWords.length) {
      const word = dueWords[currentReviewIndex]
      setCurrentWord(word)
      setPredictions(srsService.getPredictedIntervals(word))
    } else {
      setCurrentWord(null)
    }
  }, [dueWords, currentReviewIndex])

  const handleReview = async (quality) => {
    if (!currentWord) return

    const qualityScore = srsService.getQualityScore(quality)
    const updatedSRS = srsService.calculateNextReview(currentWord, qualityScore)

    await service.updateWordSRS(currentWord.id, updatedSRS)

    const nextIndex = currentReviewIndex + 1
    setCurrentReviewIndex(nextIndex)

    if (nextIndex >= dueWords.length) {
      // Review session complete
      onReviewComplete()
      setCurrentReviewIndex(0)
    }
  }

  const handlePlayPronunciation = async () => {
    if (currentWord) {
      await pronunciationService.playPronunciation(currentWord.word, currentWord.audioUrl)
    }
  }

  const handleYouGlishClick = () => {
    if (currentWord) {
      const youglishUrl = currentWord.youglishLink || `https://youglish.com/pronounce/${encodeURIComponent(currentWord.word)}/english`
      window.open(youglishUrl, '_blank')
    }
  }

  if (dueWords.length === 0) {
    return (
      <section className="py-8 px-4 md:px-8 max-w-2xl mx-auto" id="review-section">
        <h2 className="text-3xl font-bold mb-8 text-slate-800">Today's Review</h2>
        <div className="flex justify-center">
          <div className="text-center py-16">
            <svg width="96" height="96" viewBox="0 0 64 64" fill="none" className="mx-auto text-slate-300 mb-4">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
              <path d="M32 20v16l8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-lg font-semibold text-slate-800 mb-2">No words to review today!</p>
            <p className="text-sm text-slate-500">Great job! Check back tomorrow.</p>
          </div>
        </div>
      </section>
    )
  }

  if (!currentWord) {
    return (
      <section className="py-8 px-4 md:px-8 max-w-2xl mx-auto" id="review-section">
        <h2 className="text-3xl font-bold mb-8 text-slate-800">Today's Review</h2>
        <div className="flex justify-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 px-4 md:px-8 max-w-2xl mx-auto" id="review-section">
      <h2 className="text-3xl font-bold mb-8 text-center text-slate-800">Today's Review</h2>
      <div className="flex justify-center">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">
          {/* Word and Controls */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-4xl font-bold text-slate-800">{currentWord.word}</span>
              <button onClick={handlePlayPronunciation} title="Play pronunciation" className="p-2 rounded-full hover:bg-blue-100 transition cursor-pointer">
                <svg width="24" height="24" fill="none" viewBox="0 0 20 20" className="text-blue-500"><path d="M3 8v4h4l5 5V3L7 8H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={handleYouGlishClick} title="YouGlish" className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer">
                <svg width="24" height="24" fill="none" viewBox="0 0 20 20" className="text-yellow-500"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/><path d="M8 7l5 3-5 3V7z" fill="currentColor"/></svg>
              </button>
            </div>
            <div className="text-lg text-slate-500 font-mono">{currentWord.ipa ? `/${currentWord.ipa}/` : 'No IPA available'}</div>
          </div>

          {/* Show/Hide Meaning Button */}
          <button className="w-full mb-6 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition cursor-pointer" onClick={() => setShowMeaning(prev => !prev)}>
            {showMeaning ? 'Hide Meaning' : 'Show Meaning'}
          </button>

          {/* Meaning */}
          {showMeaning && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg text-slate-700 text-center border border-blue-200">
              {currentWord.meaning || 'No meaning available'}
            </div>
          )}

          {/* Review Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium cursor-pointer" onClick={() => handleReview('again')}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="text-xs">Again</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition font-medium cursor-pointer" onClick={() => handleReview('hard')}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/><path d="M8 4v4M8 10v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="text-xs">Hard</span>
              <span className="text-[10px] text-yellow-600">{predictions.hard}</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition font-medium cursor-pointer" onClick={() => handleReview('good')}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-xs">Good</span>
              <span className="text-[10px] text-green-600">{predictions.good}</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium cursor-pointer" onClick={() => handleReview('easy')}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5 2-4z" fill="currentColor"/></svg>
              <span className="text-xs">Easy</span>
              <span className="text-[10px] text-blue-600">{predictions.easy}</span>
            </button>
          </div>

          {/* Progress */}
          <div className="text-center text-sm text-slate-500">
            Word <span className="font-semibold text-slate-700">{currentReviewIndex + 1}</span> of <span className="font-semibold text-slate-700">{dueWords.length}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReviewSection