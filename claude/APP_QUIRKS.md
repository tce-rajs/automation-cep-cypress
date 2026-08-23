# App Quirks and Confirmed Bugs

Real behaviors of the CEP app confirmed via direct exploration (screenshots,
DOM dumps, network inspection) or via direct developer answers with source
references. Not assumptions. If a test is skipped or written in an unusual
way, the reason is almost always one of these.

## UI behavior quirks (by design, not bugs)

- **Chapter/Topic popup toggle**: clicking the chapter/topic pill button
  when the popup is already open (or mid-animation from just closing)
  toggles it *closed* instead of open. `PlaylistPage.openChaptersPopup()`
  handles this with a wait-then-check-then-retry-once pattern.
- **Selecting a Topic does NOT auto-close the Chapters popup** (selecting a
  *Chapter* does). This was found the hard way: `PlaylistPage.goToChapterTopic()`
  originally left the popup open after picking a topic, which hid the Add
  Resource FAB entirely (see "FAB hidden behind any open popup" below) and
  cascaded into ~35 test failures in one spec before being caught and fixed.
  The method now explicitly closes the popup (second click on the toggle
  button) after selecting a topic.
- **The Add Resource FAB is hidden whenever any popup/dialog is open**
  (`.resource-nav-wrapper` gets a `hidden` class, opacity 0). Any test flow
  that opens Add Resource right after some other popup interaction needs to
  make sure that popup actually closed first.
- **A newly created custom asset auto-opens its own preview.** Closing it
  needs a retry loop (`AddResourcePage.createThrowawayAsset()`), not a
  single fixed-delay check -- the close icon can still be rendering when a
  single check fires, especially under slow network. This is the same
  pattern as `PlayerPage.closeIfOpen()`.
- **The player "close" icon selector differs by player type**: Unsupported
  File and Code Editor use `img[alt="close-btn"]`; the TCE/Video-rendered
  player uses the same `closeIcon.png` image but with no `alt` attribute
  (`img[src*="closeIcon.png"]`); the PDF/Worksheet player uses a real
  `<button class="closeIcon">`. `PlayerPage.closeIconSelector()` returns all
  three combined.
- **Gallery's outer card wrapper vs. inner clickable area**: for Quiz cards
  specifically, `[data-qa-id="playlist-quiz-card"]` is the outer
  `<app-quiz-card>` wrapper and is a no-op if clicked -- the real click
  target is the inner `.resource-card` div.
- **"tcevideo" vs "video" are separate resource types**, not a bug. Some
  Video-labeled resources actually render via the TCE/`tceplayer-two`
  animation pipeline (`CommonService.getMappedResources()` maps `tce-html`/
  `animation` mimetypes to `TCEVIDEO`, raw `video/*` to `VIDEO`). A
  `tcevideo` resource never reaches a real `<video>` element.
- **Clicking an already-loaded UI element doesn't always fire a new network
  request.** Found via a real test failure: a session-loss test clicked an
  already-active AI-Assist tab expecting it to trigger a request that would
  then 401 -- but switching to an already-rendered tab is client-side only.
  Fixed by using `cy.reload()` instead, which always re-checks auth from
  scratch. Same applies to opening a popup whose data was already fetched
  earlier in the same session -- e.g. the Chapter/Topic popup after the
  curriculum book data was already loaded on initial dashboard load.
- **Quiz sub-type (Air Card vs. standard) is not knowable before opening
  the resource.** It isn't a resource property -- it's decided *inside* the
  quiz player after fetch, by checking whether the question set is a single
  SCQ. No UI indicator distinguishes them beforehand.
- **Quiz split-screen control lives inside an externally-loaded embedded
  widget** (the quiz-renderer/Air Card component), not in this app's own
  `quiz-player.component.html`. It emits an `onSplitScreen` event this app
  handles, but the button itself has no selector in this codebase.
  **CORRECTION (confirmed by direct DOM exploration):** "no selector in
  this codebase" is about SOURCE OWNERSHIP and was wrongly read as "not
  reachable from a test". The renderer is same-origin Angular DOM with ZERO
  iframes, so Cypress can query every part of it -- question, options,
  selection state, correct/incorrect markers and question navigation. The old
  quiz.cy.js skipped 24 of 28 cases on the stronger reading; the reworked
  spec implements them. Real selectors are in SELECTORS_REFERENCE.md under
  "Quiz Player". The AIR Card, by contrast, genuinely never appears on this
  curriculum, and camera-dependent cases remain untestable.
- **TCE embedded player tools are reachable via `window.angularReference[id]`**
  (same-origin direct object access, not `postMessage`). Tool forwarding
  calls `tceplayerCanvasFn({ action: 'PEN' | 'PAN' | 'ERASER' | 'CLEAR' | 'NONE', ... })`
  on that reference. No confirmed action exists for Play/Pause specifically.
  There's no "tool successfully selected" event -- only a load-confirmation
  observable -- so tests can confirm the call is reachable, not that the
  tool visibly activated.
