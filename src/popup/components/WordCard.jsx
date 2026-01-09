import React from "react";
import srsService from "../../services/srs.js";
import { useAlert } from "./AlertContext.jsx";

function WordCard({
  word,
  onPlayPronunciation,
  onDeleteWord,
  onEditNextReview,
}) {
  const { showConfirm } = useAlert();
  const handlePlayPronunciation = async () => {
    if (onPlayPronunciation) {
      await onPlayPronunciation(word);
    }
  };

  const handleDeleteWord = async () => {
    if (onDeleteWord) {
      const confirmed = await showConfirm(
        `Are you sure you want to delete "${word.word}"?`,
        { title: 'Delete Word' }
      );
      if (confirmed) {
        await onDeleteWord(word.id);
      }
    }
  };

  const handleEditNextReview = () => {
    if (onEditNextReview) {
      onEditNextReview(word);
    }
  };

  const googleTranslateUrl = `https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(
    word.word
  )}&op=translate`;
  const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(
    word.word
  )}`;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-gray-900">{word.word}</div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 italic">{word.ipa}</div>
          <button
            onClick={handleDeleteWord}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete word"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="text-gray-700 mb-3 leading-relaxed">{word.meaning}</div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            srsService.isDue(word)
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {srsService.isDue(word) ? "Due" : "Learned"}
        </span>
        <div className="flex items-center gap-2">
          {word.nextReview && (
            <span>Next: {new Date(word.nextReview).toLocaleDateString()}</span>
          )}
          <button
            onClick={handleEditNextReview}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Edit next review time"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M11.5 2.5L13 4l-8 8H3.5v-1.5l8-8z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 4l2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={word.youglishLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-xs font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M14 2H2v12h12V2z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M6 6l4 2-4 2V6z" fill="currentColor" />
          </svg>
          YouGlish
        </a>
        <a
          href={googleTranslateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M6 6h4M6 8h4M6 10h2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Translate
        </a>
        <a
          href={cambridgeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-xs font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12v8H2z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M6 8h4M6 10h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Cambridge
        </a>
        <button
          onClick={handlePlayPronunciation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs font-medium"
        >
          <span className="text-sm">🔊</span>
          Play
        </button>
      </div>
    </div>
  );
}

export default WordCard;
