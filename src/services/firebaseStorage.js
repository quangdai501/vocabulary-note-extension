import { db, auth } from "./firebase.js";
import storageService from "./storage.js";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";

class FirebaseStorageService {
  _isFirebaseAudienceMismatchError(err) {
    return (
      err?.code === "auth/invalid-credential" &&
      typeof err?.message === "string" &&
      err.message.toLowerCase().includes("audience is not for this project")
    );
  }

  _buildAudienceMismatchMessage() {
    const manifestClientId = this._getManifestOauthClientId();
    const manifestProjectNumber =
      this._extractProjectNumberFromClientId(manifestClientId) || "unknown";
    const firebaseProjectNumber = this._getExpectedProjectNumber() || "unknown";

    if (
      manifestProjectNumber !== "unknown" &&
      firebaseProjectNumber !== "unknown" &&
      manifestProjectNumber === firebaseProjectNumber
    ) {
      return `OAuth token was rejected by Firebase even though project numbers match (${firebaseProjectNumber}). Verify manifest oauth2.client_id is a Chrome Extension OAuth client for this exact extension ID, then reload the extension and try again.`;
    }

    return `OAuth audience mismatch: token audience project is ${manifestProjectNumber} but Firebase project is ${firebaseProjectNumber}. Replace manifest oauth2.client_id with a Chrome App client ID from the Firebase project and reload the extension.`;
  }

