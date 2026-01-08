import React, { useState, useEffect } from "react";
import storageService from "../../services/storage.js";
import srsService from "../../services/srs.js";
import pronunciationService from "../../services/pronunciation.js";

function VocabularySection({
  vocabulary,
  filteredVocabulary,
  setFilteredVocabulary,
  onVocabularyUpdate,
  service,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingWord, setEditingWord] = useState(null);
  const [editDays, setEditDays] = useState("");

  useEffect(() => {
    const filtered = vocabulary.filter((word) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        word.word.toLowerCase().includes(query) ||
        (word.meaning && word.meaning.toLowerCase().includes(query))
      );
    });
    setFilteredVocabulary(filtered);
  }, [vocabulary, searchQuery, setFilteredVocabulary]);

  const handlePlay = async (word) => {
    await pronunciationService.playPronunciation(word.word, word.audioUrl);
  };

  const handleYouGlish = (word) => {
    const youglishUrl =
      word.youglishLink ||
      `https://youglish.com/pronounce/${encodeURIComponent(word.word)}/english`;
    window.open(youglishUrl, "_blank");
  };

  const handleCambridge = (word) => {
    const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(
      word.word
    )}`;
    window.open(cambridgeUrl, "_blank");
  };

  const handleTranslate = (word) => {
    const translateUrl = `https://translate.google.com/?hl=vi&sl=en&tl=vi&text=${encodeURIComponent(
      word.word
    )}&op=translate`;
    window.open(translateUrl, "_blank");
  };

  const handleEdit = (word) => {
    const currentDays = word.nextReview
      ? Math.max(
          0,
          Math.ceil((word.nextReview - Date.now()) / (1000 * 60 * 60 * 24))
        )
      : 0;
    setEditingWord(word);
    setEditDays(currentDays.toString());
  };

  const handleEditSubmit = async () => {
    if (!editingWord) return;

    const days = parseInt(editDays);
    if (isNaN(days) || days < 0) {
      alert("Please enter a valid number of days (0 or more)");
      return;
    }

    const newNextReview =
      days === 0 ? Date.now() : Date.now() + days * 24 * 60 * 60 * 1000;

    editingWord.nextReview = newNextReview;
    editingWord.updatedAt = Date.now();

    await service.updateWord(editingWord);
    onVocabularyUpdate();
    setEditingWord(null);
    setEditDays("");
  };

  const handleEditCancel = () => {
    setEditingWord(null);
    setEditDays("");
  };

  const handleDelete = async (wordId) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      await service.deleteWord(wordId);
      onVocabularyUpdate();
    }
  };

  const handleResetProgress = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will reset ALL SRS progress for every word!\n\n" +
        "• All ease factors will be reset to 2.5\n" +
        "• All intervals will be reset to 1 day\n" +
        "• All repetition counts will be reset to 0\n" +
        "• Next review dates will be cleared\n\n" +
        "This action cannot be undone. Are you sure you want to continue?"
    );

    if (confirmed) {
      const success = await service.resetProgress();
      if (success) {
        alert("✅ All SRS progress has been reset successfully!");
        onVocabularyUpdate();
      } else {
        alert("❌ Failed to reset progress. Please try again.");
      }
    }
  };

  return (
    <section
      className="py-8 px-4 md:px-8 max-w-4xl mx-auto"
      id="vocabulary-section"
    >
      <h2 className="text-3xl font-bold mb-8 text-slate-800">All Vocabulary</h2>

      {/* Search Box */}
      <div className="mb-8 flex items-center gap-3 bg-white rounded-xl shadow-md p-4 border border-slate-200">
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
          className="text-slate-400 flex-shrink-0"
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M11 11l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
          type="text"
          placeholder="Search vocabulary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Reset Progress Button */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-1">
              Reset All Progress
            </h3>
            <p className="text-sm text-red-600">
              This will reset all SRS progress for every word in your
              vocabulary. Use this if you want to start fresh with your learning
              schedule.
            </p>
          </div>
          <button
            onClick={handleResetProgress}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-nowrap cursor-pointer"
          >
            Reset Progress
          </button>
        </div>
      </div>

      {/* Vocabulary List */}
      <div id="vocabularyList">
        {filteredVocabulary.length === 0 ? (
          <div className="text-center py-16">
            <svg
              width="96"
              height="96"
              viewBox="0 0 64 64"
              fill="none"
              className="mx-auto text-slate-300 mb-4"
            >
              <path
                d="M16 16h32v32H16z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M24 28h16M24 36h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-800 mb-2">
              {vocabulary.length === 0
                ? "No vocabulary yet"
                : "No matches found"}
            </p>
            <p className="text-sm text-slate-500">
              {vocabulary.length === 0
                ? "Start saving words to build your vocabulary!"
                : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVocabulary.map((word) => {
              const isDue = srsService.isDue(word);
              const nextReviewDate = word.nextReview
                ? new Date(word.nextReview).toLocaleDateString()
                : "Not reviewed yet";

              return (
                <div
                  key={word.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg p-6 border border-slate-200 transition"
                >
                  {/* Header with word and due badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-2xl font-bold text-slate-800">
                        {word.word}
                      </div>
                      <div className="text-sm text-slate-500 font-mono mt-1">
                        {word.ipa || "No IPA"}
                      </div>
                    </div>
                    {isDue && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        DUE
                      </span>
                    )}
                  </div>

                  {/* Meaning */}
                  <div className="text-slate-700 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {word.meaning || "No meaning"}
                  </div>

                  {/* Footer with next review date and actions */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                      Next review:{" "}
                      <span className="font-semibold text-slate-700">
                        {nextReviewDate}
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition cursor-pointer"
                        onClick={() => handlePlay(word)}
                        title="Play"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition cursor-pointer"
                        onClick={() => handleYouGlish(word)}
                        title="YouGlish"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 2a6 6 0 100 12A6 6 0 008 2z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                          />
                          <path d="M6 8l4-2.5v5L6 8z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition cursor-pointer"
                        onClick={() => handleCambridge(word)}
                        title="Cambridge Dictionary"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3 4h10M3 8h10M3 12h7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition cursor-pointer"
                        onClick={() => handleTranslate(word)}
                        title="Google Translate"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 2v12M2 8h12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="8"
                            cy="8"
                            r="5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition cursor-pointer"
                        onClick={() => handleEdit(word)}
                        title="Edit next review"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M11.5 3.5l1 1L7 12.5l-1-1L11.5 3.5z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 6l2 2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 13h10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition cursor-pointer"
                        onClick={() => handleDelete(word.id)}
                        title="Delete"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M4 4l8 8M12 4l-8 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingWord && (
        <div className="fixed inset-0 bg-gray-50/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-51">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Edit Next Review Time
            </h3>
            <div className="mb-4">
              <p className="text-slate-600 mb-2">
                <strong>Word:</strong> {editingWord.word}
              </p>
              <p className="text-slate-600 mb-4">
                <strong>Current next review:</strong>{" "}
                {editingWord.nextReview
                  ? new Date(editingWord.nextReview).toLocaleDateString()
                  : "Not scheduled"}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Days from now:
              </label>
              <input
                type="number"
                min="0"
                value={editDays}
                onChange={(e) => setEditDays(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of days"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter 0 to make it due immediately
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEditCancel}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default VocabularySection;
