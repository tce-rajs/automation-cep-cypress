# Pending Tasks

Running list of open work, investigations, and known issues that need
follow-up. Update this file as items are opened/closed rather than losing
them in conversation history.

## 1. Mystery: ai-assist.cy.js reports every logged-in test as "pending"

**Status: unresolved, deprioritized 2026-08-24. Needs fresh investigation.**

Discovered while adding a "complete flow" test (`TC-AI-COMPLETE`) to
`cypress/e2e/03-add-resource/ai-assist.cy.js`. Symptom: running this spec
file (in full, or isolated to a single test via `it.only`) reports every
test that logs in as **pending** — not failing, not passing, no error text
anywhere in the output — while the one test that does NOT log in
(`TC-AI-022`) passes normally. Duration is suspiciously uniform (~16-18s)
regardless of which single test is isolated.

**Ruled out** (each independently tested and confirmed NOT the cause):
- My new `TC-AI-COMPLETE` test's own code -- a completely untouched,
  pre-existing test (`TC-AI-004`) shows the identical symptom.
- `it.only` itself -- `describe.only` on the whole surrounding block showed
  the same thing (all 4 tests in it "pending").
- Leftover `.only` markers elsewhere in the file -- swept and confirmed
  clean before each retest.
- General account/login breakage -- `TC-LOGIN-010` (a different file, plain
  PIN login) passed fine in isolation moments before and after.
- `AiAssistPage.js` (the page object) -- importing it into a fresh minimal
  spec in the same folder and logging in worked fine.
- The exact filename -- copying `ai-assist.cy.js`'s full content byte-for-
  byte into a differently-named file (`zzz-diag.cy.js`) reproduced the same
  "pending" result, ruling out a filename-keyed Cypress/webpack cache.
- `beforeEach`-based login specifically -- a minimal single-describe file
  using `beforeEach(() => cy.loginWithValidPin())` passed fine.
- Multiple `describe` blocks each with their own login `beforeEach`, with
  `.only` on a test in a later block -- a minimal 3-describe reproduction of
  that exact shape passed fine.
- Cypress's Electron browser cache (`%APPDATA%\Cypress\Cache` and
  `Code Cache`) -- cleared, no change.
- `trashAssetsBeforeRuns` / the Windows file-lock warning on an old
  screenshots folder -- disabled via `--config trashAssetsBeforeRuns=false`,
  no change.

**Not yet tried / next steps for whoever picks this up:**
- Bisect `ai-assist.cy.js`'s actual content: start from the minimal
  multi-describe repro that DID pass, and incrementally paste in real chunks
  of `ai-assist.cy.js` (imports, then each describe block's real test
  bodies) until it breaks, to find the actual triggering content instead of
  structural shape.
- Try `cypress open` (headed, interactive) instead of `cypress run` --
  headless-only symptoms sometimes point at a renderer/GPU issue that the
  interactive runner's error overlay would show directly.
- Check Cypress's own debug output: `DEBUG=cypress:* npx cypress run --spec
  cypress/e2e/03-add-resource/ai-assist.cy.js` (verbose, large output --
  redirect to a file and grep for the spec's own test titles to see what
  Cypress's internal state machine actually did with them).
- Check whether this is time-of-day/session-length related -- it surfaced
  very late in a long multi-hour session with heavy cumulative login volume
  against the same QA account. Retry fresh, first thing, after a clean
  restart.

**Impact:** `TC-AI-COMPLETE` is written (in the file, not `.skip()`'d) but
has never been confirmed passing. Treat it as unverified until this is
resolved -- don't assume it works.

## 2. Password-based login rejected by the server

**Status: possibly addressed 2026-08-24 -- needs re-verification.**

See `MODULE_COVERAGE.md` row 1 (Authentication) for the full original
finding: `TC-LOGIN-025` (standalone, pre-existing) failed with HTTP 400
"Login credentials are invalid" on `/sso/token`. The user updated
`PASSWORD` in `cypress.env.json` afterward (mid-session, 2026-08-24) --
**this new value has not yet been verified against the live app.** Re-run
`TC-LOGIN-025` in isolation to confirm, then:
- If it passes: re-add the Password half back into `TC-LOGIN-043`
  (currently PIN-only by design, see its header comment) if desired, and
  update `MODULE_COVERAGE.md`'s known-issue note to reflect the fix.
- If it still fails: the new password value is also wrong/stale -- needs
  the actual current credential from whoever administers the account.

## 3. "Complete flow" test still needed for the remaining modules

**Status: in progress, paused 2026-08-24 mid-AI-Assist.**

Per user instruction: add one end-to-end "complete flow" test to the end of
every already-automated module, chaining that module's core features into
one continuous realistic session, and document each in its
`Test_Cases/*.xlsx` workbook. Verify each in isolation (`it.only`, never a
full-module run) before moving to the next.

**Done and verified passing in isolation:**
- Login (`TC-LOGIN-043`, PIN-only -- see item 2 above)
- Playlist (`TC-PL-COMPLETE`)
- Toolbar (`TB-COMPLETE`, in `toolbar-additional.cy.js`)
- Add Resource (`TC-AR-COMPLETE`)
- Navigation (`TC-NAV-COMPLETE`)

**Written but NOT YET VERIFIED** (blocked by item 1 above):
- AI-Assist (`TC-AI-COMPLETE`)

**Not started yet:**
- Gallery
- Library
- Compass
- Attendance
- AI Notices
- Learning Shorts
- Minimap
- AI Homework
- Whiteboard -- likely already satisfied by `WB-018` (write/erase/write with
  the Toolbar's Pen+Eraser), added earlier the same session; confirm this
  covers the intent before writing a separate one.
- Player -- 12 sub-specs (Checkpoints, Code Editor, Ebook, Image, Notes,
  PDF/Worksheet, Quiz, TCE, Unsupported, Video, Weblink). Given the volume,
  consider asking the user whether each sub-player needs its own flow test
  or whether one flow per player type is overkill.

**Explicitly excluded per user instruction:** Account Management (real
Change Password/PIN can't safely be chained into a flow test without
destructive credential risk -- see `claude/CREDENTIAL_HISTORY.md`).

**Working pattern that's proven reliable so far:**
1. Read the target module's existing spec + page object to find already-
   confirmed selectors -- never invent new ones.
2. Write the flow test at the end of the file, chaining 3-6 of the module's
   real sub-features in the order a real user would hit them.
3. Mark ONLY that new test `it.only`, run `npx cypress run --spec <file>`
   (kill any stray Cypress/node process first with `Stop-Process -Name
   "Cypress","node" -Force`).
4. Fix any real issues surfaced (this has found real bugs, not just test
   issues -- see the Eraser stroke-length finding in `claude/APP_QUIRKS.md`
   and the Playlist filter-toggle semantics finding).
5. Remove `.only` once green.
6. Add the case to the module's `Test_Cases/*.xlsx` workbook (use
   `scripts/add-complete-flow-case.js` for classic 2-sheet workbooks with
   the standard 11-column layout; hand-write the row for workbooks with a
   different column set, like Toolbar's Additional sheet).
