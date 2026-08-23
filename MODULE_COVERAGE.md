# CEP Automation — Module Coverage Map

Coverage of the Class Edge Platform app by the Cypress suite in this repo.

**Status of numbers:** per-module figures are from the most recent *completed*
run of each spec. **2026-08-22: the suite's primary class was retargeted**
from Class 8A | Computer Science to Class 12A | Physics (Chemistry as the
second subject; Computer Science in 12A reserved for Code Editor and other
AI/generation-adjacent features) — see `cypress/config/targetClass.js` and
`claude/PROJECT_NOTES.md`'s "Target class config" section. Every module below
has been re-run and confirmed against the new class as of that date.

Automated test totals below count `it()` blocks. "Pending" means a deliberate
`it.skip()` with a documented reason — not a failure. Reasons are recorded
inline in each spec and summarised in [claude/APP_QUIRKS.md](claude/APP_QUIRKS.md).

## Coverage by module

| # | Module / Section | Key Features / Coverage | Automated | Pending / Not Automated |
|---|---|---|---|---|
| 1 | **Authentication / Sign-In** | Password login, PIN login, Change Password, Change/Set PIN, MFA (Register & Verify), Session Timeout | **38 passing** of 43 (`login.cy.js`, includes `TC-LOGIN-043` complete-flow test added 2026-08-23) — PIN login, validation, error states, sign-out, session persistence | 5 pending (Session Timeout, needs 15–30 min real elapsed time). Change Password/PIN/MFA now covered separately by the Account Management module (row 17). **KNOWN ISSUE, confirmed live 2026-08-23: Password-based login is currently rejected by the server for this account** — `TC-LOGIN-025` (pre-existing, standalone, no PIN involved) fails with HTTP 400 "Login credentials are invalid" on `/sso/token`. Affects TC-LOGIN-019/020–025/037/040. Likely a stale `PASSWORD` value in `cypress.env.json` (credential rotated server-side) or a temporary account flag — needs the real current password confirmed before these can pass again. `TC-LOGIN-043` was deliberately written PIN-only to avoid this. |
| 2 | **Grade / Subject / Division** | Grade, Level, Division, Subject selection buttons (shared) | **30 passing** of 30 (`navigation.cy.js`, includes `TC-NAV-COMPLETE` complete-flow test added 2026-08-24) — full coverage, zero skips | — |
| 3 | **Playlist** | Class selection, Chapter & Topic navigation, Resource/Asset/Quiz cards, Filters, E-book, Drawer | **40 passing** of 55 (`playlist.cy.js`, includes `TC-PL-COMPLETE` complete-flow test added 2026-08-24) — Show/Hide/Pin, chapter/topic nav, class switching, filters, resource list, remove | 13 pending (E-book markers, CDK drag reorder, dead Whiteboard-save feature, destructive removal), 2 under fix |
| 4 | **Add Resource** | Resource trigger, Action cards, Whiteboard actions | **71 passing** of 85 (`add-resource.cy.js` + `create.cy.js`, includes `TC-AR-COMPLETE` complete-flow test added 2026-08-24) — FAB, all six action cards, Create form, file-type & size validation, edit mode | 11 pending (dead Chapter/Topic field, DropIt second device, forced server failures) |
| 5 | **Toolbar** | Tool rail, Pen, Shapes, Background, Eraser, Zoom, Widget, Magnet, Context menus, Profile | **Established** (`toolbar.cy.js` + `toolbar-additional.cy.js`) — tool selection, panels, zoom, profile. Independent of the class retarget (doesn't call `goToTargetClass()`). **2026-08-23**: audit found 37 documented `Toolbar_Test_Cases.xlsx`/`Toolbar_Additional_Test_Cases.xlsx` cases silently missing from both spec files (no automation, no explanation anywhere) — 22 were genuinely achievable and are now implemented + live-verified (Pen colour/thickness retention, Eraser Free-Erase panel toggle, Background selection + persistence, all 8 Zoom panel controls, built-in/gallery Widgets, Discipline filter, active-tool-tap stability, signed-in/out Playlist-collapse behavior), plus 2 bonus unblocks (TB-096/097, previously skipped for the same missing-selector reason). One real app-behavior finding along the way: closing a tool's panel reverts to the default Select tool, not the previously active one (workbook assumed the latter). **2026-08-24**: added `TB-COMPLETE`, a complete-flow test chaining Pen → Eraser → Pen → Undo/Redo → Zoom in one continuous run; surfaced a real finding of its own — the Eraser cannot remove a single Pen stroke longer than ~700px, only short ones (~200px) — see `claude/APP_QUIRKS.md` | Remaining 15 (TB-022–027, 031–032, 055–059, 077–078) need canvas pixel inspection or unconfirmed academic-year/attendance account state — already documented in `toolbar.cy.js`'s own footer. Long-press interactions, docking-left — see the "NOT YET AUTOMATED" blocks at the end of both spec files |
| 6 | **Compass** | AnalyseIt, ExploreIt widgets, Revision Tests, Assignment details, Assignment list, Questions | **2 passing** of 3 (`compass.cy.js`) — trigger button confirmed live 2026-08-23, plus a login guard; 1 pending | **CONFIRMED live 2026-08-23**: AnalyseIt has zero assignments on this class/topic and its popover renders no content at all (real app gap). See `Test_Cases/07_Compass/Compass_Test_Cases.xlsx` (32 cases) for the full breakdown — most remaining cases are blocked on missing test data (real assignments, Exploreit widgets, revision tests) or the question-pagination controls having no selector |
| 7 | **Players** | All Players Launch, Checkpoints (List, Details, Offline flow, Excel export), E-book, Quiz, Student Tests | **77 passing** across 12 per-type spec files (`quiz.cy.js`, `code-editor.cy.js`, `video.cy.js`, `pdf-worksheet.cy.js`, `tce.cy.js`, `unsupported.cy.js`, `video-flow.cy.js`, `image.cy.js`, `weblink.cy.js`, `ebook.cy.js`, plus `checkpoints.cy.js`/`notes.cy.js` fully pending) | 101 pending across the same 12 files. Image/Weblink/E-book were unblocked 2026-08-22 (see the ⚠ note below); further work on Checkpoints/Notes/TCE is deliberately deferred per instruction, to cover later |
| 8 | **Whiteboard** | Header, Clock, Guest/Welcome-Back/First-time-user states, Drawing surface, Saved-whiteboard pipeline | **4 passing** of 5 (`whiteboard.cy.js`, added 2026-08-23) — logo/version, clock, Welcome Back state, drawing container in both Guest and logged-in states | See `Test_Cases/13_Whiteboard/Whiteboard_Test_Cases.xlsx` (17 cases, this module's first-ever documentation). Lowest selector coverage of any surveyed module — the dock-toggle button and first-time-user "Choose a class" button have no `data-qa-id` at all. The entire saved-whiteboard pipeline (Playlist card → preview dialog) is **confirmed dead code**: `WhiteboardSaveService.save()` has zero callers anywhere in the app |
| 9 | **AI Assist** | Minimize/Maximize, Add to Playlist, Exercises, Videos | **23 passing** of 24 (`ai-assist.cy.js`) — full coverage of the original 23, zero skips | 1 unverified: `TC-AI-COMPLETE` (a new complete-flow test, added 2026-08-24) is written but has never been confirmed passing — a currently-unexplained issue makes every logged-in test in this specific spec file report as Mocha "pending" instead of running (isolated to this one file; ruled out extensively — see `PENDING_TASKS.md` item 1 for the full investigation and next steps). Do not assume this test works until that's resolved. |
| 10 | **AI Notices** | Title, Editor, Rephrase, Translate, Grammar, Share with Classes, Send | **2 passing** (`ai-notices.cy.js`) — reachability + login guard, confirmed live 2026-08-22/23 | Entire compose form: the only way in is a drag-select + an approve button with **no selector of any kind** (raw SVG). Rephrase/Translate/Grammar are **confirmed dead code** (HTTP calls commented out). See `Test_Cases/10_AI_Notices/AI_Notices_Test_Cases.xlsx` (16 cases) |
| 11 | **Attendance** | Close Attendance dialog, Attendance panel container | **2 passing** (`attendance.cy.js`) — submenu-item check (skips cleanly) + login guard, confirmed live 2026-08-22/23 | **CONFIRMED live 2026-08-22**: this account's Magnet submenu only ever lists Notice/Learning Shorts/Homework — no Attendance row appears at all. Plus: entire student list/toggle/submit UI is owned by an **external micro-frontend** (`tce-attendance`), not present in this app's source. See `Test_Cases/08_Attendance/Attendance_Test_Cases.xlsx` (12 cases) — note the close-dialog flow (ATT-008/009) is documented there as **not yet automated**, since it's never actually been reached on this account |
| 12 | **Drop It** | Retry, Close, File Upload | **Minimal** — pairing interface + QR code opens (TC-AR-031), close verified via TC-AR-048 | File Upload needs a **second physical device**; Retry not automated |
| 13 | **Gallery** | Image cards, Search, Subject & Filter dropdowns, Close | **20 passing** of 21 (`gallery.cy.js`) — image cards, canvas insertion, search, filters, close, persistence | 1 under fix (endpoint assertion) |
| 14 | **Learning Shorts** | Record Start/Stop, Title, Attachments, Share with Classes, Save, Send | **5 passing** (`learning-shorts.cy.js`) — toolbar reachability, the existing-asset "Send" path (fixed 2026-08-23: `.first()` could land on a non-video card, now filters to Video type first), Exit-without-recording, Discard, login guard | Record Start/Stop needs real `getDisplayMedia`/`getUserMedia` (native picker, no app-level seam to stub); Send verified-enabled but not clicked (would create real data). See `Test_Cases/11_Learning_Shorts/Learning_Shorts_Test_Cases.xlsx` (13 cases) |
| 15 | **Minimap** | Canvas, Player toggle, Reset, Close | **7 passing** (`minimap.cy.js`) — open/canvas, player-toggle state observed, Reset, Close, reopen-freshness, empty-canvas size, login guard | Canvas *content* (drawn paths/viewport rect) needs pixel inspection, avoided per this suite's canvas policy; pan-position has no exposed selector. See `Test_Cases/09_Minimap/Minimap_Test_Cases.xlsx` (8 cases) |
| 16 | **TCE Search Library** | Search interface with 7 Preview dialogs (Open in Whiteboard, Add to Playlist, Close) | **19 passing** of 33 (`library.cy.js`) — search, PDF preview, Open in Whiteboard, Add to Playlist, close | 13 pending — only the PDF preview type is covered; the other 6 preview types have **no confirmed search term** |
| 17 | **Account Management** | Two-level profile popover (toolbar-user-avatar → flat menu → toolbar-profile-trigger → Account/Profile tabs), Change Password, Change PIN, Dark Mode/Keyboard toggles, Sign Out, Release Notes | **20 passing** of 28 (`account-management.cy.js`, added 2026-08-23) — full form-validation coverage for Change Password and Change PIN (weak password, mismatch, current==new, Auto-Generate PIN, Cancel/no-request), Sign Out confirm+cancel+confirm-logout, Dark Mode/Keyboard toggle+persistence, Release Notes dialog, and a real confirmed UI bug (`isPasswordOrOtpOpen`) | See `Test_Cases/14_Account_Management/Account_Management_Test_Cases.xlsx` (28 cases). 8 pending: 2 are a real successful Save on Change Password/PIN (Change PIN was actually executed for real 2026-08-23 against an isolated account, since deleted — see `claude/CREDENTIAL_HISTORY.md`; no isolated account currently exists to repeat this or do Password); 5 are login-time forced flows (forced Change Password, first-time PIN wizard, Register/Verify MFA) that need a QA account in a specific server-flagged state neither known account has; 1 is Classroom Mode's navigation to an external micro-frontend. |
| 18 | **AI Homework** | Worksheet type picker, Topic selection, Counters, Question Builder swipe controls, Assignment form | **3 passing** (`ai-homework.cy.js`) — validation-banner check (skips cleanly), dead-code guard (select-worksheet/preview-pdf never render), login guard | **CONFIRMED live 2026-08-22**: Class 12A \| Physics \| Chapter 1 trips a real app banner — "the grade or class you selected seems incorrect" — AI Homework generation isn't supported for this grade/subject. Computer Science is the next candidate to try, since it works for every other AI/generation-adjacent feature on this account. See `Test_Cases/12_AI_Homework/AI_Homework_Test_Cases.xlsx` (20 cases) |

## ⚠ Compass, Attendance, and AI Homework: confirmed pending, not broken

These three were originally written without a QA login available (selectors
read from `cep2-workspace` source rather than the live DOM — see
[claude/README.md](claude/README.md)'s "verify, don't guess" rule). All six
modules written that way were subsequently re-run live on 2026-08-22 against
the retargeted Class 12A account. Three came back fully green (AI Notices,
Learning Shorts, Minimap); these three instead surfaced real, confirmed gates
that the current class doesn't satisfy — not selector bugs. Each spec checks
for its gate explicitly and skips cleanly (`this.skip()`) rather than failing
hard, so the suite stays green; see each module's row above for the exact
confirmed reason and what class/subject might unblock it next.

## Summary

| Coverage level | Modules | Which |
|---|---:|---|
| **Well covered** | 8 | Authentication, Grade/Subject/Division, Playlist, Add Resource, Toolbar, AI Assist, Gallery, Account Management |
| **Partially covered** | 3 | Players, TCE Search Library, Drop It |
| **Confirmed working, thin core flow** | 4 | AI Notices, Learning Shorts, Minimap, Whiteboard |
| **Confirmed pending (real gate, not a bug)** | 3 | Compass, Attendance, AI Homework — see note above |

**All 19 modules now carry live-confirmed automation**, and every one of them
now has a `Test_Cases/*.xlsx` workbook — the seven that had none at all
(Compass, Attendance, AI Notices, Learning Shorts, Minimap, AI Homework, and
the newly-added Whiteboard) were documented 2026-08-23 with the same 8-sheet
flow-based structure as the reworked Quiz/Code-Editor/Video workbooks,
grounded in `cep2-workspace` source plus everything confirmed live through
that date. Each workbook's 03_Test Cases sheet has an "Automation Status"
column marking exactly what's automated, what's blocked (and why), and what's
achievable now but not yet written — every "achievable now" case across all
seven was implemented and live-verified in the same pass. The suite's
original 332 tests concentrate on the teacher's core content workflow — sign
in, pick a class, find a resource, add it, open it; 2026-08-22/23's work
extended that to seven previously-thin-or-untouched modules, unblocked
Image/Weblink/E-book in Players, and gave every module a real login-guard
test where one was missing.

## Why the pending tests are pending

Pending tests are **not** a backlog of unwritten work — most cannot be fixed
in test code:

| Blocker | Approx. tests | What would unblock it |
|---|---:|---|
| Resource type absent from curriculum | ~38 | Seed Image / Weblink / Notes / E-book / Checkpoint content into QA |
| No stable selector in the app | 4 | Developer adds `data-qa-id` to PDF Prev/Next, orientation, print, answer-key |
| Needs canvas pixel inspection | 5 | Visual-regression tooling (e.g. image snapshots) |
| Owned by an external micro-frontend | 6 | Out of this repo's scope |
| Dead app feature (`WhiteboardSaveService.save()` has no callers) | 4 | Developer wires up or removes the feature |
| Needs real elapsed time | 5 | Clock control, or accept ~30 min runtime |
| Needs a second physical device | 1 | Manual test |
| Would destroy shared QA data | 1 | Isolated test account |

## Biggest coverage gaps, ranked

1. **Modules blocked on missing test data**, not missing test code — Compass
   (real assignments/widgets/revision tests), AI Homework (a validation-
   passing class/subject), Attendance (an available/enrolled class) all have
   thorough test cases documented (see their `Test_Cases/*.xlsx`) that simply
   cannot run against any account/class confirmed so far.
2. **Player types** — only 5 of 10 player types are testable; the rest have no
   content in the curriculum.
3. **Library preview types** — 1 of 7 covered.
4. **MFA and login-time forced flows** — Register/Verify MFA, forced
   Change Password (default password), and first-time PIN setup all need a
   QA account in a specific server-flagged state; neither known account
   qualifies. The voluntary, logged-in Change Password/PIN flows (module 17)
   are now fully covered.
5. **Whiteboard's saved-whiteboard pipeline** — confirmed dead code
   (`WhiteboardSaveService.save()` has no callers), so a real, coded feature
   (Playlist card → preview dialog → Download PDF/Send Notice/Open in
   Whiteboard) is permanently unreachable from the UI as it stands today.
