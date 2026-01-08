import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";

class FirebaseStorageService {
  _checkFirebase() {
    if (!db || !auth) throw new Error("Firebase not initialized");
  }

  async authenticate() {
    this._checkFirebase();

    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!token) {
          reject(new Error("No access token"));
          return;
        }

        try {
          const credential = GoogleAuthProvider.credential(null, token);

          const result = await signInWithCredential(auth, credential);
          resolve(result.user);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async getAllVocabulary() {
    if (!auth.currentUser) return [];
    this._checkFirebase();
    try {
      const q = query(
        collection(db, "users", auth.currentUser.uid, "vocabulary")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting vocabulary:", error);
      return [];
    }
  }

  async saveWord(wordData) {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const vocabulary = await this.getAllVocabulary();

      // Check if word already exists
      const existingIndex = vocabulary.findIndex(
        (item) => item.word.toLowerCase() === wordData.word.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Update existing word
        const existingWord = vocabulary[existingIndex];
        await this.updateWord({
          ...existingWord,
          ...wordData,
          updatedAt: Date.now(),
        });
        return true;
      } else {
        // Add new word
        await addDoc(
          collection(db, "users", auth.currentUser.uid, "vocabulary"),
          {
            ...wordData,
            id: this.generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        );
        return true;
      }
    } catch (error) {
      console.error("Error saving word:", error);
      return false;
    }
  }

  async updateWord(wordData) {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const docRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "vocabulary",
        wordData.id
      );
      await updateDoc(docRef, {
        ...wordData,
        updatedAt: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Error updating word:", error);
      return false;
    }
  }

  async updateWordSRS(wordId, srsData) {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const docRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "vocabulary",
        wordId
      );
      await updateDoc(docRef, {
        ...srsData,
        lastReview: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Error updating word SRS:", error);
      return false;
    }
  }

  async deleteWord(wordId) {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      await deleteDoc(
        doc(db, "users", auth.currentUser.uid, "vocabulary", wordId)
      );
      return true;
    } catch (error) {
      console.error("Error deleting word:", error);
      return false;
    }
  }

  async getDueWords() {
    try {
      const vocabulary = await this.getAllVocabulary();
      const now = Date.now();
      return vocabulary.filter((word) => {
        return !word.nextReview || word.nextReview <= now;
      });
    } catch (error) {
      console.error("Error getting due words:", error);
      return [];
    }
  }

  async exportVocabulary() {
    try {
      const vocabulary = await this.getAllVocabulary();
      return JSON.stringify(vocabulary, null, 2);
    } catch (error) {
      console.error("Error exporting vocabulary:", error);
      return "[]";
    }
  }

  async importVocabulary(jsonData) {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const vocabulary = JSON.parse(jsonData);
      const batch = [];
      for (const word of vocabulary) {
        batch.push(
          addDoc(
            collection(db, "users", auth.currentUser.uid, "vocabulary"),
            word
          )
        );
      }
      await Promise.all(batch);
      return true;
    } catch (error) {
      console.error("Error importing vocabulary:", error);
      return false;
    }
  }

  async getStats() {
    try {
      const vocabulary = await this.getAllVocabulary();
      const dueWords = await this.getDueWords();

      return {
        totalWords: vocabulary.length,
        dueToday: dueWords.length,
        reviewedToday: vocabulary.filter((w) => {
          if (!w.lastReview) return false;
          const today = new Date().setHours(0, 0, 0, 0);
          return w.lastReview >= today;
        }).length,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return { totalWords: 0, dueToday: 0, reviewedToday: 0 };
    }
  }

  generateId() {
    return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getSettings() {
    if (!auth.currentUser) return this.getDefaultSettings();
    this._checkFirebase();
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "settings");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Auto-create with default settings
        const defaults = this.getDefaultSettings();
        await setDoc(docRef, defaults);
        return defaults;
      }
    } catch (error) {
      console.error("Error getting settings:", error);
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings) {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "settings");
      await setDoc(docRef, settings);
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  }

  getDefaultSettings() {
    return {
      dailyLimit: 50,
      newWordsPerDay: 10,
      showNotifications: true,
      dailyReminderTime: "09:00",
    };
  }

  async resetProgress() {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const vocabulary = await this.getAllVocabulary();

      const resetVocabulary = vocabulary.map((word) => ({
        ...word,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReview: null,
        lastReview: null,
        updatedAt: Date.now(),
      }));

      const batch = [];
      for (const word of resetVocabulary) {
        const docRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "vocabulary",
          word.id
        );
        batch.push(updateDoc(docRef, word));
      }
      await Promise.all(batch);

      return true;
    } catch (error) {
      console.error("Error resetting progress:", error);
      return false;
    }
  }
}

export default new FirebaseStorageService();
