# Confirmed Selectors and Endpoints Reference

Everything below was confirmed via direct DOM/network exploration or a
direct developer answer with source-code references -- not guessed. Use
this before re-exploring the live app for something that might already be
here.

## Login

- Sign In modal trigger: `.sign-in-title`
- PIN digits: `[data-qa-id="login-pin-digit-input-0"]` through `-4`
- Password mode link: `[data-qa-id="login-pin-password-link"]`
- School select: `[data-qa-id="login-pwd-school-select"]`
- Username/password: `[data-qa-id="login-pwd-username-input"]` / `-password-input`
- Submit: `[data-qa-id="login-pwd-submit-button"]`
- Post-login marker: text "Welcome Back!"
- Guest state marker: text "You are currently in Guest Mode."
- Session/auth localStorage keys: `token`, `clientId` (see `commands.js` →
  `simulateSessionLoss`)
- Inactivity timeout config: `projects/main/assets/json/config.json` →
  `idealSessionTimeOut` (seconds) -- app-side config, not in this repo, no
  query-param override exists.

## Navigation / Playlist drawer (`PlaylistPage.js`)

- Current class button: `[data-qa-id="playlist-current-grade-subject-btn"]`
- Class popup tabs: `.mdc-tab__text-label` containing "Recent Classes" / "All My Classes"
- Recent class item: `[data-qa-id="playlist-recently-selected-class-btn"]`
- Grade/Division/Subject buttons: `[data-qa-id="common-select-grade-btn"]`,
  `common-select-division-btn`, `common-select-subject-btn`
- Chapter/Topic toggle: `[data-qa-id="playlist-chapter-topic-btn"]`
- Chapter list item: `[data-qa-id="playlist-select-chapter"]` (`.active` class = current)
- Topic list item: `[data-qa-id="playlist-select-topic"]`
- Topic prev/next chevrons: `[data-qa-id="playlist-nav-topic-left"]` / `-right`
- Filter/Personalize menu: `[data-qa-id="playlist-resource-nav-filter-menu"]`
- Filter type row: `[data-qa-id="playlist-filter-menu-select"]`; "Toggle All"
  row is `.select-filter-list--heading mat-list-option` (no data-qa-id)
- Edit mode: `[data-qa-id="playlist-filter-menu-edit-btn"]` →
  (optional confirm) `playlist-filter-menu-edit-confirm-btn` → Finish via
  `[data-qa-id="playlist-resource-nav-finish-edit"]`
- Reset filter: `playlist-filter-menu-reset-btn` (optional confirm `-reset-confirm-btn`)
- E-book icon (when present): `app-e-book button`
- Telemetry endpoint (topic-select activity log): `PUT **/nav/recentviews`
- Curriculum/book-tree endpoint (populates Chapter/Topic popup, also used
  to derive e-book presence and baseline/checkpoint markers):
  `GET **/curriculum/book/{bookId}`
  - Baseline chapter IDs start with `-bl`; checkpoint topic IDs start with `cktp-`
  - E-book: `hasEbook` derived by scanning for a node whose `parentNodeId`
    matches the chapter -- exact node-type/value marker NOT confirmed
- Ground-truth resource order endpoint: `GET **/serve/tp/sequence` (query
  `filterTerms=id:{id},gradeId:{gradeId},subjectId:{subjectId}`), response
  field `sequenceJson` (exact shape not fully confirmed)
