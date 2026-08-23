# Project Overview and Session Log

This file exists so a future AI session (or the user, coming back cold) can
get full context fast: what this project is, and a complete record of what
was done in the 2026-08-23 session that built out full test-case coverage
and closed the automation gaps this project had. Read `claude/README.md`
first for the standing reading order (`PROJECT_NOTES.md`, `APP_QUIRKS.md`,
`SELECTORS_REFERENCE.md`, `../MODULE_COVERAGE.md`) — this file is a
narrative supplement, not a replacement for those.

---

## Part 1 — Project Overview

### What this is

Cypress E2E test automation for the **CEP (Class Edge / Tata ClassEdge)**
teacher whiteboard web app, tested against
`https://ce-qa-school.devstudi.com/teach/whiteboard`. Test cases are
authored as Excel workbooks in `Test_Cases/` (one folder per module,
numbered in the order a user meets them in the app), and automated as
Cypress specs in `cypress/e2e/` using a Page Object Model in `cypress/pages/`.
Coding style is deliberately simple: plain `cy.get()`/`cy.contains()` chains,
no advanced plugins beyond the Allure reporter, minimal abstraction.

### Two project folders — critical distinction

There are **two sibling folders on disk**, each a full independent checkout,
pointed at **different QA accounts**:

| | `D:\Projects\automation-cep-cypress` | `D:\Projects\automation-cep-cypress-run` |
|---|---|---|
| Purpose | Day-to-day dev work, quick/module-scoped runs | Dedicated full-suite runs |
| QA account | Goyal Brother / raj.shinde (PIN was not tracked here) | support.admin / school MVM, PIN in `cypress.env.json` |
| Use for destructive tests? | **Never** | Only with explicit user confirmation, and only after recording the change (see `claude/CREDENTIAL_HISTORY.md`, gitignored) |

**Every change made in the main folder must be manually `cp`-synced to the
run folder** — there is no shared source control link between them. This was
done after every edit round this session; see the sync log in Part 2.

### Tech stack

- Cypress 15.20.1, Electron headless browser
- `exceljs` (added this session) to read/write the `Test_Cases/*.xlsx`
  workbooks programmatically
- Allure for HTML test reports (`npm run test:report`)
- No CI config in-repo as of this session — runs are manual/local

### Folder structure

```
cypress/
├── e2e/                    # Specs, numbered to mirror Test_Cases/
│   ├── 01-login/                02-navigation/
│   ├── 03-add-resource/         # Add Resource, Create, AI-Assist, Gallery, Library
│   ├── 04-playlist/             05-player/          06-toolbar/
│   ├── 07-compass/ .. 13-whiteboard/   # added 2026-08-22/23, see below
│   ├── 14-account-management/   # added 2026-08-23, see below
│   └── smoke/               # ~1 min sanity check covering every module
├── pages/                   # Page Object Model -- one file per screen/feature
├── config/targetClass.js    # single source of truth for which Grade/Subject/
│                             # Chapter/Topic the suite targets -- edit only this
│                             # file when the QA account's assignment changes
├── support/commands.js      # cy.loginWithValidPin(), cy.visitApp(), etc.
└── fixtures/                 # Sample upload files
```

`Test_Cases/` mirrors the same numbering (`01_Login/` .. `14_Account_Management/`,
plus `_archive/` for superseded workbook revisions — never delete a
revision, move it to `_archive/` instead, since no two are byte-identical).

### Core rule: verify, don't guess

Every selector and every claimed app behavior in this codebase was either
(a) confirmed against the live app (DOM dumps, screenshots, network
inspection), or (b) read directly out of the app's own Angular source in the
sibling **read-only** repo `D:\Projects\cep2-workspace` (never modify that
repo) when no live session was available, clearly labeled
"source-confirmed"/"DOM-unconfirmed" until live-verified. Never invent a
plausible-looking selector. This has caught real app bugs (see
`claude/APP_QUIRKS.md`) that guessing would have missed or misattributed.

### Test-case workbook formats (two conventions coexist)

- **Classic** (used by Login, Navigation, Add Resource, Playlist, Player):
  2 sheets — `"[Module] Test Cases"` + `"Execution"`. Columns: `Test Case
  ID, Test Case Title, Module, Test Scenario, Priority, Test Type,
  Preconditions, Test Data, Test Steps, Expected Result, Postconditions`
  (+ execution-tracking columns on the Execution sheet).
