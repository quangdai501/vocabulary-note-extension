import React from "react";
import srsService from "../../services/srs.js";
import storageService from "../../services/storage.js";
import pronunciationService from "../../services/pronunciation.js";

function ReviewTab({
  currentReviewWords,
  currentReviewIndex,
  onReviewComplete,
}) {
  const currentReviewWord = currentReviewWords[currentReviewIndex];
  const predictedIntervals = currentReviewWord
    ? srsService.getPredictedIntervals(currentReviewWord)
    : null;

  const handleReview = async (quality) => {
    const currentWord = currentReviewWords[currentReviewIndex];
    const qualityScore = srsService.getQualityScore(quality);
    const nextReview = srsService.calculateNextReview(currentWord, qualityScore);

    await storageService.updateWordSRS(currentWord.id, nextReview);

    onReviewComplete();
  };

  const handlePlayPronunciation = async () => {
    const currentWord = currentReviewWords[currentReviewIndex];
    await pronunciationService.playPronunciation(currentWord.word, currentWord.audioUrl);
  };

  if (currentReviewWords.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
        <div className="flex flex-col items-center justify-center text-center py-10 text-gray-500">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="mb-4 text-gray-300"
          >
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M24 24l16 16M40 24l-16 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No words due for review
          </h3>
          <p className="text-sm text-gray-500">
            All caught up! Come back later or add more words.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="text-center text-sm text-gray-600 font-medium mb-4">
          {currentReviewIndex + 1} / {currentReviewWords.length}
        </div>
        <div className="space-y-4">
          <div className="text-3xl font-bold text-gray-900">
            {currentReviewWord?.word}
          </div>
          <div className="text-base text-gray-600 italic">
            {currentReviewWord?.ipa || "No IPA available"}
          </div>
          <div className="text-gray-800 leading-relaxed">
            {currentReviewWord?.meaning || "No meaning available"}
          </div>
          <div className="text-gray-700 italic bg-gray-50 p-3 rounded">
            {currentReviewWord?.examples?.[0] || "No example available"}
          </div>
          <div className="flex gap-3 pt-2">
            <a
              href={currentReviewWord?.youglishLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 2H2v12h12V2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path d="M6 6l4 2-4 2V6z" fill="currentColor" />
              </svg>
              Listen on YouGlish
            </a>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={handlePlayPronunciation}
            >
              🔊 Play
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-3 px-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            onClick={() => handleReview("hard")}
          >
            Hard ({predictedIntervals?.hard})
          </button>
          <button
            className="flex-1 py-3 px-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            onClick={() => handleReview("good")}
          >
            Good ({predictedIntervals?.good})
          </button>
          <button
            className="flex-1 py-3 px-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
            onClick={() => handleReview("easy")}
          >
            Easy ({predictedIntervals?.easy})
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewTab;
