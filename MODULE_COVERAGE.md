# CEP Automation — Module Coverage Map

Coverage of the Class Edge Platform app by the Cypress suite in this repo.

**Status of numbers:** per-module figures are from the most recent *completed*
run of each spec against the Goyal Brothers QA account (PIN `17826`). A full
9-module run is in progress at the time of writing; these will be refreshed
from it.

Automated test totals below count `it()` blocks. "Pending" means a deliberate
`it.skip()` with a documented reason — not a failure. Reasons are recorded
inline in each spec and summarised in [claude/APP_QUIRKS.md](claude/APP_QUIRKS.md).

## Coverage by module

| # | Module / Section | Key Features / Coverage | Automated | Pending / Not Automated |
|---|---|---|---|---|
| 1 | **Authentication / Sign-In** | Password login, PIN login, Change Password, Change/Set PIN, MFA (Register & Verify), Session Timeout | **37 passing** of 42 (`login.cy.js`) — Password login, PIN login, validation, error states, sign-out | 5 pending (Session Timeout, needs 15–30 min real elapsed time). **Change Password, Change/Set PIN, MFA: no tests at all** |
| 2 | **Grade / Subject / Division** | Grade, Level, Division, Subject selection buttons (shared) | **29 passing** of 29 (`navigation.cy.js`) — full coverage, zero skips | — |
| 3 | **Playlist** | Class selection, Chapter & Topic navigation, Resource/Asset/Quiz cards, Filters, E-book, Drawer | **39 passing** of 54 (`playlist.cy.js`) — Show/Hide/Pin, chapter/topic nav, class switching, filters, resource list, remove | 13 pending (E-book markers, CDK drag reorder, dead Whiteboard-save feature, destructive removal), 2 under fix |
| 4 | **Add Resource** | Resource trigger, Action cards, Whiteboard actions | **70 passing** of 84 (`add-resource.cy.js` + `create.cy.js`) — FAB, all six action cards, Create form, file-type & size validation, edit mode | 11 pending (dead Chapter/Topic field, DropIt second device, forced server failures) |
| 5 | **Toolbar** | Tool rail, Pen, Shapes, Background, Eraser, Zoom, Widget, Magnet, Context menus, Profile | **None** | Entire module not automated |
| 6 | **Compass** | AnalyseIt, ExploreIt widgets, Revision Tests, Assignment details, Assignment list, Questions | **None** | Entire module not automated |
| 7 | **Players** | All Players Launch, Checkpoints (List, Details, Offline flow, Excel export), E-book, Quiz, Student Tests | **19 passing** of 46 (`player.cy.js`) — PDF/Worksheet, Video/TCE, Quiz launch, Code Editor, Unsupported File | 27 pending. Image/Weblink/Notes/E-book/Checkpoints players have **no resource of that type in the curriculum**; Checkpoints additionally needs enrolled students |
| 8 | **Whiteboard** | Header, Drawing surface, Structural anchors (Not Immediate) | **Minimal** — reached only via Add Resource's Whiteboard actions (TC-AR-042) and Gallery canvas insertion | Header, drawing surface and structural anchors not automated. Pen/eraser assertions need canvas pixel inspection |
| 9 | **AI Assist** | Minimize/Maximize, Add to Playlist, Exercises, Videos | **23 passing** of 23 (`ai-assist.cy.js`) — full coverage, zero skips | — |
| 10 | **AI Notices** | Title, Editor, Rephrase, Translate, Grammar, Share with Classes, Send | **None** | Entire module not automated |
| 11 | **Attendance** | Close Attendance dialog, Attendance panel container | **None** | Entire module not automated |
| 12 | **Drop It** | Retry, Close, File Upload | **Minimal** — pairing interface + QR code opens (TC-AR-031), close verified via TC-AR-048 | File Upload needs a **second physical device**; Retry not automated |
| 13 | **Gallery** | Image cards, Search, Subject & Filter dropdowns, Close | **20 passing** of 21 (`gallery.cy.js`) — image cards, canvas insertion, search, filters, close, persistence | 1 under fix (endpoint assertion) |
| 14 | **Learning Shorts** | Record Start/Stop, Title, Attachments, Share with Classes, Save, Send | **None** | Entire module not automated |
| 15 | **Minimap** | Canvas, Player toggle, Reset, Close | **None** | Entire module not automated |
| 16 | **TCE Search Library** | Search interface with 7 Preview dialogs (Open in Whiteboard, Add to Playlist, Close) | **19 passing** of 33 (`library.cy.js`) — search, PDF preview, Open in Whiteboard, Add to Playlist, close | 13 pending — only the PDF preview type is covered; the other 6 preview types have **no confirmed search term** |
| 17 | **User Profile** | Account/Profile tabs, Resource filters, Subjects, Change Password, Change PIN | **Minimal** — profile menu opened for sign-out only | Account/Profile tabs, resource filters, subjects, Change Password, Change PIN not automated |
| 18 | **AI Homework** | Worksheet type picker, Topic selection, Counters, Question Builder swipe controls, Assignment form | **None** | Entire module not automated |

## Summary

| Coverage level | Modules | Which |
|---|---:|---|
| **Well covered** | 6 | Authentication, Grade/Subject/Division, Playlist, Add Resource, AI Assist, Gallery |
| **Partially covered** | 4 | Players, TCE Search Library, Whiteboard, Drop It |
| **Minimal** | 1 | User Profile |
| **Not automated at all** | 7 | Toolbar, Compass, AI Notices, Attendance, Learning Shorts, Minimap, AI Homework |

**Roughly 8 of 18 modules carry meaningful automation.** The suite's 332 tests
concentrate on the teacher's core content workflow — sign in, pick a class,
find a resource, add it, open it. Whole feature areas around that workflow
(Toolbar, Compass, Attendance, Learning Shorts, Minimap, AI Notices, AI
Homework) have no tests.

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

1. **7 modules with zero automation** — Toolbar and Compass are the largest by
   surface area.
2. **Player types** — only 5 of 10 player types are testable; the rest have no
   content in the curriculum.
3. **Library preview types** — 1 of 7 covered.
4. **Account management** — Change Password, Change/Set PIN and MFA are
   security-relevant and completely untested.