  _getAuthToken(interactive = true) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(
              this._formatChromeIdentityError(chrome.runtime.lastError.message)
            )
          );
          return;
        }

        if (!token) {
          reject(new Error("No access token"));
          return;
        }

        resolve(token);
      });
    });
  }

  /**
   * Launch an interactive OAuth flow that always shows the Google account chooser.
   * Uses chrome.identity.launchWebAuthFlow with prompt=select_account.
   */
  _launchWebAuthFlowForToken() {
    return new Promise((resolve, reject) => {
      const manifest = chrome.runtime.getManifest();
      const clientId = manifest.oauth2.client_id;
      const redirectUrl = chrome.identity.getRedirectURL();
      const scopes = (manifest.oauth2.scopes || ["openid", "email", "profile"]).join(" ");

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUrl);
      authUrl.searchParams.set("response_type", "token");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("prompt", "select_account");

      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!responseUrl) {
            reject(new Error("No response from auth flow"));
            return;
          }

          // Extract access_token from the URL fragment
          const hash = new URL(responseUrl).hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get("access_token");

          if (!token) {
            reject(new Error("No access token in response"));
            return;
          }

          resolve(token);
        }
      );
    });
  }

  _clearAuthTokenCache(token) {
    return new Promise((resolve) => {
      if (chrome?.identity?.clearAllCachedAuthTokens) {
        chrome.identity.clearAllCachedAuthTokens(() => resolve());
        return;
      }

      if (token && chrome?.identity?.removeCachedAuthToken) {
        chrome.identity.removeCachedAuthToken({ token }, () => resolve());
        return;
      }

      resolve();
    });
  }

  async _signInWithToken(token) {
    const credential = GoogleAuthProvider.credential(null, token);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }

  _getManifestOauthClientId() {
    try {
      return chrome?.runtime?.getManifest?.()?.oauth2?.client_id || "";
    } catch {
      return "";
    }
  }

  _extractProjectNumberFromClientId(clientId) {
    if (!clientId) return null;
    const match = clientId.match(/^(\d+)-/);
    return match ? match[1] : null;
  }

  _extractProjectNumberFromAppId(appId) {
    if (!appId) return null;
    const match = appId.match(/^\d+:(\d+):/);
    return match ? match[1] : null;
  }

  _getExpectedProjectNumber() {
    const appId = auth?.app?.options?.appId || "";
    return this._extractProjectNumberFromAppId(appId);
  }

  _validateOAuthConfigOrThrow() {
    const manifestClientId = this._getManifestOauthClientId();
    const manifestProjectNumber =
      this._extractProjectNumberFromClientId(manifestClientId);
    const firebaseProjectNumber = this._getExpectedProjectNumber();

    if (
      manifestProjectNumber &&
      firebaseProjectNumber &&
      manifestProjectNumber !== firebaseProjectNumber
    ) {
      throw new Error(
        `OAuth project mismatch: manifest oauth2.client_id belongs to project ${manifestProjectNumber}, but Firebase appId belongs to project ${firebaseProjectNumber}. Use a Chrome App OAuth client ID created in the same Google Cloud project as Firebase.`
      );
    }
  }

  _formatChromeIdentityError(message) {
    if (!message) return "Authentication failed";

    if (message.toLowerCase().includes("bad client id")) {
      return "Google OAuth is misconfigured (bad client ID). Update manifest.json oauth2.client_id to a valid Chrome App OAuth client and reload the extension in chrome://extensions.";
    }

    return message;
  }

  _checkFirebase() {
    if (!db || !auth) throw new Error("Firebase not initialized");
  }

  // Try to restore the Firebase session using a cached OAuth token from
  // chrome.storage.local, without showing any UI.
  async authenticateSilently() {
    this._checkFirebase();
    const result = await chrome.storage.local.get('oauthAccessToken');
    const token = result.oauthAccessToken;
    if (!token) throw new Error('No cached token');
    return await this._signInWithToken(token);
  }

  /**
   * Request the background service worker to run the OAuth flow on our behalf.
   * The background script stays alive even when the popup closes, so the
   * launchWebAuthFlow can complete without being interrupted.
   * Once we have the token, we sign in to Firebase from this (popup) context.
   */
  async authenticateFromPopup() {
    this._checkFirebase();
    this._validateOAuthConfigOrThrow();

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'launchOAuthFlow' }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(resp);
      });
    });

    if (!response?.success || !response.token) {
      throw new Error(response?.error || 'Authentication failed');
    }

    const token = response.token;

    try {
      const user = await this._signInWithToken(token);
      // Cache the token so we can restore the session when the popup reopens
      await chrome.storage.local.set({ oauthAccessToken: token });
      return user;
    } catch (err) {
      if (!this._isFirebaseAudienceMismatchError(err)) {
        throw err;
      }
      throw new Error(this._buildAudienceMismatchMessage());
    }
  }

  async authenticate() {
    this._checkFirebase();
    this._validateOAuthConfigOrThrow();

    const token = await this._launchWebAuthFlowForToken();

    try {
      const user = await this._signInWithToken(token);
      await chrome.storage.local.set({ oauthAccessToken: token });
      return user;
    } catch (err) {
      if (!this._isFirebaseAudienceMismatchError(err)) {
        throw err;
      }

      // Retry once on audience mismatch.
      try {
        const retryToken = await this._launchWebAuthFlowForToken();
        const user = await this._signInWithToken(retryToken);
        await chrome.storage.local.set({ oauthAccessToken: retryToken });
        return user;
      } catch (retryErr) {
        if (this._isFirebaseAudienceMismatchError(retryErr)) {
          throw new Error(this._buildAudienceMismatchMessage());
        }
        throw retryErr;
      }
    }
  }

  async getAllVocabulary() {
    if (!auth.currentUser) return [];
    this._checkFirebase();
    try {
      const q = query(
        collection(db, "users", auth.currentUser.uid, "words")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
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
        storageService.notifyVocabularyChange();
        return true;
      } else {
        const wordId = wordData.id || this.generateId();
        await setDoc(doc(db, "users", auth.currentUser.uid, "words", wordId), {
          ...wordData,
          id: wordId,
          source: wordData.source || "extension",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        storageService.notifyVocabularyChange();
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
        "words",
        wordData.id
      );
      await updateDoc(docRef, {
        ...wordData,
        source: wordData.source || "extension",
        updatedAt: Date.now(),
      });
      storageService.notifyVocabularyChange();
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
        "words",
        wordId
      );
      await updateDoc(docRef, {
        ...srsData,
        lastReview: Date.now(),
        updatedAt: Date.now(),
      });
      storageService.notifyVocabularyChange();
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
        doc(db, "users", auth.currentUser.uid, "words", wordId)
      );
      storageService.notifyVocabularyChange();
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
        const wordId = word.id || this.generateId();
        batch.push(
          setDoc(doc(db, "users", auth.currentUser.uid, "words", wordId), {
            ...word,
            id: wordId,
            source: word.source || "extension",
            updatedAt: Date.now(),
          })
        );
      }
      await Promise.all(batch);
      storageService.notifyVocabularyChange();
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

  async signOut() {
    // Clear the cached OAuth token
    await chrome.storage.local.remove('oauthAccessToken');
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, async (token) => {
        if (token) {
          await new Promise((res) =>
            chrome.identity.removeCachedAuthToken({ token }, res)
          );
        }
        try {
          await auth.signOut();
        } catch (err) {
          console.error('Firebase signOut error:', err);
        }
        resolve();
      });
    });
  }

  generateId() {
    return `word_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  async getSettings() {
    if (!auth.currentUser) return this.getDefaultSettings();
    this._checkFirebase();
    try {
      const docRef = doc(db, "users", auth.currentUser.uid, "settings", "preferences");
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
      const docRef = doc(db, "users", auth.currentUser.uid, "settings", "preferences");
      await setDoc(docRef, settings);
      // Mirror notification-relevant settings to local storage so the background
      // script's alarm/notification logic can read them without Firestore access.
      await chrome.storage.local.set({
        settings: {
          showNotifications: settings.notifications ?? settings.showNotifications ?? true,
          dailyReminderTime: settings.dailyReminderTime ?? '09:00',
        }
      });
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  }

  async clearAllVocabulary() {
    if (!auth.currentUser) throw new Error("Not authenticated");
    this._checkFirebase();
    try {
      const vocabulary = await this.getAllVocabulary();
      await Promise.all(
        vocabulary.map(word =>
          deleteDoc(doc(db, "users", auth.currentUser.uid, "words", word.id))
        )
      );
      storageService.notifyVocabularyChange();
      return true;
    } catch (error) {
      console.error("Error clearing vocabulary:", error);
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
          "words",
          word.id
        );
        batch.push(updateDoc(docRef, word));
      }
      await Promise.all(batch);
      storageService.notifyVocabularyChange();
      return true;
    } catch (error) {
      console.error("Error resetting progress:", error);
      return false;
    }
  }
}

export default new FirebaseStorageService();
