# Component Architecture

This document describes the React component hierarchy and relationships within the vocabulary extension.

## Component Tree

```
Popup
├── PopupApp
│   ├── Header
│   ├── VocabularyTab
│   │   ├── SearchInput
│   │   ├── VocabularyList
│   │   │   └── WordCard (repeating)
│   │   │       └── EditReviewModal (on edit)
│   │   └── EmptyState (when no words)
│   └── EditReviewModal (on edit)

Options Page
├── OptionsApp
│   ├── Navigation
│   ├── Header
│   ├── AddWordSection
│   ├── VocabularySection
│   │   └── Word entries (edit/delete)
│   ├── ReviewSection
│   ├── SettingsSection
│   └── AlertModal (on alert)
```

## Popup Components
### PopupApp (`src/popup/PopupApp.jsx`)
- Renders the vocabulary overview in the popup
- Opens the full options page for review and manual management
- Handles search, delete, and edit actions for saved words

**Responsibilities**:
- `allVocabulary`: Array of vocabulary items
- `filteredVocabulary`: Array after search filtering
- `searchTerm`: Current popup search value
- `currentReviewWords`: Due-word count used for the header

**State**:
- `activeTab`: Current tab (string)
- `vocabulary`: Array of vocabulary items
- Form to enter word, meaning, examples
- Fetch word data from Dictionary API
- Save to local storage
- Show success/error messages

**State**:
- `word`: Input word (string)
- `meaning`: Input meaning (string)
- `examples`: Input examples (array)
- `loading`: Fetching data state
- `error`: Error message

**Key Methods**:
- `handleFetchWord()`: Calls Dictionary API for word data
- `handleAddWord()`: Saves word to storage via StorageService
- `handleReset()`: Clears form

---

### VocabularyTab (`src/popup/components/VocabularyTab.jsx`)

**Purpose**: Browse and search vocabulary

**Responsibilities**:
- Display list of words with search
- Filter words by search term
- Handle word card interactions
- Show empty state if no words

**State**:
- `searchTerm`: Search filter (string)
- `editingId`: Currently edited word ID

**Props**:
- `vocabulary`: Array of vocabulary items
- `onVocabularyChange`: Callback when vocabulary updates

**Child Components**:
- `SearchInput`: Search filter input
- `VocabularyList`: Renders word list
- `EmptyState`: "No words yet" message

---

### SearchInput (`src/popup/components/SearchInput.jsx`)

**Purpose**: Search filter for vocabulary

**Responsibilities**:
- Text input for filtering words
- Real-time search as user types

**Props**:
- `value`: Current search term (string)
- `onChange`: Callback on input change

---

### VocabularyList (`src/popup/components/VocabularyList.jsx`)

**Purpose**: Render filterable list of words

**Responsibilities**:
- Map vocabulary array to WordCard components
- Filter by search term
- Handle card interactions

**Props**:
- `vocabulary`: Array of vocabulary items
- `searchTerm`: Search filter (string)
- `onEdit`: Callback to edit a word
- `onDelete`: Callback to delete a word

**Child Components**:
- `WordCard` (repeating)

---

### WordCard (`src/popup/components/WordCard.jsx`)

**Purpose**: Individual word display card

**Responsibilities**:
- Show word, meaning, examples, IPA
- Play pronunciation audio
- Trigger edit/delete actions
- Show next review date

**Props**:
- `word`: Vocabulary item object
- `onEdit`: Callback to edit
- `onDelete`: Callback to delete
- `onPlayAudio`: Callback to play pronunciation

**Key Methods**:
- `handlePlayAudio()`: Play word audio via PronunciationService
- Displays SRS info (nextReview date, interval)

---

### EditReviewModal (`src/popup/components/EditReviewModal.jsx`)

**Purpose**: Edit word or record review session

**Responsibilities**:
- Modal for editing word details
- Modal for recording SRS review feedback (Hard/Good/Easy)
- Update word in storage

**Props**:
- `word`: Vocabulary item to edit
- `isOpen`: Boolean to show/hide modal
- `onClose`: Callback to close
- `onSave`: Callback to save changes
- `mode`: "edit" or "review"

**Modes**:
- **edit**: Allows editing word, meaning, examples
- **review**: Shows 3 buttons (Hard/Good/Easy) to record learning feedback

---

### SettingsSection (`src/popup/components/SettingsSection.jsx`)

**Purpose**: User settings and preferences

**Responsibilities**:
- Sign in / sign out with Firebase
- Toggle cloud sync
- Reset all data
- Export/import vocabulary

**Props**:
- None (uses hooks for settings access)

---

### SignInScreen (`src/popup/components/SignInScreen.jsx`)

**Purpose**: Firebase authentication UI

**Responsibilities**:
- Sign in button for Google OAuth
- Display user email after sign in
- Sign out button
- Show auth status

**Props**:
- `onSignIn`: Callback on successful sign in
- `onSignOut`: Callback on sign out

---