- Reorder-save endpoint: `PUT **/serve/tp/sequence`
- Reorder is Angular CDK drag-drop (`@angular/cdk/drag-drop`,
  `moveItemInArray`/`CdkDragDrop`), not native HTML5 DnD (see APP_QUIRKS.md
  for why the pointer-event simulation attempt didn't work)

## Playlist cards

- Card types: `[data-qa-id="playlist-resource-card"]` (curriculum
  resources), `[data-qa-id="playlist-asset-card"]` (custom-created assets --
  also reused inside quiz cards, be careful), `[data-qa-id="playlist-quiz-card"]`
  (outer wrapper only, see APP_QUIRKS.md)
- Card overflow ("Choose Action") menu: `[data-qa-id="playlist-asset-overflow-icon-btn"]`
- Remove: `playlist-asset-remove-btn` → confirm `playlist-asset-remove-confirm-btn`
- Edit: `[data-qa-id="playlist-asset-edit-btn"]` (inside the overflow menu;
  gated by an ownership condition -- only shows for assets you created)
- Custom-asset-save endpoint: `POST`/`PUT **/serve/custom/asset`

## Add Resource FAB and panels

- FAB trigger: `[data-qa-id="add-resource-trigger"]`
- Action buttons: `[data-qa-id="add-resource-action-create"]`, `-library`,
  `-gallery`, `-dropit`, `-ai-assist`, `-whiteboard`
- Whiteboard actions: `add-resource-whiteboard-save-playlist-btn`,
  `-download-pdf-btn`

## Create form

- Title: `input[formcontrolname="title"]`
- File input: `input[type="file"]` (check `accept` attribute for allowed types)
- Share toggle: `mat-slide-toggle` containing "Share"
- Submit: `button[type="submit"]`
- Max file size error: text "Max 10MB allowed"
- Asset creation/upload endpoint (also the Library/AI-Assist attach
  endpoint): `POST **/serve/custom/asset/internal` (`/private/api/{version}/serve/custom/asset/internal`)

## Library (`LibraryPage.js`)

- Search input: `[data-qa-id="tce-library-search-input"]`, search button
  `tce-library-search-btn`
- Result card: `[data-qa-id="tce-library-resource-card"]`
- Type-prefixed footer actions (PDF confirmed, same pattern expected for
  other types): `tce-library-pdf-open-whiteboard-btn`, `tce-library-pdf-add-playlist-btn`,
  `tce-library-pdf-close-btn`
- "Database" search term reliably returns PDF-type results
- **Index collision note**: `library.cy.js` uses index 1 for TC-LIB-016,
  index 2 for TC-LIB-029; `add-resource.cy.js`'s TC-AR-026 uses index 3 to
  avoid colliding (see PROJECT_NOTES.md "shared cumulative test data")

## Gallery (`GalleryPage.js`)

- Image card: `[data-qa-id^="gallery-image-card-"]`
- Close: `[data-qa-id="gallery-close-btn"]`
- Canvas content check: `[data-qa-id="wb-drawing-container"] svg *`
- Persistence sync: POST to an endpoint whose URL contains "whiteboard"
  (`WhiteboardService.wbDataSync()`, exact path not confirmed, matched via
  regex in the test)

## AI-Assist (`AiAssistPage.js`)

- Tabs: `.mdc-tab__text-label` containing "Videos" / "Exercise"
- Video thumbnail: `[data-qa-id^="ai-assist-video-thumb-"]`
- Video close: `[data-qa-id="ai-assist-video-close-btn"]`
- Exercise checkbox: `[data-qa-id="ai-assist-exercise-checkbox-{index}"]`
- Add to Playlist: `[data-qa-id="ai-assist-add-playlist-btn"]`
- Content generation takes up to ~20s in practice -- `AiAssistPage.open()`
  waits 20000ms after opening before the panel's content is reliably ready.
  The underlying calls are a `forkJoin` of two named requests
  (`aiExerciseAndTips`, `aiYtVideos`, both POST) but their literal URLs
  weren't confirmed, hence the fixed wait instead of an intercept.

## Player wrapper (`PlayerPage.js`)

- Close icon (all variants combined): `img[alt="close-btn"], img[src*="closeIcon.png"], button.closeIcon`
- Resource file fetch (used to confirm a player opened): `GET **/fileservice/**`
- Download trigger (Unsupported player): fires an interceptable
  `GET **/fileservice/**` before the actual browser save

## Quiz Player (`QuizPlayerPage.js`)

Confirmed by direct DOM exploration (see the note in APP_QUIRKS.md correcting
the earlier "external widget, no selectors" conclusion). The renderer is
SAME-ORIGIN Angular DOM -- **zero iframes** -- so every selector below is
queryable from a test.

- Component tree: `lib-quiz-renderer` > `lib-std-quiz` (multiple choice) or
  `lib-open-ended-question`; navigation is `app-quiz-action-nav` +
  `app-nav-pagination` / `pagination-template`
- Quiz card: `[data-qa-id="playlist-quiz-card"]`, real click target is the
  inner `.resource-card` (the wrapper is a no-op -- see APP_QUIRKS.md)
- Also on the quiz card: `playlist-quiz-remove-btn`,
  `playlist-quiz-cancle-btn` (the app's own typo), `playlist-quiz-close-icon-btn`
- Question: `.qb-mcq.qb-tempalete` (the app's own typo -- do not "fix" it)
- Options: `.quiz-options-group .option-content`, each containing
  `span.option-label` ("A".."D") and `span.option-text`
- **Selecting an option**: click `label.mdc-label` inside the option. The
  native `input.mdc-checkbox__native-control` and `.option-content-wrapper`
  also work; the `.option-content` div itself and `.mat-mdc-checkbox` do NOT.
- Result markers: plain `correct` / `incorrect` classes land on
  `.option-content` after submit or reveal
- Action buttons (no data-qa-id, located by label): "Submit Answer" (disabled
  until something is selected), "Show Answer", and "Next Question" which
  REPLACES both of the others once the question is submitted or revealed
- Question numbers: `button.mypage-link`; current question is
  `li.page-item.number-item.current`
- Prev/Next chevrons: `li.page-item.previous-item` / `li.page-item.next-item`,
  disabled state is a `.pagination-disable` class, not a disabled attribute.
  **The `li` is inert -- click the `button` inside it**, same trap as the
  numbers.
- Close: `button.closeIcon.btn`; split-screen: `button.closeIcon.btn.m-r4`
- Options are Material CHECKBOXES but behave as SINGLE-ANSWER: selecting a
  second option clears the first.

## Compass, Attendance, AI Notices, Learning Shorts, Minimap, AI Homework

These were originally written without a live QA session (selectors read
straight from the app's own Angular source in the sibling `cep2-workspace`
repo -- still a real "don't guess" source, just not the usual DOM-dump one
this file otherwise documents). All six were re-run live on 2026-08-22
against Class 12A -- every selector below is now DOM-confirmed. AI Notices,
Learning Shorts and Minimap came back fully green; Compass, Attendance and
AI Homework surfaced real, confirmed gates the current class doesn't satisfy
(no Exploreit widgets, no Attendance option in the Magnet submenu, and an
app-level "grade or class seems incorrect" validation banner, respectively)
-- see MODULE_COVERAGE.md's note on those three for exact detail. See each
page object's own header comment for exact source file paths.

**Toolbar → Magnet submenu** is the shared entry point for four of these six
modules: `[data-qa-id="toolbar-tool-gtMagnet"]` opens it (only renders with
an Academic Year present), then `[data-qa-id="toolbar-magnet-{event}"]`
picks the item -- `gtAttendance`, `gtAINotices`, `gtScreenRecord` (Learning
Shorts), `gtAIWorksheet` (AI Homework). Compass and Minimap are reached
differently (see below).

- **Compass** (`CompassPage.js`): floating button
  `[data-qa-id="compass-trigger-btn"]` on the whiteboard itself (not the
  toolbar) → `compass-analyseit-item` → branches on
  `compass-no-homework-create` vs. real assignment data
  (`compass-detail-view-list-btn` / `-view-questions-btn` /
  `compass-list-assignment-{cxId}` / `compass-question-toggle-answer-btn`).
- **Attendance** (`AttendancePage.js`): Magnet → `toolbar-magnet-gtAttendance`
  → `[data-qa-id="attendance-container"]`. The actual student list/toggles
  live in a separately-built micro-frontend (`tce-attendance`) with **no
  selectors in this repo at all** -- do not guess them.
- **AI Notices** (`AiNoticesPage.js`): Magnet → `toolbar-magnet-gtAINotices`.
  The compose form (`ai-notices-title-input`, `-description-editor`,
  `-class-checkbox-{i}`, `-send-btn`) is real, but only reachable via a
  drag-select on the whiteboard + an approve button that is raw SVG with
  **zero selector** -- currently unreachable from a test. Rephrase/Translate/
  Grammar buttons exist but are confirmed dead code (their HTTP calls are
  commented out in `notice-form-dialog.component.ts`).
- **Learning Shorts** (`LearningShortsPage.js`): Magnet →
  `toolbar-magnet-gtScreenRecord` → `learning-shorts-record-start-btn` (real
  `getDisplayMedia`/`getUserMedia`, not automatable without media stubbing).
  The Title/Attachments/Share/Send half is reachable a different way instead:
  an owned Playlist asset card's `[data-qa-id="playlist-asset-overflow-icon-btn"]`
  → `playlist-asset-send-btn` opens the same form pre-filled with an existing
  video, no camera/mic involved.
- **Minimap** (`MinimapPage.js`): Toolbar Zoom tool
  (`[data-qa-id="toolbar-tool-gtZoom"]`) → `toolbar-zoom-minimap-btn` →
  `[data-qa-id="minimap-container"]` (always in the DOM; visibility is a
  `.visible` class, not presence). Canvas is `minimap-canvas`; header buttons
  are `minimap-toggle-players-btn` (conditional on a Player already being
  open), `minimap-reset-btn`, `minimap-close-btn`.
- **AI Homework** (`AiHomeworkPage.js`): Magnet →
  `toolbar-magnet-gtAIWorksheet` → `ai-homework-option-*` (type cards,
  counters, `-generate-btn`) → `ai-homework-builder-*` (question cards +
  click-based swipe-left/-right, NOT a real swipe gesture) →
  `ai-homework-option-next-btn` → `ai-homework-assign-*` (title, class
  checkboxes, due-date radios, `-send-btn`). A curriculum resolving to a
  "lower grade" swaps the whole builder for a component with **zero
  selectors anywhere** -- confirm the target class isn't one before trusting
  this flow. Two sibling components (`ai-homework-select-*`,
  `ai-homework-preview-*`) have real selectors but are confirmed dead code,
  unreferenced in the actual render tree.