- **Reworked / flow-based** (used by Quiz/Code-Editor/Video originally, and
  every module added 2026-08-22 onward — Compass through Account
  Management): 8 sheets — `01_Flow, 02_Flow Branch, 03_Test Cases,
  04_Automation Steps, 05_Data-State Coverage (or Content Coverage),
  06_Automation Mapping, 07_Test Data, 08_Summary`. The `03_Test Cases`
  sheet's `Automation Status` column is the single source of truth for what's
  automated vs. blocked (and why) vs. not-yet-written.

### Key scripts added this session (`scripts/`)

- `write-xlsx.js` — generic writer, takes `{sheets:[{name,columns,rows}]}`
  JSON and produces a properly-formatted 8-sheet-convention workbook.
- `dump-xlsx.js` — prints the first 15 rows of every sheet in a workbook,
  for quick format discovery.
- `repair-xlsx.js` — repairs `.xlsx` files with malformed internal zip
  relationship paths (a real corruption class found this session) by
  parsing raw sheet XML directly and rewriting via `exceljs`.
- `cross-check-ids.js` / `cross-check-master.js` — diff a workbook's test
  case IDs against the IDs actually referenced in its spec file, to find
  undocumented automation gaps or stale/phantom workbook rows.

### Credential safety convention (new this session)

`claude/CREDENTIAL_HISTORY.md` (gitignored, both folders) tracks any REAL
Change Password/PIN save ever executed for real against the run-folder QA
account. The main folder's account is never touched by such a save. See
Part 2's Account Management section for the one execution done so far.

---

## Part 2 — Session Log (2026-08-23)

The user's driving instruction for this session: *"move to the test
coverage — I need test cases for each module so we will not miss any test
coverage; once that's done, update the automation to match; also create
test cases for Whiteboard so it's easy to automate; spend enough time on
test cases, act as the senior automation tester writing them so nothing is
missed; once done, work on the pending task."*

### Phase 1 — New test-case workbooks for 7 previously-undocumented modules

Created from scratch (grounded in `cep2-workspace` source + everything
confirmed live), using the 8-sheet reworked format:

| Module | Cases | Notes |
|---|---:|---|
| Compass | 32 | |
| Attendance | 12 | |
| AI Notices | 16 | |
| Learning Shorts | 13 | |
| Minimap | 8 | IDs renumbered after creation to match the already-shipped automation's real MM-003/004 (Reset/Close) — the draft had them swapped |
| AI Homework | 20 | |
| Whiteboard | 17 | Brand-new module, first-ever documentation. `WB-005` (Welcome Back visibility) investigated twice, converted to a documented `it.skip()` — a genuine paradox (computed style reads `hidden`, but a screenshot at that instant shows the text rendered) with no source-level explanation found |

Every "achievable now" case across all seven was implemented and
live-verified in the same pass (25 new automated test cases total). Two real
workbook inaccuracies were caught and fixed while doing this: Minimap's ID
collision (above), and Attendance's `ATT-008`/`009` being marked "Automated"
when the flow was actually never reached in a test (only wired in the page
object).

### Phase 2 — Audit of pre-existing workbooks for silent gaps

Used `cross-check-ids.js`/`cross-check-master.js` to diff every existing
workbook's IDs against its spec file.

- **No gaps found** (perfect ID parity): Login (42/42), Navigation (29/29),
  AI Assist (23/23), Library (32/32), Playlist (54/54 across 10 flow
  workbooks), Gallery (21/21 — first attempt used a wrong ID prefix in the
  script and returned a meaningless `0/0`; re-run with the correct `TC-GAL`
  prefix later in the session confirmed it clean).
- **Corrupted files repaired**: `Add_Resource_Test_Cases.xlsx` (48 cases)
  and `Create_Test_Cases.xlsx` (35 cases) were completely unreadable by
  `exceljs` — root cause was malformed zip relationship paths (absolute
  instead of relative). Repaired via `repair-xlsx.js` with zero data loss;
  confirmed their apparent "gaps" (`TC-CREATE-009` through `013`) were
  already correctly documented as "Not Applicable - By Design", not real
  gaps.