### AlertModal (`src/popup/components/AlertModal.jsx`)

**Purpose**: Toast/modal notifications

**Responsibilities**:
- Display success/error/info messages
- Auto-dismiss after timeout
- Manual close button

**Props**:
- `message`: Alert text (string)
- `type`: "success" | "error" | "info"
- `onClose`: Callback to close
- `autoCloseDuration`: Auto-close delay in ms (optional)

---

### EmptyState (`src/popup/components/EmptyState.jsx`)

**Purpose**: Placeholder when no vocabulary exists

**Responsibilities**:
- Display friendly message when vocabulary list is empty
- Suggest adding first word

**Props**:
- None (static component)

---

## Options Page Components

### OptionsApp (`src/options/OptionsApp.jsx`)

**Purpose**: Main options page container

**Responsibilities**:
- Page-level state management
- Load vocabulary on mount
- Render navigation and sections
- Handle section routing

**State**:
- `activeSection`: Current section (Add, Vocabulary, Review, Settings)
- `vocabulary`: Array of vocabulary items
- `loading`: Data loading state
- `error`: Error message

---

### Navigation (`src/options/components/Navigation.jsx`)

**Purpose**: Section switcher for options page

**Responsibilities**:
- Display buttons for each section
- Handle section switching
- Highlight active section

**Props**:
- `activeSection`: Current section (string)
- `onSectionChange`: Callback for section changes

---

### AddWordSection (`src/options/components/AddWordSection.jsx`)

**Purpose**: Add vocabulary on the full options page

**Responsibilities**:
- Form with more detailed fields
- Fetch from Dictionary API
- Bulk add functionality
- Same as popup's AddWordTab but expanded

**State**:
- Similar to AddWordTab but may support multiple additions

---

### VocabularySection (`src/options/components/VocabularySection.jsx`)

**Purpose**: Full vocabulary management page

**Responsibilities**:
- Display all vocabulary in table/list format
- Edit individual words
- Delete words
- Show SRS progress
- Bulk operations (delete multiple, reset progress)

**Features**:
- More detailed view than popup version
- Edit modal for each word
- Delete confirmation
- Filter/sort options

---

### ReviewSection (`src/options/components/ReviewSection.jsx`)

**Purpose**: Review session with more space

**Responsibilities**:
- Spaced repetition practice
- Same functionality as popup ReviewTab
- Larger UI for review cards
- Progress tracking

---

### SettingsSection (`src/options/components/SettingsSection.jsx`)

**Purpose**: Full settings management

**Responsibilities**:
- Firebase sign in/out
- Cloud sync toggle with status
- Reset all data with confirmation
- Export vocabulary as JSON
- Import vocabulary from JSON
- View privacy settings

**Features**:
- More granular controls than popup
- Export/import functionality
- Data backup options

---

## Shared Components/Utilities

### AlertContext (`src/popup/components/AlertContext.jsx` and `src/options/components/AlertContext.jsx`)

**Purpose**: Global alert management via React Context

**Responsibilities**:
- Provide alert state across component tree
- Show/hide AlertModal

**Context API**:
- `AlertContext`: Store alert state
- `useAlert()`: Hook to show alerts

**Usage**:
```jsx
const { showAlert } = useAlert();
showAlert("Word added successfully!", "success");
```

---

## Data Flow Patterns

### Adding a Word

1. User enters word details in `AddWordTab`
2. Click "Fetch" → calls Dictionary API
3. Click "Add" → calls `StorageService.addWord()`
4. `StorageService` saves to `chrome.storage.local`
5. Component updates local state
6. If Firebase enabled, `FirebaseStorageService.addWord()` also called
7. AlertModal shows success message

### Reviewing Words

1. `ReviewTab` loads vocabulary on mount
2. Filters words where `nextReview <= today`
3. Shows first word with IPA, meaning, examples, audio
4. User clicks Hard/Good/Easy
5. Calls `SRSService.update()` to calculate new interval
6. Updates word in storage via `StorageService.updateWord()`
7. Moves to next word or shows summary

### Searching Words

1. User types in `SearchInput`
2. `onChange` updates parent state
3. Parent passes `searchTerm` to `VocabularyList`
4. `VocabularyList` filters array and renders matching `WordCard`s
5. No server round-trip, instant client-side filtering

## Best Practices

### State Management
- Local component state for UI (tab, modal open/close, loading)
- Custom hooks for storage access (`useStorageService`, `useFirebaseStorage`)
- React Context for global alerts

### Performance
- Memoize expensive components (heavy lists)
- Avoid re-rendering entire vocabulary on search (filter in component)
- Use keys for lists to avoid DOM confusion

### Accessibility
- Label form inputs
- Use semantic HTML (`<button>`, `<input>`, etc.)
- Keyboard navigation support for tabs and modals
- ARIA attributes for screen readers

### Testing
- Each component should be independently testable
- Mock `StorageService` in tests
- Mock Firebase in tests
- Use React Testing Library for component tests
