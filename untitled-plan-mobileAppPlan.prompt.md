## Mobile App Implementation Plan — Vocabulary Note (MVP-focused)

Summary: implement a React Native mobile app + minimal Firebase server glue so the Chrome extension and mobile share the same account/data, mobile receives immediate push when the extension adds words, and SRS behavior is identical. Target MVP sprint: 2–3 weeks for 1–2 devs.

---

## Milestones & Acceptance Criteria

- Phase 1 — MVP (2–3 week sprint)
  - Acceptance: User signs in with same Firebase account, sees same words; Today queue shows due words and SRS buttons update schedules; mobile receives near-instant push when extension adds a word; local offline reviews and local-scheduled reminders work.
- Phase 2 — Improvements (next 2–4 weeks)
  - Acceptance: Share/clipboard capture, device management UI, robust conflict handling (server merge helper), push token pruning.
- Phase 3 — Polishing & Scalability (ongoing)
  - Acceptance: analytics/stats, optional server-driven scheduled pushes, automated import/merge tooling, polished UX and tests.

---

## Phase 1 (MVP) — Tasks, priority, and time estimates

Assumption: 1–2 devs. Estimates in hours.

1. Shared Core extraction (SRS + models + dictionary/pronunciation adapters) — 10h
   - Subtasks:
     - Create `packages/shared-core` TypeScript package (models, SRS with same API as `src/services/srs.js`) — 6h
     - Add minimal tests for SRS behavior (unit vectors) — 4h

2. Firebase infra & rules (Firestore structure + Cloud Function for FCM) — 12h
   - Subtasks:
     - Firestore rules for `users/{uid}/*` and `users/{uid}/devices/*` — 2h
     - Create Cloud Function `onWordCreate` to send FCM to `users/{uid}/devices` — 6h
     - Local Firebase Emulator config + test script — 4h

3. React Native scaffold & auth integration — 12h
   - Subtasks:
     - Choose Expo (EAS + bare if FCM native needed) or bare RN. (Recommendation: Expo + EAS with `react-native-firebase` requires bare; pick bare/EAS for FCM) — 1h
     - Scaffold RN app, install `@react-native-firebase/app`, `auth`, `firestore`, `messaging` — 6h
     - Implement Firebase Google sign-in flow (match existing extension account flows) — 5h

4. Device token registration & FCM handling — 8h
   - Subtasks:
     - Register FCM token on login and write to `users/{uid}/devices/{deviceId}` — 3h
     - Implement foreground/background handling to show notification and prefetch new word — 3h
     - Handle token refresh & cleanup hooks — 2h

5. Firestore realtime sync & basic offline cache — 12h
   - Subtasks:
     - Subscribe to `users/{uid}/words` snapshots and persist to local store (MMKV or SQLite) — 6h
     - Implement write queue for offline writes (sync when online) — 4h
     - Implement simple merge-on-write using `lastReview` metadata — 2h

6. UI: Today (review) screen — 18h
   - Subtasks:
     - Review list UI, show word, meaning, example, audio, and predicted intervals — 8h
     - Implement SRS buttons wiring (Hard/Good/Easy) → compute SRS via `shared-core` → write back to Firestore — 8h
     - Small polish + accessibility and local scheduling of nextReview as local notification — 2h

7. UI: Library + Add/Edit screens — 12h
   - Subtasks:
     - Library list + search + filter — 6h
     - Add/Edit screen with dictionary fetch (reuse extension `dictionary` wrapper) and pronunciation playback — 4h
     - Import/export placeholder UI — 2h

8. Pronunciation playback integration — 4h
   - Subtasks:
     - Play `audioUrl` or fallback to TTS (`react-native-tts`) — 3h
     - Cache audio files (optional minimal implementation) — 1h

9. Tests & QA (unit + integration) — 10h
   - Subtasks:
     - Unit tests for shared-core (SRS) — 3h
     - Integration test with Firebase Emulator for word create → function → token send flow — 5h
     - Manual E2E checklist runs — 2h