- **Real gap found and closed — Toolbar**: 37 documented cases had no
  automation and no explanation anywhere. Investigated live (Pen, Eraser,
  Background, Zoom, Widgets panels), implemented 22 of them
  (`toolbar-additional.cy.js`), plus unblocked 2 bonus cases
  (`TB-096`/`097`) that shared a selector gap with ones just fixed. Two real
  app-behavior corrections were made while doing this:
  - `TB-019`/`020` (Eraser size slider visibility): the `data-qa-id` sits on
    Angular Material's native `<input type="range">`, which `mat-slider`
    always keeps `opacity:0` by design — fixed by asserting on the `.erase-
    size` wrapper instead.
  - `TB-046`: the workbook assumed closing the Zoom panel restores the
    previously-active tool; live investigation showed it actually reverts to
    the default Select tool — rewrote the test to match confirmed reality.
  Final result: 46 passing, 0 failing, 22 pending (all with documented
  reasons already in the spec).
- **Real gap found and closed — Player module** (`Player_Master_Test_Cases.xlsx`
  rollup, checked against all 11 individual player workbooks + specs):
  - **Code Editor**: the individual workbook was already correct (18/18,
    matching spec exactly) — the *master rollup* was stale (missing a row,
    one row's content didn't match its own ID). An attempted "fix" first
    duplicated 4 rows by mistake (the bug was in the rollup, not the
    source workbook) — caught and reverted before saving.
  - **Quiz**: the master rollup had 6 phantom rows (`TC-QUIZ-023`–`028`)
    that don't exist in the real individual workbook or the spec (both are
    correctly 22/22) — removed.
  - Fixed via a new `scripts/fix-player-master.js` that rebuilds a
    prefix's rows in the master's `All Test Cases`/`Execution` sheets from
    the individual workbook (the real source of truth), plus a manual
    `Master Summary` count correction. Final state: 196 total Player test
    cases, fully consistent master ↔ individual ↔ spec.
  - `TC-UNS-002` initially flagged as a gap turned out to be a false
    positive of the cross-check script (it's covered jointly with
    `TC-UNS-001` in one `it()`, just not as a separately-matching ID
    string).

### Phase 3 — Checkpoints/Notes/TCE Player status check (the deferred "pending task")

Re-confirmed via `it`/`it.skip` counts and each spec's own header comment:

- **Checkpoints** (22 cases, 100% `it.skip`) and **Notes** (8 cases, 100%
  `it.skip`) are both genuinely and correctly blocked — no resource of
  either type exists in the curriculum, and Checkpoints additionally needs
  enrolled students the QA account doesn't have. Not a backlog item; nothing
  further to do without new QA content.
- **TCE** (19 cases: 5 real + 11 documented-blocked + 3 covered-elsewhere)
  is also complete to the extent possible.

### Phase 4 — Account Management module (built from nothing)

