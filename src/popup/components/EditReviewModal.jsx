import React, { useState, useEffect } from "react";
import storageService from "../../services/storage.js";
import { useAlert } from "./AlertContext.jsx";

function EditReviewModal({ isOpen, word, onClose, onUpdate }) {
  const { showAlert } = useAlert();
  const [daysInput, setDaysInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && word) {
      const currentDays = word.nextReview
        ? Math.max(
            0,
            Math.ceil((word.nextReview - Date.now()) / (1000 * 60 * 60 * 24))
          )
        : 0;
      setDaysInput(currentDays.toString());
      setError("");
    }
  }, [isOpen, word]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const daysStr = daysInput.trim();
    let newNextReview = null;

    if (daysStr && daysStr !== "0") {
      const days = parseInt(daysStr, 10);
      if (isNaN(days) || days < 0) {
        setError("Please enter a valid non-negative number");
        return;
      }
      if (days > 0) {
        newNextReview = Date.now() + days * 24 * 60 * 60 * 1000;
      }
      // If days is 0, newNextReview remains null (cleared)
    }

    try {
      const updateResult = await storageService.updateWord({
        ...word,
        nextReview: newNextReview,
        updatedAt: Date.now()
      });

      if (!updateResult) {
        throw new Error('Failed to update word in storage');
      }

      alert('Next review time updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating next review time:', error);
      showAlert('Failed to update next review time: ' + error.message, { type: 'error' });
    }
  };

  const handleCancel = () => {
    setError("");
    onClose();
  };

  if (!isOpen || !word) return null;

  const currentDays = word.nextReview
    ? Math.max(
        0,
        Math.ceil((word.nextReview - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;
  const currentDisplay =
    currentDays > 0 ? `${currentDays} days from today` : "Not scheduled";

  return (
    <div className="fixed inset-0 bg-gray-50/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Edit Next Review Time</h3>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Word:</strong> {word.word}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Current:</strong> {currentDisplay}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days from today (0 or empty to clear):
            </label>
            <input
              type="number"
              min="0"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter number of days"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditReviewModal;
