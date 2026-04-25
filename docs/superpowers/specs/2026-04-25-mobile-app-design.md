# Mobile App Design: Vocabulary Note (React Native)

Date: 2026-04-25
Author: GitHub Copilot (working with user)

## Summary

Build a React Native mobile app that shares account and data with the existing Chrome extension (Firebase Auth + Firestore). The mobile app will present a Today review queue powered by the same SM-2 SRS logic, a searchable Library, Add/Edit flows with dictionary lookup and pronunciation playback, and immediate push notifications when the extension adds new words (via Cloud Functions → FCM). The app supports offline reviews through a local cache and schedules device-local notifications for due reviews.

## Goals & Success Criteria

- Single sign-on: users sign in with the same Firebase account used by the extension and see identical vocabulary.
- Real-time notifications: mobile receives near-instant push when the extension adds new words.
- SRS parity: SM-2 scheduling and SRS fields are shared and computed by the same core logic on both clients.
- Offline-first: users can review saved words offline and receive local reminders.

Success is measured by: cross-device sync (add-on → mobile), push delivery within seconds, and identical SRS outcomes for a given review sequence on either client.

## Architecture Overview

- Shared core (TypeScript package)
  - Word data model, SRS logic (SM-2), dictionary client wrappers, validation/merge utilities.
  - Imported by extension and mobile to guarantee behavioral parity.

- Backend (Firebase)
  - Auth: Firebase Auth (Google sign-in).
  - DB: Firestore canonical store: `users/{uid}/words/{wordId}`.
  - Devices: `users/{uid}/devices/{deviceId}` store FCM tokens.
  - Cloud Functions: trigger on word writes to send FCM notifications to registered device tokens.

- Mobile (React Native)
  - Stack: React Native (bare/EAS), `@react-native-firebase/auth`, `firestore`, `messaging`.
  - Local cache: MMKV or SQLite for offline reads/writes and scheduling local notifications (Notifee / react-native-push-notification).

## Data Model (Firestore)

- `users/{uid}/words/{wordId}` document fields:
  - `id`, `word`, `meaning`, `examples[]`, `ipa`, `audioUrl`, `youglishLink`, `isManual`
  - `createdAt`, `updatedAt`
  - SRS: `repetition`, `interval` (days), `easeFactor`, `nextReview` (timestamp), `lastReview` (timestamp)
  - `source` ("extension"|"mobile"|"import"), `sourceMetadata` (optional)

- `users/{uid}/devices/{deviceId}`:
  - `deviceId`, `platform`, `fcmToken`, `appVersion`, `lastSeen`

- `users/{uid}/settings`:
  - `dailyReminderTime`, `notificationPrefs`, `reviewWindow`

## Sync & Merge Rules

- Firestore is source of truth. Clients subscribe to realtime snapshots for near-instant sync.
- SRS computations run client-side using the shared core. When a review occurs, the client reads the latest doc, computes new SRS fields, and writes them back with an updated `lastReview` timestamp.
- Conflict resolution: last-writer-wins using `lastReview`. For imports/duplicates, a server-side Cloud Function can perform deterministic merging by word text.

## Notification Flows

1. Extension adds word → writes Firestore `words` doc.
2. Cloud Function triggers on create → queries `users/{uid}/devices` and sends FCM messages to each `fcmToken`.
3. Mobile receives FCM push: shows notification and optionally prefetches the new word.

Local review reminders:
- Mobile schedules local notifications based on `nextReview` to guarantee delivery when offline.

## Mobile App Screens & UX

- Today (due reviews): paged/recommended queue showing word, meaning, example, audio, and SM-2 buttons (Hard/Good/Easy). Show predicted intervals (from shared SRS service).
- Library: searchable list, filters (due/all/manual/learned), bulk actions (export/delete).
- Add / Edit Word: manual entry + auto-fetch from dictionary API (same service wrapper as extension); allow editing SRS fields if desired.
- Capture: share-target handler, clipboard detection, and manual quick-add.
- Settings & Account: sign in/out, change reminder time, device management (list devices and revoke tokens), export/import.

## Pronunciation

- Playback priority: `audioUrl` (if present) → platform TTS fallback (`react-native-tts`).
- The shared `pronunciation` service will be reused/adapted for mobile (audio fetching + caching).

## Error Handling & Edge Cases

- Network failures: app uses local cache (MMKV/SQLite) and queues writes to Firestore when online; surface sync status to users.
- Token invalidation: Cloud Functions should handle invalid FCM tokens by removing dead entries.
- Conflicting SRS writes: clients should re-read doc before writing SRS updates; include `lastReview` to detect stale writes.

## Testing Strategy

- Unit: test the shared SRS core with deterministic vectors (expected intervals, EF updates).
- Integration: use Firebase Emulator Suite to test Firestore + Functions flows and simulate push triggers.
- E2E: sign in on extension and mobile, add a word on extension, assert that Cloud Function triggered and mobile received a notification and the word is present.

## Migration and Incremental Rollout

- Phase 1 (MVP): shared core extraction, mobile app MVP with Auth, Library, Today, Add/Edit, local scheduling, and Firestore sync. Cloud Function to send FCM notifications on new words.
- Phase 2: capture refinements (share/clipboard), background sync improvements, device management UI.
- Phase 3: analytics, server-side merges, optional server-driven scheduled pushes.

## Deliverables (MVP)

1. `shared-core` TypeScript package containing models and SRS logic.
2. React Native app with Today, Library, Add/Edit, Capture, Settings.
3. Cloud Function to send FCM on new words.
4. Firestore rules and sample test cases (emulator-based).

## Next Steps

1. Spec self-review (I will run a quick check for placeholders and contradictions).
2. Commit this spec file to the repo (I created the file; tell me if you want me to commit it).
3. If you approve, I will invoke the `writing-plans` skill to generate an implementation plan.

---

File saved to `docs/superpowers/specs/2026-04-25-mobile-app-design.md`.