`MODULE_COVERAGE.md` had flagged this as a real gap ("Change Password,
Change/Set PIN and MFA are security-relevant and completely untested") —
zero test cases, zero automation, no folder even existed. Built out fully:

1. **Research** (background agent, source-only): mapped the whole area in
   `cep2-workspace` — Change Password, Change PIN, MFA (Register/Verify),
   and the User Profile popover, including both the login-time *forced*
   flows and the logged-in *voluntary* flows, with every `data-qa-id` and
   the exact backend calls each makes.
2. **Test cases**: `Test_Cases/14_Account_Management/Account_Management_Test_Cases.xlsx`,
   28 cases, 8-sheet format.
3. **Live exploration** found the research had one structural detail wrong:
   this is a **two-level popover**, not one. `toolbar-user-avatar` opens an
   outer flat menu (Dark Mode, Keyboard, Classroom Mode, Sign Out, Release
   Notes); *within* that, a "Signed in as `<name>` ›" row — which itself
   carries `data-qa-id="toolbar-profile-trigger"` — drills into a second
   view: the Account/Profile tab group, where Change Password/PIN actually
   live (under "Profile", not "Account" — a real naming trap). Both clicks
   are required in sequence to reach Change Password/PIN.
4. **Automation**: `cypress/pages/AccountManagementPage.js` +
   `cypress/e2e/14-account-management/account-management.cy.js`. Final live
   result: **20 of 28 passing, 0 failing** (started at 19 — `ACC-007` was
   initially mismarked as needing real credential data, then corrected: it's
   a pure client-side comparison of the two typed form fields, so it needed
   no real password at all). Two real bugs/fixes found along the way:
   - The Dark Mode/Keyboard toggles' `data-qa-id` is directly on the
     `<input type="checkbox">` (custom CSS, not Material) — an initial
     `.find("input")` in the page object was wrong and returned nothing.
   - The Release Notes dialog's content renders inside a **Shadow DOM** web
     component (confirmed via direct DOM inspection: 1 shadow host, 0
     iframes) — `cy.contains()` cannot see shadow-root text, so the test
     asserts on the reachable overlay chrome (a Close button) instead.
   - **Confirmed real app bug**, not a test issue: `UserProfileTabComponent
     .isPasswordOrOtpOpen` is `isPasswordFormShown && isPinFromShown` in
     source (AND, not OR) — live-confirmed that opening Change Password
     leaves the Change PIN entry link fully visible/clickable alongside it,
     so a user can have both forms open at once. Documented in
     `claude/APP_QUIRKS.md` and automated as `ACC-017`.
5. **8 cases remain not-automated, each for a specific documented reason**:
   `ACC-010`/`016` (a real successful Save — destructive, see below),
   `ACC-020` (external micro-frontend), `ACC-024`–`028` (all need a QA
   account in a specific server-flagged state — default password, no PIN
   set, MFA required/enrolled — that neither known account has).
6. **The one real destructive execution**: per explicit user instruction
   ("note down the pin or password you changed, keep history of that"), and
   after confirming scope with the user (run-folder account only, never the
   main folder's), ran a genuine Change PIN save against
   `automation-cep-cypress-run`'s QA account:
   - Old PIN `20268` → new PIN `61072` (auto-generated by the app, read back
     from the DOM rather than invented).
   - App confirmed the expected force-logout.
   - `cypress.env.json`'s `VALID_PIN` updated to match.
   - Recorded in `claude/CREDENTIAL_HISTORY.md` (gitignored).
   - **Verification in progress as of this log**: re-running
     `01-login/login.cy.js` against the new PIN to confirm the account is
     fully usable before considering this closed. (Check
     `claude/CREDENTIAL_HISTORY.md`'s latest row and re-run login if this
     note is stale.)
   - The one-off script used, `real-change-pin-onceoff.cy.js`, lives only in
     the run folder and is meant to be deleted after use — if it's still
     present, that cleanup step didn't happen yet.

### Documentation updated this session

- `MODULE_COVERAGE.md` — every module touched got its row updated; the
  "Biggest coverage gaps" and coverage-level summary sections were revised
  to drop resolved items (Account Management moved from "Minimal"/gap #4 to
  "Well covered").
- `Test_Cases/README.md` — folder listing and the 2026-08-23 additions
  explained.
- `claude/APP_QUIRKS.md` — added the `isPasswordOrOtpOpen` bug.
- `.gitignore` — added `claude/CREDENTIAL_HISTORY.md`.
- This file.

### Sync status

Everything above was synced from `automation-cep-cypress` to
`automation-cep-cypress-run` after each edit round (new/changed workbooks,
page objects, specs, `scripts/*.js`, `MODULE_COVERAGE.md`,
`Test_Cases/README.md`, `claude/APP_QUIRKS.md`, `.gitignore`) — **except**
`claude/CREDENTIAL_HISTORY.md`, which lives ONLY in the run folder (it
tracks that folder's account specifically) and the one-off
`real-change-pin-onceoff.cy.js`, which is run-folder-only by design and
never belongs in the main folder.

### What's next (open threads as of this log)

1. ~~Confirm the PIN-change verification login passed~~ — **done, see
   addendum below.**
2. Nothing else is currently pending from the user's original instruction —
   the test-case-coverage phase, the automation-update phase, and the
   original "pending task" (Checkpoints/Notes/TCE) are all closed out to the
   extent possible without new QA test data or a different-state account.
3. Any future session should re-read `MODULE_COVERAGE.md` for the current
   per-module pass/fail snapshot rather than trusting this log's numbers
   once time has passed — this file is a point-in-time narrative, not a
   live source of truth.

---

## Addendum (later same session, 2026-08-23) — run folder deleted

Everything in Part 2 above describes the state **while
`automation-cep-cypress-run` still existed** as a second git worktree. Two
things happened after that log was written, both at explicit user request:

1. **PIN verification completed.** A clean, isolated smoke-test run against
   the run-folder account confirmed the new PIN (`61072`) logs in correctly
   — login and navigation succeeded; the run's only failure was an unrelated
   AI Assist content-loading timeout well past the login step, not a
   credential problem.
2. **The run folder was deleted**, per explicit user instruction ("delete
   the run project"). It was a git worktree (`git worktree remove --force`,
   then a manual long-path-safe cleanup since Windows' `MAX_PATH` choked on
   a nested `node_modules` path) — `git worktree list` now shows only the
   main folder. Everything uncommitted that was unique to that folder is
   gone; what mattered (the credential history) was preserved by copying it
   forward — see next point.
3. **`claude/CREDENTIAL_HISTORY.md` now lives in this (main) folder**, not a
   run folder — there isn't one anymore. It was recreated here with the
   full PIN-change record preserved, plus a table of which accounts this
   suite knows about and their last-known-good credentials. **Going
   forward, whenever a real credential change happens, log it in THIS
   file, in whichever folder does the changing** — the older text elsewhere
   in this log saying it "lives only in the run folder" or "both folders"
   is now stale; there is currently only one folder.
4. The main folder's own account (Goyal Brother / raj.shinde,
   `cypress.env.json`'s `VALID_PIN` in this folder) was never touched by any
   real Change Password/PIN save, this session or otherwise — no update
   needed there.
5. If a run folder or any other worktree/checkout is ever recreated for the
   school MVM / support.admin account, seed its `cypress.env.json` with
   `VALID_PIN: "61072"` (the current real value), not the original `20268`
   documented earlier in this log — that value is now stale.

## Second addendum (2026-08-24) — "complete flow" tests per module

New user instruction, separate from everything above: add one "complete
flow" test to the end of every already-automated module's spec — chaining
that module's core features into one continuous realistic session (not
isolated pieces) — and document each in its `Test_Cases/*.xlsx` workbook.
Verify each in isolation (`it.only`, never a full-module run) before moving
to the next. Account Management is explicitly excluded (can't safely chain
a real Change Password/PIN save). **Full detail, including the proven
working pattern and the complete remaining checklist, now lives in
`PENDING_TASKS.md` (item 3) — read that file, not this section, for current
status.** Summary as of this addendum:

- **Done and verified passing**: Login (`TC-LOGIN-043`), Playlist
  (`TC-PL-COMPLETE`), Toolbar (`TB-COMPLETE`), Add Resource
  (`TC-AR-COMPLETE`), Navigation (`TC-NAV-COMPLETE`).
- **Written but unverified**: AI-Assist (`TC-AI-COMPLETE`) — blocked by a
  genuinely strange, extensively-investigated-but-unresolved issue: running
  `ai-assist.cy.js` (in full or isolated to any single test, including
  completely untouched pre-existing tests) reports every logged-in test as
  Mocha "pending" with zero error output. Confirmed NOT caused by: the new
  test's own code, `.only` itself, leftover focus markers, general
  account/login health (a different file's login test passed fine
  moments before/after), the page object, the exact filename, `beforeEach`
  login specifically, or multiple-describe-block structure — each
  independently reproduced-and-ruled-out in a minimal isolated repro. Full
  investigation log and next-steps suggestions are in `PENDING_TASKS.md`.
  **Do not assume `TC-AI-COMPLETE` works** until this is resolved and it's
  actually been seen to pass.
- **Not started**: Gallery, Library, Compass, Attendance, AI Notices,
  Learning Shorts, Minimap, AI Homework, Whiteboard (likely already
  satisfied by `WB-018`, added earlier the same session — confirm before
  writing a new one), and Player's 12 sub-specs.
- Two real app-behavior bugs were found via this work and documented in
  `claude/APP_QUIRKS.md`: the Eraser cannot remove a Pen stroke longer than
  ~700px (only short ~200px strokes erase reliably), and Playlist's
  Filter-Resources "Toggle All" doesn't cleanly reset to "all checked" when
  starting from a single-type-selected state (only from the fresh/all-
  checked state the original tests assumed).
- Separately, mid-session, the user updated `PASSWORD` in
  `cypress.env.json` in response to the Password-login finding from the
  first addendum above. **This new value has not been verified against the
  live app yet** — see `PENDING_TASKS.md` item 2.
- `PENDING_TASKS.md` (new file, project root) is now the authoritative,
  living tracker for all three of the above open threads — check it first
  in any future session before assuming this log is current.
