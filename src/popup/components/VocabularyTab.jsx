import React from "react";
import storageService from "../../services/storage.js";
import pronunciationService from "../../services/pronunciation.js";
import SearchInput from "./SearchInput.jsx";
import EmptyState from "./EmptyState.jsx";
import VocabularyList from "./VocabularyList.jsx";
import { useAlert } from "./AlertContext.jsx";

function VocabularyTab({
  filteredVocabulary,
  allVocabulary,
  searchTerm,
  onSearchChange,
  onEditNextReview,
  onResetProgress,
  onVocabularyChange,
}) {
  const { showAlert } = useAlert();
  const hasVocabulary = allVocabulary.length > 0;
  const hasSearchResults = filteredVocabulary.length > 0;

  const handlePlayPronunciation = async (word) => {
    await pronunciationService.playPronunciation(word.word, word.audioUrl);
  };

  const handleDeleteWord = async (wordId) => {
    try {
      await storageService.deleteWord(wordId);
      onVocabularyChange();
      showAlert('Word deleted successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error deleting word:', error);
      showAlert('Failed to delete word: ' + error.message, { type: 'error' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
      <div className="flex justify-between items-center mb-4">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search vocabulary..."
        />
        {hasVocabulary && (
          <button
            onClick={onResetProgress}
            className="px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
            title="Reset all SRS progress"
          >
            Reset Progress
          </button>
        )}
      </div>

      {!hasSearchResults ? (
        <EmptyState
          hasVocabulary={hasVocabulary}
          hasSearchResults={hasSearchResults}
        />
      ) : (
        <VocabularyList
          vocabulary={filteredVocabulary}
          onPlayPronunciation={handlePlayPronunciation}
          onDeleteWord={handleDeleteWord}
          onEditNextReview={onEditNextReview}
        />
      )}
    </div>
  );
}

export default VocabularyTab;
