#!/usr/bin/env node

/**
 * Writes a test word document to canonical Firestore path.
 * Use with Firebase emulator:
 * FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/verify-word-trigger.js test-user
 */

const uid = process.argv[2] || 'test-user';
const wordId = `word_${Date.now()}`;

async function run() {
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, connectFirestoreEmulator, doc, setDoc } = await import('firebase/firestore');

  const app = initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-vocabulary-note',
    apiKey: 'demo-key',
    appId: '1:1234567890:web:demo',
  });

  const db = getFirestore(app);
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(db, host, Number(port));
  }

  await setDoc(doc(db, 'users', uid, 'words', wordId), {
    id: wordId,
    word: 'serendipity',
    meaning: 'the occurrence and development of events by chance in a happy or beneficial way',
    examples: ['A fortunate stroke of serendipity.'],
    ipa: '/ˌser.ənˈdɪp.ə.ti/',
    audioUrl: '',
    youglishLink: 'https://youglish.com/pronounce/serendipity/english',
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: null,
    lastReview: null,
    source: 'extension',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  console.log(`Wrote users/${uid}/words/${wordId}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