- **PDF/Whiteboard pan-zoom state is reflected in the CSS `transform`**
  applied to the whiteboard drawing container (`[data-qa-id="wb-drawing-container"]`),
  not exposed on `window` or in the NgRx store.
- **PDF annotations persist in localStorage keyed by the resource's
  `assetId`**, as a JSON array of LZString-compressed (`compressToUTF16`)
  strings, each one SVG `<path>` element's attributes.
- **Library's "Add to playlist" is a single click with no confirmation
  step**, identical across all 7 result types (pdf/image/video/tce/weblink/
  code/unsupport) -- every preview player extends a shared
  `PlayerAbstractComponent` and none override `addToPlaylist()`.
- **The unsupported-file `.txt` upload preview is expected behavior, not a
  bug** -- `.txt` is a valid upload type but has no dedicated previewer, so
  opening it correctly shows the "UNSUPPORTED FILE" fallback with a
  Download button. `AddResourcePage.createThrowawayAsset()` relies on this.

## Real bugs found in the app (not test issues)

1. **Create/Add Resource's Chapter/Topic field is dead code, not
   intentionally read-only.** `chapter_topic`/`grade_subject` form controls
   are unconditionally `.disable()`d, and the template's `[floatUi]` trigger
   that would open `ChapterTopicSelectorComponent` is commented out. The
   picker component itself still works in isolation -- it's just never
   wired up to open from this form. Affects TC-AR-011/012 and
   TC-CREATE-009–013/029 (all skipped, not because the feature can't be
   tested, but because it doesn't work).
2. **Quiz player can open duplicate stacked instances.** The quiz pipeline
   runs an async question-ID fetch *before* registering the resource as
   open, unlike pdf/video/unsupported which register synchronously. Rapid
   clicks can both pass the "not already open" check before the first
   finishes registering. Affects TC-QUIZ-006 (skipped -- can't write a
   meaningful "close removes it" test around a race condition).
3. **`WhiteboardSaveService.save()` (the "local unsaved Whiteboard card"
   feature) has zero callers anywhere in the app.** A repo-wide search by
   the dev team turned up no code path that invokes it -- looks like
   orphaned/unfinished scaffinding, not a reachable UI flow. Affects
   TC-RLL-005 and TC-RMR-003/004/005 (all skipped). A documented QA
   workaround exists (seed `localStorage.wb_playlist_saves` directly) but
   the full `WhiteboardSaveCardI` shape needed to render a valid card wasn't
   confirmed, so it wasn't attempted rather than risk a broken card and a
   false result.
4. **The Notes player looks unfinished**, per the dev team's own note: it
   loads the resource's URL string directly into an iframe instead of
   fetching real note content, with no editing UI. Worth confirming it's
   actually meant to be tested before adding QA content for it.
5. **The Eraser cannot remove a very long Pen stroke.** CONFIRMED live
   2026-08-23, isolated in a minimal repro: a single continuous pen stroke
   drawn ~700px long renders fine (path count goes up by one) but an Eraser
   pass along the exact same line, same coordinates, removes nothing
   (path count unchanged). The identical mechanics with a ~200px stroke
   (matching `toolbar-additional.cy.js`'s TB-089/090 exactly) erase
   correctly every time. Root cause not traced further than "stroke length
   matters" -- possibly the app segments/simplifies very long freehand
   paths in a way that breaks whatever identifies "the stroke under the
   eraser" for removal. Workaround used in `WhiteboardPage.writeLine()`:
   build any long line out of several short (~200px) strokes instead of one
   long one. Affects WB-018.
6. **The User Profile popover's "choose which form to open" gate uses AND
   instead of OR.** `UserProfileTabComponent.isPasswordOrOtpOpen` is defined
   as `isPasswordFormShown && isPinFromShown` in source. CONFIRMED live
   2026-08-23: opening Change Password leaves the "Change PIN" entry link
   fully visible and clickable right alongside the open form (and vice
   versa) -- a user can open both forms at once, which the naming implies
   shouldn't be possible. Affects ACC-017 (automated as a documented finding,
   not a guess).

## Things that were tried and confirmed NOT to work

- **CDK drag-and-drop simulation via synthetic pointer events**
  (`pointerdown`/`pointermove`/`pointerup` with `getBoundingClientRect()`-based
  coordinates) does not reliably trigger a real Angular CDK reorder in this
  app. Confirmed via a strict test (checked the card order actually
  changed) that failed even though a weaker "state persists after save"
  version appeared to pass -- the weak version was a false positive, not a
  real confirmation. `TC-REP-004/005/006` are skipped rather than kept with
  misleading passes. A real fix would need a more precise incremental
  pointer-move sequence or a dedicated drag-simulation library, neither
  attempted here.