10. Chrome Extension migration changes (write to Firestore canonical path) — 6h
    - Subtasks:
      - Ensure extension writes to `users/{uid}/words/{id}` (reuse `src/services/firebaseStorage.js`) and sets `source: 'extension'` — 3h
      - Add a small script to claim pending words and verify Cloud Function trigger — 3h

11. Documentation, scripts, and dev setup — 6h
    - Subtasks:
      - README dev steps for RN + Firebase emulator + testing — 3h
      - Add run scripts to root `package.json` for functions/emulator start — 3h

Total Phase 1 estimate: ~110 hours (roughly 2 dev-weeks for 1 person; 1–2 weeks if split across two devs).

---

## File-level change map (new / modified)

High-level: add `packages/shared-core`, `mobile/` RN app, `functions/` Cloud Functions, `firebase.rules`, and supporting tests.

- packages/shared-core/
  - package.json (TS package)
  - src/index.ts — exports `Word` model, `SRS` API: `calculateNextReview(word, quality)`, `initializeWord()`
  - src/srs.test.ts — unit tests with deterministic vectors

- mobile/
  - package.json
  - App.tsx — navigation and auth wrapper
  - src/screens/TodayScreen.tsx — review UI
  - src/screens/LibraryScreen.tsx
  - src/screens/AddEditScreen.tsx
  - src/services/firebase.ts — RN firebase init (wraps existing `services/firebase.js` pattern)
  - src/services/sync.ts — Firestore snapshot subscription + local persistence
  - src/services/notifications.ts — local schedule + FCM handlers
  - src/components/WordCard.tsx

- functions/
  - package.json
  - index.ts — Cloud Function: `exports.onWordCreate = functions.firestore.document('users/{uid}/words/{wordId}').onCreate(...)`
  - utils/sendFcm.ts — helper to send FCM to tokens and prune invalid tokens

- firebase/
  - firestore.rules
  - firebase.json (emulators config)
  - README.md (how to run emulator suite)

- tests/
  - integration/emulator-setup.md
  - e2e-checklist.md

- Modifications in extension repo:
  - update `src/services/firebaseStorage.js` to ensure writes to Firestore canonical path and set `source` field
  - (optional) add helper to notify Cloud Function (not required; CF triggers on Firestore writes)

---

## Dev setup & run commands

Recommended: use a bare RN app for FCM (or Expo bare workflow). Use Firebase Emulator for integration tests.

1) Install global tools
```bash
# Node, yarn/npm already assumed
npm install -g firebase-tools
# If RN bare:
npm install -g expo-cli
```

2) Init mobile project (example with React Native CLI)
```bash
cd /path/to/repo
# create mobile folder if starting new
npx react-native init vocabulary-note-mobile --directory mobile
cd mobile
yarn add @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/messaging react-native-tts @react-native-async-storage/async-storage react-native-mmkv
```

3) Setup Cloud Functions & emulator (in repo root)
```bash
# from repo root
cd functions
npm install firebase-admin firebase-functions
# configure emulator ports in firebase.json
firebase init emulators functions firestore
# start emulator (root)
firebase emulators:start --only firestore,functions
```

4) Run RN app (Android example)
```bash
# start metro
cd mobile
npx react-native start
# open device/emulator
npx react-native run-android
```

5) Testing FCM locally
- Use a test device/emulator with Google Play Services. Send test FCM via Firebase console or via Cloud Function emulator.
- Example Cloud Function local trigger (node script):
```js
// call Cloud Function locally: simulate new doc write in Firestore emulator
// or use firebase-admin SDK to write test doc to /users/testUID/words/testWordId
```

---

## Critical code snippets (minimal, illustrative)

1) Register device FCM token (mobile)
```ts
// notifications.ts (mobile)
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

async function registerDeviceToken(uid: string, deviceId: string) {
  const token = await messaging().getToken();
  await firestore().doc(`users/${uid}/devices/${deviceId}`).set({
    deviceId,
    platform: Platform.OS,
    fcmToken: token,
    lastSeen: Date.now(),
  });
}
```

