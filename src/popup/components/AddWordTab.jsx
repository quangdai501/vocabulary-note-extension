import React from "react";
import storageService from "../../services/storage.js";
import dictionaryService from "../../services/dictionary.js";
import { useAlert } from "./AlertContext.jsx";

function AddWordTab({ allVocabulary, onVocabularyChange, onResetProgress }) {
  const { showAlert } = useAlert();
  const [wordInput, setWordInput] = React.useState("");
  const [meaningInput, setMeaningInput] = React.useState("");
  const [exampleInput, setExampleInput] = React.useState("");
  const [isFetching, setIsFetching] = React.useState(false);

  const handleAddWordSubmit = async (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          wordInput
        )}`
      );
      let wordData;

      if (response.ok) {
        const data = await response.json();
        wordData = parseDictionaryData(data, wordInput);
      } else {
        wordData = createManualWordData(wordInput);
      }

      // Override with user input if provided
      if (meaningInput.trim()) wordData.meaning = meaningInput;
      if (exampleInput.trim()) wordData.examples = [exampleInput];

      const success = await storageService.saveWord(wordData);
      if (!success) {
        showAlert("Failed to save word!", { type: "error" });
        return;
      }

      onVocabularyChange();

      // Reset form
      setWordInput("");
      setMeaningInput("");
      setExampleInput("");
      showAlert(`"${wordInput}" added successfully!`, { type: "success" });

      // Reset form
      setWordInput("");
      setMeaningInput("");
      setExampleInput("");
      alert(`"${wordInput}" added successfully!`);
    } catch (error) {
      console.error("Error adding word:", error);
      showAlert("Failed to add word: " + error.message, { type: "error" });
    }
  };

  const handleFetchWord = async () => {
    if (!wordInput.trim()) return;

    setIsFetching(true);
    try {
      const data = await dictionaryService.fetchWordData(wordInput);
      setMeaningInput(data.meaning || "");
      setExampleInput(data.examples?.[0] || "");
    } catch (error) {
      console.error("Error fetching word:", error);
      showAlert("Failed to fetch word data", { type: "error" });
    } finally {
      setIsFetching(false);
    }
  };

  const handleExport = async () => {
    try {
      const dataStr = await storageService.exportVocabulary();
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = "vocabulary-export.json";
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Error exporting vocabulary:", error);
      showAlert("Failed to export vocabulary: " + error.message, { type: "error" });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const success = await storageService.importVocabulary(e.target.result);
        if (!success) {
          throw new Error("Failed to import vocabulary");
        }

        onVocabularyChange();
        showAlert("Vocabulary imported successfully!", { type: "success" });
      } catch (error) {
        console.error("Error importing vocabulary:", error);
        showAlert("Failed to import vocabulary: " + error.message, { type: "error" });
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
      <form
        className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 mb-5"
        onSubmit={handleAddWordSubmit}
      >
        <div className="mb-4">
          <label
            htmlFor="wordInput"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Word:
          </label>
          <input
            type="text"
            id="wordInput"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder="Enter a word"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="meaningInput"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Meaning:
          </label>
          <textarea
            id="meaningInput"
            value={meaningInput}
            onChange={(e) => setMeaningInput(e.target.value)}
            placeholder="Word meaning or definition"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="exampleInput"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Example:
          </label>
          <textarea
            id="exampleInput"
            value={exampleInput}
            onChange={(e) => setExampleInput(e.target.value)}
            placeholder="Example sentence"
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!wordInput.trim()}
          >
            Add Word
          </button>
          <button
            type="button"
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleFetchWord}
            disabled={isFetching || !wordInput.trim()}
          >
            {isFetching ? "..." : "📖 Fetch from Dictionary"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 mb-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Import / Export
        </h3>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            onClick={handleExport}
          >
            Export JSON
          </button>
          <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <button
          className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
          onClick={onResetProgress}
        >
          Reset SRS Progress
        </button>
        <p className="text-red-600 text-sm mt-2 text-center">
          ⚠️ This will reset all SRS progress for every word
        </p>
      </div>
    </div>
  );
}

function parseDictionaryData(data, word) {
  const entry = data[0];
  const phonetics = entry.phonetics || [];
  const meanings = entry.meanings || [];

  let ipa = "";
  for (const phonetic of phonetics) {
    if (phonetic.text) {
      ipa = phonetic.text;
      break;
    }
  }

  let audioUrl = "";
  for (const phonetic of phonetics) {
    if (phonetic.audio) {
      audioUrl = phonetic.audio;
      break;
    }
  }

  let meaning = "";
  let examples = [];

  if (meanings.length > 0) {
    const firstMeaning = meanings[0];
    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
      const firstDef = firstMeaning.definitions[0];
      meaning = `(${firstMeaning.partOfSpeech}) ${firstDef.definition}`;

      for (let i = 0; i < Math.min(3, firstMeaning.definitions.length); i++) {
        const def = firstMeaning.definitions[i];
        if (def.example) {
          examples.push(def.example);
        }
      }
    }
  }

  if (examples.length === 0) {
    examples = ["No example available"];
  }

  return {
    word: entry.word || word,
    meaning,
    examples,
    ipa,
    audioUrl,
    youglishLink: `https://youglish.com/pronounce/${encodeURIComponent(
      word
    )}/english`,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: null,
    lastReview: null,
  };
}

function createManualWordData(word) {
  return {
    word,
    meaning: "User-defined word",
    examples: ["No example available"],
    ipa: "",
    audioUrl: "",
    youglishLink: `https://youglish.com/pronounce/${encodeURIComponent(
      word
    )}/english`,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: null,
    lastReview: null,
    isManual: true,
  };
}

function generateId() {
  return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default AddWordTab;