2) Cloud Function trigger (simplified)
```ts
// functions/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const onWordCreate = functions.firestore
  .document('users/{uid}/words/{wordId}')
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    const word = snap.data();
    const devicesSnap = await admin.firestore().collection(`users/${uid}/devices`).get();
    const tokens = devicesSnap.docs.map(d => d.data().fcmToken).filter(Boolean);
    if (!tokens.length) return;
    const payload = {
      notification: { title: 'New word saved', body: word.word },
      data: { wordId: snap.id }
    };
    const res = await admin.messaging().sendToDevice(tokens, payload);
    // handle invalid tokens by pruning (res.results)
  });
```

3) SRS update workflow (client-side)
```ts
// when user taps "Good"
import { calculateNextReview } from 'shared-core';
const updated = calculateNextReview(wordDoc, QUALITY_GOOD);
await firestore().doc(`users/${uid}/words/${wordId}`).update({
  repetition: updated.repetition,
  interval: updated.interval,
  easeFactor: updated.easeFactor,
  nextReview: admin.firestore.Timestamp.fromMillis(updated.nextReview),
  lastReview: admin.firestore.Timestamp.fromMillis(updated.lastReview)
});
```

---

## Testing plan

- Unit tests
  - `shared-core` SRS: run deterministic vectors asserting EF and interval updates.
  - Pronunciation: unit test fallback decision (audioUrl vs TTS).

- Integration tests (Firebase Emulator)
  - Firestore write → Cloud Function triggers → simulated FCM send (verify send called).
  - Mobile subscriber: emulator client writes then read to ensure snapshot listeners get the change.

- E2E checklist (manual)
  - Sign in on extension and mobile with same test account.
  - Add a word on extension; verify Cloud Function triggered and mobile receives push within seconds.
  - Open mobile app; word is present under Library and Today if due.
  - Complete review on mobile → verify Firestore doc SRS fields updated and extension reads updated fields.
  - Turn off network on mobile → perform local review → reconnect → verify writes sync to Firestore and lastReview resolves conflicts.

---

## Chrome extension migration steps

1. Reuse existing `src/services/firebaseStorage.js`:
   - Ensure `saveWord()` writes canonical Firestore doc at `users/${uid}/words/${wordId}` and includes SRS initial fields and `source: 'extension'`.
2. Do not require extension to send push tokens. Mobile registers device tokens to `users/${uid}/devices`. Cloud Function will read that.
3. Add test script to extension dev: when saving a word, assert Firestore write succeeded and Cloud Function emulator logged a send.
4. If extension used `chrome.storage.local` as source-of-truth, keep local queue but write to Firestore as authoritative store once user is signed in.

Example extension write (conceptual):
```js
// inside firebaseStorage.saveWord
const docRef = firestore().doc(`users/${uid}/words/${wordId}`);
await docRef.set({...wordData, source: 'extension', createdAt: Date.now()});
```

---

## Risks & Mitigations

- Risk: FCM complexity & device token management (invalid/expired tokens).
  - Mitigation: Implement token pruning on Cloud Function results; add device `lastSeen` and remove stale tokens.

- Risk: Conflicting SRS writes from multiple devices leading to inconsistent schedule.
  - Mitigation: Use `lastReview` timestamp; clients re-read latest doc before writing; optionally implement optimistic concurrency (document field `lastReview` check).

- Risk: Offline sync edge-cases (lost writes).
  - Mitigation: Local write queue with retry + visible sync status in UI.

- Risk: Expo-managed vs bare RN FCM limitations.
  - Mitigation: Choose bare/EAS for full `@react-native-firebase` support. If Expo preferred, accept using Expo Push Service (approach C from earlier).

- Risk: Time zones & local scheduling (notifications may appear at wrong local time).
  - Mitigation: Normalize timestamps to UTC; schedule local notifications with local timezone conversion.

---

## Deliverables & Handoff

- `packages/shared-core` (TS) with SRS unit tests
- `mobile/` RN app with screens and services
- `functions/` Cloud Function to forward new-word writes to FCM
- `firebase/firestore.rules` and emulator config
- Integration test scripts + README for running local end-to-end tests

---

If you approve this plan I will:
- Mark the todo entry "Invoke writing-plans skill..." done and produce a task-by-task checklist I can apply (or generate the git changes and commit scaffolding upon your confirmation).